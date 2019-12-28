/* globals Mark */
'use strict';
{
  const inViewport = e => {
    const rect = e.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document. documentElement.clientWidth)
    );
  };

  const instance = new Mark(document.body);
  const cache = window.cache || {0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: []};
  // persist for next use
  window.cache = cache;
  // reactivate last highlights
  [...document.querySelectorAll('mark[data-markjs="true"][data-active="false"]')].forEach(e => {
    e.dataset.active = true;
  });

  const connect = port => {
    let persistent = false;
    port.onDisconnect.addListener(() => {
      chrome.storage.local.get({
        'persistent': false
      }, prefs => {
        if (persistent === false && prefs.persistent === false) {
          instance.unmark();
          delete window.cache;
          delete window.query;
          delete window.offset;
          delete window.total;
        }
        else {
          // remove highlighted
          [...document.querySelectorAll('mark[data-markjs="true"][data-active="true"]')].forEach(e => {
            e.dataset.active = false;
          });
          window.cache = cache;
        }
        port.disconnect();
        chrome.runtime.onConnect.removeListener(connect);
      });
    });
    port.onMessage.addListener(async request => {
      if (request.method === 'reset') {
        instance.unmark();
        for (const i of Object.keys(cache)) {
          cache[i] = [];
        }
      }
      //
      if (request.method === 'search' || request.method === 'reset') {
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
        keywords = keywords.map(s => s.trim())
          .filter((s, i, l) => s && l.indexOf(s) === i && s.length >= prefs['min-length']);
        // remove unused
        for (const i of Object.keys(cache)) {
          cache[i].forEach((keyword, j) => {
            if (keyword && keywords.indexOf(keyword) === -1) {
              // console.log('removing', keyword);
              instance.unmark({
                className: 'mark' + i + j
              });
              cache[i][j] = '';
            }
          });
        }
        // remove duplicates
        const oKeywords = [];
        for (const keyword of keywords) {
          for (const i of Object.keys(cache)) {
            if (cache[i].indexOf(keyword) !== -1) {
              oKeywords.push(keyword);
            }
          }
        }
        keywords = keywords.filter(k => oKeywords.indexOf(k) === -1);
        // apply new keywords
        for (const keyword of keywords) {
          const i = Object.keys(cache)
            .sort((a, b) => cache[a].filter(a => a).length - cache[b].filter(b => b).length).shift();
          let j = cache[i].indexOf('');
          if (j === -1) {
            j = cache[i].push(keyword) - 1;
          }
          else {
            cache[i][j] = keyword;
          }
          // console.log('using', i, 'for', keyword, 'mark' + i + j);
          await new Promise(resolve => instance.mark(keyword, {
            className: 'mark' + i + j,
            separateWordSearch: false,
            done() {
              resolve();
            }
          }));
        }
        //
        const marks = [...document.querySelectorAll('mark[data-markjs="true"]')];
        // remove old actives
        for (const mark of [...document.querySelectorAll('mark[data-markjs="true"][data-active="true"]')]) {
        // any element in the view
          delete mark.dataset.active;
        }
        if (marks.length) {
          for (const mark of marks) {
            if (inViewport(mark)) {
              mark.dataset.active = true;
              mark.focus();

              // persist for next use
              window.total = marks.length;
              window.offset = marks.indexOf(mark);
              port.postMessage({
                method: 'stat',
                total: marks.length,
                offset: marks.indexOf(mark)
              });
              break;
            }
          }
          if (document.querySelector('mark[data-markjs="true"][data-active="true"]') === null) {
            marks[0].dataset.active = true;
            marks[0].scrollIntoView(prefs['scroll-into-view']);
            marks[0].focus();

            // persist for next use
            window.total = marks.length;
            window.offset = 0;
            port.postMessage({
              method: 'stat',
              total: marks.length,
              offset: 0
            });
          }
        }
        else {
          // persist for next use
          window.total = 0;
          window.offset = 0;
          port.postMessage({
            method: 'stat',
            total: 0,
            offset: 0
          });
        }
      }
      else if (request.method === 'navigate') {
        const marks = [...document.querySelectorAll('mark[data-markjs="true"]')];
        const active = document.querySelector('mark[data-markjs="true"][data-active="true"]');
        const index = marks.indexOf(active);
        if (index !== -1) {
          delete active.dataset.active;
          const offset = (marks.length + index + (request.type === 'forward' ? 1 : -1)) % (marks.length);
          const e = marks[offset];
          port.postMessage({
            method: 'stat',
            offset
          });
          e.dataset.active = true;
          if (inViewport(e) === false) {
            e.scrollIntoView(request.prefs['scroll-into-view']);
          }
          e.focus();
        }
        else {
          console.error('active index is -1', active);
        }
      }
      else if (request.method === 'persistent') {
        persistent = true;
      }
    });
  };
  chrome.runtime.onConnect.addListener(connect);
}


({
  query: window.query,
  total: window.total,
  offset: window.offset
}) // send the current query to the popup
