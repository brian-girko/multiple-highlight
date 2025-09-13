'use strict';

const utils = {
  prefs: {
    'min-length': 2,
    'scroll-into-view': {
      'behavior': 'auto',
      'block': 'center'
    },
    'persistent': false,
    'clean-on-esc': true,
    'close-on-esc': true,
    'datalist-enabled': true,
    'separator': ' ',
    'history-enabled': true,
    'history-cache': {},
    'history-period': 10 * 24 * 60 * 60 * 1000,
    'history-mode': 'url', // url, hostname, global
    'shadow-size': 0,
    'shadow-size-active': 0,
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
    'custom-css': '',
    'no-active-rule': false
  },
  async once(tabId) {
    const r = await chrome.scripting.executeScript({
      target: {
        tabId
      },
      func: () => typeof Mark
    });
    if (r[0] === undefined) { // Firefox
      throw Error('Cannot Access This Tab');
    }
    return r[0].result === 'undefined';
  },
  async prepare(tabId) {
    const {colors} = utils.prefs;
    let code = `
      ::highlight(type-a) {
        color: ${colors.a[0]};
        background: ${colors.a[1]};
      }
      ::highlight(type-b) {
        color: ${colors.b[0]};
        background: ${colors.b[1]};
      }
      ::highlight(type-c) {
        color: ${colors.c[0]};
        background: ${colors.c[1]};
      }
      ::highlight(type-d) {
        color: ${colors.d[0]};
        background: ${colors.d[1]};
      }
      ::highlight(type-e) {
        color: ${colors.e[0]};
        background: ${colors.e[1]};
      }
      ::highlight(type-f) {
        color: ${colors.f[0]};
        background: ${colors.f[1]};
      }
      ::highlight(type-g) {
        color: ${colors.g[0]};
        background: ${colors.g[1]};
      }
      ::highlight(type-h) {
        color: ${colors.h[0]};
        background: ${colors.h[1]};
      }
      ::highlight(type-i) {
        color: ${colors.i[0]};
        background: ${colors.i[1]};
      }
      ::highlight(type-j) {
        color: ${colors.j[0]};
        background: ${colors.j[1]};
      }
      ::highlight(type-_) {
        color: ${colors._[0]};
        background: ${colors._[1]};
      }`;
    code += utils.prefs['custom-css'];

    await chrome.scripting.executeScript({
      target: {
        tabId
      },
      injectImmediately: true,
      files: ['/data/inject/highlight.js']
    });
    await chrome.scripting.insertCSS({
      target: {
        tabId,
        allFrames: true
      },
      css: code
    });
  }
};
utils.inject = async tabId => {
  if (await utils.once(tabId)) {
    return await utils.prepare(tabId);
  }
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
