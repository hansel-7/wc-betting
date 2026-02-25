"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn, formatMatchTime, formatPoints, pointsToVND, isBettingOpen } from "@/lib/utils";

interface Match {
  id: string;
  match_number: number;
  stage: string;
  group: string | null;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_time: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  result: string | null;
}

interface BetRow {
  match_id: string;
  prediction: string;
  amount: number;
  status: string;
  points_earned: number;
  user_id: string;
}

export default function MatchList({
  upcomingMatches,
  finishedMatches,
  allBets,
  currentUserId,
  userPoints,
}: {
  upcomingMatches: Match[];
  finishedMatches: Match[];
  allBets: BetRow[];
  currentUserId: string;
  userPoints: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"open" | "finished">("open");

  const matches = tab === "open" ? upcomingMatches : finishedMatches;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-forest-800/60 rounded-lg p-1">
        <button
          onClick={() => { setTab("open"); setExpandedId(null); }}
          className={cn(
            "flex-1 py-2 text-xs font-medium rounded-md transition-all",
            tab === "open" ? "bg-red-600/20 text-red-400" : "text-forest-400"
          )}
        >
          Open ({upcomingMatches.length})
        </button>
        <button
          onClick={() => { setTab("finished"); setExpandedId(null); }}
          className={cn(
            "flex-1 py-2 text-xs font-medium rounded-md transition-all",
            tab === "finished" ? "bg-forest-700 text-forest-200" : "text-forest-400"
          )}
        >
          Settled ({finishedMatches.length})
        </button>
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-center text-sm text-forest-500 py-8">
            {tab === "open" ? "No open matches" : "No settled matches yet"}
          </p>
        ) : (
          matches.map((m) => {
            const matchBets = allBets.filter((b) => b.match_id === m.id);
            const totalHome = matchBets.filter((b) => b.prediction === "home").reduce((s, b) => s + b.amount, 0);
            const totalAway = matchBets.filter((b) => b.prediction === "away").reduce((s, b) => s + b.amount, 0);
            const myBet = matchBets.find((b) => b.user_id === currentUserId);
            const isExpanded = expandedId === m.id;

            return (
              <div key={m.id} className="bg-forest-800/60 rounded-xl border border-forest-700/20 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="w-full p-3 text-left active:bg-forest-700/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{m.home_flag}</span>
                      <span className="text-xs font-medium truncate">{m.home_team}</span>
                    </div>
                    <div className="px-2 text-center shrink-0">
                      {m.status === "finished" ? (
                        <span className="text-xs font-bold">{m.home_score}-{m.away_score}</span>
                      ) : m.status === "live" ? (
                        <span className="text-xs font-bold text-red-400">{m.home_score ?? 0}-{m.away_score ?? 0}</span>
                      ) : (
                        <span className="text-[10px] text-forest-500">VS</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-xs font-medium truncate">{m.away_team}</span>
                      <span className="text-sm">{m.away_flag}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-forest-600">{m.stage}{m.group ? ` ${m.group}` : ""}</span>
                    <div className="flex items-center gap-2">
                      {myBet && (
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded",
                          myBet.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                          myBet.status === "won" && "bg-red-600/20 text-red-400",
                          myBet.status === "lost" && "bg-red-500/20 text-red-400",
                          myBet.status === "refunded" && "bg-forest-700/30 text-forest-400"
                        )}>
                          {myBet.status === "pending" ? `${formatPoints(myBet.amount)} BP` : myBet.status}
                        </span>
                      )}
                      <span className="text-[10px] text-forest-500">{formatMatchTime(m.match_time)}</span>
                      <svg className={cn("w-3 h-3 text-forest-500 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <ExpandedMatchBet
                    match={m}
                    totalHome={totalHome}
                    totalAway={totalAway}
                    myBet={myBet ?? null}
                    currentUserId={currentUserId}
                    userPoints={userPoints}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ExpandedMatchBet({
  match,
  totalHome,
  totalAway,
  myBet,
  currentUserId,
  userPoints,
}: {
  match: Match;
  totalHome: number;
  totalAway: number;
  myBet: BetRow | null;
  currentUserId: string;
  userPoints: number;
}) {
  const [prediction, setPrediction] = useState<"home" | "away" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const bettingOpen = isBettingOpen(match.match_time) && match.status === "upcoming" && !match.result;
  const amountNum = parseInt(amount) || 0;

  const estimatedReturn = (() => {
    if (!prediction || amountNum <= 0) return 0;
    const mySide = prediction === "home" ? totalHome + amountNum : totalAway + amountNum;
    const otherSide = prediction === "home" ? totalAway : totalHome;
    if (mySide === 0) return amountNum;
    return amountNum + Math.floor((amountNum / mySide) * otherSide);
  })();

  async function handlePlaceBet() {
    if (!prediction || amountNum <= 0) return;
    setError("");
    setLoading(true);

    const { error: rpcError } = await supabase.rpc("place_bet", {
      p_match_id: match.id,
      p_prediction: prediction,
      p_amount: amountNum,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="border-t border-forest-700/30 p-3 bg-forest-900/30">
      {/* Pool bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-blue-400">{match.home_team}: {totalHome.toLocaleString()} BP</span>
          <span className="text-[10px] text-forest-600">Pool: {(totalHome + totalAway).toLocaleString()}</span>
          <span className="text-orange-400">{match.away_team}: {totalAway.toLocaleString()} BP</span>
        </div>
        <div className="h-1.5 bg-forest-700/50 rounded-full overflow-hidden flex">
          <div className="bg-blue-500 rounded-l-full" style={{ width: `${totalHome + totalAway > 0 ? (totalHome / (totalHome + totalAway)) * 100 : 50}%` }} />
          <div className="bg-orange-500 rounded-r-full flex-1" />
        </div>
      </div>

      {/* Existing bet */}
      {myBet && (
        <div className={cn(
          "rounded-lg p-2.5 mb-3 text-center text-xs",
          myBet.status === "pending" && "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400",
          myBet.status === "won" && "bg-red-600/10 border border-red-600/20 text-red-400",
          myBet.status === "lost" && "bg-red-500/10 border border-red-500/20 text-red-400",
          myBet.status === "refunded" && "bg-forest-700/20 border border-forest-700/30 text-forest-400"
        )}>
          Your bet: {formatPoints(myBet.amount)} BP on {myBet.prediction === "home" ? match.home_team : match.away_team}
          {myBet.status === "won" && ` — Won +${formatPoints(myBet.points_earned)} BP`}
          {myBet.status === "lost" && ` — Lost`}
          {myBet.status === "refunded" && ` — Refunded`}
        </div>
      )}

      {/* Betting form */}
      {!myBet && bettingOpen && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPrediction("home")}
              className={cn(
                "py-2.5 rounded-lg border-2 text-xs font-medium transition-all active:scale-[0.95]",
                prediction === "home"
                  ? "border-red-600 bg-red-600/10 text-white"
                  : "border-forest-700 text-forest-400 hover:border-forest-600"
              )}
            >
              {match.home_flag} {match.home_team}
            </button>
            <button
              onClick={() => setPrediction("away")}
              className={cn(
                "py-2.5 rounded-lg border-2 text-xs font-medium transition-all active:scale-[0.95]",
                prediction === "away"
                  ? "border-red-600 bg-red-600/10 text-white"
                  : "border-forest-700 text-forest-400 hover:border-forest-600"
              )}
            >
              {match.away_flag} {match.away_team}
            </button>
          </div>

          <div className="mb-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Bet amount (BP)"
              min={1}
              className="w-full px-3 py-2.5 rounded-lg bg-forest-800 border border-forest-700 text-sm placeholder-forest-600 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
            <div className="flex gap-1.5 mt-1.5">
              {[50, 100, 250, 500].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="flex-1 text-[10px] py-1 rounded bg-forest-700 hover:bg-forest-600 active:scale-[0.93] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {prediction && amountNum > 0 && (
            <div className="bg-forest-800/60 rounded-lg p-2 mb-2 text-center">
              <p className="text-[10px] text-forest-500">
                Est. return if {prediction === "home" ? match.home_team : match.away_team} wins
              </p>
              <p className="text-xs font-semibold text-red-400">{formatPoints(estimatedReturn)} BP ({pointsToVND(estimatedReturn)})</p>
            </div>
          )}

          {error && <p className="text-red-400 text-[10px] text-center mb-2">{error}</p>}

          <button
            onClick={handlePlaceBet}
            disabled={!prediction || amountNum <= 0 || loading}
            className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.97] text-white text-xs font-semibold transition-all disabled:opacity-40"
          >
            {loading ? "Placing..." : "Place Bet"}
          </button>
        </>
      )}

      {/* Closed state */}
      {!myBet && !bettingOpen && (
        <p className="text-center text-xs text-forest-500 py-1">
          {match.result ? "Match settled" : "Betting closed"}
        </p>
      )}
    </div>
  );
}
