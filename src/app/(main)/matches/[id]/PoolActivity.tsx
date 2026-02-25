"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPoints } from "@/lib/utils";

interface BetActivity {
  id: string;
  prediction: string;
  amount: number;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

export default function PoolActivity({
  matchId,
  initialBets,
  homeTeam,
  awayTeam,
}: {
  matchId: string;
  initialBets: BetActivity[];
  homeTeam: string;
  awayTeam: string;
}) {
  const [bets, setBets] = useState<BetActivity[]>(initialBets);
  const supabase = createClient();

  function getFullName(profiles: BetActivity["profiles"]): string {
    if (!profiles) return "Unknown";
    if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "Unknown";
    return profiles.full_name;
  }

  useEffect(() => {
    const channel = supabase
      .channel(`bets-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bets",
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", (payload.new as { user_id: string }).user_id)
            .single();

          const newBet: BetActivity = {
            ...(payload.new as BetActivity),
            profiles: profile,
          };
          setBets((prev) => [newBet, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <section className="mb-6">
      <h3 className="text-sm font-semibold mb-3">Pool Activity</h3>
      {bets.length === 0 ? (
        <p className="text-xs text-forest-500 text-center py-4">No bets yet. Be the first!</p>
      ) : (
        <div className="space-y-2">
          {bets.map((bet) => (
            <div key={bet.id} className="flex items-center gap-3 bg-forest-800/40 rounded-lg p-3 border border-forest-700/20">
              <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-xs font-bold">
                {getFullName(bet.profiles).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {getFullName(bet.profiles)}
                </p>
                <p className="text-[10px] text-forest-500">
                  Bet on {bet.prediction === "home" ? homeTeam : awayTeam}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-green-400">+{formatPoints(bet.amount)} BP</p>
                <p className="text-[10px] text-forest-600">{timeAgo(bet.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
