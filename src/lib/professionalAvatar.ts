/**
 * Temporary avatar URLs for map pins and cards.
 * TODO: replace with ProConnect uploads or Google Sign-In `photoURL` (googleusercontent.com).
 */
const TEMP_AVATAR_POOL = [
  'https://lh3.googleusercontent.com/a/default-user=s96-c',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/15.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/76.jpg',
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable portrait URL for map pins and profile cards. */
export function resolveProfessionalAvatarUrl(
  pro: { id: string; name: string; avatarUrl?: string },
  index = 0,
): string {
  const custom = pro.avatarUrl?.trim();
  if (custom) return custom;

  const key = pro.id || pro.name || String(index);
  const poolIndex = hashString(key) % TEMP_AVATAR_POOL.length;
  return TEMP_AVATAR_POOL[poolIndex];
}
