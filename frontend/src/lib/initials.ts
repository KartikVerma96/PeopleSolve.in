/** Two-letter initials for avatars and feed attribution. */
export function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0]}${p[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || "??";
}
