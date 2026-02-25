"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  result: string | null;
  stage: string;
}

export default function AdminMatchForm({ match }: { match: Match }) {
  const [homeTeam, setHomeTeam] = useState(match.home_team);
  const [awayTeam, setAwayTeam] = useState(match.away_team);
  const [homeFlag, setHomeFlag] = useState(match.home_flag);
  const [awayFlag, setAwayFlag] = useState(match.away_flag);
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? "0");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? "0");
  const [status, setStatus] = useState(match.status);
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("matches")
      .update({
        home_team: homeTeam,
        away_team: awayTeam,
        home_flag: homeFlag,
        away_flag: awayFlag,
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0,
        status,
      })
      .eq("id", match.id);

    setSaving(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Saved!");
      router.refresh();
    }
  }

  async function handleSettle(result: "home" | "away" | "draw") {
    if (!confirm(`Settle match as "${result}"? This cannot be undone.`)) return;
    setSettling(true);
    setMessage("");

    const { error } = await supabase.rpc("settle_match", {
      p_match_id: match.id,
      p_result: result,
    });

    setSettling(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(`Match settled as "${result}".`);
      router.refresh();
    }
  }

  async function handleReset() {
    if (!confirm("Reset this match? All settlements will be reversed and bets restored to pending.")) return;
    setResetting(true);
    setMessage("");

    const { error } = await supabase.rpc("reset_match", {
      p_match_id: match.id,
    });

    setResetting(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Match reset successfully.");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this test match and all its bets? This cannot be undone.")) return;
    setDeleting(true);
    setMessage("");

    const { error: betsError } = await supabase
      .from("bets")
      .delete()
      .eq("match_id", match.id);

    if (betsError) {
      setMessage(`Error deleting bets: ${betsError.message}`);
      setDeleting(false);
      return;
    }

    const { error: matchError } = await supabase
      .from("matches")
      .delete()
      .eq("id", match.id);

    setDeleting(false);
    if (matchError) {
      setMessage(`Error: ${matchError.message}`);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="space-y-4">
      {/* Edit Teams */}
      <div className="bg-forest-800/60 rounded-xl p-4 border border-forest-700/20">
        <h3 className="text-xs text-forest-400 mb-3">Edit Teams</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-forest-500">Home Team</label>
            <input
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-forest-500">Away Team</label>
            <input
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-forest-500">Home Flag</label>
            <input
              value={homeFlag}
              onChange={(e) => setHomeFlag(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-forest-500">Away Flag</label>
            <input
              value={awayFlag}
              onChange={(e) => setAwayFlag(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Score + Status */}
      <div className="bg-forest-800/60 rounded-xl p-4 border border-forest-700/20">
        <h3 className="text-xs text-forest-400 mb-3">Score &amp; Status</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-forest-500">Home Score</label>
            <input
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-forest-500">Away Score</label>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-forest-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-forest-900 border border-forest-700 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full py-2 rounded-lg bg-forest-700 hover:bg-forest-600 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Settle Match */}
      {!match.result && (
        <div className="bg-forest-800/60 rounded-xl p-4 border border-forest-700/20">
          <h3 className="text-xs text-forest-400 mb-3">Settle Match</h3>
          <p className="text-[10px] text-forest-500 mb-3">
            This will distribute points to winners or refund on draw. Cannot be undone.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSettle("home")}
              disabled={settling}
              className="py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {homeTeam} Win
            </button>
            <button
              onClick={() => handleSettle("draw")}
              disabled={settling}
              className="py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              Draw
            </button>
            <button
              onClick={() => handleSettle("away")}
              disabled={settling}
              className="py-2.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {awayTeam} Win
            </button>
          </div>
        </div>
      )}

      {match.result && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-sm text-green-400 text-center mb-3">
            Match settled: <strong>{match.result === "draw" ? "Draw (all refunded)" : match.result === "home" ? `${match.home_team} won` : `${match.away_team} won`}</strong>
          </p>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {resetting ? "Resetting..." : "Reset Settlement (undo & restore bets)"}
          </button>
        </div>
      )}

      {match.stage === "Test Match" && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <h3 className="text-xs text-red-400 mb-2">Danger Zone</h3>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Test Match"}
          </button>
        </div>
      )}

      {message && (
        <p className={cn(
          "text-xs text-center",
          message.startsWith("Error") ? "text-red-400" : "text-green-400"
        )}>
          {message}
        </p>
      )}
    </div>
  );
}
