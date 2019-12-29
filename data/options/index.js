/* global app */
'use strict';

const toast = document.getElementById('toast');

app.storage.get({
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'history-enabled': true
}).then(prefs => {
  document.getElementById('persistent').checked = prefs.persistent;
  document.getElementById('clean-on-esc').checked = prefs['clean-on-esc'];
  document.getElementById('close-on-esc').checked = prefs['close-on-esc'];
  document.getElementById('history-enabled').checked = prefs['history-enabled'];
});

document.getElementById('save').addEventListener('click', () => app.storage.set({
  'persistent': document.getElementById('persistent').checked,
  'clean-on-esc': document.getElementById('clean-on-esc').checked,
  'close-on-esc': document.getElementById('close-on-esc').checked,
  'history-enabled': document.getElementById('history-enabled').checked
}).then(() => {
  toast.textContent = 'Options saved';
  window.setTimeout(() => toast.textContent = '', 750);
}));

// reset
document.getElementById('reset').addEventListener('click', e => {
  if (e.detail === 1) {
    toast.textContent = 'Double-click to reset!';
    window.setTimeout(() => toast.textContent = '', 750);
  }
  else {
    localStorage.clear();
    chrome.storage.local.clear(() => {
      chrome.runtime.reload();
      window.close();
    });
  }
});

// support
document.getElementById('support').addEventListener('click', () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url + '?rd=donate'
}));
