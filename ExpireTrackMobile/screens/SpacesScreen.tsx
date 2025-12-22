import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { TrashIcon, PlusIcon, FolderIcon } from '../components/Icons';
import DeleteSpaceModal from '../components/DeleteSpaceModal';
import ProductCard from '../components/ProductCard';

const PASTEL_COLORS = [
    { bg: '#e0f2fe', border: '#bae6fd' }, // Light Blue
    { bg: '#fce7f3', border: '#fbcfe8' }, // Light Pink
    { bg: '#fef3c7', border: '#fde68a' }, // Light Amber
    { bg: '#dcfce7', border: '#bbf7d0' }, // Light Green
    { bg: '#e0e7ff', border: '#c7d2fe' }, // Light Indigo
];

export default function SpacesScreen() {
    const navigation = useNavigation();
    const { locations, getTopLevelSpaces, getChildSpaces, getProductsByLocation, products, categories, deleteProduct } = useProductStore();
    const { setAddModalOpen, setDefaultLocationId, setEditingProduct, setAddSpaceModalOpen, setAddSpaceParentId } = useUIStore();
    const { theme: themeSetting } = useSettingsStore();

    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const styles = getStyles(isDark ? 'dark' : 'light');
    const theme = isDark ? 'dark' : 'light';

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

    const navigateToDetail = (spaceId?: string, isAllProducts?: boolean) => {
        // @ts-ignore - typed navigation setup separate
        navigation.navigate('SpaceDetail', { spaceId, isAllProducts });
    };

    const SpaceCard = ({ space, index, level = 0 }: any) => {
        const childSpaces = getChildSpaces(space.id);
        const directProducts = products.filter(p => p.locationId === space.id);
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
                            <Text style={{ fontSize: 32, marginRight: 12 }}>{space.icon}</Text>
                            <View>
                                <Text style={styles.spaceName}>{space.name}</Text>
                                <Text style={styles.spaceDesc}>{space.description || (hasChildren ? `${childSpaces.length} sub-spaces` : 'No description')}</Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteSpacePress(space.id) }} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
                                <TrashIcon size={16} color="#ef4444" />
                            </TouchableOpacity>
                            {/* Add Sub-Space handled by opening modal */}
                            <TouchableOpacity onPress={(e) => { e.stopPropagation(); openAddSpaceModal(space.id) }} style={[styles.actionBtn, { backgroundColor: '#818cf8', marginRight: 4 }]}>
                                <PlusIcon size={16} color="#fff" />
                            </TouchableOpacity>
                            {/* Expand Button (Chevron or similar to toggle sub-spaces) */}
                            {hasChildren && (
                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleExpand(space.id) }} style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{isExpanded ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                            )}
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

                {/* Expanded Content (Sub-Spaces Only) */}
                {isExpanded && (
                    <View style={{ marginLeft: 16, marginTop: -4, marginBottom: 8, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#e5e7eb' }}>
                        {childSpaces.map((child, i) => (
                            <TouchableOpacity key={child.id} style={styles.subItemCard} onPress={() => navigateToDetail(child.id)}>
                                <View style={styles.subIconBox}>
                                    <Text style={{ fontSize: 18 }}>{child.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subTitle}>{child.name}</Text>
                                    <Text style={styles.subDesc}>{getProductsByLocation(child.id).length} products</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteSpacePress(child.id)} style={{ marginRight: 8 }}>
                                    <TrashIcon size={14} color="#ef4444" />
                                </TouchableOpacity>
                                <FolderIcon size={16} color="#9ca3af" />
                            </TouchableOpacity>
                        ))}
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
                            <Text style={{ fontWeight: 'bold', color: '#171717' }}>{products.length}</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.globalTitle}>All Products</Text>
                        <Text style={styles.globalDesc}>View Global Inventory</Text>
                    </View>
                </TouchableOpacity>

                {/* Spaces List */}
                <View style={{ marginTop: 20 }}>
                    {getTopLevelSpaces().map((space, index) => (
                        <SpaceCard key={space.id} space={space} index={index} />
                    ))}
                </View>

                {/* Add New Space Button */}
                <TouchableOpacity style={styles.addSpaceCard} onPress={() => openAddSpaceModal()}>
                    <View style={styles.addIconCircle}>
                        <PlusIcon size={24} color={colors.primary[theme]} />
                    </View>
                    <Text style={styles.addSpaceText}>Add New Space</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>



            <DeleteSpaceModal
                visible={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                spaceId={deleteSpaceId}
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

    // Sub Items
    subItemCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    subIconBox: {
        width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background[theme], borderRadius: 10, marginRight: 12,
    },
    subTitle: { fontSize: 15, fontWeight: '600', color: colors.foreground[theme] },
    subDesc: { fontSize: 12, color: colors.muted[theme] },

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
});
