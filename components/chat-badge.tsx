import { getUnreadChatRoomCount } from "@/app/(tabs)/chat/actions";
import getSession from "@/lib/session";
import ChatBadgeClient from "./chat-badge-client";

export default async function ChatBadge() {
  const session = await getSession();
  
  if (!session.id) {
    return null;
  }

  const initialCount = await getUnreadChatRoomCount(session.id);

  return <ChatBadgeClient initialCount={initialCount} />;
}

