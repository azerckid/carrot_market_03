import db from "@/lib/db";
import { users, posts, products, reviews, comments, likes, chatRooms } from "@/drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
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
import { StarIcon } from "@heroicons/react/24/solid";
import SoldProductsSection from "@/components/sold-products-section";
import PurchasedProductsSection from "@/components/purchased-products-section";
import DeleteReviewButton from "@/components/delete-review-button";

async function getUser() {
  const session = await getSession();
  if (session.id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
      columns: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        created_at: true,
      },
      extras: {
        postsCount: sql<number>`(select count(*) from ${posts} where ${posts.userId} = ${users.id})`.as('posts_count'),
        productsCount: sql<number>`(select count(*) from ${products} where ${products.userId} = ${users.id})`.as('products_count'),
        commentsCount: sql<number>`(select count(*) from ${comments} where ${comments.userId} = ${users.id})`.as('comments_count'),
      }
    });

    if (user) {
      // Map Drizzle result to expected structure with _count
      return {
        ...user,
        _count: {
          posts: user.postsCount,
          products: user.productsCount,
          Comment: user.commentsCount,
        }
      };
    }
  }
  notFound();
}

async function getUserPosts(userId: number) {
  const userPosts = await db.query.posts.findMany({
    where: eq(posts.userId, userId),
    limit: 5,
    orderBy: [desc(posts.created_at)],
    extras: {
      likesCount: sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`.as('likes_count'),
      commentsCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`.as('comments_count'),
    }
  });

  // Transform to match Prisma structure for UI compatibility
  return userPosts.map(p => ({
    ...p,
    _count: {
      likes: p.likesCount,
      comments: p.commentsCount
    }
  }));
}

async function getSoldProducts(userId: number) {
  const soldProducts = await db.query.products.findMany({
    where: eq(products.userId, userId),
    orderBy: [desc(products.created_at)],
    extras: {
      chatRoomsCount: sql<number>`(select count(*) from ${chatRooms} where ${chatRooms.productId} = ${products.id})`.as('chat_rooms_count')
    }
  });

  return soldProducts.map(p => ({
    ...p,
    _count: {
      chatRooms: p.chatRoomsCount
    }
  }));
}

async function getPurchasedProducts(userId: number) {
  const purchasedProducts = await db.query.products.findMany({
    where: eq(products.soldTo, userId),
    orderBy: [desc(products.soldAt || products.created_at)], // Fallback to created_at if soldAt is null/undefined in schema type, or use soldAt if available
    with: {
      user: {
        columns: {
          id: true,
          username: true,
          avatar: true,
        }
      }
    }
  });
  return purchasedProducts;
}

async function getReceivedReviews(userId: number) {
  const receivedReviews = await db.query.reviews.findMany({
    where: eq(reviews.revieweeId, userId),
    orderBy: [desc(reviews.created_at)],
    with: {
      reviewer: {
        columns: { id: true, username: true, avatar: true }
      },
      product: {
        columns: { id: true, title: true, photo: true }
      }
    }
  });

  // 평균 별점 계산
  const avgRating =
    receivedReviews.length > 0
      ? receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length
      : 0;

  return { reviews: receivedReviews, avgRating };
}

async function getWrittenReviews(userId: number) {
  const writtenReviews = await db.query.reviews.findMany({
    where: eq(reviews.reviewerId, userId),
    orderBy: [desc(reviews.created_at)],
    with: {
      reviewee: {
        columns: { id: true, username: true, avatar: true }
      },
      product: {
        columns: { id: true, title: true, photo: true }
      }
    }
  });

  return writtenReviews;
}

export default async function Profile() {
  const user = await getUser();
  const posts = await getUserPosts(user.id);
  const soldProducts = await getSoldProducts(user.id);
  const purchasedProducts = await getPurchasedProducts(user.id);
  const { reviews, avgRating } = await getReceivedReviews(user.id);
  const writtenReviews = await getWrittenReviews(user.id);

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
          가입일: {formatToTimeAgo(user.created_at)}
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
                    <span>{formatToTimeAgo(post.created_at)}</span>
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

      {/* 판매한 상품 섹션 */}
      <SoldProductsSection products={soldProducts} />

      {/* 구매한 상품 섹션 */}
      <PurchasedProductsSection products={purchasedProducts} />

      {/* 작성한 리뷰 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">작성한 리뷰</h2>
        </div>
        {writtenReviews.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm">작성한 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {writtenReviews.map((review) => (
              <div
                key={review.id}
                className="bg-neutral-800 rounded-lg p-4 flex flex-col gap-3"
              >
                {/* 리뷰 대상자 및 별점 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 overflow-hidden rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      {review.reviewee?.avatar ? (
                        <Image
                          src={review.reviewee?.avatar || ""}
                          width={40}
                          height={40}
                          alt={review.reviewee?.username || "사용자"}
                          className="rounded-full"
                        />
                      ) : (
                        <UserIcon className="size-6 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{review.reviewee?.username || "알 수 없음"}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`size-4 ${star <= review.rating
                              ? "text-yellow-400"
                              : "text-neutral-600"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reviews/edit/${review.id}`}
                      className="text-blue-500 hover:text-blue-600 text-sm font-semibold transition-colors"
                    >
                      수정
                    </Link>
                    <DeleteReviewButton reviewId={review.id} />
                    <span className="text-xs text-neutral-500">
                      {formatToTimeAgo(review.created_at)}
                    </span>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                {review.content && (
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                    {review.content}
                  </p>
                )}

                {/* 상품 정보 링크 */}
                <Link
                  href={`/products/${review.product.id}`}
                  className="flex items-center gap-3 p-2 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div className="relative size-12 rounded-lg overflow-hidden bg-neutral-600 flex-shrink-0">
                    <Image
                      fill
                      src={review.product.photo}
                      alt={review.product.title}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      {review.product.title}
                    </p>
                    <p className="text-xs text-neutral-400">상품 보기 →</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 받은 리뷰 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">받은 리뷰</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarIcon className="size-5 text-yellow-400" />
                <span className="text-base font-bold">
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-neutral-400">
                ({reviews.length})
              </span>
            </div>
          )}
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm">받은 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-neutral-800 rounded-lg p-4 flex flex-col gap-3"
              >
                {/* 리뷰 작성자 및 별점 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 overflow-hidden rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                      {review.reviewer?.avatar ? (
                        <Image
                          src={review.reviewer?.avatar || ""}
                          width={40}
                          height={40}
                          alt={review.reviewer?.username || "사용자"}
                          className="rounded-full"
                        />
                      ) : (
                        <UserIcon className="size-6 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{review.reviewer?.username || "알 수 없음"}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`size-4 ${star <= review.rating
                              ? "text-yellow-400"
                              : "text-neutral-600"
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatToTimeAgo(review.created_at)}
                  </span>
                </div>

                {/* 리뷰 내용 */}
                {review.content && (
                  <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                    {review.content}
                  </p>
                )}

                {/* 상품 정보 링크 */}
                <Link
                  href={`/products/${review.product.id}`}
                  className="flex items-center gap-3 p-2 bg-neutral-700/50 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div className="relative size-12 rounded-lg overflow-hidden bg-neutral-600 flex-shrink-0">
                    <Image
                      fill
                      src={review.product.photo}
                      alt={review.product.title}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      {review.product.title}
                    </p>
                    <p className="text-xs text-neutral-400">상품 보기 →</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 설정 섹션 */}
      <div className="border-t border-neutral-700 pt-6">
        <h2 className="text-lg font-semibold mb-4">설정</h2>
        <div className="flex flex-col gap-3">
          <Link
            href="/profile/edit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>프로필 수정</span>
          </Link>
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
    </div>
  );
}

