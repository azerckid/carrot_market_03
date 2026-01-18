"use server";

import db from "@/lib/db";
import { products } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { serverProductSchema } from "../../add/server-schema";

/**
 * Cloudinary URL에서 public_id를 추출합니다.
 * URL 형식: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{ext}
 * 또는: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
 */
function extractPublicIdFromUrl(url: string): string | null {
    try {
        // Cloudinary URL 패턴 매칭
        // /upload/ 이후의 경로에서 folder와 public_id 추출
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (match) {
            // folder/public_id 형식으로 반환
            return match[1];
        }
        return null;
    } catch {
        return null;
    }
}

export async function updateProduct(productId: number, formData: FormData) {
    const session = await getSession();
    if (!session.id) {
        return {
            fieldErrors: {
                root: ["로그인이 필요합니다."],
            },
        };
    }

    // 제품 조회 및 소유자 확인
    const [existingProduct] = await db
        .select({
            id: products.id,
            userId: products.userId,
            photo: products.photo,
        })
        .from(products)
        .where(eq(products.id, productId));

    if (!existingProduct) {
        return {
            fieldErrors: {
                root: ["제품을 찾을 수 없습니다."],
            },
        };
    }

    // 소유자 확인
    if (existingProduct.userId !== session.id) {
        return {
            fieldErrors: {
                root: ["수정 권한이 없습니다."],
            },
        };
    }

    // 이미지 처리
    const photoFile = formData.get("photo");
    let photoUrl = existingProduct.photo; // 기본값: 기존 이미지 URL

    // 새 이미지가 선택되었는지 확인
    if (photoFile instanceof File && photoFile.size > 0) {
        // 기존 이미지 삭제
        const publicId = extractPublicIdFromUrl(existingProduct.photo);
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.error("Cloudinary 이미지 삭제 실패:", error);
                // Cloudinary 삭제 실패해도 새 이미지 업로드는 진행
            }
        }

        // 새 이미지 업로드
        try {
            const bytes = await photoFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const base64 = buffer.toString("base64");
            const dataURI = `data:${photoFile.type};base64,${base64}`;

            const uploadResult = await cloudinary.uploader.upload(dataURI, {
                folder: "carrot-market",
            });
            photoUrl = uploadResult.secure_url;
        } catch (error) {
            console.error("Cloudinary 이미지 업로드 실패:", error);
            return {
                fieldErrors: {
                    photo: ["이미지 업로드에 실패했습니다."],
                },
            };
        }
    }

    // 데이터 검증
    const productData = {
        photo: photoUrl,
        title: formData.get("title"),
        price: formData.get("price"),
        description: formData.get("description"),
    };

    const result = serverProductSchema.safeParse(productData);
    if (!result.success) {
        return result.error.flatten();
    }

    // 데이터베이스 업데이트
    await db.update(products)
        .set({
            title: result.data.title,
            description: result.data.description,
            price: result.data.price,
            photo: result.data.photo,
        })
        .where(eq(products.id, productId));

    // 캐시 무효화 (통합 캐싱 전략)
    revalidateTag("products", "max");
    revalidateTag("product-detail", "max");
    revalidateTag("product-title", "max");
    revalidatePath("/home");
    revalidatePath(`/products/${productId}`);

    redirect(`/products/${productId}`);
}

