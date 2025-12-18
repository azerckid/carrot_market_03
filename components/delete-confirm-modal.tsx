"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  message?: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = "제품 삭제",
  message = "정말로 이 제품을 삭제하시겠습니까?",
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="relative bg-neutral-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        {/* 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="bg-neutral-700 rounded-full p-3">
            <ExclamationTriangleIcon className="size-8 text-red-500" />
          </div>
        </div>

        {/* 메시지 */}
        <h3 className="text-xl font-semibold text-white text-center mb-2">
          {title}
        </h3>
        <p className="text-neutral-400 text-center mb-6">
          {message}
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "삭제 중..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

