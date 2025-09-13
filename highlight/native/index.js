/* global search, range, Highlight */

addEventListener('load', () => {
  const regex = /nice book/ig;

  const docs = [document];
  for (let i = 0; i < self.frames.length; i+=1) {
    const frame = self.frames[i];
    try {
      docs.push(frame.document);
    }
    catch (e) {}
  }

  for (const doc of docs) {
    const highlight = new Highlight();
    doc.defaultView.CSS.highlights.set('sample', highlight);

    const content = {
      parsed: doc.body.innerText,
      raw: doc.body.textContent
    };
    console.log(content);

    const f = search(regex, {
      element: doc.body,
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
  }
});
