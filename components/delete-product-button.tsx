"use client";

import { useState, useTransition } from "react";
import { deleteProduct } from "@/app/products/[id]/actions";
import DeleteConfirmModal from "./delete-confirm-modal";

interface DeleteProductButtonProps {
  productId: number;
}

export default function DeleteProductButton({
  productId,
}: DeleteProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      await deleteProduct(productId);
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
        {isPending ? "삭제 중..." : "Delete product"}
      </button>

      <DeleteConfirmModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isLoading={isPending}
      />
    </>
  );
}

