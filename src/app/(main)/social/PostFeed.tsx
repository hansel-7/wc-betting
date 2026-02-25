"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  comments: Comment[];
}

function getName(profiles: { full_name: string } | { full_name: string }[] | null): string {
  if (!profiles) return "Unknown";
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "Unknown";
  return profiles.full_name;
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
          className="w-full bg-forest-900 rounded-lg px-3 py-2.5 text-sm border border-forest-700 placeholder-forest-600 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-forest-600">{newPost.length}/500</span>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || posting}
            className="px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 active:scale-[0.97] text-white text-xs font-medium transition-all disabled:opacity-40"
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
                  <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-xs font-bold text-forest-300">
                    {getName(post.profiles).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{getName(post.profiles)}</p>
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
                          className="text-xs font-medium text-forest-300 hover:text-white transition-colors"
                        >
                          {getName(comment.profiles)}
                        </Link>
                        <span className="text-[10px] text-forest-600">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs text-forest-300">{comment.content}</p>
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
                    className="flex-1 bg-forest-800 rounded-lg px-3 py-2 text-xs border border-forest-700 placeholder-forest-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim() || commentingOn === post.id}
                    className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 active:scale-[0.95] transition-all disabled:opacity-40"
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
