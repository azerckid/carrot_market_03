import db from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import getSession from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import BackButton from "@/components/back-button";
import EditProfileForm from "@/components/edit-profile-form";

async function getUser() {
  const session = await getSession();
  if (session.id) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.id, session.id));

    if (user) {
      return user;
    }
  }
  return null;
}

export default async function EditProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="pb-32">
      <BackButton href="/profile" />

      <div className="p-5">
        <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>
        <EditProfileForm
          initialUsername={user.username}
          initialEmail={user.email}
          initialPhone={user.phone}
          initialAvatar={user.avatar}
        />
      </div>
    </div>
  );
}

