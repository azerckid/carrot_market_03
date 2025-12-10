import ProductList from "@/components/product-list";
import db from "@/lib/db";
import { PlusIcon } from "@heroicons/react/24/solid";
import { unstable_cache as nextCache } from "next/cache";
import Link from "next/link";

async function getInitialProducts() {
  const products = await db.product.findMany({
    select: {
      title: true,
      price: true,
      created_at: true,
      photo: true,
      id: true,
    },
    take: 5,
    orderBy: {
      created_at: "desc",
    },
  });
  return products;
}

const getCachedProducts = nextCache(getInitialProducts, ["home-products"], {
  tags: ["products"],
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

