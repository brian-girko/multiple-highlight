function range(content, {entries, start, end}) {
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
}
