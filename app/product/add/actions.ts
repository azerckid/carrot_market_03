"use server";

import db from "@/lib/db";
import { products } from "@/drizzle/schema";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { serverProductSchema } from "./server-schema";

export async function uploadProduct(formData: FormData) {
  // 1. 세션 확인 (먼저 확인하여 불필요한 작업 방지)
  const session = await getSession();
  if (!session.id) {
    return {
      fieldErrors: {
        root: ["로그인이 필요합니다."],
      },
    };
  }

  // 2. 파일 검증
  const photoFile = formData.get("photo");
  if (!(photoFile instanceof File)) {
    return {
      fieldErrors: {
        photo: ["사진을 선택해주세요."],
      },
    };
  }

  // 3. Cloudinary 업로드 (세션 확인 후 진행)
  let uploadResult;
  try {
    const bytes = await photoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataURI = `data:${photoFile.type};base64,${base64}`;

    uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "carrot-market",
    });
  } catch (error) {
    console.error("Cloudinary 이미지 업로드 실패:", error);
    return {
      fieldErrors: {
        photo: ["이미지 업로드에 실패했습니다."],
      },
    };
  }

  // 4. 데이터 검증 (Cloudinary 업로드 성공 후)
  const productData = {
    photo: uploadResult.secure_url,
    title: formData.get("title"),
    price: formData.get("price"),
    description: formData.get("description"),
  };

  const result = serverProductSchema.safeParse(productData);
  if (!result.success) {
    // 검증 실패 시 업로드된 이미지 삭제 (리소스 정리)
    try {
      await cloudinary.uploader.destroy(uploadResult.public_id);
    } catch (error) {
      console.error("Cloudinary 이미지 삭제 실패:", error);
    }
    return result.error.flatten();
  }

  // Use Drizzle insert
  const [product] = await db.insert(products).values({
    title: result.data.title,
    description: result.data.description,
    price: result.data.price,
    photo: result.data.photo,
    userId: session.id,
    status: "판매중", // Default status if not set in schema default
  }).returning({ id: products.id });

  revalidateTag("products", "max");
  revalidateTag("product-detail", "max");
  revalidateTag("product-title", "max");
  revalidatePath("/home");
  if (product) {
    revalidatePath(`/products/${product.id}`);
    redirect(`/products/${product.id}`);
  } else {
    // Should not happen
    redirect("/home");
  }
}

