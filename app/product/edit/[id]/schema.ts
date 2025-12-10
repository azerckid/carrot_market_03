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

// 수정용 스키마 (이미지 선택적)
// FileList가 존재하는 경우에만 instanceof 체크 (서버 사이드에서 평가 방지)
export const editProductSchema = z.object({
    photo: (typeof FileList !== "undefined"
        ? z.instanceof(FileList)
        : z.any()
    )
        .optional()
        .refine(
            (files) => !files || files.length === 0 || files[0]?.type.startsWith("image/"),
            "이미지 파일만 업로드 가능합니다."
        )
        .refine(
            (files) => !files || files.length === 0 || files[0]?.size <= 1 * 1024 * 1024,
            "파일 크기는 최대 1MB까지 가능합니다."
        ),
    ...commonFields,
});

export type EditProductType = z.infer<typeof editProductSchema>;

