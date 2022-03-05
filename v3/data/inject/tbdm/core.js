class SWord {
  constructor(word, style = {
    'color': '#000',
    'background-color': '#FF0'
  }) {
    this.word = word.toLowerCase();
    this.style = style;
  }
  count(string) {
    return string.toLowerCase().split(this.word).length - 1;
  }
  ranges(string) {
    string = string.toLowerCase();
    let n = 0;
    let offset = 0;
    const ranges = [];
    for (;;) {
      n = string.indexOf(this.word, offset);
      if (n === -1) {
        break;
      }
      ranges.push([n, n + this.word.length - 1]);
      offset = n + this.word.length;
    }
    return ranges;
  }
}
class RWord {
  constructor(word, style = {
    'color': '#000',
    'background-color': '#FF0'
  }) {
    this.word = word;
    this.style = style;
  }
  count(string) {
    return string.split(this.word).length - 1;
  }
  ranges(string) {
    let offset = 0;
    const ranges = [];

    for (let n = 0; n < 1000; n += 1) {
      const r = this.word.exec(string.substr(offset));
      if (r) {
        ranges.push([offset + r.index, offset + r.index + r[0].length - 1]);
        offset += r.index + r[0].length;
      }
      else {
        break;
      }
    }
    return ranges;
  }
}

class Node {
  static isInViewport(n) {
    return new Promise(resolve => {
      const doc = n.ownerDocument;
      const o = new doc.defaultView.IntersectionObserver(es => {
        resolve(es.some(e => e.isIntersecting));
      }, {threshold: 0.5});
      o.observe(n);
    });
  }
  constructor(e, count = 0) {
    this.e = e;
    this.count = count;
    this.children = [];
  }
  add(e) {
    this.children.push(e);
    e.parent = this;
  }
  valid() {
    const count = this.children.reduce((p, c) => p + c.count, 0);

    return this.count > count;
  }
  toString() {
    return this.e.innerText.replace(/[\n\t]/g, '');
  }
  /* extract all ranges for a node */
  ranges(words, history, custom = () => {}) {
    // [[start, end, type], ...]
    let ranges = words.map((w, n) => w.ranges(this.toString()).map(r => [...r, n])).flat().sort((a, b) => {
      return a[0] - b[0];
    });
    // remove conflicts
    let offset = 0;
    ranges.forEach((range, m) => {
      ranges[m][0] = Math.max(range[0], offset);
      offset = Math.max(range[1] + 1, offset);
    });
    // remove empty ranges
    ranges = ranges.filter(r => r[1] >= r[0]);

    // extract text nodes
    const content = this.toString();

    const doc = this.e.ownerDocument;
    const walk = doc.createTreeWalker(this.e, NodeFilter.SHOW_TEXT, {
      acceptNode: () => {
        return NodeFilter.FILTER_ACCEPT;
      }
    }, false);
    let t;
    let position = -1;
    let ch;
    const update = () => {
      position += 1;
      if (position === content.length) {
        return false;
      }
      ch = content[position];
    };
    update();
    let range = ranges.shift();
    let e = doc.createRange();

    const track = () => {
      const out = [];

      while (t = walk.nextNode()) {
        const ignore = history.has(t);

        history.add(t);
        const data = t.data.replace(/[\n\t]/g, ' ');

        for (let x = 0; x < data.length; x += 1) {
          if (data[x] === ch) {
            if (range[0] === position) {
              e.setStart(t, x);
            }
            if (range[1] === position) {
              e.setEnd(t, x + 1);
              if (ignore === false) {
                custom(e, this.words[range[2]]);
                out.push(e);
              }

              range = ranges.shift();

              if (!range) {
                return out;
              }
              e = doc.createRange();
            }
            if (update() === false) {
              throw Error('position reached');
            }
          }
        }
      }
      throw Error('end of stream');
    };

    return track();
  }
}

class CFind {
  constructor(words, doc = document, options = {}) {
    this.words = words;
    this.doc = doc;
    this.options = options;

    if (!doc) {
      throw Error('document is mandatory');
    }

    // styling
    this.highlights = new Map();
    this.styling();

    this.stats = {
      total: 0
    };
  }
  styling() {
    const style = this.style = this.doc.createElement('style');
    style.textContent = '';

    this.words.forEach((word, n) => {
      const name = 'tbdm-highlighter-' + n;

      const highlight = new this.doc.defaultView.Highlight();
      this.doc.defaultView.CSS.highlights.set(name, highlight);
      this.highlights.set(word, highlight);

      style.textContent += `
        ::highlight(${name}) {
          background-color: ${word.style['background-color']};
          color: ${word.style.color};
        }
      `;
    });
    this.doc.body.appendChild(style);
  }
  tree(root = this.doc.body, condition = () => NodeFilter.FILTER_ACCEPT, each = () => {}) {
    const walk = this.doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(n) {
        return condition(n);
      }
    }, false);
    let node;
    while (node = walk.nextNode()) {
      each(node);
    }
  }
  nodes() {
    /* create a tree */
    const tree = new Node();
    const map = new Map();

    const condition = n => {
      if (n.innerText && n.offsetHeight) {
        const v = getComputedStyle(n);
        if (v.visibility !== 'hidden' && v.display !== 'none' && v.opacity !== '0') {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_REJECT;
    };
    const each = node => {
      const a = this.words.map(w => w.count(node.innerText));
      const count = a.reduce((p, c) => p + c, 0);
      if (count) {
        const n = new Node(node, count);
        map.set(node, n);
        if (map.has(node.parentElement)) {
          map.get(node.parentElement).add(n);
        }
        else {
          tree.add(n);
        }
        n.words = this.words.filter((d, n) => a[n]);
      }
    };
    this.tree(this.doc.body, condition, each);

    /* find nodes */
    const nodes = [];
    const once = node => {
      if (node.valid()) {
        nodes.push(node);
      }
      node.children.forEach(once);
    };
    once(tree);

    this.nodes = () => nodes;
    return nodes;
  }
  highlight() {
    const history = new Set();
    const ranges = this.ranges = this.nodes().map(n => {
      try {
        return n.ranges(n.words, history, (range, word) => {
          this.highlights.get(word).add(range);
        });
      }
      catch (e) {
        console.warn('cannot extract ranges of a node', n, e);
        return [];
      }
    }).flat();

    this.stats.total = ranges.length;
  }
  destroy() {
    this.doc.defaultView.CSS.highlights.clear();

    this.style.remove();

    delete this.words;
    delete this.stats;
    delete this.options;
  }
}

window.Find = CFind;
