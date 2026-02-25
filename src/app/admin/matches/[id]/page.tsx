import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatMatchTime, formatPoints } from "@/lib/utils";
import AdminMatchForm from "./AdminMatchForm";

export default async function AdminMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) redirect("/admin");

  // Bet statistics
  const { data: bets } = await supabase
    .from("bets")
    .select("prediction, amount, status")
    .eq("match_id", id);

  const allBets = bets ?? [];
  const totalHome = allBets.filter((b) => b.prediction === "home").reduce((s, b) => s + b.amount, 0);
  const totalAway = allBets.filter((b) => b.prediction === "away").reduce((s, b) => s + b.amount, 0);
  const betCount = allBets.length;

  return (
    <div className="px-4 py-4">
      <div className="mb-6">
        <p className="text-[10px] text-slate-500 mb-1">
          Match #{match.match_number} · {match.stage}{match.group ? ` - Group ${match.group}` : ""}
        </p>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{match.home_flag}</span>
          <span className="text-lg font-bold">{match.home_team}</span>
          <span className="text-slate-500">vs</span>
          <span className="text-lg font-bold">{match.away_team}</span>
          <span className="text-2xl">{match.away_flag}</span>
        </div>
        <p className="text-xs text-slate-400">{formatMatchTime(match.match_time)} · {match.venue}</p>
      </div>

      {/* Pool Stats */}
      <div className="bg-slate-800/60 rounded-xl p-4 mb-6">
        <h3 className="text-xs text-slate-400 mb-2">Pool Statistics</h3>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="font-medium text-blue-400">{formatPoints(totalHome)}</p>
            <p className="text-[10px] text-slate-500">on {match.home_team}</p>
          </div>
          <div>
            <p className="font-medium">{betCount}</p>
            <p className="text-[10px] text-slate-500">total bets</p>
          </div>
          <div>
            <p className="font-medium text-orange-400">{formatPoints(totalAway)}</p>
            <p className="text-[10px] text-slate-500">on {match.away_team}</p>
          </div>
        </div>
      </div>

      <AdminMatchForm match={match} />
    </div>
  );
}
