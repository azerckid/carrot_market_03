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

    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors },
    } = useForm<ProductType>({
        resolver: zodResolver(productSchema),
    });

    // React Hook Form으로 파일 입력 등록
    const { onChange: onPhotoChange, ...photoRegister } = register("photo");

    // 파일 입력 값 감시 (미리보기용)
    const photoFileList = watch("photo");

    // 파일이 변경될 때마다 미리보기 업데이트
    const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // React Hook Form의 onChange 먼저 호출 (검증 실행)
        onPhotoChange(event);

        // 미리보기 처리
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview("");
        }
    };
    const onImageRemove = () => {
        setPreview("");
        // input 파일 선택 초기화
        const fileInput = document.getElementById("photo") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
        // React Hook Form에서도 제거 (setValue로 빈 FileList 설정)
        // 주의: FileList는 직접 생성할 수 없으므로, input을 리셋하는 것으로 충분
    };

    const onValid = async (data: ProductType) => {
        // React Hook Form이 검증을 통과했으므로 파일이 존재함
        const file = data.photo[0];

        // FormData 생성 및 서버 액션 호출
        // 서버 액션에서 Cloudinary 업로드 처리
        const formData = new FormData();
        formData.set("photo", file);
        formData.set("title", data.title);
        formData.set("price", data.price.toString());
        formData.set("description", data.description);

        const errors = await uploadProduct(formData);
        if (errors && "fieldErrors" in errors) {
            // 서버 에러를 폼에 연결
            const fieldErrors = errors.fieldErrors as {
                photo?: string[];
                title?: string[];
                price?: string[];
                description?: string[];
            };
            if (fieldErrors.photo) {
                setError("photo", {
                    type: "server",
                    message: fieldErrors.photo[0],
                });
            }
            if (fieldErrors.title) {
                setError("title", {
                    type: "server",
                    message: fieldErrors.title[0],
                });
            }
            if (fieldErrors.price) {
                setError("price", {
                    type: "server",
                    message: fieldErrors.price[0],
                });
            }
            if (fieldErrors.description) {
                setError("description", {
                    type: "server",
                    message: fieldErrors.description[0],
                });
            }
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

