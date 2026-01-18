import ProductList from "@/components/product-list";
import db, { schema } from "@/lib/db";
import { PlusIcon } from "@heroicons/react/24/solid";
import { unstable_cache as nextCache } from "next/cache";
import Link from "next/link";
import { desc } from "drizzle-orm";

const { products } = schema;

async function getInitialProducts() {
  const productsList = await db.select({
    id: products.id,
    title: products.title,
    price: products.price,
    created_at: products.created_at,
    photo: products.photo,
  })
  .from(products)
  .orderBy(desc(products.created_at))
  .limit(5);
  return productsList;
}

const getCachedProducts = nextCache(getInitialProducts, ["home-products"], {
  tags: ["products"],
  revalidate: 60,
});

export type InitialProducts = Awaited<ReturnType<typeof getInitialProducts>>;

export const metadata = {
  title: "Home",
};

export default async function Home() {
  const initialProducts = await getCachedProducts();
  return (
    <div>
      {/* interceptor 사용예시 */}
      {/* <Link href="/home/recent">Recent products</Link> */}
      <ProductList initialProducts={initialProducts} />
      <Link
        href="/product/add"
        className="bg-orange-500 flex items-center justify-center rounded-full size-16 fixed bottom-24 right-8 text-white transition-colors hover:bg-orange-400"
      >
        <PlusIcon className="size-10" />
      </Link>
    </div>
  );
}

