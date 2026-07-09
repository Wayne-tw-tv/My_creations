import {
  loadState,
  generateId,
  updateCalculatorState,
  setLastBrew,
  addFavorite,
  removeFavorite,
  addRecord,
  removeRecord,
} from './state.js';
import {
  formatRatio,
  formatCoffee,
  formatWater,
  round,
  strengthToRatio,
  ratioToStrength,
  getStrengthLabel,
  computeFromCoffee,
  computeFromWater,
  getVisualCoffeePercent,
  validateCoffeeG,
  validateWaterMl,
  validateRatio,
  getMethodRatioBounds,
  getRatioStep,
  getCurrentCalcSnapshot,
} from './calculator.js';
import {
  loadBrewMethods,
  getMethodById,
  getMethodLabel,
  getMethodLabelById,
  getCategoryDefaultMethodId,
  populateMethodSelect,
  renderMethodGrid,
  hideMethodDetail,
  updateBrewParams,
  setOnUseMethod,
} from './brew-methods.js';
import {
  renderFavorites,
  setOnLoadFavorite,
  setOnDeleteFavorite,
} from './favorites.js';
import {
  renderRecords,
  setOnLoadRecord,
  setOnDeleteRecord,
} from './records.js';
import {
  $,
  $$,
  showView,
  openModal,
  closeModal,
  renderLastBrew,
  setStarRating,
  getStarRating,
} from './ui.js';

let state = loadState();
let selectedCategory = '手沖';
let calcMode = 'coffee';
let currentMethodId = state.calculatorState.methodId;
let isSyncingSliders = false;

const els = {};

function cacheElements() {
  els.inputCoffee = $('#input-coffee-g');
  els.inputWater = $('#input-water-ml');
  els.inputCoffeeGroup = $('#input-coffee');
  els.inputWaterGroup = $('#input-water');
  els.resultRatio = $('#result-ratio');
  els.resultSecondary = $('#result-secondary');
  els.resultSecondaryLabel = $('#result-secondary-label');
  els.ratioSlider = $('#ratio-slider');
  els.ratioSliderValue = $('#ratio-slider-value');
  els.strengthSlider = $('#strength-slider');
  els.strengthLabel = $('#strength-label');
  els.visualCoffee = $('#visual-coffee');
  els.visualWater = $('#visual-water');
  els.ratioBarCoffee = $('#ratio-bar-coffee');
  els.methodSelect = $('#calc-method-select');
  els.lastBrewContent = $('#last-brew-content');
  els.favoritesList = $('#favorites-list');
  els.recordsList = $('#records-list');
  els.methodGrid = $('#method-grid');
  els.favoriteName = $('#favorite-name');
  els.recordNotes = $('#record-notes');
  els.recordStars = $('#record-stars');
}

function getCurrentMethod() {
  return getMethodById(currentMethodId) || getMethodById('v60');
}

function syncRatioSliderBounds(method, ratio) {
  const { min, max } = getMethodRatioBounds(method);
  const step = getRatioStep(min, max);
  const clamped = validateRatio(ratio ?? els.ratioSlider.value, method);

  els.ratioSlider.min = min;
  els.ratioSlider.max = max;
  els.ratioSlider.step = step;
  els.ratioSlider.value = clamped;

  const ticks = els.ratioSlider.parentElement?.querySelector('.slider-ticks');
  if (ticks) {
    const midLow = round(min + (max - min) / 3, 1);
    const midHigh = round(min + ((max - min) * 2) / 3, 1);
    ticks.innerHTML = `
      <span>${formatRatio(min)}</span>
      <span>${formatRatio(midLow)}</span>
      <span>${formatRatio(midHigh)}</span>
      <span>${formatRatio(max)}</span>
    `;
  }

  return clamped;
}

function getCalcValues() {
  const method = getCurrentMethod();
  const ratio = validateRatio(els.ratioSlider.value, method);
  if (calcMode === 'coffee') {
    const coffeeG = validateCoffeeG(els.inputCoffee.value);
    const { waterMl } = computeFromCoffee(coffeeG, ratio);
    return { coffeeG, waterMl, ratio };
  }
  const waterMl = validateWaterMl(els.inputWater.value);
  const { coffeeG } = computeFromWater(waterMl, ratio);
  return { coffeeG, waterMl, ratio };
}

function updateCalculatorUI() {
  const method = getCurrentMethod();
  const { coffeeG, waterMl, ratio } = getCalcValues();

  els.resultRatio.textContent = formatRatio(ratio);
  els.ratioSliderValue.textContent = formatRatio(ratio);

  if (calcMode === 'coffee') {
    els.resultSecondaryLabel.textContent = '水量';
    els.resultSecondary.textContent = formatWater(waterMl);
    els.inputWater.value = Math.round(waterMl);
  } else {
    els.resultSecondaryLabel.textContent = '咖啡粉';
    els.resultSecondary.textContent = formatCoffee(coffeeG);
    els.inputCoffee.value = round(coffeeG, 1);
  }

  els.visualCoffee.textContent = formatCoffee(coffeeG);
  els.visualWater.textContent = `${Math.round(waterMl)}ml`;
  els.ratioBarCoffee.style.width = `${getVisualCoffeePercent(coffeeG, waterMl)}%`;

  updateBrewParams(method);

  if (!isSyncingSliders) {
    isSyncingSliders = true;
    els.ratioSlider.value = ratio;
    const strength = ratioToStrength(ratio, method);
    els.strengthSlider.value = Math.round(strength);
    els.strengthLabel.textContent = getStrengthLabel(strength);
    isSyncingSliders = false;
  }

  updateCalculatorState(state, {
    mode: calcMode,
    coffeeG: round(coffeeG, 1),
    waterMl: Math.round(waterMl),
    ratio: round(ratio, 1),
    strength: Math.round(ratioToStrength(ratio, method)),
    methodId: currentMethodId,
  });
}

function setCalcMode(mode) {
  calcMode = mode;
  $$('#calc-tabs .tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  els.inputCoffeeGroup.classList.toggle('hidden', mode !== 'coffee');
  els.inputWaterGroup.classList.toggle('hidden', mode !== 'water');
  updateCalculatorUI();
}

function loadCalculatorFromSnapshot(snapshot) {
  currentMethodId = snapshot.methodId || currentMethodId;
  populateMethodSelect(els.methodSelect, currentMethodId);

  const method = getCurrentMethod();
  const ratio = validateRatio(snapshot.ratio, method);
  isSyncingSliders = true;
  syncRatioSliderBounds(method, ratio);
  els.strengthSlider.value = Math.round(ratioToStrength(ratio, method));
  isSyncingSliders = false;

  els.inputCoffee.value = snapshot.coffeeG;
  els.inputWater.value = snapshot.waterMl;

  if (snapshot.mode) {
    setCalcMode(snapshot.mode);
  } else {
    updateCalculatorUI();
  }
}

function applyMethod(method, navigate = true) {
  currentMethodId = method.id;
  populateMethodSelect(els.methodSelect, currentMethodId);

  isSyncingSliders = true;
  syncRatioSliderBounds(method, method.ratioDefault);
  els.strengthSlider.value = Math.round(ratioToStrength(method.ratioDefault, method));
  isSyncingSliders = false;

  updateCalculatorUI();

  if (navigate) {
    hideMethodDetail();
    showView('calculator');
  }
}

function refreshHome() {
  const brew = state.lastBrew
    ? {
        ...state.lastBrew,
        method: getMethodLabelById(state.lastBrew.methodId) || state.lastBrew.method,
      }
    : null;
  renderLastBrew(els.lastBrewContent, brew);
}

function refreshFavorites() {
  renderFavorites(els.favoritesList, state.favorites);
}

function refreshRecords() {
  renderRecords(els.recordsList, state.records);
}

function bindNavigation() {
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.nav;
      showView(view);
      if (view === 'home') refreshHome();
      if (view === 'favorites') refreshFavorites();
      if (view === 'records') refreshRecords();
      if (view === 'methods') hideMethodDetail();
    });
  });
}

function bindHome() {
  $$('.category-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.category-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedCategory = chip.dataset.category;
    });
  });

  $('#btn-start-calc').addEventListener('click', () => {
    const methodId = getCategoryDefaultMethodId(selectedCategory);
    const method = getMethodById(methodId);
    if (method) applyMethod(method);
    showView('calculator');
  });
}

function bindCalculator() {
  $$('#calc-tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => setCalcMode(tab.dataset.mode));
  });

  els.inputCoffee.addEventListener('input', () => {
    els.inputCoffee.value = validateCoffeeG(els.inputCoffee.value);
    updateCalculatorUI();
  });

  els.inputWater.addEventListener('input', () => {
    els.inputWater.value = validateWaterMl(els.inputWater.value);
    updateCalculatorUI();
  });

  els.ratioSlider.addEventListener('input', () => {
    if (isSyncingSliders) return;
    const method = getCurrentMethod();
    isSyncingSliders = true;
    const ratio = validateRatio(els.ratioSlider.value, method);
    const strength = ratioToStrength(ratio, method);
    els.strengthSlider.value = Math.round(strength);
    els.strengthLabel.textContent = getStrengthLabel(strength);
    isSyncingSliders = false;
    updateCalculatorUI();
  });

  els.strengthSlider.addEventListener('input', () => {
    if (isSyncingSliders) return;
    const method = getCurrentMethod();
    const strength = parseInt(els.strengthSlider.value, 10);
    els.strengthLabel.textContent = getStrengthLabel(strength);
    isSyncingSliders = true;
    els.ratioSlider.value = round(strengthToRatio(strength, method), 1);
    isSyncingSliders = false;
    updateCalculatorUI();
  });

  els.methodSelect.addEventListener('change', () => {
    const method = getMethodById(els.methodSelect.value);
    if (method) applyMethod(method, false);
  });

  $('#btn-save-favorite').addEventListener('click', () => {
    els.favoriteName.value = '';
    openModal('modal-favorite');
    els.favoriteName.focus();
  });

  $('#btn-save-record').addEventListener('click', () => {
    els.recordNotes.value = '';
    setStarRating(els.recordStars, 0);
    $('#record-rating-hint')?.classList.add('hidden');
    openModal('modal-record');
  });

  $('#btn-cancel-favorite').addEventListener('click', () => closeModal('modal-favorite'));
  $('#btn-cancel-record').addEventListener('click', () => closeModal('modal-record'));

  $('#btn-confirm-favorite').addEventListener('click', () => {
    const name = els.favoriteName.value.trim();
    if (!name) {
      els.favoriteName.focus();
      return;
    }
    const method = getCurrentMethod();
    const { coffeeG, waterMl, ratio } = getCalcValues();
    addFavorite(state, {
      id: generateId(),
      name,
      method: getMethodLabel(method),
      methodId: method.id,
      coffeeG: round(coffeeG, 1),
      waterMl: Math.round(waterMl),
      ratio: round(ratio, 1),
      temp: method.temp,
      grind: method.grind,
      time: method.time,
      createdAt: new Date().toISOString(),
    });
    closeModal('modal-favorite');
    refreshFavorites();
  });

  $('#btn-confirm-record').addEventListener('click', () => {
    const rating = getStarRating(els.recordStars);
    const hint = $('#record-rating-hint');
    if (rating < 1) {
      hint?.classList.remove('hidden');
      return;
    }
    hint?.classList.add('hidden');
    const method = getCurrentMethod();
    const { coffeeG, waterMl, ratio } = getCalcValues();
    const snapshot = getCurrentCalcSnapshot(method, calcMode, coffeeG, waterMl, ratio);
    snapshot.method = getMethodLabel(method);
    addRecord(state, {
      id: generateId(),
      ...snapshot,
      rating,
      notes: els.recordNotes.value.trim(),
      createdAt: new Date().toISOString(),
    });
    setLastBrew(state, snapshot);
    closeModal('modal-record');
    refreshHome();
    refreshRecords();
  });

  $$('.star', els.recordStars).forEach((star) => {
    star.addEventListener('click', () => {
      setStarRating(els.recordStars, parseInt(star.dataset.rating, 10));
      $('#record-rating-hint')?.classList.add('hidden');
    });
  });
}

function bindModals() {
  ['modal-favorite', 'modal-record'].forEach((id) => {
    $(`#${id}`).addEventListener('click', (e) => {
      if (e.target.id === id) closeModal(id);
    });
  });
}

function bindMethods() {
  $('#btn-method-back').addEventListener('click', hideMethodDetail);
  setOnUseMethod((method) => applyMethod(method));
}

function bindFavoritesAndRecords() {
  setOnLoadFavorite((fav) => {
    loadCalculatorFromSnapshot({
      methodId: fav.methodId,
      coffeeG: fav.coffeeG,
      waterMl: fav.waterMl,
      ratio: fav.ratio,
      mode: 'coffee',
    });
    showView('calculator');
  });

  setOnDeleteFavorite((id) => {
    removeFavorite(state, id);
    refreshFavorites();
  });

  setOnLoadRecord((rec) => {
    loadCalculatorFromSnapshot({
      methodId: rec.methodId,
      coffeeG: rec.coffeeG,
      waterMl: rec.waterMl,
      ratio: rec.ratio,
      mode: 'coffee',
    });
    showView('calculator');
  });

  setOnDeleteRecord((id) => {
    removeRecord(state, id);
    refreshRecords();
  });
}

async function init() {
  cacheElements();
  await loadBrewMethods();

  populateMethodSelect(els.methodSelect, state.calculatorState.methodId);
  renderMethodGrid(els.methodGrid);

  currentMethodId = state.calculatorState.methodId;
  calcMode = state.calculatorState.mode;

  els.inputCoffee.value = state.calculatorState.coffeeG;
  els.inputWater.value = state.calculatorState.waterMl;

  const method = getCurrentMethod();
  isSyncingSliders = true;
  const ratio = syncRatioSliderBounds(method, state.calculatorState.ratio);
  const strength = Math.round(ratioToStrength(ratio, method));
  els.strengthSlider.value = strength;
  els.strengthLabel.textContent = getStrengthLabel(strength);
  isSyncingSliders = false;

  setCalcMode(calcMode);
  refreshHome();
  refreshFavorites();
  refreshRecords();

  bindNavigation();
  bindHome();
  bindCalculator();
  bindModals();
  bindMethods();
  bindFavoritesAndRecords();
}

init();
