export function matchCareer(userAbilities, career) {
  const reqs = career.requirements;
  let totalWeight = 0;
  let matchedWeight = 0;
  const gaps = [];
  const strengths = [];

  Object.entries(reqs).forEach(([abilityId, required]) => {
    const userScore = userAbilities[abilityId] || 0;
    const normalizedUser = abilityToLevel(userScore);
    const ratio = Math.min(normalizedUser / required, 1);
    matchedWeight += ratio * required;
    totalWeight += required;

    if (ratio < 1) {
      gaps.push({
        abilityId,
        required,
        current: normalizedUser,
        gap: required - normalizedUser,
      });
    } else if (ratio >= 1) {
      strengths.push({ abilityId, level: normalizedUser });
    }
  });

  gaps.sort((a, b) => b.gap - a.gap);

  return {
    careerId: career.id,
    career,
    match: totalWeight > 0 ? matchedWeight / totalWeight : 0,
    gaps: gaps.slice(0, 3),
    strengths: strengths.slice(0, 3),
  };
}

function abilityToLevel(score) {
  if (score >= 18) return 5;
  if (score >= 14) return 4;
  if (score >= 10) return 3;
  if (score >= 6) return 2;
  if (score >= 3) return 1;
  return 0;
}

export function rankCareers(userAbilities, careers) {
  return careers
    .map((c) => matchCareer(userAbilities, c))
    .sort((a, b) => b.match - a.match);
}

export function getTopCareers(userAbilities, careers, n = 5) {
  return rankCareers(userAbilities, careers).slice(0, n);
}

export function getSkilledCareers(careers) {
  return careers.filter((c) => c.salaryRange !== '低');
}

export function getEntryCareers(careers) {
  return careers.filter((c) => c.salaryRange === '低');
}

export function getTopSkilledCareers(userAbilities, careers, n = 5) {
  return getTopCareers(userAbilities, getSkilledCareers(careers), n);
}

export function getQualifiedEntryCareers(userAbilities, careers) {
  return rankCareers(userAbilities, getEntryCareers(careers)).filter((r) => r.match >= 0.85);
}

export function getTotalAbilityLevel(userAbilities) {
  const levels = Object.values(userAbilities).map((s) => abilityToLevel(s));
  return levels.reduce((a, b) => a + b, 0);
}

export function isLowSkillProfile(userAbilities, careers) {
  const skilled = getTopSkilledCareers(userAbilities, careers, 1);
  const topSkilledMatch = skilled[0]?.match ?? 0;
  const totalLevel = getTotalAbilityLevel(userAbilities);
  return topSkilledMatch < 0.5 || totalLevel < 8;
}

export function analyzeAbilities(userAbilities, abilityDefs) {
  const sorted = abilityDefs
    .map((ab) => ({ ...ab, score: userAbilities[ab.id] || 0, level: abilityToLevel(userAbilities[ab.id] || 0) }))
    .sort((a, b) => b.score - a.score);

  return {
    top: sorted.slice(0, 5),
    all: sorted,
  };
}

export function isPreviewMode(completedStages) {
  return completedStages.length < 2;
}

export function formatAbilityName(abilityId, abilityDefs) {
  const ab = abilityDefs.find((a) => a.id === abilityId);
  return ab ? ab.name : abilityId;
}

export function getAbilityLevel(score) {
  return abilityToLevel(score);
}
