import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import { Svg, Path } from 'react-native-svg';
import { ProductStatus } from '../types';

const BackArrowIcon = ({ color = "#fff", size = 20 }: { color?: string, size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" />
        <Path d="M12 19l-7-7 7-7" />
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

    const { products, getProductsByStatus, deleteProduct } = useProductStore();
    const { setEditingProduct, setAddModalOpen } = useUIStore();

    const filteredProducts = useMemo(() => {
        if (status === 'all') return products;
        return getProductsByStatus(status);
    }, [products, status, getProductsByStatus]);

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setAddModalOpen(true);
    };

    const handleDelete = (id: string) => {
        deleteProduct(id);
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                    <BackArrowIcon color={colors.foreground[theme]} size={18} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, marginRight: 8 }}>{getIcon()}</Text>
                    <Text style={styles.title}>{getTitle()}</Text>
                </View>
                <Text style={styles.subtitle}>{filteredProducts.length} items</Text>
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
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
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
    emptyText: { textAlign: 'center', color: colors.muted[theme], marginTop: 40 },
});
