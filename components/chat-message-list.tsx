"use client";

import { useOptimistic, useState, useTransition, useEffect, useRef } from "react";
import { sendMessage, getNewMessages } from "@/app/chat/[id]/actions";
import { formatToTimeAgo } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

type Message = {
  id: number;
  payload: string;
  created_at: Date;
  userId: number;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  };
};

type OptimisticMessage = Message & {
  isOptimistic?: boolean;
};

interface ChatMessageListProps {
  chatRoomId: number;
  initialMessages: Message[];
  currentUserId: number;
  currentUser: {
    id: number;
    username: string;
    avatar: string | null;
  };
}

export default function ChatMessageList({
  chatRoomId,
  initialMessages,
  currentUserId,
  currentUser,
}: ChatMessageListProps) {
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    OptimisticMessage[],
    OptimisticMessage
  >(
    messages,
    (state, newMessage: OptimisticMessage) => {
      return [...state, newMessage];
    }
  );

  const lastMessageIdRef = useRef<number | null>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].id : null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤: 메시지가 추가될 때마다 맨 아래로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimisticMessages]);

  // Polling 로직: 2초마다 새 메시지 확인
  useEffect(() => {
    const interval = setInterval(async () => {
      const newMessages = await getNewMessages(
        chatRoomId,
        lastMessageIdRef.current
      );

      if (newMessages.length > 0) {
        setMessages((prev) => {
          // 중복 방지: 이미 있는 메시지는 제외
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNewMessages = newMessages.filter(
            (m) => !existingIds.has(m.id)
          );
          if (uniqueNewMessages.length > 0) {
            const updated = [...prev, ...uniqueNewMessages];
            lastMessageIdRef.current = updated[updated.length - 1].id;
            return updated;
          }
          return prev;
        });
      }
    }, 2000); // 2초마다 확인

    return () => clearInterval(interval);
  }, [chatRoomId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const messagePayload = message.trim();

    if (!messagePayload) {
      setError("메시지를 입력해주세요.");
      return;
    }

    // 입력 필드 초기화 (transition 전에)
    setMessage("");

    // 서버 액션 호출 및 낙관적 업데이트
    startTransition(async () => {
      // 임시 메시지 생성
      const optimisticMessage: OptimisticMessage = {
        id: Date.now(), // 임시 ID
        payload: messagePayload,
        created_at: new Date(),
        userId: currentUserId,
        user: {
          id: currentUserId,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        isOptimistic: true,
      };

      // 낙관적 업데이트 (transition 안에서)
      addOptimisticMessage(optimisticMessage);

      const result = await sendMessage(chatRoomId, messagePayload);

      if (result?.error) {
        setError(result.error);
        window.location.reload(); // 에러 발생 시 롤백
      }
      // 성공 시 Polling이 자동으로 새 메시지를 가져옴
    });
  };

  return (
    <>
      {/* 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-5">
        {optimisticMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <p className="text-lg">아직 메시지가 없습니다.</p>
            <p className="text-sm mt-2">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {optimisticMessages.map((msg) => {
              const isMyMessage = msg.userId === currentUserId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMyMessage ? "flex-row-reverse" : ""} ${
                    msg.isOptimistic ? "opacity-60" : ""
                  }`}
                >
                  {/* 아바타 */}
                  {!isMyMessage && (
                    <div className="flex-shrink-0">
                      {msg.user.avatar ? (
                        <Image
                          width={32}
                          height={32}
                          className="size-8 rounded-full"
                          src={msg.user.avatar}
                          alt={msg.user.username || ""}
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-neutral-700 flex items-center justify-center">
                          <UserIcon className="size-5 text-neutral-400" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 메시지 내용 */}
                  <div className={`flex flex-col gap-1 ${isMyMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                    {!isMyMessage && msg.user.username && (
                      <span className="text-xs text-neutral-400 px-1">
                        {msg.user.username}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isMyMessage
                          ? "bg-orange-500 text-white"
                          : "bg-neutral-700 text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.payload}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-500 px-1">
                      {formatToTimeAgo(msg.created_at)}
                      {msg.isOptimistic && (
                        <span className="ml-1 text-orange-500">작성 중...</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            {/* 스크롤 앵커 */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 하단 입력 영역 */}
      <div className="border-t border-neutral-700 bg-neutral-800 p-5">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-neutral-700 rounded-lg px-4 py-2 focus:outline-none ring-2 focus:ring-4 transition ring-neutral-600 focus:ring-orange-500 border-none placeholder:text-neutral-400 resize-none text-white min-h-[44px] max-h-32"
            rows={1}
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim() && !isPending) {
                  handleSubmit(e as any);
                }
              }
            }}
          />
          <button
            type="submit"
            disabled={isPending || !message.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-semibold"
          >
            {isPending ? "전송 중..." : "전송"}
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </>
  );
}

