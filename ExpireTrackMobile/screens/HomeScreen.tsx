import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProductStore } from '../store/productStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import ProductCard from '../components/ProductCard';
import SpaceSelector from '../components/SpaceSelector';
import { Product } from '../types';
import { PlusIcon, FolderIcon } from '../components/Icons';
import { useI18n } from '../lib/i18n';
import SyncIndicator from '../components/SyncIndicator';
import { Svg, Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Custom Moon/Sun icons for header
const MoonIcon = ({ size = 20, color = "#fff" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
);
const SunIcon = ({ size = 20, color = "#fff" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="5" />
        <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
);

interface HomeScreenProps {
    onCreateSpace: () => void;
    onJoinSpace: () => void;
    onOpenProUpgrade?: () => void;
    onInviteMembers?: (spaceId: string) => void;
    onSpaceSettings?: (spaceId: string) => void;
}

export default function HomeScreen({ onCreateSpace, onJoinSpace, onOpenProUpgrade, onInviteMembers, onSpaceSettings }: HomeScreenProps) {
    const navigation = useNavigation<any>();
    const systemTheme = useColorScheme();
    const { theme, setTheme, language, setLanguage } = useSettingsStore();
    const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';
    const { t } = useI18n();

    const { products, getProductsByStatus, deleteProduct, getProductsBySpace } = useProductStore();
    const { setAddModalOpen, setEditingProduct, setDefaultLocationId, setAddSpaceModalOpen, setAddSpaceParentId } = useUIStore();
    const { currentSpaceId, fetchSpaces, getCurrentSpace, hasFamilySpaces, isOwner } = useSpaceStore();
    const { initializeUser, isPro, hasSeenFamilySpaceOnboarding, setHasSeenFamilySpaceOnboarding } = useUserStore();

    // Initialize user and spaces on mount
    useEffect(() => {
        const init = async () => {
            await initializeUser();
            await fetchSpaces();
        };
        init();
    }, []);

    const currentSpace = getCurrentSpace();
    const isMySpace = currentSpaceId === MY_SPACE_ID;

    // Get products for current space only
    const spaceProducts = useMemo(() => {
        return products.filter((p) =>
            p.spaceId === currentSpaceId || (!p.spaceId && currentSpaceId === MY_SPACE_ID)
        );
    }, [currentSpaceId, products]);

    const stats = useMemo(() => {
        const safe = spaceProducts.filter(p => p.status === 'safe').length;
        const expiringSoon = spaceProducts.filter(p => p.status === 'expiring-soon').length;
        const expired = spaceProducts.filter(p => p.status === 'expired').length;
        const total = spaceProducts.length;
        const healthScore = total > 0 ? Math.round(((safe) / total) * 100) : 100;
        return { safe, expiringSoon, expired, total, healthScore };
    }, [spaceProducts]);

    // Handlers
    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setAddModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        deleteProduct(id);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setDefaultLocationId(null);
        setAddModalOpen(true);
    };

    const styles = getStyles(isDark ? 'dark' : 'light');

    // Circular Progress Calculation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (stats.healthScore / 100) * circumference;

    // Should show Family Space promo card?
    const showFamilyPromo = isPro && !hasFamilySpaces() && !hasSeenFamilySpaceOnboarding;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SyncIndicator />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* HERO CARD - Violet Gradient */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={isMySpace ? ['#7c3aed', '#6366f1'] : ['#6366f1', '#8b5cf6']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        {/* Header Inside Hero - Top Row with Logo */}
                        <View style={styles.heroHeader}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.brandExpire}>Expire</Text>
                                <Text style={styles.brandTrack}>Track</Text>
                            </View>
                            <View style={styles.headerButtons}>
                                <TouchableOpacity onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={styles.iconBtn}>
                                    {isDark ? <SunIcon /> : <MoonIcon />}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'fr' : 'en')} style={styles.iconBtn}>
                                    <Text style={styles.langText}>{language.toUpperCase()}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Space Selector Row */}
                        <View style={styles.spaceSelectorRow}>
                            <SpaceSelector
                                onCreateSpace={onCreateSpace}
                                onJoinSpace={onJoinSpace}
                                onOpenProUpgrade={onOpenProUpgrade}
                                onSpaceSettings={onSpaceSettings}
                            />
                        </View>


                        {/* Circular Progress or Empty State */}
                        {stats.total === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateIcon}>📦</Text>
                                <Text style={styles.emptyStateTitle}>
                                    {isMySpace ? 'Start Tracking' : 'Empty Space'}
                                </Text>
                                <Text style={styles.emptyStateSubtitle}>
                                    {isMySpace
                                        ? 'Add your first product to begin'
                                        : 'Add the first product to this shared space'}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.progressContainer}>
                                    <Svg width={120} height={120} style={{ transform: [{ rotate: '-90deg' }] }}>
                                        {/* Background Circle */}
                                        <Circle
                                            cx="60" cy="60" r={radius}
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="10"
                                            fill="none"
                                        />
                                        {/* Progress Circle (Yellow/Orange) */}
                                        <Circle
                                            cx="60" cy="60" r={radius}
                                            stroke="#fbbf24" // Amber-400
                                            strokeWidth="10"
                                            fill="none"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                        />
                                    </Svg>
                                    <View style={styles.progressTextContainer}>
                                        <Text style={styles.progressPercent}>{stats.healthScore}%</Text>
                                        <Text style={styles.progressLabel}>healthy</Text>
                                    </View>
                                </View>

                                {/* Footer Message */}
                                <View style={styles.heroFooter}>
                                    <Text style={styles.heroTitle}>
                                        {isMySpace ? t('welcome') : currentSpace?.name || 'Family Space'}
                                    </Text>
                                    <Text style={styles.heroSubtitle}>{stats.safe} / {stats.total} safe</Text>
                                </View>
                            </>
                        )}
                    </LinearGradient>
                </View>

                {/* FAMILY SPACE PROMO CARD - for Pro users who haven't created a space */}
                {showFamilyPromo && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.promoCard}
                            onPress={onCreateSpace}
                            activeOpacity={0.9}
                        >
                            <View style={styles.promoHeader}>
                                <Text style={styles.promoIcon}>👨‍👩‍👧‍👦</Text>
                                <TouchableOpacity
                                    style={styles.promoDismiss}
                                    onPress={() => setHasSeenFamilySpaceOnboarding(true)}
                                >
                                    <Text style={styles.promoDismissText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.promoTitle}>Share with Your Family</Text>
                            <Text style={styles.promoDesc}>
                                Create a Family Space to track products together. Everyone stays in sync!
                            </Text>
                            <View style={styles.promoBtn}>
                                <Text style={styles.promoBtnText}>Create Family Space →</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* STATS GRID - Vibrant Cards */}
                <View style={styles.section}>
                    <View style={styles.statsGrid}>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductList', { status: 'all' })} activeOpacity={0.8} style={styles.statTouch}>
                            <GradientStatCard
                                colors={['#8b5cf6', '#a78bfa']} // Purple
                                count={stats.total}
                                label={t('totalItems')}
                                icon="📦"
                                styles={styles}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductList', { status: 'safe' })} activeOpacity={0.8} style={styles.statTouch}>
                            <GradientStatCard
                                colors={['#10b981', '#34d399']} // Emerald
                                count={stats.safe}
                                label="Safe"
                                icon="✓"
                                iconColor="rgba(255,255,255,0.4)"
                                styles={styles}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductList', { status: 'expiring-soon' })} activeOpacity={0.8} style={styles.statTouch}>
                            <GradientStatCard
                                colors={['#f59e0b', '#fbbf24']} // Amber
                                count={stats.expiringSoon}
                                label={t('expiringSoon')}
                                icon="⏰"
                                iconColor="rgba(255,255,255,0.3)"
                                isAlarm
                                styles={styles}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('ProductList', { status: 'expired' })} activeOpacity={0.8} style={styles.statTouch}>
                            <GradientStatCard
                                colors={['#ef4444', '#f87171']} // Red
                                count={stats.expired}
                                label={t('expired')}
                                icon="✗"
                                iconColor="rgba(255,255,255,0.3)"
                                styles={styles}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleAddNew}>
                            <View style={{ marginBottom: 8 }}><PlusIcon size={32} color="#06b6d4" /></View>
                            <Text style={styles.actionLabel}>{t('addProduct')}</Text>
                        </TouchableOpacity>
                        {currentSpaceId && (
                            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                setAddSpaceParentId(null);
                                setAddSpaceModalOpen(true);
                            }}>
                                <View style={{ marginBottom: 8 }}><FolderIcon size={32} color="#fbbf24" /></View>
                                <Text style={styles.actionLabel}>{t('addSpace')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Invite Members - shown only in Family Space for owners */}
                    {currentSpaceId && !isMySpace && isOwner(currentSpaceId) && (
                        <TouchableOpacity
                            style={styles.inviteActionBtn}
                            onPress={() => onInviteMembers?.(currentSpaceId)}
                        >
                            <Text style={styles.inviteActionIcon}>🔗</Text>
                            <View style={styles.inviteActionContent}>
                                <Text style={styles.inviteActionText}>Invite Family Members</Text>
                                <Text style={styles.inviteActionSubtext}>Share code to let others join</Text>
                            </View>
                            <Text style={styles.inviteActionArrow}>→</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* PRODUCTS THAT NEED ATTENTION */}
                {(stats.expired > 0 || stats.expiringSoon > 0) && (
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={styles.sectionTitle}>Needs Attention</Text>
                            <Text style={styles.sectionCount}>{stats.expired + stats.expiringSoon} items</Text>
                        </View>
                        <View style={{ gap: 10 }}>
                            {/* Show Expired first */}
                            {spaceProducts.filter(p => p.status === 'expired').map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onEdit={() => handleEdit(p)}
                                    onDelete={() => handleDelete(p.id, p.name)}
                                />
                            ))}
                            {/* Then Expiring Soon */}
                            {spaceProducts.filter(p => p.status === 'expiring-soon').map((p) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    onEdit={() => handleEdit(p)}
                                    onDelete={() => handleDelete(p.id, p.name)}
                                />
                            ))}
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const GradientStatCard = ({ colors, count, label, icon, iconColor, isActive, styles }: any) => (
    <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.statCard, isActive && styles.activeStatCard]}
    >
        {isActive && <View style={styles.activeBorder} />}
        <View>
            <Text style={styles.statCount}>{count}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
        <View style={styles.statIconContainer}>
            <Text style={[styles.statIcon, { color: iconColor || 'rgba(255,255,255,0.2)' }]}>{icon}</Text>
        </View>
    </LinearGradient>
);

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },

    heroContainer: { padding: spacing.md, paddingBottom: 0 },
    heroCard: {
        borderRadius: 24, padding: spacing.lg, minHeight: 300, alignItems: 'center',
    },
    heroHeader: {
        flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    },
    brandExpire: { fontSize: 20, fontWeight: 'bold', color: '#fbbf24' },
    brandTrack: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    headerButtons: { flexDirection: 'row', gap: 8 },
    iconBtn: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    },
    langText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    spaceSelectorRow: {
        width: '100%',
        marginBottom: 10,
    },

    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 30, paddingHorizontal: 40 },
    emptyStateIcon: { fontSize: 48, marginBottom: 12 },
    emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
    emptyStateSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

    progressContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
    progressTextContainer: { position: 'absolute', alignItems: 'center' },
    progressPercent: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

    heroFooter: { alignItems: 'center', marginTop: 10 },
    heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

    section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground[theme], marginBottom: 8 },
    sectionCount: { fontSize: 14, color: colors.muted[theme], fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statTouch: {
        width: (width - 32 - 12) / 2, // 2 cols
        height: 100,
    },
    statCard: {
        flex: 1, borderRadius: 16, padding: 16, justifyContent: 'space-between', overflow: 'hidden',
    },
    activeStatCard: {
        // Option to add scale or ring?
        // Using `activeBorder` overlay instead
    },
    activeBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16,
    },
    statCount: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
    statIconContainer: { position: 'absolute', bottom: -5, right: 5 },
    statIcon: { fontSize: 40 },

    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
        flex: 1, backgroundColor: colors.card[theme], borderRadius: 16, padding: 20, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border[theme], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    actionLabel: { fontSize: 14, fontWeight: '600', color: colors.foreground[theme] },

    // Invite Action Button (shown in Family Spaces)
    inviteActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
    },
    inviteActionIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    inviteActionContent: {
        flex: 1,
    },
    inviteActionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    inviteActionSubtext: {
        fontSize: 12,
        color: colors.muted[theme],
        marginTop: 2,
    },
    inviteActionArrow: {
        fontSize: 18,
        color: colors.primary[theme],
    },

    // Promo Card
    promoCard: {
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
    },
    promoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    promoIcon: {
        fontSize: 40,
    },
    promoDismiss: {
        padding: 4,
    },
    promoDismissText: {
        fontSize: 18,
        color: colors.muted[theme],
    },
    promoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginTop: 12,
        marginBottom: 6,
    },
    promoDesc: {
        fontSize: 14,
        color: colors.muted[theme],
        lineHeight: 20,
    },
    promoBtn: {
        backgroundColor: colors.primary[theme],
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    promoBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
}); 
