import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useProductStore } from '../store/productStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
    const systemTheme = useColorScheme();
    const { theme: themeSetting } = useSettingsStore();
    const { products, categories, locations, getProductsByStatus, getProductsByCategory } = useProductStore();

    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';

    const stats = useMemo(() => {
        const safe = getProductsByStatus('safe').length;
        const itemStats = categories.map(cat => ({ ...cat, count: getProductsByCategory(cat.id).length }))
            .filter(c => c.count > 0).sort((a, b) => b.count - a.count);
        return { safe, total: products.length, itemStats };
    }, [products]);

    const styles = getStyles(theme);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Overview</Text>
                <View style={styles.grid}>
                    <StatCard count={stats.total} label="Total" colors={['#10B981', '#14B8A6']} />
                    <StatCard count={stats.safe} label="Fresh" colors={['#3B82F6', '#60A5FA']} />
                </View>

                <Text style={[styles.title, { marginTop: spacing.xl }]}>By Category</Text>
                <View style={{ gap: spacing.sm }}>
                    {stats.itemStats.map((cat) => (
                        <View key={cat.id} style={styles.catCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, marginRight: spacing.md }}>{cat.icon}</Text>
                                <Text style={styles.catName}>{cat.name}</Text>
                            </View>
                            <Text style={{ fontWeight: 'bold', color: cat.color }}>{cat.count}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const StatCard = ({ count, label, colors }: any) => (
    <LinearGradient colors={colors} style={{ width: (width - spacing.lg * 2 - spacing.md) / 2, padding: spacing.lg, borderRadius: borderRadius.lg }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>{count}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Text>
    </LinearGradient>
);

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    content: { padding: spacing.lg },
    title: { fontSize: fontSize.xl, fontWeight: 'bold', marginBottom: spacing.md, color: colors.foreground[theme] },
    grid: { flexDirection: 'row', gap: spacing.md },
    catCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1,
        backgroundColor: colors.card[theme], borderColor: colors.border[theme],
    },
    catName: { fontSize: fontSize.md, fontWeight: '500', color: colors.foreground[theme] },
});
