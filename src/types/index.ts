// Types for the Product Expiration Tracking App

export type ProductStatus = 'safe' | 'expiring-soon' | 'expired';

export type CategoryType =
    | 'medicine'
    | 'food'
    | 'makeup'
    | 'baby'
    | 'household'
    | 'other';

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
}

export interface Product {
    id: string;
    name: string;
    categoryId: string;
    locationId: string;
    expirationDate: string; // ISO date string
    purchaseDate?: string;
    quantity?: number;
    notes?: string;
    status: ProductStatus;
    isRecurring?: boolean;
    recurringDays?: number; // Days between expiration and new product
    image?: string; // Base64 string of the product image
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
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: '#F59E0B', description: 'Fridge, pantry, countertops' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: '#06B6D4', description: 'Toiletries, skincare' },
    { id: 'medicine-cabinet', name: 'Medicine Cabinet', icon: '💊', color: '#EF4444', description: 'Medicines, first aid' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', color: '#8B5CF6', description: 'Personal items' },
    { id: 'garage', name: 'Garage', icon: '🏠', color: '#6B7280', description: 'Tools, supplies' },
    { id: 'office', name: 'Office', icon: '💼', color: '#3B82F6', description: 'Office supplies' },
];
