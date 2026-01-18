import { notFound } from "next/navigation";
import db, { schema } from "@/lib/db";
import getSession from "@/lib/session";
import BackButton from "@/components/back-button";
import EditPostForm from "./edit-post-form";
import { eq } from "drizzle-orm";

const { posts } = schema;

async function getPost(id: number) {
  const [post] = await db.select({
    id: posts.id,
    title: posts.title,
    description: posts.description,
    userId: posts.userId,
  })
  .from(posts)
  .where(eq(posts.id, id))
  .limit(1);
  
  return post || null;
}

async function getIsOwner(userId: number) {
  const session = await getSession();
  if (session.id) {
    return session.id === userId;
  }
  return false;
}

export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) {
    return notFound();
  }

  const post = await getPost(postId);

  if (!post) {
    return notFound();
  }

  const isOwner = await getIsOwner(post.userId);

  if (!isOwner) {
    return notFound();
  }

  return (
    <div>
      <div className="relative">
        <BackButton href={`/posts/${postId}`} />
      </div>
      <EditPostForm post={post} />
    </div>
  );
}

