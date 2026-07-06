export function getNodeStatus(node, userAbilities, abilityScores) {
  const threshold = node.threshold || 0;

  if (node.ability) {
    const score = userAbilities[node.ability] || 0;
    if (score >= threshold * 1.5) return 'mastered';
    if (score >= threshold) return 'unlocked';
    if (score >= threshold * 0.5) return 'available';
    return 'locked';
  }

  if (node.career) {
    const score = abilityScores.totalScore || 0;
    if (score >= threshold * 1.2) return 'mastered';
    if (score >= threshold) return 'unlocked';
    if (score >= threshold * 0.6) return 'available';
    return 'locked';
  }

  // subject layer - always available if any points allocated
  const subjectMap = {
    math: 'logic',
    english: 'language',
    science_sub: 'observation',
    art_sub: 'creativity',
    info_sub: 'tech_literacy',
    chinese_sub: 'communication',
  };
  const abilityId = subjectMap[node.id];
  if (abilityId && (userAbilities[abilityId] || 0) > 0) return 'unlocked';
  return 'available';
}

export function renderSkillTree(svgEl, skillData, userAbilities, onNodeClick) {
  const { nodes, edges, layerLabels } = skillData;
  const layerCount = 5;
  const svgWidth = 800;
  const svgHeight = 480;
  const paddingX = 60;
  const layerHeight = svgHeight / layerCount;

  // group nodes by layer
  const layers = {};
  nodes.forEach((n) => {
    if (!layers[n.layer]) layers[n.layer] = [];
    layers[n.layer].push(n);
  });

  const positions = {};
  Object.entries(layers).forEach(([layer, layerNodes]) => {
    const count = layerNodes.length;
    layerNodes.forEach((node, i) => {
      const x = paddingX + ((svgWidth - paddingX * 2) / (count + 1)) * (i + 1);
      const y = layerHeight * parseInt(layer) + layerHeight / 2;
      positions[node.id] = { x, y, node };
    });
  });

  const totalScore = Object.values(userAbilities).reduce((s, v) => s + v, 0);
  const statuses = {};
  nodes.forEach((n) => {
    statuses[n.id] = getNodeStatus(n, userAbilities, { totalScore });
  });

  let svg = `<svg class="skill-tree-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

  // layer labels
  layerLabels.forEach((label, i) => {
    svg += `<text class="layer-label" x="10" y="${layerHeight * i + layerHeight / 2 + 4}">${label}</text>`;
  });

  // edges
  edges.forEach((edge) => {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) return;
    const active = statuses[edge.from] !== 'locked' && statuses[edge.to] !== 'locked';
    svg += `<line class="skill-edge ${active ? 'active' : ''}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
  });

  // nodes
  nodes.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) return;
    const status = statuses[node.id];
    svg += `
      <g class="skill-node-group ${status}" data-id="${node.id}" transform="translate(${pos.x}, ${pos.y})">
        <circle class="skill-node-circle" r="22" />
        <text class="skill-node-icon" y="1">${node.icon}</text>
        <text class="skill-node-label" y="38">${node.name}</text>
      </g>
    `;
  });

  svg += '</svg>';
  svgEl.innerHTML = svg;

  svgEl.querySelectorAll('.skill-node-group').forEach((g) => {
    g.addEventListener('click', () => {
      svgEl.querySelectorAll('.skill-node-group').forEach((el) => el.classList.remove('selected'));
      g.classList.add('selected');
      const node = nodes.find((n) => n.id === g.dataset.id);
      if (node) onNodeClick(node, statuses[node.id]);
    });
  });

  return statuses;
}

export function countUnlockedNodes(statuses) {
  return Object.values(statuses).filter((s) => s === 'unlocked' || s === 'mastered').length;
}

export function renderNodeDetail(panel, node, status, careers, abilityDefs) {
  const statusLabels = {
    locked: '🔒 尚未解鎖',
    available: '✨ 可解鎖',
    unlocked: '✅ 已解鎖',
    mastered: '🌟 精通',
  };

  let relatedCareer = '';
  if (node.career) {
    const career = careers.find((c) => c.id === node.career);
    if (career) {
      relatedCareer = `<p style="margin-top:0.75rem"><strong>職業：</strong>${career.icon} ${career.name}</p>`;
    }
  }

  let abilityInfo = '';
  if (node.ability) {
    const ab = abilityDefs.find((a) => a.id === node.ability);
    if (ab) {
      abilityInfo = `<p><strong>關聯能力：</strong>${ab.icon} ${ab.name}</p>`;
    }
  }

  panel.classList.remove('empty');
  panel.innerHTML = `
    <div class="card">
      <div style="font-size:2.5rem;text-align:center;margin-bottom:0.5rem">${node.icon}</div>
      <h3 style="text-align:center">${node.name}</h3>
      <p style="color:var(--text-secondary);margin:0.75rem 0">${node.description}</p>
      <span class="badge badge-gold">${statusLabels[status] || status}</span>
      ${abilityInfo}
      ${relatedCareer}
      <p style="margin-top:0.75rem;font-size:0.85rem;color:var(--text-muted)">解鎖門檻：${node.threshold} 能力值</p>
    </div>
  `;
}

export function highlightBestPath(svgEl, career) {
  if (!career?.skillPath) return;
  const pathSet = new Set(career.skillPath);
  svgEl.querySelectorAll('.skill-node-group').forEach((g) => {
    if (pathSet.has(g.dataset.id)) {
      g.classList.add('mastered');
    }
  });
}
