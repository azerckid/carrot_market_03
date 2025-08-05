import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface BackButtonProps {
  href: string;
  className?: string;
}

export default function BackButton({ href, className = "" }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`absolute left-5 top-5 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10 ${className}`}
    >
      <ArrowLeftIcon className="size-6 text-white" />
    </Link>
  );
}

