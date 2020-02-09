/* globals app */
const search = document.getElementById('search');
const separator = document.getElementById('separator');
const stat = document.getElementById('stat');
const forward = document.getElementById('forward');
const backward = document.getElementById('backward');

const prefs = {
  'min-length': 2,
  'scroll-into-view': {
    behavior: 'auto',
    block: 'center'
  },
  'separator': ' ',
  'persistent': false,
  'clean-on-esc': true,
  'close-on-esc': true,
  'history-enabled': true,
  'history-cache': {},
  'history-period': 10 * 24 * 60 * 60 * 1000,
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

app.storage.get(prefs).then(async ps => {
  Object.assign(prefs, ps);

  separator.value = prefs.separator;
  try {
    await Promise.all([
      app.tabs.inject.js({
        file: '/data/inject/mark.es6.js'
      }),
      app.tabs.inject.css({
        code: `
          .mark00, .mark01, .mark02, .mark03, .mark04, .mark05, .mark06, .mark07, .mark08, .mark09 {
            color: ${prefs.colors.a[0]};
            background: ${prefs.colors.a[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.a[2]};
          }
          .mark10, .mark11, .mark12, .mark13, .mark14, .mark15, .mark16, .mark17, .mark18, .mark19 {
            color: ${prefs.colors.b[0]};
            background: ${prefs.colors.b[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.b[2]};
          }
          .mark20, .mark21, .mark22, .mark23, .mark24, .mark25, .mark26, .mark27, .mark28, .mark29 {
            color: ${prefs.colors.c[0]};
            background: ${prefs.colors.c[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.c[2]};
          }
          .mark30, .mark31, .mark32, .mark33, .mark34, .mark35, .mark36, .mark37, .mark38, .mark39 {
            color: ${prefs.colors.d[0]};
            background: ${prefs.colors.d[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.d[2]};
          }
          .mark40, .mark41, .mark42, .mark43, .mark44, .mark45, .mark46, .mark47, .mark48, .mark49 {
            color: ${prefs.colors.e[0]};
            background: ${prefs.colors.e[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.e[2]};
          }
          .mark50, .mark51, .mark52, .mark53, .mark54, .mark55, .mark56, .mark57, .mark58, .mark59 {
            color: ${prefs.colors.f[0]};
            background: ${prefs.colors.f[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.f[2]};
          }
          .mark60, .mark61, .mark62, .mark63, .mark64, .mark65, .mark66, .mark67, .mark68, .mark69 {
            color: ${prefs.colors.g[0]};
            background: ${prefs.colors.g[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.g[2]};
          }
          .mark70, .mark71, .mark72, .mark73, .mark74, .mark75, .mark76, .mark77, .mark78, .mark79 {
            color: ${prefs.colors.h[0]};
            background: ${prefs.colors.h[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.h[2]};
          }
          .mark80, .mark81, .mark82, .mark83, .mark84, .mark85, .mark86, .mark87, .mark88, .mark89 {
            color: ${prefs.colors.i[0]};
            background: ${prefs.colors.i[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.i[2]};
          }
          .mark90, .mark91, .mark92, .mark93, .mark94, .mark95, .mark96, .mark97, .mark98, .mark99 {
            color: ${prefs.colors.j[0]};
            background: ${prefs.colors.j[1]};
            box-shadow: 0 0 0 2px ${prefs.colors.j[2]};
          }

          mark[data-markjs="true"][data-active="true"] {
            color: ${prefs.colors._[0]};
            background-color: ${prefs.colors._[1]};
            box-shadow: 0 0 0 2px ${prefs.colors._[2]};
          }
        `
      })
    ]);

    const updateStat = request => {
      stat.total = 'total' in request ? request.total : stat.total;
      stat.textContent = (request.offset || 0) + '/' + (stat.total || 0);
      backward.disabled = forward.disabled = [0, 1].indexOf(request.total) !== -1;
    };

    const o = (await app.tabs.inject.js({
      file: '/data/inject/control.js'
    })).filter(o => o).shift();

    const tab = await app.tabs.current();
    const ckey = tab.url.split('#')[0];
    const port = app.runtime.connect(tab.id, {
      name: 'highlight'
    });
    port.on('message', request => {
      if (request.method === 'stat') {
        updateStat(request);
      }
      else if (request.method === 'clean') {
        search.dataset.clean = request.clean === '';
        search.title = request.clean;
      }
    });
    const input = e => {
      window.clearTimeout(input.id);
      input.id = window.setTimeout(query => {
        port.post({
          method: 'search',
          query,
          separator: separator.value,
          prefs
        });
        forward.disabled = true;
        backward.disabled = true;
        // save to history
        if (prefs['history-enabled']) {
          const now = Date.now();
          prefs['history-cache'][ckey] = {
            query,
            now
          };
          for (const [key, o] of Object.entries(prefs['history-cache'])) {
            if (now - o.now > prefs['history-period']) {
              delete prefs['history-cache'][key];
            }
          }
          chrome.storage.local.set({
            'history-cache': prefs['history-cache']
          });
        }
      }, 300, e.target.value);
    };
    search.addEventListener('input', input);
    // navigate
    search.addEventListener('keyup', e => {
      if (e.code === 'Enter' && e.shiftKey) {
        backward.click();
      }
      else if (e.code === 'Enter') {
        forward.click();
      }
    });
    separator.addEventListener('change', () => port.post({
      method: 'reset',
      query: search.value,
      separator: separator.value,
      prefs
    }));
    backward.addEventListener('click', () => port.post({
      method: 'navigate',
      type: 'backward',
      prefs
    }));
    forward.addEventListener('click', () => port.post({
      method: 'navigate',
      type: 'forward',
      prefs
    }));
    document.getElementById('close').addEventListener('click', e => {
      if (e.shiftKey) {
        port.post({
          method: 'persistent'
        });
      }
      window.close();
    });
    // fill the search box
    if (o && o.query) {
      search.value = o.query || '';
      updateStat(o);
    }
    else {
      const v = prefs['history-cache'][ckey];
      if (v && prefs['history-enabled']) {
        search.value = v.query;
        search.dispatchEvent(new Event('input'));
      }
    }
  }
  catch (e) {
    search.value = e.message;
    search.disabled = true;
  }
});

// close on ESC
search.addEventListener('search', e => {
  if (search.esc && e.target.value === '') {
    window.close();
  }
  search.esc = e.target.value ? false : true;
});
search.addEventListener('input', e => {
  search.esc = e.target.value === '';
});

// storage
separator.addEventListener('change', e => app.storage.set({
  separator: e.target.value
}));

// auto focus
document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(() => search.focus(), 0);
});

// prevent ESC from cleaning the search box
search.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    e.preventDefault();
    if (prefs['clean-on-esc'] === false) {
      if (prefs['close-on-esc']) {
        window.close();
      }
    }
    else {
      search.value = '';
      search.dispatchEvent(new Event('search'));
      search.dispatchEvent(new Event('input'));
    }
  }
});
