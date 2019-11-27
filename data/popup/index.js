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
  'separator': ' '
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
    await app.tabs.inject.js({
      file: '/data/inject/control.js'
    });
    const tab = await app.tabs.current();
    const port = app.runtime.connect(tab.id, {
      name: 'highlight'
    });
    port.on('message', request => {
      if (request.method === 'stat') {
        stat.total = 'total' in request ? request.total : stat.total;
        stat.textContent = (request.offset || 0) + '/' + stat.total;
        backward.disabled = forward.disabled = [0, 1].indexOf(request.total) !== -1;
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
  if (e.target.value) {
    search.esc = false;
  }
});
document.getElementById('close').addEventListener('click', () => window.close());

// storage
separator.addEventListener('change', e => app.storage.set({
  separator: e.target.value
}));
