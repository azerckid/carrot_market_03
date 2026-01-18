"use client";

import { useOptimistic, useState, useTransition, useEffect, useRef } from "react";
import { sendMessage } from "@/app/chat/[id]/actions";
import { formatToTimeAgo } from "@/lib/utils";
import ClientPusher from "pusher-js";
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
      // 만약 이미 있는 메시지면 추가하지 않음 (Pusher 로직과 상호작용 대비)
      if (state.some((m) => m.id === newMessage.id)) {
        return state;
      }
      return [...state, newMessage];
    }
  );

  // 실제 메시지 ID 셋 (렌더링 단 중복 방지용)
  const realMessageIds = new Set(messages.map((m) => m.id));

  // 최종 노출 메시지: 낙관적 메시지 중 이미 '실제'로 승격된 것은 제외
  const displayMessages = optimisticMessages.filter((msg) => {
    if (msg.isOptimistic) return true; // 아직 임시 상태인 것은 보여줌
    return true; // useOptimistic이 이미 state와 병합해주므로 기본 리턴
  });
  // 사실 useOptimistic의 첫번째 인자가 messages이므로, 
  // transition이 끝나면 optimisticMessages는 자동으로 messages와 같아집니다.
  // 중복은 transition이 "끝나는 찰나"에 발생합니다.

  // 가장 확실한 방법: ID 기반 유니크 리스트 생성
  const uniqueMessages = Array.from(
    new Map(optimisticMessages.map((m) => [m.id, m])).values()
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
  }, [uniqueMessages]);

  // Pusher 실시간 구독
  useEffect(() => {
    const pusherClient = new ClientPusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusherClient.subscribe(`chat-room-${chatRoomId}`);

    channel.bind("new-message", (newMessage: OptimisticMessage) => {
      setMessages((prev) => {
        // 중복 방지: 이미 있는 메시지는 제외
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        // 내가 보낸 메시지는 Pusher로 받아도 무시 (서버 액션 결과로 처리하여 낙관적 업데이트와 자연스런 교체 유도)
        if (newMessage.userId === currentUserId) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    return () => {
      pusherClient.unsubscribe(`chat-room-${chatRoomId}`);
    };
  }, [chatRoomId, currentUserId]);

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
      // 임시 메시지 생성 (진짜 ID와 겹치지 않게 음수 사용)
      const optimisticMessage: OptimisticMessage = {
        id: -Date.now(), // 임시 ID
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
      } else if (result?.message) {
        // 성공 시 받아온 진짜 메시지로 상태 업데이트 (이 시점에 transition이 끝나며 낙관적 메시지는 사라짐)
        setMessages((prev) => [...prev, result.message as OptimisticMessage]);
      }
    });
  };

  return (
    <>
      {/* 메시지 리스트 영역 */}
      <div className="flex-1 overflow-y-auto p-5">
        {uniqueMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <p className="text-lg">아직 메시지가 없습니다.</p>
            <p className="text-sm mt-2">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {uniqueMessages.map((msg) => {
              const isMyMessage = msg.userId === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMyMessage ? "flex-row-reverse" : ""} ${msg.isOptimistic ? "opacity-60" : ""
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
                      className={`px-4 py-2 rounded-lg ${isMyMessage
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

