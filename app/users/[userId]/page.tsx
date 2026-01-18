import db, { schema } from "@/lib/db";
import getSession from "@/lib/session";
import { notFound } from "next/navigation";
import { formatToTimeAgo, formatToWon } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  NewspaperIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import BackButton from "@/components/back-button";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const { users, products, reviews } = schema;

async function getUserProfile(userId: number) {
  // 사용자 기본 정보 조회
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    avatar: users.avatar,
    created_at: users.created_at,
  })
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

  if (!user) {
    return null;
  }

  // 판매중인 상품 조회
  const userProducts = await db.select({
    id: products.id,
    title: products.title,
    price: products.price,
    photo: products.photo,
    created_at: products.created_at,
  })
  .from(products)
  .where(and(
    eq(products.userId, userId),
    eq(products.status, "판매중")
  ))
  .orderBy(desc(products.created_at))
  .limit(10);

  // 카운트 계산
  const [productCount] = await db.select({
    count: sql<number>`count(*)`.as('count'),
  })
  .from(products)
  .where(eq(products.userId, userId));

  const [reviewCount] = await db.select({
    count: sql<number>`count(*)`.as('count'),
  })
  .from(reviews)
  .where(eq(reviews.revieweeId, userId));

  // 받은 리뷰 조회
  const reviewList = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    content: reviews.content,
    created_at: reviews.created_at,
    reviewerId: reviews.reviewerId,
    productId: reviews.productId,
  })
  .from(reviews)
  .where(eq(reviews.revieweeId, userId))
  .orderBy(desc(reviews.created_at))
  .limit(10);

  // 리뷰에 reviewer와 product 정보 추가
  const reviewsWithDetails = await Promise.all(
    reviewList.map(async (review) => {
      const [reviewer] = await db.select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.id, review.reviewerId))
      .limit(1);

      const [product] = await db.select({
        id: products.id,
        title: products.title,
        photo: products.photo,
      })
      .from(products)
      .where(eq(products.id, review.productId))
      .limit(1);

      return {
        ...review,
        reviewer: reviewer!,
        product: product!,
      };
    })
  );

  const avgRating =
    reviewsWithDetails.length > 0
      ? reviewsWithDetails.reduce((sum, review) => sum + review.rating, 0) / reviewsWithDetails.length
      : 0;

  return {
    ...user,
    products: userProducts,
    _count: {
      products: productCount?.count || 0,
      revieweeReviews: reviewCount?.count || 0,
    },
    reviews: reviewsWithDetails,
    avgRating,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const userIdNum = Number(userId);

  if (isNaN(userIdNum)) {
    return notFound();
  }

  const userProfile = await getUserProfile(userIdNum);

  if (!userProfile) {
    return notFound();
  }

  const session = await getSession();
  const isOwnProfile = session.id === userIdNum;

  // 본인 프로필이면 프로필 페이지로 리다이렉트
  if (isOwnProfile) {
    return notFound(); // 또는 redirect("/profile");
  }

  return (
    <div className="p-5 text-white pb-32">
      <BackButton href="/home" />

      {/* 프로필 헤더 섹션 */}
      <div className="flex flex-col items-center mb-8 mt-4">
        {userProfile.avatar ? (
          <Image
            width={80}
            height={80}
            className="size-20 rounded-full mb-4"
            src={userProfile.avatar}
            alt={userProfile.username}
          />
        ) : (
          <div className="size-20 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
            <UserIcon className="size-12 text-neutral-400" />
          </div>
        )}
        <h1 className="text-2xl font-bold mb-1">{userProfile.username}</h1>
        {userProfile.email && (
          <p className="text-sm text-neutral-400 mb-2">{userProfile.email}</p>
        )}
        <p className="text-xs text-neutral-500">
          가입일: {formatToTimeAgo(userProfile.created_at)}
        </p>
      </div>

      {/* 통계 섹션 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">활동</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <ShoppingBagIcon className="size-8 text-orange-500" />
            <span className="text-2xl font-bold">
              {userProfile._count.products}
            </span>
            <span className="text-xs text-neutral-400">상품</span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <StarIcon className="size-8 text-yellow-400" />
            <span className="text-2xl font-bold">
              {userProfile.avgRating > 0 ? userProfile.avgRating.toFixed(1) : "0"}
            </span>
            <span className="text-xs text-neutral-400">평균 별점</span>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 flex flex-col items-center gap-2">
            <NewspaperIcon className="size-8 text-orange-500" />
            <span className="text-2xl font-bold">
              {userProfile._count.revieweeReviews}
            </span>
            <span className="text-xs text-neutral-400">리뷰</span>
          </div>
        </div>
      </div>

      {/* 판매중인 상품 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">판매중인 상품</h2>
          {userProfile.products.length > 0 && (
            <Link
              href="/home"
              className="text-sm text-neutral-400 hover:text-orange-500 transition-colors"
            >
              전체보기 →
            </Link>
          )}
        </div>
        {userProfile.products.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm">판매중인 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {userProfile.products.map((product) => (
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
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full font-semibold">
                      판매중
                    </span>
                  </div>
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

      {/* 받은 리뷰 섹션 */}
      <div className="mb-8 border-t border-neutral-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">받은 리뷰</h2>
          {userProfile.reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <StarIcon className="size-5 text-yellow-400" />
                <span className="text-base font-bold">
                  {userProfile.avgRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-neutral-400">
                ({userProfile.reviews.length})
              </span>
            </div>
          )}
        </div>
        {userProfile.reviews.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p className="text-sm">받은 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {userProfile.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-neutral-800 rounded-lg p-4 flex flex-col gap-3"
              >
                {/* 리뷰 작성자 및 별점 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/users/${review.reviewer.id}`}
                      className="size-10 overflow-hidden rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0"
                    >
                      {review.reviewer.avatar ? (
                        <Image
                          src={review.reviewer.avatar}
                          width={40}
                          height={40}
                          alt={review.reviewer.username}
                          className="rounded-full"
                        />
                      ) : (
                        <UserIcon className="size-6 text-neutral-400" />
                      )}
                    </Link>
                    <div>
                      <Link
                        href={`/users/${review.reviewer.id}`}
                        className="font-semibold hover:text-orange-500 transition-colors"
                      >
                        {review.reviewer.username}
                      </Link>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`size-4 ${
                              star <= review.rating
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
    </div>
  );
}

