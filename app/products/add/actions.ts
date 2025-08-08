"use server";

import db from "@/lib/db";
import getSession from "@/lib/session";
import { redirect } from "next/navigation";
import cloudinary from "@/lib/cloudinary";
import { z } from "zod";

// 서버 액션용 스키마 (파일은 이미 업로드되어 URL로 변환됨)
const serverProductSchema = z.object({
  photo: z.string({
    required_error: "Photo is required",
  }),
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

  const data = {
    photo: uploadResult.secure_url,
    title: formData.get("title"),
    price: formData.get("price"),
    description: formData.get("description"),
  };

  const result = serverProductSchema.safeParse(data);
  if (!result.success) {
    return result.error.flatten();
  } else {
    const session = await getSession();
    if (session.id) {
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
      redirect(`/products/${product.id}`);
      //redirect("/products")
    }
  }
}

