/* global app */
'use strict';

const toast = document.getElementById('toast');

const prefs = {
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'history-enabled': true,
  'colors': {
    'a': ['#666666', '#ffff00', '#ffff00'],
    'b': ['#666666', '#ffc501', '#ffc501'],
    'c': ['#666666', '#b5fa01', '#b5fa01'],
    'd': ['#49186d', '#fd13f0', '#fd13f0'],
    'e': ['#666666', '#fff5cc', '#fff5cc'],
    'f': ['#5d0100', '#ffa0a0', '#ffa0a0'],
    'g': ['#666666', '#dae0ff', '#dae0ff'],
    'h': ['#49186d', '#edd3ff', '#edd3ff'],
    'i': ['#5d0100', '#b8dbec', '#b8dbec'],
    'j': ['#ffeef7', '#34222c', '#34222c'],
    '_': ['#303b49', '#abd1ff', '#96bbe8']
  }
};

app.storage.get(prefs).then(prefs => {
  document.getElementById('persistent').checked = prefs.persistent;
  document.getElementById('clean-on-esc').checked = prefs['clean-on-esc'];
  document.getElementById('close-on-esc').checked = prefs['close-on-esc'];
  document.getElementById('history-enabled').checked = prefs['history-enabled'];
  for (const [key, [c, b, s]] of Object.entries(prefs.colors)) {
    document.querySelector(`#${key} td:nth-child(2) input`).value = c;
    document.querySelector(`#${key} td:nth-child(3) input`).value = b;
    document.querySelector(`#${key} td:nth-child(4) input`).value = s;
  }
});

document.getElementById('save').addEventListener('click', () => app.storage.set({
  'persistent': document.getElementById('persistent').checked,
  'clean-on-esc': document.getElementById('clean-on-esc').checked,
  'close-on-esc': document.getElementById('close-on-esc').checked,
  'history-enabled': document.getElementById('history-enabled').checked,
  'colors': Object.keys(prefs.colors).reduce((p, key) => {
    p[key] = [
      document.querySelector(`#${key} td:nth-child(2) input`).value,
      document.querySelector(`#${key} td:nth-child(3) input`).value,
      document.querySelector(`#${key} td:nth-child(4) input`).value
    ];
    return p;
  }, {})
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
