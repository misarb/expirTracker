import React, { useMemo, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import { colors } from '../theme/colors';
import { Activity } from '../types/spaces';
import JoinSpaceModal from '../components/JoinSpaceModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16 padding on each side + 16 gap

export default function MembersScreen() {
    const navigation = useNavigation<any>();
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const {
        getFamilySpaces,
        getSpaceMembers,
        getSpaceActivities,
        fetchActivities,
        currentSpaceId,
        switchSpace,
        getMySpace,
        fetchSpaces,
    } = useSpaceStore();
    const { getUserId } = useUserStore();
    const { getProductsBySpace } = useProductStore();

    const familySpaces = getFamilySpaces();
    const mySpace = getMySpace();
    const mySpaceProducts = getProductsBySpace(MY_SPACE_ID);
    const userId = getUserId();

    // Refresh spaces on mount to get latest member data
    useEffect(() => {
        fetchSpaces();
    }, []);

    // Fetch activities for all family spaces on mount
    useEffect(() => {
        familySpaces.forEach(space => {
            fetchActivities(space.id);
        });
    }, [familySpaces.length]); // Re-fetch if number of spaces changes

    // Get activities for all family spaces from state
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
                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>Family Spaces</Text>
                    <Text style={styles.pageSubtitle}>
                        Share and manage your household inventory together
                    </Text>
                </View>

                {/* Join Space Button */}
                <TouchableOpacity
                    style={styles.joinSpaceBtn}
                    onPress={() => setIsJoinModalOpen(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.joinSpaceIconContainer}>
                        <Text style={styles.joinSpaceIcon}>🔗</Text>
                    </View>
                    <View style={styles.joinSpaceContent}>
                        <Text style={styles.joinSpaceBtnText}>Join a Family Space</Text>
                        <Text style={styles.joinSpaceBtnSubtext}>Connect with family members</Text>
                    </View>
                    <Text style={styles.joinSpaceArrow}>→</Text>
                </TouchableOpacity>

                {/* Your Spaces Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Spaces</Text>

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

            {/* Join Space Modal */}
            <JoinSpaceModal
                visible={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
            />
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
    headerSection: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme] + '30',
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.foreground[theme],
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontSize: 15,
        color: colors.muted[theme],
        lineHeight: 22,
    },
    joinSpaceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: colors.primary[theme],
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    joinSpaceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary[theme] + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    joinSpaceIcon: {
        fontSize: 22,
    },
    joinSpaceContent: {
        flex: 1,
    },
    joinSpaceBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 2,
    },
    joinSpaceBtnSubtext: {
        fontSize: 13,
        color: colors.muted[theme],
    },
    joinSpaceArrow: {
        fontSize: 20,
        color: colors.primary[theme],
        fontWeight: '600',
    },

    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.foreground[theme],
        marginBottom: 16,
        letterSpacing: -0.3,
    },

    // Spaces Grid
    spacesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    spaceCard: {
        width: CARD_WIDTH,
        backgroundColor: colors.card[theme],
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border[theme],
        minHeight: 150,
        overflow: 'hidden',
    },
    spaceCardActive: {
        borderColor: colors.primary[theme],
        borderWidth: 2,
    },
    spaceCardHeader: {
        marginBottom: 10,
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.secondary[theme],
        justifyContent: 'center',
        alignItems: 'center',
    },
    spaceCardIcon: {
        fontSize: 28,
    },
    spaceCardName: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.foreground[theme],
        marginBottom: 4,
        paddingRight: 30,
        letterSpacing: -0.2,
    },
    spaceCardDesc: {
        fontSize: 13,
        color: colors.muted[theme],
        marginBottom: 12,
        lineHeight: 18,
    },
    spaceCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
    },
    productCount: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.muted[theme],
    },
    memberCount: {
        fontSize: 12,
        color: colors.muted[theme],
    },
    activeBadge: {
        backgroundColor: colors.primary[theme],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    activeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    memberAvatars: {
        flexDirection: 'row',
        marginTop: 8,
        marginBottom: 4,
    },
    memberAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.secondary[theme],
        justifyContent: 'center',
        alignItems: 'center',
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
