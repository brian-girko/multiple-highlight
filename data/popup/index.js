/* globals app, utils */
const search = document.getElementById('search');
const separator = document.getElementById('separator');
const stat = document.getElementById('stat');
const forward = document.getElementById('forward');
const backward = document.getElementById('backward');

let tab;

const prefs = utils.prefs;

const datalist = () => {
  if (search.value && tab && tab.url && (tab.url.startsWith('http') || tab.url.startsWith('file'))) {
    datalist.cache.unshift(search.value);
    datalist.cache = datalist.cache.filter((s, i, l) => l.indexOf(s) === i);
    datalist.cache = datalist.cache.slice(0, 8);

    datalist.update();

    chrome.storage.local.set({
      [datalist.hostname + '-' + 'datalist']: datalist.cache
    });
  }
};
datalist.cache = [];
datalist.available = false;
datalist.update = () => {
  for (let i = 0; i < 8; i += 1) {
    const e = document.querySelector(`#datalist option:nth-child(${i + 1})`);
    if (datalist.cache[i]) {
      e.value = datalist.cache[i];
      e.disabled = false;
    }
    else {
      e.disabled = true;
    }
  }
};
datalist.activate = () => {
  datalist.available = prefs['datalist-enabled'] && tab && tab.url &&
    (tab.url.startsWith('http') || tab.url.startsWith('file'));

  if (datalist.available) {
    const {hostname} = new URL(tab.url);
    datalist.hostname = hostname;

    const key = datalist.hostname + '-datalist';
    chrome.storage.local.get({
      [key]: []
    }, prefs => {
      datalist.cache = prefs[key];
      datalist.update();
    });
  }
};

app.storage.get(prefs).then(async ps => {
  Object.assign(prefs, ps);

  separator.value = prefs.separator;

  try {
    // only inject once
    await utils.inject(prefs.colors);

    const updateStat = request => {
      stat.total = 'total' in request ? request.total : stat.total;
      if (stat.total) {
        stat.textContent = ((request.offset || 0) + 1) + '/' + stat.total;
      }
      else {
        stat.textContent = '0/0';
      }
      backward.disabled = forward.disabled = [0, 1].indexOf(request.total) !== -1;
    };

    const o = (await app.tabs.inject.js({
      file: '/data/inject/control.js'
    })).filter(o => o).shift();

    tab = await app.tabs.current();
    datalist.activate();

    const ckey = utils.ckey(prefs['history-mode'], tab.url);

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
          prefs,
          origin: 'popup'
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
    backward.addEventListener('click', () => {
      datalist();
      port.post({
        method: 'navigate',
        type: 'backward',
        prefs
      });
    });
    forward.addEventListener('click', () => {
      datalist();
      port.post({
        method: 'navigate',
        type: 'forward',
        prefs
      });
    });
    document.getElementById('close').addEventListener('click', e => {
      if (e.shiftKey) {
        port.post({
          method: 'persistent'
        });
      }
      window.close();
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
          if (e.shiftKey) {
            port.post({
              method: 'persistent'
            });
            window.close();
          }
          search.value = '';
          search.dispatchEvent(new Event('search'));
          search.dispatchEvent(new Event('input'));
        }
      }
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
    search.value = 'Disabled on This Page; ' + e.message;
    search.disabled = true;
  }
});

// close on ESC
search.addEventListener('search', e => {
  if (search.esc && e.target.value === '') {
    if (e.isTrusted === false) {
      window.close();
    }
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

