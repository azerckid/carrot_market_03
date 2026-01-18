"use server";

import db from "@/lib/db";
import { reviews, products } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import getSession from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createReview(
  productId: number,
  revieweeId: number,
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

  // 이미 리뷰를 작성했는지 확인
  const existingReview = await db.query.reviews.findFirst({
    where: and(
      eq(reviews.reviewerId, session.id),
      eq(reviews.productId, productId)
    )
  });

  if (existingReview) {
    return { error: "이미 리뷰를 작성하셨습니다." };
  }

  // 상품 정보 확인
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: {
      id: true,
      userId: true,
      soldTo: true,
      status: true,
    },
  });

  if (!product) {
    return { error: "상품을 찾을 수 없습니다." };
  }

  // 판매 완료된 상품인지 확인
  if (product.status !== "판매완료") {
    return { error: "판매 완료된 상품에만 리뷰를 작성할 수 있습니다." };
  }

  // 권한 확인: 구매자 또는 판매자만 리뷰 작성 가능
  const canReview =
    (product.userId === session.id && product.soldTo === revieweeId) ||
    (product.soldTo === session.id && product.userId === revieweeId);

  if (!canReview) {
    return { error: "리뷰 작성 권한이 없습니다." };
  }

  // 리뷰 생성
  await db.insert(reviews).values({
    rating,
    content: content?.trim() || null,
    reviewerId: session.id,
    revieweeId,
    productId,
  });

  // 캐시 무효화
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/profile`);
  revalidatePath(`/profile/${revieweeId}`);

  // 프로필 페이지로 리다이렉트
  redirect("/profile");
}

