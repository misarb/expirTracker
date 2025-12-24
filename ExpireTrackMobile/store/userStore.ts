import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, generateId } from '../types/spaces';
import { supabase, supabaseConfig, withTimeout } from '../lib/supabase';

// Avatar emoji options for user profiles
export const AVATAR_EMOJIS = [
    '😀', '😎', '🥳', '🤓', '😊', '🙂', '😇', '🤩',
    '👤', '👩', '👨', '👧', '👦', '🧑', '👴', '👵',
    '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸'
];

interface UserStore {
    // Current user profile
    currentUser: UserProfile | null;
    sessionIdentifier: string | null;

    // Pro subscription status (local toggle for now)
    isPro: boolean;

    // Has user seen the Family Spaces onboarding?
    hasSeenFamilySpaceOnboarding: boolean;

    // Actions
    initializeUser: () => Promise<void>;
    syncProfile: (updates: Partial<UserProfile>) => Promise<void>;
    updateDisplayName: (name: string) => Promise<void>;
    updateAvatarEmoji: (emoji: string) => Promise<void>;
    setIsPro: (isPro: boolean) => void;
    setHasSeenFamilySpaceOnboarding: (seen: boolean) => void;
    signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;

    // Getters
    getUserId: () => string | null;
    getDisplayName: () => string;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            currentUser: null,
            sessionIdentifier: null,
            isPro: false,
            hasSeenFamilySpaceOnboarding: false,

            initializeUser: async () => {
                console.log('🏗️ [UserStore] Initializing user...');
                // Check if already authorized in Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('❌ [UserStore] Session error:', sessionError);
                }

                if (!session) {
                    console.log('ℹ️ [UserStore] No active session found');
                    set({ currentUser: null, sessionIdentifier: null, isPro: false });
                    return;
                }

                console.log('👤 [UserStore] Session found for:', session.user.id);

                // Fetch profile from Supabase
                console.log('🔍 [UserStore] Fetching profile...');
                const { data: profile, error: profileError } = await withTimeout(supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single());

                if (profileError) {
                    console.log('⚠️ [UserStore] Profile fetch status:', profileError.code === 'PGRST116' ? 'Not found (expected for new user)' : 'Error: ' + profileError.message);
                }

                if (profile) {
                    console.log('✅ [UserStore] Profile loaded:', profile.display_name);
                    set({
                        currentUser: {
                            id: profile.id,
                            displayName: profile.display_name,
                            avatarEmoji: profile.avatar_emoji,
                            createdAt: profile.created_at
                        },
                        isPro: profile.is_pro || false,
                        hasSeenFamilySpaceOnboarding: profile.has_seen_family_onboarding || false,
                        sessionIdentifier: session.user.id
                    });
                } else {
                    // Session exists but no profile? Let's try to create one manually
                    console.log('🚧 [UserStore] No profile found, attempting manual creation...');
                    const { data: newProfile, error: createError } = await withTimeout(supabase
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email,
                            display_name: session.user.user_metadata?.display_name || 'Me',
                            avatar_emoji: '😀'
                        })
                        .select()
                        .single());

                    if (!createError && newProfile) {
                        console.log('✅ [UserStore] Profile created manually');
                        set({
                            currentUser: {
                                id: newProfile.id,
                                displayName: newProfile.display_name,
                                avatarEmoji: newProfile.avatar_emoji,
                                createdAt: newProfile.created_at
                            },
                            isPro: newProfile.is_pro || false,
                            sessionIdentifier: session.user.id
                        });
                    } else {
                        console.error('❌ [UserStore] Profile creation failed:', createError);
                        set({ currentUser: null, sessionIdentifier: null, isPro: false });
                    }
                }
                console.log('✨ [UserStore] Initialization complete');
            },

            syncProfile: async (updates) => {
                const userId = get().getUserId();
                if (!userId) return;

                const { error } = await supabase
                    .from('profiles')
                    .update({
                        display_name: updates.displayName,
                        avatar_emoji: updates.avatarEmoji,
                        is_pro: get().isPro,
                        has_seen_family_onboarding: get().hasSeenFamilySpaceOnboarding,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);

                if (!error) {
                    set((state) => ({
                        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
                    }));
                }
            },

            updateDisplayName: async (name: string) => {
                await get().syncProfile({ displayName: name });
            },

            updateAvatarEmoji: async (emoji: string) => {
                await get().syncProfile({ avatarEmoji: emoji });
            },

            setIsPro: (isPro: boolean) => {
                set({ isPro });
                const userId = get().getUserId();
                if (userId) {
                    supabase.from('profiles').update({ is_pro: isPro }).eq('id', userId);
                }
            },

            setHasSeenFamilySpaceOnboarding: (seen: boolean) => {
                set({ hasSeenFamilySpaceOnboarding: seen });
                const userId = get().getUserId();
                if (userId) {
                    supabase.from('profiles').update({ has_seen_family_onboarding: seen }).eq('id', userId);
                }
            },

            signUp: async (email, password, displayName) => {
                console.log('🔄 Starting signUp for:', email);

                // Check for placeholder credentials
                if (supabaseConfig.url.includes('your-project-id')) {
                    console.error('❌ Supabase URL is still a placeholder! Please update .env');
                    return { success: false, error: 'Supabase is not configured. Please update your .env file with actual credentials.' };
                }

                try {
                    const { data: { user, session }, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                display_name: displayName,
                            }
                        }
                    });

                    if (error) {
                        console.error('❌ Supabase signUp error:', error);
                        return { success: false, error: error.message };
                    }

                    if (!user) {
                        console.error('❌ Supabase signUp failed: No user returned');
                        return { success: false, error: 'Failed to create account. Please try again.' };
                    }

                    console.log('✅ Supabase signUp success:', user.id);

                    // If session exists (email confirmation disabled), sync immediately
                    if (session) {
                        set({
                            currentUser: {
                                id: user.id,
                                displayName,
                                avatarEmoji: AVATAR_EMOJIS[0],
                                createdAt: new Date().toISOString()
                            },
                            sessionIdentifier: user.id
                        });
                    }

                    return { success: true };
                } catch (err: any) {
                    console.error('❌ Unexpected signUp error:', err);
                    return { success: false, error: err.message || 'An unexpected error occurred' };
                }
            },

            signIn: async (email, password) => {
                console.log('🔄 [UserStore] Starting signIn...');
                const { data: { session }, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    console.error('❌ [UserStore] signIn error:', error.message);
                    return { success: false, error: error.message };
                }

                if (!session) {
                    console.error('❌ [UserStore] signIn failed: No session returned');
                    return { success: false, error: 'Failed to sign in' };
                }

                console.log('✅ [UserStore] signIn successful');
                // We DON'T await initializeUser here to avoid double initialization
                // App.tsx listener will catch the SIGNED_IN event
                return { success: true };
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({ currentUser: null, sessionIdentifier: null, isPro: false });
            },

            getUserId: () => get().currentUser?.id || null,

            getDisplayName: () => get().currentUser?.displayName || 'Me',
        }),
        {
            name: 'expire-track-user',
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
);
