/* global SWord, RWord, Find */

const words = [
  new SWord('is', {
    'color': '#000',
    'background-color': '#a6d7ff'
  }),
  new RWord(/b..k/i)
];

window.addEventListener('load', () => {
  const instances = [];

  const f = self.f = new Find(words, document, instances);
  f.nodes();
  f.highlight();

  document.getElementById('next').onclick = () => {
    f.navigate(1);
  };

  document.getElementById('previous').onclick = () => {
    f.navigate(-1);
  };
});

