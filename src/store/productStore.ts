import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Product, Category, Location, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, ProductStatus } from '@/types';
import { indexedDBStorage } from '@/lib/storage';

// Calculate product status based on expiration date
export function calculateStatus(expirationDate: string): ProductStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const daysUntilExpiration = Math.ceil(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) {
        return 'expired';
    } else if (daysUntilExpiration <= 7) {
        return 'expiring-soon';
    }
    return 'safe';
}

interface ProductStore {
    products: Product[];
    categories: Category[];
    locations: Location[];

    // Product actions
    addProduct: (product: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
    updateProduct: (id: string, updates: Partial<Product>) => void;
    deleteProduct: (id: string) => void;

    // Category actions
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;

    // Location actions
    addLocation: (location: Omit<Location, 'id'>) => void;
    updateLocation: (id: string, updates: Partial<Location>) => void;
    deleteLocation: (id: string) => void;
    deleteLocationWithProducts: (id: string) => void;
    deleteLocationAndMoveProducts: (id: string, targetLocationId: string) => void;
    getProductsByLocationIncludingChildren: (locationId: string) => Product[];

    // Computed helpers
    getProductsByStatus: (status: ProductStatus) => Product[];
    getProductsByCategory: (categoryId: string) => Product[];
    getProductsByLocation: (locationId: string) => Product[];
    getExpiringProducts: (days: number) => Product[];

    // Nested spaces helpers
    getTopLevelSpaces: () => Location[];
    getChildSpaces: (parentId: string) => Location[];
    getSpaceHierarchyName: (locationId: string) => string;

    // Data Management
    importData: (data: { products: Product[], categories: Category[], locations: Location[] }) => void;

    // Refresh statuses
    refreshStatuses: () => void;
}

export const useProductStore = create<ProductStore>()(
    persist(
        (set, get) => ({
            products: [],
            categories: DEFAULT_CATEGORIES,
            locations: DEFAULT_LOCATIONS,

            addProduct: (productData) => {
                const now = new Date().toISOString();
                const newProduct: Product = {
                    id: uuidv4(),
                    ...productData,
                    status: calculateStatus(productData.expirationDate),
                    createdAt: now,
                    updatedAt: now,
                };

                set((state) => ({
                    products: [...state.products, newProduct],
                }));
            },

            updateProduct: (id, updates) => {
                set((state) => ({
                    products: state.products.map((product) => {
                        if (product.id === id) {
                            const updatedProduct = {
                                ...product,
                                ...updates,
                                updatedAt: new Date().toISOString(),
                            };
                            // Recalculate status if expiration date changed
                            if (updates.expirationDate) {
                                updatedProduct.status = calculateStatus(updates.expirationDate);
                            }
                            return updatedProduct;
                        }
                        return product;
                    }),
                }));
            },

            deleteProduct: (id) => {
                set((state) => ({
                    products: state.products.filter((product) => product.id !== id),
                }));
            },

            addCategory: (categoryData) => {
                const newCategory: Category = {
                    id: uuidv4(),
                    ...categoryData,
                };

                set((state) => ({
                    categories: [...state.categories, newCategory],
                }));
            },

            updateCategory: (id, updates) => {
                set((state) => ({
                    categories: state.categories.map((category) =>
                        category.id === id ? { ...category, ...updates } : category
                    ),
                }));
            },

            deleteCategory: (id) => {
                set((state) => ({
                    categories: state.categories.filter((category) => category.id !== id),
                    // Move products from deleted category to first category
                    products: state.products.map((product) =>
                        product.categoryId === id
                            ? { ...product, categoryId: state.categories[0]?.id || 'food' }
                            : product
                    ),
                }));
            },

            addLocation: (locationData) => {
                const newLocation: Location = {
                    id: uuidv4(),
                    ...locationData,
                };

                set((state) => ({
                    locations: [...state.locations, newLocation],
                }));
            },

            updateLocation: (id, updates) => {
                set((state) => ({
                    locations: state.locations.map((location) =>
                        location.id === id ? { ...location, ...updates } : location
                    ),
                }));
            },

            deleteLocation: (id) => {
                console.log('deleteLocation function called with id:', id);
                set((state) => {
                    console.log('Current locations:', state.locations.length);
                    const remainingLocations = state.locations.filter((location) => location.id !== id);
                    console.log('Remaining locations after filter:', remainingLocations.length);
                    const fallbackLocationId = remainingLocations[0]?.id || 'kitchen';
                    console.log('Fallback location ID:', fallbackLocationId);

                    const newState = {
                        locations: remainingLocations,
                        // Move products from deleted location to first remaining location
                        products: state.products.map((product) =>
                            product.locationId === id
                                ? { ...product, locationId: fallbackLocationId }
                                : product
                        ),
                    };
                    console.log('New state prepared, locations count:', newState.locations.length);
                    return newState;
                });
                console.log('deleteLocation completed');
            },

            deleteLocationWithProducts: (id) => {
                set((state) => {
                    // Get all child location IDs recursively
                    const getAllChildIds = (parentId: string): string[] => {
                        const children = state.locations.filter(l => l.parentId === parentId);
                        return children.flatMap(child => [child.id, ...getAllChildIds(child.id)]);
                    };
                    const allLocationIds = [id, ...getAllChildIds(id)];

                    return {
                        // Remove location and all its children
                        locations: state.locations.filter(l => !allLocationIds.includes(l.id)),
                        // Delete all products in these locations
                        products: state.products.filter(p => !allLocationIds.includes(p.locationId)),
                    };
                });
            },

            deleteLocationAndMoveProducts: (id, targetLocationId) => {
                set((state) => {
                    // Get all child location IDs recursively
                    const getAllChildIds = (parentId: string): string[] => {
                        const children = state.locations.filter(l => l.parentId === parentId);
                        return children.flatMap(child => [child.id, ...getAllChildIds(child.id)]);
                    };
                    const allLocationIds = [id, ...getAllChildIds(id)];

                    return {
                        // Remove location and all its children
                        locations: state.locations.filter(l => !allLocationIds.includes(l.id)),
                        // Move all products from these locations to target
                        products: state.products.map(p =>
                            allLocationIds.includes(p.locationId)
                                ? { ...p, locationId: targetLocationId }
                                : p
                        ),
                    };
                });
            },

            getProductsByLocationIncludingChildren: (locationId) => {
                const state = get();
                // Get all child location IDs recursively
                const getAllChildIds = (parentId: string): string[] => {
                    const children = state.locations.filter(l => l.parentId === parentId);
                    return children.flatMap(child => [child.id, ...getAllChildIds(child.id)]);
                };
                const allLocationIds = [locationId, ...getAllChildIds(locationId)];
                return state.products.filter(p => allLocationIds.includes(p.locationId));
            },

            importData: (data) => {
                set({
                    products: data.products || [],
                    categories: data.categories || DEFAULT_CATEGORIES,
                    locations: data.locations || DEFAULT_LOCATIONS
                });
            },



            getProductsByStatus: (status) => {
                return get().products.filter((p) => p.status === status);
            },

            getProductsByCategory: (categoryId) => {
                return get().products.filter((p) => p.categoryId === categoryId);
            },

            getProductsByLocation: (locationId) => {
                return get().products.filter((p) => p.locationId === locationId);
            },

            getExpiringProducts: (days) => {
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + days);

                return get().products.filter((product) => {
                    const expDate = new Date(product.expirationDate);
                    return expDate <= futureDate && product.status !== 'expired';
                });
            },

            refreshStatuses: () => {
                set((state) => ({
                    products: state.products.map((product) => ({
                        ...product,
                        status: calculateStatus(product.expirationDate),
                    })),
                }));
            },

            // Nested spaces helpers
            getTopLevelSpaces: () => {
                return get().locations.filter((loc) => !loc.parentId);
            },

            getChildSpaces: (parentId) => {
                return get().locations.filter((loc) => loc.parentId === parentId);
            },

            getSpaceHierarchyName: (locationId) => {
                const locations = get().locations;
                const location = locations.find((l) => l.id === locationId);
                if (!location) return '';

                if (location.parentId) {
                    const parent = locations.find((l) => l.id === location.parentId);
                    if (parent) {
                        return `${parent.name} > ${location.name}`;
                    }
                }
                return location.name;
            },
        }),
        {
            name: 'product-expiration-store',
            storage: createJSONStorage(() => indexedDBStorage),
            onRehydrateStorage: () => (state) => {
                // Migration: Check if we have data in localStorage from previous version
                if (typeof window !== 'undefined') {
                    const localData = localStorage.getItem('product-expiration-store');
                    // If IDB state provided no products (meaning it's empty/fresh) but we have localData
                    if (localData && (!state || state.products.length === 0)) {
                        try {
                            const parsed = JSON.parse(localData);
                            if (parsed.state && parsed.state.products && parsed.state.products.length > 0) {
                                console.log("Migrating data from localStorage to IndexedDB...", parsed.state);
                                // We need to set the state. useProductStore won't be fully ready here if we call it directly during its own creation?
                                // Actually, since this runs after rehydration, the store is created. 
                                // However, safe way is to just let the store update.
                                // Use setTimeout to ensure we are out of the synchronous initialization phase
                                setTimeout(() => {
                                    useProductStore.setState(parsed.state);
                                    // Clear legacy storage to free up space and avoid confusion
                                    localStorage.removeItem('product-expiration-store');
                                }, 0);
                            }
                        } catch (e) {
                            console.error("Migration failed", e);
                        }
                    }
                }
            }
        }
    )
);
