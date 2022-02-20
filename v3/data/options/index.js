/* global utils */
'use strict';

const toast = document.getElementById('toast');

const prefs = utils.prefs;

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
