"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatToWon } from "@/lib/utils";

type Product = {
  id: number;
  title: string;
  price: number;
  photo: string;
  status: string;
  created_at: Date;
};

interface SoldProductsSectionProps {
  products: Product[];
}

export default function SoldProductsSection({
  products: initialProducts,
}: SoldProductsSectionProps) {
  const [filter, setFilter] = useState<"all" | "판매중" | "판매완료">("all");

  const filteredProducts =
    filter === "all"
      ? initialProducts
      : initialProducts.filter((product) => product.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "판매중":
        return (
          <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full font-semibold">
            판매중
          </span>
        );
      case "판매완료":
        return (
          <span className="text-xs px-2 py-1 bg-neutral-500/20 text-neutral-400 rounded-full font-semibold">
            판매완료
          </span>
        );
      case "예약중":
        return (
          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full font-semibold">
            예약중
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-8 border-t border-neutral-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">판매한 상품</h2>
        {initialProducts.length > 0 && (
          <Link
            href="/home"
            className="text-sm text-neutral-400 hover:text-orange-500 transition-colors"
          >
            전체보기 →
          </Link>
        )}
      </div>

      {/* 필터 버튼 */}
      {initialProducts.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === "all"
                ? "bg-orange-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter("판매중")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === "판매중"
                ? "bg-orange-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            판매중
          </button>
          <button
            onClick={() => setFilter("판매완료")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === "판매완료"
                ? "bg-orange-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            판매완료
          </button>
        </div>
      )}

      {/* 상품 목록 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-neutral-400">
          <p className="text-sm">
            {filter === "all"
              ? "등록한 상품이 없습니다."
              : filter === "판매중"
              ? "판매중인 상품이 없습니다."
              : "판매완료된 상품이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex flex-col gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-700">
                <Image
                  fill
                  src={product.photo}
                  alt={product.title}
                  className="object-cover"
                />
                {/* 상태 배지 */}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.status)}
                </div>
              </div>
              <h3 className="text-sm font-semibold line-clamp-1">
                {product.title}
              </h3>
              <p className="text-base font-bold text-orange-500">
                {formatToWon(product.price)}원
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

