import db from "@/lib/db";
import { posts, users, likes, comments } from "@/drizzle/schema";
import { eq, and, sql, count } from "drizzle-orm";
import getSession from "@/lib/session";
import { formatToTimeAgo } from "@/lib/utils";
import { EyeIcon, UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import LikeButton from "@/components/like-button";
import CommentSection from "@/components/comment-section";
import DeletePostButton from "@/components/delete-post-button";
import BackButton from "@/components/back-button";

async function getPost(id: number) {
  try {
    // 1. Increment views
    await db.update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));

    // 2. Fetch Post with Relations
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        user: {
          columns: {
            id: true,
            username: true,
            avatar: true,
          }
        },
        comments: {
          with: {
            user: {
              columns: { username: true, avatar: true }
            }
          },
          orderBy: (c, { desc }) => [desc(c.created_at)]
        }
      }
    });

    if (!post) return null;

    // 3. Get Counts
    const [likeCountResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.postId, id));

    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.postId, id));

    return {
      ...post,
      _count: {
        likes: likeCountResult.count,
        comments: commentCountResult.count
      }
    };
  } catch (e) {
    return null;
  }
}

async function getIsLiked(postId: number) {
  const session = await getSession();
  if (!session.id) return false;

  const like = await db.query.likes.findFirst({
    where: and(
      eq(likes.userId, session.id),
      eq(likes.postId, postId)
    )
  });
  return Boolean(like);
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session.id) {
    return null;
  }
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.id),
    columns: {
      id: true,
      username: true,
      avatar: true,
    },
  });
  return user || null;
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
      <div className="relative pt-16">
        <BackButton href="/life" />
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
              <span>{formatToTimeAgo(post.created_at)}</span>
            </div>
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
