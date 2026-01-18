"use server";

import db, { schema } from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const { posts } = schema;

export async function createPost(formData: FormData) {
  const session = await getSession();
  
  // 세션 확인
  if (!session.id) {
    return {
      fieldErrors: {
        root: ["로그인이 필요합니다."],
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
  
  // 게시글 생성
  const [post] = await db.insert(posts).values({
    title: title.trim(),
    description: description && typeof description === "string" ? description.trim() : null,
    userId: session.id,
  }).returning({ id: posts.id });
  
  if (!post) {
    return {
      fieldErrors: {
        root: ["게시글 생성에 실패했습니다."],
      },
    };
  }
  
  // 캐시 무효화
  revalidatePath("/life");
  revalidatePath(`/posts/${post.id}`);
  
  // 게시글 상세 페이지로 리다이렉트
  redirect(`/posts/${post.id}`);
}

