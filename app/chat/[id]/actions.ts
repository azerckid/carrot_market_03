"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function sendMessage(chatRoomId: number, payload: string) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (!payload || !payload.trim()) {
    return { error: "메시지를 입력해주세요." };
  }

  // 채팅방 권한 확인
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  if (!chatRoom) {
    return { error: "채팅방을 찾을 수 없습니다." };
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return { error: "권한이 없습니다." };
  }

  // 메시지 저장
  await db.message.create({
    data: {
      payload: payload.trim(),
      chatRoomId,
      userId: session.id,
    },
  });

  // 채팅방 업데이트 시간 갱신
  await db.chatRoom.update({
    where: { id: chatRoomId },
    data: {
      updated_at: new Date(),
    },
  });

  revalidatePath(`/chat/${chatRoomId}`);
  revalidatePath("/chat");
  // 탭바 뱃지 업데이트를 위해 레이아웃 경로도 revalidate
  revalidatePath("/", "layout");

  return { success: true };
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
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    select: {
      buyerId: true,
      sellerId: true,
    },
  });

  if (!chatRoom) {
    return [];
  }

  if (chatRoom.buyerId !== session.id && chatRoom.sellerId !== session.id) {
    return [];
  }

  // 새 메시지 조회
  const where: any = {
    chatRoomId,
  };

  if (lastMessageId) {
    where.id = {
      gt: lastMessageId,
    };
  }

  const newMessages = await db.message.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return newMessages;
}

