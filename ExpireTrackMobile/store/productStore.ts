import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Category, Location, DEFAULT_CATEGORIES, DEFAULT_LOCATIONS, ProductStatus } from '../types';
import { scheduleProductNotification, cancelProductNotification } from '../lib/notifications';
import { useSettingsStore } from './settingsStore';
import { useSpaceStore } from './spaceStore';
import { useUserStore } from './userStore';
import { supabase } from '../lib/supabase';

// Helper to calculate status based on Web App Logic
export function calculateStatus(
    expirationDate: string,
    useShelfLife?: boolean,
    openedDate?: string,
    shelfLifeDays?: number,
    criticalDays: number = 7
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
    if (days <= criticalDays) return 'expiring-soon';
    return 'safe';
}

interface ProductStore {
    products: Product[];
    categories: Category[];
    locations: Location[];
    loading: boolean;
    realtimeChannels: Map<string, any>; // Map of spaceId -> channel
    pendingSyncCount: number;

    // Actions
    fetchData: (spaceId: string) => Promise<void>;
    fetchAllSpacesData: (spaceIds: string[]) => Promise<void>;

    // Product CRUD
    addProduct: (product: Omit<Product, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    // Batch Actions
    batchDeleteProducts: (ids: string[]) => Promise<void>;
    batchMoveToSpace: (ids: string[], targetSpaceId: string) => Promise<void>;
    batchUpdateProducts: (ids: string[], updates: Partial<Product>) => Promise<void>;

    // Location CRUD
    addLocation: (location: Omit<Location, 'id'>) => Promise<string | null>;
    deleteLocation: (id: string) => Promise<void>;
    moveProducts: (productIds: string[], targetLocationId: string) => Promise<void>;

    // Helpers
    getProductsByStatus: (status: ProductStatus, spaceId?: string) => Product[];
    getProductsByLocation: (locationId: string) => Product[];
    getProductsByCategory: (categoryId: string, spaceId?: string) => Product[];
    refreshStatuses: () => void;
    getProductsBySpace: (spaceId: string) => Product[];
    getTopLevelLocations: () => Location[];
    getChildLocations: (parentId: string) => Location[];

    // Legacy Aliases
    getLocationsBySpace: (spaceId: string | null) => Location[];
    getTopLevelSpaces: (spaceId?: string) => Location[];

    // Real-time Subscriptions
    subscribeToSpace: (spaceId: string) => void;
    unsubscribeFromSpace: (spaceId: string) => void;
    unsubscribeAll: () => void;
}

export const useProductStore = create<ProductStore>()(
    persist(
        (set, get) => ({
            products: [],
            categories: DEFAULT_CATEGORIES,
            locations: [],
            loading: false,
            realtimeChannels: new Map(),
            pendingSyncCount: 0,

            fetchData: async (spaceId: string) => {
                set({ loading: true });

                // 1. Fetch Locations
                const { data: locationsData } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('space_id', spaceId);

                const newLocations: Location[] = (locationsData || []).map(l => ({
                    id: l.id,
                    name: l.name,
                    icon: l.icon,
                    color: l.color,
                    description: l.description,
                    parentId: l.parent_id,
                    spaceId: l.space_id,
                    createdBy: l.created_by
                }));

                // 2. Fetch Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('space_id', spaceId);

                const newProducts: Product[] = (productsData || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    status: p.status as ProductStatus,
                    expirationDate: p.expiration_date,
                    locationId: p.location_id,
                    spaceId: p.space_id,
                    image: p.image,
                    quantity: p.quantity,
                    purchaseDate: p.purchase_date,
                    notes: p.notes,
                    isRecurring: p.is_recurring,
                    recurringDays: p.recurring_days,
                    hasExpirationDate: p.has_expiration_date,
                    useShelfLife: p.use_shelf_life,
                    shelfLifeDays: p.shelf_life_days,
                    openedDate: p.opened_date,
                    notifyTiming: p.notify_timing,
                    criticalDays: p.critical_days,
                    addedBy: p.added_by,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at
                }));

                // Merge locations: remove old locations from this space, add new ones
                set(state => ({
                    locations: [
                        ...state.locations.filter(l => l.spaceId !== spaceId),
                        ...newLocations
                    ],
                    products: [
                        ...state.products.filter(p => p.spaceId !== spaceId),
                        ...newProducts
                    ],
                    loading: false,
                    pendingSyncCount: 0
                }));
            },

            fetchAllSpacesData: async (spaceIds: string[]) => {
                console.log('📚 [ProductStore] Fetching data for all spaces:', spaceIds);
                set({ loading: true });

                try {
                    // Fetch all in parallel
                    await Promise.all(spaceIds.map(spaceId => get().fetchData(spaceId)));
                    console.log('✅ [ProductStore] All spaces data loaded');
                } catch (error) {
                    console.error('❌ [ProductStore] Error fetching all spaces data:', error);
                } finally {
                    set({ loading: false });
                }
            },

            addProduct: async (data) => {
                const status = data.hasExpirationDate === false
                    ? 'safe'
                    : calculateStatus(data.expirationDate, data.useShelfLife, data.openedDate, data.shelfLifeDays, data.criticalDays || 3);

                const { data: product, error } = await supabase
                    .from('products')
                    .insert({
                        name: data.name,
                        status,
                        expiration_date: data.expirationDate,
                        space_id: data.spaceId,
                        location_id: data.locationId,
                        image: data.image,
                        quantity: data.quantity,
                        purchase_date: data.purchaseDate,
                        notes: data.notes,
                        is_recurring: data.isRecurring,
                        recurring_days: data.recurringDays,
                        has_expiration_date: data.hasExpirationDate,
                        use_shelf_life: data.useShelfLife,
                        shelf_life_days: data.shelfLifeDays,
                        opened_date: data.openedDate,
                        notify_timing: data.notifyTiming,
                        critical_days: data.criticalDays || 3,
                        added_by: useUserStore.getState().getUserId()
                    })
                    .select()
                    .single();

                if (error || !product) {
                    console.error('❌ [ProductStore] Failed to add product:', error);
                    console.log('Product data that failed:', data);
                    console.log('User ID:', useUserStore.getState().getUserId());
                    return null;
                }

                const newProduct: Product = {
                    id: product.id,
                    ...data,
                    status: product.status as ProductStatus,
                    addedBy: product.added_by,
                    createdAt: product.created_at,
                    updatedAt: product.updated_at
                };

                set((state) => ({ products: [...state.products, newProduct] }));

                // Notifications
                const { notificationsEnabled, notificationTimings } = useSettingsStore.getState();
                if (notificationsEnabled) scheduleProductNotification(newProduct, notificationTimings);

                // Space Activity
                if (data.spaceId) {
                    useSpaceStore.getState().logActivity(data.spaceId, 'PRODUCT_ADDED', {
                        productName: newProduct.name,
                        productId: newProduct.id,
                    });
                }

                return product.id;
            },

            updateProduct: async (id, updates) => {
                const { data: product, error } = await supabase
                    .from('products')
                    .update({
                        name: updates.name,
                        status: updates.status, // or re-calculate
                        expiration_date: updates.expirationDate,
                        location_id: updates.locationId,
                        image: updates.image,
                        quantity: updates.quantity,
                        notes: updates.notes,
                        is_recurring: updates.isRecurring,
                        recurring_days: updates.recurringDays,
                        has_expiration_date: updates.hasExpirationDate,
                        use_shelf_life: updates.useShelfLife,
                        shelf_life_days: updates.shelfLifeDays,
                        opened_date: updates.openedDate,
                        notify_timing: updates.notifyTiming,
                        critical_days: updates.criticalDays,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (!error && product) {
                    await get().fetchData(product.space_id);

                    // Log
                    useSpaceStore.getState().logActivity(product.space_id, 'PRODUCT_UPDATED', {
                        productName: product.name,
                        productId: product.id,
                    });
                }
            },

            deleteProduct: async (id) => {
                const product = get().products.find(p => p.id === id);
                if (!product) return;

                const { error } = await supabase.from('products').delete().eq('id', id);

                if (!error) {
                    set((state) => ({ products: state.products.filter(p => p.id !== id) }));
                    cancelProductNotification(id);

                    if (product.spaceId) {
                        useSpaceStore.getState().logActivity(product.spaceId, 'PRODUCT_DELETED', {
                            productName: product.name,
                            productId: product.id,
                        });
                    }
                }
            },

            batchDeleteProducts: async (ids) => {
                const affectedProducts = get().products.filter(p => ids.includes(p.id));
                const spaceId = affectedProducts[0]?.spaceId;

                set(state => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
                const { error } = await supabase.from('products').delete().in('id', ids);

                if (!error) {
                    set(state => ({
                        products: state.products.filter(p => !ids.includes(p.id)),
                        pendingSyncCount: Math.max(0, state.pendingSyncCount - 1)
                    }));
                    ids.forEach(id => cancelProductNotification(id));

                    if (spaceId) {
                        useSpaceStore.getState().logActivity(spaceId, 'PRODUCT_DELETED', {
                            productName: `${ids.length} products`,
                            notes: 'Batch deletion'
                        });
                    }
                } else {
                    set(state => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
                }
            },

            batchMoveToSpace: async (ids, targetSpaceId) => {
                const productsToMove = get().products.filter(p => ids.includes(p.id));
                const sourceSpaceId = productsToMove[0]?.spaceId;

                set(state => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
                const { error } = await supabase
                    .from('products')
                    .update({ space_id: targetSpaceId, location_id: null })
                    .in('id', ids);

                if (!error) {
                    const currentSpaceId = useSpaceStore.getState().currentSpaceId;
                    set(state => ({
                        products: state.products.filter(p => !ids.includes(p.id)),
                        pendingSyncCount: Math.max(0, state.pendingSyncCount - 1)
                    }));

                    if (sourceSpaceId) {
                        useSpaceStore.getState().logActivity(sourceSpaceId, 'PRODUCT_DELETED', {
                            productName: `${ids.length} products`,
                            notes: `Moved to another space`
                        });
                    }

                    // Re-fetch target space if it's currently relevant
                    await get().fetchData(targetSpaceId);
                    if (currentSpaceId) await get().fetchData(currentSpaceId);
                } else {
                    set(state => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
                }
            },

            batchUpdateProducts: async (ids, updates) => {
                set(state => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
                // Convert camelCase to snake_case for Supabase if needed, but our updates are simple here
                const supabaseUpdates: any = {};
                if (updates.openedDate !== undefined) supabaseUpdates.opened_date = updates.openedDate;
                if (updates.status !== undefined) supabaseUpdates.status = updates.status;
                if (updates.locationId !== undefined) supabaseUpdates.location_id = updates.locationId;

                const { error } = await supabase
                    .from('products')
                    .update(supabaseUpdates)
                    .in('id', ids);

                if (!error) {
                    const firstProd = get().products.find(p => ids.includes(p.id));
                    if (firstProd && firstProd.spaceId) await get().fetchData(firstProd.spaceId);
                    set(state => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
                } else {
                    set(state => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
                }
            },

            addLocation: async (data) => {
                console.log('📁 [ProductStore] Attempting to create location:', { name: data.name, spaceId: data.spaceId, createdBy: data.createdBy });

                try {
                    const { data: location, error } = await supabase
                        .from('locations')
                        .insert({
                            name: data.name,
                            icon: data.icon,
                            color: data.color,
                            description: data.description,
                            parent_id: data.parentId,
                            space_id: data.spaceId,
                            created_by: data.createdBy
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('❌ [ProductStore] Location creation error:', error);
                        return null;
                    }

                    if (!location) {
                        console.error('❌ [ProductStore] Location created but no data returned');
                        return null;
                    }

                    console.log('✅ [ProductStore] Location created:', location.id);

                    const sId = data.spaceId;
                    if (sId) {
                        console.log('🔄 [ProductStore] Fetching updated data for space:', sId);
                        await get().fetchData(sId);
                    }

                    if (data.spaceId) {
                        console.log('📝 [ProductStore] Logging activity...');
                        useSpaceStore.getState().logActivity(data.spaceId, 'FOLDER_CREATED', {
                            folderName: data.name,
                        });
                    }

                    return location.id;
                } catch (err) {
                    console.error('❌ [ProductStore] Unexpected error in addLocation:', err);
                    return null;
                }
            },

            deleteLocation: async (id) => {
                const location = get().locations.find(l => l.id === id);
                if (!location) return;

                const { error } = await supabase.from('locations').delete().eq('id', id);

                if (!error) {
                    if (location.spaceId) await get().fetchData(location.spaceId);

                    // Log
                    if (location.spaceId) {
                        useSpaceStore.getState().logActivity(location.spaceId, 'FOLDER_DELETED', {
                            folderName: location.name,
                            folderId: location.id,
                        });
                    }
                }
            },

            moveProducts: async (productIds, targetLocationId) => {
                const { error } = await supabase
                    .from('products')
                    .update({ location_id: targetLocationId })
                    .in('id', productIds);

                if (!error) {
                    const firstProd = get().products.find(p => p.id === productIds[0]);
                    if (firstProd && firstProd.spaceId) await get().fetchData(firstProd.spaceId);
                }
            },

            getProductsByStatus: (status) => get().products.filter(p => p.status === status),
            getProductsByLocation: (locationId) => get().products.filter(p => p.locationId === locationId),
            getProductsByCategory: (categoryId) => get().products.filter(p => (p as any).categoryId === categoryId),
            getProductsBySpace: (spaceId) => get().products.filter(p => p.spaceId === spaceId),
            getTopLevelLocations: () => get().locations.filter(l => !l.parentId),
            getChildLocations: (parentId) => get().locations.filter(l => l.parentId === parentId),

            // Filter locations by spaceId
            getLocationsBySpace: (spaceId) => get().locations.filter(loc => loc.spaceId === spaceId), // Store is already filtered by space
            getTopLevelSpaces: (spaceId) => get().getTopLevelLocations(),

            refreshStatuses: () => {
                const refreshedProducts = get().products.map(p => ({
                    ...p,
                    status: calculateStatus(p.expirationDate, !!p.useShelfLife, p.openedDate, p.shelfLifeDays)
                }));
                set({ products: refreshedProducts });
            },

            // Real-time Subscriptions
            subscribeToSpace: (spaceId: string) => {
                console.log('📡 [ProductStore] Subscribing to realtime updates for space:', spaceId);

                // Don't subscribe if already subscribed
                if (get().realtimeChannels.has(spaceId)) {
                    console.log('⚠️ [ProductStore] Already subscribed to space:', spaceId);
                    return;
                }

                // Create a combined channel for products and locations
                const channel = supabase
                    .channel(`space_changes:${spaceId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'products',
                            filter: `space_id=eq.${spaceId}`
                        },
                        (payload) => {
                            console.log('📦 [ProductStore] Product change detected:', payload.eventType);
                            // Refresh data for this space
                            get().fetchData(spaceId);
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'locations',
                            filter: `space_id=eq.${spaceId}`
                        },
                        (payload) => {
                            console.log('📁 [ProductStore] Location change detected:', payload.eventType);
                            // Refresh data for this space
                            get().fetchData(spaceId);
                        }
                    )
                    .subscribe((status) => {
                        console.log(`📡 [ProductStore] Subscription status for ${spaceId}:`, status);
                    });

                // Store the channel
                const channels = new Map(get().realtimeChannels);
                channels.set(spaceId, channel);
                set({ realtimeChannels: channels });
            },

            unsubscribeFromSpace: (spaceId: string) => {
                console.log('🚫 [ProductStore] Unsubscribing from space:', spaceId);
                const channel = get().realtimeChannels.get(spaceId);
                if (channel) {
                    supabase.removeChannel(channel);
                    const channels = new Map(get().realtimeChannels);
                    channels.delete(spaceId);
                    set({ realtimeChannels: channels });
                }
            },

            unsubscribeAll: () => {
                console.log('🚫 [ProductStore] Unsubscribing from all spaces');
                get().realtimeChannels.forEach((channel) => {
                    supabase.removeChannel(channel);
                });
                set({ realtimeChannels: new Map() });
            },
        }),
        {
            name: 'expire-track-products',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ categories: state.categories }) // Only persist custom categories
        }
    )
);
