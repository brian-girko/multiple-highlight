/* global SWord, Find */

const words = [
  new SWord('this', {
    'color': '#000',
    'background-color': '#cb4f00'
  }),
  new SWord('book', {
    'color': '#000',
    'background-color': '#f60000'
  })
];

const f = new Find(words);
window.addEventListener('load', () => {
  f.nodes();
  f.highlight();
});
