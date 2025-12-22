import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useColorScheme } from 'react-native';

const DONATION_PLATFORMS = [
    {
        name: 'Ko-fi',
        icon: '☕',
        description: 'One-time or monthly support ❤️',
        color: ['#EC4899', '#E11D48'], // Pink-500 to Rose-600
        url: 'https://ko-fi.com/misarb',
    },
    {
        name: 'PayPal',
        icon: '💳',
        description: 'Direct PayPal donation 💰',
        color: ['#3B82F6', '#4F46E5'], // Blue-500 to Indigo-600
        url: 'https://paypal.me/LBoulbalah',
    },
];

export default function SupportScreen() {
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const styles = getStyles(isDark ? 'dark' : 'light');
    const theme = isDark ? 'dark' : 'light';

    // We can use generic theme colors, support screen usually has its own vibe
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Hero */}
                <View style={styles.hero}>
                    <LinearGradient
                        colors={['#EC4899', '#E11D48']}
                        style={styles.iconContainer}
                    >
                        <Text style={{ fontSize: 40 }}>❤️</Text>
                    </LinearGradient>
                    <Text style={styles.title}>Support ExpireTrack</Text>
                    <Text style={styles.subtitle}>
                        Help us keep the app free and evolving. Your support means the world!
                    </Text>
                </View>

                {/* Creator Story */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👋 Hi, I'm the creator!</Text>
                    <Text style={styles.text}>
                        I built ExpireTrack to solve a common problem: <Text style={styles.bold}>wasted products</Text>.
                    </Text>
                    <Text style={[styles.text, { marginTop: 8 }]}>
                        My goal is to make this the simplest way to track everything in your home.
                    </Text>
                    <View style={styles.list}>
                        <Text style={styles.listItem}>• 📱 Mobile app (iOS/Android)</Text>
                        <Text style={styles.listItem}>• 📷 Barcode scanning</Text>
                        <Text style={styles.listItem}>• 👨‍👩‍👧‍👦 Family sharing</Text>
                    </View>
                </View>

                {/* Donation Options */}
                <Text style={styles.sectionHeader}>Ways to Support</Text>
                <View style={{ gap: 16 }}>
                    {DONATION_PLATFORMS.map((platform) => (
                        <TouchableOpacity
                            key={platform.name}
                            activeOpacity={0.9}
                            onPress={() => Linking.openURL(platform.url)}
                        >
                            <LinearGradient
                                colors={platform.color as any}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.donationCard}
                            >
                                <View style={styles.donationIcon}>
                                    <Text style={{ fontSize: 24 }}>{platform.icon}</Text>
                                </View>
                                <View>
                                    <Text style={styles.donationName}>{platform.name}</Text>
                                    <Text style={styles.donationDesc}>{platform.description}</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    content: { padding: spacing.lg },
    hero: { alignItems: 'center', marginBottom: spacing.xl },
    iconContainer: {
        width: 80, height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        shadowColor: '#EC4899',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.foreground[theme], textAlign: 'center' },
    subtitle: { fontSize: 16, color: colors.muted[theme], textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

    card: {
        backgroundColor: colors.card[theme],
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border[theme],
        marginBottom: spacing.xl,
    },
    cardTitle: { fontSize: 20, fontWeight: 'bold', color: colors.foreground[theme], marginBottom: 12 },
    text: { fontSize: 15, color: colors.muted[theme], lineHeight: 22 },
    bold: { fontWeight: '700', color: colors.foreground[theme] },
    list: { marginTop: 12, marginLeft: 8 },
    listItem: { fontSize: 15, color: colors.muted[theme], marginBottom: 4 },

    sectionHeader: { fontSize: 20, fontWeight: 'bold', color: colors.foreground[theme], marginBottom: 16, textAlign: 'center' },

    donationCard: {
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    donationIcon: {
        width: 48, height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donationName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    donationDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
});
