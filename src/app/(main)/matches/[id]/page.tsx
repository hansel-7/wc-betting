import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMatchTime } from "@/lib/utils";
import BettingSection from "./BettingSection";
import PoolActivity from "./PoolActivity";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single();

  const { data: existingBet } = await supabase
    .from("bets")
    .select("*")
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Pool totals
  const { data: betsOnMatch } = await supabase
    .from("bets")
    .select("prediction, amount")
    .eq("match_id", id);

  const totalHome = betsOnMatch?.filter((b) => b.prediction === "home").reduce((s, b) => s + b.amount, 0) ?? 0;
  const totalAway = betsOnMatch?.filter((b) => b.prediction === "away").reduce((s, b) => s + b.amount, 0) ?? 0;

  // Recent bets for activity feed
  const { data: recentBets } = await supabase
    .from("bets")
    .select("id, prediction, amount, created_at, user_id, profiles(full_name)")
    .eq("match_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="px-4 pt-6">
      {/* Match Header */}
      <div className="bg-forest-800/80 rounded-2xl p-5 mb-5 border border-forest-700/30">
        <p className="text-center text-[10px] text-forest-400 mb-3">
          {match.stage}{match.group ? ` - Group ${match.group}` : ""}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <span className="text-4xl block mb-1">{match.home_flag}</span>
            <p className="text-sm font-semibold">{match.home_team}</p>
          </div>
          <div className="px-4 text-center">
            {match.status === "finished" || match.status === "live" ? (
              <div>
                <p className="text-2xl font-bold">
                  {match.home_score ?? 0} - {match.away_score ?? 0}
                </p>
                <p className={`text-[10px] mt-1 ${match.status === "live" ? "text-red-400" : "text-forest-500"}`}>
                  {match.status === "live" ? "LIVE" : "FT"}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold text-forest-300">VS</p>
                <p className="text-[10px] text-forest-500 mt-1">{formatMatchTime(match.match_time)}</p>
              </div>
            )}
          </div>
          <div className="flex-1 text-center">
            <span className="text-4xl block mb-1">{match.away_flag}</span>
            <p className="text-sm font-semibold">{match.away_team}</p>
          </div>
        </div>

        {match.result && (
          <div className="mt-3 text-center">
            <span className={`text-xs px-3 py-1 rounded-full ${
              match.result === "draw"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-600/20 text-red-400"
            }`}>
              {match.result === "draw"
                ? "Draw - All Bets Refunded"
                : match.result === "home"
                ? `${match.home_team} Won`
                : `${match.away_team} Won`}
            </span>
          </div>
        )}
      </div>

      {/* Pool Breakdown */}
      <div className="bg-forest-800/60 rounded-xl p-4 mb-5 border border-forest-700/20">
        <p className="text-xs text-forest-400 mb-2">Pool Breakdown</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-400">{match.home_team}</span>
              <span className="text-forest-300">{totalHome.toLocaleString()} BP</span>
            </div>
            <div className="h-2 bg-forest-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${totalHome + totalAway > 0 ? (totalHome / (totalHome + totalAway)) * 100 : 50}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-orange-400">{match.away_team}</span>
              <span className="text-forest-300">{totalAway.toLocaleString()} BP</span>
            </div>
            <div className="h-2 bg-forest-700/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${totalHome + totalAway > 0 ? (totalAway / (totalHome + totalAway)) * 100 : 50}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-forest-500 mt-2">
          Total Pool: {(totalHome + totalAway).toLocaleString()} BP
        </p>
      </div>

      {/* Betting Section */}
      <BettingSection
        match={match}
        userPoints={profile?.points ?? 0}
        existingBet={existingBet}
        totalHome={totalHome}
        totalAway={totalAway}
      />

      {/* Pool Activity */}
      <PoolActivity
        matchId={match.id}
        initialBets={recentBets ?? []}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
      />
    </div>
  );
}
