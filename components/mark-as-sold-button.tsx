"use client";

import { useState, useTransition } from "react";
import { markAsSold } from "@/app/products/[id]/actions";

interface MarkAsSoldButtonProps {
  productId: number;
  buyers: Array<{
    id: number;
    username: string;
    avatar: string | null;
    chatRoomId: number;
  }>;
}

export default function MarkAsSoldButton({
  productId,
  buyers,
}: MarkAsSoldButtonProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(
    buyers.length === 1 ? buyers[0].id : null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedBuyerId) {
      setError("구매자를 선택해주세요.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await markAsSold(productId, selectedBuyerId);
      if (result?.error) {
        setError(result.error);
      }
      // 성공 시 redirect가 처리되므로 여기서는 아무것도 하지 않음
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {buyers.length > 1 && (
        <select
          value={selectedBuyerId || ""}
          onChange={(e) => setSelectedBuyerId(Number(e.target.value))}
          className="bg-neutral-700 text-white px-3 py-2 rounded-md text-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isPending}
        >
          <option value="">구매자 선택</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.username}
            </option>
          ))}
        </select>
      )}
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={isPending || !selectedBuyerId}
        className="bg-green-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-green-600 transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
      >
        {isPending ? "처리 중..." : "판매 완료"}
      </button>
    </div>
  );
}

