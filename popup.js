// CODEC v3.0 — popup.js
const INTEL_TTL = 48 * 60 * 60 * 1000;
let activeJdId = null;
let jdInputType = 'text';
let activeGroupId = null;
let editingGroupId = null;

// ─── TABS ──────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
    if (btn.dataset.tab === 'intel') renderIntel();
    if (btn.dataset.tab === 'groups') renderGroups();
    if (btn.dataset.tab === 'settings') loadKeys();
    if (btn.dataset.tab === 'scan') loadGroupPills();
  });
});

// ─── SCAN MODE TOGGLE ─────────────────────────────────────────
document.getElementById('mode-single').addEventListener('click', () => {
  document.getElementById('mode-single').classList.add('active');
  document.getElementById('mode-group').classList.remove('active');
  document.getElementById('single-mode').classList.remove('hidden');
  document.getElementById('group-mode').classList.add('hidden');
});
document.getElementById('mode-group').addEventListener('click', () => {
  document.getElementById('mode-group').classList.add('active');
  document.getElementById('mode-single').classList.remove('active');
  document.getElementById('group-mode').classList.remove('hidden');
  document.getElementById('single-mode').classList.add('hidden');
  loadGroupPills();
});

// ─── GROUP PILLS (scan tab) ───────────────────────────────────
function loadGroupPills() {
  chrome.storage.local.get(['groups', 'activeGroupId'], ({ groups = [], activeGroupId: agid }) => {
    activeGroupId = agid || null;
    const bar = document.getElementById('group-select-bar');
    bar.innerHTML = '';
    if (!groups.length) {
      bar.innerHTML = '<p style="color:#003a10;font-size:10px;letter-spacing:1px">NO GROUPS — CREATE IN [ GROUPS ] TAB</p>';
      return;
    }
    groups.forEach(g => {
      const btn = document.createElement('button');
      btn.className = 'group-pill' + (g.id === activeGroupId ? ' active' : '');
      btn.textContent = g.name + ' (' + (g.jdIds?.length || 0) + ')';
      btn.addEventListener('click', () => {
        activeGroupId = g.id;
        chrome.storage.local.set({ activeGroupId: g.id });
        document.getElementById('active-group-name').textContent = g.name;
        document.querySelectorAll('.group-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
      });
      bar.appendChild(btn);
    });
    const activeG = groups.find(g => g.id === activeGroupId);
    document.getElementById('active-group-name').textContent = activeG ? activeG.name : '— NO GROUP SELECTED —';
  });
}

// ─── JD INPUT TYPE ────────────────────────────────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    jdInputType = btn.dataset.type;
    document.getElementById('jd-text').classList.toggle('hidden', jdInputType !== 'text');
    document.getElementById('jd-url').classList.toggle('hidden', jdInputType !== 'url');
    document.getElementById('jd-pdf-area').classList.toggle('hidden', jdInputType !== 'pdf');
  });
});
document.getElementById('jd-pdf-area').addEventListener('click', () => document.getElementById('jd-pdf-file').click());

// ─── JDs ──────────────────────────────────────────────────────
function loadJds() {
  chrome.storage.local.get(['jds', 'activeJdId'], ({ jds = [], activeJdId: aid }) => {
    activeJdId = aid || null;
    renderJdList(jds);
    const active = jds.find(j => j.id === activeJdId);
    document.getElementById('active-jd-name').textContent = active ? active.name : '— NO JD LOADED —';
  });
}

function renderJdList(jds) {
  const list = document.getElementById('jd-list');
  list.innerHTML = '';
  if (!jds.length) { list.innerHTML = '<p style="color:#003a10;font-size:11px;text-align:center;padding:10px">NO MISSIONS SAVED</p>'; return; }
  jds.forEach(jd => {
    const item = document.createElement('div');
    item.className = 'jd-item' + (jd.id === activeJdId ? ' active' : '');
    const date = new Date(parseInt(jd.id)).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
    item.innerHTML = `<div style="flex:1;overflow:hidden"><div class="jd-item-name">▶ ${jd.name}</div><div style="font-size:9px;color:#003a10">ADDED ${date}</div></div><button class="jd-item-del" data-id="${jd.id}">✕</button>`;
    item.querySelector('.jd-item-name').addEventListener('click', () => setActiveJd(jd.id));
    item.querySelector('.jd-item-del').addEventListener('click', e => { e.stopPropagation(); deleteJd(jd.id); });
    list.appendChild(item);
  });
}

function setActiveJd(id) {
  chrome.storage.local.get(['jds'], ({ jds = [] }) => {
    chrome.storage.local.set({ activeJdId: id }, () => {
      activeJdId = id;
      const active = jds.find(j => j.id === id);
      document.getElementById('active-jd-name').textContent = active ? active.name : '—';
      renderJdList(jds);
    });
  });
}

function deleteJd(id) {
  chrome.storage.local.get(['jds', 'groups'], ({ jds = [], groups = [] }) => {
    const updatedJds = jds.filter(j => j.id !== id);
    const updatedGroups = groups.map(g => ({ ...g, jdIds: (g.jdIds || []).filter(jid => jid !== id) }));
    const updates = { jds: updatedJds, groups: updatedGroups };
    if (activeJdId === id) { updates.activeJdId = null; activeJdId = null; }
    chrome.storage.local.set(updates, loadJds);
  });
}

document.getElementById('btn-add-jd').addEventListener('click', async () => {
  const name = document.getElementById('jd-name').value.trim();
  if (!name) { alert('ENTER A MISSION NAME'); return; }
  let content = '';
  if (jdInputType === 'text') {
    content = document.getElementById('jd-text').value.trim();
    if (!content) { alert('PASTE JOB DESCRIPTION TEXT'); return; }
    saveJd(name, content);
  } else if (jdInputType === 'url') {
    const url = document.getElementById('jd-url').value.trim();
    if (!url) { alert('ENTER A URL'); return; }
    document.getElementById('btn-add-jd').textContent = 'FETCHING...';
    chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, response => {
      if (response?.ok) saveJd(name, response.text);
      else alert('FAILED TO FETCH URL. TRY TEXT INPUT.\n' + (response?.error || ''));
      document.getElementById('btn-add-jd').textContent = '+ ADD MISSION';
    });
  } else if (jdInputType === 'pdf') {
    const file = document.getElementById('jd-pdf-file').files[0];
    if (!file) { alert('SELECT A PDF FILE'); return; }
    document.getElementById('btn-add-jd').textContent = 'READING PDF...';
    try { content = await extractPdfText(file); saveJd(name, content); }
    catch { alert('FAILED TO READ PDF'); }
    document.getElementById('btn-add-jd').textContent = '+ ADD MISSION';
  }
});

async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const c = await page.getTextContent();
          text += c.items.map(s => s.str).join(' ') + '\n';
        }
        resolve(text.slice(0, 8000));
      } catch(err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function saveJd(name, content) {
  chrome.storage.local.get(['jds'], ({ jds = [] }) => {
    const newJd = { id: Date.now().toString(), name, content };
    chrome.storage.local.set({ jds: [...jds, newJd] }, () => {
      document.getElementById('jd-name').value = '';
      document.getElementById('jd-text').value = '';
      document.getElementById('jd-url').value = '';
      document.getElementById('jd-pdf-file').value = '';
      setActiveJd(newJd.id);
      loadJds();
    });
  });
}

// ─── GROUPS ───────────────────────────────────────────────────
function renderGroups() {
  chrome.storage.local.get(['groups', 'jds'], ({ groups = [], jds = [] }) => {
    const list = document.getElementById('groups-list');
    list.innerHTML = '';
    if (!groups.length) { list.innerHTML = '<p style="color:#003a10;font-size:11px;text-align:center;padding:10px">NO GROUPS CREATED</p>'; return; }
    groups.forEach(g => {
      const count = (g.jdIds || []).length;
      const item = document.createElement('div');
      item.className = 'group-item';
      item.innerHTML = `<div class="group-item-name">⬡ ${g.name}</div><div class="group-item-count">${count} JD${count !== 1 ? 's' : ''}</div><button class="group-item-edit" data-id="${g.id}">EDIT</button><button class="group-item-del" data-id="${g.id}">✕</button>`;
      item.querySelector('.group-item-edit').addEventListener('click', () => openGroupEdit(g.id));
      item.querySelector('.group-item-del').addEventListener('click', () => deleteGroup(g.id));
      list.appendChild(item);
    });
  });
}

document.getElementById('btn-create-group').addEventListener('click', () => {
  const name = document.getElementById('group-name-input').value.trim();
  if (!name) { alert('ENTER A GROUP NAME'); return; }
  chrome.storage.local.get(['groups'], ({ groups = [] }) => {
    const newGroup = { id: Date.now().toString(), name, jdIds: [] };
    chrome.storage.local.set({ groups: [...groups, newGroup] }, () => {
      document.getElementById('group-name-input').value = '';
      renderGroups();
      openGroupEdit(newGroup.id);
    });
  });
});

function deleteGroup(id) {
  chrome.storage.local.get(['groups'], ({ groups = [] }) => {
    chrome.storage.local.set({ groups: groups.filter(g => g.id !== id) }, renderGroups);
  });
}

function openGroupEdit(id) {
  chrome.storage.local.get(['groups', 'jds'], ({ groups = [], jds = [] }) => {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    editingGroupId = id;
    document.getElementById('group-edit-name').textContent = group.name;
    document.getElementById('group-edit-panel').classList.remove('hidden');
    const picker = document.getElementById('group-jd-picker');
    picker.innerHTML = '';
    if (!jds.length) { picker.innerHTML = '<p style="color:#003a10;font-size:10px;padding:6px">NO JDs SAVED — ADD MISSIONS FIRST</p>'; return; }
    jds.forEach(jd => {
      const selected = (group.jdIds || []).includes(jd.id);
      const row = document.createElement('div');
      row.className = 'jd-pick-row' + (selected ? ' selected' : '');
      row.innerHTML = `<div class="jd-pick-check">${selected ? '✔' : ''}</div><div class="jd-pick-name">${jd.name}</div>`;
      row.addEventListener('click', () => toggleJdInGroup(id, jd.id, row));
      picker.appendChild(row);
    });
  });
}

function toggleJdInGroup(groupId, jdId, row) {
  chrome.storage.local.get(['groups'], ({ groups = [] }) => {
    const groups2 = groups.map(g => {
      if (g.id !== groupId) return g;
      const ids = g.jdIds || [];
      const updated = ids.includes(jdId) ? ids.filter(i => i !== jdId) : [...ids, jdId];
      return { ...g, jdIds: updated };
    });
    chrome.storage.local.set({ groups: groups2 }, () => {
      const group = groups2.find(g => g.id === groupId);
      const selected = (group.jdIds || []).includes(jdId);
      row.classList.toggle('selected', selected);
      row.querySelector('.jd-pick-check').textContent = selected ? '✔' : '';
      renderGroups();
    });
  });
}

document.getElementById('btn-close-edit').addEventListener('click', () => {
  document.getElementById('group-edit-panel').classList.add('hidden');
  editingGroupId = null;
});

// ─── INTEL ────────────────────────────────────────────────────
function purgeExpiredIntel(intel) {
  return intel.filter(c => (Date.now() - c.scannedAt) < INTEL_TTL);
}

function saveToIntel(candidate) {
  chrome.storage.local.get(['intel'], ({ intel = [] }) => {
    const fresh = purgeExpiredIntel(intel);
    const idx = fresh.findIndex(c => c.profileUrl === candidate.profileUrl && c.jdName === candidate.jdName);
    if (idx >= 0) fresh[idx] = candidate; else fresh.unshift(candidate);
    chrome.storage.local.set({ intel: fresh });
  });
}

function renderIntel() {
  chrome.storage.local.get(['intel'], ({ intel = [] }) => {
    const fresh = purgeExpiredIntel(intel);
    chrome.storage.local.set({ intel: fresh });
    const list = document.getElementById('intel-list');
    const empty = document.getElementById('intel-empty');
    list.innerHTML = '';
    if (!fresh.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');
    fresh.forEach(c => {
      const remaining = INTEL_TTL - (Date.now() - c.scannedAt);
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const expiry = h > 0 ? `PURGE IN ${h}H ${m}M` : `PURGE IN ${m}M`;
      const scoreClass = c.score >= 70 ? 'high' : c.score >= 45 ? 'mid' : 'low';
      const scannedDate = new Date(c.scannedAt).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      const card = document.createElement('div');
      card.className = 'intel-card';
      card.innerHTML = `
        <div class="intel-card-top">
          <div class="intel-name">⬡ ${c.name}</div>
          <div class="intel-score ${scoreClass}">${c.score}%</div>
        </div>
        <div class="intel-card-mid">
          <div class="intel-verdict">${c.verdict}</div>
          <div class="intel-jd">JD: ${c.jdName}</div>
        </div>
        ${c.groupName ? `<div class="intel-group-badge is-group">GROUP: ${c.groupName}</div>` : ''}
        <div class="intel-card-bot">
          <div><div class="intel-time">SCANNED ${scannedDate}</div><div class="intel-expiry ${h < 6 ? 'urgent' : 'ok'}">${expiry}</div></div>
          <a href="${c.profileUrl}" target="_blank" class="intel-link">VIEW ↗</a>
        </div>`;
      list.appendChild(card);
    });
  });
}

document.getElementById('btn-clear-intel').addEventListener('click', () => {
  chrome.storage.local.set({ intel: [] }, renderIntel);
});

// ─── SETTINGS ─────────────────────────────────────────────────
function loadKeys() {
  chrome.storage.local.get(['apiKeys', 'activeKeyId'], ({ apiKeys = [], activeKeyId }) => {
    const list = document.getElementById('keys-list');
    list.innerHTML = '';
    if (!apiKeys.length) { list.innerHTML = '<p style="color:#003a10;font-size:11px;text-align:center;padding:8px">NO KEYS ON FILE</p>'; return; }
    apiKeys.forEach(k => {
      const isActive = k.id === activeKeyId;
      const item = document.createElement('div');
      item.className = 'key-item' + (isActive ? ' active' : '');
      item.innerHTML = `<div class="key-item-label">⬡ ${k.label}</div>${isActive ? '<span class="key-active-badge">● ACTIVE</span>' : `<button class="key-item-use" data-id="${k.id}">USE</button>`}<button class="key-item-del" data-id="${k.id}">✕</button>`;
      if (!isActive) item.querySelector('.key-item-use').addEventListener('click', () => setActiveKey(k.id));
      item.querySelector('.key-item-del').addEventListener('click', () => deleteKey(k.id));
      list.appendChild(item);
    });
    const status = document.getElementById('key-status');
    const active = apiKeys.find(k => k.id === activeKeyId);
    if (active) { status.textContent = `✔ ACTIVE: ${active.label}`; status.className = 'key-status ok'; }
    else { status.textContent = '— NO ACTIVE KEY'; status.className = 'key-status err'; }
  });
}

function setActiveKey(id) { chrome.storage.local.set({ activeKeyId: id }, loadKeys); }

function deleteKey(id) {
  chrome.storage.local.get(['apiKeys', 'activeKeyId'], ({ apiKeys = [], activeKeyId }) => {
    const updated = apiKeys.filter(k => k.id !== id);
    const updates = { apiKeys: updated };
    if (activeKeyId === id) updates.activeKeyId = updated.length ? updated[0].id : null;
    chrome.storage.local.set(updates, loadKeys);
  });
}

document.getElementById('btn-save-key').addEventListener('click', () => {
  const label = document.getElementById('key-label-input').value.trim();
  const key = document.getElementById('api-key-input').value.trim();
  const status = document.getElementById('key-status');
  if (!label) { status.textContent = '✕ ENTER A KEY LABEL'; status.className = 'key-status err'; return; }
  if (!key.startsWith('sk-ant-')) { status.textContent = '✕ INVALID KEY FORMAT'; status.className = 'key-status err'; return; }
  chrome.storage.local.get(['apiKeys'], ({ apiKeys = [] }) => {
    const newKey = { id: Date.now().toString(), label, value: key };
    chrome.storage.local.set({ apiKeys: [...apiKeys, newKey], activeKeyId: newKey.id }, () => {
      document.getElementById('key-label-input').value = '';
      document.getElementById('api-key-input').value = '';
      loadKeys();
    });
  });
});

// ─── SCAN HELPERS ─────────────────────────────────────────────
function showState(id) {
  ['scan-idle','scan-loading','scan-result','scan-error'].forEach(s =>
    document.getElementById(s).classList.toggle('hidden', s !== id));
}
function showGroupState(id) {
  ['group-idle','group-loading','group-result','group-error'].forEach(s =>
    document.getElementById(s).classList.toggle('hidden', s !== id));
}
function setProgress(pct) { document.getElementById('progress-fill').style.width = pct + '%'; }
function setGroupProgress(pct) { document.getElementById('group-progress-fill').style.width = pct + '%'; }

const LOADING_MSGS = ['SCANNING TARGET PROFILE...','CROSS-REFERENCING MISSION DATA...','ANALYZING COMPETENCIES...','CALCULATING COMPATIBILITY...','COMPILING MISSION REPORT...'];

async function getApiKey() {
  return new Promise(resolve => {
    chrome.storage.local.get(['apiKeys', 'activeKeyId'], ({ apiKeys = [], activeKeyId }) => {
      const active = apiKeys.find(k => k.id === activeKeyId);
      resolve(active?.value || null);
    });
  });
}

async function getProfileText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__CODEC_PROFILE__ || document.body.innerText.slice(0, 6000)
    });
    return results[0]?.result || '';
  } catch { return ''; }
}

async function callClaude(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) { const e = await response.json(); throw new Error(e.error?.message || 'API ERROR'); }
  const data = await response.json();
  const raw = data.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(raw);
}

// ─── SINGLE SCAN ──────────────────────────────────────────────
document.getElementById('btn-scan').addEventListener('click', runScan);
document.getElementById('btn-rescan').addEventListener('click', runScan);
document.getElementById('btn-retry').addEventListener('click', runScan);

async function runScan() {
  const apiKey = await getApiKey();
  if (!apiKey) { showState('scan-error'); document.getElementById('error-msg').textContent = '✕ NO ACTIVE KEY — GO TO [ CONFIG ]'; return; }
  chrome.storage.local.get(['jds', 'activeJdId'], async ({ jds = [], activeJdId: aid }) => {
    const activeJd = jds.find(j => j.id === aid);
    if (!activeJd) { showState('scan-error'); document.getElementById('error-msg').textContent = '✕ NO ACTIVE MISSION — GO TO [ JDs ]'; return; }
    showState('scan-loading'); setProgress(0);
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      document.getElementById('loading-msg').textContent = LOADING_MSGS[msgIdx % LOADING_MSGS.length];
      setProgress(Math.min((msgIdx + 1) * 20, 90));
      msgIdx++;
    }, 900);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const profileText = await getProfileText(tab.id);
      const nameMatch = profileText.match(/NAME:\s*(.+)/);
      const candidateName = nameMatch ? nameMatch[1].trim() : tab.title.split(' - ')[0] || 'UNKNOWN';
      const result = await callClaude(apiKey, buildPrompt(activeJd.content, profileText));
      clearInterval(msgInterval); setProgress(100);
      saveToIntel({ name: candidateName, profileUrl: tab.url, score: result.score, verdict: result.verdict, jdName: activeJd.name, scannedAt: Date.now() });
      displayResult(result);
    } catch(err) {
      clearInterval(msgInterval);
      showState('scan-error');
      document.getElementById('error-msg').textContent = '✕ ' + (err.message || 'TRANSMISSION FAILED');
    }
  });
}

function buildPrompt(jdContent, profileText) {
  return `You are a tactical recruitment intelligence system. Analyze compatibility between this LinkedIn profile and job description.

JOB DESCRIPTION:
${jdContent.slice(0, 3000)}

LINKEDIN PROFILE:
${profileText.slice(0, 3000)}

Respond ONLY with a JSON object (no markdown, no backticks):
{
  "score": <number 0-100>,
  "verdict": "<one of: TARGET ACQUIRED | HIGH VALUE ASSET | POTENTIAL RECRUIT | LOW PRIORITY | STAND DOWN>",
  "strengths": "<2-3 bullet points starting with •>",
  "gaps": "<2-3 bullet points starting with •>",
  "summary": "<1-2 sentence tactical assessment>"
}`;
}

function displayResult(result) {
  const score = Math.max(0, Math.min(100, result.score));
  document.getElementById('score-number').textContent = score + '%';
  document.getElementById('ring-fill').style.strokeDashoffset = 326.7 - (score / 100) * 326.7;
  document.getElementById('ring-fill').style.stroke = score >= 70 ? '#00ff41' : score >= 45 ? '#ffb700' : '#ff4444';
  document.getElementById('score-verdict').textContent = result.verdict || 'ANALYSIS COMPLETE';
  document.getElementById('block-strengths').textContent = result.strengths || '—';
  document.getElementById('block-gaps').textContent = result.gaps || '—';
  document.getElementById('block-verdict').textContent = result.summary || '—';
  showState('scan-result');
}

// ─── GROUP SCAN ───────────────────────────────────────────────
document.getElementById('btn-group-scan').addEventListener('click', runGroupScan);
document.getElementById('btn-group-rescan').addEventListener('click', runGroupScan);
document.getElementById('btn-group-retry').addEventListener('click', runGroupScan);

async function runGroupScan() {
  const apiKey = await getApiKey();
  if (!apiKey) { showGroupState('group-error'); document.getElementById('group-error-msg').textContent = '✕ NO ACTIVE KEY — GO TO [ CONFIG ]'; return; }
  chrome.storage.local.get(['groups', 'jds', 'activeGroupId'], async ({ groups = [], jds = [], activeGroupId: agid }) => {
    const group = groups.find(g => g.id === agid);
    if (!group) { showGroupState('group-error'); document.getElementById('group-error-msg').textContent = '✕ NO GROUP SELECTED'; return; }
    const groupJds = jds.filter(j => (group.jdIds || []).includes(j.id));
    if (!groupJds.length) { showGroupState('group-error'); document.getElementById('group-error-msg').textContent = '✕ GROUP HAS NO JDs — EDIT IN [ GROUPS ]'; return; }

    showGroupState('group-loading'); setGroupProgress(0);
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      document.getElementById('group-loading-msg').textContent = `SCANNING JD ${Math.min(msgIdx + 1, groupJds.length)} OF ${groupJds.length}...`;
      setGroupProgress(Math.min(((msgIdx + 1) / groupJds.length) * 85, 85));
      msgIdx++;
    }, 1200);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const profileText = await getProfileText(tab.id);
      const nameMatch = profileText.match(/NAME:\s*(.+)/);
      const candidateName = nameMatch ? nameMatch[1].trim() : tab.title.split(' - ')[0] || 'UNKNOWN';

      // Run all JD scans in parallel
      const results = await Promise.all(groupJds.map(async jd => {
        const result = await callClaude(apiKey, buildPrompt(jd.content, profileText));
        return { jd, result };
      }));

      clearInterval(msgInterval); setGroupProgress(100);

      // Sort by score descending
      results.sort((a, b) => b.result.score - a.result.score);

      // Save all to INTEL
      results.forEach(({ jd, result }) => {
        saveToIntel({ name: candidateName, profileUrl: tab.url, score: result.score, verdict: result.verdict, jdName: jd.name, groupName: group.name, scannedAt: Date.now() });
      });

      displayGroupResults(results, candidateName, group.name);
    } catch(err) {
      clearInterval(msgInterval);
      showGroupState('group-error');
      document.getElementById('group-error-msg').textContent = '✕ ' + (err.message || 'TRANSMISSION FAILED');
    }
  });
}

function displayGroupResults(results, candidateName, groupName) {
  document.getElementById('group-result-sub').textContent = `${candidateName} — ${results.length} JDs ANALYZED`;
  const container = document.getElementById('group-result-cards');
  container.innerHTML = '';

  results.forEach(({ jd, result }, idx) => {
    const score = Math.max(0, Math.min(100, result.score));
    const scoreClass = score >= 70 ? 'high' : score >= 45 ? 'mid' : 'low';
    const barColor = score >= 70 ? '#00ff41' : score >= 45 ? '#ffb700' : '#ff4444';
    const isTop = idx === 0;

    const card = document.createElement('div');
    card.className = 'match-card' + (isTop ? ' top-match' : '');
    card.innerHTML = `
      <div class="match-card-top">
        <div class="match-jd-name">${jd.name}</div>
        <div class="match-score ${scoreClass}">${score}%</div>
      </div>
      <div class="match-verdict">${result.verdict}</div>
      <div class="match-bar"><div class="match-bar-fill" style="width:0%;background:${barColor}"></div></div>
      <div class="match-summary">${result.summary}</div>`;

    container.appendChild(card);
    // Animate bar after render
    setTimeout(() => { card.querySelector('.match-bar-fill').style.width = score + '%'; }, 50 + idx * 100);
  });

  showGroupState('group-result');
}

// ─── INIT ─────────────────────────────────────────────────────
loadJds();
