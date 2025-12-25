import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Category, Location, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, ProductStatus } from '../types';
import { scheduleProductNotification, cancelProductNotification } from '../lib/notifications';
import { useSettingsStore } from './settingsStore';

const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

// Helper to calculate status based on Web App Logic
export function calculateStatus(
    expirationDate: string,
    useShelfLife?: boolean,
    openedDate?: string,
    shelfLifeDays?: number,
    notifyTiming: number = 7 // Custom threshold in days, default 7
): ProductStatus {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    let targetDate = new Date(expirationDate);

    // If PAO logic applies
    if (useShelfLife && openedDate && shelfLifeDays) {
        const opened = new Date(openedDate);
        const expFromOpen = new Date(opened);
        expFromOpen.setDate(opened.getDate() + shelfLifeDays);
        targetDate = expFromOpen;
    }

    targetDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) return 'expired';
    if (days <= notifyTiming) return 'expiring-soon'; // Use custom threshold
    return 'safe';
}

interface ProductStore {
    products: Product[];
    categories: Category[];
    locations: Location[];
    addProduct: (product: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;
    addLocation: (location: Omit<Location, 'id'>) => void;
    deleteLocation: (id: string) => void;
    moveProducts: (productIds: string[], targetLocationId: string) => void;
    getProductsByStatus: (status: ProductStatus) => Product[];
    getProductsByLocation: (locationId: string) => Product[];
    getProductsByCategory: (categoryId: string) => Product[];
    getTopLevelSpaces: () => Location[];
    getChildSpaces: (parentId: string) => Location[];
    refreshStatuses: () => void;
}

export const useProductStore = create<ProductStore>()(
    persist(
        (set, get) => ({
            products: [],
            categories: DEFAULT_CATEGORIES,
            locations: DEFAULT_LOCATIONS,

            addProduct: (data) => {
                const now = new Date().toISOString();
                const status = calculateStatus(data.expirationDate, data.useShelfLife, data.openedDate, data.shelfLifeDays, data.notifyTiming || 7);
                const newProduct = {
                    id: generateId(),
                    ...data,
                    status: data.hasExpirationDate === false ? 'safe' : status,
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    products: [...state.products, newProduct],
                }));

                // Schedule Notification
                const { notificationsEnabled, notificationTimings } = useSettingsStore.getState();
                if (notificationsEnabled) {
                    scheduleProductNotification(newProduct, notificationTimings);
                }
            },

            updateProduct: (id, updates) => set((state) => {
                const updatedProducts = state.products.map((p) => {
                    if (p.id !== id) return p;
                    const merged = { ...p, ...updates };
                    const status = merged.hasExpirationDate === false ? 'safe' : calculateStatus(merged.expirationDate, merged.useShelfLife, merged.openedDate, merged.shelfLifeDays, merged.notifyTiming || 7);
                    const finalProduct = { ...merged, status, updatedAt: new Date().toISOString() };

                    // Reschedule Notification
                    const { notificationsEnabled, notificationTimings } = useSettingsStore.getState();
                    if (notificationsEnabled) {
                        scheduleProductNotification(finalProduct, notificationTimings);
                    }

                    return finalProduct;
                });
                return { products: updatedProducts };
            }),

            deleteProduct: (id) => {
                set((state) => ({
                    products: state.products.filter((p) => p.id !== id),
                }));
                // Cancel Notification
                cancelProductNotification(id);
            },

            addLocation: (data) => set((state) => ({
                locations: [...state.locations, { id: generateId(), ...data }],
            })),

            moveProducts: (productIds, targetLocationId) => set((state) => ({
                products: state.products.map(p => productIds.includes(p.id) ? { ...p, locationId: targetLocationId } : p)
            })),

            deleteLocation: (id) => set((state) => {
                // Find all descendant locations recursively
                const getDescendants = (parentId: string): string[] => {
                    const children = state.locations.filter(l => l.parentId === parentId);
                    let ids = children.map(c => c.id);
                    for (const child of children) {
                        ids = [...ids, ...getDescendants(child.id)];
                    }
                    return ids;
                };

                const idsToDelete = [id, ...getDescendants(id)];

                // Delete products in these locations
                const newProducts = state.products.filter(p => !idsToDelete.includes(p.locationId));
                // Delete locations
                const newLocations = state.locations.filter(l => !idsToDelete.includes(l.id));

                return {
                    locations: newLocations,
                    products: newProducts,
                };
            }),

            getProductsByStatus: (status) => get().products.filter((p) => p.status === status),
            getProductsByLocation: (locationId) => get().products.filter((p) => p.locationId === locationId),
            getProductsByCategory: (categoryId) => get().products.filter((p) => p.categoryId === categoryId),
            getTopLevelSpaces: () => get().locations.filter((l) => !l.parentId),
            getChildSpaces: (parentId) => get().locations.filter((l) => l.parentId === parentId),

            refreshStatuses: () => set((state) => ({
                products: state.products.map((p) => ({
                    ...p,
                    status: p.hasExpirationDate === false ? 'safe' : calculateStatus(p.expirationDate, p.useShelfLife, p.openedDate, p.shelfLifeDays, p.notifyTiming || 7)
                })),
            })),
        }),
        { name: 'expire-track-store', storage: createJSONStorage(() => AsyncStorage) }
    )
);
