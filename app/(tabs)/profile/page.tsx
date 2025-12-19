import db from "@/lib/db";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { formatToTimeAgo, formatToWon } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  NewspaperIcon,
  ShoppingBagIcon,
  ChatBubbleBottomCenterIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  HandThumbUpIcon,
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

async function getUserPosts(userId: number) {
  const posts = await db.post.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      views: true,
      created_at: true,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    take: 5,
    orderBy: {
      created_at: "desc",
    },
  });
  return posts;
}

async function getUserProducts(userId: number) {
  const products = await db.product.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      title: true,
      price: true,
      photo: true,
      created_at: true,
    },
    take: 6,
    orderBy: {
      created_at: "desc",
    },
  });
  return products;
}

export default async function Profile() {
  const user = await getUser();
  const posts = await getUserPosts(user.id);
  const products = await getUserProducts(user.id);
  
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

      {/* 내 게시글 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">내 게시글</h2>
          {posts.length > 0 && (
            <Link
              href="/life"
              className="text-sm text-neutral-400 hover:text-orange-500 transition-colors"
            >
              전체보기 →
            </Link>
          )}
        </div>
        {posts.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm">작성한 게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="pb-3 border-b border-neutral-700 text-neutral-400 flex flex-col gap-2 last:pb-0 last:border-b-0 cursor-pointer hover:bg-neutral-800/50 rounded-lg p-3 -mx-3 transition-colors"
              >
                <h3 className="text-white text-base font-semibold line-clamp-1">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-sm line-clamp-2">{post.description}</p>
                )}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex gap-3 items-center">
                    <span>{formatToTimeAgo(post.created_at.toString())}</span>
                    <span>·</span>
                    <span>조회 {post.views}</span>
                  </div>
                  <div className="flex gap-3 items-center *:flex *:gap-1 *:items-center">
                    <span>
                      <HandThumbUpIcon className="size-3" />
                      {post._count.likes}
                    </span>
                    <span>
                      <ChatBubbleBottomCenterIcon className="size-3" />
                      {post._count.comments}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 내 상품 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">내 상품</h2>
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
            <p className="text-sm">등록한 상품이 없습니다.</p>
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

