"use client";

import { useEffect } from "react";
import { markChatListAsRead } from "@/app/(tabs)/chat/actions";

export default function MarkChatRead() {
  useEffect(() => {
    // 컴포넌트 마운트 시 채팅방 목록을 읽은 것으로 표시
    markChatListAsRead();
  }, []);

  return null;
}

