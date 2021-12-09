/* global SWord, Find */

const words = [
  new SWord('this', {
    'color': '#000',
    'background-color': 'rgba(0, 0, 255)'
  }),
  new SWord('book')
];
const f = new Find(words);
f.nodes();
f.highlight();
