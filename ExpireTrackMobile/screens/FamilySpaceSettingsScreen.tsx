import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Alert,
    TextInput,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { useProductStore } from '../store/productStore';
import { colors, spacing } from '../theme/colors';
import { TrashIcon } from '../components/Icons';
import InviteModal from '../components/InviteModal';

export default function FamilySpaceSettingsScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { spaceId } = route.params as { spaceId: string };

    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';

    const {
        getSpaceById,
        getSpaceMembers,
        getMemberCount,
        isOwner,
        leaveSpace,
        deleteSpace,
        removeMember,
        transferOwnership,
        isSpaceNotificationEnabled,
        setSpaceNotificationEnabled,
        getSpaceActivities,
    } = useSpaceStore();
    const { getUserId, currentUser } = useUserStore();
    const { getProductsBySpace } = useProductStore();

    const space = getSpaceById(spaceId);
    const members = getSpaceMembers(spaceId);
    const memberCount = getMemberCount(spaceId);
    const isSpaceOwner = isOwner(spaceId);
    const userId = getUserId();
    const products = getProductsBySpace(spaceId);
    const activities = getSpaceActivities(spaceId);
    const notificationsEnabled = isSpaceNotificationEnabled(spaceId);

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const styles = getStyles(theme);

    // Safe goBack - navigate to Home if can't go back
    const safeGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            (navigation as any).navigate('HomeMain');
        }
    };

    if (!space) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Space not found</Text>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={safeGoBack}
                    >
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleLeaveSpace = () => {
        const message = isSpaceOwner && memberCount > 1
            ? 'As the owner, if you leave, ownership will be transferred to the oldest member. Are you sure?'
            : isSpaceOwner && memberCount === 1
                ? 'You are the only member. Leaving will delete this space and all its products. Are you sure?'
                : 'You will lose access to all products and history in this space. Are you sure?';

        Alert.alert(
            'Leave Space',
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: () => {
                        leaveSpace(spaceId);
                        safeGoBack();
                    }
                }
            ]
        );
    };

    const handleDeleteSpace = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDeleteSpace = () => {
        if (deleteConfirmText.trim().toLowerCase() !== space.name.toLowerCase()) {
            Alert.alert('Incorrect Name', 'Please type the exact space name to confirm deletion.');
            return;
        }

        deleteSpace(spaceId);
        safeGoBack();
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (memberId === userId) return; // Can't remove yourself

        Alert.alert(
            'Remove Member',
            `Remove ${memberName} from this space? They will lose access to all shared products.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await removeMember(spaceId, memberId);
                        if (!result.success) {
                            Alert.alert('Error', result.error || 'Failed to remove member');
                        }
                    }
                }
            ]
        );
    };

    const handleTransferOwnership = async (memberId: string, memberName: string) => {
        if (memberId === userId) return; // Can't transfer to yourself

        Alert.alert(
            'Transfer Ownership',
            `Transfer ownership to ${memberName}? You will become a regular member and lose owner privileges.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Transfer',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await transferOwnership(spaceId, memberId);
                        if (result.success) {
                            Alert.alert(
                                'Ownership Transferred',
                                `${memberName} is now the owner of this space.`
                            );
                        } else {
                            Alert.alert('Error', result.error || 'Failed to transfer ownership');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={safeGoBack}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Space Settings</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Space Info */}
                <View style={styles.spaceCard}>
                    <Text style={styles.spaceIcon}>{space.icon}</Text>
                    <Text style={styles.spaceName}>{space.name}</Text>
                    <Text style={styles.spaceMeta}>
                        {memberCount} member{memberCount !== 1 ? 's' : ''} • {products.length} products
                    </Text>
                    {isSpaceOwner && (
                        <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>👑 Owner</Text>
                        </View>
                    )}
                </View>

                {/* Invite Section (Owner only) */}
                {isSpaceOwner && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Invite Members</Text>
                        <TouchableOpacity
                            style={styles.inviteBtn}
                            onPress={() => setIsInviteModalOpen(true)}
                        >
                            <Text style={styles.inviteBtnIcon}>🔗</Text>
                            <View style={styles.inviteBtnContent}>
                                <Text style={styles.inviteBtnText}>Get Invite Code</Text>
                                <Text style={styles.inviteBtnSubtext}>Share with family to let them join</Text>
                            </View>
                            <Text style={styles.inviteArrow}>→</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Members Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members ({memberCount})</Text>
                    {members.map((member) => (
                        <View key={member.id} style={styles.memberRow}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>{member.avatarEmoji}</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {member.displayName}
                                    {member.id === userId && ' (You)'}
                                </Text>
                                {member.id === space.createdBy && (
                                    <Text style={styles.memberRole}>Owner</Text>
                                )}
                            </View>
                            {isSpaceOwner && member.id !== userId && (
                                <View style={styles.memberActions}>
                                    <TouchableOpacity
                                        style={styles.transferOwnerBtn}
                                        onPress={() => handleTransferOwnership(member.id, member.displayName)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.transferOwnerIcon}>👑</Text>
                                        <Text style={styles.transferOwnerText}>Transfer</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.removeMemberBtn}
                                        onPress={() => handleRemoveMember(member.id, member.displayName)}
                                        activeOpacity={0.8}
                                    >
                                        <TrashIcon size={14} color="#fff" />
                                        <Text style={styles.removeMemberText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Expiration Alerts</Text>
                            <Text style={styles.settingDesc}>
                                Receive notifications for expiring products
                            </Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={(enabled) => setSpaceNotificationEnabled(spaceId, enabled)}
                            trackColor={{ false: colors.border[theme], true: colors.primary[theme] }}
                        />
                    </View>
                </View>

                {/* Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <Text style={styles.sectionCount}>{activities.length} events</Text>
                    </View>
                    {activities.slice(0, 5).map((activity) => (
                        <View key={activity.id} style={styles.activityRow}>
                            <Text style={styles.activityText}>
                                <Text style={styles.activityActor}>{activity.actorName}</Text>
                                {' '}
                                {activity.type === 'PRODUCT_ADDED' && `added ${activity.payload.productName}`}
                                {activity.type === 'PRODUCT_UPDATED' && `updated ${activity.payload.productName}`}
                                {activity.type === 'PRODUCT_DELETED' && `deleted ${activity.payload.productName}`}
                                {activity.type === 'MEMBER_JOINED' && 'joined the space'}
                                {activity.type === 'MEMBER_LEFT' && 'left the space'}
                                {activity.type === 'MEMBER_REMOVED' && `was removed`}
                            </Text>
                            <Text style={styles.activityTime}>
                                {new Date(activity.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ))}
                    {activities.length === 0 && (
                        <Text style={styles.emptyText}>No activity yet</Text>
                    )}
                </View>

                {/* Danger Zone */}
                <View style={[styles.section, styles.dangerSection]}>
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>

                    {/* Leave Space */}
                    <TouchableOpacity
                        style={styles.dangerBtn}
                        onPress={handleLeaveSpace}
                    >
                        <Text style={styles.dangerBtnText}>🚪 Leave this Space</Text>
                    </TouchableOpacity>

                    {/* Delete Space (Owner only) */}
                    {isSpaceOwner && (
                        <>
                            {showDeleteConfirm ? (
                                <View style={styles.deleteConfirm}>
                                    <Text style={styles.deleteConfirmLabel}>
                                        Type "{space.name}" to confirm deletion:
                                    </Text>
                                    <TextInput
                                        style={styles.deleteConfirmInput}
                                        value={deleteConfirmText}
                                        onChangeText={setDeleteConfirmText}
                                        placeholder={space.name}
                                        placeholderTextColor="#ef4444"
                                    />
                                    <View style={styles.deleteConfirmActions}>
                                        <TouchableOpacity
                                            style={styles.deleteConfirmCancel}
                                            onPress={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                        >
                                            <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteConfirmBtn}
                                            onPress={confirmDeleteSpace}
                                        >
                                            <Text style={styles.deleteConfirmBtnText}>Delete Forever</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.dangerBtn, { backgroundColor: '#fef2f2' }]}
                                    onPress={handleDeleteSpace}
                                >
                                    <Text style={[styles.dangerBtnText, { color: '#dc2626' }]}>
                                        🗑️ Delete this Space
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>

                <View style={{ height: 50 }} />
            </ScrollView>

            <InviteModal
                visible={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                spaceId={spaceId}
            />
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background[theme]
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme],
    },
    backText: {
        fontSize: 16,
        color: colors.primary[theme],
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    content: {
        padding: spacing.md,
    },

    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 18,
        color: colors.muted[theme],
        marginBottom: 16,
    },
    backBtn: {
        backgroundColor: colors.primary[theme],
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '600',
    },

    spaceCard: {
        backgroundColor: colors.card[theme],
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    spaceIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    spaceName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginBottom: 4,
    },
    spaceMeta: {
        fontSize: 14,
        color: colors.muted[theme],
    },
    ownerBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 12,
    },
    ownerBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
    },

    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 12,
    },
    sectionCount: {
        fontSize: 13,
        color: colors.muted[theme],
    },

    inviteBtn: {
        backgroundColor: colors.card[theme],
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    inviteBtnIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    inviteBtnContent: {
        flex: 1,
    },
    inviteBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    inviteBtnSubtext: {
        fontSize: 12,
        color: colors.muted[theme],
        marginTop: 2,
    },
    inviteArrow: {
        fontSize: 18,
        color: colors.muted[theme],
    },

    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondary[theme],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    memberAvatarText: {
        fontSize: 20,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground[theme],
    },
    memberRole: {
        fontSize: 12,
        color: colors.primary[theme],
    },
    memberActions: {
        flexDirection: 'row',
        gap: 8,
    },
    transferOwnerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.primary[theme] + '15',
        borderWidth: 1.5,
        borderColor: colors.primary[theme],
    },
    transferOwnerIcon: {
        fontSize: 14,
    },
    transferOwnerText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary[theme],
    },
    removeMemberBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: '#dc2626',
    },
    removeMemberText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },

    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        padding: 16,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.foreground[theme],
    },
    settingDesc: {
        fontSize: 12,
        color: colors.muted[theme],
        marginTop: 2,
    },

    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border[theme],
    },
    activityText: {
        flex: 1,
        fontSize: 14,
        color: colors.foreground[theme],
    },
    activityActor: {
        fontWeight: '600',
    },
    activityTime: {
        fontSize: 12,
        color: colors.muted[theme],
    },
    emptyText: {
        fontSize: 14,
        color: colors.muted[theme],
        textAlign: 'center',
        paddingVertical: 20,
    },

    dangerSection: {
        backgroundColor: '#fef2f2',
        borderRadius: 16,
        padding: 16,
    },
    dangerBtn: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    dangerBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
    },

    deleteConfirm: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    deleteConfirmLabel: {
        fontSize: 14,
        color: '#dc2626',
        marginBottom: 8,
    },
    deleteConfirmInput: {
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#dc2626',
        backgroundColor: '#fef2f2',
        marginBottom: 12,
    },
    deleteConfirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteConfirmCancel: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    deleteConfirmCancelText: {
        fontWeight: '600',
        color: '#374151',
    },
    deleteConfirmBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#dc2626',
        alignItems: 'center',
    },
    deleteConfirmBtnText: {
        fontWeight: '600',
        color: '#fff',
    },
});
