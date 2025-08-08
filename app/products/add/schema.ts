import { z } from "zod";

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
    title: z.string({
        required_error: "Title is required",
    }),
    description: z.string({
        required_error: "Description is required",
    }),
    price: z.coerce.number({
        required_error: "Price is required",
    }),
});

export type ProductType = z.infer<typeof productSchema>;

