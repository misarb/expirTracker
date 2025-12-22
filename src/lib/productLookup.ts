'use client';

// Product lookup using BarcodeService (OpenFoodFacts + OpenBeautyFacts)
import barcodeService, { BarcodeResult } from './barcodeService';

export interface ProductInfo {
    name: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    found: boolean;
    quantity?: string;
    ingredients?: string;
    confidence?: number;
}

export async function lookupBarcode(barcode: string): Promise<ProductInfo> {
    try {
        console.log('Looking up barcode:', barcode);

        // Validate barcode format first
        if (!barcodeService.isValidBarcode(barcode)) {
            console.log('Invalid barcode format:', barcode);
            return { name: '', found: false };
        }

        // Use the BarcodeService for lookup (with caching and fallbacks)
        const result: BarcodeResult | null = await barcodeService.lookupBarcode(barcode);

        if (result && result.productName) {
            console.log('Product found:', result.productName);
            return {
                name: result.productName,
                brand: result.brand || undefined,
                category: result.categories?.split(',')[0]?.trim() || undefined,
                imageUrl: result.imageUrl || undefined,
                quantity: result.quantity || undefined,
                ingredients: result.ingredients || undefined,
                confidence: result.confidence,
                found: true,
            };
        }

        console.log('Product not found in database');
        return { name: '', found: false };
    } catch (error) {
        console.error('Error looking up barcode:', error);
        return { name: '', found: false };
    }
}

// Export clear cache function for testing
export function clearBarcodeCache(): void {
    barcodeService.clearCache();
}
