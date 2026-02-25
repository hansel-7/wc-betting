import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatMatchTime, cn } from "@/lib/utils";
import SeedButton from "./SeedButton";
import CreateTestMatch from "./CreateTestMatch";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: matches, count } = await supabase
    .from("matches")
    .select("*", { count: "exact" })
    .order("match_number", { ascending: true });

  const allMatches = matches ?? [];

  const stages = [
    "Group Stage",
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Third Place",
    "Final",
    "Test Match",
  ];

  const grouped = stages.map((stage) => ({
    stage,
    matches: allMatches.filter((m) => m.stage === stage),
  }));

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-forest-400">{count ?? 0} matches in database</p>
        <div className="flex gap-2">
          {(count ?? 0) === 0 && <SeedButton />}
          <CreateTestMatch />
        </div>
      </div>

      {allMatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-forest-500 mb-2">No matches seeded yet.</p>
          <p className="text-xs text-forest-600">Click &quot;Seed Schedule&quot; to import all 104 World Cup matches.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ stage, matches }) =>
            matches.length > 0 ? (
              <section key={stage}>
                <h2 className="text-sm font-semibold text-forest-300 mb-2 sticky top-0 bg-forest-950 py-1">{stage}</h2>
                <div className="space-y-1.5">
                  {matches.map((m) => (
                    <Link key={m.id} href={`/admin/matches/${m.id}`}>
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-forest-800 transition-colors",
                        m.status === "live" && "bg-red-500/5 border border-red-500/20",
                        m.status === "finished" && "opacity-60",
                        m.status === "upcoming" && "bg-forest-800/40"
                      )}>
                        <span className="text-[10px] text-forest-600 w-6">#{m.match_number}</span>
                        <span className="text-xs">{m.home_flag}</span>
                        <span className="text-xs truncate flex-1">{m.home_team}</span>
                        <span className="text-[10px] text-forest-600">
                          {m.status === "finished"
                            ? `${m.home_score}-${m.away_score}`
                            : "vs"}
                        </span>
                        <span className="text-xs truncate flex-1 text-right">{m.away_team}</span>
                        <span className="text-xs">{m.away_flag}</span>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded",
                          m.status === "upcoming" && "bg-forest-700 text-forest-400",
                          m.status === "live" && "bg-red-500/20 text-red-400",
                          m.status === "finished" && "bg-green-500/20 text-green-400"
                        )}>
                          {m.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
