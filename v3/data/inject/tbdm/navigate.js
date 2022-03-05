/* global Find */

class CNFind extends Find {
  constructor(...args) {
    super(...args);

    this.stats.cursor = -1;

    this.active = new this.doc.defaultView.Highlight();
    this.doc.defaultView.CSS.highlights.set('tbdm-highlighter-active', this.active);
  }
  styling(...args) {
    super.styling(...args);
    this.style.textContent += `
      ::highlight(tbdm-highlighter-active) {
        background-color: ${this.options['active-background-color'] || 'rgb(0, 0, 0)'};
        color: ${this.options['active-color'] || 'rgb(255, 0, 255)'};
      }
    `;
  }
  #navigate(step = 1, proceed = (range, found, c) => c()) {
    const ranges = this.ranges;

    if (ranges.length === 0) {
      return;
    }
    // remove old one
    {
      const e = ranges[this.stats.cursor];
      if (e) {
        this.active.delete(e);
      }
    }

    // update cursor
    let cursor = this.stats.cursor + step;
    cursor = Math.max(-1, cursor);
    if (step > 0) {
      cursor = cursor % ranges.length;
    }
    else {
      cursor = (cursor + ranges.length) % ranges.length;
    }
    const e = ranges[cursor];
    if (e) {
      const found = this.stats.cursor === -1 || (step > 0 ? cursor !== 0 : cursor !== ranges.length - 1);

      proceed(e, found, () => {
        this.stats.cursor = cursor;
        this.active.add(e);

        const node = e.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ?
          e.commonAncestorContainer : e.commonAncestorContainer.parentElement;

        Node.isInViewport(node).then(b => b === false && node.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest'
        }));
      });
    }
  }
  navigate(step) {
    this.#navigate(step);
  }
  previous(proceed = undefined) {
    this.#navigate(-1, proceed);
  }
  next(proceed = undefined) {
    this.#navigate(1, proceed);
  }
}

window.Find = CNFind;
