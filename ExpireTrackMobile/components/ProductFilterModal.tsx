import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, useColorScheme } from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { Location, UserProfile } from '../types';
import { useProductStore } from '../store/productStore';
import { useSpaceStore } from '../store/spaceStore';
import { useSettingsStore } from '../store/settingsStore';

const { height } = Dimensions.get('window');

interface ProductFilterModalProps {
    visible: boolean;
    onClose: () => void;
    currentFilters: {
        locationId: string | null;
        addedBy: string | null;
    };
    onApply: (filters: { locationId: string | null, addedBy: string | null }) => void;
}

export default function ProductFilterModal({ visible, onClose, currentFilters, onApply }: ProductFilterModalProps) {
    const { locations } = useProductStore();
    const { currentSpaceId, getSpaceMembers } = useSpaceStore();
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const [tempLocationId, setTempLocationId] = useState<string | null>(currentFilters.locationId);
    const [tempAddedBy, setTempAddedBy] = useState<string | null>(currentFilters.addedBy);
    const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null);

    const members = currentSpaceId ? getSpaceMembers(currentSpaceId) : [];
    const parentLocations = locations.filter(l => !l.parentId);

    const handleApply = () => {
        onApply({ locationId: tempLocationId, addedBy: tempAddedBy });
        onClose();
    };

    const handleClear = () => {
        setTempLocationId(null);
        setTempAddedBy(null);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Filter Products</Text>
                        <TouchableOpacity onPress={handleClear}>
                            <Text style={styles.clearBtn}>Clear All</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollView}>
                        {/* Member Filter (Only if family space) */}
                        {members.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Added By Member</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                    <TouchableOpacity
                                        style={[styles.chip, !tempAddedBy && styles.chipActive]}
                                        onPress={() => setTempAddedBy(null)}
                                    >
                                        <Text style={[styles.chipText, !tempAddedBy && styles.chipTextActive]}>All Members</Text>
                                    </TouchableOpacity>
                                    {members.map(member => (
                                        <TouchableOpacity
                                            key={member.id}
                                            style={[styles.chip, tempAddedBy === member.id && styles.chipActive]}
                                            onPress={() => setTempAddedBy(member.id)}
                                        >
                                            <Text style={styles.chipIcon}>{member.avatarEmoji}</Text>
                                            <Text style={[styles.chipText, tempAddedBy === member.id && styles.chipTextActive]}>
                                                {member.displayName}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Location Filter */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[styles.chip, !tempLocationId && styles.chipActive]}
                                    onPress={() => setTempLocationId(null)}
                                >
                                    <Text style={[styles.chipText, !tempLocationId && styles.chipTextActive]}>All Locations</Text>
                                </TouchableOpacity>

                                {(() => {
                                    const allChips: JSX.Element[] = [];
                                    parentLocations.forEach(parent => {
                                        const children = locations.filter(l => l.parentId === parent.id);
                                        const hasChildren = children.length > 0;
                                        const isExpanded = expandedLocationId === parent.id;
                                        const isActive = tempLocationId === parent.id;

                                        allChips.push(
                                            <TouchableOpacity
                                                key={parent.id}
                                                style={[styles.chip, isActive && styles.chipActive]}
                                                onPress={() => {
                                                    setTempLocationId(parent.id);
                                                    if (hasChildren) setExpandedLocationId(isExpanded ? null : parent.id);
                                                }}
                                            >
                                                <Text style={styles.chipIcon}>{parent.icon}</Text>
                                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{parent.name}</Text>
                                                {hasChildren && <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>}
                                            </TouchableOpacity>
                                        );

                                        if (hasChildren && isExpanded) {
                                            children.forEach(child => {
                                                const isChildActive = tempLocationId === child.id;
                                                allChips.push(
                                                    <TouchableOpacity
                                                        key={child.id}
                                                        style={[styles.chip, styles.childChip, isChildActive && styles.chipActive]}
                                                        onPress={() => setTempLocationId(child.id)}
                                                    >
                                                        <Text style={styles.connector}>└</Text>
                                                        <Text style={styles.chipIcon}>{child.icon}</Text>
                                                        <Text style={[styles.chipText, isChildActive && styles.chipTextActive]}>{child.name}</Text>
                                                    </TouchableOpacity>
                                                );
                                            });
                                        }
                                    });
                                    return allChips;
                                })()}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                        <Text style={styles.applyBtnText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    content: {
        backgroundColor: colors.card[theme],
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: height * 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.foreground[theme],
    },
    clearBtn: {
        fontSize: 14,
        color: colors.primary[theme],
        fontWeight: '600',
    },
    scrollView: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.foreground[theme],
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: 'row',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.secondary[theme],
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: colors.primary[theme] + '15',
        borderColor: colors.primary[theme],
    },
    childChip: {
        marginLeft: 4,
        borderStyle: 'dashed',
        backgroundColor: colors.card[theme],
        borderColor: colors.border[theme] + '80',
    },
    chipIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    chipText: {
        fontSize: 14,
        color: colors.muted[theme],
        fontWeight: '500',
    },
    chipTextActive: {
        color: colors.primary[theme],
        fontWeight: '700',
    },
    expandIcon: {
        fontSize: 10,
        marginLeft: 6,
        color: colors.muted[theme],
    },
    connector: {
        fontSize: 12,
        color: colors.muted[theme],
        marginRight: 4,
    },
    applyBtn: {
        backgroundColor: colors.primary[theme],
        borderRadius: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    applyBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
