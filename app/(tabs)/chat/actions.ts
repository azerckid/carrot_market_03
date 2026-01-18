"use server";

import db, { schema } from "@/lib/db";
import getSession from "@/lib/session";
import { eq, or, gt, desc, and } from "drizzle-orm";

const { chatRooms, messages } = schema;

export async function getUnreadChatRoomCount(userId?: number) {
  const session = await getSession();
  
  // userId가 제공되지 않으면 세션에서 가져오기
  const currentUserId = userId || session.id;
  
  if (!currentUserId) {
    return 0;
  }
  
  // 마지막 채팅방 목록 방문 시간 가져오기
  const lastVisitTime = session.lastChatListVisit 
    ? new Date(session.lastChatListVisit)
    : new Date(0); // 방문 기록이 없으면 모든 채팅방을 읽지 않은 것으로 간주

  // 마지막 방문 시간 이후에 업데이트된 채팅방 조회
  const recentChatRooms = await db.select({
    id: chatRooms.id,
    buyerId: chatRooms.buyerId,
    sellerId: chatRooms.sellerId,
  })
  .from(chatRooms)
  .where(
    and(
      or(
        eq(chatRooms.buyerId, currentUserId),
        eq(chatRooms.sellerId, currentUserId)
      ),
      gt(chatRooms.updated_at, lastVisitTime)
    )
  );

  // 각 채팅방의 마지막 메시지 조회
  const unreadCount = await Promise.all(
    recentChatRooms.map(async (room) => {
      const lastMessage = await db.select({
        userId: messages.userId,
        created_at: messages.created_at,
      })
      .from(messages)
      .where(eq(messages.chatRoomId, room.id))
      .orderBy(desc(messages.created_at))
      .limit(1);

      if (lastMessage.length === 0) return false;
      // 마지막 메시지가 상대방이 보낸 것이면 읽지 않은 것으로 간주
      return lastMessage[0].userId !== currentUserId;
    })
  );

  return unreadCount.filter(Boolean).length;
}

export async function markChatListAsRead() {
  "use server";
  
  const session = await getSession();
  
  if (!session.id) {
    return;
  }

  // 현재 시간을 마지막 채팅방 목록 방문 시간으로 저장
  session.lastChatListVisit = Date.now();
  await session.save();
}

