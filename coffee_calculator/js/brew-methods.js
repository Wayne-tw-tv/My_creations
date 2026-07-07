import { $, $$ } from './ui.js';
import { formatRatio } from './calculator.js';

let methods = [];
let onUseMethod = null;

export async function loadBrewMethods() {
  const res = await fetch('data/brew-methods.json');
  methods = await res.json();
  return methods;
}

export function getMethods() {
  return methods;
}

export function getMethodById(id) {
  return methods.find((m) => m.id === id);
}

export function getMethodLabel(method) {
  if (!method) return '';
  return method.nameZh ? `${method.name} ${method.nameZh}` : method.name;
}

export function getMethodLabelById(id) {
  return getMethodLabel(getMethodById(id)) || '';
}

export function getDefaultMethodForCategory(category) {
  return methods.find((m) => m.category === category) || methods[0];
}

export function getCategoryDefaultMethodId(category) {
  return getDefaultMethodForCategory(category)?.id || 'v60';
}

export function setOnUseMethod(callback) {
  onUseMethod = callback;
}

export function populateMethodSelect(selectEl, selectedId) {
  selectEl.innerHTML = methods
    .map(
      (m) =>
        `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${m.icon} ${getMethodLabel(m)}（${formatRatio(m.ratioDefault)}）</option>`
    )
    .join('');
}

export function renderMethodGrid(container) {
  container.innerHTML = methods
    .map(
      (m) => `
    <div class="method-card" data-method-id="${m.id}">
      <div class="method-icon">${m.icon}</div>
      <p class="method-name">${getMethodLabel(m)}</p>
      <p class="method-ratio">${formatRatio(m.ratioDefault)} · ${m.category}</p>
    </div>
  `
    )
    .join('');

  $$('.method-card', container).forEach((card) => {
    card.addEventListener('click', () => showMethodDetail(card.dataset.methodId));
  });
}

export function showMethodDetail(methodId) {
  const method = getMethodById(methodId);
  if (!method) return;

  const listView = $('#methods-list-view');
  const detailView = $('#methods-detail-view');
  const content = $('#method-detail-content');

  listView.classList.add('hidden');
  detailView.classList.remove('hidden');

  content.innerHTML = `
    <div class="method-detail-header">
      <span class="method-detail-icon">${method.icon}</span>
      <div>
        <h3>${getMethodLabel(method)}</h3>
        <p>${method.category} · ${method.description}</p>
      </div>
    </div>
    <div class="card">
      <div class="detail-row">
        <span class="detail-label">建議比例</span>
        <span class="detail-value">${formatRatio(method.ratioMin)} ~ ${formatRatio(method.ratioMax)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">預設比例</span>
        <span class="detail-value">${formatRatio(method.ratioDefault)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">水溫</span>
        <span class="detail-value">${method.temp}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">研磨</span>
        <span class="detail-value">${method.grind}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">時間</span>
        <span class="detail-value">${method.time}</span>
      </div>
    </div>
    <button class="btn btn-primary btn-block" id="btn-use-method" type="button" style="margin-top:16px">
      用此參數計算 →
    </button>
  `;

  $('#btn-use-method').addEventListener('click', () => {
    if (onUseMethod) onUseMethod(method);
  });
}

export function hideMethodDetail() {
  $('#methods-list-view')?.classList.remove('hidden');
  $('#methods-detail-view')?.classList.add('hidden');
}

export function updateBrewParams(method) {
  $('#param-temp').textContent = method.temp;
  $('#param-grind').textContent = method.grind;
  $('#param-time').textContent = method.time;
}
