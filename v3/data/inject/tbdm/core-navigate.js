/* global Find */

class CNFind extends Find {
  constructor(...args) {
    super(...args);

    this.stats.cursor = -1;
    this.options['selection-color'] = 'rgb(255, 0, 255)';
  }
  navigate(step = 1) {
    for (const doc of this.docs) {
      for (const old of [...doc.querySelectorAll('mark.tbdm[data-active=true]')]) {
        old.style.color = old.dataset.color;
        old.style['background-color'] = old.dataset.bg;

        delete old.dataset.active;
        delete old.dataset.color;
        delete old.dataset.bg;
      }
    }

    const ranges = this.ranges();

    if (ranges.length === 0) {
      return;
    }

    this.stats.cursor += step;
    this.stats.cursor = Math.max(-1, this.stats.cursor);

    if (step > 0) {
      this.stats.cursor = this.stats.cursor % ranges.length;
    }
    else {
      this.stats.cursor = (this.stats.cursor + ranges.length) % ranges.length;
    }

    const e = ranges[this.stats.cursor].mark;

    if (Node.isInViewport(e) === false) {
      e.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest'
      });
    }

    if (e) {
      e.dataset.active = true;
      e.dataset.color = e.style.color;
      e.dataset.bg = e.style['background-color'];

      e.style.color = '#000';
      e.style['background-color'] = this.options['selection-color'];
    }
  }
  previous() {
    this.navigate(-1);
  }
  next() {
    this.navigate(1);
  }
  destroy() {
    delete this.stats.cursor;
    super.destroy();
  }
}

window.Find = CNFind;
