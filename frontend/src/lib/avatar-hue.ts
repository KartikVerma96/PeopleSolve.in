/** Stable pastel avatar background from any string (user id / name). */
export function avatarBackgroundForKey(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) % 360;
  }
  return `hsl(${h} 42% 36%)`;
}
