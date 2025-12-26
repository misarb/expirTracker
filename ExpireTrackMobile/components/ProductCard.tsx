import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { Product } from '../types';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';
import StatusBadge from './StatusBadge';
import { EditIcon, TrashIcon } from './Icons';

interface ProductCardProps {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    onSelect?: () => void;
    onLongPress?: () => void;
    isSelected?: boolean;
    selectionMode?: boolean;
}

const { width } = Dimensions.get('window');

import { useSettingsStore } from '../store/settingsStore';

// ...

export default function ProductCard({
    product,
    onEdit,
    onDelete,
    onSelect,
    onLongPress,
    isSelected,
    selectionMode
}: ProductCardProps) {
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const styles = getStyles(isDark ? 'dark' : 'light');

    const daysUntil = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expDate = new Date(product.expirationDate); expDate.setHours(0, 0, 0, 0);
        return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }, [product.expirationDate]);

    return (
        <TouchableOpacity
            style={[styles.card, isSelected && styles.cardSelected]}
            activeOpacity={0.8}
            onPress={selectionMode ? onSelect : onEdit}
            onLongPress={onLongPress}
        >
            {/* Product Image / Cover */}
            {product.image && (
                <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            )}

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                    </View>

                    {/* Action Buttons (Visible on Mobile) */}
                    {!selectionMode && (
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                                <EditIcon size={18} color={colors.muted[isDark ? 'dark' : 'light']} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                                <TrashIcon size={18} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {selectionMode && (
                        <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                            {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                        </View>
                    )}
                </View>

                {/* Expiration Text */}
                <View style={{ marginBottom: 8 }}>
                    {product.hasExpirationDate === false ? (
                        <Text style={[styles.expText, { color: colors.status.safe }]}>✨ No expiration</Text>
                    ) : product.useShelfLife && !product.openedDate ? (
                        <Text style={[styles.expText, { color: '#3B82F6' }]}>📦 Not opened ({product.shelfLifeDays} days)</Text>
                    ) : (
                        <Text style={styles.expText}>
                            {daysUntil < 0 ? `Expired ${Math.abs(daysUntil)} days ago` :
                                daysUntil === 0 ? 'Expiring today' :
                                    `Expiring in ${daysUntil} days`}
                        </Text>
                    )}
                </View>

                <View style={styles.footer}>
                    {product.quantity ? (
                        <Text style={styles.quantityText}>Qty: {product.quantity}</Text>
                    ) : <View />}
                    <StatusBadge status={product.status} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    card: {
        backgroundColor: colors.card[theme],
        borderRadius: borderRadius.lg, // 16
        borderWidth: 1,
        borderColor: colors.border[theme],
        marginBottom: spacing.md,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 120, // h-32 matches roughly 128px, kept slightly smaller for mobile compactness
        backgroundColor: colors.secondary[theme],
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    catBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary[theme],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    catText: {
        fontSize: 10,
        color: colors.muted[theme],
        fontWeight: '600',
    },
    name: {
        fontSize: fontSize.lg,
        fontWeight: '700',
        color: colors.foreground[theme],
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: colors.secondary[theme],
    },
    expText: {
        fontSize: fontSize.sm,
        color: colors.muted[theme],
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    quantityText: {
        fontSize: fontSize.xs,
        color: colors.muted[theme],
    },
    cardSelected: {
        borderColor: colors.primary[theme],
        backgroundColor: theme === 'dark' ? colors.primary[theme] + '15' : colors.primary[theme] + '08',
    },
    selectCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border[theme],
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
    },
    selectCircleActive: {
        backgroundColor: colors.primary[theme],
        borderColor: colors.primary[theme],
    },
    checkIcon: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
