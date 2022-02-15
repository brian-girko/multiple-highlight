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
    'a': [0, '#ccf62c'],
    'b': [0, '#ff9629'],
    'c': [0, '#f349d3'],
    'd': [0, '#f349d3'],
    'e': [0, '#f349d3'],
    'f': [0, '#f16472'],
    'g': [0, '#e29253'],
    'h': [0, '#f16472'],
    'i': [0, '#c48fee'],
    'j': [0, '#7ce485'],
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
