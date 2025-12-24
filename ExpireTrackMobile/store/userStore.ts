import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, generateId } from '../types/spaces';

// Avatar emoji options for user profiles
export const AVATAR_EMOJIS = [
    '😀', '😎', '🥳', '🤓', '😊', '🙂', '😇', '🤩',
    '👤', '👩', '👨', '👧', '👦', '🧑', '👴', '👵',
    '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸'
];

interface UserStore {
    // Current user profile
    currentUser: UserProfile | null;

    // Pro subscription status (local toggle for now)
    isPro: boolean;

    // Has user seen the Family Spaces onboarding?
    hasSeenFamilySpaceOnboarding: boolean;

    // Actions
    initializeUser: (displayName?: string) => void;
    updateDisplayName: (name: string) => void;
    updateAvatarEmoji: (emoji: string) => void;
    setIsPro: (isPro: boolean) => void;
    setHasSeenFamilySpaceOnboarding: (seen: boolean) => void;

    // Getters
    getUserId: () => string | null;
    getDisplayName: () => string;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            currentUser: null,
            isPro: false, // Default to free user - toggle in settings for testing
            hasSeenFamilySpaceOnboarding: false,

            initializeUser: (displayName?: string) => {
                const existing = get().currentUser;
                if (existing) return; // Already initialized

                const newUser: UserProfile = {
                    id: generateId(),
                    displayName: displayName || 'Me',
                    avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)],
                    createdAt: new Date().toISOString(),
                };

                set({ currentUser: newUser });
            },

            updateDisplayName: (name: string) => set((state) => ({
                currentUser: state.currentUser
                    ? { ...state.currentUser, displayName: name }
                    : null
            })),

            updateAvatarEmoji: (emoji: string) => set((state) => ({
                currentUser: state.currentUser
                    ? { ...state.currentUser, avatarEmoji: emoji }
                    : null
            })),

            setIsPro: (isPro: boolean) => set({ isPro }),

            setHasSeenFamilySpaceOnboarding: (seen: boolean) => set({
                hasSeenFamilySpaceOnboarding: seen
            }),

            getUserId: () => get().currentUser?.id || null,

            getDisplayName: () => get().currentUser?.displayName || 'Me',
        }),
        {
            name: 'expire-track-user',
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
);
