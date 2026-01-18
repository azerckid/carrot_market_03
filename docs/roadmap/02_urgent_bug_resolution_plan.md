# Urgent Bug Resolution Plan

## Overview
This document outlines two critical bugs that persist in the current production build. These issues significantly impact the user experience and must be resolved immediately before further feature development.

---

## 1. Product Detail Image Visibility (Client Navigation)

### Symptoms
- When navigating from the **Home** page to a **Product Detail** page (via `Link`), the product image is not visible.
- The image area may appear blank or collapsed.
- **Reloading the page (F5/Cmd+R) fixes the issue**, and the image loads correctly.

### Failed Attempts
1.  **CSS Layout Fix**: Added `w-full` class to the parent container of `<Image />` to force width calculation for `aspect-square`. (Failed)
2.  **Next.js Optimization Bypass**: Added `unoptimized` prop to `<Image />`. (Failed)
3.  **Cache Key Isolation**: Separted cache keys per product ID. (Failed to fix the UI issue, though good for data integrity)

### Hypothesis & Next Steps
- **Hydration Mismatch**: The transition from the list view to the detail view might be retaining some CSS state that conflicts with `absolute` positioning of the `fill` image.
- **Layout Shift**: The parent container height might be collapsing to 0 during the page transition animation or hydration phase.
- **Action Plan**:
    - Inspect the computed DOM styles during the transition state.
    - Try replacing `fill` + `aspect-ratio` with explicit `width` and `height` properties for debugging.
    - Check for generic CSS conflicts in `globals.css` that might affect all `img` or `absolute` elements.

---

## 2. Chat Message Duplication (Ghosting Effect)

### Symptoms
- When a user sends a message, two identical messages appear briefly:
    1.  The **Optimistic UI** message (immediate).
    2.  The **Real** message arriving from the server (via Pusher or Server Action return).
- The optimistic message eventually disappears, but there is a noticeable flickering or duplication period.
- Filtering `userId === currentUserId` in the Pusher listener was implemented but did not fully resolve the visual glitch.

### Failed Attempts
1.  **Pusher Filtering**: Ignored `new-message` events if the sender ID matches the current user. (Insufficent)
2.  **State Replacement**: Attempted to replace the optimistic message with the real message returned from the Server Action. (Timing issue persists)

### Hypothesis & Next Steps
- **Race Condition**: The `useOptimistic` hook relies on the `useTransition` state. The "Real" message might be added to the state *before* the transition finishes, causing a momentary overlap where React renders both the Optimistic state and the committed Real state.
- **Key Collision**: If the Optimistic ID and Real ID don't match (which they don't), React treats them as two different items.
- **Action Plan**:
    - **Strict Deduplication**: Implement a robust `seenIds` set to absolutely prevent rendering any message payload that is already structurally identical to a pending optimistic message.
    - **Transition Control**: Review the `startTransition` and `Optimistic` lifecycle to ensure the optimistic item is removed *exactly* when the real item is committed.

---

## Priority
**Critical**. Both issues degrade the core functionality of the app (Browsing & Chatting).
