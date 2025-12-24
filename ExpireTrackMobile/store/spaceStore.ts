import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Space,
    Membership,
    Invite,
    Activity,
    SpaceNotificationPreference,
    SpaceType,
    MemberRole,
    ActivityType,
    generateId,
    generateInviteCode,
    getDefaultInviteExpiry,
    UserProfile
} from '../types/spaces';
import { Location } from '../types';
import { useUserStore } from './userStore';
import { supabase, withTimeout } from '../lib/supabase';

// Constants
const MY_SPACE_ID = 'MY_SPACE';
export { MY_SPACE_ID };

interface SpaceStore {
    // State
    spaces: Space[];
    memberships: Membership[];
    currentSpaceId: string | null;

    // Member profiles for each space
    spaceMembers: { [spaceId: string]: UserProfile[] };

    // Activities for each space
    spaceActivities: { [spaceId: string]: Activity[] };

    // Notification preferences for each space
    notificationPreferences: { [spaceId: string]: boolean };

    // Actions
    fetchSpaces: () => Promise<void>;
    initializeMySpace: () => void; // Legacy compatibility
    createFamilySpace: (name: string, icon?: string) => Promise<{ success: boolean; error?: string; space?: Space }>;
    deleteSpace: (spaceId: string) => Promise<void>;
    updateSpaceName: (spaceId: string, name: string) => Promise<void>;
    switchSpace: (spaceId: string) => void;

    // Membership & Invites
    joinSpaceWithCode: (code: string) => Promise<{ success: boolean; error?: string; space?: Space }>;
    leaveSpace: (spaceId: string) => Promise<void>;
    removeMember: (spaceId: string, userId: string) => Promise<void>;

    // Invites
    createInvite: (spaceId: string, maxUses?: number) => Promise<Invite | null>;
    regenerateInvite: (spaceId: string) => Promise<Invite | null>;
    revokeInvite: (inviteId: string) => Promise<void>;
    getActiveInvite: (spaceId: string) => Promise<Invite | null>;

    // Activity
    logActivity: (spaceId: string, type: ActivityType, payload: Activity['payload']) => Promise<void>;
    fetchActivities: (spaceId: string) => Promise<void>;
    getSpaceActivities: (spaceId: string) => Activity[];

    // Getters
    getCurrentSpace: () => Space | null;
    getMySpace: () => Space | null;
    getFamilySpaces: () => Space[];
    getSpaceById: (spaceId: string) => Space | null;
    getSpaceMembers: (spaceId: string) => UserProfile[];
    getMemberCount: (spaceId: string) => number;
    getUserRole: (spaceId: string) => MemberRole | null;
    isOwner: (spaceId: string) => boolean;
    hasFamilySpaces: () => boolean;

    // Notification Preferences
    isSpaceNotificationEnabled: (spaceId: string) => boolean;
    setSpaceNotificationEnabled: (spaceId: string, enabled: boolean) => Promise<void>;
}

export const useSpaceStore = create<SpaceStore>()(
    persist(
        (set, get) => ({
            spaces: [],
            memberships: [],
            currentSpaceId: null,
            spaceMembers: {},
            spaceActivities: {},
            notificationPreferences: {},

            fetchSpaces: async () => {
                const userId = useUserStore.getState().getUserId();
                console.log('🛰️ [SpaceStore] fetchSpaces starting for:', userId);
                if (!userId) return;

                try {
                    // 1. Fetch spaces via memberships
                    console.log('🛰️ [SpaceStore] Fetching memberships from "members"...');
                    const { data, error } = await supabase
                        .from('members')
                        .select(`
                            role,
                            status,
                            joined_at,
                            spaces (*)
                        `)
                        .eq('profile_id', userId)
                        .eq('status', 'ACTIVE');

                    if (error) {
                        console.error('❌ [SpaceStore] Error fetching membership data:', error);
                        return;
                    }

                    if (!data || !Array.isArray(data)) {
                        console.warn('⚠️ [SpaceStore] Membership data is not an array:', data);
                        return;
                    }

                    console.log('🛰️ [SpaceStore] Received memberships:', data.length);

                    const spacesList: Space[] = [];
                    const membershipsList: Membership[] = [];

                    data.forEach((item: any) => {
                        const s = item.spaces;
                        if (!s) return;

                        spacesList.push({
                            id: s.id,
                            name: s.name,
                            type: s.type as SpaceType,
                            icon: s.icon,
                            createdBy: s.created_by,
                            createdAt: s.created_at,
                            updatedAt: s.updated_at
                        });
                        membershipsList.push({
                            id: s.id + userId, // synthetic id
                            userId,
                            spaceId: s.id,
                            role: item.role as MemberRole,
                            joinedAt: item.joined_at,
                            status: item.status
                        });
                    });

                    console.log('🛰️ [SpaceStore] Processed spaces:', spacesList.length);
                    set({ spaces: spacesList, memberships: membershipsList });

                    // Set initial space if none or not in list
                    const currentId = get().currentSpaceId;
                    const mySpace = spacesList.find(s => s.type === 'MY_SPACE');
                    if (!currentId || !spacesList.some(s => s.id === currentId)) {
                        if (mySpace) {
                            console.log('🛰️ [SpaceStore] Auto-switching to My Space:', mySpace.id);
                            set({ currentSpaceId: mySpace.id });
                        }
                    }

                    // Fetch members for each space
                    console.log('🛰️ [SpaceStore] Fetching member profiles for each space...');
                    for (let i = 0; i < spacesList.length; i++) {
                        const space = spacesList[i];
                        console.log(`🛰️ [SpaceStore] Fetching members for space: ${space.name} (${space.id})`);
                        const { data: memberData, error: memberError } = await supabase
                            .from('members')
                            .select(`
                                profiles (id, display_name, avatar_emoji, created_at)
                            `)
                            .eq('space_id', space.id)
                            .eq('status', 'ACTIVE');

                        if (memberError) {
                            console.warn(`⚠️ [SpaceStore] Profile fetch error for space ${space.id}:`, memberError);
                            continue;
                        }

                        if (memberData && Array.isArray(memberData)) {
                            const profiles = memberData.map((m: any) => ({
                                id: m.profiles.id,
                                displayName: m.profiles.display_name,
                                avatarEmoji: m.profiles.avatar_emoji,
                                createdAt: m.profiles.created_at
                            }));
                            console.log(`✅ [SpaceStore] Found ${profiles.length} members for ${space.name}`);
                            set(state => ({
                                spaceMembers: { ...state.spaceMembers, [space.id]: profiles }
                            }));
                        }
                    }
                    console.log('✨ [SpaceStore] fetchSpaces complete');
                } catch (err) {
                    console.error('❌ [SpaceStore] Unexpected error in fetchSpaces:', err);
                }
            },

            initializeMySpace: () => {
                // Done via Supabase trigger on first login
                // This is now a legacy no-op to prevent UI crashes
            },

            createFamilySpace: async (name: string, icon: string = '👨‍👩‍👧‍👦') => {
                const userId = useUserStore.getState().getUserId();
                console.log('🏗️ [SpaceStore] Attempting to create Family Space:', { name, userId });

                if (!userId) {
                    console.error('❌ [SpaceStore] Cannot create space: No userId found in store');
                    return { success: false, error: 'User session not found. Please log in again.' };
                }

                try {
                    // 1. Create Space
                    console.log('🛰️ [SpaceStore] Inserting into "spaces" table...');
                    const { data: space, error: spaceError } = await withTimeout(supabase
                        .from('spaces')
                        .insert({
                            name,
                            type: 'FAMILY_SPACE',
                            icon,
                            created_by: userId
                        })
                        .select()
                        .single());

                    if (spaceError || !space) {
                        console.error('❌ [SpaceStore] Supabase error creating space:', spaceError);
                        return { success: false, error: spaceError?.message || 'Failed to create space in database' };
                    }

                    console.log('✅ [SpaceStore] Space created:', space.id);

                    // 2. Create Membership (Owner)
                    console.log('🛰️ [SpaceStore] Creating membership in "members" table...');
                    const { error: memError } = await withTimeout(supabase
                        .from('members')
                        .insert({
                            space_id: space.id,
                            profile_id: userId,
                            role: 'OWNER',
                            status: 'ACTIVE'
                        }));

                    if (memError) {
                        console.error('❌ [SpaceStore] Supabase error creating membership:', memError);
                        return { success: false, error: 'Space created but membership failed: ' + memError.message };
                    }

                    console.log('✅ [SpaceStore] Membership created for user:', userId);

                    // 3. Create Default Location
                    console.log('🛰️ [SpaceStore] Creating default location...');
                    const { error: locationError } = await withTimeout(supabase
                        .from('locations')
                        .insert({
                            name: 'General',
                            icon: '📁',
                            color: '#6B7280',
                            space_id: space.id,
                            created_by: userId
                        }));

                    if (locationError) {
                        console.warn('⚠️ [SpaceStore] Failed to create default location:', locationError);
                        // Don't fail the whole operation if location creation fails
                    } else {
                        console.log('✅ [SpaceStore] Default location created');
                    }

                    // 4. Refresh
                    console.log('🔄 [SpaceStore] Refreshing spaces...');
                    await get().fetchSpaces();
                    set({ currentSpaceId: space.id });

                    return { success: true, space: get().getSpaceById(space.id) || undefined };
                } catch (err: any) {
                    console.error('❌ [SpaceStore] Unexpected error or timeout:', err);
                    return { success: false, error: err.message || 'Request timed out or failed unexpectedly' };
                }
            },

            deleteSpace: async (spaceId: string) => {
                const { error } = await supabase
                    .from('spaces')
                    .delete()
                    .eq('id', spaceId);

                if (!error) {
                    await get().fetchSpaces();
                }
            },

            updateSpaceName: async (spaceId: string, name: string) => {
                await supabase
                    .from('spaces')
                    .update({ name, updated_at: new Date().toISOString() })
                    .eq('id', spaceId);

                await get().fetchSpaces();
            },

            switchSpace: (spaceId: string) => {
                set({ currentSpaceId: spaceId });
            },

            joinSpaceWithCode: async (code: string) => {
                const userId = useUserStore.getState().getUserId();
                console.log('🔑 [SpaceStore] Attempting to join with code:', code);

                if (!userId) {
                    console.error('❌ [SpaceStore] User not logged in');
                    return { success: false, error: 'User not logged in' };
                }

                try {
                    // 1. Find invite
                    console.log('🔍 [SpaceStore] Looking up invite code...');
                    const { data: invite, error: inviteError } = await supabase
                        .from('invites')
                        .select('*')
                        .eq('code', code.toUpperCase())
                        .eq('status', 'ACTIVE')
                        .single();

                    if (inviteError || !invite) {
                        console.error('❌ [SpaceStore] Invite lookup failed:', inviteError);
                        return { success: false, error: 'Invalid or expired invite code' };
                    }

                    console.log('✅ [SpaceStore] Found invite for space:', invite.space_id);

                    // 2. Check expiration
                    if (new Date(invite.expires_at) < new Date()) {
                        console.error('❌ [SpaceStore] Invite has expired');
                        return { success: false, error: 'Invite expired' };
                    }

                    // 3. Join space by creating membership
                    console.log('🛰️ [SpaceStore] Creating membership...');
                    const { error: joinError } = await supabase
                        .from('members')
                        .insert({
                            space_id: invite.space_id,
                            profile_id: userId,
                            role: 'MEMBER',
                            status: 'ACTIVE'
                        });

                    if (joinError) {
                        console.error('❌ [SpaceStore] Membership creation error:', joinError);
                        if (joinError.code === '23505') {
                            console.log('ℹ️ [SpaceStore] Already a member, refreshing...');
                            await get().fetchSpaces();
                            return { success: true, space: get().getSpaceById(invite.space_id) || undefined };
                        }
                        return { success: false, error: 'Failed to join space: ' + joinError.message };
                    }

                    console.log('✅ [SpaceStore] Membership created successfully');

                    // 4. Update invite usage (non-blocking - don't fail if RPC missing)
                    try {
                        await supabase
                            .from('invites')
                            .update({ used_count: invite.used_count + 1 })
                            .eq('id', invite.id);
                    } catch (err) {
                        console.warn('⚠️ [SpaceStore] Failed to update invite usage:', err);
                    }

                    // 5. Refresh and switch
                    console.log('🔄 [SpaceStore] Refreshing spaces...');
                    await get().fetchSpaces();
                    set({ currentSpaceId: invite.space_id });

                    console.log('🎉 [SpaceStore] Successfully joined space!');
                    return { success: true, space: get().getSpaceById(invite.space_id) || undefined };
                } catch (err: any) {
                    console.error('❌ [SpaceStore] Unexpected error in joinSpaceWithCode:', err);
                    return { success: false, error: err.message || 'Something went wrong' };
                }
            },

            leaveSpace: async (spaceId: string) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return;

                await supabase
                    .from('members')
                    .update({ status: 'LEFT' })
                    .eq('space_id', spaceId)
                    .eq('profile_id', userId);

                await get().fetchSpaces();
            },

            removeMember: async (spaceId: string, targetUserId: string) => {
                await supabase
                    .from('members')
                    .update({ status: 'REMOVED' })
                    .eq('space_id', spaceId)
                    .eq('profile_id', targetUserId);

                await get().fetchSpaces();
            },

            createInvite: async (spaceId: string, maxUses: number = 5) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return null;

                const { data, error } = await supabase
                    .from('invites')
                    .insert({
                        space_id: spaceId,
                        code: generateInviteCode(),
                        created_by: userId,
                        expires_at: getDefaultInviteExpiry(),
                        max_uses: maxUses
                    })
                    .select()
                    .single();

                return data ? {
                    id: data.id,
                    spaceId: data.space_id,
                    code: data.code,
                    createdBy: data.created_by,
                    expiresAt: data.expires_at,
                    maxUses: data.max_uses,
                    usedCount: data.used_count,
                    status: data.status as any,
                    createdAt: data.created_at
                } : null;
            },

            regenerateInvite: async (spaceId: string) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return null;

                // 1. Revoke existing invite
                const existingInvite = await get().getActiveInvite(spaceId);
                if (existingInvite) {
                    await get().revokeInvite(existingInvite.id);
                }

                // 2. Create new invite
                return await get().createInvite(spaceId);
            },

            revokeInvite: async (inviteId: string) => {
                await supabase
                    .from('invites')
                    .update({ status: 'REVOKED' })
                    .eq('id', inviteId);
            },

            getActiveInvite: async (spaceId: string) => {
                const { data } = await supabase
                    .from('invites')
                    .select('*')
                    .eq('space_id', spaceId)
                    .eq('status', 'ACTIVE')
                    .single();

                return data ? {
                    id: data.id,
                    spaceId: data.space_id,
                    code: data.code,
                    createdBy: data.created_by,
                    expiresAt: data.expires_at,
                    maxUses: data.max_uses,
                    usedCount: data.used_count,
                    status: data.status as any,
                    createdAt: data.created_at
                } : null;
            },

            logActivity: async (spaceId: string, type: ActivityType, payload: Activity['payload']) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return;

                await supabase
                    .from('activities')
                    .insert({
                        space_id: spaceId,
                        type,
                        actor_id: userId,
                        payload
                    });
            },

            fetchActivities: async (spaceId: string) => {
                const { data } = await supabase
                    .from('activities')
                    .select(`
                        id,
                        type,
                        payload,
                        created_at,
                        profiles (display_name)
                    `)
                    .eq('space_id', spaceId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                const activities = (data || []).map((a: any) => ({
                    id: a.id,
                    spaceId,
                    actorUserId: '', // not needed for display
                    actorName: a.profiles?.display_name || 'System',
                    type: a.type as ActivityType,
                    payload: a.payload,
                    createdAt: a.created_at
                }));

                set(state => ({
                    spaceActivities: { ...state.spaceActivities, [spaceId]: activities }
                }));
            },

            getSpaceActivities: (spaceId: string) => {
                return get().spaceActivities[spaceId] || [];
            },

            getCurrentSpace: () => {
                return get().spaces.find(s => s.id === get().currentSpaceId) || null;
            },

            getMySpace: () => {
                return get().spaces.find(s => s.type === 'MY_SPACE') || null;
            },

            getFamilySpaces: () => {
                return get().spaces.filter(s => s.type === 'FAMILY_SPACE');
            },

            getSpaceById: (spaceId: string) => {
                return get().spaces.find(s => s.id === spaceId) || null;
            },

            getSpaceMembers: (spaceId: string) => {
                return get().spaceMembers[spaceId] || [];
            },

            getMemberCount: (spaceId: string) => {
                return (get().spaceMembers[spaceId] || []).length;
            },

            getUserRole: (spaceId: string) => {
                const membership = get().memberships.find(m => m.spaceId === spaceId);
                return membership?.role || null;
            },

            isOwner: (spaceId: string) => {
                return get().getUserRole(spaceId) === 'OWNER';
            },

            hasFamilySpaces: () => {
                return get().getFamilySpaces().length > 0;
            },

            isSpaceNotificationEnabled: (spaceId: string) => {
                // Default to true if not set
                return get().notificationPreferences[spaceId] ?? true;
            },

            setSpaceNotificationEnabled: async (spaceId: string, enabled: boolean) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return;

                // Update local state
                set(state => ({
                    notificationPreferences: { ...state.notificationPreferences, [spaceId]: enabled }
                }));

                // Sync to database
                await supabase
                    .from('notification_preferences')
                    .upsert({
                        profile_id: userId,
                        space_id: spaceId,
                        enabled
                    });
            },
        }),
        {
            name: 'expire-track-spaces',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ currentSpaceId: state.currentSpaceId }) // Only persist current selection
        }
    )
);
