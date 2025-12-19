import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/24/solid";
import MarkChatRead from "@/components/mark-chat-read";

async function getChatRooms(userId: number) {
  const chatRooms = await db.chatRoom.findMany({
    where: {
      OR: [
        { buyerId: userId },   // 구매자로 참여한 채팅방
        { sellerId: userId },   // 판매자로 참여한 채팅방
      ],
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          photo: true,
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
        take: 1,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
  });
  
  return chatRooms;
}

export const metadata = {
  title: "채팅",
};

export default async function Chat() {
  const session = await getSession();
  
  if (!session.id) {
    return notFound();
  }

  const chatRooms = await getChatRooms(session.id);

  return (
    <div className="p-5 text-white pb-32">
      {/* 채팅방 목록 페이지를 방문하면 모든 채팅방을 읽은 것으로 표시 */}
      <MarkChatRead />
      <h1 className="text-2xl font-bold mb-5">채팅</h1>
      
      {chatRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <p className="text-lg">아직 채팅방이 없습니다.</p>
          <p className="text-sm mt-2">상품 상세 페이지에서 채팅을 시작해보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {chatRooms.map((chatRoom) => {
            // 상대방 정보 결정: 현재 사용자가 buyer면 seller, seller면 buyer
            const otherUser = chatRoom.buyerId === session.id ? chatRoom.seller : chatRoom.buyer;
            const lastMessage = chatRoom.messages[0];
            
            return (
              <Link
                key={chatRoom.id}
                href={`/chat/${chatRoom.id}`}
                className="flex gap-4 p-4 border-b border-neutral-700 hover:bg-neutral-800/50 rounded-lg transition-colors cursor-pointer"
              >
                {/* 상품 이미지 */}
                <div className="relative size-16 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
                  <Image
                    fill
                    src={chatRoom.product.photo}
                    alt={chatRoom.product.title}
                    className="object-cover"
                  />
                </div>
                
                {/* 채팅방 정보 */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* 상대방 아바타 */}
                    {otherUser.avatar ? (
                      <Image
                        width={24}
                        height={24}
                        className="size-6 rounded-full flex-shrink-0"
                        src={otherUser.avatar}
                        alt={otherUser.username}
                      />
                    ) : (
                      <div className="size-6 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="size-4 text-neutral-400" />
                      </div>
                    )}
                    <span className="font-semibold text-sm truncate">{otherUser.username}</span>
                  </div>
                  
                  {/* 상품 제목 */}
                  <p className="text-sm text-neutral-400 truncate">{chatRoom.product.title}</p>
                  
                  {/* 최신 메시지 */}
                  {lastMessage ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500 truncate">
                        {lastMessage.user.username}: {lastMessage.payload}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {formatToTimeAgo(lastMessage.created_at.toString())}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 mt-1">메시지가 없습니다.</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

