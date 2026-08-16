import { DEFAULT_PLAYER_NAME } from "./config.js";

const PREFIX = "memoryfood:";
const SETTINGS_KEY = `${PREFIX}settings`;
const RECORDS_KEY = `${PREFIX}records`;
const LEADERBOARD_KEY = `${PREFIX}leaderboard`;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings() {
  const s = read(SETTINGS_KEY, {});
  return {
    playerName: typeof s.playerName === "string" && s.playerName.trim() ? s.playerName.trim() : "",
    sfx: s.sfx !== false,
    bgm: s.bgm !== false,
  };
}

export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial };
  if (typeof next.playerName === "string") next.playerName = next.playerName.trim();
  write(SETTINGS_KEY, next);
  return next;
}

export function getPlayerName() {
  return getSettings().playerName || DEFAULT_PLAYER_NAME;
}

export function getRecords() {
  return read(RECORDS_KEY, []);
}

export function addRecord(record) {
  const list = [record, ...getRecords()].slice(0, 20);
  write(RECORDS_KEY, list);
  return list;
}

export function getLeaderboard() {
  return read(LEADERBOARD_KEY, []);
}

export function addLeaderboardEntry(entry) {
  const list = [...getLeaderboard(), entry]
    .sort((a, b) => b.score - a.score || a.time - b.time)
    .slice(0, 10);
  write(LEADERBOARD_KEY, list);
  return list;
}
