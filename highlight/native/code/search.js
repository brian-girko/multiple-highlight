/* global VisibleTextNodeWalker */

function* search(regex, {element, content}) {
  const walker = new VisibleTextNodeWalker(element, content);

  let previous; // walk object
  let current; // walk object
  let match; // regexp match result

  let entries = [];
  for (;;) {
    if (!match) {
      match = regex.exec(content.parsed);
    }
    if (!match) {
      break; // end of matches
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
}
