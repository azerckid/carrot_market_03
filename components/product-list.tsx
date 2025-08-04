"use client";

import { InitialProducts } from "@/app/(tabs)/products/page";
import ListProduct from "./list-product";
import { useEffect, useRef, useState } from "react";
import { getMoreProducts } from "@/app/(tabs)/products/actions";

interface ProductListProps {
  initialProducts: InitialProducts;
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState<InitialProducts>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);
  const trigger = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver
      ) => {
        const element = entries[0];
        if (element.isIntersecting && trigger.current) {
          observer.unobserve(trigger.current);
          setIsLoading(true);
          // 300ms 딜레이를 주어서 로딩 효과를 확인 위함 나중에 삭제하세요.
          await new Promise((resolve) => setTimeout(resolve, 300));
          const newProducts = await getMoreProducts(page + 1);
          if (newProducts.length !== 0) {
            setPage((prev) => prev + 1);
            setProducts((prev: InitialProducts) => [...prev, ...newProducts]);
          } else {
            setIsLastPage(true);
          }
          setIsLoading(false);
        }
      },
      {
        threshold: 1.0,
      }
    );
    if (trigger.current) {
      observer.observe(trigger.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [page]);
  return (
    <div className="p-5 pb-32 flex flex-col gap-5">
      {products.map((product: InitialProducts[number]) => (
        <ListProduct key={product.id} {...product} />
      ))}
      {!isLastPage ? (
        <div
          ref={trigger}
          className="h-20 w-full flex items-center justify-center py-10"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-semibold text-white">
                로딩 중...
              </span>
            </div>
          ) : (
            <div className="h-1 w-full"></div>
          )}
        </div>
      ) : null}
    </div>
  );
}

