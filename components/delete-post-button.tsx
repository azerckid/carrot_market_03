"use client";

import { useState, useTransition } from "react";
import { deletePost } from "@/app/posts/[id]/actions";
import DeleteConfirmModal from "./delete-confirm-modal";

interface DeletePostButtonProps {
  postId: number;
}

export default function DeletePostButton({
  postId,
}: DeletePostButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={isPending}
        className="bg-red-500 px-5 py-2.5 rounded-md text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
      >
        {isPending ? "삭제 중..." : "게시글 삭제"}
      </button>

      <DeleteConfirmModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isLoading={isPending}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까?"
      />
    </>
  );
}

