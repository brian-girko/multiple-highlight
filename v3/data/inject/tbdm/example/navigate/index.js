/* global SWord, Find */

const words = [
  new SWord('this', {
    'color': '#000',
    'background-color': '#a6d7ff'
  }),
  new SWord('book')
];
const f = new Find(words);
f.nodes();
f.highlight();
