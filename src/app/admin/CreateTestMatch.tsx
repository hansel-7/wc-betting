"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreateTestMatch() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeFlag, setHomeFlag] = useState("🏳️");
  const [awayFlag, setAwayFlag] = useState("🏳️");
  const [minutesFromNow, setMinutesFromNow] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate() {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Both team names are required");
      return;
    }
    setLoading(true);
    setError("");

    const matchTime = new Date(Date.now() + parseInt(minutesFromNow) * 60000).toISOString();

    const { data: maxMatch } = await supabase
      .from("matches")
      .select("match_number")
      .order("match_number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (maxMatch?.match_number ?? 200) + 1;

    const { error: insertError } = await supabase.from("matches").insert({
      match_number: nextNumber,
      stage: "Test Match",
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      home_flag: homeFlag || "🏳️",
      away_flag: awayFlag || "🏳️",
      match_time: matchTime,
      venue: "Test Venue",
      status: "upcoming",
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setHomeTeam("");
      setAwayTeam("");
      setHomeFlag("🏳️");
      setAwayFlag("🏳️");
      setMinutesFromNow("60");
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-amber-500/20 text-amber-400 px-4 py-2 rounded-lg font-medium hover:bg-amber-500/30 active:scale-[0.97] transition-all"
      >
        + Test Match
      </button>
    );
  }

  return (
    <div className="bg-forest-800/60 rounded-xl p-4 mb-4 border border-forest-700/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-amber-400 font-medium">Create Test Match</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-forest-500 hover:text-white">Cancel</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] text-forest-500">Home Team</label>
          <input
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            placeholder="e.g. Brazil"
            className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
        <div>
          <label className="text-[10px] text-forest-500">Away Team</label>
          <input
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            placeholder="e.g. Argentina"
            className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
        <div>
          <label className="text-[10px] text-forest-500">Home Flag</label>
          <input
            value={homeFlag}
            onChange={(e) => setHomeFlag(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
        <div>
          <label className="text-[10px] text-forest-500">Away Flag</label>
          <input
            value={awayFlag}
            onChange={(e) => setAwayFlag(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-[10px] text-forest-500">Betting closes in (minutes)</label>
        <input
          type="number"
          value={minutesFromNow}
          onChange={(e) => setMinutesFromNow(e.target.value)}
          min={1}
          className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
        />
        <p className="text-[10px] text-forest-600 mt-1">Betting stops 30 min before match time. Set to 31+ to allow betting now.</p>
      </div>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.97] text-white text-sm font-medium transition-all disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Test Match"}
      </button>
    </div>
  );
}
