import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PostFeed from "./PostFeed";

export default async function SocialPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, content, created_at, user_id, profiles(full_name), comments(id, content, created_at, user_id, profiles(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-4">Social</h1>
      <PostFeed initialPosts={posts ?? []} currentUserId={user.id} />
    </div>
  );
}
