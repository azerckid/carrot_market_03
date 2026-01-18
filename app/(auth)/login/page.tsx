"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import SocialLogin from "@/components/social-login";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { useActionState } from "react";
import { logIn } from "./actions";
import Link from "next/link";

export default function LogIn() {
  const [state, dispatch] = useActionState(logIn, null);
  return (
    <div className="flex flex-col gap-10 py-8 px-6">
      <div className="flex flex-col gap-2 *:font-medium">
        <h1 className="text-2xl">안녕하세요!</h1>
        <h2 className="text-xl">Log in with email and password.</h2>
      </div>
      <form action={dispatch} className="flex flex-col gap-3">
        <Input
          name="email"
          type="email"
          placeholder="Email"
          required
          errors={state?.fieldErrors.email}
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          errors={state?.fieldErrors.password}
        />
        <Button text="Log in" />
      </form>
      <SocialLogin />

      {/* 회원가입 링크 복구 */}
      <div className="flex justify-center gap-2">
        <span>이미 계정이 있으신가요?</span>
        <Link href="/create-account" className="hover:underline hover:text-orange-500 transition-colors">
          계정 만들기
        </Link>
      </div>
    </div>
  );
}

