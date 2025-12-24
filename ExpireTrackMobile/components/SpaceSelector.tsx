import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    useColorScheme,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useSettingsStore } from '../store/settingsStore';
import { PlusIcon } from './Icons';

const { width } = Dimensions.get('window');

interface SpaceSelectorProps {
    onCreateSpace: () => void;
    onJoinSpace: () => void;
    onOpenProUpgrade?: () => void;
    onSpaceSettings?: (spaceId: string) => void;
}

export default function SpaceSelector({
    onCreateSpace,
    onJoinSpace,
    onOpenProUpgrade,
    onSpaceSettings
}: SpaceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingSpaceId, setLoadingSpaceId] = useState<string | null>(null);

    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';

    const { isPro } = useUserStore();
    const {
        currentSpaceId,
        switchSpace,
        getCurrentSpace,
        getMySpace,
        getFamilySpaces,
        getMemberCount,
        getSpaceMembers
    } = useSpaceStore();

    const currentSpace = getCurrentSpace();
    const mySpace = getMySpace();
    const familySpaces = getFamilySpaces();

    const styles = getStyles(theme);

    const handleSelectSpace = (spaceId: string) => {
        if (spaceId === currentSpaceId) {
            setIsOpen(false);
            return;
        }

        // Show loading indicator
        setIsLoading(true);
        setLoadingSpaceId(spaceId);

        // Small delay for visual feedback
        setTimeout(() => {
            switchSpace(spaceId);
            setIsOpen(false);
            setIsLoading(false);
            setLoadingSpaceId(null);
        }, 300);
    };

    const handleProAction = () => {
        if (isPro) {
            // Show options to create or join
            setIsOpen(false);
        } else {
            // Open upgrade screen
            setIsOpen(false);
            onOpenProUpgrade?.();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <TouchableOpacity
                style={styles.trigger}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.triggerIcon}>{currentSpace?.icon || '🏠'}</Text>
                <View style={styles.triggerTextContainer}>
                    <Text style={styles.triggerLabel}>
                        {currentSpace?.type === 'MY_SPACE' ? 'My Space' : currentSpace?.name || 'Select Space'}
                    </Text>
                    {currentSpace?.type === 'FAMILY_SPACE' && (
                        <Text style={styles.triggerMemberCount}>
                            {getMemberCount(currentSpaceId)} members
                        </Text>
                    )}
                </View>
                <Text style={styles.triggerChevron}>▼</Text>
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.dropdown}>
                        <Text style={styles.dropdownTitle}>Switch Space</Text>

                        <ScrollView style={styles.spaceList} showsVerticalScrollIndicator={false}>
                            {/* My Space */}
                            <TouchableOpacity
                                style={[
                                    styles.spaceItem,
                                    currentSpaceId === MY_SPACE_ID && styles.spaceItemActive,
                                    loadingSpaceId === MY_SPACE_ID && styles.spaceItemLoading
                                ]}
                                onPress={() => handleSelectSpace(MY_SPACE_ID)}
                                disabled={isLoading}
                            >
                                <Text style={styles.spaceItemIcon}>🏠</Text>
                                <View style={styles.spaceItemInfo}>
                                    <Text style={[
                                        styles.spaceItemName,
                                        currentSpaceId === MY_SPACE_ID && styles.spaceItemNameActive
                                    ]}>My Space</Text>
                                    <Text style={styles.spaceItemDesc}>Personal inventory</Text>
                                </View>
                                {loadingSpaceId === MY_SPACE_ID ? (
                                    <ActivityIndicator size="small" color={colors.primary[theme]} />
                                ) : currentSpaceId === MY_SPACE_ID ? (
                                    <View style={styles.checkmark}>
                                        <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>

                            {/* Divider */}
                            {(familySpaces.length > 0 || isPro) && (
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>FAMILY SPACES</Text>
                                    <View style={styles.dividerLine} />
                                </View>
                            )}

                            {/* Family Spaces */}
                            {familySpaces.map((space) => {
                                const members = getSpaceMembers(space.id);
                                return (
                                    <View key={space.id} style={styles.spaceItemRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.spaceItem,
                                                styles.spaceItemFlex,
                                                currentSpaceId === space.id && styles.spaceItemActive,
                                                loadingSpaceId === space.id && styles.spaceItemLoading
                                            ]}
                                            onPress={() => handleSelectSpace(space.id)}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.spaceItemIcon}>{space.icon}</Text>
                                            <View style={styles.spaceItemInfo}>
                                                <Text style={[
                                                    styles.spaceItemName,
                                                    currentSpaceId === space.id && styles.spaceItemNameActive
                                                ]}>{space.name}</Text>
                                                {/* Member Avatars */}
                                                <View style={styles.memberAvatarsRow}>
                                                    {members.slice(0, 3).map((member, index) => (
                                                        <View
                                                            key={member.id}
                                                            style={[
                                                                styles.memberAvatarSmall,
                                                                { marginLeft: index > 0 ? -6 : 0, zIndex: 10 - index }
                                                            ]}
                                                        >
                                                            <Text style={styles.memberAvatarSmallText}>
                                                                {member.avatarEmoji || '😀'}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                    {members.length > 3 && (
                                                        <View style={[styles.memberAvatarSmall, styles.memberAvatarSmallMore, { marginLeft: -6 }]}>
                                                            <Text style={styles.memberAvatarSmallMoreText}>
                                                                +{members.length - 3}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    <Text style={styles.memberCountText}>{members.length} members</Text>
                                                </View>
                                            </View>
                                            {loadingSpaceId === space.id ? (
                                                <ActivityIndicator size="small" color={colors.primary[theme]} />
                                            ) : currentSpaceId === space.id ? (
                                                <View style={styles.checkmark}>
                                                    <Text style={styles.checkmarkText}>✓</Text>
                                                </View>
                                            ) : null}
                                        </TouchableOpacity>
                                        {/* Settings Gear */}
                                        <TouchableOpacity
                                            style={styles.settingsBtn}
                                            onPress={() => {
                                                setIsOpen(false);
                                                onSpaceSettings?.(space.id);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Text style={styles.settingsIcon}>⚙️</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            {/* Pro Actions */}
                            {isPro ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionItem}
                                        onPress={() => {
                                            setIsOpen(false);
                                            onCreateSpace();
                                        }}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#e0e7ff' }]}>
                                            <PlusIcon size={16} color="#6366f1" />
                                        </View>
                                        <Text style={styles.actionText}>Create Family Space</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.actionItem}
                                        onPress={() => {
                                            setIsOpen(false);
                                            onJoinSpace();
                                        }}
                                    >
                                        <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                                            <Text style={{ fontSize: 14 }}>🔗</Text>
                                        </View>
                                        <Text style={styles.actionText}>Join with Invite Code</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* Free User Teaser */
                                <TouchableOpacity
                                    style={styles.proTeaser}
                                    onPress={handleProAction}
                                >
                                    <View style={styles.proTeaserHeader}>
                                        <Text style={styles.proTeaserIcon}>👨‍👩‍👧‍👦</Text>
                                        <View style={styles.proBadge}>
                                            <Text style={styles.proBadgeText}>PRO</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.proTeaserTitle}>Family Spaces</Text>
                                    <Text style={styles.proTeaserDesc}>
                                        Share inventory with your family. Everyone stays in sync.
                                    </Text>
                                    <View style={styles.proTeaserButton}>
                                        <Text style={styles.proTeaserButtonText}>Upgrade to Pro</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
    },
    triggerIcon: {
        fontSize: 20,
    },
    triggerTextContainer: {
        flex: 1,
    },
    triggerLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    triggerMemberCount: {
        fontSize: 11,
        color: colors.muted[theme],
    },
    triggerChevron: {
        fontSize: 10,
        color: colors.muted[theme],
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
        paddingHorizontal: 20,
    },
    dropdown: {
        backgroundColor: colors.card[theme],
        borderRadius: 20,
        padding: 20,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginBottom: 16,
    },

    spaceList: {
        maxHeight: 400,
    },

    spaceItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    spaceItemFlex: {
        flex: 1,
        marginBottom: 0,
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsIcon: {
        fontSize: 18,
    },

    spaceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    },
    spaceItemActive: {
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
        borderWidth: 1,
        borderColor: colors.primary[theme],
    },
    spaceItemLoading: {
        opacity: 0.7,
    },
    spaceItemIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    spaceItemInfo: {
        flex: 1,
    },
    spaceItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    spaceItemNameActive: {
        color: colors.primary[theme],
    },
    spaceItemDesc: {
        fontSize: 12,
        color: colors.muted[theme],
        marginTop: 2,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary[theme],
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Member avatars in dropdown
    memberAvatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    memberAvatarSmall: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme === 'dark' ? '#4c1d95' : '#ede9fe',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#1e1b4b' : '#ffffff',
    },
    memberAvatarSmallText: {
        fontSize: 11,
    },
    memberAvatarSmallMore: {
        backgroundColor: colors.primary[theme],
    },
    memberAvatarSmallMoreText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '600',
    },
    memberCountText: {
        fontSize: 12,
        color: theme === 'dark' ? '#a78bfa' : colors.primary[theme],
        marginLeft: 8,
        fontWeight: '500',
    },

    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border[theme],
    },
    dividerText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.muted[theme],
        letterSpacing: 1,
    },

    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
    },
    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground[theme],
    },

    proTeaser: {
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
    },
    proTeaserHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    proTeaserIcon: {
        fontSize: 24,
    },
    proBadge: {
        backgroundColor: colors.primary[theme],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    proTeaserTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginBottom: 4,
    },
    proTeaserDesc: {
        fontSize: 13,
        color: colors.muted[theme],
        lineHeight: 18,
    },
    proTeaserButton: {
        backgroundColor: colors.primary[theme],
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    proTeaserButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
