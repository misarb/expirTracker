// Types for Family Spaces Pro Feature

// Space types
export type SpaceType = 'MY_SPACE' | 'FAMILY_SPACE';
export type MemberRole = 'OWNER' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';
export type InviteStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type ActivityType = 
    | 'PRODUCT_ADDED' 
    | 'PRODUCT_UPDATED' 
    | 'PRODUCT_DELETED' 
    | 'MEMBER_JOINED' 
    | 'MEMBER_LEFT' 
    | 'MEMBER_REMOVED'
    | 'FOLDER_CREATED'
    | 'FOLDER_DELETED';

// Space interface - represents both My Space and Family Spaces
export interface Space {
    id: string;
    name: string;
    type: SpaceType;
    icon: string;
    createdBy: string; // userId of creator
    createdAt: string;
    updatedAt: string;
}

// Membership - tracks user's relationship to a Family Space
export interface Membership {
    id: string;
    userId: string;
    spaceId: string;
    role: MemberRole;
    joinedAt: string;
    status: MemberStatus;
}

// Invite - invitation codes for joining Family Spaces
export interface Invite {
    id: string;
    spaceId: string;
    code: string;
    createdBy: string; // userId of creator (Owner)
    expiresAt: string; // ISO date string
    maxUses: number;
    usedCount: number;
    status: InviteStatus;
    createdAt: string;
}

// Activity - tracks actions in a Family Space
export interface Activity {
    id: string;
    spaceId: string;
    actorUserId: string;
    actorName: string; // Display name for UI
    type: ActivityType;
    payload: {
        productName?: string;
        productId?: string;
        memberName?: string;
        memberId?: string;
        folderName?: string;
        folderId?: string;
        [key: string]: any;
    };
    createdAt: string;
}

// NotificationPreference - per-space notification settings
export interface SpaceNotificationPreference {
    userId: string;
    spaceId: string;
    enabled: boolean;
}

// User profile for display in Family Spaces
export interface UserProfile {
    id: string;
    displayName: string;
    avatarEmoji: string; // Simple emoji avatar for v1
    createdAt: string;
}

// Helper to generate unique IDs
export const generateId = (): string => 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });

// Helper to generate short invite codes (6 characters)
export const generateInviteCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Default expiration for invites (7 days from now)
export const getDefaultInviteExpiry = (): string => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString();
};
