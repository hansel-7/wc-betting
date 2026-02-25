"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Avatar from "@/components/Avatar";

interface ProfileJoin {
  full_name: string;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
  comments: Comment[];
}

function getProfile(profiles: ProfileJoin | ProfileJoin[] | null): { name: string; avatar: string | null } {
  if (!profiles) return { name: "Unknown", avatar: null };
  if (Array.isArray(profiles)) return { name: profiles[0]?.full_name ?? "Unknown", avatar: profiles[0]?.avatar_url ?? null };
  return { name: profiles.full_name, avatar: profiles.avatar_url ?? null };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostFeed({
  initialPosts,
  currentUserId,
}: {
  initialPosts: Post[];
  currentUserId: string;
}) {
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handlePost() {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ user_id: currentUserId, content: newPost.trim() });
    setPosting(false);
    if (error) {
      alert(`Post failed: ${error.message}`);
      return;
    }
    setNewPost("");
    router.refresh();
  }

  async function handleComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    setCommentingOn(postId);
    await supabase.from("comments").insert({ post_id: postId, user_id: currentUserId, content: text });
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
    setCommentingOn(null);
    router.refresh();
  }

  async function handleDeletePost(postId: string) {
    await supabase.from("posts").delete().eq("id", postId);
    router.refresh();
  }

  function toggleComments(postId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Compose */}
      <div className="bg-forest-800/60 rounded-xl p-4 border border-forest-700/20">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          maxLength={500}
          rows={3}
          className="w-full bg-forest-900 rounded-lg px-3 py-2.5 text-sm border border-forest-700 placeholder-forest-600 focus:outline-none focus:ring-1 focus:ring-red-600 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-forest-600">{newPost.length}/500</span>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || posting}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.97] text-white text-xs font-medium transition-all disabled:opacity-40"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {initialPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-forest-500 text-sm">No posts yet. Be the first!</p>
        </div>
      ) : (
        initialPosts.map((post) => (
          <div key={post.id} className="bg-forest-800/60 rounded-xl border border-forest-700/20 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={post.user_id === currentUserId ? "/profile" : `/user/${post.user_id}`}
                  className="flex items-center gap-2"
                >
                  <Avatar src={getProfile(post.profiles).avatar} name={getProfile(post.profiles).name} size="sm" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{getProfile(post.profiles).name}</p>
                    <p className="text-[10px] text-forest-500">{timeAgo(post.created_at)}</p>
                  </div>
                </Link>
                {post.user_id === currentUserId && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-[10px] text-forest-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-forest-200 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Comments toggle */}
            <div className="border-t border-forest-700/30">
              <button
                onClick={() => toggleComments(post.id)}
                className="w-full px-4 py-2.5 text-left text-xs text-forest-400 hover:text-forest-300 transition-colors"
              >
                {post.comments.length > 0
                  ? `${post.comments.length} comment${post.comments.length !== 1 ? "s" : ""}`
                  : "Comment"}
              </button>
            </div>

            {/* Comments section */}
            {expandedComments.has(post.id) && (
              <div className="border-t border-forest-700/30 bg-forest-900/30">
                {post.comments
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((comment) => (
                    <div key={comment.id} className="px-4 py-2.5 border-b border-forest-800/50 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={comment.user_id === currentUserId ? "/profile" : `/user/${comment.user_id}`}
                          className="flex items-center gap-1.5"
                        >
                          <Avatar src={getProfile(comment.profiles).avatar} name={getProfile(comment.profiles).name} size="xs" />
                          <span className="text-xs font-medium text-forest-300 hover:text-white transition-colors">{getProfile(comment.profiles).name}</span>
                        </Link>
                        <span className="text-[10px] text-forest-600">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs text-forest-300 pl-7">{comment.content}</p>
                    </div>
                  ))}

                {/* Add comment */}
                <div className="px-4 py-3 flex gap-2">
                  <input
                    value={commentTexts[post.id] ?? ""}
                    onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(post.id);
                      }
                    }}
                    placeholder="Write a comment..."
                    maxLength={300}
                    className="flex-1 bg-forest-800 rounded-lg px-3 py-2 text-xs border border-forest-700 placeholder-forest-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim() || commentingOn === post.id}
                    className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 active:scale-[0.95] transition-all disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
