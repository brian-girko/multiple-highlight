/* global Find */

class CNFind extends Find {
  constructor(...args) {
    super(...args);

    this.stats.cursor = -1;
    this.options['selection-color'] = 'rgb(255, 0, 255)';
  }
  select(range, clear = true, cond = () => true) {
    const ranges = this.ranges();

    if (range === ranges[this.stats.cursor]) {
      super.select(range, true, cond, this.options['selection-color']);
    }
    else {
      super.select(range, clear, cond);
    }
  }
  navigate(step = 1) {
    const ranges = this.ranges();

    if (ranges.length === 0) {
      return;
    }

    const oc = this.stats.cursor;

    this.stats.cursor += step;
    this.stats.cursor = Math.max(-1, this.stats.cursor);

    if (step > 0) {
      this.stats.cursor = this.stats.cursor % ranges.length;
    }
    else {
      this.stats.cursor = (this.stats.cursor + ranges.length) % ranges.length;
    }
    const range = ranges[this.stats.cursor];

    const e = range.startContainer.parentElement;
    if (Node.isInViewport(e) === false) {
      e.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest'
      });
    }
    if (oc !== -1) {
      this.select(ranges[oc]);
    }
    this.select(range);
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
