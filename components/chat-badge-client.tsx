"use client";

import { useEffect, useState } from "react";
import { getUnreadChatRoomCount } from "@/app/(tabs)/chat/actions";

interface ChatBadgeClientProps {
  initialCount: number;
}

export default function ChatBadgeClient({ initialCount }: ChatBadgeClientProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  // 주기적으로 읽지 않은 채팅방 수 확인 (3초마다)
  useEffect(() => {
    const updateCount = async () => {
      try {
        const count = await getUnreadChatRoomCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    // 초기 카운트와 다를 수 있으므로 즉시 한 번 업데이트
    updateCount();

    const interval = setInterval(updateCount, 3000); // 3초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

