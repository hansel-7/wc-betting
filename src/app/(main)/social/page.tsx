import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PostFeed from "./PostFeed";

export default async function SocialPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, content, created_at, user_id, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (posts ?? []).map((p) => p.id);

  const { data: comments } = postIds.length > 0
    ? await supabase
        .from("comments")
        .select("id, content, created_at, user_id, post_id, profiles(full_name)")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const postsWithComments = (posts ?? []).map((p) => ({
    ...p,
    comments: (comments ?? []).filter((c) => c.post_id === p.id),
  }));

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-4">Social</h1>
      {postsError && (
        <p className="text-red-400 text-xs mb-2">Error loading posts: {postsError.message}</p>
      )}
      <PostFeed initialPosts={postsWithComments} currentUserId={user.id} />
    </div>
  );
}
