"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-xs text-forest-400 hover:text-white px-3 py-1.5 rounded-lg border border-forest-700 hover:border-forest-600 transition-colors"
    >
      Sign Out
    </button>
  );
}
