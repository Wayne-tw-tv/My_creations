import { formatAbilityName, getAbilityLevel } from './career-engine.js';
import { renderStars, escapeHtml } from './ui.js';

export function renderRequirementList(requirements, abilityDefs, options = {}) {
  const { showValues = true, compact = false } = options;

  return Object.entries(requirements)
    .sort((a, b) => b[1] - a[1])
    .map(([abilityId, level]) => {
      const ab = abilityDefs.find((a) => a.id === abilityId);
      const name = ab ? ab.name : abilityId;
      const icon = ab ? ab.icon : '•';
      if (compact) {
        return `<span class="req-tag" title="${escapeHtml(name)} ${level}/5">${icon}${level}</span>`;
      }
      return `
        <div class="req-row">
          <span class="req-name">${icon} ${escapeHtml(name)}</span>
          <span class="req-stars">${renderStars(level)} <small class="req-level">${showValues ? level + '/5' : ''}</small></span>
        </div>
      `;
    })
    .join('');
}

export function renderCareerCatalog(container, careers, categories, abilityDefs, userAbilities = null) {
  let selectedCategory = 'all';
  let searchQuery = '';
  let viewMode = 'grid';

  container.innerHTML = `
    <div class="catalog-toolbar">
      <input class="input-text search-input" type="text" placeholder="搜尋職業名稱或描述..." id="catalog-search" />
      <div class="catalog-toolbar-row">
        <div class="category-tabs" id="catalog-category-tabs">
          <button class="btn btn-sm category-tab active" data-cat="all">全部 (${careers.length})</button>
          ${categories
            .map(
              (cat) => `
            <button class="btn btn-sm category-tab" data-cat="${cat.id}">${cat.name}</button>
          `
            )
            .join('')}
        </div>
        <div class="view-toggle" id="catalog-view-toggle">
          <button class="btn btn-sm active" data-view="grid">卡片</button>
          <button class="btn btn-sm" data-view="list">列表</button>
        </div>
      </div>
    </div>
    <p class="catalog-count" id="catalog-count"></p>
    <div id="catalog-results"></div>
  `;

  const searchInput = container.querySelector('#catalog-search');
  const countEl = container.querySelector('#catalog-count');
  const resultsEl = container.querySelector('#catalog-results');

  function updateToolbarState() {
    container.querySelectorAll('.category-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cat === selectedCategory);
    });
    container.querySelectorAll('[data-view]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewMode);
    });
  }

  function getFilteredCareers() {
    let filtered = careers;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (categories.find((cat) => cat.id === c.category)?.name || '').includes(q)
      );
    }
    return filtered;
  }

  function renderResults() {
    const filtered = getFilteredCareers();
    const grouped = categories
      .map((cat) => ({
        ...cat,
        careers: filtered.filter((c) => c.category === cat.id),
      }))
      .filter((g) => g.careers.length > 0);

    countEl.innerHTML = `共 <strong>${filtered.length}</strong> 種職業 · 能力值為 1～5 級（★ 越多需求越高）`;
    resultsEl.innerHTML =
      viewMode === 'grid'
        ? renderGrid(grouped, abilityDefs, userAbilities)
        : renderList(filtered, categories, abilityDefs);

    updateToolbarState();
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderResults();
  });

  container.querySelector('#catalog-category-tabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-tab');
    if (!btn) return;
    selectedCategory = btn.dataset.cat;
    renderResults();
  });

  container.querySelector('#catalog-view-toggle')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    viewMode = btn.dataset.view;
    renderResults();
  });

  renderResults();
}

function renderGrid(grouped, abilityDefs, userAbilities) {
  if (!grouped.length) {
    return '<p style="text-align:center;color:var(--text-muted);padding:2rem">找不到符合的職業</p>';
  }

  return grouped
    .map(
      (group) => `
    <section class="catalog-section">
      <h3 class="catalog-section-title">${group.name} <span class="catalog-section-count">${group.careers.length}</span></h3>
      <div class="catalog-grid">
        ${group.careers.map((c) => renderCareerCard(c, abilityDefs, userAbilities)).join('')}
      </div>
    </section>
  `
    )
    .join('');
}

function renderCareerCard(career, abilityDefs, userAbilities) {
  return `
    <article class="card catalog-card">
      <div class="catalog-card-header">
        <span class="catalog-icon">${career.icon}</span>
        <div>
          <h4>${escapeHtml(career.name)}</h4>
          <span class="badge ${career.salaryRange === '低' ? 'badge-low' : career.salaryRange === '高' ? 'badge-green' : 'badge-blue'}">${career.salaryRange}薪</span>
        </div>
      </div>
      <p class="catalog-desc">${escapeHtml(career.description)}</p>
      <div class="catalog-reqs">
        <h5>必備能力</h5>
        ${renderRequirementList(career.requirements, abilityDefs)}
      </div>
      ${userAbilities ? renderUserCompare(career, userAbilities, abilityDefs) : ''}
    </article>
  `;
}

function renderUserCompare(career, userAbilities, abilityDefs) {
  const rows = Object.entries(career.requirements)
    .map(([id, req]) => {
      const current = getAbilityLevel(userAbilities[id] || 0);
      const met = current >= req;
      return `<span class="req-compare ${met ? 'met' : 'gap'}">${formatAbilityName(id, abilityDefs)} ${current}/${req}</span>`;
    })
    .join('');

  return `<div class="catalog-compare"><small>你的能力：</small> ${rows}</div>`;
}

function renderList(careers, categories, abilityDefs) {
  if (!careers.length) {
    return '<p style="text-align:center;color:var(--text-muted);padding:2rem">找不到符合的職業</p>';
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return `
    <div class="catalog-table-wrap">
      <table class="catalog-table">
        <thead>
          <tr>
            <th>職業</th>
            <th>類別</th>
            <th>薪資</th>
            <th>必備能力</th>
          </tr>
        </thead>
        <tbody>
          ${careers
            .map(
              (c) => `
            <tr>
              <td class="catalog-table-career">
                <span class="catalog-icon-sm">${c.icon}</span>
                <div>
                  <strong>${escapeHtml(c.name)}</strong>
                  <small>${escapeHtml(c.description)}</small>
                </div>
              </td>
              <td>${catMap[c.category] || c.category}</td>
              <td><span class="badge ${c.salaryRange === '低' ? 'badge-low' : c.salaryRange === '高' ? 'badge-green' : 'badge-blue'}">${c.salaryRange}</span></td>
              <td class="catalog-table-reqs">
                ${Object.entries(c.requirements)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, lv]) => {
                    const ab = abilityDefs.find((a) => a.id === id);
                    return `<span class="req-chip">${ab?.icon || ''} ${escapeHtml(ab?.name || id)} <strong>${lv}</strong> ${renderStars(lv)}</span>`;
                  })
                  .join('')}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}
