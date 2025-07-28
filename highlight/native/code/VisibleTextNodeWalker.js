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
      if (nodeValue.toLowerCase() === content.slice(index + 1, index + nodeValue.length + 1).toLowerCase()) {
        return [index + 1, index + nodeValue.length + 1];
      }
    }
    // per-character checking
    const signature = nodeValue.replace(/\s/g, '');
    let i = 0;
    let s = null; // first none-space index in of nodeValue in content

    for (; index < content.length && i < signature.length; index++) {
      //  if index is the start of a full character
      const code = content.charCodeAt(index);
      if (code >= 0xDC00 && code <= 0xDFFF) {
        continue;
      }

      const char = String.fromCodePoint(content.codePointAt(index));

      if (/\s/.test(char)) {
        continue;
      }
      s = s ?? index;
      if (char.toLowerCase() !== signature[i].toLowerCase()) {
        const code = char.codePointAt(0);
        // Math italic small letters: U+1D44E to U+1D467 maps to a-z
        if (code >= 0x1D44E && code <= 0x1D467) {
          if (String.fromCharCode(0x61 + (code - 0x1D44E)) !== signature[i]) {
            throw Error('MISMATCHED_1');
          }
        }
        // Math italic capital letters: U+1D434 to U+1D44D maps to A-Z
        else if (code >= 0x1D434 && code <= 0x1D44D) {
          if (String.fromCharCode(0x41 + (code - 0x1D434)) !== signature[i]) {
            throw Error('MISMATCHED_2');
          }
        }
        else {
          throw Error('MISMATCHED_3');
        }
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
          console.log('[hidden]', value);
        }
      }
    }
    return null;
  }
}
