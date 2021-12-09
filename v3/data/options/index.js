'use strict';

const toast = document.getElementById('toast');

const prefs = {
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'datalist-enabled': true,
  'history-enabled': true,
  'history-mode': 'url',
  'colors': {
    'a': ['#666666', '#ffff00'],
    'b': ['#666666', '#ffc501'],
    'c': ['#666666', '#b5fa01'],
    'd': ['#49186d', '#fd13f0'],
    'e': ['#666666', '#fff5cc'],
    'f': ['#5d0100', '#ffa0a0'],
    'g': ['#666666', '#dae0ff'],
    'h': ['#49186d', '#edd3ff'],
    'i': ['#5d0100', '#b8dbec'],
    'j': ['#ffeef7', '#34222c'],
    '_': ['#303b49', '#abd1ff']
  },
  'canvas-colors': {
    'a': [0, '#cb4f00'],
    'b': [0, '#f60000'],
    'c': [0, '#3ce500'],
    'd': [0, '#ff0095'],
    'e': [0, '#764225'],
    'f': [0, '#705c23'],
    'g': [0, '#495e54'],
    'h': [0, '#6f8792'],
    'i': [0, '#571f00'],
    'j': [0, '#af9aa1'],
    '_': [0, '#abd1ff']
  },
  'highlighting-method': 'canvas' // native, canvas, mix
};

chrome.storage.local.get(prefs, ps => {
  Object.assign(prefs, ps);

  document.getElementById('highlighting-method').value = prefs['highlighting-method'];
  document.getElementById('persistent').checked = prefs.persistent;
  document.getElementById('clean-on-esc').checked = prefs['clean-on-esc'];
  document.getElementById('close-on-esc').checked = prefs['close-on-esc'];
  document.getElementById('datalist-enabled').checked = prefs['datalist-enabled'];
  document.getElementById('history-enabled').checked = prefs['history-enabled'];
  document.getElementById('history-mode').value = prefs['history-mode'];
  for (const [key, [c, b]] of Object.entries(prefs.colors)) {
    const cn = prefs['canvas-colors'][key][1];

    const parent = document.querySelector(`[data-id="${key}"]`);
    parent.children[1].value = c;
    parent.children[2].value = b;
    parent.children[3].value = cn;
  }
});

document.getElementById('save').addEventListener('click', () => chrome.storage.local.set({
  'persistent': document.getElementById('persistent').checked,
  'clean-on-esc': document.getElementById('clean-on-esc').checked,
  'close-on-esc': document.getElementById('close-on-esc').checked,
  'datalist-enabled': document.getElementById('datalist-enabled').checked,
  'history-enabled': document.getElementById('history-enabled').checked,
  'history-mode': document.getElementById('history-mode').value,
  'colors': [...document.querySelectorAll('[data-id]')].reduce((p, e) => {
    p[e.dataset.id] = [e.children[1].value, e.children[2].value];
    return p;
  }, {}),
  'canvas-colors': [...document.querySelectorAll('[data-id]')].reduce((p, e) => {
    p[e.dataset.id] = [0, e.children[3].value];
    return p;
  }, {}),
  'highlighting-method': document.getElementById('highlighting-method').value
}, () => {
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

// links
for (const a of [...document.querySelectorAll('[data-href]')]) {
  if (a.hasAttribute('href') === false) {
    a.href = chrome.runtime.getManifest().homepage_url + '#' + a.dataset.href;
  }
}
