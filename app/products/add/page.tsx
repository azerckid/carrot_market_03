"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/components/input";
import Button from "@/components/button";
import BackButton from "@/components/back-button";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductType, productSchema } from "./schema";
import { uploadProduct } from "./actions";

export default function AddProduct() {
    const [preview, setPreview] = useState("");
    const [clientError, setClientError] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProductType>({
        resolver: zodResolver(productSchema),
    });

    const { onChange: onPhotoChange, ...photoRegister } = register("photo", {
        required: "사진을 선택해주세요.",
    });

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
        setFile(file);
        setValue("photo", file.name, { shouldValidate: true, shouldDirty: true });
        const url = URL.createObjectURL(file);
        setPreview(url);
        // React Hook Form의 onChange 호출
        onPhotoChange(event);
    };
    const onImageRemove = () => {
        setPreview("");
        setClientError("");
        setFile(null);
        setValue("photo", "");
        // input 파일 선택 초기화
        const fileInput = document.getElementById("photo") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
    };
    const onValid = async (data: ProductType) => {
        if (!file) {
            setClientError("이미지를 선택해주세요.");
            return;
        }

        // FormData 생성 및 서버 액션 호출
        // 서버 액션에서 Cloudinary 업로드 처리
        const formData = new FormData();
        formData.set("photo", file);
        formData.set("title", data.title);
        formData.set("price", data.price.toString());
        formData.set("description", data.description);

        const errors = await uploadProduct(formData);
        if (errors) {
            // setError("")  // 향후 서버 에러를 폼에 연결할 수 있도록 준비
        }
    };

    return (
        <div>
            <div className="relative">
                <BackButton href="/products" />
            </div>
            <form onSubmit={handleSubmit(onValid)} className="p-5 flex flex-col gap-5">
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
                                    {errors.photo?.message}
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
                <input
                    {...photoRegister}
                    onChange={onImageChange}
                    type="file"
                    id="photo"
                    accept="image/*"
                    className="hidden"
                />
                <Input
                    {...register("title")}
                    placeholder="제목"
                    type="text"
                    errors={[errors.title?.message ?? ""]}
                />
                <Input
                    {...register("price")}
                    type="number"
                    placeholder="가격"
                    errors={[errors.price?.message ?? ""]}
                />
                <Input
                    {...register("description")}
                    type="text"
                    placeholder="자세한 설명"
                    errors={[errors.description?.message ?? ""]}
                />
                <Button text="작성 완료" />
            </form>
        </div>
    );
}

