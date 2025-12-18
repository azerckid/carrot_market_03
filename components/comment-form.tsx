"use client";

import { useState } from "react";
import { createComment } from "@/app/posts/[id]/actions";
import Button from "@/components/button";

interface CommentFormProps {
  postId: number;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!comment.trim()) {
      setError("댓글 내용을 입력해주세요.");
      setIsSubmitting(false);
      return;
    }

    const result = await createComment(postId, comment);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      // 성공 시 입력 필드 초기화
      setComment("");
      setIsSubmitting(false);
      // 페이지 새로고침 (revalidatePath가 자동으로 처리)
      window.location.reload();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-col gap-2">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="bg-transparent rounded-md w-full min-h-24 px-4 py-3 focus:outline-none ring-2 focus:ring-4 transition ring-neutral-200 focus:ring-orange-500 border-none placeholder:text-neutral-400 resize-none text-white"
          disabled={isSubmitting}
        />
        {error && (
          <span className="text-red-500 font-medium text-sm">{error}</span>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-neutral-400 disabled:text-neutral-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full transition-colors"
          >
            {isSubmitting ? "작성 중..." : "댓글 작성"}
          </button>
        </div>
      </div>
    </form>
  );
}

