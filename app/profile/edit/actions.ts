"use server";

import db from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import getSession from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import cloudinary from "@/lib/cloudinary";

function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function updateProfile(formData: FormData) {
  const session = await getSession();

  if (!session.id) {
    return { error: "로그인이 필요합니다." };
  }

  const username = formData.get("username");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const avatarFile = formData.get("avatar");

  // 사용자명 유효성 검사
  if (!username || typeof username !== "string") {
    return { error: "사용자명을 입력해주세요." };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length === 0) {
    return { error: "사용자명을 입력해주세요." };
  }

  if (trimmedUsername.length > 20) {
    return { error: "사용자명은 20자 이하로 입력해주세요." };
  }

  // 중복 확인
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, trimmedUsername));

  if (existingUser && existingUser.id !== session.id) {
    return { error: "이미 사용 중인 사용자명입니다." };
  }

  // 이메일 유효성 검사 (선택사항)
  let trimmedEmail: string | null = null;
  if (email && typeof email === "string" && email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { error: "올바른 이메일 형식이 아닙니다." };
    }
    trimmedEmail = email.trim();

    // 이메일 중복 확인
    const [existingEmailUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, trimmedEmail));

    if (existingEmailUser && existingEmailUser.id !== session.id) {
      return { error: "이미 사용 중인 이메일입니다." };
    }
  }

  // 전화번호 유효성 검사 (선택사항)
  let trimmedPhone: string | null = null;
  if (phone && typeof phone === "string" && phone.trim().length > 0) {
    trimmedPhone = phone.trim();
  }

  // 기존 사용자 정보 조회 (아바타 URL 유지용)
  const [existingUserData] = await db
    .select({ avatar: users.avatar })
    .from(users)
    .where(eq(users.id, session.id));

  let avatarUrl = existingUserData?.avatar || null;

  // 아바타 이미지 업로드 처리
  if (avatarFile instanceof File && avatarFile.size > 0) {
    // 기존 아바타 이미지 삭제 (Cloudinary에 있는 경우)
    if (existingUserData?.avatar) {
      const publicId = extractPublicIdFromUrl(existingUserData.avatar);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error("Cloudinary 이미지 삭제 실패:", error);
          // 삭제 실패해도 새 이미지 업로드는 진행
        }
      }
    }

    // 새 이미지 업로드
    try {
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const dataURI = `data:${avatarFile.type};base64,${base64}`;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "carrot-market/avatars",
      });
      avatarUrl = uploadResult.secure_url;
    } catch (error) {
      console.error("Cloudinary 이미지 업로드 실패:", error);
      return { error: "이미지 업로드에 실패했습니다." };
    }
  }

  // 프로필 업데이트
  await db.update(users)
    .set({
      username: trimmedUsername,
      email: trimmedEmail,
      phone: trimmedPhone,
      avatar: avatarUrl,
    })
    .where(eq(users.id, session.id));

  // 캐시 무효화
  revalidatePath("/profile");

  // 프로필 페이지로 리다이렉트
  redirect("/profile");
}

