import db from "@/lib/db";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { UserIcon } from "@heroicons/react/24/solid";
import BackButton from "@/components/back-button";
import ReviewForm from "@/components/review-form";
import { formatToWon } from "@/lib/utils";

async function getProduct(productId: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      price: true,
      photo: true,
      description: true,
      status: true,
      userId: true,
      soldTo: true,
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      soldToUser: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
  return product;
}

async function checkReviewPermission(
  productId: number,
  userId: number
): Promise<{ canReview: boolean; revieweeId: number | null; error?: string }> {
  const product = await getProduct(productId);

  if (!product) {
    return { canReview: false, revieweeId: null, error: "상품을 찾을 수 없습니다." };
  }

  if (product.status !== "판매완료") {
    return {
      canReview: false,
      revieweeId: null,
      error: "판매 완료된 상품에만 리뷰를 작성할 수 있습니다.",
    };
  }

  // 이미 리뷰를 작성했는지 확인
  const existingReview = await db.review.findUnique({
    where: {
      reviewerId_productId: {
        reviewerId: userId,
        productId,
      },
    },
  });

  if (existingReview) {
    return {
      canReview: false,
      revieweeId: null,
      error: "이미 리뷰를 작성하셨습니다.",
    };
  }

  // 권한 확인 및 리뷰 대상자 결정
  if (product.userId === userId) {
    // 판매자가 구매자에게 리뷰 작성
    if (!product.soldTo) {
      return {
        canReview: false,
        revieweeId: null,
        error: "구매자 정보를 찾을 수 없습니다.",
      };
    }
    return { canReview: true, revieweeId: product.soldTo };
  } else if (product.soldTo === userId) {
    // 구매자가 판매자에게 리뷰 작성
    return { canReview: true, revieweeId: product.userId };
  } else {
    return {
      canReview: false,
      revieweeId: null,
      error: "리뷰 작성 권한이 없습니다.",
    };
  }
}

export default async function CreateReviewPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const productIdNum = Number(productId);

  if (isNaN(productIdNum)) {
    return notFound();
  }

  const session = await getSession();
  if (!session.id) {
    redirect("/");
  }

  // 권한 확인
  const { canReview, revieweeId, error } = await checkReviewPermission(
    productIdNum,
    session.id
  );

  if (!canReview || !revieweeId) {
    return (
      <div className="p-5 text-white">
        <BackButton href={`/products/${productIdNum}`} />
        <div className="mt-8 text-center">
          <p className="text-red-500">{error || "리뷰를 작성할 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  const product = await getProduct(productIdNum);
  if (!product) {
    return notFound();
  }

  const reviewee = product.userId === session.id ? product.soldToUser : product.user;

  if (!reviewee) {
    return notFound();
  }

  return (
    <div className="pb-32">
      <BackButton href={`/products/${productIdNum}`} />
      
      <div className="p-5">
        {/* 상품 정보 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">상품 정보</h2>
          <div className="flex gap-4">
            <div className="relative size-24 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0">
              <Image
                fill
                src={product.photo}
                alt={product.title}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold mb-1">{product.title}</h3>
              <p className="text-lg font-bold text-orange-500">
                {formatToWon(product.price)}원
              </p>
            </div>
          </div>
        </div>

        {/* 리뷰 대상자 정보 */}
        <div className="mb-6 pb-6 border-b border-neutral-700">
          <h2 className="text-lg font-semibold mb-4">리뷰 대상자</h2>
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center">
              {reviewee.avatar ? (
                <Image
                  src={reviewee.avatar}
                  width={48}
                  height={48}
                  alt={reviewee.username}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="size-8 text-neutral-400" />
              )}
            </div>
            <div>
              <p className="font-semibold">{reviewee.username}</p>
              <p className="text-sm text-neutral-400">
                {product.userId === session.id ? "구매자" : "판매자"}
              </p>
            </div>
          </div>
        </div>

        {/* 리뷰 작성 폼 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">리뷰 작성</h2>
          <ReviewForm productId={productIdNum} revieweeId={reviewee.id} />
        </div>
      </div>
    </div>
  );
}

