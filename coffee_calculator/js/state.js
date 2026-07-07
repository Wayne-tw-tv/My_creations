const STORAGE_KEY = 'coffeeRatioPro_v1';

export function createDefaultState() {
  return {
    lastBrew: null,
    favorites: [],
    records: [],
    calculatorState: {
      mode: 'coffee',
      coffeeG: 18,
      waterMl: 288,
      ratio: 16,
      strength: 50,
      methodId: 'v60',
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return { ...createDefaultState(), ...JSON.parse(raw) };
  } catch {
    return createDefaultState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function updateCalculatorState(state, calcState) {
  state.calculatorState = { ...state.calculatorState, ...calcState };
  saveState(state);
}

export function setLastBrew(state, brew) {
  state.lastBrew = { ...brew, savedAt: new Date().toISOString() };
  saveState(state);
}

export function addFavorite(state, favorite) {
  state.favorites.unshift(favorite);
  saveState(state);
}

export function removeFavorite(state, id) {
  state.favorites = state.favorites.filter((f) => f.id !== id);
  saveState(state);
}

export function addRecord(state, record) {
  state.records.unshift(record);
  saveState(state);
}

export function removeRecord(state, id) {
  state.records = state.records.filter((r) => r.id !== id);
  saveState(state);
}
