/* global Find */
class HFind extends Find {
  constructor(...args) {
    super(...args);

    this.type = 'CANVAS';

    this.canvases = new Map();

    this.options['draw-delay'] = 0; // ms
    this.options['canvas-opacity'] = 0.3;
    this.options['canvas-height'] = 2;
    this.options['canvas-offset'] = 2;
  }
  canvas(doc) {
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

        if (clear) {
          ctx.clearRect(x, y + this.options['canvas-offset'], width, height);
        }

        if (color) {
          ctx.globalAlpha = this.options['canvas-opacity'];
          ctx.fillRect(x, y + this.options['canvas-offset'], width, height);
        }
        else {
          ctx.globalAlpha = 1;
          ctx.fillRect(
            x,
            y + this.options['canvas-offset'] + height - this.options['canvas-height'],
            width,
            this.options['canvas-height']
          );
        }
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
            return y > -10 && y < w + 10;
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

    for (const doc of this.docs) {
      doc.removeEventListener('scroll', this.paint);
      doc.defaultView.removeEventListener('resize', this.paint);
    }
    delete this.docs;
  }
}

window.Find = HFind;
