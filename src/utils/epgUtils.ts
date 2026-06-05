export function formatEpgTime(isoString: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

export function getEpgProgress(start: string, stop: string): number {
  if (!start || !stop) return 0;
  try {
    const s = new Date(start).getTime();
    const e = new Date(stop).getTime();
    const now = Date.now();
    if (now < s) return 0;
    if (now > e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  } catch (err) {
    return 0;
  }
}
