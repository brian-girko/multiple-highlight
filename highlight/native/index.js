/* global search, range, Highlight */

const highlight = new Highlight();
CSS.highlights.set('sample', highlight);

const regex = /nice book/ig;

const content = {
  parsed: document.body.innerText,
  raw: document.body.textContent
};
const f = search(regex, {
  element: document.body,
  content
});
for (;;) {
  const match = f.next();
  if (match.done) {
    break;
  }
  const r = range(content.parsed, match.value);

  highlight.add(r);
}
