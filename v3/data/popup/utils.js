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
