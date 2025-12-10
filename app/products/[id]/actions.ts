"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";

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

export async function deleteProduct(productId: number) {
    const session = await getSession();
    if (!session.id) {
        return {
            error: "로그인이 필요합니다.",
        };
    }

    // 제품 조회 및 소유자 확인
    const product = await db.product.findUnique({
        where: {
            id: productId,
        },
        select: {
            id: true,
            userId: true,
            photo: true,
        },
    });

    if (!product) {
        return {
            error: "제품을 찾을 수 없습니다.",
        };
    }

    // 소유자 확인
    if (product.userId !== session.id) {
        return {
            error: "삭제 권한이 없습니다.",
        };
    }

    // Cloudinary에서 이미지 삭제
    const publicId = extractPublicIdFromUrl(product.photo);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Cloudinary 이미지 삭제 실패:", error);
            // Cloudinary 삭제 실패해도 DB 삭제는 진행
        }
    }

    // 데이터베이스에서 제품 삭제
    await db.product.delete({
        where: {
            id: productId,
        },
    });

    revalidateTag("products");
    revalidatePath("/home");
    redirect("/home");
}

