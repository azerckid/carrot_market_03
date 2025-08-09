"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

interface ModalBackButtonProps {
  className?: string;
}

export default function ModalBackButton({ className = "" }: ModalBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button
      onClick={handleBack}
      className={`absolute left-5 top-5 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10 ${className}`}
    >
      <ArrowLeftIcon className="size-6 text-white" />
    </button>
  );
}

