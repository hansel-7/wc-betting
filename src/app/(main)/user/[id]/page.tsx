import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPoints, pointsToVND, pointsColor, cn } from "@/lib/utils";
import Link from "next/link";

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If viewing own profile, redirect to /profile
  if (user.id === id) redirect("/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, points")
    .eq("id", id)
    .single();

  if (!profile) redirect("/");

  // All user bets with match info (only settled bets are public)
  const { data: allBets } = await supabase
    .from("bets")
    .select("*, matches(home_team, away_team, home_flag, away_flag, match_time, status, result, stage, home_score, away_score)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const bets = allBets ?? [];
  const activeBets = bets.filter((b) => b.status === "pending");
  const historyBets = bets.filter((b) => b.status !== "pending");

  const totalBets = bets.length;
  const wonBets = bets.filter((b) => b.status === "won").length;
  const lostBets = bets.filter((b) => b.status === "lost").length;
  const refundedBets = bets.filter((b) => b.status === "refunded").length;
  const decidedBets = wonBets + lostBets;
  const winRate = decidedBets > 0 ? Math.round((wonBets / decidedBets) * 100) : 0;

  const { count: rankCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("points", profile.points);
  const rank = (rankCount ?? 0) + 1;

  return (
    <div className="px-4 pt-6">
      {/* Back link */}
      <Link href="/leaderboard" className="text-xs text-forest-400 hover:text-white transition-colors mb-4 inline-block">
        &larr; Back
      </Link>

      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-emerald-600 flex items-center justify-center text-lg font-bold">
          {profile.full_name.charAt(0)}
        </div>
        <div>
          <h1 className="text-lg font-bold">{profile.full_name}</h1>
          <p className="text-xs text-forest-400">Rank #{rank}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-forest-800/80 rounded-xl p-3 text-center border border-forest-700/30">
          <p className={`text-lg font-bold ${pointsColor(profile.points)}`}>{formatPoints(profile.points)}</p>
          <p className="text-[9px] text-forest-500">{pointsToVND(profile.points)}</p>
          <p className="text-[10px] text-forest-500 mt-0.5">Points</p>
        </div>
        <div className="bg-forest-800/80 rounded-xl p-3 text-center border border-forest-700/30">
          <p className="text-lg font-bold">{winRate}%</p>
          <p className="text-[10px] text-forest-500 mt-0.5">Win Rate</p>
        </div>
        <div className="bg-forest-800/80 rounded-xl p-3 text-center border border-forest-700/30">
          <p className="text-lg font-bold">{totalBets}</p>
          <p className="text-[10px] text-forest-500 mt-0.5">Total Bets</p>
        </div>
      </div>

      {/* W / L / R summary */}
      <div className="flex gap-3 mb-6 text-center text-xs">
        <div className="flex-1 bg-red-600/10 rounded-lg py-2">
          <span className="text-red-400 font-medium">{wonBets}W</span>
        </div>
        <div className="flex-1 bg-red-500/10 rounded-lg py-2">
          <span className="text-red-400 font-medium">{lostBets}L</span>
        </div>
        <div className="flex-1 bg-forest-700/30 rounded-lg py-2">
          <span className="text-forest-400 font-medium">{refundedBets}R</span>
        </div>
      </div>

      {/* Active Bets */}
      {activeBets.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Active Bets ({activeBets.length})</h2>
          <div className="space-y-2">
            {activeBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        </section>
      )}

      {/* Bet History */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Bet History ({historyBets.length})</h2>
        {historyBets.length === 0 ? (
          <p className="text-xs text-forest-500 text-center py-4 bg-forest-800/40 rounded-xl border border-forest-700/20">No completed bets yet</p>
        ) : (
          <div className="space-y-2">
            {historyBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BetCard({ bet }: { bet: any }) {
  const match = bet.matches;
  if (!match) return null;

  const teamName = bet.prediction === "home" ? match.home_team : match.away_team;
  const teamFlag = bet.prediction === "home" ? match.home_flag : match.away_flag;

  return (
    <div className="bg-forest-800/60 rounded-xl p-3 border border-forest-700/20">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{match.home_flag}</span>
          <span className="text-xs text-forest-400">vs</span>
          <span>{match.away_flag}</span>
          {match.status === "finished" && (
            <span className="text-xs text-forest-500 ml-1">
              {match.home_score} - {match.away_score}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium",
          bet.status === "pending" && "bg-yellow-500/20 text-yellow-400",
          bet.status === "won" && "bg-red-600/20 text-red-400",
          bet.status === "lost" && "bg-red-500/20 text-red-400",
          bet.status === "refunded" && "bg-forest-700/30 text-forest-400"
        )}>
          {bet.status === "won" ? `+${formatPoints(bet.points_earned)}` :
           bet.status === "lost" ? `${formatPoints(bet.points_earned)}` :
           bet.status === "refunded" ? "Refunded" : "Pending"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-forest-300">
          {teamFlag} {teamName} · {formatPoints(bet.amount)} BP
        </p>
        <p className="text-[10px] text-forest-600">{match.stage}</p>
      </div>
    </div>
  );
}
