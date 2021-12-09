/* global app */
'use strict';

const toast = document.getElementById('toast');

const prefs = {
  'engine': 'mark.es6.js',
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'datalist-enabled': true,
  'history-enabled': true,
  'history-mode': 'url',
  'no-active-rule': false,
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
  },
  'custom-css': ''
};

app.storage.get(prefs).then(prefs => {
  document.getElementById('engine').value = prefs.engine;
  document.getElementById('persistent').checked = prefs.persistent;
  document.getElementById('clean-on-esc').checked = prefs['clean-on-esc'];
  document.getElementById('close-on-esc').checked = prefs['close-on-esc'];
  document.getElementById('datalist-enabled').checked = prefs['datalist-enabled'];
  document.getElementById('history-enabled').checked = prefs['history-enabled'];
  document.getElementById('history-mode').value = prefs['history-mode'];
  document.getElementById('no-active-rule').checked = prefs['no-active-rule'];
  for (const [key, [c, b, s]] of Object.entries(prefs.colors)) {
    document.querySelector(`#${key} td:nth-child(2) input`).value = c;
    document.querySelector(`#${key} td:nth-child(3) input`).value = b;
    document.querySelector(`#${key} td:nth-child(4) input`).value = s;
  }
  document.getElementById('custom-css').value = prefs['custom-css'];
});

document.getElementById('save').addEventListener('click', () => app.storage.set({
  'engine': document.getElementById('engine').value,
  'persistent': document.getElementById('persistent').checked,
  'clean-on-esc': document.getElementById('clean-on-esc').checked,
  'close-on-esc': document.getElementById('close-on-esc').checked,
  'datalist-enabled': document.getElementById('datalist-enabled').checked,
  'history-enabled': document.getElementById('history-enabled').checked,
  'history-mode': document.getElementById('history-mode').value,
  'no-active-rule': document.getElementById('no-active-rule').checked,
  'colors': Object.keys(prefs.colors).reduce((p, key) => {
    p[key] = [
      document.querySelector(`#${key} td:nth-child(2) input`).value,
      document.querySelector(`#${key} td:nth-child(3) input`).value,
      document.querySelector(`#${key} td:nth-child(4) input`).value
    ];
    return p;
  }, {}),
  'custom-css': document.getElementById('custom-css').value
}).then(() => {
  if (document.getElementById('datalist-enabled').checked === false) {
    chrome.storage.local.get(null, prefs => {
      const keys = Object.keys(prefs).filter(s => s.endsWith('-datalist'));
      chrome.storage.local.remove(keys);
    });
  }
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
