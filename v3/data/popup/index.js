/* globals utils */
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
    datalist.cache = datalist.cache.slice(0, 20);

    datalist.update();

    const ckey = utils.ckey(prefs['history-mode'], tab.url);

    chrome.storage.local.set({
      [ckey + '-' + 'datalist']: datalist.cache
    });
  }
};
datalist.cache = [];
datalist.available = false;
datalist.update = () => {
  const parent = document.getElementById('history');
  parent.textContent = '';

  for (let i = 0; i < datalist.cache.length; i += 1) {
    const option = document.createElement('option');
    option.value = option.textContent = datalist.cache[i];

    if (search.value === option.value) {
      option.checked = true;
    }
    parent.appendChild(option);
  }
  parent.value = '';
};
datalist.activate = () => {
  datalist.available = prefs['datalist-enabled'] && tab && tab.url &&
    (tab.url.startsWith('http') || tab.url.startsWith('file'));

  if (datalist.available) {
    const ckey = utils.ckey(prefs['history-mode'], tab.url);

    chrome.storage.local.get({
      [ckey + '-' + 'datalist']: []
    }, prefs => {
      datalist.cache = prefs[ckey + '-' + 'datalist'];
      datalist.update();
    });
  }
};

const updateStat = request => {
  stat.total = 'total' in request ? request.total : stat.total;
  if (stat.total) {
    stat.textContent = ((request.offset || 0) + 1) + ' of ' + stat.total;
  }
  else {
    stat.textContent = '0/0';
  }
  backward.disabled = forward.disabled = [0, 1].indexOf(request.total) !== -1;
};

chrome.storage.local.get(prefs, async ps => {
  Object.assign(utils.prefs, ps);

  separator.value = prefs.separator;

  try {
    [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    const r = await utils.inject(tab, prefs);

    datalist.activate();

    const ckey = utils.ckey(prefs['history-mode'], tab.url);

    const port = chrome.tabs.connect(tab.id, {
      name: 'highlight'
    });

    port.onMessage.addListener(request => {
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
        port.postMessage({
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
      if (e.key === 'Enter' && e.shiftKey) {
        backward.click();
      }
      else if (e.key === 'Enter') {
        forward.click();
      }
    });
    separator.addEventListener('change', () => port.postMessage({
      method: 'search',
      query: search.value,
      separator: separator.value,
      prefs
    }));
    backward.addEventListener('click', () => {
      datalist();
      port.postMessage({
        method: 'navigate',
        type: 'backward',
        prefs
      });
    });
    forward.addEventListener('click', () => {
      datalist();
      port.postMessage({
        method: 'navigate',
        type: 'forward',
        prefs
      });
    });
    document.getElementById('close').addEventListener('click', e => {
      if (e.shiftKey) {
        port.postMessage({
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
            port.postMessage({
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
    if (r[0].result.query) {
      search.value = r[0].result.query || '';
    }
    else {
      const v = prefs['history-cache'][ckey];
      if (v && prefs['history-enabled']) {
        search.value = v.query;
      }
    }
    search.dispatchEvent(new Event('input'));
  }
  catch (e) {
    search.value = 'Disabled on This Page; ' + e.message;
    search.disabled = true;
    console.warn(e);
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
separator.addEventListener('change', e => chrome.storage.local.set({
  separator: e.target.value
}));

// auto focus
document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(() => search.focus(), 0);
});

// history
document.getElementById('history').addEventListener('change', e => {
  search.value = e.target.value;
  search.dispatchEvent(new Event('search'));
  search.dispatchEvent(new Event('input'));
});
