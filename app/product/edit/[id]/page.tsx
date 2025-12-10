import { notFound } from "next/navigation";
import db from "@/lib/db";
import getSession from "@/lib/session";
import { unstable_cache as nextCache } from "next/cache";
import EditProductForm from "./edit-product-form";

async function getProduct(id: number) {
    const product = await db.product.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            title: true,
            price: true,
            description: true,
            photo: true,
            userId: true,
        },
    });
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

