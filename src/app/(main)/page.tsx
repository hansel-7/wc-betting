import { createClient } from "@/lib/supabase/server";
import { formatPoints, pointsToVND, pointsColor, formatMatchTime } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get user rank
  const { count: rankCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("points", profile.points);
  const rank = (rankCount ?? 0) + 1;

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Live matches
  const { data: liveMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "live")
    .order("match_time", { ascending: true });

  // Upcoming matches (next 10)
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "upcoming")
    .order("match_time", { ascending: true })
    .limit(10);

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Vinacado</h1>
          <p className="text-forest-400 text-xs">World Cup 2026</p>
        </div>
        {profile.is_admin && (
          <Link
            href="/admin"
            className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-medium"
          >
            Admin
          </Link>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-forest-800/80 rounded-2xl p-4 text-center border border-forest-700/30">
          <p className={`text-2xl font-bold ${pointsColor(profile.points)}`}>{formatPoints(profile.points)}</p>
          <p className="text-[10px] text-forest-400 mt-0.5">{pointsToVND(profile.points)}</p>
          <p className="text-xs text-forest-500 mt-1">{profile.points < 0 ? "You owe" : "Balance"}</p>
        </div>
        <div className="flex-1 bg-forest-800/80 rounded-2xl p-4 text-center border border-forest-700/30">
          <p className="text-2xl font-bold">{rank}<span className="text-sm text-forest-400">/{totalUsers ?? 0}</span></p>
          <p className="text-xs text-forest-500 mt-1">Rank</p>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches && liveMatches.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold">Live Now</h2>
          </div>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <div className="bg-forest-800/80 rounded-2xl p-4 border border-forest-700/30 hover:border-forest-700/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.home_flag}</span>
                      <span className="text-sm font-medium">{m.home_team}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-bold">
                        {m.home_score ?? 0} - {m.away_score ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.away_team}</span>
                      <span className="text-lg">{m.away_flag}</span>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-red-400 mt-1">{m.stage}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3">Upcoming Matches</h2>
        <div className="space-y-2">
          {upcomingMatches && upcomingMatches.length > 0 ? (
            upcomingMatches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <div className="bg-forest-800/60 rounded-xl p-3 border border-forest-700/20 hover:border-forest-700/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span>{m.home_flag}</span>
                      <span className="text-sm truncate">{m.home_team}</span>
                    </div>
                    <span className="text-xs text-forest-500 px-2 shrink-0">VS</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm truncate">{m.away_team}</span>
                      <span>{m.away_flag}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-forest-500">{m.stage}{m.group ? ` - Group ${m.group}` : ""}</span>
                    <span className="text-[10px] text-forest-400">{formatMatchTime(m.match_time)}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-forest-500 text-center py-6">No upcoming matches</p>
          )}
        </div>
      </section>

      {/* Invite Banner */}
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4 text-center mb-6">
        <p className="text-sm font-medium text-green-300">Invite your colleagues!</p>
        <p className="text-xs text-forest-400 mt-1">Share the fun and grow the pool</p>
      </div>
    </div>
  );
}
