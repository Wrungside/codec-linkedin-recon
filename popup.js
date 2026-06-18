// CODEC — LinkedIn Recon Extension
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
    item.innerHTML = `<span class="jd-item-name">▶ ${jd.name}</span><button class="jd-item-del" data-id="${jd.id}">✕</button>`;
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
      content = doc.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 8000);
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
          text += content.items.map(s => s.str).join(' ') + '\n';
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

      const prompt = `You are a tactical recruitment intelligence system. Analyze the compatibility between this LinkedIn profile and job description.

JOB DESCRIPTION:
${activeJd.content.slice(0, 3000)}

LINKEDIN PROFILE:
${profileText.slice(0, 3000)}

Respond ONLY with a JSON object in this exact format (no markdown, no backticks):
{
  "score": <number 0-100>,
  "verdict": "<one of: TARGET ACQUIRED | HIGH VALUE ASSET | POTENTIAL RECRUIT | LOW PRIORITY | STAND DOWN>",
  "strengths": "<2-3 bullet points starting with •, key matching skills/experience>",
  "gaps": "<2-3 bullet points starting with •, missing requirements>",
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
      const raw = data.content[0].text.replace(/```json|```/g, '').trim();
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
loadJds();
