import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import ProductFilterModal from '../components/ProductFilterModal';
import SpaceSelectModal from '../components/SpaceSelectModal';
import { Svg, Path } from 'react-native-svg';
import { ProductStatus } from '../types';

const BackArrowIcon = ({ color = "#fff", size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
    </Svg>
);

const FilterIcon = ({ color = "#fff", size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
    </Svg>
);

const SearchIcon = ({ color = "#9ca3af", size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" />
        <Path d="M21 21L16.65 16.65" />
    </Svg>
);

export default function ProductListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { status } = route.params as { status: ProductStatus | 'all' };

    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const { products, deleteProduct, batchDeleteProducts, batchUpdateProducts, batchMoveToSpace } = useProductStore();
    const { currentSpaceId } = useSpaceStore();
    const { setEditingProduct, setAddModalOpen } = useUIStore();

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Advanced Filters
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState<{ locationId: string | null, addedBy: string | null }>({
        locationId: null,
        addedBy: null
    });
    const [moveModalVisible, setMoveModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter products by current space first
    const spaceProducts = useMemo(() => {
        return products.filter((p) =>
            p.spaceId === currentSpaceId || (!p.spaceId && currentSpaceId === MY_SPACE_ID)
        );
    }, [products, currentSpaceId]);

    const filteredProducts = useMemo(() => {
        let result = spaceProducts;

        // Status filter (from route)
        if (status !== 'all') {
            result = result.filter(p => p.status === status);
        }

        // Location filter
        if (filters.locationId) {
            const childIds = useProductStore.getState().locations
                .filter(l => l.parentId === filters.locationId)
                .map(l => l.id);
            const targetIds = [filters.locationId, ...childIds];
            result = result.filter(p => targetIds.includes(p.locationId));
        }

        // Member filter
        if (filters.addedBy) {
            result = result.filter(p => p.addedBy === filters.addedBy);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }

        return result;
    }, [spaceProducts, status, filters, searchQuery]);

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setAddModalOpen(true);
    };

    const handleDelete = (id: string) => {
        deleteProduct(id);
    };

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            const next = selectedIds.filter(i => i !== id);
            setSelectedIds(next);
            if (next.length === 0) setSelectionMode(false);
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleLongPress = (id: string) => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedIds([id]);
        }
    };

    const handleBatchDelete = () => {
        Alert.alert(
            "Delete Multiple",
            `Are you sure you want to delete ${selectedIds.length} items?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await batchDeleteProducts(selectedIds);
                        setSelectionMode(false);
                        setSelectedIds([]);
                    }
                }
            ]
        );
    };

    const handleBatchOpen = async () => {
        const today = new Date().toISOString().split('T')[0];
        await batchUpdateProducts(selectedIds, { openedDate: today });
        setSelectionMode(false);
        setSelectedIds([]);
    };

    const handleBatchMove = async (targetSpaceId: string) => {
        await batchMoveToSpace(selectedIds, targetSpaceId);
        setSelectionMode(false);
        setSelectedIds([]);
        Alert.alert("Success", `Moved ${selectedIds.length} items to new space.`);
    };

    const getTitle = () => {
        switch (status) {
            case 'safe': return 'Safe Products';
            case 'expiring-soon': return 'Expiring Soon';
            case 'expired': return 'Expired Products';
            default: return 'All Products';
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'safe': return '✓';
            case 'expiring-soon': return '⏰';
            case 'expired': return '✗';
            default: return '📦';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={selectionMode ? () => { setSelectionMode(false); setSelectedIds([]); } : () => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    {selectionMode ? (
                        <Text style={{ color: colors.foreground[theme], fontWeight: '600' }}>Cancel</Text>
                    ) : (
                        <BackArrowIcon color={colors.foreground[theme]} size={18} />
                    )}
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                {selectionMode && (
                    <Text style={{ color: colors.foreground[theme], fontWeight: '600' }}>{selectedIds.length} Selected</Text>
                )}
                <TouchableOpacity
                    onPress={() => setFilterModalVisible(true)}
                    style={[styles.backBtn, (filters.locationId || filters.addedBy) && { borderColor: colors.primary[theme] }]}
                >
                    <FilterIcon color={(filters.locationId || filters.addedBy) ? colors.primary[theme] : colors.foreground[theme]} size={18} />
                </TouchableOpacity>
            </View>

            <ProductFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                currentFilters={filters}
                onApply={setFilters}
            />

            <SpaceSelectModal
                visible={moveModalVisible}
                onClose={() => setMoveModalVisible(false)}
                onSelect={handleBatchMove}
                title={`Move ${selectedIds.length} items`}
            />

            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginRight: 8 }}>{getIcon()}</Text>
                    <Text style={styles.title}>{getTitle()}</Text>
                </View>
                <Text style={styles.subtitle}>{filteredProducts.length} items</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchIcon color={colors.muted[theme]} size={18} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor={colors.muted[theme]}
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
                                onEdit={() => handleEdit(p)}
                                onDelete={() => handleDelete(p.id)}
                                selectionMode={selectionMode}
                                isSelected={selectedIds.includes(p.id)}
                                onSelect={() => toggleSelection(p.id)}
                                onLongPress={() => handleLongPress(p.id)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Batch Action Bar */}
            {selectionMode && (
                <View style={styles.batchBar}>
                    <TouchableOpacity style={styles.batchBtn} onPress={handleBatchOpen}>
                        <Text style={styles.batchBtnText}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.batchBtn} onPress={() => setMoveModalVisible(true)}>
                        <Text style={styles.batchBtnText}>Move</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.batchBtn, { backgroundColor: colors.destructive + '15' }]} onPress={handleBatchDelete}>
                        <Text style={[styles.batchBtnText, { color: colors.destructive }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.foreground[theme] },
    subtitle: { fontSize: 14, color: colors.muted[theme], marginLeft: 4 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.foreground[theme],
        marginLeft: 8,
    },
    emptyText: { textAlign: 'center', color: colors.muted[theme], marginTop: 40 },
    batchBar: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        flexDirection: 'row',
        padding: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border[theme],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    batchBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary[theme] + '15',
    },
    batchBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary[theme],
    }
});
