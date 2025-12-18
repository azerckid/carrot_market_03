import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { EyeIcon, UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import DeletePostButton from "@/components/delete-post-button";

async function getPost(id: number) {
  try {
    const post = await db.post.update({
      where: {
        id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
    return post;
  } catch (e) {
    return null;
  }
}

async function getIsLiked(postId: number) {
  const session = await getSession();
  const like = await db.like.findUnique({
    where: {
      userId_postId: {
        userId: session.id!,
        postId,
      },
    },
  });
  return Boolean(like);
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session.id) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      avatar: true,
    },
  });
  return user;
}

export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (isNaN(postId)) {
    return notFound();
  }
  const post = await getPost(postId);
  if (!post) {
    return notFound();
  }

  const isLiked = await getIsLiked(postId);
  const likeCount = post._count.likes;
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === post.user.id;

  return (
    <div className="p-5 text-white">
      <div className="flex items-center gap-2 mb-2">
        {post.user.avatar ? (
          <Image
            width={28}
            height={28}
            className="size-7 rounded-full"
            src={post.user.avatar}
            alt={post.user.username}
          />
        ) : (
          <div className="size-7 rounded-full bg-neutral-700 flex items-center justify-center">
            <UserIcon className="size-5 text-neutral-400" />
          </div>
        )}
        <div>
          <span className="text-sm font-semibold">{post.user.username}</span>
          <div className="text-xs">
            <span>{formatToTimeAgo(post.created_at.toString())}</span>
          </div>
        </div>
      </div>

      {/* 소유자만 수정/삭제 버튼 표시 */}
      {isOwner && (
        <div className="flex gap-2 mb-4">
          <Link
            href={`/posts/edit/${postId}`}
            className="bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-md text-white font-semibold transition-colors"
          >
            수정
          </Link>
          <DeletePostButton postId={postId} commentCount={post._count.comments} />
        </div>
      )}

      <h2 className="text-lg font-semibold">{post.title}</h2>
      <p className="mb-5">{post.description}</p>
      <div className="flex flex-col gap-5 items-start">
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <EyeIcon className="size-5" />
          <span>조회 {post.views}</span>
        </div>
        <LikeButton isLiked={isLiked} likeCount={likeCount} postId={postId} />
      </div>

      {/* 댓글 섹션 */}
      <CommentSection
        postId={postId}
        initialComments={post.comments}
        currentUser={currentUser}
      />
    </div>
  );
}
