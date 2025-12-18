"use client";

import { useOptimistic, useState, useTransition } from "react";
import { createComment } from "@/app/posts/[id]/actions";
import { formatToTimeAgo } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

type Comment = {
  id: number;
  payload: string;
  created_at: Date;
  user: {
    username: string;
    avatar: string | null;
  };
};

type OptimisticComment = Comment & {
  isOptimistic?: boolean;
};

interface CommentSectionProps {
  postId: number;
  initialComments: Comment[];
  currentUser: {
    username: string;
    avatar: string | null;
  } | null;
}

export default function CommentSection({
  postId,
  initialComments,
  currentUser,
}: CommentSectionProps) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, newComment: OptimisticComment) => {
      return [newComment, ...state];
    }
  );

  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!comment.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    // 댓글 내용 저장 (초기화 전에 저장)
    const commentPayload = comment.trim();

    // 임시 댓글 생성
    const optimisticComment: OptimisticComment = {
      id: Date.now(), // 임시 ID
      payload: commentPayload,
      created_at: new Date(),
      user: {
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      isOptimistic: true,
    };

    // 낙관적 업데이트
    addOptimisticComment(optimisticComment);
    setComment(""); // 입력 필드 초기화

    // 서버 액션 호출
    startTransition(async () => {
      const result = await createComment(postId, commentPayload);

      if (result?.error) {
        // 에러 발생 시 롤백 (낙관적 업데이트 제거)
        setError(result.error);
        // 페이지 새로고침으로 롤백 (또는 상태를 직접 관리)
        window.location.reload();
      }
      // 성공 시 revalidatePath가 자동으로 페이지를 업데이트하므로
      // 별도 처리가 필요 없음
    });
  };

  return (
    <div className="mt-8 border-t border-neutral-700 pt-5">
      <h3 className="text-lg font-semibold mb-4">
        댓글 {optimisticComments.length}
      </h3>

      {/* 댓글 작성 폼 */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col gap-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="bg-transparent rounded-md w-full min-h-24 px-4 py-3 focus:outline-none ring-2 focus:ring-4 transition ring-neutral-200 focus:ring-orange-500 border-none placeholder:text-neutral-400 resize-none text-white"
              disabled={isPending}
            />
            {error && (
              <span className="text-red-500 font-medium text-sm">{error}</span>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || !comment.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-400 disabled:text-neutral-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full transition-colors"
              >
                {isPending ? "작성 중..." : "댓글 작성"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 text-center py-4 text-neutral-400">
          <p>댓글을 작성하려면 로그인이 필요합니다.</p>
        </div>
      )}

      {/* 댓글 리스트 */}
      {optimisticComments.length === 0 ? (
        <div className="text-center py-10 text-neutral-400">
          <p>아직 댓글이 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 댓글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {optimisticComments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-3 ${
                comment.isOptimistic ? "opacity-60" : ""
              }`}
            >
              {comment.user.avatar ? (
                <Image
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                  src={comment.user.avatar}
                  alt={comment.user.username}
                />
              ) : (
                <div className="size-8 rounded-full bg-neutral-700 flex items-center justify-center">
                  <UserIcon className="size-5 text-neutral-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {formatToTimeAgo(comment.created_at.toString())}
                  </span>
                  {comment.isOptimistic && (
                    <span className="text-xs text-orange-500">작성 중...</span>
                  )}
                </div>
                <p className="text-sm text-neutral-300">{comment.payload}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

