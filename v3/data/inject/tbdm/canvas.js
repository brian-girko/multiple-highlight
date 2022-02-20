/* global Find */
class HFind extends Find {
  constructor(...args) {
    super(...args);

    this.type = 'CANVAS';

    this.canvases = new Map();

    this.options['draw-delay'] = -1; // ms
    this.options['canvas-opacity'] = 1;
    this.options['canvas-padding'] = 0;
    this.options['canvas-margin'] = 200;
  }
  canvas(doc, blend = 'multiply') { // multiply, lighten;
    if (this.canvases.has(doc)) {
      return this.canvases.get(doc);
    }
    const canvas = doc.createElement('canvas');
    canvas.style = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 2147483647;
      mix-blend-mode: ${blend};
    `;
    canvas.width = doc.documentElement.clientWidth;
    canvas.height = doc.documentElement.clientHeight;

    doc.documentElement.appendChild(canvas);

    this.canvases.set(doc, canvas);

    return canvas;
  }
  clean() {
    for (const canvas of this.canvases.values()) {
      const doc = canvas.ownerDocument;
      canvas.width = doc.documentElement.clientWidth;
      canvas.height = doc.documentElement.clientHeight;
    }
  }
  select(range, clear = true, cond = () => true, color) {
    const boxes = [...range.getClientRects()];
    const doc = range.commonAncestorContainer.ownerDocument;
    const canvas = this.canvas(doc);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color || range.style['background-color'];
    if (boxes.length && cond(boxes[0], doc)) {
      for (const box of boxes) {
        const x = Math.floor(box.x);
        const y = Math.floor(box.y);
        const width = Math.ceil(box.width);
        const height = Math.ceil(box.height);

        const cords = [
          x - this.options['canvas-padding'],
          y - this.options['canvas-padding'],
          width + 2 * this.options['canvas-padding'],
          height + 2 * this.options['canvas-padding']
        ];
        if (clear) {
          ctx.clearRect(...cords);
        }
        ctx.globalAlpha = this.options['canvas-opacity'];
        ctx.fillRect(...cords);
      }
    }
  }
  highlight() {
    return new Promise(resolve => {
      const lazy = () => {
        for (const range of this.ranges()) {
          this.select(range, false, (box, doc) => {
            let y = box.y;
            const w = document.documentElement.clientHeight; // viewport

            if (doc.top) {
              const offset = doc.top - document.documentElement.scrollTop;
              y += offset;
              // w -= offset;
            }
            return y > -this.options['canvas-margin'] && y < w + this.options['canvas-margin'];
          });
        }
        resolve();
      };
      let id;
      const c = () => {
        // clear canvas
        this.clean();
        // draw
        if (this.options['draw-delay'] === -1) {
          lazy();
        }
        else {
          clearTimeout(id);
          id = setTimeout(() => lazy(), this.options['draw-delay']);
        }
      };
      this.paint = c.bind(this);

      this.paint();
      document.addEventListener('visibilitychange', this.paint);
      for (const doc of this.docs) {
        doc.addEventListener('scroll', this.paint);
        doc.defaultView.addEventListener('resize', this.paint);
      }

      this.highlight = () => Promise.resolve();
    });
  }
  destroy() {
    super.destroy();

    for (const canvas of this.canvases.values()) {
      canvas.remove();
    }
    delete this.canvases;

    document.removeEventListener('visibilitychange', this.paint);
    for (const doc of this.docs) {
      doc.removeEventListener('scroll', this.paint);
      doc.defaultView.removeEventListener('resize', this.paint);
    }
    delete this.docs;
  }
}

window.Find = HFind;
