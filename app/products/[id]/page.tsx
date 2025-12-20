import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToWon } from "@/lib/utils";
import { UserIcon } from "@heroicons/react/24/solid";
import BackButton from "@/components/back-button";
import DeleteProductButton from "@/components/delete-product-button";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache as nextCache, revalidateTag } from "next/cache";
import { createChatRoom } from "./actions";
import MarkAsSoldButton from "@/components/mark-as-sold-button";

async function getIsOwner(userId: number) {
  const session = await getSession();
  if (session.id) {
    return session.id === userId;
  }
  return false;
}

async function getProduct(id: number) {
  const product = await db.product.findUnique({
    where: {
      id,
    },
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
          username: true,
          avatar: true,
        },
      },
    },
  });
  return product;
}

async function canWriteReview(productId: number, userId: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      status: true,
      userId: true,
      soldTo: true,
    },
  });

  if (!product || product.status !== "판매완료") {
    return false;
  }

  // 판매자 또는 구매자인지 확인
  const isSeller = product.userId === userId;
  const isBuyer = product.soldTo === userId;

  if (!isSeller && !isBuyer) {
    return false;
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

  return !existingReview;
}

async function getBuyersForProduct(productId: number, sellerId: number) {
  const chatRooms = await db.chatRoom.findMany({
    where: {
      productId,
      sellerId,
    },
    select: {
      id: true,
      buyer: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return chatRooms.map((chatRoom) => ({
    id: chatRoom.buyer.id,
    username: chatRoom.buyer.username,
    avatar: chatRoom.buyer.avatar,
    chatRoomId: chatRoom.id,
  }));
}

const getCachedProduct = nextCache(getProduct, ["product-detail"], {
  tags: ["product-detail"],
});

async function getProductTitle(id: number) {
  const product = await db.product.findUnique({
    where: {
      id,
    },
    select: {
      title: true,
    },
  });
  return product;
}

const getCachedProductTitle = nextCache(getProductTitle, ["product-title"], {
  tags: ["product-title"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCachedProductTitle(Number(id));
  return {
    title: product?.title,
  };
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) {
    return notFound();
  }
  const product = await getCachedProduct(productId);
  if (!product) {
    return notFound();
  }
  const session = await getSession();
  const isOwner = await getIsOwner(product.userId);
  const buyers =
    isOwner && product.status === "판매중"
      ? await getBuyersForProduct(productId, product.userId)
      : [];
  const canReview =
    session.id && product.status === "판매완료"
      ? await canWriteReview(productId, session.id)
      : false;
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "판매중":
        return (
          <span className="text-sm px-3 py-1.5 bg-orange-500/20 text-orange-500 rounded-full font-semibold backdrop-blur-sm">
            판매중
          </span>
        );
      case "판매완료":
        return (
          <span className="text-sm px-3 py-1.5 bg-neutral-500/20 text-neutral-300 rounded-full font-semibold backdrop-blur-sm">
            판매완료
          </span>
        );
      case "예약중":
        return (
          <span className="text-sm px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full font-semibold backdrop-blur-sm">
            예약중
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-0">
      <div className="relative aspect-square">
        <Image
          className="object-cover"
          fill
          src={product.photo}
          alt={product.title}
        />
        <BackButton href="/home" />
        {/* 판매 상태 배지 */}
        <div className="absolute top-4 left-4">
          {getStatusBadge(product.status)}
        </div>
      </div>
      <div className="p-5 flex items-center gap-3 border-b border-neutral-700">
        <div className="size-10 overflow-hidden rounded-full">
          {product.user.avatar !== null ? (
            <Image
              src={product.user.avatar}
              width={40}
              height={40}
              alt={product.user.username}
              className="rounded-full"
            />
          ) : (
            <UserIcon className="size-10" />
          )}
        </div>
        <div>
          <h3>{product.user.username}</h3>
        </div>
      </div>
      <div className="p-5 pb-32">
        <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
        <p className="whitespace-pre-wrap wrap-break-word mb-4">{product.description}</p>
      </div>
      <div className="fixed w-full bottom-0 p-5 pb-10 bg-neutral-800 flex justify-between items-center max-w-screen-sm">
        <span className="font-semibold text-xl">
          {formatToWon(product.price)}원
        </span>
        {isOwner ? (
          <div className="flex gap-2">
            {product.status === "판매중" && buyers.length > 0 ? (
              <MarkAsSoldButton productId={productId} buyers={buyers} />
            ) : null}
            {canReview ? (
              <Link
                href={`/reviews/create/${productId}`}
                className="bg-purple-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-purple-600 transition-colors"
              >
                리뷰 작성
              </Link>
            ) : null}
            <Link
              href={`/product/edit/${productId}`}
              className="bg-blue-500 px-5 py-2.5 rounded-md text-white font-semibold"
            >
              수정
            </Link>
            <DeleteProductButton productId={productId} />
          </div>
        ) : (
          <div className="flex gap-2">
            {canReview ? (
              <Link
                href={`/reviews/create/${productId}`}
                className="bg-purple-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-purple-600 transition-colors"
              >
                리뷰 작성
              </Link>
            ) : null}
            {product.status === "판매중" ? (
              <form action={createChatRoom.bind(null, productId)}>
                <button
                  type="submit"
                  className="bg-orange-500 px-5 py-2.5 rounded-md text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  채팅하기
                </button>
              </form>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

