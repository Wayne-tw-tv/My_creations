import { LEVELS, MAX_LEVEL, MAX_STARS, DEFAULT_PLAYER_NAME, randomQuote, comboLabel, getTitle, calcFinalScore100 } from "./config.js";
import { MemoryGame } from "./game.js";
import { audio } from "./audio.js";
import * as storage from "./storage.js";
import * as ui from "./ui.js";

const game = new MemoryGame();
const session = {
  results: [],
  currentLevel: 1,
  seenBoss: false,
};

let pendingBegin = null;
let bossTimer = 0;
let lastPreviewSec = 0;

function unlockAudio() {
  audio.init();
  audio.setSfx(storage.getSettings().sfx);
}

function completedScore() {
  return session.results.reduce((sum, r) => sum + r.score, 0);
}

function liveScore(snap) {
  return completedScore() + (snap?.levelScore ?? 0);
}

function bindGameEvents() {
  game.on("update", (snap) => {
    ui.syncCards(snap.cards);
    ui.updateHud({
      level: snap.config.level,
      score: liveScore(snap),
      timeSec: snap.timeSec,
      matches: snap.matches,
      pairs: snap.pairs,
      flips: snap.flips,
      mistakes: snap.mistakes,
      combo: snap.combo,
    });
  });

  game.on("tick", (snap) => {
    ui.updateHud({
      level: snap.config.level,
      score: liveScore(snap),
      timeSec: snap.timeSec,
      matches: snap.matches,
      pairs: snap.pairs,
      flips: snap.flips,
      mistakes: snap.mistakes,
      combo: snap.combo,
    });
  });

  game.on("flip", () => audio.flip());

  game.on("match", ({ combo, cleared }) => {
    audio.match(combo);
    if (combo >= 2) audio.combo(combo);
    ui.showComboToast(comboLabel(combo));
    if (cleared) {
      audio.clear();
      ui.burstCelebrate();
    }
  });

  game.on("miss", ({ cards }) => {
    audio.miss();
    ui.markMiss(cards.map((c) => c.id));
  });

  game.on("previewStart", (snap) => {
    lastPreviewSec = snap.previewRemainSec;
    ui.setPreview(true, snap.previewRemainSec);
    audio.countdown(snap.previewRemainSec);
    ui.renderBoard(snap.cards, snap.config.cols, { previewing: true, onFlip: () => {} });
  });

  game.on("previewTick", (snap) => {
    if (snap.previewRemainSec > 0) {
      if (snap.previewRemainSec !== lastPreviewSec) {
        lastPreviewSec = snap.previewRemainSec;
        audio.countdown(snap.previewRemainSec);
      }
      ui.updatePreviewCount(snap.previewRemainSec);
    }
  });

  game.on("previewEnd", () => ui.setPreview(false));

  game.on("clear", (result) => {
    const idx = result.level - 1;
    session.results[idx] = result;
    session.results = session.results.slice(0, result.level);
    setTimeout(() => {
      ui.renderClear({
        stars: result.stars,
        score: result.score,
        quote: randomQuote(result.level),
        isBoss: result.level === MAX_LEVEL,
        level: result.level,
      });
      ui.showModal("clear");
    }, 700);
  });
}

function startLevel(level) {
  session.currentLevel = level;
  session.results = session.results.slice(0, level - 1);
  const config = LEVELS[level - 1];
  ui.hideAllModals();
  ui.showScreen("game");
  ui.setLandscapeHint(config.cols >= 8);
  ui.setPreview(false);
  ui.updateHud({
    level: config.level,
    score: completedScore(),
    timeSec: 0,
    matches: 0,
    pairs: config.pairs,
    flips: 0,
    mistakes: 0,
    combo: 0,
  });

  const settings = storage.getSettings();
  audio.setSfx(settings.sfx);
  audio.setBgm(settings.bgm);

  const begin = () => {
    pendingBegin = null;
    game.startLevel(config);
    ui.renderBoard(game.cards, config.cols, {
      previewing: config.previewMs > 0,
      onFlip: (id) => game.flip(id),
    });
  };

  if (config.isBoss && !session.seenBoss) {
    session.seenBoss = true;
    pendingBegin = begin;
    ui.showModal("boss");
    bossTimer = setTimeout(() => {
      bossTimer = 0;
      pendingBegin = null;
      ui.hideModal("boss");
      begin();
    }, 2800);
    return;
  }

  begin();
}

function requestStart() {
  unlockAudio();
  const settings = storage.getSettings();
  if (!settings.playerName) {
    ui.setNameInput(DEFAULT_PLAYER_NAME);
    ui.showModal("name");
    return;
  }
  session.results = [];
  session.seenBoss = false;
  startLevel(1);
}

function confirmName() {
  const name = ui.readNameInput() || DEFAULT_PLAYER_NAME;
  storage.saveSettings({ playerName: name });
  ui.hideModal("name");
  session.results = [];
  session.seenBoss = false;
  startLevel(1);
}

function nextFromClear() {
  const level = session.currentLevel;
  ui.hideModal("clear");
  if (level >= MAX_LEVEL) finishRun();
  else startLevel(level + 1);
}

function retryLevel() {
  ui.hideModal("clear");
  startLevel(session.currentLevel);
}

function finishRun() {
  const results = session.results;
  const totalStars = results.reduce((s, r) => s + r.stars, 0);
  const matches = results.reduce((s, r) => s + r.matches, 0);
  const mistakes = results.reduce((s, r) => s + r.mistakes, 0);
  const totalTimeSec = results.reduce((s, r) => s + r.timeSec, 0);
  const parTotalSec = results.reduce((s, r) => s + r.parTimeSec, 0);
  const maxCombo = Math.max(0, ...results.map((r) => r.maxCombo));
  const flips = results.reduce((s, r) => s + r.flips, 0);
  const score = results.reduce((s, r) => s + r.score, 0);
  const rating = calcFinalScore100({ totalStars, matches, mistakes, totalTimeSec, parTotalSec, maxCombo });
  const title = getTitle(rating);
  const accuracy = matches + mistakes === 0 ? 0 : matches / (matches + mistakes);

  const summary = {
    playerName: storage.getPlayerName(),
    score,
    stars: totalStars,
    timeSec: totalTimeSec,
    maxCombo,
    mistakes,
    flips,
    title,
    accuracy,
    date: new Date().toISOString().slice(0, 10),
  };

  storage.addRecord({
    date: summary.date,
    playerName: summary.playerName,
    score,
    levelsCleared: MAX_LEVEL,
    time: Math.round(totalTimeSec),
    flips,
    mistakes,
    maxCombo,
    stars: totalStars,
    title: `${title.icon} ${title.name}`,
  });

  storage.addLeaderboardEntry({
    playerName: summary.playerName,
    score,
    level: MAX_LEVEL,
    time: Math.round(totalTimeSec),
    title: `${title.icon} ${title.name}`,
    date: summary.date,
    stars: totalStars,
    maxCombo,
    mistakes,
  });

  audio.stopBgm();
  audio.victory();
  ui.burstCelebrate();
  ui.renderFinal(summary);
  ui.showScreen("final");
}

function openLeaderboard() {
  unlockAudio();
  ui.renderLeaderboard(storage.getLeaderboard());
  ui.showScreen("leaderboard");
}

function openRecords() {
  unlockAudio();
  ui.renderRecords(storage.getRecords());
  ui.showScreen("records");
}

function openSettings() {
  unlockAudio();
  ui.fillSettings(storage.getSettings());
  ui.showScreen("settings");
}

function saveSettings() {
  storage.saveSettings(ui.readSettingsForm());
  audio.setSfx(storage.getSettings().sfx);
  ui.showScreen("home");
}

function skipBoss() {
  if (bossTimer) clearTimeout(bossTimer);
  bossTimer = 0;
  ui.hideModal("boss");
  const fn = pendingBegin;
  pendingBegin = null;
  fn?.();
}

function goHome() {
  if (bossTimer) clearTimeout(bossTimer);
  bossTimer = 0;
  pendingBegin = null;
  game.reset();
  ui.hideAllModals();
  audio.stopBgm();
  ui.showScreen("home");
}

document.addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  unlockAudio();

  if (action === "start") requestStart();
  if (action === "confirm-name") confirmName();
  if (action === "leaderboard") openLeaderboard();
  if (action === "records") openRecords();
  if (action === "settings") openSettings();
  if (action === "save-settings") saveSettings();
  if (action === "home") goHome();
  if (action === "home-confirm") ui.showModal("leave");
  if (action === "leave-yes") goHome();
  if (action === "leave-no") ui.hideModal("leave");
  if (action === "next-level") nextFromClear();
  if (action === "retry-level") retryLevel();
  if (action === "skip-boss") skipBoss();
});

document.querySelector("#name-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") confirmName();
});

bindGameEvents();
ui.showScreen("home");
