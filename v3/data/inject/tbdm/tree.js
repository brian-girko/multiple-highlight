/* global Find */

class TCFind extends Find {
  constructor(words, doc = document, options = {}, instances = []) {
    super(words, doc, options, instances);

    this.childs = [];
    this.instances = instances;
    this.stats.n = 0;

    for (const i of instances) {
      if (i.doc === doc) {
        return;
      }
    }
    instances.push(this);

    for (const e of [...doc.querySelectorAll('iframe')]) {
      try {
        if (e.contentDocument) {
          const f = new Find(words, e.contentDocument, options, instances);
          this.childs.push(f);
        }
      }
      catch (e) {}
    }
  }
  highlight(...args) {
    super.highlight(...args);
    for (const f of this.childs) {
      f.highlight(...args);
    }
  }
  destroy(...args) {
    super.destroy(...args);
    for (const f of this.childs) {
      f.destroy(...args);
    }
  }
  /**/
  navigate(step = 1) {
    this.instances[this.stats.n][step > 0 ? 'next' : 'previous']((range, found, c) => {
      if (found) {
        c();
      }
      else {
        this.stats.n += step;
        this.stats.n = (this.stats.n + this.instances.length) % this.instances.length;

        // reset
        if (this.stats.n === 0) {
          for (const f of this.instances) {
            f.stats.cursor = -1;
          }
        }
        this.navigate(step);
      }
    });
  }
}

window.Find = TCFind;
