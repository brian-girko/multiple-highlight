/* global Highlight, search, range */

{
  self.gyhJud = self.gyhJud || {
    offset: 0,
    match: ''
  };

  const scrollRangeIntoViewIfNeeded = (range, prefs) => {
    const rect = range.getBoundingClientRect();
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );

    if (!isInViewport) {
      const node = range.startContainer.nodeType === Node.TEXT_NODE ?
        range.startContainer.parentElement : range.startContainer;

      node?.scrollIntoView(prefs['scroll-into-view']);
    }
  };

  const parse = request => {
    const {query, separator, prefs} = request;
    const keywords = new Set();

    const add = keyword => {
      if (keyword.indexOf(':') === -1) {
        if (keyword.length >= prefs['min-length']) {
          keywords.add(keyword);
        }
      }
      else {
        if (keyword.split(':')[1].length >= prefs['min-length']) {
          keywords.add(keyword);
        }
      }
    };

    if (separator === 'false') {
      add(query);
    }
    else {
      for (const keyword of query.split(separator)) {
        add(keyword);
      }
    }

    return keywords;
  };
  const matrix = keywords => {
    const matrix = new Set();
    let n = 0;
    for (const keyword of keywords) {
      const command = keyword.indexOf(':') === -1 ? '' : keyword.split(':')[0].toLowerCase();
      const pk = command ? keyword.substr(command.length + 1) : keyword;

      const type = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'][n % 9];
      matrix.add({command, pk, type});

      n += 1;
    }

    return matrix;
  };

  const connect = port => {
    let persistent = false;
    const selection = new Highlight();
    selection.priority = 2;
    CSS.highlights.set('type-_', selection);

    const highlights = new Map();
    for (const ch of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      const highlight = new Highlight();
      CSS.highlights.set('type-' + ch, highlight);

      highlights.set(ch, highlight);
    }
    const ranges = new Map();

    const disconnect = () => {
      if (persistent === false) {
        for (const highlight of highlights.values()) {
          highlight.clear();
        }
        highlights.clear();
      }
      selection.clear();
      chrome.runtime.onConnect.removeListener(connect);
    };
    port.onMessage.addListener(request => {
      if (request.method === 'persistent') {
        persistent = true;
      }
      else if (request.method === 'search' || request.method === 'reset') {
        // clean old results
        for (const highlight of highlights.values()) {
          highlight.clear();
        }
        selection.clear();
        ranges.clear();
        // extract keywords
        const keywords = parse(request);
        // generate regexps
        const regexps = new Map();
        try {
          for (const m of matrix(keywords)) {
            // remove special chars for normal search
            if (m.command.includes('r') === false) {
              m.pk = m.pk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }
            const regexp = new RegExp(m.pk, 'ig');
            regexp.type = m.type;
            regexps.set(m, regexp);
          }
        }
        catch (e) {
          port.postMessage({
            method: 'clean',
            clean: e.message
          });
          return;
        }
        const matches = new Map();

        // convert multiple regexps to a single one
        const regep = {
          exec(content) {
            // update all regexp
            for (const [m, reg] of regexps) {
              if (matches.has(reg) === false) {
                const r = reg.exec(content);
                if (r) {
                  r.type = reg.type;
                  matches.set(reg, r);
                }
                else {
                  regexps.delete(m);
                }
              }
            }
            // find the first occurrence
            let first; // nearest match
            for (const [reg, m] of matches) {
              if (!first || m.index < first.m.index) {
                first = {m, reg};
              }
            }
            if (first) {
              matches.delete(first.reg);
              return first.m;
            }
          }
        };

        /* highlight */
        const content = {
          parsed: document.body.innerText,
          raw: document.body.textContent
        };
        const f = search(regep, {
          element: document.body,
          content,
          validate(m) {
            return m[0].length >= request.prefs['min-length'];
          }
        });
        for (;;) {
          const match = f.next();
          if (match.done) {
            break;
          }
          const r = range(content.parsed, match.value);
          const highlight = highlights.get(match.value.match.type);
          highlight.add(r);
          ranges.set(ranges.size, r);
        }
        if (ranges.size) {
          if (self.gyhJud.offset > ranges.size) {
            self.gyhJud.offset = 0;
          }
          if (self.gyhJud.offset > 0) {
            const r = ranges.get(self.gyhJud.offset);
            if (self.gyhJud.match !== r.toString()) {
              self.gyhJud.offset = 0;
            }
          }
          // activate
          const r = ranges.get(self.gyhJud.offset);
          self.gyhJud.match = r.toString();
          selection.clear();
          selection.add(r);
          // navigate
          scrollRangeIntoViewIfNeeded(r, request.prefs);
        }
        else {
          self.gyhJud.offset = 0;
          delete self.gyhJud.match;
        }
        port.postMessage({
          method: 'stat',
          offset: self.gyhJud.offset,
          total: ranges.size
        });
      }
      else if (request.method === 'navigate') {
        self.gyhJud.offset = (ranges.size + self.gyhJud.offset + (request.type === 'forward' ? +1 : -1)) % ranges.size;
        port.postMessage({
          method: 'stat',
          offset: self.gyhJud.offset,
          total: ranges.size
        });
        // activate
        const r = ranges.get(self.gyhJud.offset);
        self.gyhJud.match = r.toString();
        selection.clear();
        selection.add(r);
        // navigate
        scrollRangeIntoViewIfNeeded(r, request.prefs);
      }
    });
    port.onDisconnect.addListener(disconnect);
  };
  chrome.runtime.onConnect.addListener(connect);
}
