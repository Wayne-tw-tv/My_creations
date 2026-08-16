import {
  FOODS,
  DISTINCT_FOODS,
  CONFUSABLE_GROUPS,
  comboPoints,
  calcStars,
  CLEAR_BONUS_BASE,
  CLEAR_BONUS_PER_LEVEL,
  TIME_BONUS_PER_SEC,
  MISTAKE_PENALTY,
} from "./config.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickFoods(pairs, pool) {
  let selected = [];

  if (pool === "distinct") {
    selected = shuffle(DISTINCT_FOODS);
  } else if (pool === "confusable") {
    const groups = shuffle(CONFUSABLE_GROUPS.map((g) => g.filter(Boolean)));
    for (const group of groups) {
      selected.push(...group);
      if (selected.length >= pairs) break;
    }
    const used = new Set(selected.map((f) => f.icon));
    const rest = shuffle(FOODS.filter((f) => !used.has(f.icon)));
    selected = [...selected, ...rest];
  } else {
    selected = shuffle(FOODS);
  }

  const unique = [];
  const seen = new Set();
  for (const food of selected) {
    if (!food || seen.has(food.icon)) continue;
    seen.add(food.icon);
    unique.push(food);
    if (unique.length === pairs) break;
  }

  if (unique.length < pairs) {
    for (const food of shuffle(FOODS)) {
      if (seen.has(food.icon)) continue;
      unique.push(food);
      seen.add(food.icon);
      if (unique.length === pairs) break;
    }
  }

  return unique.slice(0, pairs);
}

function buildDeck(pairs, pool) {
  const foods = pickFoods(pairs, pool);
  const cards = [];
  foods.forEach((food, pairId) => {
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: `${pairId}-${copy}`,
        pairId,
        name: food.name,
        category: food.category,
        icon: food.icon,
        image: food.image,
        matched: false,
        flipped: false,
      });
    }
  });
  return shuffle(cards).map((card, index) => ({ ...card, id: index }));
}

export class MemoryGame {
  constructor() {
    this.listeners = {};
    this.reset();
  }

  on(event, fn) {
    (this.listeners[event] ??= []).push(fn);
    return this;
  }

  emit(event, payload) {
    for (const fn of this.listeners[event] ?? []) fn(payload);
  }

  reset() {
    this.clearTimers();
    this.config = null;
    this.cards = [];
    this.state = "idle";
    this.openCards = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.flips = 0;
    this.mistakes = 0;
    this.matches = 0;
    this.matchScore = 0;
    this.levelScore = 0;
    this.elapsedMs = 0;
    this.timerStartedAt = 0;
    this.timerRaf = 0;
    this.previewRaf = 0;
    this.previewRemainMs = 0;
    this.missTimer = 0;
  }

  clearTimers() {
    if (this.timerRaf) cancelAnimationFrame(this.timerRaf);
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
    if (this.missTimer) clearTimeout(this.missTimer);
    this.timerRaf = 0;
    this.previewRaf = 0;
    this.missTimer = 0;
  }

  startLevel(config) {
    this.reset();
    this.config = config;
    this.cards = buildDeck(config.pairs, config.foodPool);

    if (config.previewMs > 0) {
      this.state = "locked";
      this.previewRemainMs = config.previewMs;
      for (const card of this.cards) card.flipped = true;
      this.emit("previewStart", this.snapshot());
      const endsAt = performance.now() + config.previewMs;
      const tickPreview = (now) => {
        this.previewRemainMs = Math.max(0, endsAt - now);
        this.emit("previewTick", this.snapshot());
        if (this.previewRemainMs <= 0) {
          this.endPreview();
          return;
        }
        this.previewRaf = requestAnimationFrame(tickPreview);
      };
      this.previewRaf = requestAnimationFrame(tickPreview);
    } else {
      this.state = "idle";
      this.startTimer();
    }

    this.emit("update", this.snapshot());
  }

  endPreview() {
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
    this.previewRaf = 0;
    this.previewRemainMs = 0;
    for (const card of this.cards) card.flipped = false;
    this.state = "idle";
    this.startTimer();
    this.emit("previewEnd", this.snapshot());
    this.emit("update", this.snapshot());
  }

  startTimer() {
    this.timerStartedAt = performance.now();
    const tick = (now) => {
      if (this.state === "cleared") return;
      this.elapsedMs = now - this.timerStartedAt;
      this.emit("tick", this.snapshot());
      this.timerRaf = requestAnimationFrame(tick);
    };
    this.timerRaf = requestAnimationFrame(tick);
  }

  stopTimer() {
    if (this.timerRaf) cancelAnimationFrame(this.timerRaf);
    this.timerRaf = 0;
    if (this.timerStartedAt) {
      this.elapsedMs = performance.now() - this.timerStartedAt;
    }
  }

  timeSec() {
    return this.elapsedMs / 1000;
  }

  snapshot() {
    return {
      config: this.config,
      cards: this.cards,
      state: this.state,
      combo: this.combo,
      maxCombo: this.maxCombo,
      flips: this.flips,
      mistakes: this.mistakes,
      matches: this.matches,
      pairs: this.config?.pairs ?? 0,
      matchScore: this.matchScore,
      levelScore: this.levelScore,
      timeSec: this.timeSec(),
      previewRemainSec: Math.ceil(this.previewRemainMs / 1000),
      previewing: this.state === "locked" && this.previewRemainMs > 0,
    };
  }

  flip(cardId) {
    if (this.state !== "idle" && this.state !== "flipping") return;
    const card = this.cards[cardId];
    if (!card || card.flipped || card.matched) return;

    card.flipped = true;
    this.flips += 1;
    this.openCards.push(card);
    this.emit("flip", { card, ...this.snapshot() });

    if (this.openCards.length === 1) {
      this.state = "flipping";
      this.emit("update", this.snapshot());
      return;
    }

    if (this.openCards.length >= 2) {
      this.state = "checking";
      const [a, b] = this.openCards;
      if (a.pairId === b.pairId) this.resolveMatch(a, b);
      else this.resolveMiss(a, b);
    }
  }

  resolveMatch(a, b) {
    a.matched = true;
    b.matched = true;
    this.openCards = [];
    this.matches += 1;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const gained = comboPoints(this.combo);
    this.matchScore += gained;
    this.recomputeLevelScore();

    const allMatched = this.matches === this.config.pairs;
    if (allMatched) {
      this.finishLevel(gained);
      return;
    }

    this.state = "idle";
    this.emit("match", { cards: [a, b], gained, combo: this.combo, ...this.snapshot() });
    this.emit("update", this.snapshot());
  }

  resolveMiss(a, b) {
    this.combo = 0;
    this.mistakes += 1;
    this.recomputeLevelScore();
    this.emit("miss", { cards: [a, b], ...this.snapshot() });
    this.emit("update", this.snapshot());

    this.missTimer = setTimeout(() => {
      a.flipped = false;
      b.flipped = false;
      this.openCards = [];
      this.state = "idle";
      this.emit("update", this.snapshot());
    }, this.config.flipBackMs);
  }

  recomputeLevelScore() {
    this.levelScore = Math.max(0, this.matchScore - this.mistakes * MISTAKE_PENALTY);
  }

  finishLevel(lastGained) {
    this.stopTimer();
    this.state = "cleared";
    const timeSec = this.timeSec();
    const clearBonus = CLEAR_BONUS_BASE + this.config.level * CLEAR_BONUS_PER_LEVEL;
    const timeBonus = Math.max(0, Math.round((this.config.parTimeSec - timeSec) * TIME_BONUS_PER_SEC));
    this.levelScore = Math.max(0, this.matchScore - this.mistakes * MISTAKE_PENALTY) + clearBonus + timeBonus;
    const stars = calcStars(this.config.pairs, this.mistakes, timeSec, this.config.parTimeSec);

    const result = {
      level: this.config.level,
      score: this.levelScore,
      stars,
      timeSec,
      flips: this.flips,
      mistakes: this.mistakes,
      matches: this.matches,
      pairs: this.config.pairs,
      maxCombo: this.maxCombo,
      clearBonus,
      timeBonus,
      parTimeSec: this.config.parTimeSec,
    };

    this.emit("match", { cards: this.cards.filter((c) => c.matched).slice(-2), gained: lastGained, combo: this.combo, cleared: true, ...this.snapshot() });
    this.emit("clear", result);
    this.emit("update", this.snapshot());
  }

  destroy() {
    this.clearTimers();
    this.listeners = {};
  }
}
