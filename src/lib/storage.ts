import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

export const indexedDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        if (typeof window === 'undefined') return null;
        try {
            const value = await get(name);
            return value || null;
        } catch (e) {
            console.error('Error getting item from IndexedDB:', e);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
            await set(name, value);
        } catch (e) {
            console.error('Error setting item in IndexedDB:', e);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        if (typeof window === 'undefined') return;
        try {
            await del(name);
        } catch (e) {
            console.error('Error removing item from IndexedDB:', e);
        }
    },
};
