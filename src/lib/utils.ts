export function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}

export function pointsToVND(points: number): string {
  const vnd = points * 1000;
  const formatted = Math.abs(vnd).toLocaleString("vi-VN") + "₫";
  return vnd < 0 ? `-${formatted}` : formatted;
}

export function pointsColor(points: number): string {
  if (points > 0) return "text-green-400";
  if (points < 0) return "text-red-400";
  return "text-slate-400";
}

export function estimateReturn(
  myBet: number,
  mySide: "home" | "away",
  totalHome: number,
  totalAway: number
): number {
  const myTotal = mySide === "home" ? totalHome + myBet : totalHome;
  const otherTotal = mySide === "home" ? totalAway : totalAway;
  const totalMySide = mySide === "home" ? totalHome + myBet : totalAway + myBet;
  const totalOtherSide = mySide === "home" ? totalAway : totalHome;

  if (totalMySide === 0) return myBet;
  const winnings = Math.floor((myBet / totalMySide) * totalOtherSide);
  return myBet + winnings;
}

export function isBettingOpen(matchTime: string): boolean {
  const cutoff = new Date(matchTime);
  cutoff.setMinutes(cutoff.getMinutes() - 30);
  return new Date() < cutoff;
}

export function formatMatchTime(matchTime: string): string {
  const d = new Date(matchTime);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
