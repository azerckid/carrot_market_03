"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";

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
  const recentChatRooms = await db.chatRoom.findMany({
    where: {
      OR: [
        { buyerId: currentUserId },
        { sellerId: currentUserId },
      ],
      updated_at: {
        gt: lastVisitTime, // 마지막 방문 시간 이후에 업데이트된 채팅방만
      },
    },
    include: {
      messages: {
        take: 1,
        orderBy: {
          created_at: "desc",
        },
        select: {
          userId: true,
          created_at: true,
        },
      },
    },
  });

  // 자신이 보낸 메시지가 아닌 채팅방만 카운트
  const unreadCount = recentChatRooms.filter((room) => {
    const lastMessage = room.messages[0];
    if (!lastMessage) return false;
    // 마지막 메시지가 상대방이 보낸 것이면 읽지 않은 것으로 간주
    return lastMessage.userId !== currentUserId;
  }).length;

  return unreadCount;
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

