import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/colors';

interface SpaceBannerProps {
    variant?: 'default' | 'compact';
}

export default function SpaceBanner({ variant = 'default' }: SpaceBannerProps) {
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';

    const { getCurrentSpace, currentSpaceId } = useSpaceStore();
    const currentSpace = getCurrentSpace();

    const isMySpace = currentSpaceId === MY_SPACE_ID;
    const spaceName = isMySpace ? 'My Space' : currentSpace?.name || 'Unknown';
    const spaceIcon = currentSpace?.icon || (isMySpace ? '🏠' : '👨‍👩‍👧‍👦');

    const styles = getStyles(theme, isMySpace, variant);

    if (variant === 'compact') {
        return (
            <View style={styles.compactBanner}>
                <Text style={styles.compactIcon}>{spaceIcon}</Text>
                <Text style={styles.compactText}>
                    Adding to: <Text style={styles.compactSpaceName}>{spaceName}</Text>
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.banner}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{spaceIcon}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>Adding to</Text>
                <Text style={styles.spaceName}>{spaceName}</Text>
            </View>
            {!isMySpace && (
                <View style={styles.sharedBadge}>
                    <Text style={styles.sharedBadgeText}>Shared</Text>
                </View>
            )}
        </View>
    );
}

const getStyles = (theme: 'light' | 'dark', isMySpace: boolean, variant: string) => StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isMySpace
            ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)')
            : (theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'),
        borderWidth: 1,
        borderColor: isMySpace
            ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)')
            : (theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'),
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: isMySpace
            ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)')
            : (theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: colors.muted[theme],
        marginBottom: 2,
    },
    spaceName: {
        fontSize: 16,
        fontWeight: '600',
        color: isMySpace
            ? (theme === 'dark' ? '#4ade80' : '#16a34a')
            : (theme === 'dark' ? '#a5b4fc' : '#6366f1'),
    },
    sharedBadge: {
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sharedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme === 'dark' ? '#a5b4fc' : '#6366f1',
    },

    // Compact variant styles
    compactBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isMySpace
            ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)')
            : (theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)'),
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 6,
    },
    compactIcon: {
        fontSize: 14,
    },
    compactText: {
        fontSize: 13,
        color: colors.muted[theme],
    },
    compactSpaceName: {
        fontWeight: '600',
        color: isMySpace
            ? (theme === 'dark' ? '#4ade80' : '#16a34a')
            : (theme === 'dark' ? '#a5b4fc' : '#6366f1'),
    },
});
