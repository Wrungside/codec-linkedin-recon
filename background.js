// CODEC — Background Service Worker
// Handles extension lifecycle events

chrome.runtime.onInstalled.addListener(() => {
  console.log('CODEC — LinkedIn Recon Extension installed.');
});
