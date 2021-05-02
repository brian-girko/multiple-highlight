/* Text-Based Document Manipulation Library */

const SPLIT = Symbol();

class CONFIG {
  constructor() {
    this.USEASYNC = true;
    this.break = false; // set to false to break sync loops
  }
}

class TBDM extends CONFIG {
  constructor(element) {
    super();
    this.element = element;
    // generate no-space one-line segments from input document
    this.contents = this.element.innerText.split('\n');
    // calculate the offset of each segment
    let offset = 0;
    this.offsets = [0, ...this.contents.map(c => {
      offset += c.replace(/\s/g, '').length;
      return offset;
    })];
    // keeps no-space range objects ({start, word, extra}) to be marked
    this.ranges = [];
    //
    this.options = {
      'no-hidden-element': true // this may slowdown on large documents
    };
  }
  /* convert a normal range to a non-space {start, end, ...} range */
  convert({start, word}, index, extra = {}) {
    const o = {
      start: this.contents[index].substr(0, start).replace(/\s/g, '').length + this.offsets[index],
      index,
      extra
    };
    o.end = o.start + word.replace(/\s+/, '').length;
    this.ranges.push(o);
  }
  // find all instances of a query (string or regex) and add a space-less range object
  find(query, extra = {}) {
    this.contents.forEach((content, index) => {
      if (query.test) {
        if (query.flags.indexOf('g') === -1) {
          throw Error('query does not have the glob flag');
        }
        let result;
        let offset = -1;
        while (result = query.exec(content)) {
          this.convert({ // this is range from
            start: result.index,
            word: result[0]
          }, index, extra);
          if (offset === result.index) {
            throw Error('recursive query');
          }
          offset = result.index;
        }
      }
      else {
        // handling &nbsp;
        let start = content.replace(/\xA0/g, ' ').indexOf(query);
        while (start !== -1) {
          this.convert({ // this is range from
            start,
            word: query
          }, index, extra);
          start = content.indexOf(query, start + query.length);
        }
      }
    });
    return this;
  }
  /* split a text node into multiple text nodes and return a list of nodes that match a range */
  [SPLIT](node, points) {
    const nodes = [];
    points = points.sort((a, b) => a.relative - b.relative);

    const ps = points.map(o => o.relative);
    let n = 0;
    let p = ps[n];
    let nospace = 0;
    const next = () => {
      for (let j = 0; j < node.length; j += 1) {
        if (nospace === p) {
          // remove initial spacing of the word start
          const b = points[n].type === 'start';
          if (b) {
            const m = /^\s*/.exec(node.nodeValue.substr(j));
            j += m[0].length;
          }
          node = node.splitText(j);
          if (b) {
            nodes.push({
              node,
              extra: points[n].extra
            });
          }
          n += 1;
          p = ps[n];
          if (p !== undefined) {
            return next();
          }
        }
        if (/\s/.test(node.nodeValue[j]) === false) {
          nospace += 1;
        }
      }
    };
    next();
    // remove post spaces
    for (const node of nodes) {
      if (/\s+$/.test(node.nodeValue)) {
        const m = /\s+$/.exec(node.nodeValue);
        node.splitText(m.length);
      }
    }
    return nodes.filter(n => n.node.length);
  }
  /* create the "this.actions" map which contains a map of nodes that need to be altered */
  prepare() {
    const actions = this.actions = new Map();
    const visibles = this.visibles = new Set();

    // sort ranges object
    this.ranges = this.ranges.sort((a, b) => a.start - b.start);
    // find all start and end points
    const points = this.ranges.map(o => [o.start, o.end]).flat();

    if (points.length % 2 === 1) {
      throw Error('points need to be even');
    }
    const offsets = [];
    const nodes = [];
    // find all node offsets
    {
      const isInViewport = element => {
        const rect = element.getBoundingClientRect();
        const html = document.documentElement;
        return (
          rect.bottom + 10 >= 0 &&
          rect.top - 10 <= (window.innerHeight || html.clientHeight)
        );
      };

      const iterator = document.createNodeIterator(this.element, NodeFilter.SHOW_TEXT);
      let node;
      let offset = 0;
      let overflow = false;
      while (node = iterator.nextNode()) {
        const parent = node.parentElement;
        // dealing with hidden elements
        if (parent.offsetHeight === 0) {
          continue;
        }
        if (this.options['no-hidden-element'] && getComputedStyle(parent).visibility === 'hidden') {
          continue;
        }
        // ignore empty nodes
        const value = node.nodeValue.replace(/\s+/g, '');
        if (value === '') {
          continue;
        }
        offset += value.length;
        nodes.push(node);
        offsets.push(offset);
        // find visible elements
        if (overflow || this.USEASYNC === false) {
          continue;
        }
        if (isInViewport(parent)) {
          visibles.add(node);
        }
        else if (visibles.size) {
          overflow = true;
        }
      }
    }
    // assign points to nodes
    {
      let m = 0;
      let offset = offsets[m];
      let begin = 0;
      let ps = [];
      for (let n = 0; n < points.length; n += 2) {
        const start = points[n];
        const end = points[n + 1];
        while (offset <= start) {
          if (ps.length) {
            actions.set(nodes[m], ps);
          }
          begin = offset;
          m += 1;
          offset = offsets[m];
          ps = [];
        }
        const {extra} = this.ranges[n / 2];
        ps.push({
          relative: start - begin,
          type: 'start',
          extra
        }, {
          relative: end - begin,
          type: 'end',
          extra
        });
      }
      if (ps.length) {
        actions.set(nodes[m], ps);
      }
    }
    return this;
  }
  /* split each text node into multiple text nodes, and return nodes that need to be altered */
  each(c, done = () => {}) {
    // highlight visible
    for (const [node, points] of this.actions.entries()) {
      if (this.USEASYNC === false || this.visibles.has(node)) {
        const nodes = this[SPLIT](node, points);
        for (const {node, extra} of nodes) {
          c(node, extra);
        }
      }
    }
    // highlight invisibles
    if (this.USEASYNC) {
      (async () => {
        let mm = 0;
        for (const [node, points] of this.actions.entries()) {
          if (this.break) {
            return;
          }
          if (this.visibles.has(node) === false) {
            const nodes = this[SPLIT](node, points);
            for (const {node, extra} of nodes) {
              c(node, extra);
            }
            mm += 1;
            if (mm % 30) {
              await new Promise(resolve => requestAnimationFrame(resolve));
            }
          }
        }
        done();
      })();
    }
    else {
      done();
    }
  }
  destroy() {
    this.break = true;
    delete this.contents;
    delete this.offsets;
    delete this.ranges;
    delete this.actions;
    delete this.visibles;
    delete this.element;
  }
}
