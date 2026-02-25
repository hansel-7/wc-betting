import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchList from "./MatchList";

export default async function BetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("status", ["upcoming", "live"])
    .order("match_time", { ascending: true });

  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "finished")
    .order("match_time", { ascending: false })
    .limit(20);

  const matchIds = [...(matches ?? []), ...(finishedMatches ?? [])].map((m) => m.id);

  const { data: allBets } = matchIds.length > 0
    ? await supabase
        .from("bets")
        .select("match_id, prediction, amount, status, points_earned, user_id")
        .in("match_id", matchIds)
    : { data: [] };

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-lg font-bold mb-1">Place Bets</h1>
      <p className="text-xs text-forest-400 mb-4">Balance: {(profile?.points ?? 0).toLocaleString()} BP</p>
      <MatchList
        upcomingMatches={matches ?? []}
        finishedMatches={finishedMatches ?? []}
        allBets={allBets ?? []}
        currentUserId={user.id}
        userPoints={profile?.points ?? 0}
      />
    </div>
  );
}
