"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateReview(
  reviewId: number,
  rating: number,
  content?: string
) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 별점 유효성 검사
  if (!rating || rating < 1 || rating > 5) {
    return { error: "별점은 1점부터 5점까지 선택할 수 있습니다." };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      productId: true,
      revieweeId: true,
    },
  });

  if (!review) {
    return { error: "리뷰를 찾을 수 없습니다." };
  }

  if (review.reviewerId !== session.id) {
    return { error: "수정 권한이 없습니다." };
  }

  await db.review.update({
    where: { id: reviewId },
    data: {
      rating,
      content: content?.trim() || null,
    },
  });

  // 캐시 무효화
  revalidatePath(`/products/${review.productId}`);
  revalidatePath(`/profile`);
  revalidatePath(`/profile/${review.revieweeId}`);

  // 프로필 페이지로 리다이렉트
  redirect("/profile");
}

export async function deleteReview(reviewId: number) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      reviewerId: true,
      productId: true,
      revieweeId: true,
    },
  });

  if (!review) {
    return { error: "리뷰를 찾을 수 없습니다." };
  }

  if (review.reviewerId !== session.id) {
    return { error: "삭제 권한이 없습니다." };
  }

  await db.review.delete({
    where: { id: reviewId },
  });

  // 캐시 무효화
  revalidatePath(`/products/${review.productId}`);
  revalidatePath(`/profile`);
  revalidatePath(`/profile/${review.revieweeId}`);

  // 프로필 페이지로 리다이렉트
  redirect("/profile");
}

