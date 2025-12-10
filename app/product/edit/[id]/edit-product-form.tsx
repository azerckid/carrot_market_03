"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Input from "@/components/input";
import Button from "@/components/button";
import BackButton from "@/components/back-button";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditProductType, editProductSchema } from "./schema";
import { updateProduct } from "./actions";

interface EditProductFormProps {
    product: {
        id: number;
        title: string;
        price: number;
        description: string;
        photo: string;
    };
}

export default function EditProductForm({ product }: EditProductFormProps) {
    const [preview, setPreview] = useState(product.photo); // 기존 이미지로 초기화

    const {
        register,
        handleSubmit,
        watch,
        setError,
        setValue,
        formState: { errors },
    } = useForm<EditProductType>({
        resolver: zodResolver(editProductSchema),
        defaultValues: {
            title: product.title,
            price: product.price,
            description: product.description,
        },
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
            // 파일이 없으면 기존 이미지로 복원
            setPreview(product.photo);
        }
    };

    const onImageRemove = () => {
        // 기존 이미지로 복원
        setPreview(product.photo);
        // input 파일 선택 초기화
        const fileInput = document.getElementById("photo") as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
        // React Hook Form에서도 제거
        setValue("photo", undefined);
    };

    const onValid = async (data: EditProductType) => {
        const formData = new FormData();
        
        // 이미지가 선택되었는지 확인
        if (data.photo && data.photo.length > 0) {
            formData.set("photo", data.photo[0]);
        }
        // 이미지가 없으면 FormData에 포함하지 않음 (서버에서 기존 이미지 유지)
        
        formData.set("title", data.title);
        formData.set("price", data.price.toString());
        formData.set("description", data.description);

        const errors = await updateProduct(product.id, formData);
        if (errors && "fieldErrors" in errors) {
            // 서버 에러를 폼에 연결
            const fieldErrors = errors.fieldErrors as {
                photo?: string[];
                title?: string[];
                price?: string[];
                description?: string[];
                root?: string[];
            };
            
            if (fieldErrors.root) {
                // root 에러는 일반적으로 표시 (예: 권한 없음)
                setError("root", {
                    type: "server",
                    message: fieldErrors.root[0],
                });
            }
            
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
                <BackButton href={`/products/${product.id}`} />
            </div>
            <form onSubmit={handleSubmit(onValid)} className="p-5 flex flex-col gap-5">
                {typeof errors.root?.message === "string" && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                        {errors.root.message}
                    </div>
                )}
                <div className="relative">
                    <label
                        htmlFor="photo"
                        className="border-2 aspect-square flex items-center justify-center flex-col text-neutral-300 border-neutral-300 rounded-md border-dashed cursor-pointer bg-center bg-cover"
                        style={{
                            backgroundImage: `url(${preview})`,
                        }}
                    >
                        {preview === product.photo || preview === "" ? (
                            <>
                                <PhotoIcon className="w-20" />
                                <div className="text-neutral-400 text-sm">
                                    {preview === product.photo ? "사진을 변경하려면 클릭하세요." : "사진을 추가해주세요."}
                                    {typeof errors.photo?.message === "string" ? errors.photo.message : ""}
                                </div>
                            </>
                        ) : null}
                    </label>
                    {preview !== product.photo && preview !== "" && (
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
                <Button text="수정 완료" />
            </form>
        </div>
    );
}

