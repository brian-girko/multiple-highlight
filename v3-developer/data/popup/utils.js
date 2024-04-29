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
    'a': ['#000', '#ffff00'],
    'b': ['#000', '#ffc501'],
    'c': ['#000', '#b5fa01'],
    'd': ['#49186d', '#fd13f0'],
    'e': ['#000', '#fff5cc'],
    'f': ['#5d0100', '#ffa0a0'],
    'g': ['#000', '#dae0ff'],
    'h': ['#49186d', '#edd3ff'],
    'i': ['#5d0100', '#b8dbec'],
    'j': ['#ffeef7', '#34222c'],
    '_': ['#303b49', '#abd1ff']
  },
  'consider-frames': true,
  'add-ruler': false
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
    await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      files: ['/data/inject/tbdm/navigate.js']
    });
    if (prefs['consider-frames']) {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/tree.js']
      });
    }
    if (prefs['add-ruler']) {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        files: ['/data/inject/tbdm/ruler.js']
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
