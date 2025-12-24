import React, { useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import { colors } from '../theme/colors';
import { Activity } from '../types/spaces';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16 padding on each side + 16 gap

export default function MembersScreen() {
    const navigation = useNavigation<any>();
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const {
        getFamilySpaces,
        getSpaceMembers,
        getSpaceActivities,
        currentSpaceId,
        switchSpace,
        getMySpace
    } = useSpaceStore();
    const { getUserId } = useUserStore();
    const { getProductsBySpace } = useProductStore();

    const familySpaces = getFamilySpaces();
    const mySpace = getMySpace();
    const mySpaceProducts = getProductsBySpace(MY_SPACE_ID);
    const userId = getUserId();

    // Get activities for all family spaces
    const allActivities = useMemo(() => {
        const activities: Activity[] = [];
        familySpaces.forEach(space => {
            activities.push(...getSpaceActivities(space.id));
        });
        return activities
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);
    }, [familySpaces, getSpaceActivities]);

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'PRODUCT_ADDED': return '📦';
            case 'PRODUCT_UPDATED': return '✏️';
            case 'PRODUCT_DELETED': return '🗑️';
            case 'MEMBER_JOINED': return '👋';
            case 'MEMBER_LEFT': return '👤';
            case 'MEMBER_REMOVED': return '❌';
            case 'FOLDER_CREATED': return '📁';
            case 'FOLDER_DELETED': return '🗂️';
            default: return '📝';
        }
    };

    const getActivityMessage = (activity: Activity) => {
        const { type, payload, actorName } = activity;
        switch (type) {
            case 'PRODUCT_ADDED':
                return `${actorName} added "${payload.productName}"`;
            case 'PRODUCT_UPDATED':
                return `${actorName} updated "${payload.productName}"`;
            case 'PRODUCT_DELETED':
                return `${actorName} removed "${payload.productName}"`;
            case 'MEMBER_JOINED':
                return `${payload.memberName} joined the space`;
            case 'MEMBER_LEFT':
                return `${payload.memberName} left the space`;
            case 'MEMBER_REMOVED':
                return `${payload.memberName} was removed`;
            case 'FOLDER_CREATED':
                return `${actorName} created folder "${payload.folderName}"`;
            case 'FOLDER_DELETED':
                return `${actorName} deleted folder "${payload.folderName}"`;
            default:
                return `${actorName} made changes`;
        }
    };

    const handleSpaceSettings = (spaceId: string) => {
        navigation.navigate('Home', {
            screen: 'FamilySpaceSettings',
            params: { spaceId }
        });
    };

    const isMySpaceActive = currentSpaceId === MY_SPACE_ID;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={styles.pageTitle}>👥 Family Hub</Text>
                <Text style={styles.pageSubtitle}>Manage spaces, members & activity</Text>

                {/* Your Spaces Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Spaces</Text>

                    <View style={styles.spacesGrid}>
                        {/* My Space Card */}
                        <TouchableOpacity
                            style={[styles.spaceCard, isMySpaceActive && styles.spaceCardActive]}
                            onPress={() => switchSpace(MY_SPACE_ID)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.spaceCardHeader}>
                                <Text style={styles.spaceCardIcon}>🏠</Text>
                            </View>
                            <Text style={styles.spaceCardName}>My Space</Text>
                            <Text style={styles.spaceCardDesc}>Personal inventory</Text>
                            <View style={styles.spaceCardFooter}>
                                <Text style={styles.productCount}>{mySpaceProducts.length} items</Text>
                                {isMySpaceActive && (
                                    <View style={styles.activeBadge}>
                                        <Text style={styles.activeBadgeText}>Active</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Family Space Cards */}
                        {familySpaces.map((space) => {
                            const members = getSpaceMembers(space.id);
                            const isActive = currentSpaceId === space.id;

                            return (
                                <TouchableOpacity
                                    key={space.id}
                                    style={[styles.spaceCard, isActive && styles.spaceCardActive]}
                                    onPress={() => switchSpace(space.id)}
                                    activeOpacity={0.8}
                                >
                                    {/* Settings Button - positioned absolute */}
                                    <TouchableOpacity
                                        style={styles.settingsBtn}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            handleSpaceSettings(space.id);
                                        }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={styles.settingsIcon}>⚙️</Text>
                                    </TouchableOpacity>

                                    <View style={styles.spaceCardHeader}>
                                        <Text style={styles.spaceCardIcon}>{space.icon}</Text>
                                    </View>
                                    <Text style={styles.spaceCardName} numberOfLines={1}>{space.name}</Text>

                                    {/* Member Avatars */}
                                    <View style={styles.memberAvatars}>
                                        {members.slice(0, 3).map((member, index) => (
                                            <View
                                                key={member.id}
                                                style={[
                                                    styles.memberAvatar,
                                                    { marginLeft: index > 0 ? -10 : 0, zIndex: 10 - index }
                                                ]}
                                            >
                                                <Text style={styles.memberAvatarText}>
                                                    {member.avatarEmoji || '😀'}
                                                </Text>
                                            </View>
                                        ))}
                                        {members.length > 3 && (
                                            <View style={[styles.memberAvatar, styles.memberAvatarMore, { marginLeft: -10 }]}>
                                                <Text style={styles.memberAvatarMoreText}>
                                                    +{members.length - 3}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.spaceCardFooter}>
                                        <Text style={styles.memberCount}>
                                            {members.length} member{members.length !== 1 ? 's' : ''}
                                        </Text>
                                        {isActive && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeBadgeText}>Active</Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Recent Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    {allActivities.length === 0 ? (
                        <View style={styles.emptyActivity}>
                            <Text style={styles.emptyActivityIcon}>📋</Text>
                            <Text style={styles.emptyActivityText}>No recent activity</Text>
                        </View>
                    ) : (
                        <View style={styles.activityList}>
                            {allActivities.map((activity) => {
                                const space = familySpaces.find(s => s.id === activity.spaceId);
                                return (
                                    <View key={activity.id} style={styles.activityItem}>
                                        <View style={styles.activityIconContainer}>
                                            <Text style={styles.activityIcon}>
                                                {getActivityIcon(activity.type)}
                                            </Text>
                                        </View>
                                        <View style={styles.activityContent}>
                                            <Text style={styles.activityMessage} numberOfLines={2}>
                                                {getActivityMessage(activity)}
                                            </Text>
                                            <View style={styles.activityMeta}>
                                                <Text style={styles.activitySpace}>
                                                    {space?.icon} {space?.name}
                                                </Text>
                                                <Text style={styles.activityTime}>
                                                    {formatTimeAgo(activity.createdAt)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background[theme],
    },
    content: {
        padding: 16,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: colors.muted[theme],
        marginBottom: 24,
    },

    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 12,
    },

    // Spaces Grid
    spacesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    spaceCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border[theme],
        position: 'relative',
        minHeight: 140,
    },
    spaceCardActive: {
        borderColor: colors.primary[theme],
        borderWidth: 2,
    },
    spaceCardHeader: {
        marginBottom: 8,
    },
    spaceCardIcon: {
        fontSize: 32,
    },
    spaceCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 4,
        paddingRight: 30, // Space for settings button
    },
    spaceCardDesc: {
        fontSize: 12,
        color: colors.muted[theme],
        marginBottom: 8,
    },
    spaceCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    productCount: {
        fontSize: 12,
        color: colors.muted[theme],
    },
    memberCount: {
        fontSize: 12,
        color: colors.muted[theme],
    },
    activeBadge: {
        backgroundColor: colors.primary[theme],
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    activeBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    memberAvatars: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    memberAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#f5f3ff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.card[theme],
    },
    memberAvatarText: {
        fontSize: 12,
    },
    memberAvatarMore: {
        backgroundColor: colors.primary[theme],
    },
    memberAvatarMoreText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '600',
    },
    settingsBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    settingsIcon: {
        fontSize: 14,
    },

    // Empty States
    emptyCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.muted[theme],
        textAlign: 'center',
    },

    // Activity
    emptyActivity: {
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    emptyActivityIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyActivityText: {
        fontSize: 14,
        color: colors.muted[theme],
    },
    activityList: {
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    activityItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme],
    },
    activityIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityIcon: {
        fontSize: 18,
    },
    activityContent: {
        flex: 1,
    },
    activityMessage: {
        fontSize: 14,
        color: colors.foreground[theme],
        marginBottom: 4,
    },
    activityMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    activitySpace: {
        fontSize: 12,
        color: colors.muted[theme],
    },
    activityTime: {
        fontSize: 12,
        color: colors.muted[theme],
    },
});
