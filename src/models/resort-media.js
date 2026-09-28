export function allowResortVideo({ mobile, reducedMotion, saveData }) {
  return !mobile && !reducedMotion && !saveData;
}
