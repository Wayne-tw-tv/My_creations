const STAGE_MULTIPLIERS = {
  elementary: 0.8,
  middle: 1.0,
  high: 1.2,
  university: 1.5,
};

export function calculateStageAbilities(allocation, subjects, mappings, stageId) {
  const multiplier = STAGE_MULTIPLIERS[stageId] || 1.0;
  const abilities = {};

  subjects.forEach((subject) => {
    const points = allocation[subject.id] || 0;
    const subjectMapping = mappings[subject.id];
    if (!subjectMapping) return;

    Object.entries(subjectMapping).forEach(([abilityId, weight]) => {
      abilities[abilityId] = (abilities[abilityId] || 0) + points * weight * multiplier;
    });
  });

  return abilities;
}

export function mergeAbilities(...abilityMaps) {
  const merged = {};
  abilityMaps.forEach((map) => {
    Object.entries(map).forEach(([id, score]) => {
      merged[id] = (merged[id] || 0) + score;
    });
  });
  return merged;
}

export function getAllAbilities(state, subjectsData, mappings, stages) {
  const maps = [];

  stages.forEach((stage) => {
    const alloc = state.allocations[stage.id];
    if (!alloc) return;

    const hasPoints = Object.entries(alloc).some(([k, v]) => k !== 'track' && v > 0);
    if (!hasPoints) return;

    let subjectKey = stage.id;
    if (stage.id === 'high') {
      subjectKey = `high_${alloc.track || 'science'}`;
    } else if (stage.id === 'university') {
      subjectKey = `university_${alloc.track || 'tech'}`;
    }

    const subjects = subjectsData[subjectKey];
    if (!subjects) return;

    maps.push(calculateStageAbilities(alloc, subjects, mappings, stage.id));
  });

  return mergeAbilities(...maps);
}

export function abilityToStars(score, maxScore = 20) {
  return Math.min(5, Math.max(0, (score / maxScore) * 5));
}

export function drawRadarChart(canvas, abilities, abilityDefs) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = Math.min(320, canvas.parentElement?.clientWidth || 320);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const count = abilityDefs.length;
  const maxVal = 15;

  ctx.clearRect(0, 0, size, size);

  // grid
  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    const r = (radius * ring) / 5;
    for (let i = 0; i <= count; i++) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.15)';
    ctx.stroke();
  }

  // axes
  abilityDefs.forEach((ab, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.2)';
    ctx.stroke();

    const labelX = cx + (radius + 18) * Math.cos(angle);
    const labelY = cy + (radius + 18) * Math.sin(angle);
    ctx.fillStyle = '#a8b4d0';
    ctx.font = '10px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ab.name.slice(0, 4), labelX, labelY);
  });

  // data polygon
  ctx.beginPath();
  abilityDefs.forEach((ab, i) => {
    const val = Math.min(abilities[ab.id] || 0, maxVal);
    const r = (val / maxVal) * radius;
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(74, 158, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // dots
  abilityDefs.forEach((ab, i) => {
    const val = Math.min(abilities[ab.id] || 0, maxVal);
    const r = (val / maxVal) * radius;
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = ab.color || '#4a9eff';
    ctx.fill();
  });
}

export function getTopAbilities(abilities, abilityDefs, n = 5) {
  return abilityDefs
    .map((ab) => ({ ...ab, score: abilities[ab.id] || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
