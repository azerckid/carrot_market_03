import db from "@/lib/db";
import { formatToTimeAgo } from "@/lib/utils";
import {
  ChatBubbleBottomCenterIcon,
  HandThumbUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

async function getPosts() {
  const posts = await db.post.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      views: true,
      created_at: true,
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
  });
  return posts;
}

export const metadata = {
  title: "동네생활",
};

export default async function Life() {
  const posts = await getPosts();
  return (
    <div className="p-5 flex flex-col">
      <div className="flex justify-end mb-5">
        <Link
          href="/posts/add"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full transition-colors"
        >
          <PlusIcon className="size-5" />
          <span>글쓰기</span>
        </Link>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <p className="text-lg">아직 게시글이 없습니다.</p>
          <p className="text-sm mt-2">첫 번째 게시글을 작성해보세요!</p>
        </div>
      ) : (
        posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${post.id}`}
            className="pb-5 mb-5 border-b border-neutral-500 text-neutral-400 flex flex-col gap-2 last:pb-0 last:border-b-0 cursor-pointer hover:bg-neutral-800/50 rounded-lg p-3 -mx-3 transition-colors"
          >
            <h2 className="text-white text-lg font-semibold">{post.title}</h2>
            <p>{post.description}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4 items-center">
                <span>{formatToTimeAgo(post.created_at.toString())}</span>
                <span>·</span>
                <span>조회 {post.views}</span>
              </div>
              <div className="flex gap-4 items-center *:flex *:gap-1 *:items-center">
                <span>
                  <HandThumbUpIcon className="size-4" />
                  {post._count.likes}
                </span>
                <span>
                  <ChatBubbleBottomCenterIcon className="size-4" />
                  {post._count.comments}
                </span>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
