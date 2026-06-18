// CODEC v2.0 — popup.js
const INTEL_TTL = 48 * 60 * 60 * 1000; // 48 hours in ms
let activeJdId = null;
let jdInputType = 'text';

// ─── TABS ────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
    if (btn.dataset.tab === 'intel') renderIntel();
  });
});

// ─── JD INPUT TYPE ───────────────────────────────────────────────
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

document.getElementById('jd-pdf-area').addEventListener('click', () => {
  document.getElementById('jd-pdf-file').click();
});

// ─── JDs ─────────────────────────────────────────────────────────
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
  if (!jds.length) {
    list.innerHTML = '<p style="color:#003a10;font-size:11px;text-align:center;padding:10px">NO MISSIONS SAVED</p>';
    return;
  }
  jds.forEach(jd => {
    const item = document.createElement('div');
    item.className = 'jd-item' + (jd.id === activeJdId ? ' active' : '');
    const date = new Date(parseInt(jd.id)).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
    item.innerHTML = `
      <div style="flex:1;overflow:hidden">
        <div class="jd-item-name">▶ ${jd.name}</div>
        <div style="font-size:9px;color:#003a10">ADDED ${date}</div>
      </div>
      <button class="jd-item-del" data-id="${jd.id}">✕</button>`;
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
  chrome.storage.local.get(['jds'], ({ jds = [] }) => {
    const updated = jds.filter(j => j.id !== id);
    const updates = { jds: updated };
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
    try {
      const resp = await fetch(url);
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      content = doc.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 8000);
      saveJd(name, content);
    } catch { alert('FAILED TO FETCH URL. TRY TEXT INPUT.'); }
    document.getElementById('btn-add-jd').textContent = '+ ADD MISSION';
  } else if (jdInputType === 'pdf') {
    const file = document.getElementById('jd-pdf-file').files[0];
    if (!file) { alert('SELECT A PDF FILE'); return; }
    document.getElementById('btn-add-jd').textContent = 'READING PDF...';
    try {
      content = await extractPdfText(file);
      saveJd(name, content);
    } catch { alert('FAILED TO READ PDF'); }
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

// ─── INTEL ───────────────────────────────────────────────────────
function purgeExpiredIntel(intel) {
  const now = Date.now();
  return intel.filter(c => (now - c.scannedAt) < INTEL_TTL);
}

function saveToIntel(candidate) {
  chrome.storage.local.get(['intel'], ({ intel = [] }) => {
    const fresh = purgeExpiredIntel(intel);
    // Update if same profile already exists, else prepend
    const idx = fresh.findIndex(c => c.profileUrl === candidate.profileUrl);
    if (idx >= 0) fresh[idx] = candidate;
    else fresh.unshift(candidate);
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

    if (!fresh.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    fresh.forEach(c => {
      const now = Date.now();
      const elapsed = now - c.scannedAt;
      const remaining = INTEL_TTL - elapsed;
      const hoursLeft = Math.floor(remaining / 3600000);
      const minsLeft = Math.floor((remaining % 3600000) / 60000);
      const expiryText = hoursLeft > 0 ? `PURGE IN ${hoursLeft}H ${minsLeft}M` : `PURGE IN ${minsLeft}M`;
      const isUrgent = hoursLeft < 6;

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
        <div class="intel-card-bot">
          <div>
            <div class="intel-time">SCANNED ${scannedDate}</div>
            <div class="intel-expiry ${isUrgent ? 'urgent' : 'ok'}">${expiryText}</div>
          </div>
          <a href="${c.profileUrl}" target="_blank" class="intel-link">VIEW PROFILE ↗</a>
        </div>`;
      list.appendChild(card);
    });
  });
}

document.getElementById('btn-clear-intel').addEventListener('click', () => {
  chrome.storage.local.set({ intel: [] }, renderIntel);
});

// ─── SETTINGS ────────────────────────────────────────────────────
document.getElementById('btn-save-key').addEventListener('click', () => {
  const key = document.getElementById('api-key-input').value.trim();
  const status = document.getElementById('key-status');
  if (!key.startsWith('sk-ant-')) {
    status.textContent = '✕ INVALID KEY FORMAT';
    status.className = 'key-status err';
    return;
  }
  chrome.storage.local.set({ apiKey: key }, () => {
    status.textContent = '✔ KEY SAVED — OPERATOR AUTHENTICATED';
    status.className = 'key-status ok';
    document.getElementById('api-key-input').value = '';
  });
});

chrome.storage.local.get(['apiKey'], ({ apiKey }) => {
  if (apiKey) {
    document.getElementById('key-status').textContent = '✔ KEY ON FILE';
    document.getElementById('key-status').className = 'key-status ok';
  }
});

// ─── SCAN ─────────────────────────────────────────────────────────
function showState(id) {
  ['scan-idle','scan-loading','scan-result','scan-error'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}
function setProgress(pct) { document.getElementById('progress-fill').style.width = pct + '%'; }

const LOADING_MSGS = [
  'SCANNING TARGET PROFILE...',
  'CROSS-REFERENCING MISSION DATA...',
  'ANALYZING COMPETENCIES...',
  'CALCULATING COMPATIBILITY...',
  'COMPILING MISSION REPORT...'
];

document.getElementById('btn-scan').addEventListener('click', runScan);
document.getElementById('btn-rescan').addEventListener('click', runScan);
document.getElementById('btn-retry').addEventListener('click', runScan);

async function runScan() {
  chrome.storage.local.get(['jds', 'activeJdId', 'apiKey'], async ({ jds = [], activeJdId: aid, apiKey }) => {
    if (!apiKey) { showState('scan-error'); document.getElementById('error-msg').textContent = '✕ NO API KEY — GO TO [ CONFIG ]'; return; }
    const activeJd = jds.find(j => j.id === aid);
    if (!activeJd) { showState('scan-error'); document.getElementById('error-msg').textContent = '✕ NO ACTIVE MISSION — GO TO [ JDs ]'; return; }

    showState('scan-loading');
    setProgress(0);
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      document.getElementById('loading-msg').textContent = LOADING_MSGS[msgIdx % LOADING_MSGS.length];
      setProgress(Math.min((msgIdx + 1) * 20, 90));
      msgIdx++;
    }, 900);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const profileUrl = tab.url;
      let profileText = '';
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.__CODEC_PROFILE__ || document.body.innerText.slice(0, 6000)
        });
        profileText = results[0]?.result || '';
      } catch { profileText = 'Could not extract profile.'; }

      // Extract name from profile text
      const nameMatch = profileText.match(/NAME:\s*(.+)/);
      const candidateName = nameMatch ? nameMatch[1].trim() : tab.title.split(' - ')[0] || 'UNKNOWN';

      const prompt = `You are a tactical recruitment intelligence system. Analyze the compatibility between this LinkedIn profile and job description.

JOB DESCRIPTION:
${activeJd.content.slice(0, 3000)}

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

      clearInterval(msgInterval);
      setProgress(100);

      if (!response.ok) { const e = await response.json(); throw new Error(e.error?.message || 'API ERROR'); }

      const data = await response.json();
      const raw = data.content[0].text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(raw);

      // Save to INTEL
      saveToIntel({
        name: candidateName,
        profileUrl,
        score: result.score,
        verdict: result.verdict,
        jdName: activeJd.name,
        scannedAt: Date.now()
      });

      displayResult(result);
    } catch(err) {
      clearInterval(msgInterval);
      showState('scan-error');
      document.getElementById('error-msg').textContent = '✕ ' + (err.message || 'TRANSMISSION FAILED');
    }
  });
}

function displayResult(result) {
  const score = Math.max(0, Math.min(100, result.score));
  document.getElementById('score-number').textContent = score + '%';
  document.getElementById('ring-fill').style.strokeDashoffset = 326.7 - (score / 100) * 326.7;
  const ring = document.getElementById('ring-fill');
  ring.style.stroke = score >= 70 ? '#00ff41' : score >= 45 ? '#ffb700' : '#ff4444';
  document.getElementById('score-verdict').textContent = result.verdict || 'ANALYSIS COMPLETE';
  document.getElementById('block-strengths').textContent = result.strengths || '—';
  document.getElementById('block-gaps').textContent = result.gaps || '—';
  document.getElementById('block-verdict').textContent = result.summary || '—';
  showState('scan-result');
}

// ─── INIT ─────────────────────────────────────────────────────────
loadJds();
