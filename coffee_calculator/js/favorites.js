import { renderEmptyState, stopPropagation } from './ui.js';
import { formatRatio } from './calculator.js';
import { getMethodLabelById } from './brew-methods.js';

let onLoadFavorite = null;

export function setOnLoadFavorite(callback) {
  onLoadFavorite = callback;
}

export function renderFavorites(container, favorites) {
  if (!favorites.length) {
    renderEmptyState(container, '⭐', '還沒有收藏配方，在計算器頁面收藏吧');
    return;
  }

  container.innerHTML = favorites
    .map(
      (f) => `
    <div class="list-item" data-favorite-id="${f.id}">
      <div class="list-item-header">
        <span class="list-item-title">${f.name}</span>
        <span class="list-item-date">${getMethodLabelById(f.methodId) || f.method}</span>
      </div>
      <div class="list-item-meta">
        ${f.coffeeG}g · ${f.waterMl}ml · ${formatRatio(f.ratio)} · ${f.temp}
      </div>
      <div class="list-item-actions">
        <button class="btn btn-danger btn-delete-fav" data-id="${f.id}" type="button">刪除</button>
      </div>
    </div>
  `
    )
    .join('');

  queryAll('.list-item', container).forEach((item) => {
    item.addEventListener('click', () => {
      const fav = favorites.find((f) => f.id === item.dataset.favoriteId);
      if (fav && onLoadFavorite) onLoadFavorite(fav);
    });
  });

  queryAll('.btn-delete-fav', container).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      stopPropagation(e);
      if (onDeleteFavorite) onDeleteFavorite(btn.dataset.id);
    });
  });
}

let onDeleteFavorite = null;

export function setOnDeleteFavorite(callback) {
  onDeleteFavorite = callback;
}

function queryAll(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}
