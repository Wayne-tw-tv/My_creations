import { getTotalPoints, initAllocation } from './state.js';
import { renderPointPool } from './ui.js';

const TOTAL_POINTS = 10;

export function renderAllocation(container, subjects, allocation, onChange, options = {}) {
  const { strictAllocation = true } = options;
  const used = getTotalPoints(allocation, subjects);
  const remaining = TOTAL_POINTS - used;
  const canSubmit = strictAllocation ? remaining === 0 : true;

  let pointsClass = '';
  if (remaining === 0) pointsClass = 'ready';
  else if (remaining < 0) pointsClass = 'warning';
  else if (!strictAllocation && remaining > 0) pointsClass = 'waste';

  const submitLabel = strictAllocation
    ? remaining !== 0
      ? `還有 ${remaining} 點未分配`
      : '確認分配 ✓'
    : remaining > 0
      ? `確認分配（浪費 ${remaining} 點）→`
      : '確認分配 ✓';

  container.innerHTML = `
    ${
      !strictAllocation
        ? `<p class="allocation-hint">💡 自由模式：不必分配完 10 點也能進下一章，但<strong>未使用的點數會永久消失</strong>。</p>`
        : ''
    }
    <div class="remaining-points ${pointsClass}">
      剩餘技能點：<span class="count">${remaining}</span> / ${TOTAL_POINTS}
      ${!strictAllocation && remaining > 0 ? '<span class="waste-note">（將被浪費）</span>' : ''}
    </div>
    <div class="point-pool">${renderPointPool(used, TOTAL_POINTS)}</div>
    <div class="allocation-list">
      ${subjects
        .map(
          (s) => `
        <div class="allocation-row" data-subject="${s.id}">
          <span class="allocation-label">${s.icon} ${s.name}</span>
          <div class="allocation-controls">
            <button class="btn btn-sm btn-icon allocation-minus" data-id="${s.id}" ${(allocation[s.id] || 0) <= 0 ? 'disabled' : ''}>−</button>
            <span class="allocation-value" data-id="${s.id}">${allocation[s.id] || 0}</span>
            <button class="btn btn-sm btn-icon allocation-plus" data-id="${s.id}" ${remaining <= 0 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="nav-actions" style="margin-top: 1.5rem">
      <button class="btn btn-primary" id="submit-allocation" ${canSubmit ? '' : 'disabled'}>
        ${submitLabel}
      </button>
    </div>
  `;

  container.querySelectorAll('.allocation-plus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const current = allocation[id] || 0;
      const usedNow = getTotalPoints(allocation, subjects);
      if (usedNow >= TOTAL_POINTS) return;
      allocation[id] = current + 1;
      onChange(allocation);
    });
  });

  container.querySelectorAll('.allocation-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const current = allocation[id] || 0;
      if (current <= 0) return;
      allocation[id] = current - 1;
      onChange(allocation);
    });
  });

  container.querySelector('#submit-allocation')?.addEventListener('click', () => {
    const usedNow = getTotalPoints(allocation, subjects);
    if (strictAllocation && usedNow !== TOTAL_POINTS) return;
    if (usedNow > TOTAL_POINTS) return;
    onChange(allocation, true);
  });
}

export function renderTrackSelector(container, tracks, currentTrack, onSelect) {
  container.innerHTML = `
    <div class="track-selector">
      ${tracks
        .map(
          (t) => `
        <button class="btn track-btn ${t.id === currentTrack ? 'active' : ''}" data-track="${t.id}">
          ${t.icon} ${t.name}
        </button>
      `
        )
        .join('')}
    </div>
  `;

  container.querySelectorAll('.track-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      onSelect(btn.dataset.track);
    });
  });
}

export const HIGH_TRACKS = [
  { id: 'science', name: '自然組', icon: '🔬' },
  { id: 'social', name: '社會組', icon: '📜' },
  { id: 'vocational', name: '技術高中', icon: '⚙️' },
];

export const UNIVERSITY_TRACKS = [
  { id: 'tech', name: '資訊工程', icon: '💻' },
  { id: 'medical', name: '醫學系', icon: '🏥' },
  { id: 'business', name: '商管系', icon: '💼' },
  { id: 'arts', name: '設計系', icon: '🎨' },
];

export function ensureAllocation(allocation, subjects) {
  const base = initAllocation(subjects);
  return { ...base, ...allocation, track: allocation.track };
}

export { TOTAL_POINTS };
