# Shared Family Spaces – UI/UX Specification

This document defines the **UI and UX rules** for the Shared Family Spaces Pro feature.

## 1. Core UX Principles

- One app, one UI — no separate “Pro mode” layouts.
- Clear separation between **My Space** (private) and **Family Spaces** (shared).
- The **currently selected space** defines all visible data and all actions.
- Pro features must feel **natural and lightweight**, not complex or intrusive.

## 2. Space Navigation

- A **Space Selector** is always visible at the top of the home screen.
- The selector lets users:
	- Switch to **My Space**.
	- Switch to any **joined Family Space**.
	- Access **Create / Join Family Space** (Pro only).
- **Free users** see a teaser item: "Family Spaces (Pro)" with a brief upgrade prompt. Tapping opens the upgrade screen.
- Switching space should:
	- Update content **instantly** without changing screens.
	- Preserve scroll position and filters where possible.

## 3. Home Screen Behavior

- Same base layout for all spaces (folders, products, expiration indicators).
- A small but clear **active space indicator** (icon + name or label) is always visible.
- Users must always know **which space** they are viewing and acting in.

## 4. Onboarding for Shared Spaces

- First-time users of Shared Family Spaces see a simple choice:

	- **Create a Family Space**
	- **Join a Family Space**
	- **Skip for now**

- Copy is short and action-focused (1–2 lines of benefit max).
- **Re-engagement after skip:**
	- Home shows a persistent card: "Share with your family" until user creates or joins a Family Space.
	- Settings always includes a "Family Spaces" section regardless of current state.

## 5. Product Management

- Adding a product always targets the **currently selected space**.
- Product data structure is **identical to the free version**.
- After saving, show a subtle confirmation such as:
	- “Added to **My Space**” or “Added to **Smith Family**”.
- UX must prevent **accidental sharing** of personal products:
	- The Add/Edit screen shows a **non-editable banner** at the top: "Adding to: [Space Name]".
	- To change target space, user must cancel and switch space first (no inline picker).

## 6. Family Space Experience

- Shared products are visible to **all members** of that space.
- Products use the **same folder system** as My Space (no new hierarchy).
- Optionally show the **number of members** in the space (e.g., near the space name).

## 7. Member Management

- Member management lives inside **Family Space Settings**, not on the main home UI.

**Owner can:**
- Invite members.
- Remove members.
- Delete the space.

**Members can:**
- View and manage shared products (add, edit, delete).
- Leave the space at any time from Family Space Settings.

## 8. Invitations

- Users can join a Family Space via:
	- Invitation link.
	- Invitation code.
	- QR code.
- Invitation flows must be **short and low-friction**:
	- Minimal steps, clear feedback when joining succeeds or fails.
- **Error states to handle:**
	- "Invite expired" — prompt user to request a new one.
	- "Invite invalid" — generic fallback for unknown codes.
	- "Already a member" — navigate directly into the space.
	- "Space no longer exists" — inform and return to Home.

## 9. Notifications

- Notification settings are **per space**.
- Expiration alerts for shared products are sent to **all members** (first version).
- No per-member notification routing in **v1** to keep UX simple.
- **v2 consideration:** Add "daily digest" mode and "mute this space for X days" option.

## 10. Privacy & Safety

- Personal products are **never shared automatically**.
- Leaving a Family Space must **not affect** personal data in My Space.
- Destructive actions (e.g., delete space, remove member) require **clear confirmation dialogs**.

## 11. Empty States

- Empty Family Spaces show **clear next actions**, e.g.:
	- “Add first product”.
	- “Invite members”.
- Empty states are **functional and guiding**, not just decorative illustrations.

## 12. Activity (History)

- Each Family Space includes a simple activity feed, accessed from **Family Space Settings → Activity**.
- Entries are short, human-readable lines, e.g.:
	- "Sara added Paracetamol"
	- "Alex deleted Milk"
- Activity is grouped by day and shows the **last 50 events**.

## 13. UX Quality Rules

- No separate or duplicated screens just for Pro features.
- No forced setup: **Family Spaces are optional** and skippable.
- Minimal taps for common actions (switch space, add product, invite member).
- Clear, calm microcopy that **builds trust** and explains impact when needed.

## 14. Main User Flows (Summary)

These flows define how the feature behaves end-to-end.

- **Switch Space**
	- User taps Space Selector → sees list of My Space + Family Spaces.
	- Tapping a space sets it as current and refreshes Home data for that `spaceId` only.
	- UI does not change screens; only content updates.

- **Create Family Space**
	- User chooses "Create Family Space" from selector or onboarding.
	- One-field form (name) → on submit, space is created and becomes current.
	- Success message confirms creation and shows the new space name.

- **Join Family Space (via link/code)**
	- App detects invite link/code or user enters code manually.
	- Confirmation screen shows target space name and basic info.
	- On confirm, user joins as Member and is navigated into that space.

- **Invite Members**
	- Owner opens Family Space Settings → "Invite members".
	- App shows an invite link/code with options to copy or share.
	- UI explains in one line that people with this invite can request to join.

- **Add / Edit / Delete Product in a Space**
	- From Home or folder, user adds/edits a product; form always shows target space name.
	- On save/delete, changes apply only to the current space and a short toast confirms where.
	- Activity entry is created for each significant change.

- **View Activity**
	- From Space Settings or a dedicated tab, user opens Activity.
	- Sees recent actions in that space (who did what, when).

- **Manage Notifications per Space**
	- In Space Settings, user sees a single toggle: "Receive expiration alerts from this space".
	- When enabled, user receives the same shared alerts as other members for that space.

- **Leave / Delete Space**
	- Member: taps "Leave this space" → confirm dialog ("You will lose access to all products and history in this space.") → returned to My Space.
	- Owner: taps "Delete this space" → must **type the space name** to confirm → space and all its products/history are permanently removed for all members.

## 15. Edge Cases & Error Handling

This section defines how the app handles failures and unusual states.

- **Network failure during sync**
	- Show a non-blocking banner: "Offline – changes will sync when you're back online."
	- Queue mutations locally; retry automatically on reconnect.

- **Sync conflict (same product edited by two users)**
	- Rule: **last-write-wins** (most recent timestamp overwrites).
	- After sync, if the user's local version was overwritten, show a brief toast: "This product was updated by another member."

- **Space deleted while user is viewing it**
	- On next sync, detect missing space and navigate user to My Space.
	- Show message: "This Family Space no longer exists."

- **Owner leaves without transferring ownership**
	- Ownership auto-transfers to the oldest active member.
	- New owner receives a notification: "You are now the owner of [Space Name]."

- **Invalid or expired invite**
	- Show clear error: "This invite has expired or is invalid. Ask the space owner for a new one."

- **User removed from space while using the app**
	- On next sync, detect removal and navigate to My Space.
	- Show message: "You were removed from [Space Name]."