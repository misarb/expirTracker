/**
 * BarcodeService - Service for looking up product information from barcodes
 * Uses OpenFoodFacts API (free, open database)
 */
class BarcodeService {
    private apiUrl: string;
    private beautyApiUrl: string;
    private cache: Map<string, { data: BarcodeResult; timestamp: number }>;
    private cacheTimeout: number;

    constructor() {
        // Primary: OpenFoodFacts (food + beauty products)
        this.apiUrl = 'https://world.openfoodfacts.org/api/v2/product';
        // Fallback: OpenBeautyFacts (cosmetics, makeup, skincare)
        this.beautyApiUrl = 'https://world.openbeautyfacts.org/api/v2/product';
        this.cache = new Map();
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Get cached result for barcode
     */
    getCachedResult(barcode: string): BarcodeResult | null {
        const cached = this.cache.get(barcode);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Returning cached barcode result');
            return cached.data;
        }
        return null;
    }

    /**
     * Cache result for barcode
     */
    setCachedResult(barcode: string, data: BarcodeResult): void {
        this.cache.set(barcode, {
            data,
            timestamp: Date.now(),
        });

        // Clean old cache entries
        if (this.cache.size > 50) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
    }

    /**
     * Fetch from API with error handling
     */
    async fetchFromAPI(url: string, timeout = 10000): Promise<OpenFoodFactsProduct | null> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            console.log('Fetching from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'ExpiryTrack/1.0',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            console.log('API response status:', data.status);

            if (data.status === 0 || !data.product) {
                return null;
            }

            return data.product;
        } catch (error) {
            clearTimeout(timeoutId);
            console.log('Fetch error:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Look up product information by barcode
     */
    async lookupBarcode(barcode: string): Promise<BarcodeResult | null> {
        try {
            console.log('Looking up barcode:', barcode);

            // Check cache first
            const cached = this.getCachedResult(barcode);
            if (cached) {
                console.log('Returning cached result');
                return cached;
            }

            // Try OpenFoodFacts first (includes some beauty products)
            console.log('Trying OpenFoodFacts...');
            let product = await this.fetchFromAPI(`${this.apiUrl}/${barcode}.json`);

            // If not found, try OpenBeautyFacts (cosmetics, skincare, makeup)
            if (!product) {
                console.log('Not found in OpenFoodFacts, trying OpenBeautyFacts...');
                product = await this.fetchFromAPI(`${this.beautyApiUrl}/${barcode}.json`);
            }

            // If still not found
            if (!product) {
                console.log('Product not found in any database');
                return null;
            }

            // Extract relevant product information
            const result: BarcodeResult = {
                barcode,
                productName: this.extractProductName(product),
                brand: product.brands || null,
                quantity: product.quantity || null,
                categories: product.categories || null,
                imageUrl: product.image_url || product.image_front_url || null,
                ingredients: product.ingredients_text || null,
                nutriScore: product.nutrition_grades || null,
                allergens: product.allergens || null,
                labels: product.labels || null,
                origins: product.origins || null,
                stores: product.stores || null,
                confidence: this.calculateConfidence(product),
                database: product.brands ? 'OpenFoodFacts/BeautyFacts' : 'Unknown',
            };

            console.log('Product found:', result.productName, 'Brand:', result.brand);

            // Cache the result
            this.setCachedResult(barcode, result);

            return result;
        } catch (error) {
            console.error('Error looking up barcode:', error);
            return null;
        }
    }

    /**
     * Extract the best product name from various fields
     */
    extractProductName(product: OpenFoodFactsProduct): string | null {
        const nameFields = [
            product.product_name_fr,
            product.product_name_en,
            product.product_name,
            product.generic_name_fr,
            product.generic_name_en,
            product.generic_name,
            product.abbreviated_product_name,
        ];

        for (const name of nameFields) {
            if (name && typeof name === 'string' && name.trim().length > 0) {
                return name.trim();
            }
        }

        return null;
    }

    /**
     * Calculate confidence score for the product data
     */
    calculateConfidence(product: OpenFoodFactsProduct): number {
        let score = 0;
        let maxScore = 0;

        maxScore += 30;
        if (product.product_name || product.product_name_fr || product.product_name_en) {
            score += 30;
        }

        maxScore += 15;
        if (product.brands) {
            score += 15;
        }

        maxScore += 10;
        if (product.image_url || product.image_front_url) {
            score += 10;
        }

        maxScore += 10;
        if (product.categories) {
            score += 10;
        }

        maxScore += 10;
        if (product.quantity) {
            score += 10;
        }

        maxScore += 10;
        if (product.ingredients_text) {
            score += 10;
        }

        maxScore += 5;
        if (product.nutrition_grades) {
            score += 5;
        }

        maxScore += 5;
        if (product.labels) {
            score += 5;
        }

        maxScore += 5;
        if (product.origins) {
            score += 5;
        }

        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('Barcode cache cleared');
    }

    /**
     * Validate barcode format
     */
    isValidBarcode(barcode: string): boolean {
        const cleaned = barcode.replace(/\D/g, '');
        const validLengths = [8, 12, 13, 14];
        if (!validLengths.includes(cleaned.length)) {
            return false;
        }

        if (cleaned.length === 13) {
            return this.validateEAN13(cleaned);
        }

        if (cleaned.length === 12) {
            return this.validateUPCA(cleaned);
        }

        return true;
    }

    /**
     * Validate EAN-13 checksum
     */
    validateEAN13(ean: string): boolean {
        if (ean.length !== 13) return false;

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(ean[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
        }

        const checksum = (10 - (sum % 10)) % 10;
        return checksum === parseInt(ean[12]);
    }

    /**
     * Validate UPC-A checksum
     */
    validateUPCA(upc: string): boolean {
        if (upc.length !== 12) return false;

        let sum = 0;
        for (let i = 0; i < 11; i++) {
            const digit = parseInt(upc[i]);
            sum += i % 2 === 0 ? digit * 3 : digit;
        }

        const checksum = (10 - (sum % 10)) % 10;
        return checksum === parseInt(upc[11]);
    }
}

// Types for OpenFoodFacts API response
interface OpenFoodFactsProduct {
    product_name?: string;
    product_name_fr?: string;
    product_name_en?: string;
    generic_name?: string;
    generic_name_fr?: string;
    generic_name_en?: string;
    abbreviated_product_name?: string;
    brands?: string;
    quantity?: string;
    categories?: string;
    image_url?: string;
    image_front_url?: string;
    ingredients_text?: string;
    nutrition_grades?: string;
    allergens?: string;
    labels?: string;
    origins?: string;
    stores?: string;
}

// Result type
export interface BarcodeResult {
    barcode: string;
    productName: string | null;
    brand: string | null;
    quantity: string | null;
    categories: string | null;
    imageUrl: string | null;
    ingredients: string | null;
    nutriScore: string | null;
    allergens: string | null;
    labels: string | null;
    origins: string | null;
    stores: string | null;
    confidence: number;
    database: string;
}

export default new BarcodeService();
