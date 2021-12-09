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
    const box = n.getBoundingClientRect();
    const doc = n.ownerDocument;

    // parent window is not in the viewport
    let offset = 0;
    if (doc.top) {
      offset = doc.top - document.documentElement.scrollTop;
    }

    const height = Math.min(doc.top + doc.documentElement.clientHeight, document.documentElement.clientHeight) -
      doc.top;

    return (
      box.top + offset >= 0 &&
      box.left >= 0 &&
      box.bottom + offset <= height &&
      box.right <= document.documentElement.clientWidth
    );
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
  ranges(words, history) {
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

    const walk = document.createTreeWalker(this.e, NodeFilter.SHOW_TEXT, {
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
    let e = document.createRange();

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
                e.style = this.words[range[2]].style;
                out.push(e);
              }

              range = ranges.shift();

              if (!range) {
                return out;
              }
              e = document.createRange();
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
  constructor(words) {
    this.type = 'MARK';

    this.words = words;

    const doc = document;
    doc.top = 0;
    this.docs = [doc];

    this.stats = {
      total: 0
    };

    this.options = {};
  }
  tree(root = document.body, condition = () => NodeFilter.FILTER_ACCEPT, each = () => {}) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
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
    this.tree(document.body, condition, each);

    /* find nodes */
    const nodes = [];
    const once = node => {
      if (node.valid()) {
        nodes.push(node);
      }
      node.children.forEach(once);
    };
    once(tree);

    this._nodes = nodes;
    this.nodes = () => this._nodes;

    return this._nodes;
  }
  ranges() {
    const history = new Set();
    this._ranges = this.nodes().map(n => {
      try {
        return n.ranges(n.words, history);
      }
      catch (e) {
        console.warn('cannot extract ranges of a node', n, e);
        return [];
      }
    }).flat();

    delete this._nodes;

    this.stats.total = this._ranges.length;
    this.ranges = () => this._ranges;

    return this._ranges;
  }
  highlight() {
    for (const range of this.ranges()) {
      const mark = document.createElement('mark');
      Object.assign(mark.style, range.style);

      mark.classList.add('tbdm');
      mark.appendChild(range.extractContents());
      range.insertNode(mark);

      range.mark = mark;
    }
  }
  destroy() {
    if (this.type === 'MARK') {
      for (const doc of this.docs) {
        for (const mark of [...doc.querySelectorAll('mark.tbdm')]) {
          const f = document.createDocumentFragment();
          for (const n of [...mark.childNodes]) {
            f.appendChild(n);
          }
          mark.replaceWith(f);
        }
      }
    }

    delete this.words;
    delete this.stats;
    delete this.options;
    delete this._nodes;
    delete this._ranges;
  }
}

window.Find = CFind;
