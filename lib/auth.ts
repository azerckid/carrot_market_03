import getSession from "@/lib/session";
import { redirect } from "next/navigation";

/**
 * 사용자를 로그인 처리하는 재사용 가능한 함수
 * @param userId - 로그인할 사용자의 ID
 * @param redirectPath - 로그인 후 리다이렉트할 경로 (기본값: "/profile")
 */
export async function logInUser(userId: number, redirectPath: string = "/profile") {
    const session = await getSession();
    session.id = userId;
    await session.save();
    redirect(redirectPath);
}

