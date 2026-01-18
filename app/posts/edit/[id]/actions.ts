"use server";

import db, { schema } from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

const { posts } = schema;

export async function updatePost(postId: number, formData: FormData) {
  const session = await getSession();
  
  // 세션 확인
  if (!session.id) {
    return {
      fieldErrors: {
        root: ["로그인이 필요합니다."],
      },
    };
  }
  
  // 게시글 조회 및 소유자 확인
  const [existingPost] = await db.select({
    id: posts.id,
    userId: posts.userId,
  })
  .from(posts)
  .where(eq(posts.id, postId))
  .limit(1);
  
  if (!existingPost) {
    return {
      fieldErrors: {
        root: ["게시글을 찾을 수 없습니다."],
      },
    };
  }
  
  // 소유자 확인
  if (existingPost.userId !== session.id) {
    return {
      fieldErrors: {
        root: ["수정 권한이 없습니다."],
      },
    };
  }
  
  const title = formData.get("title");
  const description = formData.get("description");
  
  // 입력 검증
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return {
      fieldErrors: {
        title: ["제목을 입력해주세요."],
      },
    };
  }
  
  if (title.trim().length > 100) {
    return {
      fieldErrors: {
        title: ["제목은 100자 이하로 입력해주세요."],
      },
    };
  }
  
  // 게시글 업데이트
  await db.update(posts)
    .set({
      title: title.trim(),
      description: description && typeof description === "string" ? description.trim() : null,
    })
    .where(eq(posts.id, postId));
  
  // 캐시 무효화
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/life");
  
  // 게시글 상세 페이지로 리다이렉트
  redirect(`/posts/${postId}`);
}

