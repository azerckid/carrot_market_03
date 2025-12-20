"use client";

import { useState, useTransition } from "react";
import { deleteReview } from "@/app/reviews/edit/[reviewId]/actions";
interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isPending,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-neutral-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-xl font-semibold text-white text-center mb-2">
          {title}
        </h3>
        <p className="text-neutral-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {isPending ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteReviewButtonProps {
  reviewId: number;
}

export default function DeleteReviewButton({ reviewId }: DeleteReviewButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if (result?.error) {
        setError(result.error);
        setIsModalOpen(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-red-500 hover:text-red-600 text-sm font-semibold transition-colors"
        disabled={isPending}
      >
        삭제
      </button>
      {isModalOpen && (
        <DeleteConfirmModal
          title="리뷰 삭제"
          message="정말로 이 리뷰를 삭제하시겠습니까? 삭제된 리뷰는 복구할 수 없습니다."
          onConfirm={handleDelete}
          onCancel={() => setIsModalOpen(false)}
          isPending={isPending}
        />
      )}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
    </>
  );
}

