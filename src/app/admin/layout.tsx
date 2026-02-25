import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="max-w-2xl mx-auto min-h-dvh">
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        <h1 className="text-lg font-bold text-amber-400">Admin Panel</h1>
        <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
          Back to App
        </Link>
      </div>
      {children}
    </div>
  );
}
