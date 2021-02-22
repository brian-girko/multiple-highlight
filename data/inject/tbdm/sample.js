import TBDM from './tbdm.js';

const tb = new TBDM(document.getElementById('two'));
tb.find('good', {
  color: 'red'
}).find(/b..k/ig, {
  color: 'blue'
}).prepare();

tb.each((node, extra) => {
  const mark = document.createElement('mark');
  mark.textContent = node.nodeValue;
  mark.style.color = extra.color;
  node.replaceWith(mark);
});
