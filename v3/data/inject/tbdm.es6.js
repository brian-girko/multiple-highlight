/* global TBDM */

class Mark {
  constructor() {
    this.queires = [];
  }
  mark(query, options) {
    this.queires.push({
      query,
      options
    });
    options.done();
  }
  markRegExp(query, options) {
    this.queires.push({
      query,
      options
    });
    options.done();
  }
  unmark(options) {
    if (this.tb) {
      this.tb.destroy();
    }

    let q = '[data-markjs="true"]';
    if (options && options.className) {
      q = '.' + options.className;
    }
    [...document.querySelectorAll(q)].forEach(e => {
      const n = document.createTextNode(e.textContent);
      e.replaceWith(n);
      n.parentElement.normalize();
    });
  }
  async apply(done = () => {}) {
    const tb = this.tb = new TBDM(document.body);
    for (const {query, options} of this.queires) {
      if (typeof query === 'string') {
        const r = new RegExp(query, 'gi');
        tb.find(r, options);
      }
      else {
        const r = new RegExp(query.source, 'g');
        tb.find(r, options);
      }
    }
    this.queires = [];
    tb.prepare();
    tb.each((node, extra) => {
      const mark = document.createElement('mark');
      mark.textContent = node.nodeValue;
      mark.dataset.markjs = true;
      if (extra.className) {
        mark.classList.add(extra.className);
      }
      node.replaceWith(mark);
      extra.each(mark);
    }, done);
  }
}


