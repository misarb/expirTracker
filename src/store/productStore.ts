import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Product, Category, Location, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, ProductStatus } from '@/types';

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

    // Computed helpers
    getProductsByStatus: (status: ProductStatus) => Product[];
    getProductsByCategory: (categoryId: string) => Product[];
    getProductsByLocation: (locationId: string) => Product[];
    getExpiringProducts: (days: number) => Product[];

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
                set((state) => ({
                    locations: state.locations.filter((location) => location.id !== id),
                    // Move products from deleted location to first location
                    products: state.products.map((product) =>
                        product.locationId === id
                            ? { ...product, locationId: state.locations[0]?.id || 'kitchen' }
                            : product
                    ),
                }));
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
        }),
        {
            name: 'product-expiration-store',
        }
    )
);
