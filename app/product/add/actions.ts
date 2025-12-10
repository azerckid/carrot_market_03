"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import cloudinary from "@/lib/cloudinary";
import { serverProductSchema } from "./server-schema";

export async function uploadProduct(formData: FormData) {
  const photoFile = formData.get("photo");

  // 파일 검증
  if (!(photoFile instanceof File)) {
    return {
      fieldErrors: {
        photo: ["사진을 선택해주세요."],
      },
    };
  }

  // Cloudinary 업로드
  const bytes = await photoFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataURI = `data:${photoFile.type};base64,${base64}`;

  const uploadResult = await cloudinary.uploader.upload(dataURI, {
    folder: "carrot-market",
  });

  const productData = {
    photo: uploadResult.secure_url,
    title: formData.get("title"),
    price: formData.get("price"),
    description: formData.get("description"),
  };

  const result = serverProductSchema.safeParse(productData);
  if (!result.success) {
    return result.error.flatten();
  }

  const session = await getSession();
  if (!session.id) {
    return {
      fieldErrors: {
        root: ["로그인이 필요합니다."],
      },
    };
  }

  const product = await db.product.create({
    data: {
      title: result.data.title,
      description: result.data.description,
      price: result.data.price,
      photo: result.data.photo,
      user: {
        connect: {
          id: session.id,
        },
      },
    },
    select: {
      id: true,
    },
  });

  revalidateTag("products", "max");
  revalidateTag("product-detail", "max");
  revalidateTag("product-title", "max");
  revalidatePath("/home");
  revalidatePath(`/products/${product.id}`);
  redirect(`/products/${product.id}`);
}

