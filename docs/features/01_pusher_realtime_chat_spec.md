# Pusher Realtime Chat Implementation Spec

## 1. Overview
This document specifies the migration of the existing chat system from a **Polling-based (setInterval)** architecture to a **Real-time Push (WebSocket)** architecture using **Pusher Channels**. This upgrade aims to eliminate server polling overhead and provide an instantaneous messaging experience.

## 2. Architecture & Data Flow

### 2.1 Current Architecture (To-Be-Deprecated)
- **Client**: Sends GET requests every 2 seconds (`setInterval`).
- **Server**: Queries DB for messages newer than `lastMessageId`.
- **Latency**: 0 ~ 2000ms delay.
- **Overhead**: Frequent redundant requests even when idle.

### 2.2 New Architecture (Pusher)
1.  **Client (Sender)**: Invokes Server Action `sendMessage(payload)`.
2.  **Server Action**:
    *   Authenticates user & validates input.
    *   **DB**: Inserts message into `Message` table.
    *   **Pusher**: Triggers an event `new-message` to channel `chat-room-{id}` with the message payload.
3.  **Client (Receiver)**:
    *   Subscribes to channel `chat-room-{id}` on mount.
    *   Listens for `new-message` event.
    *   **Update**: Instantly appends the received message to the UI state.

## 3. Environment Configuration

The following environment variables are required. `VITE_` prefixes in the existing `.env` must be migrated to `NEXT_PUBLIC_` for Next.js compatibility.

| Variable Name | Description | Visibility |
| :--- | :--- | :--- |
| `PUSHER_APP_ID` | Pusher App ID | Server-side only |
| `PUSHER_KEY` | Pusher Key | Client & Server |
| `PUSHER_SECRET` | Pusher Secret | Server-side only |
| `PUSHER_CLUSTER` | Cluster Region (e.g., `ap3`) | Client & Server |
| `NEXT_PUBLIC_PUSHER_KEY` | Public Key for Browser | Client-side (Public) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Public Cluster for Browser | Client-side (Public) |

## 4. Implementation Details

### 4.1 Server-Side: `lib/pusher.ts` (New File)
Initialize the Pusher server instance as a singleton.

```typescript
import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

### 4.2 Server Action: `app/chat/[id]/actions.ts`
Modify `sendMessage` to trigger a Pusher event after DB insertion.

```typescript
// ... inside sendMessage function
const message = await db.insert(messages).values({...}).returning();

await pusherServer.trigger(
  `chat-room-${chatRoomId}`, // Channel Name
  "new-message",            // Event Name
  message[0]                // Data Payload
);
```

### 4.3 Client-Side: `components/chat-message-list.tsx`
Replace `setInterval` with Pusher subscription.

```typescript
import Pusher from "pusher-js";

useEffect(() => {
  // Initialize Pusher Client
  const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  // Subscribe to Channel
  const channel = pusherClient.subscribe(`chat-room-${chatRoomId}`);

  // Bind Event
  channel.bind("new-message", (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage]);
  });

  // Cleanup
  return () => {
    channel.unbind_all();
    channel.unsubscribe();
  };
}, [chatRoomId]);
```

## 5. Security & Isolation

### 5.1 Channel Isolation
- **Pattern**: `chat-room-{id}`
- **Constraint**: Strict backend validation ensures a user can only *trigger* messages to rooms they belong to via Server Actions.
- **Future Work**: Implement "Private Channels" (`private-chat-room-{id}`) which require an auth endpoint (`/pusher/auth`) to prevent unauthorized users from *subscribing* (listening) to other rooms. For Phase 1, we rely on the obscurity of random Room IDs (sequence IDs in this case, which is weak - **Known Limitation**).
  - *Risk Mitigation*: Since Room IDs are integers, they are guessable. In a production environment, `private-` channels are mandatory. For this "Clone" scope, standard channels are acceptable but this risk is noted.

### 5.2 Optimistic Updates
- Retain the existing `useOptimistic` logic to ensure zero-latency feedback for the sender.
- The Pusher event will arrive shortly after; the client must handle de-duplication (ignore if ID matches optimistic ID, though normally optimistic IDs are temporary).

## 6. Implementation Phases

To ensure stability and manage risk, the implementation will be divided into three distinct phases.

### Phase 1: Foundation (Core Real-time Messaging)
*Goal: Replace polling with basic real-time messaging using public channels.*

1.  **Dependencies & Config**:
    - Install `pusher` (server) and `pusher-js` (client).
    - Configure `NEXT_PUBLIC_` environment variables in `.env`.
2.  **Server Setup**:
    - Create `lib/pusher.ts` singleton.
3.  **Action Update**:
    - Modify `sendMessage` in `app/chat/[id]/actions.ts` to trigger `new-message` event.
4.  **Client Update**:
    - Modify `components/chat-message-list.tsx` to subscribe to `chat-room-{id}`.
    - Remove `setInterval` polling logic.
    - Implement event binding to update React state.
5.  **Verification**:
    - Verify message delivery latency (< 100ms).
    - Ensure duplicate messages are verified and handled.

### Phase 2: Security Hardening (Private Channels)
*Goal: Prevent unauthorized users from listening to chat rooms.*

1.  **Auth Endpoint**:
    - Create API Route `/api/pusher/auth`.
    - Implement session validation logic inside the route.
2.  **Channel Rename**:
    - Change channel name scheme to `private-chat-room-{id}`.
3.  **Client Auth**:
    - Update `pusher-js` client to use the auth endpoint.
4.  **Validation**:
    - Verify that unauthenticated users cannot subscribe to channels.

### Phase 3: UX Enhancements (Presence & Status)
*Goal: Add rich features like "User is typing..." and Online Status.*

1.  **Presence Channels**:
    - Upgrade to `presence-chat-room-{id}`.
2.  **Typing Indicators**:
    - Trigger `client-typing` events from the frontend (Client Events).
3.  **Read Receipts**:
    - Implement "Read" status updates via real-time events.

---

## 7. Migration Steps (Phase 1 Execution)

1.  **Install SDKs**: `npm install pusher pusher-js`
2.  **Update Env**: Rename `VITE_` variables to `NEXT_PUBLIC_` in `.env`.
3.  **Create Lib**: `lib/pusher.ts`.
4.  **Refactor Action**: Update `sendMessage` to trigger event.
5.  **Refactor Component**: Update `ChatMessageList` to use subscriptions.
