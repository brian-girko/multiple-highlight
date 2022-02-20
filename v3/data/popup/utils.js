'use strict';

const utils = {};

utils.prefs = {
  'min-length': 2,
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'datalist-enabled': true,
  'separator': ' ',
  'history-enabled': true,
  'history-cache': {},
  'history-period': 10 * 24 * 60 * 60 * 1000,
  'history-mode': 'url', // url, hostname, global
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
    'a': [0, '#ffff00'],
    'b': [0, '#ffc501'],
    'c': [0, '#b5fa01'],
    'd': [0, '#fd13f0'],
    'e': [0, '#fff5cc'],
    'f': [0, '#ffa0a0'],
    'g': [0, '#dae0ff'],
    'h': [0, '#edd3ff'],
    'i': [0, '#b8dbec'],
    'j': [0, '#34222c'],
    '_': [0, '#abd1ff']
  },
  'highlighting-method': 'canvas', // native, canvas, mix
  'max-length-for-native': 100000,
  'consider-frames': true
};

utils.ckey = (mode, url) => {
  if (mode === 'global') {
    return '*';
  }
  else if (mode === 'hostname') {
    try {
      return (new URL(url)).hostname;
    }
    catch (e) {
      return '*';
    }
  }
  else {
    return url.split('#')[0];
  }
};

utils.inject = async (tab, prefs) => {
  // do we have the tbdm lib on this tab
  const r = await chrome.scripting.executeScript({
    target: {
      tabId: tab.id
    },
    func: () => ({
      ready: typeof CFind !== 'undefined',
      query: window.query,
      total: window.total,
      offset: window.offset,
      length: document.documentElement.innerText.length
    })
  });
  if (r[0].result.ready === false) {
    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      files: ['/data/inject/tbdm/core.js']
    });
    if (prefs['consider-frames']) {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/tree.js']
      });
    }

    const native = prefs['highlighting-method'] === 'native' ? true : (
      prefs['highlighting-method'] === 'canvas' ? false : (
        r[0].result.length > prefs['max-length-for-native'] ? false : true
      )
    );
    if (native) {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/core-navigate.js']
      });
    }
    else {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/canvas.js']
      });
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/canvas-navigate.js']
      });
    }

    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      files: ['/data/inject/control.js']
    });
  }

  return r;
};
