-- ==========================================
-- NUCLEAR RESET (Ensures clean state)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_spaces();

DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Me',
    avatar_emoji TEXT DEFAULT '😀',
    is_pro BOOLEAN DEFAULT FALSE,
    has_seen_family_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Spaces Table
CREATE TABLE public.spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MY_SPACE', 'FAMILY_SPACE')),
    icon TEXT DEFAULT '🏠',
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Members Table (Membership)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'MEMBER')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'LEFT', 'REMOVED')) DEFAULT 'ACTIVE',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(space_id, profile_id)
);

-- 5. Create Invites Table
CREATE TABLE public.invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INTEGER DEFAULT 5,
    used_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Locations Table (Folders)
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    color TEXT DEFAULT '#6B7280',
    description TEXT,
    parent_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('safe', 'expiring-soon', 'expired')),
    expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    image TEXT,
    quantity INTEGER DEFAULT 1,
    purchase_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_days INTEGER,
    has_expiration_date BOOLEAN DEFAULT TRUE,
    use_shelf_life BOOLEAN DEFAULT FALSE,
    shelf_life_days INTEGER,
    opened_date TIMESTAMP WITH TIME ZONE,
    notify_timing INTEGER,
    critical_days INTEGER DEFAULT 3,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Activities Table
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Notification Preferences Table
CREATE TABLE public.notification_preferences (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (profile_id, space_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;


-- 🛡️ SECURITY DEFINER FUNCTIONS (To break Recursion) 🛡️

-- Function to get spaces the user belongs to without triggering RLS loops
CREATE OR REPLACE FUNCTION public.get_my_spaces()
RETURNS TABLE(sid UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT space_id
    FROM public.members
    WHERE profile_id = auth.uid()
      AND status = 'ACTIVE';  -- Only include ACTIVE memberships
END;

-- Function to transfer ownership atomically
CREATE OR REPLACE FUNCTION public.transfer_ownership(p_space_id UUID, p_target_profile_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. Verify the caller is the current owner of the space
    IF NOT EXISTS (
        SELECT 1 FROM public.spaces 
        WHERE id = p_space_id AND created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the space owner can transfer ownership';
    END IF;

    -- 2. Update the spaces table
    UPDATE public.spaces 
    SET created_by = p_target_profile_id 
    WHERE id = p_space_id;

    -- 3. Update target member role to OWNER
    UPDATE public.members 
    SET role = 'OWNER' 
    WHERE space_id = p_space_id AND profile_id = p_target_profile_id;

    -- 4. Update current owner role to MEMBER
    UPDATE public.members 
    SET role = 'MEMBER' 
    WHERE space_id = p_space_id AND profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Function to remove members atomically
CREATE OR REPLACE FUNCTION public.remove_member(p_space_id UUID, p_target_profile_id UUID)
RETURNS void AS $$
BEGIN
    -- 1. Verify the caller is the current owner of the space
    IF NOT EXISTS (
        SELECT 1 FROM public.spaces 
        WHERE id = p_space_id AND created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only the space owner can remove members';
    END IF;

    -- 2. Prevent the owner from removing themselves
    IF p_target_profile_id = auth.uid() THEN
        RAISE EXCEPTION 'Owners cannot remove themselves. Transfer ownership first if you want to leave.';
    END IF;

    -- 3. Delete the membership record
    DELETE FROM public.members 
    WHERE space_id = p_space_id AND profile_id = p_target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- RLS POLICIES --

-- Profiles: View self + members in same spaces
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (
    id = auth.uid() OR
    id IN (SELECT profile_id FROM public.members WHERE space_id IN (SELECT sid FROM public.get_my_spaces()))
);
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Spaces: Access if in get_my_spaces() or if created_by (to allow .select() on insert)
CREATE POLICY "Spaces select" ON public.spaces FOR SELECT USING (
    id IN (SELECT sid FROM public.get_my_spaces()) OR
    created_by = auth.uid()
);
CREATE POLICY "Spaces insert" ON public.spaces FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Spaces update" ON public.spaces FOR UPDATE USING (id IN (SELECT sid FROM public.get_my_spaces()) AND EXISTS (SELECT 1 FROM public.members m WHERE m.space_id = public.spaces.id AND m.profile_id = auth.uid() AND m.role = 'OWNER'));
CREATE POLICY "Spaces delete" ON public.spaces FOR DELETE USING (id IN (SELECT sid FROM public.get_my_spaces()) AND EXISTS (SELECT 1 FROM public.members m WHERE m.space_id = public.spaces.id AND m.profile_id = auth.uid() AND m.role = 'OWNER'));

-- Members: Break recursion with get_my_spaces()
CREATE POLICY "Members select" ON public.members FOR SELECT USING (space_id IN (SELECT sid FROM public.get_my_spaces()));
CREATE POLICY "Members insert" ON public.members FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Members update" ON public.members FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Members delete" ON public.members FOR DELETE USING (profile_id = auth.uid() OR (space_id IN (SELECT sid FROM public.get_my_spaces()) AND role = 'OWNER'));

-- Invites, Products, Locations, Activities: Use get_my_spaces()
CREATE POLICY "Invites select" ON public.invites FOR SELECT USING (status = 'ACTIVE' OR space_id IN (SELECT sid FROM public.get_my_spaces()));
CREATE POLICY "Invites manage" ON public.invites FOR ALL USING (space_id IN (SELECT sid FROM public.get_my_spaces()));

CREATE POLICY "Products access" ON public.products FOR ALL USING (space_id IN (SELECT sid FROM public.get_my_spaces()));
CREATE POLICY "Locations access" ON public.locations FOR ALL USING (space_id IN (SELECT sid FROM public.get_my_spaces()));
CREATE POLICY "Activities access" ON public.activities FOR ALL USING (space_id IN (SELECT sid FROM public.get_my_spaces()));
CREATE POLICY "Notifications access" ON public.notification_preferences FOR ALL USING (profile_id = auth.uid());


-- TRIGGERS --

-- Automatic setup for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_space_id UUID;
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', 'Me'));

    -- 2. Create Private Space
    INSERT INTO public.spaces (name, type, icon, created_by)
    VALUES ('My Space', 'MY_SPACE', '🏠', new.id)
    RETURNING id INTO new_space_id;

    -- 3. Create Membership as Owner
    INSERT INTO public.members (space_id, profile_id, role, status)
    VALUES (new_space_id, new.id, 'OWNER', 'ACTIVE');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
