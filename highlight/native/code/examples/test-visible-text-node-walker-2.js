/* global VisibleTextNodeWalker */

const walker = new VisibleTextNodeWalker(document.body, {
  parsed: document.body.innerText,
  raw: document.body.textContent
});
console.log(document.body.innerText);
console.log(document.body.textContent);

console.time('one');
let n = 0;
let walk;
while (walk = walker.nextNode()) {
  console.log(walk);
  n += 1;
}
console.timeEnd('one');
console.log('matches', n);
