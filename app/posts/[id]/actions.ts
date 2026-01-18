"use server";

import db from "@/lib/db";
import { likes, comments, posts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import getSession from "@/lib/session";
import { revalidateTag, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function likePost(postId: number) {
  // await new Promise((r) => setTimeout(r, 10000));
  const session = await getSession();
  try {
    await db.insert(likes).values({
      postId,
      userId: session.id!,
    });
    revalidateTag(`like-status-${postId}`, "max");
  } catch (e) { }
}

export async function dislikePost(postId: number) {
  // await new Promise((r) => setTimeout(r, 10000));
  try {
    const session = await getSession();
    await db.delete(likes).where(
      and(
        eq(likes.postId, postId),
        eq(likes.userId, session.id!)
      )
    );
    revalidateTag(`like-status-${postId}`, "max");
  } catch (e) { }
}

export async function createComment(postId: number, payload: string) {
  const session = await getSession();

  // 세션 확인
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 입력 검증
  if (!payload || !payload.trim()) {
    return { error: "댓글 내용을 입력해주세요." };
  }

  try {
    // 게시글 존재 확인
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      columns: { id: true },
    });

    if (!post) {
      return { error: "게시글을 찾을 수 없습니다." };
    }

    // 댓글 생성
    await db.insert(comments).values({
      payload: payload.trim(),
      postId,
      userId: session.id,
    });

    // 캐시 무효화
    revalidatePath(`/posts/${postId}`);

    return { success: true };
  } catch (e) {
    console.error("댓글 작성 오류:", e);
    return { error: "댓글 작성에 실패했습니다." };
  }
}

export async function deletePost(postId: number) {
  const session = await getSession();

  // 세션 확인
  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  // 게시글 조회 및 소유자 확인
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!post) {
    return { error: "게시글을 찾을 수 없습니다." };
  }

  // 소유자 확인
  if (post.userId !== session.id) {
    return { error: "삭제 권한이 없습니다." };
  }

  // 게시글 삭제 (CASCADE로 댓글도 자동 삭제됨)
  await db.delete(posts).where(eq(posts.id, postId));

  // 캐시 무효화
  revalidatePath("/life");

  // 리스트 페이지로 리다이렉트
  redirect("/life");
}

