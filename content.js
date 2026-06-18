// CODEC v3.0 — Content Script
(function extractLinkedInProfile() {
  try {
    const getText = sel => { const el = document.querySelector(sel); return el ? el.innerText.trim() : ''; };
    const getAllText = sel => Array.from(document.querySelectorAll(sel)).map(el => el.innerText.trim()).filter(Boolean).join('\n');
    const name = getText('h1');
    const headline = getText('.text-body-medium.break-words');
    const about = getText('#about ~ div .pv-shared-text-with-see-more span');
    const experience = getAllText('.pvs-list__paged-list-item .display-flex.flex-column.full-width');
    const education = getAllText('section[id*="education"] .pv-shared-text-with-see-more');
    const skills = getAllText('.pvs-list__container .display-flex.align-items-center.mr1 span[aria-hidden="true"]');
    window.__CODEC_PROFILE__ = `NAME: ${name}
HEADLINE: ${headline}
ABOUT: ${about}
EXPERIENCE:
${experience}
EDUCATION:
${education}
SKILLS:
${skills}`.trim().slice(0, 6000);
  } catch(e) {
    window.__CODEC_PROFILE__ = document.body.innerText.slice(0, 6000);
  }
})();
CODEC SYSTEM ▮ CLASSIFIED
