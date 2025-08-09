import { z } from "zod";

// 공통 필드 정의
const commonFields = {
    title: z.string({
        required_error: "Title is required",
    }),
    description: z.string({
        required_error: "Description is required",
    }),
    price: z.coerce.number({
        required_error: "Price is required",
    }),
};

// 클라이언트용 스키마 (FileList) - 브라우저 전용
export const productSchema = z.object({
    photo: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "사진을 선택해주세요.")
        .refine(
            (files) => files[0]?.type.startsWith("image/"),
            "이미지 파일만 업로드 가능합니다."
        )
        .refine(
            (files) => files[0]?.size <= 1 * 1024 * 1024,
            "파일 크기는 최대 1MB까지 가능합니다."
        ),
    ...commonFields,
});

export type ProductType = z.infer<typeof productSchema>;

