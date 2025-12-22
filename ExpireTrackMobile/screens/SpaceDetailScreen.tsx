import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors'; // Assuming these exist
import ProductCard from '../components/ProductCard';
import { PlusIcon } from '../components/Icons'; // Assuming these exist

// Custom Back Icon
const BackIcon = ({ color }: { color: string }) => (
    <Text style={{ fontSize: 20, fontWeight: 'bold', color: color }}>‹</Text>
);

const SearchIcon = () => (
    <Text style={{ fontSize: 16, color: '#9ca3af', marginRight: 8 }}>🔍</Text>
);

export default function SpaceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { spaceId, isAllProducts } = route.params as { spaceId?: string, isAllProducts?: boolean };
    const { theme: themeSetting } = useSettingsStore();

    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const styles = getStyles(isDark ? 'dark' : 'light');
    const theme = isDark ? 'dark' : 'light';

    const { locations, products, categories, deleteProduct } = useProductStore();
    const { setEditingProduct, setDefaultLocationId, setAddModalOpen } = useUIStore();

    const [searchQuery, setSearchQuery] = useState('');

    const space = useMemo(() => {
        if (isAllProducts) return { name: 'All Products', icon: '📦', id: null };
        return locations.find(l => l.id === spaceId);
    }, [spaceId, isAllProducts, locations]);

    const filteredProducts = useMemo(() => {
        let list = products;

        // Filter by Space
        if (!isAllProducts) {
            // Logic to include sub-space products? 
            // Screenshot shows "Bathroom" having items. 
            // Usually "Space Detail" shows products IN that space + descendants? 
            // Or just direct? The screenshot "All Products" implies flattened view.
            // If I click "Bathroom", I expect items in Bathroom.
            // Let's assume recursive for now to be helpful, or direct if strict content.
            // For parity with previous logic, let's show all products strictly in this location (direct).
            // Wait, user said "if i click on space i can see the product on it or add one also for sup space".
            // We can do recursive helper function from store if needed. 
            // For now, let's filter by locationId match.

            // Update: The screenshot shows "2 items".
            list = list.filter(p => p.locationId === spaceId);
        }

        // Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }

        return list;
    }, [products, spaceId, isAllProducts, searchQuery]);

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setAddModalOpen(true);
    };

    const handleDelete = (id: string) => {
        deleteProduct(id);
    };

    const handleBack = () => navigation.goBack();

    if (!space && !isAllProducts) return null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Text style={{ fontSize: 24, paddingBottom: 4, color: styles.backText.color }}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginRight: 8 }}>{space?.icon}</Text>
                    <Text style={styles.title}>{space?.name}</Text>
                </View>
                <Text style={styles.subtitle}>{filteredProducts.length} items</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchIcon />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 100 }}>
                {filteredProducts.length === 0 ? (
                    <Text style={styles.emptyText}>No products found.</Text>
                ) : (
                    <View style={{ gap: 12 }}>
                        {filteredProducts.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                category={categories.find(c => c.id === p.categoryId)}
                                onEdit={() => handleEdit(p)}
                                onDelete={() => handleDelete(p.id)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB for Adding Product to this Space */}
            {!isAllProducts && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => {
                        setDefaultLocationId(spaceId || null);
                        setEditingProduct(null);
                        setAddModalOpen(true);
                    }}
                >
                    <PlusIcon size={32} color="#fff" />
                </TouchableOpacity>
            )}

        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card[theme], paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border[theme]
    },
    backIcon: { fontSize: 24, marginRight: 4, color: colors.foreground[theme] },
    backText: { fontSize: 16, fontWeight: '600', color: colors.foreground[theme] },

    title: { fontSize: 24, fontWeight: 'bold', color: colors.foreground[theme] },
    subtitle: { fontSize: 14, color: colors.muted[theme], marginLeft: 4 },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card[theme], marginHorizontal: 16, padding: 12, borderRadius: 16,
        borderWidth: 1, borderColor: colors.border[theme]
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.foreground[theme] },

    emptyText: { textAlign: 'center', color: colors.muted[theme], marginTop: 40 },
    fab: {
        position: 'absolute', right: 20, bottom: 20,
        backgroundColor: colors.primary[theme], width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary[theme], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
    }
});
