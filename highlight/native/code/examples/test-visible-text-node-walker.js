/* global VisibleTextNodeWalker */

const walker = new VisibleTextNodeWalker(document.body, {
  parsed: document.body.innerText,
  raw: document.body.textContent
});

console.time('one');
let n = 0;
while (walker.nextNode()) {
  n += 1;
}
console.timeEnd('one');
console.log('matches', n);
