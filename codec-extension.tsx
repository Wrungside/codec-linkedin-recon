import { useState } from "react";

const files = {
  "manifest.json": {
    lang: "json",
    content: `{
  "manifest_version": 3,
  "name": "CODEC — LinkedIn Recon",
  "version": "1.0.0",
  "description": "Tactical LinkedIn profile matcher for recruiters. Powered by Claude AI.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://www.linkedin.com/*",
    "https://api.anthropic.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/in/*"],
      "js": ["content.js"]
    }
  ],
  "icons": {
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`
  },
  "popup.html": {
    lang: "html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CODEC</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div id="app">
    <!-- HEADER -->
    <div class="header">
      <div class="codec-logo">
        <span class="blink">▮</span> CODEC <span class="version">v1.0</span>
      </div>
      <div class="nav-tabs">
        <button class="tab-btn active" data-tab="scan">[ SCAN ]</button>
        <button class="tab-btn" data-tab="jds">[ JDs ]</button>
        <button class="tab-btn" data-tab="settings">[ CONFIG ]</button>
      </div>
    </div>

    <!-- SCAN TAB -->
    <div id="tab-scan" class="tab-content active">
      <div class="active-jd-bar">
        <span class="label">ACTIVE MISSION:</span>
        <span id="active-jd-name">— NO JD LOADED —</span>
      </div>
      <div class="scan-area">
        <div id="scan-idle" class="scan-state">
          <div class="target-box">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>
            <p class="scan-hint">NAVIGATE TO A<br/>LINKEDIN PROFILE<br/>TO BEGIN RECON</p>
          </div>
          <button id="btn-scan" class="cta-btn">⬡ INITIATE SCAN</button>
        </div>
        <div id="scan-loading" class="scan-state hidden">
          <div class="loader-wrap">
            <div class="scanline-anim"></div>
            <p class="loading-text" id="loading-msg">SCANNING TARGET...</p>
            <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
          </div>
        </div>
        <div id="scan-result" class="scan-state hidden">
          <div class="score-section">
            <div class="score-label">COMPATIBILITY SCORE</div>
            <div class="score-ring">
              <svg viewBox="0 0 120 120" class="ring-svg">
                <circle cx="60" cy="60" r="52" class="ring-bg"/>
                <circle cx="60" cy="60" r="52" class="ring-fill" id="ring-fill"/>
              </svg>
              <div class="score-number" id="score-number">--</div>
            </div>
            <div class="score-verdict" id="score-verdict">ANALYZING...</div>
          </div>
          <div class="report-blocks">
            <div class="block strengths">
              <div class="block-title">◆ STRENGTHS</div>
              <div class="block-content" id="block-strengths"></div>
            </div>
            <div class="block gaps">
              <div class="block-title">◆ GAPS</div>
              <div class="block-content" id="block-gaps"></div>
            </div>
            <div class="block verdict">
              <div class="block-title">◆ MISSION VERDICT</div>
              <div class="block-content" id="block-verdict"></div>
            </div>
          </div>
          <button id="btn-rescan" class="cta-btn secondary">↺ RE-SCAN</button>
        </div>
        <div id="scan-error" class="scan-state hidden">
          <p class="error-msg" id="error-msg">TRANSMISSION FAILED</p>
          <button id="btn-retry" class="cta-btn secondary">↺ RETRY</button>
        </div>
      </div>
    </div>

    <!-- JDs TAB -->
    <div id="tab-jds" class="tab-content hidden">
      <div class="jd-list" id="jd-list"></div>
      <div class="add-jd-section">
        <div class="jd-input-type">
          <button class="type-btn active" data-type="text">TEXT</button>
          <button class="type-btn" data-type="url">URL</button>
          <button class="type-btn" data-type="pdf">PDF</button>
        </div>
        <input type="text" id="jd-name" placeholder="MISSION NAME..." class="codec-input" />
        <textarea id="jd-text" placeholder="PASTE JOB DESCRIPTION..." class="codec-textarea" rows="4"></textarea>
        <input type="text" id="jd-url" placeholder="https://..." class="codec-input hidden" />
        <div id="jd-pdf-area" class="pdf-drop hidden">
          <label for="jd-pdf-file">⬆ DROP PDF OR CLICK TO UPLOAD</label>
          <input type="file" id="jd-pdf-file" accept=".pdf" style="display:none"/>
        </div>
        <button id="btn-add-jd" class="cta-btn">+ ADD MISSION</button>
      </div>
    </div>

    <!-- SETTINGS TAB -->
    <div id="tab-settings" class="tab-content hidden">
      <div class="settings-block">
        <div class="settings-title">OPERATOR CREDENTIALS</div>
        <p class="settings-hint">Your API key is stored locally and never shared.</p>
        <input type="password" id="api-key-input" placeholder="sk-ant-..." class="codec-input" />
        <button id="btn-save-key" class="cta-btn">SAVE KEY</button>
        <div id="key-status" class="key-status"></div>
      </div>
      <div class="settings-block">
        <div class="settings-title">ABOUT</div>
        <p class="settings-hint">CODEC v1.0 — LinkedIn Recon Tool<br/>Powered by Claude AI (Anthropic)<br/>Built for tactical recruiters.</p>
      </div>
    </div>

    <div class="footer">
      <span class="footer-text">CODEC SYSTEM ▮ CLASSIFIED</span>
    </div>
  </div>
  <script src="lib/pdf.min.js"></script>
  <script src="popup.js"></script>
</body>
</html>`
  },
  "popup.css": {
    lang: "css",
    content: `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  width: 380px;
  min-height: 520px;
  background: #000;
  color: #00ff41;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 12px;
  overflow-x: hidden;
}

body::before {
  content: '';
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px);
  pointer-events: none; z-index: 9999;
}

#app { display: flex; flex-direction: column; min-height: 520px; }

/* HEADER */
.header { background: #000; border-bottom: 1px solid #00ff41; padding: 8px 12px; }
.codec-logo { font-size: 16px; font-weight: bold; letter-spacing: 4px; color: #00ff41; margin-bottom: 8px; }
.version { font-size: 10px; color: #005f1a; margin-left: 6px; }
.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

.nav-tabs { display: flex; gap: 4px; }
.tab-btn {
  flex: 1; background: transparent; border: 1px solid #003a10;
  color: #005f1a; cursor: pointer; padding: 4px; font-family: inherit;
  font-size: 11px; letter-spacing: 1px; transition: all 0.2s;
}
.tab-btn:hover, .tab-btn.active {
  background: #001a08; border-color: #00ff41; color: #00ff41;
}

/* TABS */
.tab-content { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.tab-content.hidden { display: none; }

/* ACTIVE JD BAR */
.active-jd-bar {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid #003a10; padding: 6px 10px; background: #000d04;
}
.label { color: #005f1a; font-size: 10px; white-space: nowrap; }
#active-jd-name { color: #ffb700; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* SCAN STATES */
.scan-area { flex: 1; display: flex; align-items: center; justify-content: center; }
.scan-state { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.scan-state.hidden { display: none; }

/* TARGET BOX */
.target-box {
  position: relative; width: 160px; height: 100px;
  display: flex; align-items: center; justify-content: center;
}
.corner {
  position: absolute; width: 12px; height: 12px; border-color: #00ff41; border-style: solid;
}
.tl { top:0;left:0; border-width: 2px 0 0 2px; }
.tr { top:0;right:0; border-width: 2px 2px 0 0; }
.bl { bottom:0;left:0; border-width: 0 0 2px 2px; }
.br { bottom:0;right:0; border-width: 0 2px 2px 0; }
.scan-hint { text-align:center; color:#005f1a; font-size:11px; line-height:1.6; letter-spacing:1px; }

/* LOADER */
.loader-wrap { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.scanline-anim {
  width: 200px; height: 80px;
  background: linear-gradient(180deg, transparent 0%, rgba(0,255,65,0.15) 50%, transparent 100%);
  animation: scan 1.5s ease-in-out infinite;
  border: 1px solid #003a10;
}
@keyframes scan {
  0% { background-position: 0 -80px; }
  100% { background-position: 0 80px; }
}
.loading-text { color: #00ff41; letter-spacing: 2px; font-size: 11px; animation: blink 0.8s step-end infinite; }
.progress-bar { width: 200px; height: 6px; background: #001a08; border: 1px solid #003a10; }
.progress-fill { height: 100%; background: #00ff41; width: 0%; transition: width 0.4s ease; }

/* SCORE */
.score-section { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.score-label { color: #005f1a; font-size: 10px; letter-spacing: 2px; }
.score-ring { position: relative; width: 110px; height: 110px; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: #001a08; stroke-width: 8; }
.ring-fill {
  fill: none; stroke: #00ff41; stroke-width: 8;
  stroke-dasharray: 326.7; stroke-dashoffset: 326.7;
  transition: stroke-dashoffset 1.5s ease, stroke 0.5s;
  stroke-linecap: round;
}
.score-number {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 26px; font-weight: bold; color: #00ff41;
}
.score-verdict { font-size: 13px; letter-spacing: 3px; color: #ffb700; font-weight: bold; }

/* REPORT BLOCKS */
.report-blocks { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.block { border: 1px solid #003a10; padding: 8px; background: #000d04; }
.block-title { color: #00ff41; font-size: 10px; letter-spacing: 2px; margin-bottom: 6px; }
.block-content { color: #b3ffcc; font-size: 11px; line-height: 1.6; }
.strengths .block-title { color: #00ff41; }
.gaps .block-title { color: #ff4444; }
.gaps .block-content { color: #ffb3b3; }
.verdict .block-title { color: #ffb700; }
.verdict .block-content { color: #ffe680; }

/* BUTTONS */
.cta-btn {
  width: 100%; padding: 9px; background: #001a08;
  border: 1px solid #00ff41; color: #00ff41;
  font-family: inherit; font-size: 12px; letter-spacing: 2px;
  cursor: pointer; transition: all 0.2s; text-transform: uppercase;
}
.cta-btn:hover { background: #00ff41; color: #000; }
.cta-btn.secondary { border-color: #005f1a; color: #005f1a; }
.cta-btn.secondary:hover { background: #005f1a; color: #000; }

/* ERROR */
.error-msg { color: #ff4444; font-size: 12px; letter-spacing: 2px; text-align: center; }

/* JD LIST */
.jd-list { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; }
.jd-item {
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid #003a10; padding: 6px 10px; cursor: pointer;
  background: #000d04; transition: all 0.2s;
}
.jd-item:hover { border-color: #00ff41; }
.jd-item.active { border-color: #ffb700; background: #1a1000; }
.jd-item-name { font-size: 11px; flex: 1; color: #00ff41; }
.jd-item.active .jd-item-name { color: #ffb700; }
.jd-item-del { background: none; border: none; color: #ff4444; cursor: pointer; font-size: 14px; padding: 0 4px; font-family: inherit; }

/* ADD JD */
.add-jd-section { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid #003a10; padding-top: 10px; }
.jd-input-type { display: flex; gap: 4px; }
.type-btn {
  flex: 1; padding: 4px; background: transparent; border: 1px solid #003a10;
  color: #005f1a; cursor: pointer; font-family: inherit; font-size: 11px; letter-spacing: 1px;
}
.type-btn.active, .type-btn:hover { background: #001a08; border-color: #00ff41; color: #00ff41; }

.codec-input {
  width: 100%; background: #000d04; border: 1px solid #003a10; color: #00ff41;
  padding: 7px 10px; font-family: inherit; font-size: 11px; outline: none;
}
.codec-input:focus { border-color: #00ff41; }
.codec-textarea {
  width: 100%; background: #000d04; border: 1px solid #003a10; color: #00ff41;
  padding: 7px 10px; font-family: inherit; font-size: 11px; outline: none; resize: vertical;
}
.codec-textarea:focus { border-color: #00ff41; }

.pdf-drop {
  border: 1px dashed #003a10; padding: 14px; text-align: center;
  cursor: pointer; color: #005f1a; font-size: 11px; letter-spacing: 1px;
  transition: all 0.2s;
}
.pdf-drop:hover { border-color: #00ff41; color: #00ff41; }

/* SETTINGS */
.settings-block { border: 1px solid #003a10; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.settings-title { color: #ffb700; font-size: 11px; letter-spacing: 3px; }
.settings-hint { color: #005f1a; font-size: 10px; line-height: 1.6; }
.key-status { font-size: 11px; letter-spacing: 1px; text-align: center; }
.key-status.ok { color: #00ff41; }
.key-status.err { color: #ff4444; }

/* FOOTER */
.footer { border-top: 1px solid #003a10; padding: 5px 12px; text-align: center; }
.footer-text { color: #002a0d; font-size: 9px; letter-spacing: 3px; }`
  },
  "popup.js": {
    lang: "javascript",
    content: `// CODEC — LinkedIn Recon Extension
// popup.js

let activeJdId = null;
let jdInputType = 'text';

// ─── TAB NAVIGATION ─────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// ─── JD INPUT TYPE ──────────────────────────────────────────────
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

// ─── LOAD JDs ───────────────────────────────────────────────────
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
    item.innerHTML = \`<span class="jd-item-name">▶ \${jd.name}</span><button class="jd-item-del" data-id="\${jd.id}">✕</button>\`;
    item.querySelector('.jd-item-name').addEventListener('click', () => setActiveJd(jd.id));
    item.querySelector('.jd-item-del').addEventListener('click', (e) => { e.stopPropagation(); deleteJd(jd.id); });
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

// ─── ADD JD ─────────────────────────────────────────────────────
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
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      content = doc.body.innerText.replace(/\\s+/g, ' ').trim().slice(0, 8000);
      saveJd(name, content);
    } catch {
      alert('FAILED TO FETCH URL. TRY TEXT INPUT.');
    }
    document.getElementById('btn-add-jd').textContent = '+ ADD MISSION';

  } else if (jdInputType === 'pdf') {
    const file = document.getElementById('jd-pdf-file').files[0];
    if (!file) { alert('SELECT A PDF FILE'); return; }
    document.getElementById('btn-add-jd').textContent = 'READING PDF...';
    try {
      content = await extractPdfText(file);
      saveJd(name, content);
    } catch {
      alert('FAILED TO READ PDF');
    }
    document.getElementById('btn-add-jd').textContent = '+ ADD MISSION';
  }
});

async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(s => s.str).join(' ') + '\\n';
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
    const updated = [...jds, newJd];
    chrome.storage.local.set({ jds: updated }, () => {
      document.getElementById('jd-name').value = '';
      document.getElementById('jd-text').value = '';
      document.getElementById('jd-url').value = '';
      document.getElementById('jd-pdf-file').value = '';
      setActiveJd(newJd.id);
      loadJds();
    });
  });
}

// ─── SETTINGS ───────────────────────────────────────────────────
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

// ─── SCAN ────────────────────────────────────────────────────────
function showState(id) {
  ['scan-idle','scan-loading','scan-result','scan-error'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

function setProgress(pct) {
  document.getElementById('progress-fill').style.width = pct + '%';
}

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
    if (!apiKey) {
      showState('scan-error');
      document.getElementById('error-msg').textContent = '✕ NO API KEY — GO TO [ CONFIG ]';
      return;
    }
    const activeJd = jds.find(j => j.id === aid);
    if (!activeJd) {
      showState('scan-error');
      document.getElementById('error-msg').textContent = '✕ NO ACTIVE MISSION — GO TO [ JDs ]';
      return;
    }

    showState('scan-loading');
    setProgress(0);

    // Animate loading messages
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      document.getElementById('loading-msg').textContent = LOADING_MSGS[msgIdx % LOADING_MSGS.length];
      setProgress(Math.min((msgIdx + 1) * 20, 90));
      msgIdx++;
    }, 900);

    try {
      // Get profile data from content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      let profileText = '';

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.__CODEC_PROFILE__ || document.body.innerText.slice(0, 6000)
        });
        profileText = results[0]?.result || '';
      } catch {
        profileText = 'Could not extract profile. Ensure you are on a LinkedIn profile page.';
      }

      const prompt = \`You are a tactical recruitment intelligence system. Analyze the compatibility between this LinkedIn profile and job description.

JOB DESCRIPTION:
\${activeJd.content.slice(0, 3000)}

LINKEDIN PROFILE:
\${profileText.slice(0, 3000)}

Respond ONLY with a JSON object in this exact format (no markdown, no backticks):
{
  "score": <number 0-100>,
  "verdict": "<one of: TARGET ACQUIRED | HIGH VALUE ASSET | POTENTIAL RECRUIT | LOW PRIORITY | STAND DOWN>",
  "strengths": "<2-3 bullet points starting with •, key matching skills/experience>",
  "gaps": "<2-3 bullet points starting with •, missing requirements>",
  "summary": "<1-2 sentence tactical assessment>"
}\`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      clearInterval(msgInterval);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API ERROR');
      }

      const data = await response.json();
      const raw = data.content[0].text.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const result = JSON.parse(raw);

      displayResult(result);

    } catch (err) {
      clearInterval(msgInterval);
      showState('scan-error');
      document.getElementById('error-msg').textContent = '✕ ' + (err.message || 'TRANSMISSION FAILED');
    }
  });
}

function displayResult(result) {
  const score = Math.max(0, Math.min(100, result.score));
  const circumference = 326.7;
  const offset = circumference - (score / 100) * circumference;

  document.getElementById('score-number').textContent = score + '%';
  document.getElementById('ring-fill').style.strokeDashoffset = offset;

  // Color code the ring
  const ring = document.getElementById('ring-fill');
  if (score >= 75) ring.style.stroke = '#00ff41';
  else if (score >= 50) ring.style.stroke = '#ffb700';
  else ring.style.stroke = '#ff4444';

  document.getElementById('score-verdict').textContent = result.verdict || 'ANALYSIS COMPLETE';
  document.getElementById('block-strengths').textContent = result.strengths || '—';
  document.getElementById('block-gaps').textContent = result.gaps || '—';
  document.getElementById('block-verdict').textContent = result.summary || '—';

  showState('scan-result');
}

// ─── INIT ────────────────────────────────────────────────────────
loadJds();`
  },
  "content.js": {
    lang: "javascript",
    content: `// CODEC — Content Script
// Extracts structured data from LinkedIn profile pages

(function extractLinkedInProfile() {
  try {
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.innerText.trim() : '';
    };

    const getAllText = (selector) => {
      return Array.from(document.querySelectorAll(selector))
        .map(el => el.innerText.trim())
        .filter(Boolean)
        .join('\\n');
    };

    const name = getText('h1');
    const headline = getText('.text-body-medium.break-words');
    const about = getText('#about ~ div .pv-shared-text-with-see-more span');

    const experience = getAllText('.pvs-list__paged-list-item .display-flex.flex-column.full-width');
    const education = getAllText('section[id*="education"] .pv-shared-text-with-see-more');
    const skills = getAllText('.pvs-list__container .display-flex.align-items-center.mr1 span[aria-hidden="true"]');

    const profile = \`
NAME: \${name}
HEADLINE: \${headline}
ABOUT: \${about}

EXPERIENCE:
\${experience}

EDUCATION:
\${education}

SKILLS:
\${skills}
    \`.trim();

    window.__CODEC_PROFILE__ = profile.slice(0, 6000);
  } catch(e) {
    window.__CODEC_PROFILE__ = document.body.innerText.slice(0, 6000);
  }
})();`
  },
  "background.js": {
    lang: "javascript",
    content: `// CODEC — Background Service Worker
// Handles extension lifecycle events

chrome.runtime.onInstalled.addListener(() => {
  console.log('CODEC — LinkedIn Recon Extension installed.');
});`
  },
  "README.md": {
    lang: "markdown",
    content: `# 🔌 CODEC — LinkedIn Recon Extension

> Tactical LinkedIn profile matcher for recruiters. Powered by Claude AI.

---

## 📁 File Structure

\`\`\`
codec-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
├── lib/
│   └── pdf.min.js        ← download separately (see instructions)
├── icons/
│   ├── icon48.png        ← add your own icons
│   └── icon128.png
└── README.md
\`\`\`

---

## 🚀 Local Installation (Chrome / Brave)

1. **Download or clone** this repository
2. **Add pdf.js library:**
   - Download \`pdf.min.js\` from https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
   - Place it in the \`lib/\` folder
3. **Add icons** (any 48x48 and 128x128 PNG files) to the \`icons/\` folder
4. Open Chrome or Brave and go to \`chrome://extensions\`
5. Enable **Developer Mode** (toggle top-right)
6. Click **"Load unpacked"**
7. Select the \`codec-extension\` folder
8. The CODEC icon will appear in your toolbar ✅

---

## 🔑 Setup

1. Click the CODEC icon in your browser toolbar
2. Go to **[ CONFIG ]** tab
3. Paste your Anthropic API key (get one at https://console.anthropic.com)
4. Click **SAVE KEY**

---

## 📋 How to Use

1. Go to **[ JDs ]** tab → Add a Job Description (text, URL, or PDF)
2. Navigate to a LinkedIn profile
3. Click CODEC icon → **[ SCAN ]** tab
4. Press **⬡ INITIATE SCAN**
5. Receive your tactical mission report 🎯

---

## 🌐 Deploy to GitHub

### Step 1 — Create a GitHub account
If you don't have one: https://github.com/signup

### Step 2 — Create a new repository
1. Go to https://github.com/new
2. Repository name: \`codec-linkedin-recon\`
3. Set to **Public** (so others can install it)
4. Click **"Create repository"**

### Step 3 — Upload your files
**Option A — Via GitHub website (easiest):**
1. In your new repo, click **"uploading an existing file"**
2. Drag & drop ALL extension files (keep folder structure)
3. Click **"Commit changes"**

**Option B — Via Git (command line):**
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/codec-linkedin-recon.git
# Copy all extension files into the folder
cd codec-linkedin-recon
git add .
git commit -m "Initial release: CODEC v1.0"
git push origin main
\`\`\`

### Step 4 — Create a Release (optional but recommended)
1. In your repo, click **"Releases"** → **"Create a new release"**
2. Tag version: \`v1.0.0\`
3. Title: \`CODEC v1.0 — LinkedIn Recon Extension\`
4. Click **"Publish release"**

### Step 5 — Share with your team
Anyone can install it by:
1. Clicking the green **"Code"** button → **"Download ZIP"**
2. Unzipping and following the Local Installation steps above

---

## ⚠️ Notes

- Each user needs their own Anthropic API key
- The extension works on \`linkedin.com/in/*\` profile pages only
- PDF parsing works up to 10 pages
- API keys are stored locally in the browser — never shared

---

*CODEC SYSTEM ▮ CLASSIFIED*`
  }
};

const TABS = Object.keys(files);

export default function App() {
  const [activeFile, setActiveFile] = useState("README.md");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", background: "#000", color: "#00ff41", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #003a10", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18, letterSpacing: 4, fontWeight: "bold" }}>⬡ CODEC</span>
        <span style={{ color: "#005f1a", fontSize: 11 }}>LinkedIn Recon Extension — Source Files</span>
      </div>

      {/* File tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid #003a10", background: "#000d04" }}>
        {TABS.map(f => (
          <button key={f} onClick={() => setActiveFile(f)} style={{
            padding: "7px 14px", background: activeFile === f ? "#001a08" : "transparent",
            border: "none", borderRight: "1px solid #003a10",
            color: activeFile === f ? "#00ff41" : "#005f1a",
            cursor: "pointer", fontFamily: "inherit", fontSize: 11,
            borderBottom: activeFile === f ? "2px solid #00ff41" : "2px solid transparent",
            letterSpacing: 1
          }}>{f}</button>
        ))}
      </div>

      {/* Code area */}
      <div style={{ flex: 1, position: "relative" }}>
        <button onClick={copy} style={{
          position: "absolute", top: 10, right: 16, zIndex: 10,
          background: copied ? "#00ff41" : "#001a08", border: "1px solid #00ff41",
          color: copied ? "#000" : "#00ff41", padding: "5px 14px",
          fontFamily: "inherit", fontSize: 11, cursor: "pointer", letterSpacing: 1
        }}>{copied ? "✔ COPIED" : "COPY"}</button>
        <pre style={{
          margin: 0, padding: "16px 16px 16px 16px",
          overflowX: "auto", fontSize: 11, lineHeight: 1.7,
          color: "#b3ffcc", whiteSpace: "pre-wrap", wordBreak: "break-word"
        }}>{files[activeFile].content}</pre>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #003a10", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#003a10", fontSize: 9, letterSpacing: 3 }}>CODEC SYSTEM ▮ CLASSIFIED</span>
        <span style={{ color: "#005f1a", fontSize: 10 }}>{Object.keys(files).length} FILES READY</span>
      </div>
    </div>
  );
}
