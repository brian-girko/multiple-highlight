/* global Find */

class RUFind extends Find {
  constructor(...args) {
    super(...args);

    const doc = args[1];

    this.lines = {
      horizontal: doc.createElement('div'),
      vertical: doc.createElement('div')
    };
    this.lines.horizontal.classList.add('hozruler', 'hidden');
    this.lines.vertical.classList.add('verruler', 'hidden');
    doc.documentElement.append(this.lines.horizontal, this.lines.vertical);
  }
  styling(...args) {
    super.styling(...args);

    this.style.textContent += `
      .hozruler,
      .verruler {
        all: initial;
        position: absolute;
        background: #a6d7ff54;
      }
      .hozruler.hidden,
      .verruler.hidden {
        display: none;
      }
      .hozruler {
        top: 10px;
        left: 0;
        width: 500px;
        height: 10px;
      }
      .verruler {
        top: 0;
        left: 10px;
        width: 10px;
        height: 500px;
      }
    `;
  }
  #step(proceed) {
    const {horizontal, vertical} = this.lines

    return new Proxy(proceed, {
      apply(target, self, args) {
        const [range, found] = args;

        if (range && found) {
          const rect = range.getBoundingClientRect();

          horizontal.style.top = (document.documentElement.scrollTop + rect.top + rect.height) + 'px';
          horizontal.style.left = (document.documentElement.scrollLeft + rect.left - 250) + 'px';
          vertical.style.left = (document.documentElement.scrollLeft + rect.left - 10) + 'px';
          vertical.style.top = (document.documentElement.scrollTop + rect.top + rect.height - 250) + 'px';

          horizontal.classList.remove('hidden');
          vertical.classList.remove('hidden');
        }
        else {
          horizontal.classList.add('hidden');
          vertical.classList.add('hidden');
        }

        return Reflect.apply(target, self, args);
      }
    });
  }
  previous(proceed = undefined) {
    proceed = this.#step(proceed);
    super.previous(proceed);
  }
  next(proceed = undefined) {
    proceed = this.#step(proceed);
    super.next(proceed);
  }
  destroy() {
    this.lines.horizontal.remove();
    this.lines.vertical.remove();
    delete this.lines;

    super.destroy();
  }
}
window.Find = RUFind;
