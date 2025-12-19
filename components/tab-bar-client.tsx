"use client";

import {
  HomeIcon as SolidHomeIcon,
  NewspaperIcon as SolidNewspaperIcon,
  ChatBubbleOvalLeftEllipsisIcon as SolidChatIcon,
  VideoCameraIcon as SolidVideoCameraIcon,
  UserIcon as SolidUserIcon,
} from "@heroicons/react/24/solid";
import {
  HomeIcon as OutlineHomeIcon,
  NewspaperIcon as OutlineNewspaperIcon,
  ChatBubbleOvalLeftEllipsisIcon as OutlineChatIcon,
  VideoCameraIcon as OutlineVideoCameraIcon,
  UserIcon as OutlineUserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabBarClientProps {
  chatBadge: React.ReactNode;
}

export default function TabBarClient({ chatBadge }: TabBarClientProps) {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 w-full max-w-screen-sm mx-auto bg-neutral-800 border-t border-neutral-700">
      <div className="flex justify-around items-center py-3 *:text-white">
        <Link href="/home" className="flex flex-col items-center gap-1">
          {pathname === "/home" ? (
            <SolidHomeIcon className="w-7 h-7" />
          ) : (
            <OutlineHomeIcon className="w-7 h-7 text-gray-400" />
          )}
          <span className={`text-xs ${pathname !== "/home" && "text-gray-400"}`}>홈</span>
        </Link>
        <Link href="/life" className="flex flex-col items-center gap-1">
          {pathname === "/life" ? (
            <SolidNewspaperIcon className="w-7 h-7" />
          ) : (
            <OutlineNewspaperIcon className="w-7 h-7 text-gray-400" />
          )}
          <span className={`text-xs ${pathname !== "/life" && "text-gray-400"}`}>동네생활</span>
        </Link>
        <Link href="/chat" className="flex flex-col items-center gap-1 relative">
          {pathname === "/chat" ? (
            <SolidChatIcon className="w-7 h-7" />
          ) : (
            <OutlineChatIcon className="w-7 h-7 text-gray-400" />
          )}
          {chatBadge}
          <span className={`text-xs ${pathname !== "/chat" && "text-gray-400"}`}>채팅</span>
        </Link>
        <Link href="/live" className="flex flex-col items-center gap-1">
          {pathname === "/live" ? (
            <SolidVideoCameraIcon className="w-7 h-7" />
          ) : (
            <OutlineVideoCameraIcon className="w-7 h-7 text-gray-400" />
          )}
          <span className={`text-xs ${pathname !== "/live" && "text-gray-400"}`}>라이브</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1">
          {pathname === "/profile" ? (
            <SolidUserIcon className="w-7 h-7" />
          ) : (
            <OutlineUserIcon className="w-7 h-7 text-gray-400" />
          )}
          <span className={`text-xs ${pathname !== "/profile" && "text-gray-400"}`}>프로필</span>
        </Link>
      </div>
    </div>
  );
}

