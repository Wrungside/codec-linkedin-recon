// CODEC — Content Script
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
        .join('\n');
    };

    const name = getText('h1');
    const headline = getText('.text-body-medium.break-words');
    const about = getText('#about ~ div .pv-shared-text-with-see-more span');

    const experience = getAllText('.pvs-list__paged-list-item .display-flex.flex-column.full-width');
    const education = getAllText('section[id*="education"] .pv-shared-text-with-see-more');
    const skills = getAllText('.pvs-list__container .display-flex.align-items-center.mr1 span[aria-hidden="true"]');

    const profile = `
NAME: ${name}
HEADLINE: ${headline}
ABOUT: ${about}

EXPERIENCE:
${experience}

EDUCATION:
${education}

SKILLS:
${skills}
    `.trim();

    window.__CODEC_PROFILE__ = profile.slice(0, 6000);
  } catch(e) {
    window.__CODEC_PROFILE__ = document.body.innerText.slice(0, 6000);
  }
})();
