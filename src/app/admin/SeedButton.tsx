"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import schedule from "@/lib/schedule.json";

function cestToUtc(date: string, timeCest: string): string {
  const [hours, minutes] = timeCest.split(":").map(Number);
  const dt = new Date(`${date}T${timeCest}:00+02:00`);
  return dt.toISOString();
}

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSeed() {
    setLoading(true);
    setError("");

    const rows = schedule.matches.map((m) => ({
      match_number: m.match_number,
      stage: m.stage,
      group: m.group,
      matchday: m.matchday,
      home_team: m.home_team,
      away_team: m.away_team,
      home_flag: m.home_flag,
      away_flag: m.away_flag,
      match_time: cestToUtc(m.date, m.time_cest),
      venue: m.venue,
      status: "upcoming",
    }));

    // Insert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from("matches").insert(batch);
      if (error) {
        setError(`Batch ${i}: ${error.message}`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? "Seeding..." : "Seed Schedule"}
      </button>
      {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}
