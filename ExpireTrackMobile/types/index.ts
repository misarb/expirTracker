// Types for the Product Expiration Tracking App

// Re-export space types
export * from './spaces';

export type ProductStatus = 'safe' | 'expiring-soon' | 'expired';

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface Location {
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
    parentId?: string | null;
    spaceId?: string; // Which space this location belongs to
    createdBy?: string; // User who created this folder (for shared spaces)
}

export interface Product {
    id: string;
    name: string;
    locationId: string;
    spaceId: string; // Which space this product belongs to (defaults to 'my-space')
    expirationDate: string; // ISO Date String YYYY-MM-DD
    purchaseDate?: string;
    quantity?: number;
    notes?: string;
    status: ProductStatus;

    // New fields for Parity with Web
    isRecurring?: boolean;
    recurringDays?: number;
    image?: string;
    hasExpirationDate?: boolean; // If false, no expiration
    useShelfLife?: boolean; // PAO (Period After Opening)
    shelfLifeDays?: number;
    openedDate?: string; // When it was opened
    notifyTiming?: number; // Custom notification timing (days before)
    criticalDays?: number; // Days before expiry to mark as "expiring soon" (default: 3)

    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'medicine', name: 'Medicine', icon: '💊', color: '#EF4444' },
    { id: 'food', name: 'Food', icon: '🍎', color: '#F59E0B' },
    { id: 'makeup', name: 'Makeup / Skincare', icon: '💄', color: '#EC4899' },
    { id: 'baby', name: 'Baby Products', icon: '🍼', color: '#8B5CF6' },
    { id: 'household', name: 'Household', icon: '🏠', color: '#3B82F6' },
    { id: 'other', name: 'Other', icon: '📦', color: '#6B7280' },
];

export const DEFAULT_LOCATIONS: Location[] = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: '#F59E0B', spaceId: 'my-space' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: '#06B6D4', spaceId: 'my-space' },
    { id: 'medicine-cabinet', name: 'Medicine Cabinet', icon: '💊', color: '#EF4444', spaceId: 'my-space' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', color: '#8B5CF6', spaceId: 'my-space' },
    { id: 'garage', name: 'Garage', icon: '🏠', color: '#6B7280', spaceId: 'my-space' },
    { id: 'office', name: 'Office', icon: '💼', color: '#3B82F6', spaceId: 'my-space' },
];
