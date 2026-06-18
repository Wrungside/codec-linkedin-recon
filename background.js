// CODEC v3.0 — Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('CODEC v3.0 installed.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_URL') {
    fetch(msg.url)
      .then(r => r.text())
      .then(html => {
        const text = html
          .replace(/<style[^>]*>.*?<\/style>/gsi, '')
          .replace(/<script[^>]*>.*?<\/script>/gsi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
        sendResponse({ ok: true, text });
      })
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
