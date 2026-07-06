import { formatAbilityName, getAbilityLevel } from './career-engine.js';
import { renderStars, escapeHtml } from './ui.js';
import { renderRequirementList } from './career-catalog.js';

export function buildSubjectLookup(subjectsData) {
  const lookup = {};
  Object.values(subjectsData || {}).forEach((list) => {
    list.forEach((s) => {
      if (!lookup[s.id]) lookup[s.id] = s;
    });
  });
  return lookup;
}

export function getSubjectSuggestionsForCareer(career, mappings, subjectLookup, userAbilities) {
  const suggestions = {};

  Object.entries(career.requirements).forEach(([abilityId, required]) => {
    const userLevel = getAbilityLevel(userAbilities[abilityId] || 0);
    if (userLevel >= required) return;

    const gapWeight = required - userLevel;

    Object.entries(mappings).forEach(([subjectId, map]) => {
      const weight = map[abilityId];
      if (!weight) return;

      if (!suggestions[subjectId]) {
        suggestions[subjectId] = { score: 0, helps: [] };
      }
      suggestions[subjectId].score += weight * gapWeight;
      if (!suggestions[subjectId].helps.includes(abilityId)) {
        suggestions[subjectId].helps.push(abilityId);
      }
    });
  });

  return Object.entries(suggestions)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 8)
    .map(([id, data]) => ({
      id,
      name: subjectLookup[id]?.name || id,
      icon: subjectLookup[id]?.icon || '📚',
      helps: data.helps,
    }));
}

export function renderReverseExplore(
  container,
  careers,
  categories,
  userAbilities,
  abilityDefs,
  mappings,
  subjectsData,
  onSelect
) {
  if (!container) return;
  if (!careers?.length) {
    container.innerHTML =
      '<div class="card"><p style="text-align:center;color:var(--text-secondary)">職業資料載入失敗，請重新整理頁面。</p></div>';
    return;
  }

  const subjectLookup = buildSubjectLookup(subjectsData);
  const cats = categories || [];
  let selectedCategory = 'all';
  let searchQuery = '';
  let selectedCareerId = null;
  let showSuggestions = false;

  container.innerHTML = `
    <input class="input-text search-input" type="text" placeholder="搜尋職業..." id="career-search" />
    <div class="category-tabs" id="reverse-category-tabs">
      <button class="btn btn-sm category-tab active" data-cat="all">全部</button>
      ${cats
        .map(
          (cat) => `
        <button class="btn btn-sm category-tab" data-cat="${cat.id}">${cat.name}</button>
      `
        )
        .join('')}
    </div>
    <div class="two-col">
      <div class="career-grid" id="reverse-career-list"></div>
      <div id="reverse-detail">
        <div class="card node-detail-panel empty"><p>← 選擇一個職業<br/>看看需要什麼技能</p></div>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#career-search');
  const listEl = container.querySelector('#reverse-career-list');
  const detailEl = container.querySelector('#reverse-detail');

  function getFilteredCareers() {
    let filtered = careers;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  function updateToolbarState() {
    container.querySelectorAll('.category-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cat === selectedCategory);
    });
  }

  function renderList() {
    const filtered = getFilteredCareers();

    if (!filtered.length) {
      listEl.innerHTML =
        '<div class="card" style="text-align:center;color:var(--text-muted);padding:2rem">找不到符合的職業</div>';
      return;
    }

    listEl.innerHTML = filtered
      .map(
        (c) => `
      <div class="card career-card ${selectedCareerId === c.id ? 'selected' : ''}" data-career="${c.id}">
        <div style="font-size:2rem">${c.icon}</div>
        <h3 style="margin:0.5rem 0">${c.name}</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem">${c.description}</p>
        <div style="margin-top:0.5rem;font-size:0.8rem">${renderRequirementList(c.requirements, abilityDefs, { compact: true })}</div>
      </div>
    `
      )
      .join('');

    listEl.querySelectorAll('.career-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedCareerId = card.dataset.career;
        showSuggestions = true;
        if (onSelect) onSelect(selectedCareerId);
        renderList();
        renderDetail();
      });
    });

    updateToolbarState();
  }

  function renderDetail() {
    const selected = selectedCareerId ? careers.find((c) => c.id === selectedCareerId) : null;

    detailEl.innerHTML = selected
      ? renderCareerDetail(
          selected,
          userAbilities,
          abilityDefs,
          mappings,
          subjectLookup,
          showSuggestions
        )
      : '<div class="card node-detail-panel empty"><p>← 選擇一個職業<br/>看看需要什麼技能</p></div>';

    detailEl.querySelector('#btn-show-subjects')?.addEventListener('click', () => {
      showSuggestions = !showSuggestions;
      renderDetail();
    });
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderList();
  });

  container.querySelector('#reverse-category-tabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-tab');
    if (!btn) return;
    selectedCategory = btn.dataset.cat;
    renderList();
  });

  renderList();
  renderDetail();
}

function renderCareerDetail(career, userAbilities, abilityDefs, mappings, subjectLookup, showSuggestions) {
  const rows = Object.entries(career.requirements)
    .map(([abilityId, required]) => {
      const userScore = userAbilities[abilityId] || 0;
      const userLevel = getAbilityLevel(userScore);
      const gap = Math.max(0, required - userLevel);
      const name = formatAbilityName(abilityId, abilityDefs);
      return `
        <div class="compare-row">
          <span>${name}</span>
          <span>
            <span class="req">${renderStars(required)}</span>
            vs
            <span class="user">${renderStars(userLevel)}</span>
            ${gap > 0 ? `<span class="gap">（差 ${gap}）</span>` : '<span style="color:var(--accent-green)">✓</span>'}
          </span>
        </div>
      `;
    })
    .join('');

  const allMet = Object.entries(career.requirements).every(
    ([id, req]) => getAbilityLevel(userAbilities[id] || 0) >= req
  );

  const suggestions = getSubjectSuggestionsForCareer(career, mappings, subjectLookup, userAbilities);

  return `
    <div class="card">
      <div style="font-size:3rem;text-align:center">${career.icon}</div>
      <h2 style="text-align:center;margin:0.5rem 0">${career.name}</h2>
      <p style="color:var(--text-secondary);text-align:center;margin-bottom:1rem">${career.description}</p>
      <h3>需要技能</h3>
      ${rows}
      <div style="margin-top:1rem;text-align:center">
        ${
          allMet
            ? '<span class="badge badge-green">✅ 你已具備基礎條件！</span>'
            : `<button type="button" class="btn btn-sm btn-primary" id="btn-show-subjects">
                💡 ${showSuggestions ? '收起' : '看看'}哪些科目能補強這些能力
              </button>`
        }
      </div>
      ${showSuggestions && !allMet ? renderSubjectSuggestions(suggestions, abilityDefs) : ''}
      ${career.skillPath ? `<p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">技能路線：${career.skillPath.join(' → ')}</p>` : ''}
    </div>
  `;
}

function renderSubjectSuggestions(suggestions, abilityDefs) {
  if (!suggestions.length) {
    return `
      <div class="subject-suggestions">
        <p style="color:var(--text-muted);font-size:0.875rem">請先完成至少一個階段的技能分配，才能計算建議科目。</p>
      </div>
    `;
  }

  return `
    <div class="subject-suggestions">
      <h4>📚 建議加強這些科目</h4>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-bottom:0.75rem">
        在下一章節分配更多技能點到以下科目，可補足尚不足的能力：
      </p>
      <ul class="subject-suggestion-list">
        ${suggestions
          .map(
            (s) => `
          <li class="subject-suggestion-item">
            <span class="subject-suggestion-name">${s.icon} ${escapeHtml(s.name)}</span>
            <span class="subject-suggestion-helps">
              → ${s.helps.map((h) => escapeHtml(formatAbilityName(h, abilityDefs))).join('、')}
            </span>
          </li>
        `
          )
          .join('')}
      </ul>
    </div>
  `;
}

/** @deprecated use getSubjectSuggestionsForCareer */
export function getSuggestedSubjects(career, mappings) {
  const suggestions = {};
  Object.keys(career.requirements).forEach((abilityId) => {
    Object.entries(mappings).forEach(([subjectId, map]) => {
      if (map[abilityId]) {
        suggestions[subjectId] = (suggestions[subjectId] || 0) + map[abilityId];
      }
    });
  });
  return Object.entries(suggestions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
}
