import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Space,
    Membership,
    Invite,
    Activity,
    SpaceNotificationPreference,
    SpaceType,
    MemberRole,
    ActivityType,
    generateId,
    generateInviteCode,
    getDefaultInviteExpiry,
    UserProfile
} from '../types/spaces';
import { useUserStore } from './userStore';

// Constants
const MY_SPACE_ID = 'my-space';
const MAX_ACTIVITY_ITEMS = 50;

interface SpaceStore {
    // State
    spaces: Space[];
    memberships: Membership[];
    invites: Invite[];
    activities: Activity[];
    notificationPreferences: SpaceNotificationPreference[];
    currentSpaceId: string;

    // For local demo: mock members in family spaces
    mockMembers: { [spaceId: string]: UserProfile[] };

    // Space Management
    initializeMySpace: () => void;
    createFamilySpace: (name: string, icon?: string) => Space;
    deleteSpace: (spaceId: string) => void;
    updateSpaceName: (spaceId: string, name: string) => void;
    switchSpace: (spaceId: string) => void;

    // Membership
    joinSpaceWithCode: (code: string) => { success: boolean; error?: string; space?: Space };
    leaveSpace: (spaceId: string) => void;
    removeMember: (spaceId: string, userId: string) => void;
    transferOwnership: (spaceId: string, newOwnerId: string) => void;

    // Invites
    createInvite: (spaceId: string, maxUses?: number) => Invite;
    revokeInvite: (inviteId: string) => void;
    regenerateInvite: (spaceId: string) => Invite;
    getActiveInvite: (spaceId: string) => Invite | null;

    // Activity
    logActivity: (spaceId: string, type: ActivityType, payload: Activity['payload']) => void;
    getSpaceActivities: (spaceId: string) => Activity[];

    // Notifications
    setSpaceNotificationEnabled: (spaceId: string, enabled: boolean) => void;
    isSpaceNotificationEnabled: (spaceId: string) => boolean;

    // Getters
    getCurrentSpace: () => Space | null;
    getMySpace: () => Space | null;
    getFamilySpaces: () => Space[];
    getSpaceById: (spaceId: string) => Space | null;
    getSpaceMembers: (spaceId: string) => UserProfile[];
    getMemberCount: (spaceId: string) => number;
    getUserRole: (spaceId: string) => MemberRole | null;
    isOwner: (spaceId: string) => boolean;
    hasFamilySpaces: () => boolean;
}

export const useSpaceStore = create<SpaceStore>()(
    persist(
        (set, get) => ({
            spaces: [],
            memberships: [],
            invites: [],
            activities: [],
            notificationPreferences: [],
            currentSpaceId: MY_SPACE_ID,
            mockMembers: {},

            // Initialize My Space (called on app start)
            initializeMySpace: () => {
                const spaces = get().spaces;
                const mySpace = spaces.find(s => s.id === MY_SPACE_ID);

                if (!mySpace) {
                    const userId = useUserStore.getState().getUserId();
                    const newMySpace: Space = {
                        id: MY_SPACE_ID,
                        name: 'My Space',
                        type: 'MY_SPACE',
                        icon: '🏠',
                        createdBy: userId || 'system',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    set((state) => ({
                        spaces: [newMySpace, ...state.spaces],
                        currentSpaceId: MY_SPACE_ID,
                    }));
                }
            },

            // Create a new Family Space
            createFamilySpace: (name: string, icon: string = '👨‍👩‍👧‍👦') => {
                const userId = useUserStore.getState().getUserId();
                const displayName = useUserStore.getState().getDisplayName();

                if (!userId) {
                    throw new Error('User not initialized');
                }

                const newSpace: Space = {
                    id: generateId(),
                    name,
                    type: 'FAMILY_SPACE',
                    icon,
                    createdBy: userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const membership: Membership = {
                    id: generateId(),
                    userId,
                    spaceId: newSpace.id,
                    role: 'OWNER',
                    joinedAt: new Date().toISOString(),
                    status: 'ACTIVE',
                };

                // Create initial invite
                const invite: Invite = {
                    id: generateId(),
                    spaceId: newSpace.id,
                    code: generateInviteCode(),
                    createdBy: userId,
                    expiresAt: getDefaultInviteExpiry(),
                    maxUses: 5,
                    usedCount: 0,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString(),
                };

                // Default notification preference (enabled)
                const notifPref: SpaceNotificationPreference = {
                    userId,
                    spaceId: newSpace.id,
                    enabled: true,
                };

                // Add current user as mock member
                const currentUser = useUserStore.getState().currentUser;
                const mockMember: UserProfile = currentUser || {
                    id: userId,
                    displayName,
                    avatarEmoji: '😀',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    spaces: [...state.spaces, newSpace],
                    memberships: [...state.memberships, membership],
                    invites: [...state.invites, invite],
                    notificationPreferences: [...state.notificationPreferences, notifPref],
                    currentSpaceId: newSpace.id, // Switch to new space
                    mockMembers: {
                        ...state.mockMembers,
                        [newSpace.id]: [mockMember],
                    },
                }));

                // Log activity
                get().logActivity(newSpace.id, 'MEMBER_JOINED', {
                    memberName: displayName,
                    memberId: userId,
                });

                return newSpace;
            },

            // Delete a Family Space (Owner only)
            deleteSpace: (spaceId: string) => {
                if (spaceId === MY_SPACE_ID) return; // Can't delete My Space

                const userId = useUserStore.getState().getUserId();
                const membership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === userId && m.role === 'OWNER'
                );

                if (!membership) return; // Not an owner

                set((state) => ({
                    spaces: state.spaces.filter(s => s.id !== spaceId),
                    memberships: state.memberships.filter(m => m.spaceId !== spaceId),
                    invites: state.invites.filter(i => i.spaceId !== spaceId),
                    activities: state.activities.filter(a => a.spaceId !== spaceId),
                    notificationPreferences: state.notificationPreferences.filter(n => n.spaceId !== spaceId),
                    currentSpaceId: state.currentSpaceId === spaceId ? MY_SPACE_ID : state.currentSpaceId,
                    mockMembers: Object.fromEntries(
                        Object.entries(state.mockMembers).filter(([id]) => id !== spaceId)
                    ),
                }));
            },

            // Update space name
            updateSpaceName: (spaceId: string, name: string) => {
                set((state) => ({
                    spaces: state.spaces.map(s =>
                        s.id === spaceId
                            ? { ...s, name, updatedAt: new Date().toISOString() }
                            : s
                    ),
                }));
            },

            // Switch to a different space
            switchSpace: (spaceId: string) => {
                const space = get().spaces.find(s => s.id === spaceId);
                if (space) {
                    set({ currentSpaceId: spaceId });
                }
            },

            // Join a Family Space with invite code
            joinSpaceWithCode: (code: string) => {
                const invite = get().invites.find(
                    i => i.code.toUpperCase() === code.toUpperCase() && i.status === 'ACTIVE'
                );

                if (!invite) {
                    return { success: false, error: 'Invalid invite code' };
                }

                // Check expiration
                if (new Date(invite.expiresAt) < new Date()) {
                    set((state) => ({
                        invites: state.invites.map(i =>
                            i.id === invite.id ? { ...i, status: 'EXPIRED' as const } : i
                        ),
                    }));
                    return { success: false, error: 'This invite has expired' };
                }

                // Check max uses
                if (invite.usedCount >= invite.maxUses) {
                    return { success: false, error: 'This invite has reached its maximum uses' };
                }

                const userId = useUserStore.getState().getUserId();
                const displayName = useUserStore.getState().getDisplayName();

                if (!userId) {
                    return { success: false, error: 'User not initialized' };
                }

                // Check if already a member
                const existingMembership = get().memberships.find(
                    m => m.spaceId === invite.spaceId && m.userId === userId && m.status === 'ACTIVE'
                );

                if (existingMembership) {
                    const space = get().spaces.find(s => s.id === invite.spaceId);
                    return { success: true, space, error: 'Already a member' };
                }

                const space = get().spaces.find(s => s.id === invite.spaceId);
                if (!space) {
                    return { success: false, error: 'This Family Space no longer exists' };
                }

                // Create membership
                const membership: Membership = {
                    id: generateId(),
                    userId,
                    spaceId: invite.spaceId,
                    role: 'MEMBER',
                    joinedAt: new Date().toISOString(),
                    status: 'ACTIVE',
                };

                // Default notification preference (enabled)
                const notifPref: SpaceNotificationPreference = {
                    userId,
                    spaceId: invite.spaceId,
                    enabled: true,
                };

                // Add current user as mock member
                const currentUser = useUserStore.getState().currentUser;
                const mockMember: UserProfile = currentUser || {
                    id: userId,
                    displayName,
                    avatarEmoji: '😀',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    memberships: [...state.memberships, membership],
                    notificationPreferences: [...state.notificationPreferences, notifPref],
                    invites: state.invites.map(i =>
                        i.id === invite.id ? { ...i, usedCount: i.usedCount + 1 } : i
                    ),
                    currentSpaceId: invite.spaceId, // Switch to joined space
                    mockMembers: {
                        ...state.mockMembers,
                        [invite.spaceId]: [...(state.mockMembers[invite.spaceId] || []), mockMember],
                    },
                }));

                // Log activity
                get().logActivity(invite.spaceId, 'MEMBER_JOINED', {
                    memberName: displayName,
                    memberId: userId,
                });

                return { success: true, space };
            },

            // Leave a Family Space
            leaveSpace: (spaceId: string) => {
                if (spaceId === MY_SPACE_ID) return;

                const userId = useUserStore.getState().getUserId();
                const displayName = useUserStore.getState().getDisplayName();

                if (!userId) return;

                const membership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === userId && m.status === 'ACTIVE'
                );

                if (!membership) return;

                // If owner is leaving, transfer ownership to oldest member
                if (membership.role === 'OWNER') {
                    const otherMembers = get().memberships
                        .filter(m => m.spaceId === spaceId && m.userId !== userId && m.status === 'ACTIVE')
                        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

                    if (otherMembers.length > 0) {
                        // Transfer ownership
                        const newOwner = otherMembers[0];
                        set((state) => ({
                            memberships: state.memberships.map(m =>
                                m.id === newOwner.id ? { ...m, role: 'OWNER' as MemberRole } : m
                            ),
                        }));
                    } else {
                        // No other members, delete the space
                        get().deleteSpace(spaceId);
                        return;
                    }
                }

                // Log activity before leaving
                get().logActivity(spaceId, 'MEMBER_LEFT', {
                    memberName: displayName,
                    memberId: userId,
                });

                set((state) => ({
                    memberships: state.memberships.map(m =>
                        m.id === membership.id ? { ...m, status: 'LEFT' as const } : m
                    ),
                    currentSpaceId: state.currentSpaceId === spaceId ? MY_SPACE_ID : state.currentSpaceId,
                    mockMembers: {
                        ...state.mockMembers,
                        [spaceId]: (state.mockMembers[spaceId] || []).filter(m => m.id !== userId),
                    },
                }));
            },

            // Remove a member (Owner only)
            removeMember: (spaceId: string, targetUserId: string) => {
                const userId = useUserStore.getState().getUserId();

                if (!userId) return;

                // Check if current user is owner
                const ownerMembership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === userId && m.role === 'OWNER' && m.status === 'ACTIVE'
                );

                if (!ownerMembership) return;

                const targetMembership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === targetUserId && m.status === 'ACTIVE'
                );

                if (!targetMembership) return;

                const targetMember = get().mockMembers[spaceId]?.find(m => m.id === targetUserId);

                set((state) => ({
                    memberships: state.memberships.map(m =>
                        m.id === targetMembership.id ? { ...m, status: 'REMOVED' as const } : m
                    ),
                    mockMembers: {
                        ...state.mockMembers,
                        [spaceId]: (state.mockMembers[spaceId] || []).filter(m => m.id !== targetUserId),
                    },
                }));

                // Log activity
                get().logActivity(spaceId, 'MEMBER_REMOVED', {
                    memberName: targetMember?.displayName || 'Unknown',
                    memberId: targetUserId,
                });
            },

            // Transfer ownership
            transferOwnership: (spaceId: string, newOwnerId: string) => {
                const userId = useUserStore.getState().getUserId();

                if (!userId) return;

                // Check if current user is owner
                const currentOwnership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === userId && m.role === 'OWNER' && m.status === 'ACTIVE'
                );

                if (!currentOwnership) return;

                const newOwnerMembership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === newOwnerId && m.status === 'ACTIVE'
                );

                if (!newOwnerMembership) return;

                set((state) => ({
                    memberships: state.memberships.map(m => {
                        if (m.id === currentOwnership.id) {
                            return { ...m, role: 'MEMBER' as MemberRole };
                        }
                        if (m.id === newOwnerMembership.id) {
                            return { ...m, role: 'OWNER' as MemberRole };
                        }
                        return m;
                    }),
                }));
            },

            // Create an invite for a Family Space
            createInvite: (spaceId: string, maxUses: number = 5) => {
                const userId = useUserStore.getState().getUserId();

                if (!userId) {
                    throw new Error('User not initialized');
                }

                const invite: Invite = {
                    id: generateId(),
                    spaceId,
                    code: generateInviteCode(),
                    createdBy: userId,
                    expiresAt: getDefaultInviteExpiry(),
                    maxUses,
                    usedCount: 0,
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    invites: [...state.invites, invite],
                }));

                return invite;
            },

            // Revoke an invite
            revokeInvite: (inviteId: string) => {
                set((state) => ({
                    invites: state.invites.map(i =>
                        i.id === inviteId ? { ...i, status: 'REVOKED' as const } : i
                    ),
                }));
            },

            // Regenerate invite (revoke old ones and create new)
            regenerateInvite: (spaceId: string) => {
                // Revoke all existing active invites for this space
                set((state) => ({
                    invites: state.invites.map(i =>
                        i.spaceId === spaceId && i.status === 'ACTIVE'
                            ? { ...i, status: 'REVOKED' as const }
                            : i
                    ),
                }));

                return get().createInvite(spaceId);
            },

            // Get active invite for a space
            getActiveInvite: (spaceId: string) => {
                const invite = get().invites.find(
                    i => i.spaceId === spaceId && i.status === 'ACTIVE'
                );

                if (invite && new Date(invite.expiresAt) < new Date()) {
                    // Expired, update status
                    set((state) => ({
                        invites: state.invites.map(i =>
                            i.id === invite.id ? { ...i, status: 'EXPIRED' as const } : i
                        ),
                    }));
                    return null;
                }

                return invite || null;
            },

            // Log activity
            logActivity: (spaceId: string, type: ActivityType, payload: Activity['payload']) => {
                const userId = useUserStore.getState().getUserId();
                const displayName = useUserStore.getState().getDisplayName();

                if (!userId) return;

                const activity: Activity = {
                    id: generateId(),
                    spaceId,
                    actorUserId: userId,
                    actorName: displayName,
                    type,
                    payload,
                    createdAt: new Date().toISOString(),
                };

                set((state) => {
                    const spaceActivities = state.activities.filter(a => a.spaceId === spaceId);
                    const otherActivities = state.activities.filter(a => a.spaceId !== spaceId);

                    // Keep only last MAX_ACTIVITY_ITEMS for this space
                    const newSpaceActivities = [activity, ...spaceActivities].slice(0, MAX_ACTIVITY_ITEMS);

                    return {
                        activities: [...otherActivities, ...newSpaceActivities],
                    };
                });
            },

            // Get activities for a space
            getSpaceActivities: (spaceId: string) => {
                return get().activities
                    .filter(a => a.spaceId === spaceId)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            },

            // Set notification preference for a space
            setSpaceNotificationEnabled: (spaceId: string, enabled: boolean) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return;

                const existing = get().notificationPreferences.find(
                    n => n.spaceId === spaceId && n.userId === userId
                );

                if (existing) {
                    set((state) => ({
                        notificationPreferences: state.notificationPreferences.map(n =>
                            n.spaceId === spaceId && n.userId === userId
                                ? { ...n, enabled }
                                : n
                        ),
                    }));
                } else {
                    set((state) => ({
                        notificationPreferences: [
                            ...state.notificationPreferences,
                            { userId, spaceId, enabled },
                        ],
                    }));
                }
            },

            // Check if notifications are enabled for a space
            isSpaceNotificationEnabled: (spaceId: string) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return true; // Default to enabled

                const pref = get().notificationPreferences.find(
                    n => n.spaceId === spaceId && n.userId === userId
                );

                return pref?.enabled ?? true; // Default to enabled
            },

            // Get current space
            getCurrentSpace: () => {
                return get().spaces.find(s => s.id === get().currentSpaceId) || null;
            },

            // Get My Space
            getMySpace: () => {
                return get().spaces.find(s => s.id === MY_SPACE_ID) || null;
            },

            // Get all Family Spaces
            getFamilySpaces: () => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return [];

                const activeMemberships = get().memberships.filter(
                    m => m.userId === userId && m.status === 'ACTIVE'
                );

                return get().spaces.filter(
                    s => s.type === 'FAMILY_SPACE' && activeMemberships.some(m => m.spaceId === s.id)
                );
            },

            // Get space by ID
            getSpaceById: (spaceId: string) => {
                return get().spaces.find(s => s.id === spaceId) || null;
            },

            // Get members of a space (mock data for local demo)
            getSpaceMembers: (spaceId: string) => {
                return get().mockMembers[spaceId] || [];
            },

            // Get member count
            getMemberCount: (spaceId: string) => {
                return (get().mockMembers[spaceId] || []).length;
            },

            // Get user's role in a space
            getUserRole: (spaceId: string) => {
                const userId = useUserStore.getState().getUserId();
                if (!userId) return null;

                const membership = get().memberships.find(
                    m => m.spaceId === spaceId && m.userId === userId && m.status === 'ACTIVE'
                );

                return membership?.role || null;
            },

            // Check if current user is owner of a space
            isOwner: (spaceId: string) => {
                return get().getUserRole(spaceId) === 'OWNER';
            },

            // Check if user has any family spaces
            hasFamilySpaces: () => {
                return get().getFamilySpaces().length > 0;
            },
        }),
        {
            name: 'expire-track-spaces',
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
);

// Export constant for use in other files
export { MY_SPACE_ID };
