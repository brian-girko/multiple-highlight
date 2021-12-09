/* global TBDM */

const tb = new TBDM(document.getElementById('two'));

console.time();
// tb.find('good', {
//   color: 'red'
// }).find(/b..k/ig, {
//   color: 'blue'
// }).prepare();

tb.find('This book', {
  color: 'red'
}).prepare();

tb.each((node, extra) => {
  const mark = document.createElement('mark');
  mark.textContent = node.nodeValue;
  mark.style.color = extra.color;
  node.replaceWith(mark);
});

console.timeEnd();
