import db from "@/lib/db";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { EyeIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { notFound } from "next/navigation";
import LikeButton from "@/components/like-button";
import CommentForm from "@/components/comment-form";

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

  return (
    <div className="p-5 text-white">
      <div className="flex items-center gap-2 mb-2">
        <Image
          width={28}
          height={28}
          className="size-7 rounded-full"
          src={post.user.avatar!}
          alt={post.user.username}
        />
        <div>
          <span className="text-sm font-semibold">{post.user.username}</span>
          <div className="text-xs">
            <span>{formatToTimeAgo(post.created_at.toString())}</span>
          </div>
        </div>
      </div>
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
      <div className="mt-8 border-t border-neutral-700 pt-5">
        <h3 className="text-lg font-semibold mb-4">
          댓글 {post._count.comments}
        </h3>
        <CommentForm postId={postId} />
        {post.comments.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <p>아직 댓글이 없습니다.</p>
            <p className="text-sm mt-2">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Image
                  width={32}
                  height={32}
                  className="size-8 rounded-full"
                  src={comment.user.avatar!}
                  alt={comment.user.username}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {comment.user.username}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatToTimeAgo(comment.created_at.toString())}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300">{comment.payload}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
