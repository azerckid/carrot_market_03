"use client";

import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function Modal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const productId = Number(id);

  // 숫자가 아닌 경우 (예: "add") 모달을 표시하지 않음
  if (isNaN(productId)) {
    return null;
  }

  const onCloseClick = () => {
    router.back();
  };

  return (
    <div className="absolute w-full h-full z-50 flex items-center justify-center bg-black bg-opacity-60 left-0 top-0">
      <button
        onClick={onCloseClick}
        className="absolute right-5 top-5 text-neutral-200"
      >
        <XMarkIcon className="size-10" />
      </button>
      <div className="max-w-screen-sm h-1/2 flex justify-center w-full">
        <div className="aspect-square bg-neutral-700 text-neutral-200 rounded-md flex justify-center items-center">
          <PhotoIcon className="h-28" />
        </div>
      </div>
    </div>
  );
}

