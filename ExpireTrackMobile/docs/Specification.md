# Shared Family Spaces (Pro Feature)

This document defines the **Shared Family Spaces** feature available to Pro users in ExpireTrack.

## 1. Family Space Creation

A Pro user can:

- Create one or multiple Family Spaces.
- Assign a name to each space (e.g., *My Family*, *Parents*, *Shared Home*).
- Automatically become the **Owner** of any space they create.

## 2. Member Management

### 2.1 Roles

- **Owner**
  - Full access to the Family Space.
  - Add or remove members.
  - Transfer ownership to another member.
  - Delete the Family Space.

- **Member**
  - View all shared products.
  - Add, update, or delete any product within the Family Space.

> **Note:** Granular per-action permissions (e.g., "view-only" members) are not supported in v1.

### 2.2 Joining Methods

Members can join a Family Space via:
- Invitation link
- Invitation code
- QR code scan

### 2.3 Invite Lifecycle & Security

- Invite links/codes expire after **7 days** by default.
- Each invite can be limited to a maximum number of uses (e.g., 5).
- Owner can **regenerate** a new invite (invalidating the old one) or **revoke** all active invites at any time.
- Expired or revoked invites return a clear error when used.

## 3. Shared Product Management

Within a Family Space:

- All products are visible to all members of that space.
- Products are organized into shared folders (e.g., *Medicines*, *Fridge*, *Cosmetics*), following the same structure as the free version.

Each product uses the **same data structure as in the free version**.

## 4. Notifications & Alerts

- Expiration notifications for shared products are sent to **all members** who have notifications enabled for that space.
- Notifications are delivered via **push notification**.
- Default alert schedule: **7 days**, **3 days**, and **1 day** before expiry (configurable per user in Settings).
- Each product triggers at most **one notification per alert window** to avoid spam.

## 5. Activity & Sync

- **Near real-time** synchronization: data refreshes on app open, on space switch, and after key actions.
- **Activity log** (included in v1): each Family Space shows the last 50 events, tracking:
  - Product added / updated / deleted
  - Member joined / left / removed
- Offline usage is supported; changes sync automatically when the user is back online.
- **Conflict resolution:** last-write-wins. If a product was edited by two members while one was offline, the most recent save overwrites.

## 6. Privacy & Separation

The application must clearly separate:

- **Private Space**: personal, non-shared products.
- **Family Spaces**: shared products visible only to members of that space.

Rules:
- A user can belong to **multiple** Family Spaces.
- Leaving a Family Space must **not affect** the user’s personal data.
- Personal products are **never automatically shared** with any Family Space.

## 7. Domain Model (Feature-Level)

- **Space**
  - Fields: `id`, `name`, `type` (`MY_SPACE`, `FAMILY_SPACE`), `createdBy`, `createdAt`, `updatedAt`.
  - Each user has exactly one `MY_SPACE`; they may belong to many `FAMILY_SPACE`s.

- **Membership**
  - Fields: `userId`, `spaceId`, `role` (`OWNER`, `MEMBER`), `joinedAt`, `status` (`ACTIVE`, `LEFT`, `REMOVED`).
  - Every Family Space has at least one `OWNER`.

- **Product**
  - Existing product structure extended with `spaceId`.
  - All queries and mutations are scoped by `spaceId`.

- **Activity**
  - Fields: `id`, `spaceId`, `actorUserId`, `type` (e.g., `PRODUCT_ADDED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `MEMBER_JOINED`, `MEMBER_LEFT`), `payload`, `createdAt`.

- **Invite**
  - Fields: `id`, `spaceId`, `code`, `createdBy`, `expiresAt`, `maxUses`, `usedCount`, `status` (`ACTIVE`, `REVOKED`, `EXPIRED`).

- **NotificationPreference**
  - Fields: `userId`, `spaceId`, `enabled` (boolean).
  - Used to decide whether a user receives expiration alerts for a given space.

## 8. Implementation Notes (v1 Scope)

- Roles are limited to `OWNER` and `MEMBER` in v1; no granular per-action permissions.
- Expiration notifications for shared products are broadcast to all members who have notifications **enabled** for that space.
- Sync should be "near real-time": refresh on app open, when switching spaces, and after key actions (add/edit/delete product, join/leave space).
- When a user leaves a Family Space:
  - Their membership `status` becomes `LEFT`.
  - Products and activity in that space remain visible to remaining members.
- **Ownership transfer:** If an Owner leaves or deletes their account, ownership transfers to the oldest active member. If no members remain, the space is deleted automatically.
- **Folders in shared spaces:** Any member can create folders. Only the folder creator or Owner can rename or delete a folder.
