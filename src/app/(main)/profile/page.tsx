import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPoints, pointsToVND, pointsColor, formatMatchTime, cn } from "@/lib/utils";
import SignOutButton from "./SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // All user bets with match info
  const { data: allBets } = await supabase
    .from("bets")
    .select("*, matches(home_team, away_team, home_flag, away_flag, match_time, status, result, stage, home_score, away_score)")
    .eq("user_id", user.id)
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

  // Department leaderboard
  const { data: deptProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, points")
    .eq("department", profile.department)
    .order("points", { ascending: false })
    .limit(5);

  return (
    <div className="px-4 pt-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-lg font-bold">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold">{profile.full_name}</h1>
            <p className="text-xs text-slate-400">{profile.department}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-slate-800/80 rounded-xl p-3 text-center">
          <p className={`text-lg font-bold ${pointsColor(profile.points)}`}>{formatPoints(profile.points)}</p>
          <p className="text-[9px] text-slate-500">{pointsToVND(profile.points)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{profile.points < 0 ? "You owe" : "Balance"}</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{winRate}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Win Rate</p>
        </div>
        <div className="bg-slate-800/80 rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{totalBets}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Total Bets</p>
        </div>
      </div>

      {/* W / L / R summary */}
      <div className="flex gap-3 mb-6 text-center text-xs">
        <div className="flex-1 bg-green-500/10 rounded-lg py-2">
          <span className="text-green-400 font-medium">{wonBets}W</span>
        </div>
        <div className="flex-1 bg-red-500/10 rounded-lg py-2">
          <span className="text-red-400 font-medium">{lostBets}L</span>
        </div>
        <div className="flex-1 bg-slate-500/10 rounded-lg py-2">
          <span className="text-slate-400 font-medium">{refundedBets}R</span>
        </div>
      </div>

      {/* Department Leaderboard */}
      {deptProfiles && deptProfiles.length > 1 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2">{profile.department} Leaderboard</h2>
          <div className="bg-slate-800/60 rounded-xl overflow-hidden">
            {deptProfiles.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  p.id === user.id && "bg-green-500/5",
                  i !== deptProfiles.length - 1 && "border-b border-slate-800/50"
                )}
              >
                <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                <p className={cn("text-sm flex-1 truncate", p.id === user.id && "text-green-400 font-medium")}>
                  {p.id === user.id ? "You" : p.full_name}
                </p>
                <span className="text-xs text-slate-400">{formatPoints(p.points)} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Active Bets */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Active Bets ({activeBets.length})</h2>
        {activeBets.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-800/40 rounded-xl">No active bets</p>
        ) : (
          <div className="space-y-2">
            {activeBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} userId={user.id} />
            ))}
          </div>
        )}
      </section>

      {/* Bet History */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Bet History ({historyBets.length})</h2>
        {historyBets.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-800/40 rounded-xl">No completed bets</p>
        ) : (
          <div className="space-y-2">
            {historyBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} userId={user.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BetCard({ bet, userId }: { bet: any; userId: string }) {
  const match = bet.matches;
  if (!match) return null;

  const teamName = bet.prediction === "home" ? match.home_team : match.away_team;
  const teamFlag = bet.prediction === "home" ? match.home_flag : match.away_flag;

  return (
    <div className="bg-slate-800/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{match.home_flag}</span>
          <span className="text-xs text-slate-400">vs</span>
          <span>{match.away_flag}</span>
          {match.status === "finished" && (
            <span className="text-xs text-slate-500 ml-1">
              {match.home_score} - {match.away_score}
            </span>
          )}
        </div>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-medium",
          bet.status === "pending" && "bg-yellow-500/20 text-yellow-400",
          bet.status === "won" && "bg-green-500/20 text-green-400",
          bet.status === "lost" && "bg-red-500/20 text-red-400",
          bet.status === "refunded" && "bg-slate-500/20 text-slate-400"
        )}>
          {bet.status === "won" ? `+${formatPoints(bet.points_earned)}` :
           bet.status === "lost" ? `${formatPoints(bet.points_earned)}` :
           bet.status === "refunded" ? "Refunded" : "Pending"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-300">
          {teamFlag} {teamName} · {formatPoints(bet.amount)} BP
        </p>
        <p className="text-[10px] text-slate-600">{match.stage}</p>
      </div>
    </div>
  );
}
