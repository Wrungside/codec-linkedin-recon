# 🔌 CODEC v3.0 — LinkedIn Recon Extension

## What's New in v3.0
- **[ GROUPS ]** tab — create named groups of JDs (e.g. "Senior Track", "Junior Track")
- **GROUP SCAN** mode — scan a profile against all JDs in a group simultaneously
- Results ordered by score (highest first), TOP MATCH highlighted
- All group scan results saved to **[ INTEL ]** with group label
- Runs all JD comparisons in parallel (fast!)

## File Structure
```
codec-extension/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── background.js
├── lib/
│   └── pdf.min.js
└── README.md
```

## How to Use Group Scan
1. Go to **[ JDs ]** → add your job descriptions
2. Go to **[ GROUPS ]** → create a group (e.g. "Engineering Track")
3. Click **EDIT** on the group → select which JDs belong to it
4. Navigate to a LinkedIn profile
5. Go to **[ SCAN ]** → click **GROUP SCAN** → select your group → **⬡ INITIATE GROUP SCAN**
6. See all JDs ranked by compatibility score

## Installation
1. Go to `chrome://extensions` → Enable **Developer Mode** → **Load unpacked**
2. Select the `codec-extension` folder
3. Go to **[ CONFIG ]** → add your Anthropic API key

*CODEC SYSTEM ▮ CLASSIFIED*
