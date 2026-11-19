/* Leonida Platinum — tracker logic.
   Loads app/data/trophies.json (the only runtime fetch, a file under app/),
   keeps earned trophies in localStorage, renders the checklist, the roadmap
   and the missables pages. No network requests besides the local data file. */

const STORE_KEY = 'leonida-platinum-v1';

const KIND_LABELS = {
  story: 'Story',
  side: 'Side strand',
  collectible: 'Collectible',
  activity: 'Activity',
  combat: 'Combat & crime',
  exploration: 'Exploration',
  misc: 'Misc',
};

const ROADMAP_STAGES = [
  { stage: 1, title: 'Stage 1 — Play the story', text: 'Chapters 1 to 4, every named mission, and the finale. Chapter and mission trophies pop as you finish each one; nothing here can be missed.' },
  { stage: 2, title: 'Stage 2 — Strangers & Freaks', text: 'Eight stranger strands across Leonida, plus the character-linked activities. Do these BEFORE the final story mission — the official description does not say the strands stay open afterwards.' },
  { stage: 3, title: 'Stage 3 — See all of Leonida', text: 'Exploration and collectibles: all 52 areas, 100 vehicles, the meditation spots, the card sets, the WAiNK It locations, the garages and the Scooter Bros registrations.' },
  { stage: 4, title: 'Stage 4 — Activities, combat & chaos', text: 'The long grind: stunts, races, the shooting range, robberies, wanted-level feats and the strange one-off moments. Most of these complete naturally while you play; grind what is left.' },
  { stage: 5, title: 'Stage 5 — Money & 100%', text: 'Launder $250,000 of Marked Bills, spend $100,000 in shops, finish the last 50 challenges, hit 100% completion — and the platinum pops.' },
];

const state = {
  trophies: [],
  earned: new Set(),
  spoiler: false,
  kind: 'all',
  grade: 'all',
  missableOnly: false,
  hideEarned: false,
  search: '',
  selectedId: null,
  view: 'checklist',
};

const $ = (id) => document.getElementById(id);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) {
      data.earned.forEach((id) => { if (Number.isInteger(id)) state.earned.add(id); });
    }
    if (typeof data.spoiler === 'boolean') state.spoiler = data.spoiler;
  } catch (err) {
    console.warn('Stored progress could not be read; starting fresh.', err);
  }
}

function saveStored() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      spoiler: state.spoiler,
    }));
  } catch (err) {
    console.warn('Progress could not be saved.', err);
  }
}

function isSpoilerHidden(trophy) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

function formatTarget(trophy) {
  if (trophy.count == null) return null;
  if (trophy.id === 52 || trophy.id === 53) return '$' + trophy.count.toLocaleString('en-US');
  return String(trophy.count.toLocaleString('en-US'));
}

function medalClass(grade) { return 'medal ' + grade; }

function tagHtml(trophy) {
  const tags = [];
  tags.push('<span class="tag grade-' + trophy.grade + '">' + trophy.grade + '</span>');
  tags.push('<span class="tag kind">' + KIND_LABELS[trophy.kind] + '</span>');
  if (trophy.hidden) tags.push('<span class="tag hidden">Hidden on PSN</span>');
  if (trophy.missable) tags.push('<span class="tag missable">Possibly missable</span>');
  const target = formatTarget(trophy);
  if (target) tags.push('<span class="tag count">PSN target: ' + target + '</span>');
  return tags.join('');
}

function visibleTrophies() {
  const q = state.search.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.missableOnly && !t.missable) return false;
    if (state.hideEarned && state.earned.has(t.id)) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + KIND_LABELS[t.kind]).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderProgress() {
  const earned = state.earned.size;
  const total = state.trophies.length;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = total ? (earned / total * 100) + '%' : '0%';
  $('progressBarWrap').setAttribute('aria-valuenow', String(earned));
  $('progressLabel').textContent = (total ? Math.round(earned / total * 100) : 0) + '% to the platinum';
  const byGrade = {};
  state.trophies.forEach((t) => {
    byGrade[t.grade] = byGrade[t.grade] || { total: 0, earned: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned.has(t.id)) byGrade[t.grade].earned += 1;
  });
  const order = ['platinum', 'gold', 'silver', 'bronze'];
  const labels = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
  $('progressGrades').textContent = order
    .filter((g) => byGrade[g])
    .map((g) => labels[g] + ' ' + byGrade[g].earned + '/' + byGrade[g].total)
    .join(' · ');
}

function renderList() {
  const list = $('trophyList');
  const shown = visibleTrophies();
  list.innerHTML = '';
  shown.forEach((t) => {
    const hidden = isSpoilerHidden(t);
    const row = document.createElement('div');
    row.className = 'trophy-row' + (state.earned.has(t.id) ? ' earned' : '') + (state.selectedId === t.id ? ' selected' : '');
    row.setAttribute('role', 'listitem');
    row.dataset.id = String(t.id);

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = state.earned.has(t.id);
    check.setAttribute('aria-label', 'Earned: ' + (hidden ? 'hidden story trophy' : t.name));
    check.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(t.id, check.checked);
    });

    const medal = document.createElement('span');
    medal.className = medalClass(t.grade);
    medal.title = t.grade;

    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = hidden ? 'Complete the story to reveal this trophy.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.innerHTML = hidden ? '<span class="tag hidden">Story — hidden until earned</span>' : tagHtml(t);
    body.append(name, desc, tags);

    row.append(check, medal, body);
    row.addEventListener('click', () => selectTrophy(t.id));
    list.appendChild(row);
  });
  $('shownCount').textContent = String(shown.length);
  $('earnedShown').textContent = shown.filter((t) => state.earned.has(t.id)).length + ' earned';
  $('spoilerState').textContent = state.spoiler ? 'on' : 'off';
}

function renderDetail() {
  const body = $('detailBody');
  const empty = $('detailEmpty');
  const t = state.trophies.find((x) => x.id === state.selectedId);
  if (!t) {
    body.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  body.hidden = false;
  if (isSpoilerHidden(t)) {
    body.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = 'Hidden story trophy';
    const p = document.createElement('p');
    p.textContent = 'Spoiler mode is on and you have not earned this trophy yet, so its name, description and guide stay hidden. Earn it in the game (or tick it in the checklist) to reveal it.';
    body.append(h, p);
    return;
  }
  body.innerHTML = '';
  const h = document.createElement('h3');
  h.textContent = t.name;
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = 'Official description: ' + t.description;
  const tags = document.createElement('div');
  tags.className = 'trophy-tags';
  tags.innerHTML = tagHtml(t);
  const guideH = document.createElement('h4');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  body.append(h, desc, tags, guideH, guide);

  if (t.sources && t.sources.length) {
    const srcH = document.createElement('h4');
    srcH.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    t.sources.forEach((s) => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = s.label + ' — ';
      li.append(strong, document.createTextNode(s.ref));
      ul.appendChild(li);
    });
    body.append(srcH, ul);
  }
  if (t.steps && t.steps.length) {
    const stepsH = document.createElement('h4');
    stepsH.textContent = 'Steps';
    const ol = document.createElement('ol');
    t.steps.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      ol.appendChild(li);
    });
    body.append(stepsH, ol);
  }
  if (t.confirm) {
    const note = document.createElement('p');
    note.className = 'confirm-note';
    note.textContent = 'Still to confirm: ' + t.confirm;
    body.appendChild(note);
  }
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.textContent = state.earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => toggleEarned(t.id, !state.earned.has(t.id)));
  body.appendChild(earnedBtn);
}

function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.innerHTML = '';
  ROADMAP_STAGES.forEach((stage) => {
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    state.trophies
      .filter((t) => t.roadmap === stage.stage)
      .forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'stage-trophy' + (state.earned.has(t.id) ? ' done' : '');
        const hidden = isSpoilerHidden(t);
        b.innerHTML = '<span class="' + medalClass(t.grade) + '"></span>';
        b.appendChild(document.createTextNode(hidden ? 'Hidden story trophy' : t.name));
        b.addEventListener('click', () => {
          selectTrophy(t.id);
          switchView('checklist');
        });
        chips.appendChild(b);
      });
    div.append(h, p, chips);
    wrap.appendChild(div);
  });
}

function renderMissables() {
  const wrap = $('missableList');
  wrap.innerHTML = '';
  state.trophies.filter((t) => t.missable).forEach((t) => {
    const card = document.createElement('article');
    card.className = 'missable-card';
    const h = document.createElement('h3');
    h.textContent = t.name;
    const desc = document.createElement('p');
    desc.textContent = t.description;
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = 'Why it is flagged: ' + (t.id === 48
      ? 'Choices cannot be unmade — a decision, once made, locks the other branch out on this playthrough.'
      : 'The official description does not say this stranger strand stays available after the final story mission.');
    const note = document.createElement('p');
    note.textContent = t.confirm ? 'Still to confirm: ' + t.confirm : '';
    card.append(h, desc, why, note);
    card.addEventListener('click', () => {
      selectTrophy(t.id);
      switchView('checklist');
    });
    wrap.appendChild(card);
  });
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function toggleEarned(id, earned) {
  if (earned) state.earned.add(id);
  else state.earned.delete(id);
  saveStored();
  renderAll();
}

function selectTrophy(id) {
  state.selectedId = id;
  renderList();
  renderDetail();
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle('active', section.id === 'view-' + view);
  });
}

function exportData() {
  return {
    app: 'leonida-platinum',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  };
}

function importData(data) {
  if (!data || !Array.isArray(data.earned)) throw new Error('Not a Leonida Platinum export file.');
  const valid = new Set(state.trophies.map((t) => t.id));
  const next = new Set();
  data.earned.forEach((id) => { if (valid.has(id)) next.add(id); });
  state.earned = next;
  if (typeof data.spoiler === 'boolean') {
    state.spoiler = data.spoiler;
    $('spoilerToggle').checked = state.spoiler;
  }
  saveStored();
  renderAll();
  return state.earned.size;
}

function downloadExport() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function boot() {
  loadStored();
  $('spoilerToggle').checked = state.spoiler;
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error('Could not load data/trophies.json');
  const data = await response.json();
  state.trophies = data.trophies || data;
  state.trophies.sort((a, b) => a.id - b.id);
  $('missableBadge').textContent = String(state.trophies.filter((t) => t.missable).length);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });
  $('search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });
  $('kindFilter').addEventListener('change', (e) => { state.kind = e.target.value; renderList(); });
  $('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('missableOnly').addEventListener('change', (e) => { state.missableOnly = e.target.checked; renderList(); });
  $('hideEarned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; renderList(); });
  $('spoilerToggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveStored();
    renderAll();
  });
  $('exportBtn').addEventListener('click', downloadExport);
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const count = importData(data);
      alert('Imported progress: ' + count + ' trophies earned.');
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies and reset the tracker?')) {
      state.earned.clear();
      state.selectedId = null;
      saveStored();
      renderAll();
    }
  });

  renderAll();
}

/* Test hooks for the scripted browser check: the export/import round-trip
   and the stored state, without touching the file picker. */
window.__trophyApp = { state, exportData, importData, toggleEarned, selectTrophy, switchView, renderAll };

boot().catch((err) => {
  console.error(err);
  $('trophyList').innerHTML = '<p>Could not load the trophy list. Open this guide from a static server (for example, node serve.ts) so data/trophies.json can be fetched.</p>';
});
