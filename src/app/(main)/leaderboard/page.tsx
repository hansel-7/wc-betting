import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPoints, pointsToVND, pointsColor, cn } from "@/lib/utils";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, department, points")
    .order("points", { ascending: false });

  const profiles = allProfiles ?? [];
  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  // Reorder top 3 for podium display: [2nd, 1st, 3rd]
  const podium = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  return (
    <div className="px-4 pt-6">
      <h1 className="text-lg font-bold mb-6">Leaderboard</h1>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {podium.map((p, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const height = i === 1 ? "h-28" : "h-20";
            const colors = [
              "from-slate-400 to-slate-500",
              "from-yellow-400 to-amber-500",
              "from-amber-600 to-amber-700",
            ];
            return (
              <div key={p.id} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold mb-2">
                  {p.full_name.charAt(0)}
                </div>
                <p className="text-xs font-medium truncate max-w-[80px] text-center">{p.full_name}</p>
                <p className={`text-[10px] mb-1 ${pointsColor(p.points)}`}>{formatPoints(p.points)} BP</p>
                <div className={cn(
                  "w-20 rounded-t-lg flex items-center justify-center bg-gradient-to-t",
                  height,
                  colors[i]
                )}>
                  <span className="text-xl font-bold text-white/90">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="bg-slate-800/60 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-2 text-[10px] text-slate-500 border-b border-slate-700/50">
          <span>#</span>
          <span>User</span>
          <span className="text-right">Points</span>
        </div>
        {profiles.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-3 items-center",
              p.id === user.id && "bg-green-500/5",
              i !== profiles.length - 1 && "border-b border-slate-800/50"
            )}
          >
            <span className="text-xs text-slate-400 font-medium">{i + 1}</span>
            <div className="min-w-0">
              <p className={cn("text-sm truncate", p.id === user.id && "text-green-400 font-medium")}>
                {p.full_name}{p.id === user.id ? " (You)" : ""}
              </p>
              <p className="text-[10px] text-slate-600">{p.department}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${pointsColor(p.points)}`}>{formatPoints(p.points)}</p>
              <p className="text-[10px] text-slate-500">{pointsToVND(p.points)}</p>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">No players yet</p>
        )}
      </div>
    </div>
  );
}
