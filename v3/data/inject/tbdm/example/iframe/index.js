/* global SWord, RWord, Find */

const words = [
  new SWord('is', {
    'color': '#000',
    'background-color': '#a6d7ff'
  }),
  new RWord(/b..k/i)
];

const f = new Find(words);
window.addEventListener('load', () => {
  f.nodes();
  f.highlight();
});
