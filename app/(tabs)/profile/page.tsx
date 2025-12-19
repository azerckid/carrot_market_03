import db from "@/lib/db";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { formatToTimeAgo } from "@/lib/utils";
import Image from "next/image";
import {
  NewspaperIcon,
  ShoppingBagIcon,
  ChatBubbleBottomCenterIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

async function getUser() {
  const session = await getSession();
  if (session.id) {
    const user = await db.user.findUnique({
      where: {
        id: session.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            products: true,
            Comment: true,
          },
        },
      },
    });
    if (user) {
      return user;
    }
  }
  notFound();
}

export default async function Profile() {
  const user = await getUser();
  const logOut = async () => {
    "use server";
    const session = await getSession();
    session.destroy();
    redirect("/");
  };
  
  return (
    <div className="p-5 text-white pb-32">
      {/* 프로필 헤더 섹션 */}
      <div className="flex flex-col items-center mb-8">
        {user.avatar ? (
          <Image
            width={80}
            height={80}
            className="size-20 rounded-full mb-4"
            src={user.avatar}
            alt={user.username}
          />
        ) : (
          <div className="size-20 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
            <UserIcon className="size-12 text-neutral-400" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
        {user.email && (
          <p className="text-sm text-neutral-400 mb-2">{user.email}</p>
        )}
        <p className="text-xs text-neutral-500">
          가입일: {formatToTimeAgo(user.created_at.toString())}
        </p>
      </div>

      {/* 통계 섹션 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">내 활동</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <NewspaperIcon className="size-8 text-orange-500" />
            <span className="text-2xl font-bold">{user._count.posts}</span>
            <span className="text-xs text-neutral-400">게시글</span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <ShoppingBagIcon className="size-8 text-orange-500" />
            <span className="text-2xl font-bold">{user._count.products}</span>
            <span className="text-xs text-neutral-400">상품</span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <ChatBubbleBottomCenterIcon className="size-8 text-orange-500" />
            <span className="text-2xl font-bold">{user._count.Comment}</span>
            <span className="text-xs text-neutral-400">댓글</span>
          </div>
        </div>
      </div>

      {/* 설정 섹션 */}
      <div className="border-t border-neutral-700 pt-6">
        <h2 className="text-lg font-semibold mb-4">설정</h2>
        <form action={logOut}>
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRightOnRectangleIcon className="size-5" />
            <span>로그아웃</span>
          </button>
        </form>
      </div>
    </div>
  );
}

