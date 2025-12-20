"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

export async function deleteProduct(productId: number) {
  const session = await getSession();

  // 세션 확인
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 상품 조회 및 소유자 확인
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!product) {
    return { error: "상품을 찾을 수 없습니다." };
  }

  // 소유자 확인
  if (product.userId !== session.id) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 상품 삭제 (CASCADE로 채팅방도 자동 삭제됨)
  await db.product.delete({
    where: { id: productId },
  });

  // 캐시 무효화
  revalidateTag("products", "max");
  revalidateTag("product-detail", "max");
  revalidateTag("product-title", "max");
  revalidatePath("/home");
  revalidatePath(`/products/${productId}`);

  // 리스트 페이지로 리다이렉트
  redirect("/home");
}

export async function createChatRoom(productId: number) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 상품 정보 조회
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      userId: true, // 판매자 ID
    },
  });

  if (!product) {
    return { error: "상품을 찾을 수 없습니다." };
  }

  // 자신의 상품인지 확인 (이중 체크)
  if (product.userId === session.id) {
    return { error: "자신의 상품에는 채팅할 수 없습니다." };
  }

  // 기존 채팅방 확인
  const existingChatRoom = await db.chatRoom.findFirst({
    where: {
      productId,
      buyerId: session.id,
      sellerId: product.userId,
    },
    select: {
      id: true,
    },
  });

  if (existingChatRoom) {
    revalidatePath("/chat");
    redirect(`/chat/${existingChatRoom.id}`);
    return;
  }

  // 새 채팅방 생성
  const chatRoom = await db.chatRoom.create({
    data: {
      productId,
      buyerId: session.id,
      sellerId: product.userId,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/chat");
  redirect(`/chat/${chatRoom.id}`);
}

export async function markAsSold(productId: number, buyerId: number) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!product) {
    return { error: "상품을 찾을 수 없습니다." };
  }

  if (product.userId !== session.id) {
    return { error: "판매자만 판매 완료 처리할 수 있습니다." };
  }

  if (product.status === "판매완료") {
    return { error: "이미 판매 완료된 상품입니다." };
  }

  // 구매자가 실제로 이 상품과 채팅방이 있는지 확인
  const chatRoom = await db.chatRoom.findFirst({
    where: {
      productId,
      buyerId,
      sellerId: session.id,
    },
    select: {
      id: true,
    },
  });

  if (!chatRoom) {
    return { error: "해당 구매자와의 채팅방을 찾을 수 없습니다." };
  }

  await db.product.update({
    where: { id: productId },
    data: {
      status: "판매완료",
      soldTo: buyerId,
      soldAt: new Date(),
    },
  });

  revalidateTag("product-detail");
  revalidateTag("product-title");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/profile");

  // 리뷰 작성 페이지로 리다이렉트
  redirect(`/reviews/create/${productId}`);
}
