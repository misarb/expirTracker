import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'en' | 'fr' | 'ar';

interface NotificationSettings {
    enabled: boolean;
    daysBefore: number[];  // e.g., [7, 3, 1, 0] for 7 days, 3 days, 1 day, and expiration day
}

interface SettingsStore {
    theme: Theme;
    language: Language;
    notifications: NotificationSettings;
    notifiedProducts: string[];  // Track which products we've already notified about

    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    setLanguage: (language: Language) => void;

    setNotificationsEnabled: (enabled: boolean) => void;
    setNotificationDays: (days: number[]) => void;
    addNotifiedProduct: (key: string) => void;
    clearNotifiedProducts: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            theme: 'light',
            language: 'en',
            notifications: {
                enabled: false,
                daysBefore: [7, 3, 1, 0],
            },
            notifiedProducts: [],

            setTheme: (theme) => {
                set({ theme });
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.toggle('dark', theme === 'dark');
                }
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                get().setTheme(newTheme);
            },

            setLanguage: (language) => {
                set({ language });
            },

            setNotificationsEnabled: (enabled) => {
                set((state) => ({
                    notifications: { ...state.notifications, enabled },
                }));
            },

            setNotificationDays: (days) => {
                set((state) => ({
                    notifications: { ...state.notifications, daysBefore: days },
                }));
            },

            addNotifiedProduct: (key) => {
                set((state) => ({
                    notifiedProducts: [...state.notifiedProducts, key],
                }));
            },

            clearNotifiedProducts: () => {
                set({ notifiedProducts: [] });
            },
        }),
        {
            name: 'settings-store',
            onRehydrateStorage: () => (state) => {
                // Apply theme on hydration
                if (state && typeof document !== 'undefined') {
                    document.documentElement.classList.toggle('dark', state.theme === 'dark');
                }
            },
        }
    )
);
