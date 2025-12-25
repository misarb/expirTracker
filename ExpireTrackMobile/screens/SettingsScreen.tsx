import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore, Theme, Language } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import { useUserStore } from '../store/userStore';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme/colors';
import { useI18n } from '../lib/i18n';
// Use legacy API for expo-file-system v19+ which has new class-based API
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import { Svg, Path } from 'react-native-svg';
import { rescheduleAllNotifications, cancelAllNotifications, registerForPushNotificationsAsync, sendTestNotification } from '../lib/notifications';
import AvatarPickerModal from '../components/AvatarPickerModal';
import { useSpaceStore } from '../store/spaceStore';

// Icons
const ChevronRight = ({ color = "#ccc" }: any) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
    </Svg>
);

const ExternalLinkIcon = ({ color = "#ccc" }: any) => (
    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <Path d="M15 3h6v6" />
        <Path d="M10 14L21 3" />
    </Svg>
);

const TIMING_OPTIONS = [0, 1, 2, 3, 7];

export default function SettingsScreen() {
    const {
        theme, setTheme, language, setLanguage,
        notificationsEnabled, setNotificationsEnabled,
        notificationTimings, toggleNotificationTiming
    } = useSettingsStore();
    const productStore = useProductStore();
    const { t } = useI18n();
    const { currentUser, isPro, signOut } = useUserStore();
    const navigation = useNavigation<any>();

    // Permission States
    const [cameraStatus, setCameraStatus] = useState<string | null>(null);
    const [notifStatus, setNotifStatus] = useState<string | null>(null);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    // Loading State
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            const { status: camStatus } = await Camera.getCameraPermissionsAsync();
            setCameraStatus(camStatus);

            const { status: notStatus } = await Notifications.getPermissionsAsync();
            setNotifStatus(notStatus);
        } catch (e) {
            console.error("Permission check failed:", e);
        }
    };

    const handleToggleNotifications = async (enabled: boolean) => {
        if (enabled) {
            const hasPermission = await registerForPushNotificationsAsync();
            if (hasPermission) {
                setNotificationsEnabled(true);
                setNotifStatus('granted');

                // Use default timings if empty, or existing
                // If the user enables notifications, we want to make sure the store has valid defaults [1, 7] if empty
                const currentTimings = notificationTimings.length > 0 ? notificationTimings : [1, 7];
                // But we don't write to store here unless we want to enforce defaults. 
                // Let's just use what's in the store. 

                await rescheduleAllNotifications(productStore.products, currentTimings);

                Alert.alert(
                    "Notifications Enabled",
                    `You will be notified ${currentTimings.join(', ')} days before expiry. You can customize this below.`
                );
            } else {
                setNotificationsEnabled(false);
                setNotifStatus('denied');
                Alert.alert("Permission Required", "Please enable notifications in your device settings.");
                Linking.openSettings();
            }
        } else {
            setNotificationsEnabled(false);
            await cancelAllNotifications();
        }
    };

    const handleToggleTiming = async (days: number) => {
        // Toggle in store
        toggleNotificationTiming(days);

        // Get updated state (since zustand update is immediate for state, but we need exact value)
        // toggleNotificationTiming updates state. We can get it via hook or access store directly.
        // But notificationTimings constant here is from previous render. 
        // We can just calculate what it WILL be.
        const willBeSelected = !notificationTimings.includes(days);
        let updatedTimings = willBeSelected
            ? [...notificationTimings, days]
            : notificationTimings.filter(d => d !== days);

        // If enabled, reschedule immediately
        if (notificationsEnabled) {
            setIsLoading(true);
            await rescheduleAllNotifications(productStore.products, updatedTimings);
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        setIsLoading(true);
        try {
            const data = {
                products: productStore.products,
                categories: productStore.categories,
                locations: productStore.locations,
                settings: { theme, language, notificationsEnabled },
                exportedAt: new Date().toISOString(),
                version: "1.0.0"
            };

            const json = JSON.stringify(data, null, 2);

            // Access FileSystem directories
            console.log("FileSystem module:", FileSystem);
            console.log("documentDirectory:", FileSystem.documentDirectory);
            console.log("cacheDirectory:", FileSystem.cacheDirectory);

            const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

            if (!dir) {
                // This means we're likely on web or a non-native environment
                Alert.alert(
                    "Platform Not Supported",
                    "File export requires running on a physical device or emulator with Expo Go.\n\nYou appear to be running on web or an unsupported platform.\n\nWould you like to copy the data to clipboard instead?",
                    [
                        { text: "Cancel", style: 'cancel' },
                        {
                            text: "Copy to Clipboard",
                            onPress: async () => {
                                await Clipboard.setStringAsync(json);
                                Alert.alert("✅ Copied!", "Data copied to clipboard.");
                            }
                        }
                    ]
                );
                setIsLoading(false);
                return;
            }

            const fileName = `ExpireTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
            const fileUri = dir + fileName;

            console.log("Writing to:", fileUri);

            await FileSystem.writeAsStringAsync(fileUri, json, {
                encoding: FileSystem.EncodingType?.UTF8 || 'utf8'
            });

            console.log("File written successfully");

            const canShare = await Sharing.isAvailableAsync();
            console.log("Sharing available:", canShare);

            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export ExpireTrack Backup',
                    UTI: 'public.json'
                });
            } else {
                Alert.alert(
                    "File Saved",
                    "Your backup has been saved to:\n" + fileUri + "\n\nSharing is not available on this device.",
                    [{ text: "OK" }]
                );
            }
        } catch (error: any) {
            console.error("Export Error:", error);
            Alert.alert(
                "Export Failed",
                error.message + "\n\nPlease try running on a physical device or emulator.",
                [
                    { text: "OK" },
                    {
                        text: "Copy Instead",
                        onPress: async () => {
                            try {
                                const data = {
                                    products: productStore.products,
                                    categories: productStore.categories,
                                    locations: productStore.locations,
                                    exportedAt: new Date().toISOString(),
                                };
                                await Clipboard.setStringAsync(JSON.stringify(data));
                                Alert.alert("✅ Copied!", "Data copied to clipboard as fallback.");
                            } catch (e) {
                                Alert.alert("Error", "Failed to copy to clipboard.");
                            }
                        }
                    }
                ]
            );
        } finally {
            setIsLoading(false);
        }
    };

    const processImportData = (data: any) => {
        if (!data.products || !Array.isArray(data.products)) {
            throw new Error("Invalid backup format. Missing products data.");
        }

        Alert.alert(
            t('importData'),
            "This will replace your current inventory with the backup data. This action cannot be undone.\n\nProducts found: " + data.products.length,
            [
                { text: t('cancel'), style: 'cancel', onPress: () => setIsLoading(false) },
                {
                    text: "Import",
                    style: 'destructive',
                    onPress: () => {
                        try {
                            useProductStore.setState({
                                products: data.products,
                                categories: data.categories || productStore.categories,
                                locations: data.locations || productStore.locations
                            });

                            if (data.settings) {
                                setTheme(data.settings.theme || 'system');
                                setLanguage(data.settings.language || 'en');
                                if (typeof data.settings.notificationsEnabled === 'boolean') {
                                    setNotificationsEnabled(data.settings.notificationsEnabled);
                                }
                            }

                            productStore.refreshStatuses();
                            Alert.alert("✅ Success", t('importSuccess'));
                        } catch (stateError: any) {
                            Alert.alert("Import Failed", "Failed to update app state: " + stateError.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleImportFromFile = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/json', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                setIsLoading(false);
                return;
            }

            const file = result.assets ? result.assets[0] : null;
            if (!file || !file.uri) throw new Error("No file selected or invalid file URI.");

            // @ts-ignore
            const content = await FileSystem.readAsStringAsync(file.uri);
            let data;
            try {
                data = JSON.parse(content);
            } catch (jsonError) {
                throw new Error("Invalid JSON file. Please select a valid backup file.");
            }

            processImportData(data);

        } catch (error: any) {
            console.error("Import Error:", error);
            Alert.alert("Import Failed", error.message || "Failed to read file.");
            setIsLoading(false);
        }
    };

    const handleImportFromClipboard = async () => {
        setIsLoading(true);
        try {
            const clipboardContent = await Clipboard.getStringAsync();
            if (!clipboardContent) {
                throw new Error("Clipboard is empty. Copy your backup data first.");
            }

            let data;
            try {
                data = JSON.parse(clipboardContent);
            } catch (jsonError) {
                throw new Error("Clipboard doesn't contain valid JSON data. Make sure you copied the backup correctly.");
            }

            processImportData(data);

        } catch (error: any) {
            console.error("Import from Clipboard Error:", error);
            Alert.alert("Import Failed", error.message);
            setIsLoading(false);
        }
    };

    const handleImport = () => {
        Alert.alert(
            t('importData'),
            "How would you like to import your data?",
            [
                { text: t('cancel'), style: 'cancel' },
                { text: "📋 From Clipboard", onPress: handleImportFromClipboard },
                { text: "📁 From File", onPress: handleImportFromFile },
            ]
        );
    };

    const handleAvatarChange = async (emoji: string) => {
        try {
            const { updateAvatarEmoji } = useUserStore.getState();
            await updateAvatarEmoji(emoji);

            // Refresh spaces to update member avatars
            const { fetchSpaces } = useSpaceStore.getState();
            await fetchSpaces();
        } catch (error) {
            console.error('Avatar update error:', error);
            Alert.alert('Error', 'Failed to update avatar');
        }
    };

    const styles = getStyles(theme === 'dark' ? 'dark' : 'light');
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('settings')}</Text>
                {isLoading && <ActivityIndicator size="small" color={colors.primary[resolvedTheme]} />}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* ACCOUNT SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account & Pro</Text>
                    {currentUser ? (
                        <View style={styles.accountCard}>
                            <View style={styles.accountInfo}>
                                <TouchableOpacity
                                    style={[styles.avatarCircle, { backgroundColor: colors.primary[resolvedTheme] }]}
                                    onPress={() => setIsAvatarPickerOpen(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.avatarText}>{currentUser.avatarEmoji || '👤'}</Text>
                                </TouchableOpacity>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.accountName}>{currentUser.displayName}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <View style={[styles.badge, isPro ? styles.proBadge : styles.freeBadge]}>
                                            <Text style={styles.badgeText}>{isPro ? 'PRO' : 'FREE'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.logoutBtn} onPress={() => {
                                Alert.alert("Log Out", "Are you sure you want to log out?", [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Log Out", style: "destructive", onPress: async () => {
                                            await signOut();
                                            navigation.navigate('Auth');
                                        }
                                    }
                                ]);
                            }}>
                                <Text style={styles.logoutText}>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.loginBanner}
                            onPress={() => navigation.navigate('Auth')}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.loginTitle}>Unlock Cloud Sync</Text>
                                <Text style={styles.loginSubtitle}>Sign in to sync across all your devices</Text>
                            </View>
                            <View style={styles.loginBtn}>
                                <Text style={styles.loginBtnText}>Sign In</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* GENERAL SETTINGS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>

                    {/* Theme */}
                    <View style={styles.row}>
                        <Text style={styles.label}>{t('theme')}</Text>
                        <View style={styles.pillContainer}>
                            {(['light', 'dark', 'system'] as Theme[]).map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    onPress={() => setTheme(m)}
                                    style={[styles.pill, theme === m && styles.pillActive]}
                                >
                                    <Text style={[styles.pillText, theme === m && styles.pillTextActive]}>
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Language */}
                    <View style={styles.row}>
                        <Text style={styles.label}>{t('language')}</Text>
                        <View style={styles.pillContainer}>
                            {(['en', 'fr'] as Language[]).map((l) => (
                                <TouchableOpacity
                                    key={l}
                                    onPress={() => setLanguage(l)}
                                    style={[styles.pill, language === l && styles.pillActive]}
                                >
                                    <Text style={[styles.pillText, language === l && styles.pillTextActive]}>
                                        {l.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* PERMISSIONS & NOTIFICATIONS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('permissions')}</Text>

                    {/* Notification Toggle */}
                    <View style={styles.row}>
                        <Text style={styles.label}>{t('notificationPermission')}</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: colors.border[resolvedTheme], true: colors.primary[resolvedTheme] }}
                        />
                    </View>

                    {/* Timing Selector (Visible if enabled) */}
                    {notificationsEnabled && (
                        <View style={[styles.row, { paddingVertical: 16, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
                            <Text style={[styles.label, { fontSize: 14, color: colors.muted[resolvedTheme] }]}>{t('notifyMe')}</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {TIMING_OPTIONS.map((days) => {
                                    const isSelected = notificationTimings && notificationTimings.includes(days);
                                    return (
                                        <TouchableOpacity
                                            key={days}
                                            onPress={() => handleToggleTiming(days)}
                                            style={[
                                                styles.pill,
                                                { backgroundColor: isSelected ? colors.primary[resolvedTheme] : colors.card[resolvedTheme] },
                                                isSelected && { shadowColor: colors.primary[resolvedTheme], shadowOpacity: 0.3 }
                                            ]}
                                        >
                                            <Text style={[
                                                styles.pillText,
                                                { color: isSelected ? '#fff' : colors.foreground[resolvedTheme], fontWeight: isSelected ? 'bold' : 'normal' }
                                            ]}>
                                                {days} {t('day')}{days > 1 ? 's' : ''}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Camera Permission */}
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.label}>{t('cameraPermission')}</Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: cameraStatus === 'granted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                            }}>
                                <View style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: cameraStatus === 'granted' ? '#10b981' : '#f59e0b',
                                    marginRight: 6
                                }} />
                                <Text style={[styles.statusText, { color: cameraStatus === 'granted' ? '#10b981' : '#f59e0b' }]}>
                                    {cameraStatus === 'granted' ? 'Granted' : cameraStatus === 'denied' ? 'Denied' : 'Not Set'}
                                </Text>
                            </View>
                        </View>

                        {cameraStatus !== 'granted' && (
                            <TouchableOpacity
                                style={[styles.actionRow, {
                                    backgroundColor: colors.primary[resolvedTheme],
                                    justifyContent: 'center',
                                    marginTop: 4,
                                    marginBottom: 0
                                }]}
                                onPress={async () => {
                                    const { status } = await Camera.requestCameraPermissionsAsync();
                                    setCameraStatus(status);
                                    if (status === 'denied') {
                                        Alert.alert(
                                            "Permission Denied",
                                            "Camera access was denied. Please enable it in your device settings to use barcode scanning.",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Open Settings", onPress: () => Linking.openSettings() }
                                            ]
                                        );
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>📷 Request Camera Access</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={[styles.actionRow, { marginTop: 10 }]} onPress={() => Linking.openSettings()}>
                        <Text style={{ color: colors.primary[resolvedTheme] }}>{t('openSettings')}</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                </View>

                {/* DATA MANAGEMENT */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>

                    <TouchableOpacity style={styles.actionRow} onPress={handleExport} disabled={isLoading}>
                        <Text style={styles.actionLabel}>{t('exportData')}</Text>
                        <ExternalLinkIcon color={colors.primary[resolvedTheme]} />
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.actionRow} onPress={handleImport} disabled={isLoading}>
                        <Text style={[styles.actionLabel, { color: colors.destructive }]}>{t('importData')}</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Version 1.0.0 Pro</Text>

            </ScrollView>

            {/* Avatar Picker Modal */}
            <AvatarPickerModal
                visible={isAvatarPickerOpen}
                onClose={() => setIsAvatarPickerOpen(false)}
                currentAvatar={currentUser?.avatarEmoji || '👤'}
                onSelectAvatar={handleAvatarChange}
            />
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background[theme] },
    header: {
        paddingHorizontal: spacing.md, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.border[theme],
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.foreground[theme] },
    scrollContent: { padding: spacing.md },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.muted[theme], marginBottom: 12, textTransform: 'uppercase' },

    row: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border[theme]
    },
    label: { fontSize: 16, color: colors.foreground[theme] },

    pillContainer: { flexDirection: 'row', backgroundColor: colors.card[theme], borderRadius: 8, padding: 2 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    pillActive: { backgroundColor: colors.background[theme], shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    pillText: { fontSize: 13, color: colors.muted[theme] },
    pillTextActive: { color: colors.foreground[theme], fontWeight: '600' },

    actionRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, backgroundColor: colors.card[theme],
        paddingHorizontal: 16, borderRadius: 12, marginBottom: 8
    },
    actionLabel: { fontSize: 16, color: colors.foreground[theme] },
    separator: { height: 1, backgroundColor: colors.border[theme], marginHorizontal: 16 },

    statusText: { fontSize: 14, fontWeight: 'bold' },

    donateBtn: {
        backgroundColor: '#fbbf24', padding: 16, borderRadius: 12, alignItems: 'center',
        shadowColor: "#fbbf24", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
    },
    donateText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

    version: { textAlign: 'center', color: colors.muted[theme], marginTop: 20, marginBottom: 40 },

    // Account Section
    accountCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    accountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    proBadge: {
        backgroundColor: '#fbbf24',
    },
    freeBadge: {
        backgroundColor: colors.border[theme],
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    logoutBtn: {
        borderTopWidth: 1,
        borderTopColor: colors.border[theme],
        paddingTop: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: colors.destructive,
        fontWeight: '600',
    },
    loginBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary[theme],
        borderRadius: 16,
        padding: 16,
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 2,
    },
    loginBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    loginBtnText: {
        color: colors.primary[theme],
        fontWeight: 'bold',
    },
});
