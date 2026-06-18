# 🔌 CODEC — LinkedIn Recon Extension

> Tactical LinkedIn profile matcher for recruiters. Powered by Claude AI.

---

## 📁 File Structure

```
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
```

---

## 🚀 Local Installation (Chrome / Brave)

1. **Download or clone** this repository
2. **Add pdf.js library:**
   - Download `pdf.min.js` from https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
   - Place it in the `lib/` folder
3. **Add icons** (any 48x48 and 128x128 PNG files) to the `icons/` folder
4. Open Chrome or Brave and go to `chrome://extensions`
5. Enable **Developer Mode** (toggle top-right)
6. Click **"Load unpacked"**
7. Select the `codec-extension` folder
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
2. Repository name: `codec-linkedin-recon`
3. Set to **Public** (so others can install it)
4. Click **"Create repository"**

### Step 3 — Upload your files
**Option A — Via GitHub website (easiest):**
1. In your new repo, click **"uploading an existing file"**
2. Drag & drop ALL extension files (keep folder structure)
3. Click **"Commit changes"**

**Option B — Via Git (command line):**
```bash
git clone https://github.com/YOUR_USERNAME/codec-linkedin-recon.git
# Copy all extension files into the folder
cd codec-linkedin-recon
git add .
git commit -m "Initial release: CODEC v1.0"
git push origin main
```

### Step 4 — Create a Release (optional but recommended)
1. In your repo, click **"Releases"** → **"Create a new release"**
2. Tag version: `v1.0.0`
3. Title: `CODEC v1.0 — LinkedIn Recon Extension`
4. Click **"Publish release"**

### Step 5 — Share with your team
Anyone can install it by:
1. Clicking the green **"Code"** button → **"Download ZIP"**
2. Unzipping and following the Local Installation steps above

---

## ⚠️ Notes

- Each user needs their own Anthropic API key
- The extension works on `linkedin.com/in/*` profile pages only
- PDF parsing works up to 10 pages
- API keys are stored locally in the browser — never shared

---

*CODEC SYSTEM ▮ CLASSIFIED*
