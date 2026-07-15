const STORAGE_KEY = 'lifeSkillTree_v1';

export function createDefaultState() {
  return {
    playerName: '',
    level: 1,
    currentStage: 'elementary',
    completedStages: [],
    allocations: {
      elementary: {},
      middle: {},
      high: { track: 'science' },
      university: { track: 'tech' },
    },
    unlockedAchievements: [],
    favoriteCareers: [],
    stats: {
      reverseExploreCount: 0,
      tutorialSeen: false,
    },
    settings: {
      strictAllocation: true,
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...createDefaultState(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createDefaultState();
}

export function getStageKey(stageId, allocation) {
  if (stageId === 'high') {
    const track = allocation?.track || 'science';
    return `high_${track}`;
  }
  if (stageId === 'university') {
    const track = allocation?.track || 'tech';
    return `university_${track}`;
  }
  return stageId;
}

export function isStageUnlocked(state, stageId, stages) {
  const idx = stages.findIndex((s) => s.id === stageId);
  if (idx === 0) return true;
  const prev = stages[idx - 1];
  return state.completedStages.includes(prev.id);
}

export function getNextChapter(state, stages) {
  const nextId = state.currentStage;
  if (!nextId || state.completedStages.includes(nextId)) return null;
  const stage = stages.find((s) => s.id === nextId);
  if (!stage || !isStageUnlocked(state, nextId, stages)) return null;
  return stage;
}

export function completeStage(state, stageId) {
  if (!state.completedStages.includes(stageId)) {
    state.completedStages.push(stageId);
  }
  state.level = Math.min(state.completedStages.length + 1, 5);
  const order = ['elementary', 'middle', 'high', 'university'];
  const idx = order.indexOf(stageId);
  if (idx >= 0 && idx < order.length - 1) {
    state.currentStage = order[idx + 1];
  }
  saveState(state);
}

export function getTotalPoints(allocation, subjects) {
  return subjects.reduce((sum, s) => sum + (allocation[s.id] || 0), 0);
}

export function initAllocation(subjects) {
  const alloc = {};
  subjects.forEach((s) => {
    alloc[s.id] = 0;
  });
  return alloc;
}
