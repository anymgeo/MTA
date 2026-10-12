export const RESORT_ORDER = ['gudauri-kobi', 'mestia', 'bakuriani', 'goderdzi'];
export function resortRank(slug) {
  const canonical = ['gudauri', 'kobi'].includes(slug) ? 'gudauri-kobi' : slug;
  const index = RESORT_ORDER.indexOf(canonical);
  return index < 0 ? RESORT_ORDER.length : index;
}
export function compareResorts(a, b) { return resortRank(a) - resortRank(b); }
