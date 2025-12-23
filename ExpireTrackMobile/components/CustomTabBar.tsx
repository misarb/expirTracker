import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GridIcon, FolderIcon, PlusIcon, HeartIcon, SettingsIcon } from './Icons';
import { useProductStore } from '../store/productStore';
import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/colors';
import { useColorScheme } from 'react-native';

// Web uses these colors:
// Home: Cyan (#06b6d4)
// List: Purple (#a855f7)
// Add: Primary (Indigo)
// Support: Rose (#f43f5e)
// Settings: Slate (#64748b) - for dark/light mode we might adjust

const TAB_ITEMS = [
    { label: 'Home', icon: GridIcon, color: '#06b6d4', routeIndex: 0 },
    { label: 'Spaces', icon: FolderIcon, color: '#a855f7', routeIndex: 1 },
    { label: 'Add', icon: PlusIcon, color: '#6366F1', routeIndex: -1 }, // Special center button
    { label: 'Support', icon: HeartIcon, color: '#f43f5e', routeIndex: 2 },
    { label: 'Settings', icon: SettingsIcon, color: '#94a3b8', routeIndex: 3 },
];

export default function CustomTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();
    const { theme: themeSetting } = useSettingsStore(); // Import needed if not global
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark'; // Unified logic
    const { setAddModalOpen } = useUIStore();

    // We have 5 slots in UI, but state.routes only has 4.
    // Logic: 
    // UI Index 0 (Home) -> route[0]
    // UI Index 1 (List) -> route[1]
    // UI Index 2 (Add) -> Open Modal
    // UI Index 3 (Support) -> route[2]
    // UI Index 4 (Settings) -> route[3]

    // Determine which UI Tab is active
    const activeRouteIndex = state.index;
    // Map route index to UI index
    // 0 (Home) -> 0
    // 1 (Spaces) -> 1
    // 2 (Support) -> 3
    // 3 (Settings) -> 4
    const uiActiveIndex = activeRouteIndex === 0 ? 0 : activeRouteIndex === 1 ? 1 : activeRouteIndex === 2 ? 3 : 4;

    // Indicator Position (0% -> 8%, 1 -> 28%, 2 -> 50%(skip), 3 -> 62%, 4 -> 82%)
    // Web logic:
    // Home: 8%
    // Inv: 28%
    // Supp: 62%
    // Sett: 82%
    // Center: 50%
    const indicatorLeft =
        uiActiveIndex === 0 ? '8%' :
            uiActiveIndex === 1 ? '28%' :
                uiActiveIndex === 3 ? '62%' :
                    '82%';

    // Indicator Color
    // Home: Cyan list
    const activeColor = TAB_ITEMS[uiActiveIndex].color;

    return (
        <View style={[styles.container, {
            paddingBottom: insets.bottom + 10,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }]}>
            {/* Active Indicator Line */}
            <View style={[styles.indicatorContainer, { left: indicatorLeft }]}>
                <LinearGradient
                    colors={[activeColor, activeColor]} // Simplifed gradient same color for now
                    style={styles.indicator}
                />
            </View>

            <View style={styles.tabRow}>
                {TAB_ITEMS.map((item, index) => {
                    const isFocused = index === uiActiveIndex;
                    const isAddButton = index === 2;

                    if (isAddButton) {
                        return (
                            <View key={index} style={styles.centerButtonContainer}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setAddModalOpen(true)}
                                    style={styles.centerButton}
                                >
                                    <LinearGradient
                                        colors={['#6366F1', '#4F46E5']}
                                        style={styles.gradientButton}
                                    >
                                        <PlusIcon size={28} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    const routeIndex = item.routeIndex;
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: state.routes[routeIndex].key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(state.routes[routeIndex].name);
                        }
                    };

                    const Icon = item.icon;

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconWrapper,
                                isFocused && { transform: [{ scale: 1.1 }] }
                            ]}>
                                <Icon
                                    size={24}
                                    color={isFocused ? item.color : (isDark ? '#94a3b8' : '#64748b')}
                                />
                            </View>
                            <Text style={[
                                styles.label,
                                { color: isFocused ? item.color : (isDark ? '#94a3b8' : '#64748b') },
                                isFocused && { fontWeight: '600' }
                            ]}>
                                {item.label}
                            </Text>
                            {isFocused && (
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingTop: 12,
    },
    indicatorContainer: {
        position: 'absolute',
        top: 0,
        width: '12%',
        height: 4,
        alignItems: 'center',
    },
    indicator: {
        width: '100%',
        height: '100%',
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    iconWrapper: {
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
    },
    dot: {
        position: 'absolute',
        bottom: -6,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    centerButtonContainer: {
        width: 60,
        alignItems: 'center',
        zIndex: 10,
        marginTop: -30, // Float up
    },
    centerButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientButton: {
        flex: 1,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    }
});
