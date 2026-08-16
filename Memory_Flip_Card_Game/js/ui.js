import { FLYING_EMOJIS, formatTime, MAX_STARS, MAX_LEVEL } from "./config.js";

const screens = {
  home: document.querySelector("#screen-home"),
  game: document.querySelector("#screen-game"),
  final: document.querySelector("#screen-final"),
  leaderboard: document.querySelector("#screen-leaderboard"),
  records: document.querySelector("#screen-records"),
  settings: document.querySelector("#screen-settings"),
};

const modals = {
  name: document.querySelector("#modal-name"),
  boss: document.querySelector("#modal-boss"),
  clear: document.querySelector("#modal-clear"),
  leave: document.querySelector("#modal-leave"),
};

const els = {
  board: document.querySelector("#board"),
  hudLevel: document.querySelector("#hud-level"),
  hudScore: document.querySelector("#hud-score"),
  hudTime: document.querySelector("#hud-time"),
  hudPairs: document.querySelector("#hud-pairs"),
  hudFlips: document.querySelector("#hud-flips"),
  hudMistakes: document.querySelector("#hud-mistakes"),
  hudCombo: document.querySelector("#hud-combo"),
  progressText: document.querySelector("#progress-text"),
  progressBar: document.querySelector("#progress-bar"),
  progressFill: document.querySelector("#progress-fill"),
  progressSteps: document.querySelector("#progress-steps"),
  clearProgress: document.querySelector("#clear-progress"),
  landscapeHint: document.querySelector("#landscape-hint"),
  previewBanner: document.querySelector("#preview-banner"),
  previewCount: document.querySelector("#preview-count"),
  comboToast: document.querySelector("#combo-toast"),
  clearStars: document.querySelector("#clear-stars"),
  clearScore: document.querySelector("#clear-score"),
  clearQuote: document.querySelector("#clear-quote"),
  btnNext: document.querySelector("#btn-next"),
  finalTitle: document.querySelector("#final-title"),
  finalScore: document.querySelector("#final-score"),
  finalTime: document.querySelector("#final-time"),
  finalStars: document.querySelector("#final-stars"),
  finalCombo: document.querySelector("#final-combo"),
  finalMistakes: document.querySelector("#final-mistakes"),
  finalAccuracy: document.querySelector("#final-accuracy"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  recordsList: document.querySelector("#records-list"),
  settingName: document.querySelector("#setting-name"),
  settingSfx: document.querySelector("#setting-sfx"),
  settingBgm: document.querySelector("#setting-bgm"),
  nameInput: document.querySelector("#name-input"),
  confetti: document.querySelector("#confetti"),
  flyLayer: document.querySelector("#fly-layer"),
};

let confettiRaf = 0;
let confettiBits = [];

export function showScreen(name) {
  for (const screen of Object.values(screens)) screen.classList.remove("active");
  screens[name].classList.add("active");
  if (name !== "game") hideAllModals();
}

export function showModal(name) {
  modals[name].classList.remove("hidden");
}

export function hideModal(name) {
  modals[name].classList.add("hidden");
}

export function hideAllModals() {
  for (const modal of Object.values(modals)) modal.classList.add("hidden");
}

export function renderBoard(cards, cols, { previewing = false, onFlip } = {}) {
  els.board.style.setProperty("--cols", String(cols));
  els.board.replaceChildren();

  for (const card of cards) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.dataset.id = String(card.id);
    btn.setAttribute("aria-label", card.flipped || card.matched ? card.name : "未翻開的卡片");
    if (card.flipped || card.matched) btn.classList.add("is-flipped");
    if (card.matched) btn.classList.add("is-matched");
    if (previewing) btn.tabIndex = -1;

    btn.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back">🍴</div>
        <div class="card-face card-front">${card.image
          ? `<img src="${card.image}" alt="${card.name}" draggable="false">`
          : card.icon}</div>
      </div>
    `;
    btn.addEventListener("click", () => onFlip?.(card.id));
    els.board.appendChild(btn);
  }
}

export function syncCards(cards) {
  for (const card of cards) {
    const el = els.board.querySelector(`[data-id="${card.id}"]`);
    if (!el) continue;
    el.classList.toggle("is-flipped", card.flipped || card.matched);
    el.classList.toggle("is-matched", card.matched);
    el.setAttribute("aria-label", card.flipped || card.matched ? card.name : "未翻開的卡片");
  }
}

export function markMiss(ids) {
  for (const id of ids) {
    const el = els.board.querySelector(`[data-id="${id}"]`);
    if (!el) continue;
    el.classList.add("is-miss");
    setTimeout(() => el.classList.remove("is-miss"), 360);
  }
}

export function updateHud({ level, score, timeSec, matches, pairs, flips, mistakes, combo }) {
  els.hudLevel.textContent = `Lv.${level}`;
  els.hudScore.textContent = String(score);
  els.hudTime.textContent = formatTime(timeSec);
  els.hudPairs.textContent = `${matches} / ${pairs}`;
  els.hudFlips.textContent = String(flips);
  els.hudMistakes.textContent = String(mistakes);
  els.hudCombo.textContent = String(combo);
  updateProgress(level, matches, pairs);
}

function ensureProgressSteps() {
  if (els.progressSteps.children.length === MAX_LEVEL) return;
  els.progressSteps.style.gridTemplateColumns = `repeat(${MAX_LEVEL}, 1fr)`;
  els.progressSteps.replaceChildren();
  for (let i = 1; i <= MAX_LEVEL; i++) {
    const li = document.createElement("li");
    li.dataset.step = String(i);
    li.textContent = String(i);
    els.progressSteps.appendChild(li);
  }
}

function updateProgress(level, matches = 0, pairs = 0) {
  ensureProgressSteps();
  const frac = pairs > 0 ? matches / pairs : 0;
  const value = Math.min(MAX_LEVEL, (level - 1) + frac);
  const pct = (value / MAX_LEVEL) * 100;
  els.progressText.textContent = `${level} / ${MAX_LEVEL}`;
  els.progressFill.style.width = `${pct}%`;
  els.progressBar.setAttribute("aria-valuenow", String(Number(value.toFixed(2))));
  els.progressBar.setAttribute("aria-valuemax", String(MAX_LEVEL));
  els.progressBar.setAttribute("aria-label", `第 ${level} 關，共 ${MAX_LEVEL} 關`);
  for (const li of els.progressSteps.children) {
    const step = Number(li.dataset.step);
    li.classList.toggle("is-done", step < level);
    li.classList.toggle("is-current", step === level);
  }
}

export function setLandscapeHint(show) {
  els.landscapeHint.classList.toggle("hidden", !show);
}

export function setPreview(show, remainSec = 0) {
  els.previewBanner.classList.toggle("is-on", show);
  els.previewBanner.setAttribute("aria-hidden", show ? "false" : "true");
  if (show) updatePreviewCount(remainSec);
}

export function updatePreviewCount(remainSec) {
  const next = String(remainSec);
  if (els.previewCount.textContent === next) return;
  els.previewCount.textContent = next;
  els.previewCount.classList.remove("pop");
  void els.previewCount.offsetWidth;
  els.previewCount.classList.add("pop");
}

export function showComboToast(text) {
  els.comboToast.textContent = text;
  els.comboToast.classList.remove("show");
  void els.comboToast.offsetWidth;
  els.comboToast.classList.add("show");
}

export function renderClear({ stars, score, quote, isBoss, level }) {
  els.clearStars.innerHTML = Array.from({ length: 3 }, (_, i) =>
    i < stars ? `<span class="star-on" style="animation-delay:${i * 0.12}s">⭐</span>` : `<span style="opacity:.25">⭐</span>`
  ).join("");
  animateNumber(els.clearScore, 0, score, 700, (n) => `+${n}`);
  els.clearQuote.textContent = quote;
  els.btnNext.textContent = isBoss ? "查看最終評價" : "下一關";
  const left = MAX_LEVEL - level;
  els.clearProgress.textContent = isBoss
    ? `進度 ${level} / ${MAX_LEVEL}　全部完成！`
    : `進度 ${level} / ${MAX_LEVEL}　還有 ${left} 關`;
}

export function renderFinal(summary) {
  els.finalTitle.textContent = `${summary.title.icon} ${summary.title.name}`;
  animateNumber(els.finalScore, 0, summary.score, 900);
  els.finalTime.textContent = formatTime(summary.timeSec);
  els.finalStars.textContent = `${summary.stars} / ${MAX_STARS}`;
  els.finalCombo.textContent = String(summary.maxCombo);
  els.finalMistakes.textContent = String(summary.mistakes);
  els.finalAccuracy.textContent = `${Math.round(summary.accuracy * 100)}%`;
}

export function renderLeaderboard(list) {
  if (!list.length) {
    els.leaderboardList.innerHTML = `<p class="empty-note">還沒有紀錄。去當第一位美食記憶王吧！</p>`;
    return;
  }
  const medals = ["🥇", "🥈", "🥉"];
  els.leaderboardList.innerHTML = list
    .map(
      (row, i) => `
      <div class="table-row">
        <div class="rank">${medals[i] ?? i + 1}</div>
        <div>
          <b>${escapeHtml(row.playerName)}</b>
          <small>${row.title} · ${formatTime(row.time)} · ${row.stars}⭐</small>
        </div>
        <strong>${row.score}</strong>
      </div>`
    )
    .join("");
}

export function renderRecords(list) {
  if (!list.length) {
    els.recordsList.innerHTML = `<p class="empty-note">尚無遊戲紀錄。</p>`;
    return;
  }
  els.recordsList.innerHTML = list
    .map(
      (row) => `
      <div class="table-row">
        <div class="rank">🍰</div>
        <div>
          <b>${escapeHtml(row.playerName)}</b>
          <small>${row.date} · ${row.title} · Combo ${row.maxCombo} · 錯誤 ${row.mistakes}</small>
        </div>
        <strong>${row.score}</strong>
      </div>`
    )
    .join("");
}

export function fillSettings(settings) {
  els.settingName.value = settings.playerName;
  els.settingSfx.checked = settings.sfx;
  els.settingBgm.checked = settings.bgm;
}

export function readSettingsForm() {
  return {
    playerName: els.settingName.value.trim(),
    sfx: els.settingSfx.checked,
    bgm: els.settingBgm.checked,
  };
}

export function readNameInput() {
  return els.nameInput.value.trim();
}

export function setNameInput(value) {
  els.nameInput.value = value;
}

function animateNumber(el, from, to, dur, format = String) {
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

export function burstCelebrate() {
  spawnConfetti();
  spawnFlyingFood();
}

function spawnFlyingFood() {
  els.flyLayer.replaceChildren();
  FLYING_EMOJIS.forEach((icon, i) => {
    const span = document.createElement("span");
    span.className = "fly-emoji";
    span.textContent = icon;
    span.style.setProperty("--y", `${20 + (i * 7) % 60}vh`);
    span.style.top = "0";
    span.style.animationDelay = `${i * 0.08}s`;
    els.flyLayer.appendChild(span);
  });
  setTimeout(() => els.flyLayer.replaceChildren(), 2200);
}

function spawnConfetti() {
  const canvas = els.confetti;
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ["#ff8fab", "#f4a261", "#80cbc4", "#ffd54f", "#c2185b", "#fff6e8"];
  confettiBits = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * 80,
    r: 4 + Math.random() * 5,
    c: colors[Math.floor(Math.random() * colors.length)],
    v: 2 + Math.random() * 4,
    w: Math.random() * 6,
  }));
  cancelAnimationFrame(confettiRaf);
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const b of confettiBits) {
      b.y += b.v;
      b.x += Math.sin(b.y / 18) * 0.8;
      if (b.y < canvas.height + 12) alive = true;
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, b.y, b.r, b.r * 0.6);
    }
    if (alive) confettiRaf = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  tick();
}
