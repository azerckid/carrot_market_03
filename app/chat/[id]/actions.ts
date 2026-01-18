"use server";

import db from "@/lib/db";
import { chatRooms, messages, users } from "@/drizzle/schema";
import { eq, gt, and, asc } from "drizzle-orm";
import getSession from "@/lib/session";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function sendMessage(chatRoomId: number, payload: string) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (!payload || !payload.trim()) {
    return { error: "메시지를 입력해주세요." };
  }

  // 채팅방 권한 확인
  const chatRoom = await db.query.chatRooms.findFirst({
    where: eq(chatRooms.id, chatRoomId),
    columns: {
      buyerId: true,
      sellerId: true
    }
  });

  if (!chatRoom) {
    return { error: "채팅방을 찾을 수 없습니다." };
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return { error: "권한이 없습니다." };
  }

  // 메시지 저장 (returning으로 id만 받지 않고, 추가 쿼리로 유저 정보 포함해서 가져옴)
  const [createdMessage] = await db.insert(messages).values({
    chatRoomId,
    payload: payload.trim(),
    userId: session.id,
  }).returning();

  // 채팅방 업데이트 시간 갱신
  await db.update(chatRooms)
    .set({ updated_at: new Date() })
    .where(eq(chatRooms.id, chatRoomId));

  // 실시간 전송을 위해 유저 정보가 포함된 완전한 메시지 조회
  const fullMessage = await db.query.messages.findFirst({
    where: eq(messages.id, createdMessage.id),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  if (fullMessage) {
    // Pusher 이벤트 발송
    await pusherServer.trigger(
      `chat-room-${chatRoomId}`,
      "new-message",
      fullMessage
    );
  }

  revalidatePath(`/chat/${chatRoomId}`);
  revalidatePath("/chat");
  // 탭바 뱃지 업데이트를 위해 레이아웃 경로도 revalidate
  revalidatePath("/", "layout");

  return { success: true, message: fullMessage };
}

export async function getNewMessages(
  chatRoomId: number,
  lastMessageId: number | null
) {
  const session = await getSession();

  if (!session.id) {
    return [];
  }

  // 권한 확인
  const chatRoom = await db.query.chatRooms.findFirst({
    where: eq(chatRooms.id, chatRoomId),
    columns: {
      buyerId: true,
      sellerId: true
    }
  });

  if (!chatRoom) {
    return [];
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return [];
  }

  // 새 메시지 조회
  const newMessages = await db.query.messages.findMany({
    where: and(
      eq(messages.chatRoomId, chatRoomId),
      lastMessageId ? gt(messages.id, lastMessageId) : undefined
    ),
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          avatar: true
        }
      }
    },
    orderBy: [asc(messages.created_at)]
  });

  return newMessages;
}

