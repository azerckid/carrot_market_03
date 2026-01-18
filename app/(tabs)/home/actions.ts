"use server";

import db from "@/lib/db";
import { products } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function getMoreProducts(page: number) {
  const productList = await db
    .select({
      title: products.title,
      price: products.price,
      created_at: products.created_at,
      photo: products.photo,
      id: products.id,
    })
    .from(products)
    .orderBy(desc(products.created_at))
    .limit(5)
    .offset(page * 5);

  return productList;
}

