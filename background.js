// CODEC v3.0 — Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('CODEC v3.0 installed.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_URL') {
    // Open URL in a hidden tab, extract text, then close it
    chrome.tabs.create({ url: msg.url, active: false }, (tab) => {
      const tabId = tab.id;

      // Wait for the tab to finish loading
      const onUpdated = (updatedTabId, changeInfo) => {
        if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(onUpdated);

        // Extract visible text from the page
        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            // Remove script/style nodes
            document.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
            return (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 8000);
          }
        }, (results) => {
          chrome.tabs.remove(tabId); // Close the tab
          const text = results?.[0]?.result || '';
          if (text.length > 20) {
            sendResponse({ ok: true, text });
          } else {
            sendResponse({ ok: false, error: 'Page returned no readable content. Try pasting the text directly.' });
          }
        });
      };

      chrome.tabs.onUpdated.addListener(onUpdated);

      // Timeout after 15 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.remove(tabId).catch(() => {});
        sendResponse({ ok: false, error: 'Page took too long to load. Try pasting the text directly.' });
      }, 15000);
    });

    return true; // Keep message channel open for async response
  }
});
