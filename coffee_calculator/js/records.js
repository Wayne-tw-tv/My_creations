import { renderEmptyState, stopPropagation } from './ui.js';
import { formatRatio, formatDate, formatStars } from './calculator.js';
import { getMethodLabelById } from './brew-methods.js';

let onLoadRecord = null;
let onDeleteRecord = null;

export function setOnLoadRecord(callback) {
  onLoadRecord = callback;
}

export function setOnDeleteRecord(callback) {
  onDeleteRecord = callback;
}

export function renderRecords(container, records) {
  if (!records.length) {
    renderEmptyState(container, '📝', '還沒有沖煮紀錄，完成一次沖煮後儲存吧');
    return;
  }

  container.innerHTML = records
    .map(
      (r) => `
    <div class="list-item" data-record-id="${r.id}">
      <div class="list-item-header">
        <span class="list-item-title">${getMethodLabelById(r.methodId) || r.method}</span>
        <span class="list-item-date">${formatDate(r.createdAt)}</span>
      </div>
      <div class="list-item-meta">
        ${r.coffeeG}g · ${r.waterMl}ml · ${formatRatio(r.ratio)} · ${formatStars(r.rating)}
      </div>
      ${r.notes ? `<p class="list-item-notes">${escapeHtml(r.notes)}</p>` : ''}
      <div class="list-item-actions">
        <button class="btn btn-danger btn-delete-rec" data-id="${r.id}" type="button">刪除</button>
      </div>
    </div>
  `
    )
    .join('');

  container.querySelectorAll('.list-item').forEach((item) => {
    item.addEventListener('click', () => {
      const rec = records.find((r) => r.id === item.dataset.recordId);
      if (rec && onLoadRecord) onLoadRecord(rec);
    });
  });

  container.querySelectorAll('.btn-delete-rec').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      stopPropagation(e);
      if (onDeleteRecord) onDeleteRecord(btn.dataset.id);
    });
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
