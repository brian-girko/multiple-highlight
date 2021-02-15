/* global app */
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
    'custom-css': '',
    'no-active-rule': false
  },
  async once() {
    return (await app.tabs.inject.js({
      code: 'typeof Mark'
    })).filter(o => o).shift() === 'undefined';
  },
  async prepare() {
    const {colors} = utils.prefs;
    let code = `
      mark[data-markjs="true"] {
        color: var(--map-one);
        background: transparent;
      }
      mark[data-markjs="true"][data-underline="true"] {
        text-decoration: underline;
      }
      mark[data-markjs="true"][data-bold="true"] {
        font-weight: bold;
      }
      mark[data-markjs="true"][data-highlight="true"] {
        background: var(--map-two);
        box-shadow: 0 0 0 ${utils.prefs['shadow-size']}px var(--map-three);
      }
      .mark00, .mark01, .mark02, .mark03, .mark04, .mark05, .mark06, .mark07, .mark08, .mark09 {
        --map-one: ${colors.a[0]};
        --map-two: ${colors.a[1]};
        --map-three: ${colors.a[2]};
      }
      .mark10, .mark11, .mark12, .mark13, .mark14, .mark15, .mark16, .mark17, .mark18, .mark19 {
        --map-one: ${colors.b[0]};
        --map-two: ${colors.b[1]};
        --map-three: ${colors.b[2]};
      }
      .mark20, .mark21, .mark22, .mark23, .mark24, .mark25, .mark26, .mark27, .mark28, .mark29 {
        --map-one: ${colors.c[0]};
        --map-two: ${colors.c[1]};
        --map-three: ${colors.c[2]};
      }
      .mark30, .mark31, .mark32, .mark33, .mark34, .mark35, .mark36, .mark37, .mark38, .mark39 {
        --map-one: ${colors.d[0]};
        --map-two: ${colors.d[1]};
        --map-three: ${colors.d[2]};
      }
      .mark40, .mark41, .mark42, .mark43, .mark44, .mark45, .mark46, .mark47, .mark48, .mark49 {
        --map-one: ${colors.e[0]};
        --map-two: ${colors.e[1]};
        --map-three: ${colors.e[2]};
      }
      .mark50, .mark51, .mark52, .mark53, .mark54, .mark55, .mark56, .mark57, .mark58, .mark59 {
        --map-one: ${colors.f[0]};
        --map-two: ${colors.f[1]};
        --map-three: ${colors.f[2]};
      }
      .mark60, .mark61, .mark62, .mark63, .mark64, .mark65, .mark66, .mark67, .mark68, .mark69 {
        --map-one: ${colors.g[0]};
        --map-two: ${colors.g[1]};
        --map-three: ${colors.g[2]};
      }
      .mark70, .mark71, .mark72, .mark73, .mark74, .mark75, .mark76, .mark77, .mark78, .mark79 {
        --map-one: ${colors.h[0]};
        --map-two: ${colors.h[1]};
        --map-three: ${colors.h[2]};
      }
      .mark80, .mark81, .mark82, .mark83, .mark84, .mark85, .mark86, .mark87, .mark88, .mark89 {
        --map-one: ${colors.i[0]};
        --map-two: ${colors.i[1]};
        --map-three: ${colors.i[2]};
      }
      .mark90, .mark91, .mark92, .mark93, .mark94, .mark95, .mark96, .mark97, .mark98, .mark99 {
        --map-one: ${colors.j[0]};
        --map-two: ${colors.j[1]};
        --map-three: ${colors.j[2]};
      }`;
    if (utils.prefs['no-active-rule'] === false) {
      code += `mark[data-markjs="true"][data-active="true"] {
        --map-one: ${colors._[0]};
        --map-two: ${colors._[1]};
        --map-three: ${colors._[2]};
        background: var(--map-two);
        box-shadow: 0 0 0 ${utils.prefs['shadow-size']} var(--map-three);
      }`;
    }
    code += utils.prefs['custom-css'];
    await Promise.all([
      app.tabs.inject.js({
        file: '/data/inject/mark.es6.js'
      }),
      app.tabs.inject.css({
        code
      })
    ]);
  }
};
utils.inject = async colors => {
  if (await utils.once()) {
    return await utils.prepare(colors);
  }
  return Promise.resolve();
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
