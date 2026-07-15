export function renderStars(rating, max = 5) {
  const filled = Math.round(rating);
  let html = '';
  for (let i = 1; i <= max; i++) {
    html += `<span class="${i <= filled ? 'star-filled' : 'star-empty'}">★</span>`;
  }
  return html;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function showToast(title, message, icon, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'toast-overlay';
  overlay.innerHTML = `
    <div class="card card-glow toast-card">
      <div class="toast-icon">${icon}</div>
      <h2>${escapeHtml(title)}</h2>
      <p style="color: var(--text-secondary); margin: 0.75rem 0 1.5rem; white-space: pre-line">${escapeHtml(message)}</p>
      <button class="btn btn-primary" id="toast-close">太棒了！</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#toast-close').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });
}

export function updateHUD(state, stages, achievements) {
  const nameEl = document.getElementById('hud-name');
  const levelEl = document.getElementById('hud-level');
  const stageEl = document.getElementById('hud-stage');
  const achEl = document.getElementById('hud-achievements');

  if (!nameEl) return;

  const stage = stages.find((s) => s.id === state.currentStage);
  nameEl.textContent = state.playerName || '冒險者';
  levelEl.textContent = `Lv.${state.level}`;
  stageEl.textContent = stage ? stage.name : '—';
  achEl.textContent = `${state.unlockedAchievements.length}/${achievements.length}`;
}

export function getMatchClass(match) {
  if (match >= 0.85) return 'match-high';
  if (match >= 0.6) return 'match-medium';
  return 'match-low';
}

export function getMatchLabel(match) {
  if (match >= 0.85) return '高度匹配';
  if (match >= 0.6) return '有潛力';
  return '技能不足';
}

export function renderPointPool(used, total = 10) {
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<div class="point-dot ${i >= used ? 'unused' : ''}"></div>`;
  }
  return html;
}
