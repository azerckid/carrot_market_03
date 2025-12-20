"use client";

import { useState, useTransition } from "react";
import { updateReview } from "@/app/reviews/edit/[reviewId]/actions";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

interface EditReviewFormProps {
  reviewId: number;
  initialRating: number;
  initialContent: string;
}

export default function EditReviewForm({
  reviewId,
  initialRating,
  initialContent,
}: EditReviewFormProps) {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [content, setContent] = useState<string>(initialContent);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateReview(
        reviewId,
        rating,
        content || undefined
      );
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 별점 선택 */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          별점 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoveredRating || rating);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                disabled={isPending}
              >
                {isFilled ? (
                  <StarIcon className="size-8 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="size-8 text-neutral-400" />
                )}
              </button>
            );
          })}
        </div>
        {rating > 0 && (
          <p className="text-sm text-neutral-400 mt-1">
            {rating}점을 선택하셨습니다.
          </p>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div>
        <label htmlFor="content" className="block text-sm font-semibold mb-2">
          리뷰 내용 (선택사항)
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="리뷰를 작성해주세요..."
          rows={5}
          maxLength={500}
          className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          disabled={isPending}
        />
        <p className="text-xs text-neutral-500 mt-1 text-right">
          {content.length}/500
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
      >
        {isPending ? "수정 중..." : "리뷰 수정하기"}
      </button>
    </form>
  );
}

