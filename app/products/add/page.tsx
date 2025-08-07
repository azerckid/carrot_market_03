"use client";

import Button from "@/components/button";
import Input from "@/components/input";
import BackButton from "@/components/back-button";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useFormState } from "react-dom";
import { uploadProduct } from "./actions";

export default function AddProduct() {
    const [preview, setPreview] = useState("");
    const [clientError, setClientError] = useState("");
    const [state, action] = useFormState(uploadProduct, null);
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

    const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {
            target: { files },
        } = event;
        if (!files) {
            return;
        }
        const file = files[0];

        // 이미지 파일 타입 검증
        if (!file.type.startsWith("image/")) {
            setClientError("이미지 파일만 업로드 가능합니다.");
            event.target.value = "";
            return;
        }

        // 파일 크기 검증 (1MB)
        if (file.size > MAX_FILE_SIZE) {
            setClientError("파일 크기는 최대 1MB까지 가능합니다.");
            event.target.value = "";
            return;
        }

        setClientError("");
        const url = URL.createObjectURL(file);
        setPreview(url);
    };
    const onImageRemove = () => {
        setPreview("");
        setClientError("");
        // input 파일 선택 초기화
        const fileInput = document.getElementById("photo") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };

    return (
        <div>
            <div className="relative">
                <BackButton href="/products" />
            </div>
            <form action={action} className="p-5 flex flex-col gap-5">
                <div className="relative">
                    <label
                        htmlFor="photo"
                        className="border-2 aspect-square flex items-center justify-center flex-col text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer bg-center bg-cover"
                        style={{
                            backgroundImage: `url(${preview})`,
                        }}
                    >
                        {preview === "" ? (
                            <>
                                <PhotoIcon className="w-20" />
                                <div className="text-neutral-400 text-sm">
                                    사진을 추가해주세요.
                                    {state?.fieldErrors.photo}
                                </div>
                            </>
                        ) : null}
                    </label>
                    {preview !== "" && (
                        <button
                            type="button"
                            onClick={onImageRemove}
                            className="absolute right-2 top-2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
                        >
                            <XMarkIcon className="size-5 text-white" />
                        </button>
                    )}
                </div>
                {clientError && (
                    <div className="text-red-500 text-sm text-center">
                        {clientError}
                    </div>
                )}
                {state?.formErrors && state.formErrors.length > 0 && (
                    <div className="text-red-500 text-sm text-center">
                        {state.formErrors[0]}
                    </div>
                )}
                <input
                    onChange={onImageChange}
                    type="file"
                    id="photo"
                    name="photo"
                    accept="image/*"
                    className="hidden"
                />
                <Input
                    name="title"
                    required
                    placeholder="제목"
                    type="text"
                    errors={state?.fieldErrors.title}
                />
                <Input
                    name="price"
                    type="number"
                    required
                    placeholder="가격"
                    errors={state?.fieldErrors.price}
                />
                <Input
                    name="description"
                    type="text"
                    required
                    placeholder="자세한 설명"
                    errors={state?.fieldErrors.description}
                />
                <Button text="작성 완료" />
            </form>
        </div>
    );
}

