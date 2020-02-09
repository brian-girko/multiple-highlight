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
  'history-period': 10 * 24 * 60 * 60 * 1000
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
        file: '/data/inject/inject.css'
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
