import db from "@/lib/db";
import { logInUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return new Response(null, {
      status: 400,
    });
  }
  const accessTokenParams = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
  }).toString();
  const accessTokenURL = `https://github.com/login/oauth/access_token?${accessTokenParams}`;
  const accessTokenResponse = await fetch(accessTokenURL, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!accessTokenResponse.ok) {
    return new Response(null, {
      status: 400,
    });
  }
  const { error, access_token } = await accessTokenResponse.json();
  if (error || !access_token) {
    return new Response(null, {
      status: 400,
    });
  }
  const userProfileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  });
  if (!userProfileResponse.ok) {
    return new Response(null, {
      status: 400,
    });
  }
  const { id, avatar_url, login } = await userProfileResponse.json();
  if (!id || !login) {
    return new Response(null, {
      status: 400,
    });
  }
  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  });
  if (!emailResponse.ok) {
    return new Response(null, {
      status: 400,
    });
  }
  const emails = await emailResponse.json();
  if (!Array.isArray(emails) || emails.length === 0) {
    return new Response(null, {
      status: 400,
    });
  }
  const emailData = emails.find((email: any) => email.primary === true && email.verified === true) || emails[0];
  const email = emailData?.email;
  const user = await db.user.findUnique({
    where: {
      github_id: id + "",
    },
    select: {
      id: true,
    },
  });
  if (user) {
    await logInUser(user.id);
    return;
  }
  let username = login;
  const existingUser = await db.user.findUnique({
    where: {
      username: login,
    },
    select: {
      id: true,
    },
  });
  if (existingUser) {
    username = `${login}-github`;
  }
  const newUser = await db.user.create({
    data: {
      username: username,
      github_id: id + "",
      avatar: avatar_url,
      email: email,
    },
    select: {
      id: true,
    },
  });
  await logInUser(newUser.id);
  return;
}

