import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Category, Location, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, ProductStatus } from '../types';
import { scheduleProductNotification, cancelProductNotification } from '../lib/notifications';
import { useSettingsStore } from './settingsStore';
import { useSpaceStore, MY_SPACE_ID } from './spaceStore';
import { useUserStore } from './userStore';

const generateId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});

// Helper to calculate status based on Web App Logic
export function calculateStatus(
    expirationDate: string,
    useShelfLife?: boolean,
    openedDate?: string,
    shelfLifeDays?: number
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
    if (days <= 7) return 'expiring-soon';
    return 'safe';
}

interface ProductStore {
    products: Product[];
    categories: Category[];
    locations: Location[];

    // Product CRUD
    addProduct: (product: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => string;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Location CRUD
    addLocation: (location: Omit<Location, 'id'>) => void;
    deleteLocation: (id: string) => void;
    moveProducts: (productIds: string[], targetLocationId: string) => void;

    // Space-aware getters
    getProductsByStatus: (status: ProductStatus, spaceId?: string) => Product[];
    getProductsByLocation: (locationId: string) => Product[];
    getProductsByCategory: (categoryId: string, spaceId?: string) => Product[];
    getProductsBySpace: (spaceId: string) => Product[];
    getTopLevelSpaces: (spaceId?: string) => Location[];
    getChildSpaces: (parentId: string) => Location[];
    getLocationsBySpace: (spaceId: string) => Location[];

    // Utilities
    refreshStatuses: () => void;
    migrateProductsToSpace: () => void; // Migrate existing products to my-space
}

export const useProductStore = create<ProductStore>()(
    persist(
        (set, get) => ({
            products: [],
            categories: DEFAULT_CATEGORIES,
            locations: DEFAULT_LOCATIONS,

            addProduct: (data) => {
                const now = new Date().toISOString();
                const status = calculateStatus(data.expirationDate, data.useShelfLife, data.openedDate, data.shelfLifeDays);

                // Get current space from spaceStore
                const currentSpaceId = useSpaceStore.getState().currentSpaceId || MY_SPACE_ID;

                const newProduct: Product = {
                    id: generateId(),
                    ...data,
                    spaceId: data.spaceId || currentSpaceId, // Use provided or current space
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

                // Log activity for Family Spaces
                if (currentSpaceId !== MY_SPACE_ID) {
                    useSpaceStore.getState().logActivity(currentSpaceId, 'PRODUCT_ADDED', {
                        productName: newProduct.name,
                        productId: newProduct.id,
                    });
                }

                return newProduct.id;
            },

            updateProduct: (id, updates) => set((state) => {
                const updatedProducts = state.products.map((p) => {
                    if (p.id !== id) return p;
                    const merged = { ...p, ...updates };
                    const status = merged.hasExpirationDate === false ? 'safe' : calculateStatus(merged.expirationDate, merged.useShelfLife, merged.openedDate, merged.shelfLifeDays);
                    const finalProduct = { ...merged, status, updatedAt: new Date().toISOString() };

                    // Reschedule Notification
                    const { notificationsEnabled, notificationTimings } = useSettingsStore.getState();
                    if (notificationsEnabled) {
                        scheduleProductNotification(finalProduct, notificationTimings);
                    }

                    // Log activity for Family Spaces
                    if (finalProduct.spaceId && finalProduct.spaceId !== MY_SPACE_ID) {
                        useSpaceStore.getState().logActivity(finalProduct.spaceId, 'PRODUCT_UPDATED', {
                            productName: finalProduct.name,
                            productId: finalProduct.id,
                        });
                    }

                    return finalProduct;
                });
                return { products: updatedProducts };
            }),

            deleteProduct: (id) => {
                const product = get().products.find(p => p.id === id);

                set((state) => ({
                    products: state.products.filter((p) => p.id !== id),
                }));

                // Cancel Notification
                cancelProductNotification(id);

                // Log activity for Family Spaces
                if (product && product.spaceId && product.spaceId !== MY_SPACE_ID) {
                    useSpaceStore.getState().logActivity(product.spaceId, 'PRODUCT_DELETED', {
                        productName: product.name,
                        productId: product.id,
                    });
                }
            },

            addLocation: (data) => {
                const currentSpaceId = useSpaceStore.getState().currentSpaceId || MY_SPACE_ID;
                const userId = useUserStore.getState().getUserId();

                set((state) => ({
                    locations: [...state.locations, {
                        id: generateId(),
                        ...data,
                        spaceId: data.spaceId || currentSpaceId,
                        createdBy: data.createdBy || userId || undefined,
                    }],
                }));

                // Log activity for Family Spaces
                if (currentSpaceId !== MY_SPACE_ID) {
                    useSpaceStore.getState().logActivity(currentSpaceId, 'FOLDER_CREATED', {
                        folderName: data.name,
                    });
                }
            },

            moveProducts: (productIds, targetLocationId) => set((state) => ({
                products: state.products.map(p => productIds.includes(p.id) ? { ...p, locationId: targetLocationId } : p)
            })),

            deleteLocation: (id) => set((state) => {
                const location = state.locations.find(l => l.id === id);

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

                // Log activity for Family Spaces
                if (location && location.spaceId && location.spaceId !== MY_SPACE_ID) {
                    useSpaceStore.getState().logActivity(location.spaceId, 'FOLDER_DELETED', {
                        folderName: location.name,
                        folderId: location.id,
                    });
                }

                return {
                    locations: newLocations,
                    products: newProducts,
                };
            }),

            // Space-aware getters
            getProductsByStatus: (status, spaceId) => {
                const targetSpaceId = spaceId || useSpaceStore.getState().currentSpaceId || MY_SPACE_ID;
                return get().products.filter((p) =>
                    p.status === status &&
                    (p.spaceId === targetSpaceId || (!p.spaceId && targetSpaceId === MY_SPACE_ID))
                );
            },

            getProductsByLocation: (locationId) => get().products.filter((p) => p.locationId === locationId),

            getProductsByCategory: (categoryId, spaceId) => {
                const targetSpaceId = spaceId || useSpaceStore.getState().currentSpaceId || MY_SPACE_ID;
                return get().products.filter((p) =>
                    (p as any).categoryId === categoryId &&
                    (p.spaceId === targetSpaceId || (!p.spaceId && targetSpaceId === MY_SPACE_ID))
                );
            },

            getProductsBySpace: (spaceId) => {
                return get().products.filter((p) =>
                    p.spaceId === spaceId || (!p.spaceId && spaceId === MY_SPACE_ID)
                );
            },

            getTopLevelSpaces: (spaceId) => {
                const targetSpaceId = spaceId || useSpaceStore.getState().currentSpaceId || MY_SPACE_ID;
                return get().locations.filter((l) =>
                    !l.parentId &&
                    (l.spaceId === targetSpaceId || (!l.spaceId && targetSpaceId === MY_SPACE_ID))
                );
            },

            getChildSpaces: (parentId) => get().locations.filter((l) => l.parentId === parentId),

            getLocationsBySpace: (spaceId) => {
                return get().locations.filter((l) =>
                    l.spaceId === spaceId || (!l.spaceId && spaceId === MY_SPACE_ID)
                );
            },

            refreshStatuses: () => set((state) => ({
                products: state.products.map((p) => ({
                    ...p,
                    status: p.hasExpirationDate === false ? 'safe' : calculateStatus(p.expirationDate, p.useShelfLife, p.openedDate, p.shelfLifeDays)
                })),
            })),

            // Migrate existing products without spaceId to my-space
            migrateProductsToSpace: () => set((state) => ({
                products: state.products.map((p) => ({
                    ...p,
                    spaceId: p.spaceId || MY_SPACE_ID,
                })),
                locations: state.locations.map((l) => ({
                    ...l,
                    spaceId: l.spaceId || MY_SPACE_ID,
                })),
            })),
        }),
        { name: 'expire-track-store', storage: createJSONStorage(() => AsyncStorage) }
    )
);
