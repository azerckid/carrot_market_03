"use client";

import { useState } from "react";
import Input from "@/components/input";
import Button from "@/components/button";
import BackButton from "@/components/back-button";
import { createPost } from "./actions";

export default function AddPost() {
  const [titleError, setTitleError] = useState("");
  const [rootError, setRootError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setTitleError("");
    setRootError("");

    const result = await createPost(formData);
    
    if (result && "fieldErrors" in result) {
      if (result.fieldErrors.title) {
        setTitleError(result.fieldErrors.title[0]);
      }
      if (result.fieldErrors.root) {
        setRootError(result.fieldErrors.root[0]);
      }
    }
  };

  return (
    <div>
      <div className="relative">
        <BackButton href="/life" />
      </div>
      <form action={handleSubmit} className="p-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-white mb-2">게시글 작성</h1>
          {rootError && (
            <span className="text-red-500 font-medium">{rootError}</span>
          )}
        </div>
        <Input
          name="title"
          placeholder="제목"
          type="text"
          required
          errors={titleError ? [titleError] : []}
        />
        <textarea
          name="description"
          placeholder="내용 (선택사항)"
          className="bg-transparent rounded-md w-full min-h-32 px-4 py-2 focus:outline-none ring-2 focus:ring-4 transition ring-neutral-200 focus:ring-orange-500 border-none placeholder:text-neutral-400 resize-none"
        />
        <Button text="작성 완료" />
      </form>
    </div>
  );
}

