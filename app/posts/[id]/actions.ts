"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { revalidateTag, revalidatePath } from "next/cache";

export async function likePost(postId: number) {
  await new Promise((r) => setTimeout(r, 10000));
  const session = await getSession();
  try {
    await db.like.create({
      data: {
        postId,
        userId: session.id!,
      },
    });
    revalidateTag(`like-status-${postId}`, "max");
  } catch (e) { }
}

export async function dislikePost(postId: number) {
  await new Promise((r) => setTimeout(r, 10000));
  try {
    const session = await getSession();
    await db.like.delete({
      where: {
        userId_postId: {
          userId: session.id!,
          postId,
        },
      },
    });
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
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return { error: "게시글을 찾을 수 없습니다." };
    }

    // 댓글 생성
    await db.comment.create({
      data: {
        payload: payload.trim(),
        postId,
        userId: session.id,
      },
    });

    // 캐시 무효화
    revalidatePath(`/posts/${postId}`);

    return { success: true };
  } catch (e) {
    console.error("댓글 작성 오류:", e);
    return { error: "댓글 작성에 실패했습니다." };
  }
}

