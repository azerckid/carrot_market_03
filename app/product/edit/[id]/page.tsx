import { notFound } from "next/navigation";
import db from "@/lib/db";
import { products } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import getSession from "@/lib/session";
import { unstable_cache as nextCache } from "next/cache";
import EditProductForm from "./edit-product-form";

async function getProduct(id: number) {
    const [product] = await db
        .select({
            id: products.id,
            title: products.title,
            price: products.price,
            description: products.description,
            photo: products.photo,
            userId: products.userId,
        })
        .from(products)
        .where(eq(products.id, id));

    return product;
}

const getCachedProduct = nextCache(getProduct, ["product-edit"], {
    tags: ["product-detail"],
});

async function getIsOwner(userId: number) {
    const session = await getSession();
    if (session.id) {
        return session.id === userId;
    }
    return false;
}

export default async function EditProduct({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const productId = Number(id);

    if (isNaN(productId)) {
        return notFound();
    }

    const product = await getCachedProduct(productId);

    if (!product) {
        return notFound();
    }

    const isOwner = await getIsOwner(product.userId);

    if (!isOwner) {
        return notFound();
    }

    return <EditProductForm product={product} />;
}

