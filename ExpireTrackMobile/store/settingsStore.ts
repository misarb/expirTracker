import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'fr' | 'ar';

interface SettingsStore {
    theme: Theme;
    language: Language;
    notificationsEnabled: boolean;
    notificationTimings: number[]; // Array of days before expiration
    setTheme: (theme: Theme) => void;
    setLanguage: (language: Language) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    toggleNotificationTiming: (days: number) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'en',
            notificationsEnabled: true,
            notificationTimings: [0, 1, 7], // Default: same day, 1 day, and 7 days
            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
            toggleNotificationTiming: (days) => set((state) => {
                const timings = state.notificationTimings.includes(days)
                    ? state.notificationTimings.filter(d => d !== days)
                    : [...state.notificationTimings, days];

                // Ensure at least one is selected if enabled? Or allow empty?
                // Better allow empty but maybe warn.
                return { notificationTimings: timings };
            }),
        }),
        { name: 'expire-track-settings', storage: createJSONStorage(() => AsyncStorage) }
    )
);
