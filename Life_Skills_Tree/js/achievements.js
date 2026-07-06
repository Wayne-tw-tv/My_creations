import { getTotalPoints } from './state.js';
import { getTopCareers } from './career-engine.js';
import { countUnlockedNodes } from './skill-tree.js';

export function checkAchievements(state, data, userAbilities, nodeStatuses) {
  const newlyUnlocked = [];
  const { achievements, subjects, careers, skillNodes } = data;

  achievements.forEach((ach) => {
    if (state.unlockedAchievements.includes(ach.id)) return;

    let unlocked = false;

    switch (ach.id) {
      case 'math_master':
        unlocked = checkSubjectInAnyStage(state, subjects, 'math', 7);
        break;
      case 'english_rising':
        unlocked = checkEnglishProgress(state, subjects);
        break;
      case 'science_full':
        unlocked = checkScienceFull(state, subjects);
        break;
      case 'balanced':
        unlocked = checkBalanced(state, subjects);
        break;
      case 'tech_path':
        unlocked = checkCrossStageSum(state, subjects, ['info', 'math'], 12);
        break;
      case 'artist_soul':
        unlocked = checkArtistSum(state, subjects, 12);
        break;
      case 'career_locked': {
        const top = getTopCareers(userAbilities, careers, 1);
        unlocked = top.length > 0 && top[0].match >= 0.9;
        break;
      }
      case 'explorer':
        unlocked = (state.stats?.reverseExploreCount || 0) >= 5;
        break;
      case 'first_step':
        unlocked = state.completedStages.length >= 1;
        break;
      case 'graduate':
        unlocked = state.completedStages.length >= 4;
        break;
      case 'high_match': {
        const top3 = getTopCareers(userAbilities, careers, 3);
        unlocked = top3.length >= 3 && top3.every((c) => c.match >= 0.85);
        break;
      }
      case 'tree_master':
        unlocked = nodeStatuses && countUnlockedNodes(nodeStatuses) >= 15;
        break;
      default:
        break;
    }

    if (unlocked) {
      state.unlockedAchievements.push(ach.id);
      newlyUnlocked.push(ach);
    }
  });

  return newlyUnlocked;
}

function getSubjectsForStage(subjectsData, stageId, allocation) {
  if (stageId === 'high') return subjectsData[`high_${allocation?.track || 'science'}`] || [];
  if (stageId === 'university') return subjectsData[`university_${allocation?.track || 'tech'}`] || [];
  return subjectsData[stageId] || [];
}

function checkSubjectInAnyStage(state, subjectsData, subjectId, minPoints) {
  for (const stageId of ['elementary', 'middle', 'high', 'university']) {
    const alloc = state.allocations[stageId];
    if (!alloc) continue;
    if ((alloc[subjectId] || 0) >= minPoints) return true;
  }
  return false;
}

function checkEnglishProgress(state, subjectsData) {
  const stages = ['elementary', 'middle'];
  let prev = -1;
  for (const stageId of stages) {
    const alloc = state.allocations[stageId];
    if (!alloc) return false;
    const val = alloc.english || 0;
    if (prev >= 0 && val <= prev) return false;
    prev = val;
  }
  return prev > 0;
}

function checkScienceFull(state, subjectsData) {
  for (const stageId of ['elementary', 'middle', 'high']) {
    const alloc = state.allocations[stageId];
    if (!alloc) continue;
    const subjects = getSubjectsForStage(subjectsData, stageId, alloc);
    const scienceIds = ['science', 'biology'];
    for (const sid of scienceIds) {
      if (subjects.some((s) => s.id === sid) && alloc[sid] === 10) return true;
    }
  }
  return false;
}

function checkBalanced(state, subjectsData) {
  for (const stageId of ['elementary', 'middle']) {
    const alloc = state.allocations[stageId];
    if (!alloc) continue;
    const subjects = getSubjectsForStage(subjectsData, stageId, alloc);
    if (subjects.length !== 10) continue;
    const allAtLeastOne = subjects.every((s) => (alloc[s.id] || 0) >= 1);
    if (allAtLeastOne && getTotalPoints(alloc, subjects) === 10) return true;
  }
  return false;
}

function checkCrossStageSum(state, subjectsData, subjectIds, minSum) {
  let sum = 0;
  for (const stageId of ['elementary', 'middle', 'high', 'university']) {
    const alloc = state.allocations[stageId];
    if (!alloc) continue;
    subjectIds.forEach((sid) => {
      sum += alloc[sid] || 0;
    });
  }
  return sum >= minSum;
}

function checkArtistSum(state, subjectsData, minSum) {
  let sum = 0;
  const artIds = ['art', 'music'];
  for (const stageId of ['elementary', 'middle', 'high', 'university']) {
    const alloc = state.allocations[stageId];
    if (!alloc) continue;
    artIds.forEach((sid) => {
      sum += alloc[sid] || 0;
    });
  }
  return sum >= minSum;
}

export function renderAchievements(container, achievements, unlockedIds) {
  container.innerHTML = `
    <div class="achievement-grid">
      ${achievements
        .map(
          (ach) => `
        <div class="card achievement-item ${unlockedIds.includes(ach.id) ? 'unlocked' : ''}">
          <div class="ach-icon">${ach.icon}</div>
          <h3 style="font-size:0.95rem">${ach.name}</h3>
          <p style="color:var(--text-secondary);font-size:0.8rem">${ach.description}</p>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}
