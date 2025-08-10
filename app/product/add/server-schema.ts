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

// 서버용 스키마 (파일은 이미 업로드되어 URL로 변환됨)
export const serverProductSchema = z.object({
    photo: z.string({
        required_error: "Photo is required",
    }),
    ...commonFields,
});

export type ServerProductType = z.infer<typeof serverProductSchema>;

