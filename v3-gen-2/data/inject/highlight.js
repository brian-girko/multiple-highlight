{
  /* walker */
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
  /* range */
  const range = (content, {entries, start, end}) => {
    const range = new Range();
    // sync start
    {
      const {node, value, offset} = entries[0];
      if (offset === start) {
        range.setStart(node, 0);
      }
      else {
        const text = content.slice(offset, start);

        // do we have a clean node
        if (value.slice(0, start - offset) === text) {
          range.setStart(node, start - offset);
        }
        else {
          const spaces = value.indexOf(value.trimLeft());
          let i = 0;
          for (let m = spaces; m < value.length; m += 1) {
            if (value[m] === text[i]) {
              i += 1;
            }
            if (i === text.length) {
              range.setStart(node, m + 1);
              break;
            }
          }
        }
      }
    }
    // sync end
    {
      const {node, value, offset} = entries[1];
      if (offset === end) {
        range.setEnd(node, 0);
      }
      else {
        const text = content.slice(offset, end);

        // do we have a clean node
        if (value.slice(0, end - offset) === text) {
          range.setEnd(node, end - offset);
        }
        else {
          const spaces = value.indexOf(value.trimLeft());
          let i = 0;
          for (let m = spaces; m < value.length; m += 1) {
            if (value[m] === text[i]) {
              i += 1;
            }
            if (i === text.length) {
              range.setEnd(node, m + 1);
              break;
            }
          }
        }
      }
    }
    return range;
  };
  /* search */
  const search = function* (regex, {element, content, validate = () => true}) {
    const walker = new VisibleTextNodeWalker(element, content);

    let previous; // walk object
    let current; // walk object
    let match; // regexp match result

    let entries = [];
    for (;;) {
      if (!match) {
        match = regex.exec(content.parsed);
        // is the match valid
        if (match) {
          if (validate(match) !== true) {
            match = null;
            continue;
          }
        }
        else {
          break; // end of matches
        }
      }
      // find the starting node
      const start = match.index;
      if (previous) {
        // offset of the first none-space character
        const offset = previous.offset;

        if (entries.length === 0) {
          if (offset <= start) {
            if (current?.offset > start || !current) {
              entries[0] = previous;
            }
          }
        }
        // find the end node (do not use else if)
        if (entries.length) {
          const end = start + match[0].length;
          if (offset < end) {
            if (current?.offset >= end || !current) {
              entries[1] = previous;

              yield {
                start, // start of the match in parsed content
                end, // end of the match in parsed content
                match,
                entries // [start, end] entries
              };
              entries = [];
              match = null;
              continue;
            }
          }
        }
      }

      [previous, current] = [current, walker.nextNode()];

      // we need to find all matches before the end of tree
      if (!previous && !current) {
        throw Error('EOF');
      }
    }
  };

  self.range = range;
  self.search = search;
}

// eslint-disable-next-line semi
''
