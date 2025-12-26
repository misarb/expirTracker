import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { TrashIcon, PlusIcon, FolderIcon } from '../components/Icons';
import { Svg, Path } from 'react-native-svg';
import DeleteSpaceModal from '../components/DeleteSpaceModal';
import ProductCard from '../components/ProductCard';

const PASTEL_COLORS = [
    { bg: '#e0f2fe', border: '#bae6fd', icon: '#0284c7' }, // Light Blue
    { bg: '#fce7f3', border: '#fbcfe8', icon: '#db2777' }, // Light Pink
    { bg: '#fef3c7', border: '#fde68a', icon: '#d97706' }, // Light Amber
    { bg: '#dcfce7', border: '#bbf7d0', icon: '#16a34a' }, // Light Green
    { bg: '#e0e7ff', border: '#c7d2fe', icon: '#6366f1' }, // Light Indigo
];

// Colorful Folder Icon Component (same as in AddSpaceModal)
const ColoredFolderIcon = ({ size = 24, color }: { size?: number, color: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
        <Path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" />
    </Svg>
);

// Colorful folder definitions (must match AddSpaceModal)
const COLORED_FOLDERS = [
    { id: 'folder-blue', color: '#3b82f6' },
    { id: 'folder-green', color: '#10b981' },
    { id: 'folder-yellow', color: '#f59e0b' },
    { id: 'folder-red', color: '#ef4444' },
    { id: 'folder-purple', color: '#8b5cf6' },
    { id: 'folder-pink', color: '#ec4899' },
    { id: 'folder-indigo', color: '#6366f1' },
    { id: 'folder-teal', color: '#14b8a6' },
];

export default function SpacesScreen() {
    const navigation = useNavigation();
    const {
        locations,
        getTopLevelLocations,
        getChildLocations,
        getProductsByLocation,
        products,
        deleteProduct,
        getLocationsBySpace,
        deleteLocation
    } = useProductStore();
    const { currentSpaceId } = useSpaceStore();
    const { setAddModalOpen, setDefaultLocationId, setEditingProduct, setAddSpaceModalOpen, setAddSpaceParentId } = useUIStore();
    const { theme: themeSetting } = useSettingsStore();

    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const styles = getStyles(isDark ? 'dark' : 'light');
    const theme = isDark ? 'dark' : 'light';

    // Filter products by current space
    const spaceProducts = useMemo(() => {
        return products.filter((p) =>
            p.spaceId === currentSpaceId || (!p.spaceId && currentSpaceId === MY_SPACE_ID)
        );
    }, [products, currentSpaceId]);

    // Get locations for current space
    const spaceLocations = useMemo(() => {
        return locations.filter(l => l.spaceId === currentSpaceId);
    }, [locations, currentSpaceId]);

    const topLevelSpaces = useMemo(() => {
        return spaceLocations.filter(l => !l.parentId);
    }, [spaceLocations]);

    const [expandedIds, setExpandedIds] = useState<string[]>([]);



    // Delete Space Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleDeleteSpacePress = (id: string) => {
        setDeleteSpaceId(id);
        setIsDeleteModalOpen(true);
    };

    const openAddSpaceModal = (parentId?: string) => {
        setAddSpaceParentId(parentId || null);
        setAddSpaceModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteSpaceId) return;
        await deleteLocation(deleteSpaceId);
        setIsDeleteModalOpen(false);
        setDeleteSpaceId(null);
    };

    const navigateToDetail = (spaceId?: string, isAllProducts?: boolean) => {
        // @ts-ignore - typed navigation setup separate
        navigation.navigate('SpaceDetail', { spaceId, isAllProducts });
    };

    const SpaceCard = ({ space, index, level = 0 }: any) => {
        const childSpaces = spaceLocations.filter(l => l.parentId === space.id);
        const directProducts = spaceProducts.filter(p => p.locationId === space.id);
        const isExpanded = expandedIds.includes(space.id);
        const hasChildren = childSpaces.length > 0;

        // Cycle colors
        const color = PASTEL_COLORS[index % PASTEL_COLORS.length];

        const expiringCount = directProducts.filter(p => p.status === 'expiring-soon').length;

        return (
            <View style={{ marginBottom: 12 }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigateToDetail(space.id)}
                    style={[
                        styles.spaceCard,
                        { backgroundColor: color.bg, borderColor: color.border }
                    ]}
                >
                    {/* Header Row */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                            {space.icon.startsWith('folder-') ? (
                                <View style={{ marginRight: 12 }}>
                                    <ColoredFolderIcon
                                        size={32}
                                        color={COLORED_FOLDERS.find(f => f.id === space.icon)?.color || '#8b5cf6'}
                                    />
                                </View>
                            ) : (
                                <Text style={{ fontSize: 32, marginRight: 12 }}>{space.icon}</Text>
                            )}
                            <View>
                                <Text style={styles.spaceName}>{space.name}</Text>
                                <Text style={styles.spaceDesc}>{space.description || (hasChildren ? `${childSpaces.length} sub-spaces` : 'No description')}</Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            {/* Expand Button (Chevron) - First from left */}
                            {hasChildren && (
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleExpand(space.id) }} style={[styles.actionBtn, { backgroundColor: 'rgba(100,100,100,0.1)' }]}>
                                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.foreground[theme] }}>{isExpanded ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                            )}
                            {/* Add Sub-Location */}
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); openAddSpaceModal(space.id) }} style={[styles.actionBtn, { backgroundColor: '#818cf8' }]}>
                                <PlusIcon size={16} color="#fff" />
                            </TouchableOpacity>
                            {/* Delete */}
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteSpacePress(space.id) }} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
                                <TrashIcon size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Badges Row */}
                    {expiringCount > 0 && (
                        <View style={{ marginTop: 12, flexDirection: 'row' }}>
                            <View style={styles.yellowBadge}>
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>{expiringCount} 🟡</Text>
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Expanded Content (Sub-Locations Only) */}
                {isExpanded && (
                    <View style={styles.expandedContainer}>
                        <View style={styles.expandedInner}>
                            {childSpaces.map((child, i) => (
                                <TouchableOpacity
                                    key={child.id}
                                    style={[
                                        styles.subItemCard,
                                        i === childSpaces.length - 1 && styles.subItemCardLast
                                    ]}
                                    onPress={() => navigateToDetail(child.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ marginRight: 12, justifyContent: 'center' }}>
                                        {child.icon.startsWith('folder-') ? (
                                            <ColoredFolderIcon
                                                size={32}
                                                color={COLORED_FOLDERS.find(f => f.id === child.icon)?.color || '#8b5cf6'}
                                            />
                                        ) : (
                                            <Text style={{ fontSize: 28 }}>{child.icon}</Text>
                                        )}
                                    </View>
                                    <View style={styles.subContent}>
                                        <Text style={styles.subTitle}>{child.name}</Text>
                                        <Text style={styles.subDesc}>{getProductsByLocation(child.id).length} products</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => { e.stopPropagation(); handleDeleteSpacePress(child.id); }}
                                        style={styles.subDeleteBtn}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <TrashIcon size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Global Inventory Card */}
                <TouchableOpacity style={styles.globalCard} onPress={() => navigateToDetail(undefined, true)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={styles.iconBox}>
                            <Text style={{ fontSize: 32 }}>🏢</Text>
                        </View>
                        <View style={styles.countBadge}>
                            <Text style={{ fontWeight: 'bold', color: '#171717' }}>{spaceProducts.length}</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.globalTitle}>All Products</Text>
                        <Text style={styles.globalDesc}>View Global Inventory</Text>
                    </View>
                </TouchableOpacity>

                {/* Locations List */}
                <View style={{ marginTop: 20 }}>
                    {topLevelSpaces.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📂</Text>
                            <Text style={styles.emptyTitle}>No Locations Yet</Text>
                            <Text style={styles.emptyText}>Create your first location (like Fridge or Pantry) to start organizing this space.</Text>
                        </View>
                    ) : (
                        topLevelSpaces.map((space, index) => (
                            <SpaceCard key={space.id} space={space} index={index} />
                        ))
                    )}
                </View>

                {/* Add New Location Button */}
                <TouchableOpacity style={styles.addSpaceCard} onPress={() => openAddSpaceModal()}>
                    <View style={styles.addIconCircle}>
                        <PlusIcon size={24} color={colors.primary[theme]} />
                    </View>
                    <Text style={styles.addSpaceText}>Add New Location</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>



            <DeleteSpaceModal
                visible={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteSpaceId(null); }}
                onConfirm={handleConfirmDelete}
                spaceId={deleteSpaceId || ''}
                spaceName={locations.find(l => l.id === deleteSpaceId)?.name || ''}
                spaceIcon={locations.find(l => l.id === deleteSpaceId)?.icon || '📁'}
            />
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    content: { padding: 16 },

    // Global Card
    globalCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    iconBox: {
        width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    },
    countBadge: {
        backgroundColor: colors.background[theme], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        borderWidth: 1, borderColor: colors.border[theme]
    },
    globalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground[theme] },
    globalDesc: { fontSize: 14, color: colors.muted[theme], marginTop: 4 },

    // Space Card
    spaceCard: {
        borderRadius: 20,
        padding: 16,
        paddingVertical: 20,
        borderWidth: 1,
        // Background color is overridden inline by PASTEL_COLORS, but we might want to adjust opacity for dark mode
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    spaceName: { fontSize: 18, fontWeight: 'bold', color: '#171717' }, // Keep dark text for pastel cards? Or adapt? Pastel cards usually keep dark text.
    spaceDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    yellowBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },

    // Expanded Container
    expandedContainer: {
        marginLeft: 8,
        marginTop: 8,
        marginBottom: 12,
        paddingLeft: 16,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary[theme] + '40',
    },
    expandedInner: {
        backgroundColor: colors.background[theme],
        borderRadius: 16,
        padding: 8,
        paddingTop: 8,
    },

    // Sub Items
    subItemCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border[theme],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    subItemCardLast: {
        marginBottom: 0,
    },
    subIconBox: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary[theme],
        borderRadius: 12,
        marginRight: 12,
    },
    subContent: {
        flex: 1,
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 2,
    },
    subDesc: {
        fontSize: 13,
        color: colors.muted[theme]
    },
    subDeleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Add Space Card
    addSpaceCard: {
        marginTop: 10,
        height: 120,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.border[theme],
        borderStyle: 'dashed',
        backgroundColor: colors.card[theme], // Was #fff
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIconCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondary[theme], alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    addSpaceText: { fontSize: 16, fontWeight: '600', color: colors.muted[theme] },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.foreground[theme], marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.muted[theme], textAlign: 'center', lineHeight: 20 },
});
