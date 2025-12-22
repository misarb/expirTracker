import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProductStatus } from '../types';
import { colors } from '../theme/colors';

export default function StatusBadge({ status }: { status: ProductStatus }) {
    const config = {
        'safe': { label: 'Safe', emoji: '🟢', color: colors.status.safe, bg: colors.status.safe + '25' },
        'expiring-soon': { label: 'Expiring Soon', emoji: '🟡', color: colors.status.expiringSoon, bg: colors.status.expiringSoon + '25' },
        'expired': { label: 'Expired', emoji: '🔴', color: colors.status.expired, bg: colors.status.expired + '25' },
    };

    const { label, emoji, color, bg } = config[status];

    return (
        <View style={[styles.badge, { backgroundColor: bg, borderColor: color + '50' }]}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.text, { color: color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    emoji: { fontSize: 12, marginRight: 4 },
    text: { fontSize: 12, fontWeight: '600' },
});
