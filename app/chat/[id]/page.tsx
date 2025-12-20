import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToWon } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import BackButton from "@/components/back-button";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChatMessageList from "@/components/chat-message-list";

async function getChatRoom(chatRoomId: number, userId: number) {
  const chatRoom = await db.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          photo: true,
          price: true,
        },
      },
      buyer: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      seller: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      messages: {
        orderBy: {
          created_at: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!chatRoom) {
    return null;
  }

  // 권한 확인
  if (chatRoom.buyerId !== userId && chatRoom.sellerId !== userId) {
    return null;
  }

  return chatRoom;
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session.id) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      avatar: true,
    },
  });
  return user;
}

export default async function ChatRoomDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  
  if (!session.id) {
    return notFound();
  }

  const { id } = await params;
  const chatRoomId = Number(id);
  
  if (isNaN(chatRoomId)) {
    return notFound();
  }

  const chatRoom = await getChatRoom(chatRoomId, session.id);
  
  if (!chatRoom) {
    return notFound();
  }

  // 상대방 정보 결정: 현재 사용자가 buyer면 seller, seller면 buyer
  const otherUser = chatRoom.buyerId === session.id ? chatRoom.seller : chatRoom.buyer;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return notFound();
  }

  return (
    <div className="flex flex-col h-screen pb-32 bg-neutral-900">
      {/* 상단 헤더 */}
      <div className="relative bg-neutral-800 border-b border-neutral-700 p-5 pt-16">
        <BackButton href="/chat" />
        <div className="flex items-center gap-3 mb-4">
          {/* 상대방 아바타 */}
          <Link
            href={`/users/${otherUser.id}`}
            className="size-10 rounded-full overflow-hidden flex items-center justify-center"
          >
            {otherUser.avatar ? (
              <Image
                width={40}
                height={40}
                className="size-10 rounded-full"
                src={otherUser.avatar}
                alt={otherUser.username}
              />
            ) : (
              <div className="size-10 rounded-full bg-neutral-700 flex items-center justify-center">
                <UserIcon className="size-6 text-neutral-400" />
              </div>
            )}
          </Link>
          <Link
            href={`/users/${otherUser.id}`}
            className="flex-1 hover:text-orange-500 transition-colors"
          >
            <h2 className="text-lg font-semibold text-white">{otherUser.username}</h2>
          </Link>
        </div>
        
        {/* 상품 정보 */}
        <Link
          href={`/products/${chatRoom.product.id}`}
          className="flex gap-3 p-3 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <div className="relative size-16 rounded-lg overflow-hidden bg-neutral-600 flex-shrink-0">
            <Image
              fill
              src={chatRoom.product.photo}
              alt={chatRoom.product.title}
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{chatRoom.product.title}</p>
            <p className="text-sm text-orange-500 font-bold">{formatToWon(chatRoom.product.price)}원</p>
          </div>
        </Link>
      </div>

      {/* 메시지 리스트 및 입력 영역 */}
      <ChatMessageList
        chatRoomId={chatRoomId}
        initialMessages={chatRoom.messages}
        currentUserId={session.id}
        currentUser={currentUser}
      />
    </div>
  );
}

