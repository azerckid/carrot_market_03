"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/profile/edit/actions";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface EditProfileFormProps {
  initialUsername: string;
  initialEmail: string | null;
  initialPhone: string | null;
  initialAvatar: string | null;
}

export default function EditProfileForm({
  initialUsername,
  initialEmail,
  initialPhone,
  initialAvatar,
}: EditProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialAvatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview(initialAvatar);
    const fileInput = document.getElementById("avatar") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("사용자명을 입력해주세요.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("username", username.trim());
      if (email.trim()) {
        formData.set("email", email.trim());
      }
      if (phone.trim()) {
        formData.set("phone", phone.trim());
      }
      if (avatarFile) {
        formData.set("avatar", avatarFile);
      }

      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 아바타 업로드 */}
      <div>
        <label className="block text-sm font-semibold mb-2">프로필 사진</label>
        <div className="flex items-center gap-4">
          <div className="relative size-24 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="프로필 사진"
                fill
                className="object-cover"
              />
            ) : (
              <UserIcon className="size-12 text-neutral-400" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="avatar"
              className="cursor-pointer bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors inline-block"
            >
              <PhotoIcon className="size-4 inline-block mr-1" />
              사진 선택
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isPending}
            />
            {avatarPreview && (
              <button
                type="button"
                onClick={handleAvatarRemove}
                className="text-red-500 hover:text-red-600 text-sm font-semibold transition-colors"
                disabled={isPending}
              >
                <XMarkIcon className="size-4 inline-block mr-1" />
                제거
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 사용자명 */}
      <div>
        <label htmlFor="username" className="block text-sm font-semibold mb-2">
          사용자명 <span className="text-red-500">*</span>
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          maxLength={20}
          className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isPending}
        />
        <p className="text-xs text-neutral-500 mt-1">
          {username.length}/20
        </p>
      </div>

      {/* 이메일 */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-2">
          이메일
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isPending}
        />
      </div>

      {/* 전화번호 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold mb-2">
          전화번호
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-neutral-800 text-white px-4 py-3 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isPending}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isPending || !username.trim()}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-neutral-600 disabled:cursor-not-allowed"
      >
        {isPending ? "수정 중..." : "프로필 수정하기"}
      </button>
    </form>
  );
}

