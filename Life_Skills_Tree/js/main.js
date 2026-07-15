import {
  createDefaultState,
  loadState,
  saveState,
  resetState,
  completeStage,
  isStageUnlocked,
  getNextChapter,
  initAllocation,
  getTotalPoints,
} from './state.js';
import {
  renderAllocation,
  renderTrackSelector,
  ensureAllocation,
  HIGH_TRACKS,
  UNIVERSITY_TRACKS,
  TOTAL_POINTS,
} from './allocation.js';
import { getAllAbilities, drawRadarChart, getTopAbilities } from './ability-engine.js';
import {
  getTopCareers,
  getTopSkilledCareers,
  getEntryCareers,
  getQualifiedEntryCareers,
  isLowSkillProfile,
  isPreviewMode,
  formatAbilityName,
} from './career-engine.js';
import {
  renderSkillTree,
  renderNodeDetail,
  highlightBestPath,
} from './skill-tree.js';
import { renderReverseExplore } from './reverse-explore.js';
import { renderCareerCatalog, renderRequirementList } from './career-catalog.js';
import { checkAchievements, renderAchievements } from './achievements.js';
import {
  updateHUD,
  showToast,
  getMatchClass,
  getMatchLabel,
  renderStars,
  escapeHtml,
} from './ui.js';

let state;
let data = {};
let currentNodeStatuses = {};

async function loadData() {
  const files = [
    'stages',
    'subjects',
    'abilities',
    'mappings',
    'careers',
    'skill-nodes',
    'achievements',
  ];
  const results = await Promise.all(
    files.map((f) =>
      fetch(`data/${f}.json`)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load ${f}.json`);
          return r.json();
        })
        .then((json) => ({ [f]: json }))
    )
  );
  results.forEach((r) => Object.assign(data, r));
  data.stages = data.stages.stages;
  data.abilities = data.abilities.abilities;
  const careersData = data.careers;
  data.categories = careersData.categories;
  data.careers = careersData.careers;
  data.achievements = data.achievements.achievements;
}

function getUserAbilities() {
  return getAllAbilities(state, data.subjects, data.mappings, data.stages);
}

function updateTopNav(viewId) {
  const backBtn = document.getElementById('btn-back-map');
  const homeBtn = document.getElementById('btn-hud-home');
  const staticTitle = document.getElementById('hud-title-static');
  const loggedIn = !!state.playerName;
  const showBack = loggedIn && viewId !== 'welcome' && viewId !== 'map';

  backBtn?.classList.toggle('hidden', !showBack);
  homeBtn?.classList.toggle('hidden', !loggedIn || viewId === 'welcome');
  staticTitle?.classList.toggle('hidden', loggedIn);
}

function navigate(viewId, params = {}) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const view = document.getElementById(`view-${viewId}`);
  if (view) view.classList.add('active');

  updateHUD(state, data.stages, data.achievements);
  updateTopNav(viewId);

  switch (viewId) {
    case 'welcome':
      renderWelcome();
      break;
    case 'map':
      renderWorldMap();
      break;
    case 'allocation':
      renderAllocationView(params.stage);
      break;
    case 'abilities':
      renderAbilitiesView();
      break;
    case 'tree':
      renderTreeView();
      break;
    case 'careers':
      renderCareersView();
      break;
    case 'catalog':
      renderCatalogView();
      break;
    case 'reverse':
      renderReverseView();
      break;
    case 'achievements':
      renderAchievementsView();
      break;
  }

  if (viewId !== 'welcome') {
    window.location.hash = viewId + (params.stage ? `/${params.stage}` : '');
  }
}

function renderWelcome() {
  const input = document.getElementById('player-name');
  if (state.playerName) {
    input.value = state.playerName;
    navigate('map');
    return;
  }
  document.getElementById('tutorial-box').classList.remove('hidden');
}

function renderWorldMap() {
  const container = document.getElementById('world-map');
  container.innerHTML = data.stages
    .map((stage) => {
      const unlocked = isStageUnlocked(state, stage.id, data.stages);
      const completed = state.completedStages.includes(stage.id);
      const current = state.currentStage === stage.id;
      return `
        <div class="card map-chapter ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''} ${current ? 'current' : ''}"
             data-stage="${stage.id}" ${!unlocked ? '' : 'tabindex="0"'}>
          <div class="chapter-num">第 ${stage.chapter} 章</div>
          <div class="chapter-icon">${stage.icon}</div>
          <h3>${stage.name}</h3>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.5rem">${stage.description}</p>
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.map-chapter:not(.locked)').forEach((el) => {
    el.addEventListener('click', () => {
      navigate('allocation', { stage: el.dataset.stage });
    });
  });

  renderGameSettings();
}

function renderGameSettings() {
  const panel = document.getElementById('game-settings');
  if (!panel) return;

  if (!state.settings) state.settings = { strictAllocation: true };
  const strict = state.settings.strictAllocation !== false;

  panel.innerHTML = `
    <div class="settings-row">
      <div class="settings-info">
        <strong>🎛️ 技能點規則</strong>
        <p>${strict
          ? '目前：<span class="badge badge-gold">嚴格模式</span> — 必須分配完 10 點才能進入下一章'
          : '目前：<span class="badge badge-blue">自由模式</span> — 可浪費未使用的點數直接前進'}</p>
        <p class="settings-desc">關閉嚴格模式時，每一章未分配的點數會<strong>永久消失</strong>，就像虛度光陰、不認真學習 — 最終能力不足以選擇夢想職業。</p>
      </div>
      <label class="toggle-switch" title="切換是否必須分配完 10 點">
        <input type="checkbox" id="toggle-strict-allocation" ${strict ? 'checked' : ''} />
        <span class="toggle-slider"></span>
        <span class="toggle-label">必須分配完 10 點</span>
      </label>
    </div>
  `;

  panel.querySelector('#toggle-strict-allocation')?.addEventListener('change', (e) => {
    state.settings.strictAllocation = e.target.checked;
    saveState(state);
    renderGameSettings();
  });
}

function getSubjectKey(stageId) {
  const alloc = state.allocations[stageId] || {};
  if (stageId === 'high') return `high_${alloc.track || 'science'}`;
  if (stageId === 'university') return `university_${alloc.track || 'tech'}`;
  return stageId;
}

function renderAllocationView(stageId) {
  const stage = data.stages.find((s) => s.id === stageId);
  if (!stage) return;

  document.getElementById('allocation-title').textContent = `${stage.icon} ${stage.name} — 分配技能點`;
  document.getElementById('allocation-desc').textContent = stage.description;

  const trackContainer = document.getElementById('track-selector-container');
  const allocContainer = document.getElementById('allocation-container');

  if (!state.allocations[stageId]) {
    state.allocations[stageId] = stageId === 'high' ? { track: 'science' } : stageId === 'university' ? { track: 'tech' } : {};
  }

  function renderAlloc() {
    const subjectKey = getSubjectKey(stageId);
    const subjects = data.subjects[subjectKey];
    if (!subjects) return;

    const allocation = ensureAllocation(state.allocations[stageId], subjects);
    state.allocations[stageId] = allocation;

    renderAllocation(allocContainer, subjects, allocation, (alloc, submitted) => {
      state.allocations[stageId] = { ...alloc, track: allocation.track };
      saveState(state);

      if (submitted) {
        const used = getTotalPoints(alloc, subjects);
        const wasted = TOTAL_POINTS - used;
        const strict = state.settings?.strictAllocation !== false;

        completeStage(state, stageId);
        runAchievementCheck();

        let title = '章節完成！';
        let message = `${stage.name} 技能點已分配，看看你的能力吧！`;
        if (!strict && wasted > 0) {
          title = `章節完成（浪費了 ${wasted} 點）`;
          message = `你有 ${wasted} 點技能點沒有使用就消失了。\n就像虛度光陰一樣，這些能力永遠追不回來 — 去職業推薦看看，離夢想還有多遠？`;
        }

        showToast(title, message, stage.icon, () => navigate('abilities'));
      } else {
        renderAlloc();
      }
    }, { strictAllocation: state.settings?.strictAllocation !== false });
  }

  if (stage.hasTrack) {
    const tracks = stageId === 'high' ? HIGH_TRACKS : UNIVERSITY_TRACKS;
    renderTrackSelector(trackContainer, tracks, state.allocations[stageId].track || tracks[0].id, (track) => {
      state.allocations[stageId].track = track;
      const subjectKey = getSubjectKey(stageId);
      const subjects = data.subjects[subjectKey];
      state.allocations[stageId] = { track, ...initAllocation(subjects) };
      saveState(state);
      renderAlloc();
    });
    trackContainer.classList.remove('hidden');
  } else {
    trackContainer.innerHTML = '';
    trackContainer.classList.add('hidden');
  }

  renderAlloc();
}

function renderAbilitiesView() {
  const abilities = getUserAbilities();
  const preview = isPreviewMode(state.completedStages);
  const note = document.getElementById('ability-preview-note');
  note.textContent = preview
    ? '⚡ 預覽模式：完成至少 2 個階段後，職業推薦會更準確'
    : '你的能力來自所有已完成階段的累積';

  const canvas = document.getElementById('radar-canvas');
  const top8 = data.abilities.slice(0, 8);
  drawRadarChart(canvas, abilities, top8);

  const top = getTopAbilities(abilities, data.abilities, 8);
  const list = document.getElementById('ability-list');
  list.innerHTML = `
    <h3 style="margin-bottom:1rem">能力排行</h3>
    ${top
      .map(
        (ab) => `
      <div class="compare-row">
        <span>${ab.icon} ${ab.name}</span>
        <span>${renderStars(Math.min(5, ab.score / 3))} <small style="color:var(--text-muted)">${ab.score.toFixed(1)}</small></span>
      </div>
    `
      )
      .join('')}
  `;

  runAchievementCheck();

  const nav = document.getElementById('ability-nav-actions');
  const nextChapter = getNextChapter(state, data.stages);
  nav.innerHTML = `
    <button class="btn" data-nav="map">← 返回地圖</button>
    ${
      nextChapter
        ? `<button class="btn btn-primary" id="btn-next-chapter">${nextChapter.icon} 前往${nextChapter.name} →</button>`
        : state.completedStages.length >= 4
          ? '<span class="badge badge-green">🎓 四階段全部完成！</span>'
          : ''
    }
    <button class="btn${nextChapter ? '' : ' btn-primary'}" data-nav="careers">查看職業推薦 →</button>
  `;

  nav.querySelector('[data-nav="map"]')?.addEventListener('click', () => navigate('map'));
  nav.querySelector('[data-nav="careers"]')?.addEventListener('click', () => navigate('careers'));
  nav.querySelector('#btn-next-chapter')?.addEventListener('click', () => {
    navigate('allocation', { stage: nextChapter.id });
  });
}

function renderTreeView() {
  const abilities = getUserAbilities();
  const container = document.getElementById('skill-tree-container');
  const detail = document.getElementById('node-detail');

  currentNodeStatuses = renderSkillTree(
    container,
    data['skill-nodes'],
    abilities,
    (node, status) => {
      renderNodeDetail(detail, node, status, data.careers, data.abilities);
    }
  );

  const top = getTopCareers(abilities, data.careers, 1);
  if (top.length > 0) {
    highlightBestPath(container, top[0].career);
  }

  runAchievementCheck();
}

function salaryBadge(range) {
  if (range === '低') return 'badge-low';
  if (range === '高') return 'badge-green';
  return 'badge-blue';
}

function renderCareersView() {
  const abilities = getUserAbilities();
  const preview = isPreviewMode(state.completedStages);
  const note = document.getElementById('career-preview-note');
  note.textContent = preview
    ? '⚡ 預覽模式 — 以下為需努力才能達成的方向，完成更多階段會更準'
    : '投入學習，這些才是你可以爭取的方向';

  const results = getTopSkilledCareers(abilities, data.careers, 5);
  const container = document.getElementById('career-results');

  container.innerHTML = results
    .map(({ career, match, gaps, strengths }) => {
      const pct = Math.round(match * 100);
      return `
        <div class="card career-card" data-career="${career.id}">
          <div style="font-size:2.5rem">${career.icon}</div>
          <h3>${career.name}</h3>
          <span class="badge ${salaryBadge(career.salaryRange)}">${career.salaryRange}薪</span>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin:0.5rem 0">${career.description}</p>
          <div class="match-bar">
            <span class="${getMatchClass(match)}" style="font-weight:700;min-width:3rem">${pct}%</span>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          </div>
          <span class="badge ${match >= 0.85 ? 'badge-green' : 'badge-gold'}">${getMatchLabel(match)}</span>
          ${
            gaps.length > 0
              ? `<ul class="gap-list">${gaps.map((g) => `<li>需補強：${formatAbilityName(g.abilityId, data.abilities)} (${g.gap} 等級)</li>`).join('')}</ul>`
              : '<p style="color:var(--accent-green);font-size:0.85rem;margin-top:0.5rem">✅ 能力達標！</p>'
          }
        </div>
      `;
    })
    .join('');

  container.querySelectorAll('.career-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigate('reverse');
      setTimeout(() => {
        const btn = document.querySelector(`#reverse-container [data-career="${card.dataset.career}"]`);
        btn?.click();
      }, 100);
    });
  });

  renderEntryCareersSection(abilities);
  runAchievementCheck();
}

function renderEntryCareersSection(abilities) {
  const section = document.getElementById('entry-careers-section');
  const entryCareers = getEntryCareers(data.careers);
  const qualified = getQualifiedEntryCareers(abilities, data.careers);
  const lowProfile = isLowSkillProfile(abilities, data.careers);

  section.innerHTML = `
    <div class="entry-warning">
      <h3>⚠️ 如果不努力學習…</h3>
      <p>
        這些工作<strong>幾乎不需要專業技能</strong>，現在就能「匹配」，但選擇少、薪資低、上升空間有限。
        ${lowProfile ? '<br/><strong style="color:var(--accent-red)">以你目前的技能樹，這些是最現實的選項 — 現在改變還來得及！</strong>' : '繼續分配技能點、解鎖更多能力，才能打開上面的夢想職業。'}
        ${qualified.length > 0 ? `<br/>你已符合 ${qualified.length} 個基層工作的條件。` : ''}
      </p>
      <div class="entry-career-grid">
        ${entryCareers
          .map((career) => {
            const match = qualified.find((q) => q.careerId === career.id);
            const pct = match ? Math.round(match.match * 100) : null;
            return `
              <div class="card entry-career-card career-card" data-career="${career.id}">
                <div style="font-size:2rem">${career.icon}</div>
                <h4 style="margin:0.35rem 0">${career.name}</h4>
                <span class="badge badge-low">低薪 · 低門檻</span>
                ${pct !== null ? `<span class="badge badge-gold" style="margin-left:0.35rem">已符合 ${pct}%</span>` : ''}
                <p style="color:var(--text-secondary);font-size:0.8rem;margin:0.5rem 0">${career.description}</p>
                <div class="catalog-reqs">
                  ${renderRequirementList(career.requirements, data.abilities)}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  section.querySelectorAll('.career-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigate('reverse');
      setTimeout(() => {
        document.querySelector(`#reverse-container [data-career="${card.dataset.career}"]`)?.click();
      }, 100);
    });
  });
}

function renderCatalogView() {
  const abilities = getUserAbilities();
  const hasProgress = Object.keys(abilities).length > 0;
  renderCareerCatalog(
    document.getElementById('catalog-container'),
    data.careers,
    data.categories,
    data.abilities,
    hasProgress ? abilities : null
  );
}

function renderReverseView() {
  const abilities = getUserAbilities();
  renderReverseExplore(
    document.getElementById('reverse-container'),
    data.careers,
    data.categories,
    abilities,
    data.abilities,
    data.mappings,
    data.subjects,
    () => {
      state.stats.reverseExploreCount = (state.stats.reverseExploreCount || 0) + 1;
      saveState(state);
      runAchievementCheck();
    }
  );
}

function renderAchievementsView() {
  renderAchievements(
    document.getElementById('achievements-container'),
    data.achievements,
    state.unlockedAchievements
  );
}

function runAchievementCheck() {
  const abilities = getUserAbilities();
  const achievementData = {
    achievements: data.achievements,
    subjects: data.subjects,
    careers: data.careers,
    skillNodes: data['skill-nodes'],
  };
  const newly = checkAchievements(state, achievementData, abilities, currentNodeStatuses);
  if (newly.length > 0) {
    saveState(state);
    newly.forEach((ach, i) => {
      setTimeout(() => {
        showToast('🏆 成就解鎖！', ach.description, ach.icon);
      }, i * 500);
    });
    updateHUD(state, data.stages, data.achievements);
  }
}

function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  const [view, stage] = hash.split('/');
  return { view, stage };
}

function init() {
  document.getElementById('btn-start').addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
      document.getElementById('player-name').focus();
      return;
    }
    state.playerName = name;
    state.stats.tutorialSeen = true;
    saveState(state);
    navigate('map');
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('確定要重置所有進度嗎？')) {
      state = resetState();
      window.location.hash = '';
      navigate('welcome');
    }
  });

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  window.addEventListener('resize', () => {
    const abilitiesView = document.getElementById('view-abilities');
    if (abilitiesView?.classList.contains('active')) {
      renderAbilitiesView();
    }
  });

  window.addEventListener('hashchange', () => {
    const parsed = parseHash();
    if (parsed?.view && state?.playerName) {
      navigate(parsed.view, parsed.stage ? { stage: parsed.stage } : {});
    }
  });

  const parsed = parseHash();
  if (state.playerName && parsed?.view) {
    navigate(parsed.view, parsed.stage ? { stage: parsed.stage } : {});
  } else if (state.playerName) {
    navigate('map');
  } else {
    navigate('welcome');
  }
}

async function boot() {
  try {
    await loadData();
    state = loadState() || createDefaultState();
    if (!state.stats) state.stats = { reverseExploreCount: 0, tutorialSeen: false };
    if (!state.settings) state.settings = { strictAllocation: true };
    init();
  } catch (err) {
    document.getElementById('app').innerHTML = `
      <div class="card" style="max-width:500px;margin:2rem auto;text-align:center">
        <h2>⚠️ 載入失敗</h2>
        <p style="color:var(--text-secondary);margin:1rem 0">
          請使用本地伺服器開啟（不能直接雙擊 index.html）。<br><br>
          <code style="background:var(--bg-deep);padding:0.5rem;border-radius:4px;display:block">
            npx serve .
          </code>
          或
          <code style="background:var(--bg-deep);padding:0.5rem;border-radius:4px;display:block;margin-top:0.5rem">
            python -m http.server 8080
          </code>
        </p>
        <p style="color:var(--accent-red);font-size:0.85rem">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

boot();
