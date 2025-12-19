import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionContent {
  id?: number;
  lastChatListVisit?: number; // 마지막 채팅방 목록 방문 시간 (timestamp)
}

export default async function getSession() {
  return getIronSession<SessionContent>(await cookies(), {
    cookieName: "delicious-karrot",
    password: process.env.COOKIE_PASSWORD!,
  });
}

