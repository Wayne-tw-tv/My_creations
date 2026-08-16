export const FOODS = [
  { name: "漢堡", category: "meal", icon: "🍔", image: "assets/foods/burger.png", distinct: true },
  { name: "披薩", category: "meal", icon: "🍕", image: "assets/foods/pizza.png", distinct: true },
  { name: "壽司", category: "meal", icon: "🍣", image: "assets/foods/sushi.png", distinct: true },
  { name: "炸雞", category: "meal", icon: "🍗", image: "assets/foods/chicken.png", distinct: true },
  { name: "拉麵", category: "meal", icon: "🍜", image: "assets/foods/ramen.png", distinct: true },
  { name: "沙拉", category: "meal", icon: "🥗", image: "assets/foods/salad.png", distinct: true },
  { name: "蛋糕", category: "dessert", icon: "🍰", image: "assets/foods/cake.png", distinct: false },
  { name: "甜甜圈", category: "dessert", icon: "🍩", image: "assets/foods/donut.png", distinct: true },
  { name: "冰淇淋", category: "dessert", icon: "🍦", image: "assets/foods/icecream.png", distinct: false },
  { name: "杯子蛋糕", category: "dessert", icon: "🧁", image: "assets/foods/cupcake.png", distinct: false },
  { name: "珍珠奶茶", category: "drink", icon: "🧋", image: "assets/foods/boba.png", distinct: true },
  { name: "咖啡", category: "drink", icon: "☕", image: "assets/foods/coffee.png", distinct: false },
];

export const DISTINCT_FOODS = FOODS.filter((f) => f.distinct);
export const CONFUSABLE_GROUPS = [];

function parTime(pairs, factor = 1) {
  return Math.round(pairs * 6 * factor);
}

export const MAX_LEVEL = 5;
export const MAX_STARS = MAX_LEVEL * 3;

export const LEVELS = [
  { level: 1, rows: 4, cols: 4, pairs: 8, flipBackMs: 1200, previewMs: 7000, parTimeSec: parTime(8), foodPool: "distinct", isBoss: false },
  { level: 2, rows: 4, cols: 4, pairs: 8, flipBackMs: 1000, previewMs: 7000, parTimeSec: parTime(8), foodPool: "distinct", isBoss: false },
  { level: 3, rows: 4, cols: 4, pairs: 8, flipBackMs: 1000, previewMs: 7000, parTimeSec: parTime(8), foodPool: "mixed", isBoss: false },
  { level: 4, rows: 4, cols: 5, pairs: 10, flipBackMs: 1000, previewMs: 7500, parTimeSec: parTime(10), foodPool: "mixed", isBoss: false },
  { level: 5, rows: 4, cols: 5, pairs: 10, flipBackMs: 900, previewMs: 8000, parTimeSec: parTime(10), foodPool: "mixed", isBoss: true },
];

export const QUOTES = {
  1: [
    "🍰 很棒！你的美食記憶之旅正式開始！",
    "🍔 第一口就對味，繼續吃下去吧！",
  ],
  2: [
    "🍩 甜甜圈都記得住，看來你的記憶力很有料！",
    "⚡ 翻牌變快了你還跟得上，漂亮！",
  ],
  3: [
    "🍕 Pizza 都被你配對成功了，這波操作很漂亮！",
    "🎯 卡片變多也難不倒你！",
  ],
  4: [
    "🧋 珍珠奶茶都記住了，這份記憶力值得加珍珠！",
    "👑 最後一關就在眼前，穩穩走完！",
  ],
  5: [
    "🏆 恭喜！你完成了美食記憶挑戰！",
    "👑 五關全通，你就是美食記憶王！",
  ],
};

export const COMBO_POINTS = {
  1: 100,
  2: 120,
  3: 150,
  4: 200,
};

export const COMBO_MAX_POINTS = 300;

export const MISTAKE_PENALTY = 25;
export const CLEAR_BONUS_BASE = 500;
export const CLEAR_BONUS_PER_LEVEL = 100;
export const TIME_BONUS_PER_SEC = 8;

export const TITLES = [
  { min: 95, name: "美食記憶王", icon: "👑" },
  { min: 90, name: "記憶大師", icon: "🧠" },
  { min: 80, name: "記憶高手", icon: "⭐" },
  { min: 70, name: "美食達人", icon: "🍰" },
  { min: 60, name: "記憶學徒", icon: "🍩" },
  { min: 0, name: "美食新手", icon: "🥄" },
];

export const DEFAULT_PLAYER_NAME = "美食探險家";

export const FLYING_EMOJIS = ["🍕", "🍔", "🍩", "🍰", "🧋", "🍦", "🍣", "🥐", "🍪", "🍗"];

export function comboLabel(combo) {
  if (combo <= 1) return "MATCH!";
  if (combo === 2) return `🔥 COMBO ×${combo}`;
  if (combo === 3) return `🔥🔥 GREAT! ×${combo}`;
  if (combo === 4) return `⭐ AMAZING! ×${combo}`;
  return "👑 FOOD MASTER!";
}

export function comboPoints(combo) {
  return COMBO_POINTS[combo] ?? COMBO_MAX_POINTS;
}

export function randomQuote(level) {
  const list = QUOTES[level] ?? QUOTES[1];
  return list[Math.floor(Math.random() * list.length)];
}

export function getTitle(score100) {
  return TITLES.find((t) => score100 >= t.min) ?? TITLES[TITLES.length - 1];
}

export function calcStars(pairs, mistakes, timeSec, parTimeSec) {
  const threeMistakes = Math.max(1, Math.floor(pairs * 0.1));
  const twoMistakes = Math.max(3, Math.floor(pairs * 0.25));
  if (mistakes <= threeMistakes && timeSec <= parTimeSec * 0.7) return 3;
  if (mistakes <= twoMistakes && timeSec <= parTimeSec) return 2;
  return 1;
}

export function calcFinalScore100({ totalStars, matches, mistakes, totalTimeSec, parTotalSec, maxCombo }) {
  const starScore = (totalStars / MAX_STARS) * 100;
  const accuracy = matches + mistakes === 0 ? 0 : (matches / (matches + mistakes)) * 100;
  const timeRatio = parTotalSec <= 0 ? 1 : totalTimeSec / parTotalSec;
  const timeScore = Math.max(0, Math.min(100, (2 - timeRatio) * 100));
  const comboScore = Math.max(0, Math.min(100, maxCombo * 12.5));
  return Math.round(starScore * 0.3 + accuracy * 0.25 + timeScore * 0.25 + comboScore * 0.2);
}

export function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
