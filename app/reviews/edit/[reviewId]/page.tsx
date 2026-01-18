import db from "@/lib/db";
import { reviews } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { UserIcon } from "@heroicons/react/24/solid";
import BackButton from "@/components/back-button";
import EditReviewForm from "@/components/edit-review-form";
import { formatToWon } from "@/lib/utils";

async function getReview(reviewId: number) {
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
    with: {
      reviewer: {
        columns: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      reviewee: {
        columns: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      product: {
        columns: {
          id: true,
          title: true,
          price: true,
          photo: true,
          description: true,
        },
      },
    },
  });
  return review;
}

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  const reviewIdNum = Number(reviewId);

  if (isNaN(reviewIdNum)) {
    return notFound();
  }

  const session = await getSession();
  if (!session.id) {
    redirect("/");
  }

  const review = await getReview(reviewIdNum);

  if (!review) {
    return notFound();
  }

  // 권한 확인: 리뷰 작성자만 수정 가능
  if (review.reviewerId !== session.id) {
    return notFound();
  }

  return (
    <div className="pb-32">
      <BackButton href="/profile" />

      <div className="p-5">
        {/* 상품 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">상품 정보</h2>
          <div className="flex gap-4">
            <div className="relative size-24 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
              <Image
                fill
                src={review.product.photo}
                alt={review.product.title}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-1">{review.product.title}</h3>
              <p className="text-lg font-bold text-orange-500">
                {formatToWon(review.product.price)}원
              </p>
            </div>
          </div>
        </div>

        {/* 리뷰 대상자 정보 */}
        <div className="mb-6 pb-6 border-b border-neutral-700">
          <h2 className="text-lg font-semibold mb-4">리뷰 대상자</h2>
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center">
              {review.reviewee.avatar ? (
                <Image
                  src={review.reviewee.avatar}
                  width={48}
                  height={48}
                  alt={review.reviewee.username}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="size-8 text-neutral-400" />
              )}
            </div>
            <div>
              <p className="font-semibold">{review.reviewee.username}</p>
            </div>
          </div>
        </div>

        {/* 리뷰 수정 폼 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">리뷰 수정</h2>
          <EditReviewForm
            reviewId={reviewIdNum}
            initialRating={review.rating}
            initialContent={review.content || ""}
          />
        </div>
      </div>
    </div>
  );
}

