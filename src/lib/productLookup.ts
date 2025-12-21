'use client';

// Product lookup using Open Food Facts API (FREE)

export interface ProductInfo {
    name: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    found: boolean;
}

export async function lookupBarcode(barcode: string): Promise<ProductInfo> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );

        if (!response.ok) {
            return { name: '', found: false };
        }

        const data = await response.json();

        if (data.status === 1 && data.product) {
            const product = data.product;
            return {
                name: product.product_name || product.product_name_en || '',
                brand: product.brands || '',
                category: product.categories?.split(',')[0]?.trim() || '',
                imageUrl: product.image_front_small_url || product.image_url || '',
                found: true,
            };
        }

        return { name: '', found: false };
    } catch (error) {
        console.error('Error looking up barcode:', error);
        return { name: '', found: false };
    }
}
