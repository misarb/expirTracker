import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, useColorScheme } from 'react-native';
import { useProductStore } from '../store/productStore';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing, borderRadius } from '../theme/colors';
import { TrashIcon, ChevronDownIcon, CheckIcon } from './Icons';

const { height, width } = Dimensions.get('window');

interface DeleteSpaceModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (migrationData?: { action: string, targetSpaceId?: string, selectedIds?: string[] }) => void;
    spaceId: string;
    spaceName: string;
    spaceIcon: string;
}

export default function DeleteSpaceModal({ visible, onClose, onConfirm, spaceId, spaceName, spaceIcon }: DeleteSpaceModalProps) {
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const { products, getProductsBySpace, getProductsByLocation, locations } = useProductStore();
    const { spaces, currentSpaceId } = useSpaceStore();

    const [action, setAction] = useState<'delete' | 'move-all' | 'keep-some'>('delete');
    const [targetSpaceId, setTargetSpaceId] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Check if spaceId is actually a location (sub-space) or a top-level space
    const isLocation = locations.some(loc => loc.id === spaceId);

    const productsInSpace = useMemo(() => {
        if (isLocation) {
            // It's a location/sub-space - get products by locationId
            return getProductsByLocation(spaceId);
        } else {
            // It's a top-level space - get products by spaceId
            return getProductsBySpace(spaceId);
        }
    }, [products, spaceId, isLocation]);
    const otherSpaces = [
        { id: MY_SPACE_ID, name: 'My Personal Space', icon: '👤' },
        ...spaces.map(s => ({ id: s.id, name: s.name, icon: s.icon || '🏠' }))
    ].filter(s => s.id !== spaceId);

    useEffect(() => {
        if (visible) {
            setAction('delete');
            setTargetSpaceId(null);
            setSelectedProductIds([]);
            setIsDropdownOpen(false);
        }
    }, [visible]);



    const handleConfirm = () => {
        if ((action === 'move-all' || action === 'keep-some') && !targetSpaceId) {
            Alert.alert("Target Space Required", "Please select where to move your items.");
            return;
        }

        if (action === 'keep-some' && selectedProductIds.length === 0) {
            Alert.alert("No Items Selected", "You chose to keep some items but selected none. Do you want to delete everything instead?", [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete All', style: 'destructive', onPress: () => onConfirm({ action: 'delete' }) }
            ]);
            return;
        }

        onConfirm({
            action,
            targetSpaceId: targetSpaceId || undefined,
            selectedIds: action === 'move-all' ? productsInSpace.map(p => p.id) : selectedProductIds
        });
    };

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
                <View style={styles.content}>
                    {/* Handle bar for visual cue */}
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <TrashIcon size={24} color={colors.destructive} />
                        </View>
                        <View>
                            <Text style={styles.title}>Delete Space</Text>
                            <Text style={styles.subtitle}>{spaceIcon} {spaceName}</Text>
                        </View>
                    </View>

                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            This will permanantly delete the space. What should we do with the <Text style={{ fontWeight: '700' }}>{productsInSpace.length} products</Text> inside?
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
                        <View style={styles.optionsList}>
                            {/* Delete All Option */}
                            <TouchableOpacity
                                style={[styles.optionCard, action === 'delete' && styles.optionSelectedDelete]}
                                onPress={() => setAction('delete')}
                            >
                                <View style={[styles.radio, action === 'delete' && styles.radioActiveDelete]}>
                                    {action === 'delete' && <View style={styles.radioInner} />}
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>Delete everything</Text>
                                    <Text style={styles.optionSub}>Permanently remove all products and history</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Move All Option */}
                            <TouchableOpacity
                                style={[styles.optionCard, action === 'move-all' && styles.optionSelectedMove]}
                                onPress={() => setAction('move-all')}
                            >
                                <View style={[styles.radio, action === 'move-all' && styles.radioActiveMove]}>
                                    {action === 'move-all' && <View style={styles.radioInner} />}
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>Keep all products</Text>
                                    <Text style={styles.optionSub}>Move everything to another space</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Keep Some Option */}
                            <TouchableOpacity
                                style={[styles.optionCard, action === 'keep-some' && styles.optionSelectedKeep]}
                                onPress={() => setAction('keep-some')}
                            >
                                <View style={[styles.radio, action === 'keep-some' && styles.radioActiveKeep]}>
                                    {action === 'keep-some' && <View style={styles.radioInner} />}
                                </View>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionTitle}>Choose what to keep</Text>
                                    <Text style={styles.optionSub}>Select specific items to save</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {(action === 'move-all' || action === 'keep-some') && (
                            <View style={styles.migrationSection}>
                                <Text style={styles.sectionLabel}>Move items to:</Text>
                                <TouchableOpacity
                                    style={styles.selector}
                                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <Text style={styles.selectorText}>
                                        {targetSpaceId
                                            ? otherSpaces.find(s => s.id === targetSpaceId)?.icon + ' ' + otherSpaces.find(s => s.id === targetSpaceId)?.name
                                            : "Select Target Space..."
                                        }
                                    </Text>
                                    <ChevronDownIcon size={16} color={colors.muted[theme]} />
                                </TouchableOpacity>

                                {isDropdownOpen && (
                                    <View style={styles.dropdown}>
                                        {otherSpaces.map(s => (
                                            <TouchableOpacity
                                                key={s.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setTargetSpaceId(s.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{s.icon} {s.name}</Text>
                                                {targetSpaceId === s.id && <CheckIcon size={14} color={colors.primary[theme]} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {action === 'keep-some' && (
                                    <View style={styles.productSelection}>
                                        <Text style={styles.sectionLabel}>Select items to save:</Text>
                                        {productsInSpace.length === 0 ? (
                                            <View style={styles.emptyItems}>
                                                <Text style={styles.emptyItemsText}>No products found in this space.</Text>
                                            </View>
                                        ) : (
                                            productsInSpace.map(p => (
                                                <TouchableOpacity
                                                    key={p.id}
                                                    style={[styles.productItem, selectedProductIds.includes(p.id) && styles.productItemActive]}
                                                    onPress={() => toggleProductSelection(p.id)}
                                                >
                                                    <View style={[styles.checkbox, selectedProductIds.includes(p.id) && styles.checkboxActive]}>
                                                        {selectedProductIds.includes(p.id) && <CheckIcon size={12} color="#fff" />}
                                                    </View>
                                                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                                                    <Text style={[styles.keepBadge, { color: selectedProductIds.includes(p.id) ? colors.status.safe : colors.destructive }]}>
                                                        {selectedProductIds.includes(p.id) ? 'Keep' : 'Delete'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: action === 'delete' ? colors.destructive : colors.primary[theme] }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>
                                {action === 'delete' ? 'Delete Permanently' : 'Confirm & Move'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: colors.card[theme],
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: height * 0.9,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: colors.border[theme],
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.destructive + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.foreground[theme],
    },
    subtitle: {
        fontSize: 14,
        color: colors.muted[theme],
        marginTop: 2,
    },
    warningBox: {
        backgroundColor: colors.secondary[theme],
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    warningText: {
        fontSize: 14,
        color: colors.foreground[theme],
        lineHeight: 20,
    },
    scrollArea: {
        maxHeight: height * 0.5,
    },
    optionsList: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.background[theme],
        borderWidth: 1.5,
        borderColor: colors.border[theme],
    },
    optionSelectedDelete: {
        borderColor: colors.destructive,
        backgroundColor: colors.destructive + '05',
    },
    optionSelectedMove: {
        borderColor: colors.primary[theme],
        backgroundColor: colors.primary[theme] + '05',
    },
    optionSelectedKeep: {
        borderColor: colors.status.safe,
        backgroundColor: colors.status.safe + '05',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border[theme],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    radioActiveDelete: { borderColor: colors.destructive },
    radioActiveMove: { borderColor: colors.primary[theme] },
    radioActiveKeep: { borderColor: colors.status.safe },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'currentColor', // Will be set by parent borderColor or similar
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground[theme],
    },
    optionSub: {
        fontSize: 12,
        color: colors.muted[theme],
        marginTop: 2,
    },
    migrationSection: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: colors.border[theme],
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 10,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.background[theme],
        borderWidth: 1,
        borderColor: colors.border[theme],
        marginBottom: 8,
    },
    selectorText: {
        color: colors.foreground[theme],
        fontWeight: '500',
    },
    dropdown: {
        backgroundColor: colors.background[theme],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border[theme],
        overflow: 'hidden',
        marginBottom: 16,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme],
    },
    dropdownItemText: {
        color: colors.foreground[theme],
    },
    productSelection: {
        marginTop: 20,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.background[theme],
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    productItemActive: {
        borderColor: colors.status.safe,
        backgroundColor: colors.status.safe + '05',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.border[theme],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: colors.status.safe,
        borderColor: colors.status.safe,
    },
    productName: {
        flex: 1,
        color: colors.foreground[theme],
        fontSize: 14,
        fontWeight: '500',
    },
    keepBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyItems: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background[theme],
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    emptyItemsText: {
        color: colors.muted[theme],
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border[theme],
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border[theme],
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: colors.muted[theme],
        fontWeight: '600',
    },
    confirmBtn: {
        flex: 1.5,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});


