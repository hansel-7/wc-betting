"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isBettingOpen, formatPoints, pointsToVND, cn } from "@/lib/utils";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_time: string;
  status: string;
  result: string | null;
}

interface Bet {
  id: string;
  prediction: string;
  amount: number;
  status: string;
  points_earned: number;
}

export default function BettingSection({
  match,
  userPoints,
  existingBet,
  totalHome,
  totalAway,
}: {
  match: Match;
  userPoints: number;
  existingBet: Bet | null;
  totalHome: number;
  totalAway: number;
}) {
  const [prediction, setPrediction] = useState<"home" | "away" | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const bettingOpen = isBettingOpen(match.match_time) && match.status === "upcoming" && !match.result;

  if (existingBet) {
    const teamName = existingBet.prediction === "home" ? match.home_team : match.away_team;
    return (
      <div className="bg-slate-800/60 rounded-xl p-4 mb-5">
        <p className="text-sm font-medium mb-2">Your Bet</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">
              {teamName} to win
            </p>
            <p className="text-xs text-slate-500">{formatPoints(existingBet.amount)} BP</p>
          </div>
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            existingBet.status === "pending" && "bg-yellow-500/20 text-yellow-400",
            existingBet.status === "won" && "bg-green-500/20 text-green-400",
            existingBet.status === "lost" && "bg-red-500/20 text-red-400",
            existingBet.status === "refunded" && "bg-slate-500/20 text-slate-400"
          )}>
            {existingBet.status === "pending" ? "Pending" :
             existingBet.status === "won" ? `Won +${formatPoints(existingBet.points_earned)} BP` :
             existingBet.status === "lost" ? `Lost ${formatPoints(existingBet.points_earned)} BP` :
             "Refunded"}
          </span>
        </div>
      </div>
    );
  }

  if (!bettingOpen) {
    return (
      <div className="bg-slate-800/40 rounded-xl p-4 mb-5 text-center">
        <p className="text-sm text-slate-500">
          {match.result ? "Match has been settled" : "Betting is closed"}
        </p>
      </div>
    );
  }

  const amountNum = parseInt(amount) || 0;
  const estimatedReturn = (() => {
    if (!prediction || amountNum <= 0) return 0;
    const myTotal = prediction === "home" ? totalHome + amountNum : totalHome;
    const otherTotal = prediction === "home" ? totalAway : totalAway;
    const mySide = prediction === "home" ? totalHome + amountNum : totalAway + amountNum;
    const otherSide = prediction === "home" ? totalAway : totalHome;
    if (mySide === 0) return amountNum;
    return amountNum + Math.floor((amountNum / mySide) * otherSide);
  })();

  async function handlePlaceBet() {
    if (!prediction || amountNum <= 0) return;
    setError("");
    setLoading(true);

    const { error } = await supabase.rpc("place_bet", {
      p_match_id: match.id,
      p_prediction: prediction,
      p_amount: amountNum,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 mb-5">
      <p className="text-sm font-medium mb-3">Place Your Bet</p>

      {/* Team selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setPrediction("home")}
          className={cn(
            "p-3 rounded-xl border-2 transition-all text-center",
            prediction === "home"
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 hover:border-slate-600"
          )}
        >
          <span className="text-lg block">{match.home_flag}</span>
          <span className="text-xs font-medium mt-1 block">{match.home_team}</span>
        </button>
        <button
          onClick={() => setPrediction("away")}
          className={cn(
            "p-3 rounded-xl border-2 transition-all text-center",
            prediction === "away"
              ? "border-orange-500 bg-orange-500/10"
              : "border-slate-700 hover:border-slate-600"
          )}
        >
          <span className="text-lg block">{match.away_flag}</span>
          <span className="text-xs font-medium mt-1 block">{match.away_team}</span>
        </button>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-400">Bet Amount (BP)</label>
          <span className="text-[10px] text-slate-500">Balance: {formatPoints(userPoints)} BP</span>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min={1}
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {/* Quick buttons */}
        <div className="flex gap-2 mt-2">
          {[50, 100, 250, 500].map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated return */}
      {prediction && amountNum > 0 && (
        <div className="bg-slate-900/60 rounded-lg p-2.5 mb-3 text-center">
          <p className="text-[10px] text-slate-500">Estimated return if {prediction === "home" ? match.home_team : match.away_team} wins</p>
          <p className="text-sm font-semibold text-green-400">{formatPoints(estimatedReturn)} BP</p>
          <p className="text-[10px] text-slate-500">{pointsToVND(estimatedReturn)}</p>
        </div>
      )}

      {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}

      <button
        onClick={handlePlaceBet}
        disabled={!prediction || amountNum <= 0 || loading}
        className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Placing bet..." : "Place Bet"}
      </button>
    </div>
  );
}
