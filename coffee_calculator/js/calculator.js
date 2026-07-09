export const RATIO_MIN = 12;
export const RATIO_MAX = 18;
export const RATIO_STEP = 0.5;

export function waterFromCoffee(coffeeG, ratio) {
  return coffeeG * ratio;
}

export function coffeeFromWater(waterMl, ratio) {
  return waterMl / ratio;
}

export function formatRatio(ratio) {
  return `1:${Number(ratio).toFixed(1)}`;
}

export function formatCoffee(g) {
  return `${round(g, 1)}g`;
}

export function formatWater(ml) {
  return `${Math.round(ml)} ml`;
}

export function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getMethodRatioBounds(method) {
  const min = method?.ratioMin ?? RATIO_MIN;
  const max = method?.ratioMax ?? RATIO_MAX;
  return { min, max };
}

export function getRatioStep(min, max) {
  const span = max - min;
  if (span <= 2) return 0.1;
  if (span <= 5) return 0.5;
  return 0.5;
}

/** strength 0=淡(高比例) → 100=濃(低比例)，對應 method 的 ratio 範圍 */
export function strengthToRatio(strength, method) {
  const { min, max } = getMethodRatioBounds(method);
  return max - (strength / 100) * (max - min);
}

export function ratioToStrength(ratio, method) {
  const { min, max } = getMethodRatioBounds(method);
  const span = max - min;
  if (span <= 0) return 50;
  return clamp(((max - ratio) / span) * 100, 0, 100);
}

export function getStrengthLabel(strength) {
  if (strength < 33) return '淡';
  if (strength > 66) return '濃';
  return '一般';
}

export function computeFromCoffee(coffeeG, ratio) {
  const waterMl = waterFromCoffee(coffeeG, ratio);
  return { coffeeG, waterMl, ratio };
}

export function computeFromWater(waterMl, ratio) {
  const coffeeG = coffeeFromWater(waterMl, ratio);
  return { coffeeG, waterMl, ratio };
}

export function getVisualCoffeePercent(coffeeG, waterMl) {
  const total = coffeeG + waterMl;
  if (total <= 0) return 6;
  return clamp((coffeeG / total) * 100, 4, 40);
}

export function validateCoffeeG(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 999) return 999;
  return round(n, 1);
}

export function validateWaterMl(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 9999) return 9999;
  return Math.round(n);
}

export function validateRatio(value, method) {
  const { min, max } = getMethodRatioBounds(method);
  const fallback = method?.ratioDefault ?? 16;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return clamp(round(n, 1), min, max);
}

export function formatStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export function formatDate(isoString) {
  const d = new Date(isoString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getCurrentCalcSnapshot(method, mode, coffeeG, waterMl, ratio) {
  return {
    method: method.name,
    methodId: method.id,
    coffeeG: round(coffeeG, 1),
    waterMl: Math.round(waterMl),
    ratio: round(ratio, 1),
    temp: method.temp,
    grind: method.grind,
    time: method.time,
  };
}
