import React, { useState, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useProductStore } from '../store/productStore';
import { colors, spacing, borderRadius } from '../theme/colors';
import { TrashIcon } from './Icons';

interface DeleteSpaceModalProps {
    visible: boolean;
    onClose: () => void;
    spaceId: string | null;
}

export default function DeleteSpaceModal({ visible, onClose, spaceId }: DeleteSpaceModalProps) {
    const { locations, deleteLocation, products, moveProducts } = useProductStore();
    const [action, setAction] = useState<'delete' | 'move-all' | 'keep-some'>('delete');
    const [targetSpaceId, setTargetSpaceId] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Reset state on open
    React.useEffect(() => {
        if (visible) {
            setAction('delete');
            setTargetSpaceId(null);
            setSelectedProductIds([]);
            setIsDropdownOpen(false);
        }
    }, [visible, spaceId]);

    const space = locations.find(l => l.id === spaceId);
    if (!space) return null;

    // Derived Data
    const productsInSpace = products.filter(p => p.locationId === spaceId);
    const subSpaces = locations.filter(l => l.parentId === spaceId);
    const otherSpaces = locations.filter(l => l.id !== spaceId && !l.parentId?.startsWith(spaceId || '')); // Simple check to avoid moving to children (infinite loop potential if not handled, but valid for now)

    const handleDelete = () => {
        if (!spaceId) return;

        if (action === 'delete') {
            deleteLocation(spaceId); // Store logic must handle cascading delete
            onClose();
        } else if (action === 'move-all') {
            if (!targetSpaceId) {
                Alert.alert("Target Space Required", "Please select a space to move products to.");
                return;
            }
            // Move all
            const productIds = productsInSpace.map(p => p.id);
            moveProducts(productIds, targetSpaceId);
            deleteLocation(spaceId);
            onClose();
        } else if (action === 'keep-some') {
            if (!targetSpaceId) {
                Alert.alert("Target Space Required", "Please select a space to move kept products to.");
                return;
            }
            // Move selected
            moveProducts(selectedProductIds, targetSpaceId);
            // Delete rest implicitly by deleting location? 
            // Wait, if we choose which to KEEP, we move them. The rest are deleted with the location.
            deleteLocation(spaceId);
            onClose();
        }
    };

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const selectAllProducts = () => setSelectedProductIds(productsInSpace.map(p => p.id));
    const selectNoneProducts = () => setSelectedProductIds([]);

    const getButtonColor = () => {
        if (action === 'delete') return '#ef4444'; // Red
        if (action === 'move-all') return '#6366f1'; // Indigo/Blue
        if (action === 'keep-some') return '#34d399'; // Green/Emerald
        return '#ef4444';
    };

    const getButtonText = () => {
        if (action === 'delete') return 'Delete All';
        if (action === 'move-all') return 'Move & Delete';
        if (action === 'keep-some') return 'Keep & Delete';
        return 'Delete';
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <TrashIcon size={24} color="#ef4444" />
                        </View>
                        <View>
                            <Text style={styles.title}>Delete Space</Text>
                            <Text style={styles.subtitle}>{space.icon} {space.name}</Text>
                        </View>
                    </View>

                    {/* Warning Box */}
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            <Text style={{ fontWeight: 'bold' }}>{productsInSpace.length}</Text> products in this space{'\n'}
                            <Text style={{ fontWeight: 'bold' }}>{subSpaces.length}</Text> sub-spaces will also be deleted
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                            {/* Option 1: Delete Everything */}
                            <TouchableOpacity style={[styles.optionCard, action === 'delete' && styles.optionSelectedRed]} onPress={() => setAction('delete')}>
                                <View style={[styles.radioOuter, action === 'delete' && { borderColor: '#ef4444' }]}>
                                    {action === 'delete' && <View style={[styles.radioInner, { backgroundColor: '#ef4444' }]} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Delete everything</Text>
                                    <Text style={styles.optionDesc}>Remove space and all products</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Option 2: Move All */}
                            <TouchableOpacity style={[styles.optionCard, action === 'move-all' && styles.optionSelectedBlue]} onPress={() => setAction('move-all')}>
                                <View style={[styles.radioOuter, action === 'move-all' && { borderColor: '#6366f1' }]}>
                                    {action === 'move-all' && <View style={[styles.radioInner, { backgroundColor: '#6366f1' }]} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Move all products</Text>
                                    <Text style={styles.optionDesc}>Keep all products, move to another space</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Option 3: Choose Keep */}
                            <TouchableOpacity style={[styles.optionCard, action === 'keep-some' && styles.optionSelectedGreen]} onPress={() => setAction('keep-some')}>
                                <View style={[styles.radioOuter, action === 'keep-some' && { borderColor: '#34d399' }]}>
                                    {action === 'keep-some' && <View style={[styles.radioInner, { backgroundColor: '#34d399' }]} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionTitle}>Choose which to keep</Text>
                                    <Text style={styles.optionDesc}>Select specific products to move</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Move Logic Area */}
                        {(action === 'move-all' || action === 'keep-some') && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.sectionLabel}>
                                    {action === 'keep-some' ? `Move ${selectedProductIds.length} selected to:` : 'Move products to:'}
                                </Text>

                                {/* Space Selector Dropdown (Simplified) */}
                                <TouchableOpacity
                                    style={styles.dropdown}
                                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <Text style={styles.dropdownText}>
                                        {targetSpaceId
                                            ? (() => {
                                                const s = locations.find(l => l.id === targetSpaceId);
                                                return `${s?.icon} ${s?.name}`;
                                            })()
                                            : "Select a space..."
                                        }
                                    </Text>
                                    <Text>▼</Text>
                                </TouchableOpacity>

                                {isDropdownOpen && (
                                    <View style={styles.dropdownList}>
                                        {otherSpaces.map(s => (
                                            <TouchableOpacity
                                                key={s.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setTargetSpaceId(s.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <Text>{s.icon} {s.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Product Selection Logic */}
                        {action === 'keep-some' && (
                            <View style={{ marginTop: 16 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={styles.sectionLabel}>Select products to keep ({selectedProductIds.length}/{productsInSpace.length})</Text>
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <TouchableOpacity onPress={selectAllProducts}><Text style={{ color: '#6366f1', fontSize: 12 }}>All</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={selectNoneProducts}><Text style={{ color: '#6b7280', fontSize: 12 }}>None</Text></TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ gap: 8 }}>
                                    {productsInSpace.map(p => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.productRow, selectedProductIds.includes(p.id) ? { borderColor: '#34d399', backgroundColor: '#ecfdf5' } : { borderColor: '#e5e7eb' }]}
                                            onPress={() => toggleProductSelection(p.id)}
                                        >
                                            <View style={[styles.checkbox, selectedProductIds.includes(p.id) && { backgroundColor: '#34d399', borderColor: '#34d399' }]} />
                                            <View style={{ marginLeft: 12 }}>
                                                <Text style={{ fontWeight: '600', color: '#171717' }}>{p.name}</Text>
                                                <Text style={{ fontSize: 12, color: '#ef4444' }}>Expires: {new Date(p.expirationDate).toDateString()}</Text>
                                            </View>
                                            {selectedProductIds.includes(p.id) ? (
                                                <Text style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 'bold', color: '#34d399' }}>Keep</Text>
                                            ) : (
                                                <Text style={{ marginLeft: 'auto', fontSize: 12, color: '#ef4444' }}>Delete</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: getButtonColor() }]}
                            onPress={handleDelete}
                        >
                            <Text style={styles.actionText}>{getButtonText()}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '90%',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconCircle: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#171717' },
    subtitle: { fontSize: 14, color: '#6b7280' },

    warningBox: {
        backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 12, padding: 12, marginBottom: 20,
    },
    warningText: { color: '#92400e', fontSize: 14, lineHeight: 20 },

    optionsContainer: { gap: 12 },
    optionCard: {
        flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center',
    },
    optionSelectedRed: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    optionSelectedBlue: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
    optionSelectedGreen: { borderColor: '#34d399', backgroundColor: '#ecfdf5' },

    radioOuter: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

    optionTitle: { fontWeight: '600', color: '#171717', fontSize: 15 },
    optionDesc: { color: '#6b7280', fontSize: 13, marginTop: 2 },

    sectionLabel: { fontWeight: '600', color: '#171717', marginBottom: 8 },
    dropdown: {
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
    },
    dropdownText: { color: '#171717' },
    dropdownList: {
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 4, maxHeight: 150, backgroundColor: '#fff',
    },
    dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },

    productRow: {
        flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: '#fff',
    },
    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#d1d5db',
    },

    footer: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    cancelBtn: {
        flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'
    },
    cancelText: { fontWeight: '600', color: '#374151' },
    actionBtn: {
        flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center'
    },
    actionText: { fontWeight: 'bold', color: '#fff' },
});
