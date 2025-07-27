/* global Mark */

console.time('one');
const instance = new Mark(document.body);
instance.markRegExp(/book/g, {
  done() {
    console.timeEnd('one');
  }
});
