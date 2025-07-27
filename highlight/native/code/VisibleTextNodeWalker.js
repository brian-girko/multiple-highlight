class VisibleTextNodeWalker {
  #walker;

  #parsed; // parsed content (element.innerText)
  #raw; // raw content (element.textContent)

  #rawIndex = 0; // track position in the raw content
  #parsedIndex = 0; // track position in the parsed content

  // is nodeValue equal to the content at the index position
  #compare(nodeValue, content, index) {
    // no content node
    if (nodeValue.trim() === '') {
      return [null, index];
    }
    // exactly matched node
    if (/\s/.test(nodeValue[0]) === false) {
      if (nodeValue === content.slice(index + 1, index + nodeValue.length + 1)) {
        return [index + 1, index + nodeValue.length + 1];
      }
    }
    // per-character checking
    const signature = nodeValue.replace(/\s/g, '');
    let i = 0;
    let s = null; // first none-space index in of nodeValue in content

    for (; index < content.length && i < signature.length; index++) {
      const char = content[index];
      if (/\s/.test(char)) {
        continue;
      }
      s = s ?? index;
      if (char.toLowerCase() !== signature[i].toLowerCase()) {
        throw Error('MISMATCHED');
      }
      i += 1;
    }

    return [s, index];
  }
  constructor(element, content) {
    this.#walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    this.#raw = content.raw;
    this.#parsed = content.parsed;
  }
  nextNode() {
    let node;
    while ((node = this.#walker.nextNode())) {
      const value = node.nodeValue;
      const rawIndex = this.#raw.indexOf(value, this.#rawIndex);

      if (rawIndex === this.#rawIndex) {
        this.#rawIndex += value.length;

        try {
          const [offset, end] = this.#compare(value, this.#parsed, this.#parsedIndex);

          if (end !== this.#parsedIndex) {
            this.#parsedIndex = end;
            if (node.parentNode?.namespaceURI === 'http://www.w3.org/2000/svg') {
              throw Error('SVG_PARENT');
            }
            return {node, value, offset};
          }
        }
        // Skip invisible or mismatched nodes
        catch (e) {
          console.log('hidden', value);
        }
      }
      else {
        console.log(node, node.parentNode, value, rawIndex, this.#rawIndex, 'hidden');
      }
    }
    return null;
  }
}
