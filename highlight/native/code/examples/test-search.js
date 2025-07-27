/* global search */

const regex = /a book/g;

const s = search(regex, {
  element: document.body,
  content: {
    parsed: document.body.innerText,
    raw: document.body.textContent
  }
});
for (;;) {
  const match = s.next();
  if (match.done) {
    break;
  }
  console.log(match.value);
}
