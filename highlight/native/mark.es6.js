/* global search, range, Highlight */

class Mark {
  #root;
  #highlight;

  constructor(root) {
    this.#root = root;
  }
  markRegExp(regex, options = {}) {
    const content = {
      parsed: this.#root.innerText,
      raw: this.#root.textContent
    };
    const f = search(regex, {
      element: this.#root,
      content
    });

    const highlight = new Highlight();
    for (;;) {
      const match = f.next();
      if (match.done) {
        break;
      }
      const r = range(content.parsed, match.value);
      highlight.add(r);
    }
    CSS.highlights.set('sample', highlight);

    options?.done();
  }
  mark(string, options) {
    const regex = new RegExp(string, 'ig');
    return this.markRegExp(regex, options);
  }
}
