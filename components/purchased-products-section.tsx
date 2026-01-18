"use client";

import Image from "next/image";
import Link from "next/link";
import { formatToWon, formatToTimeAgo } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/outline";

type Product = {
  id: number;
  title: string;
  price: number;
  photo: string;
  soldAt: Date | null;
  user: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
};

interface PurchasedProductsSectionProps {
  products: Product[];
}

export default function PurchasedProductsSection({
  products,
}: PurchasedProductsSectionProps) {
  return (
    <div className="mb-8 border-t border-neutral-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">구매한 상품</h2>
        {products.length > 0 && (
          <Link
            href="/home"
            className="text-sm text-neutral-400 hover:text-orange-500 transition-colors"
          >
            전체보기 →
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-10 text-neutral-400">
          <p className="text-sm">구매한 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
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
                {/* 판매 완료 배지 */}
                <div className="absolute top-2 right-2">
                  <span className="text-xs px-2 py-1 bg-neutral-500/20 text-neutral-400 rounded-full font-semibold">
                    구매완료
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold line-clamp-1">
                {product.title}
              </h3>
              <p className="text-base font-bold text-orange-500">
                {formatToWon(product.price)}원
              </p>
              
              {/* 판매자 정보 및 구매 날짜 */}
              <div className="flex items-center gap-2 mt-1">
                <div className="size-6 overflow-hidden rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  {product.user?.avatar ? (
                    <Image
                      src={product.user?.avatar || ""}
                      width={24}
                      height={24}
                      alt={product.user?.username || "사용자"}
                      className="rounded-full"
                    />
                  ) : (
                    <UserIcon className="size-4 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 truncate">
                    {product.user?.username || "알 수 없음"}
                  </p>
                  {product.soldAt && (
                    <p className="text-xs text-neutral-500">
                      {formatToTimeAgo(product.soldAt)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

