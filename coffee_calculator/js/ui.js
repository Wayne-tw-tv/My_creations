export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function showView(viewId) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  $(`#view-${viewId}`)?.classList.add('active');

  $$('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.nav === viewId);
  });
}

export function openModal(id) {
  $(`#${id}`)?.classList.add('open');
}

export function closeModal(id) {
  $(`#${id}`)?.classList.remove('open');
}

export function renderEmptyState(container, icon, message) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

export function renderLastBrew(container, lastBrew) {
  if (!lastBrew) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem">尚無紀錄，開始你的第一杯吧</span>';
    return;
  }

  container.innerHTML = `
    <span class="last-brew-item">${lastBrew.method}</span>
    <span class="last-brew-item">${lastBrew.coffeeG}g</span>
    <span class="last-brew-item">${lastBrew.waterMl}ml</span>
    <span class="last-brew-item last-brew-ratio">1:${lastBrew.ratio.toFixed(1)}</span>
  `;
}

export function setStarRating(container, rating) {
  $$('.star', container).forEach((star) => {
    const r = parseInt(star.dataset.rating, 10);
    star.classList.toggle('active', r <= rating);
  });
  container.dataset.rating = rating;
}

export function getStarRating(container) {
  return parseInt(container.dataset.rating || '0', 10);
}

export function stopPropagation(e) {
  e.stopPropagation();
}
