/* global SWord, RWord, Find */

const connect = port => {
  let persistent = false;

  const update = () => setTimeout(() => {
    try {
      port.postMessage({
        method: 'stat',
        total: window.instance.stats.total,
        offset: window.instance.stats.cursor
      });
      window.offset = window.instance.stats.cursor;
    }
    catch (e) {}
  }, 100);

  const disconnect = () => {
    chrome.storage.local.get({
      'persistent': false
    }, prefs => {
      if (persistent === false && prefs.persistent === false) {
        delete window.query;
        // delete window.offset;
        delete window.total;

        window.instance.destroy();
      }
      port.disconnect();
    });
  };
  port.onDisconnect.addListener(disconnect);

  port.onMessage.addListener(async request => {
    if (request.method === 'search') {
      try {
        window.instance.destroy();
      }
      catch (e) {}

      const {query, separator, prefs} = request;
      // persist for next use
      window.query = query;
      let keywords;
      if (separator === 'false') {
        keywords = [query];
      }
      else {
        keywords = query.split(separator);
      }
      keywords = keywords.map(s => s.trim()).filter((s, i, l) => s && l.indexOf(s) === i).filter(s => {
        if (s.indexOf(':') === -1) {
          return s.length >= prefs['min-length'];
        }
        else {
          return s.split(':')[1].length >= prefs['min-length'];
        }
      });

      const isCanvas = Boolean(Find.prototype.canvas);
      const cname = isCanvas ? 'canvas-colors' : 'colors';

      const words = keywords.map((s, n) => {
        const command = s.indexOf(':') === -1 ? '' : s.split(':')[0].toLowerCase();
        const pk = command ? s.substr(command.length + 1) : s;
        const underline = command && command.indexOf('u') !== -1;
        const bold = command && command.indexOf('b') !== -1;
        const highlight = (underline || bold) ? command.indexOf('h') !== -1 : true;

        const color = request.prefs[cname][String.fromCharCode(97 + n % 10)];
        const style = {
          'color': color[0],
          'background-color': color[1]
        };
        if (underline) {
          style['text-decoration'] = 'underline';
        }
        if (bold) {
          style['font-weight'] = 'bold';
        }
        if (highlight === false && !Find.prototype.canvas) {
          style['background-color'] = 'transparent';
        }

        if (command && command.indexOf('r') !== -1) {
          try {
            if (pk.length >= 2) {
              const re = new RegExp(pk, 'i');
              return new RWord(re, style);
            }
          }
          catch (e) {
            console.warn('regexp evaluation error', e);
          }
        }

        return new SWord(pk, style);
      });

      window.instance = new Find(words);
      window.instance.options['selection-color'] = prefs[cname]['_'][1];

      window.instance.nodes();
      window.instance.highlight();

      if (isNaN(window.offset)) {
        window.instance.next();
      }
      else {
        window.instance.stats.cursor = window.offset;
      }
      update();

      if (request.origin === 'background') {
        persistent = true;
        disconnect();
        port.disconnect();
      }
    }
    else if (request.method === 'navigate') {
      window.instance[request.type === 'forward' ? 'next' : 'previous']();
      update();
    }
    else if (request.method === 'persistent') {
      persistent = true;
    }
  });
};
chrome.runtime.onConnect.addListener(connect);
