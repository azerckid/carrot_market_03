import Link from "next/link";
import {
  HomeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  UserIcon,
} from "@heroicons/react/24/solid";

export default function TabBar() {
  return (
    <div className="fixed bottom-0 w-full max-w-screen-sm mx-auto bg-neutral-800 border-t border-neutral-700">
      <div className="flex justify-around items-center py-3">
        <Link href="/products" className="flex flex-col items-center gap-1">
          <HomeIcon className="size-7" />
          <span className="text-xs">홈</span>
        </Link>
        <Link href="/life" className="flex flex-col items-center gap-1">
          <ChatBubbleOvalLeftEllipsisIcon className="size-7" />
          <span className="text-xs">동네생활</span>
        </Link>
        <Link href="/chat" className="flex flex-col items-center gap-1">
          <ChatBubbleOvalLeftEllipsisIcon className="size-7" />
          <span className="text-xs">채팅</span>
        </Link>
        <Link href="/live" className="flex flex-col items-center gap-1">
          <ChatBubbleOvalLeftEllipsisIcon className="size-7" />
          <span className="text-xs">라이브</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1">
          <UserIcon className="size-7" />
          <span className="text-xs">나의 당근</span>
        </Link>
      </div>
    </div>
  );
}

