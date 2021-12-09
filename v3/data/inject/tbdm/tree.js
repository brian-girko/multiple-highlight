/* global Find */

class TCFind extends Find {
  tree(root = document.body, condition = () => NodeFilter.FILTER_ACCEPT, each = () => {}) {
    const fc = n => {
      if (n.tagName === 'IFRAME' || n.tagName === 'FRAME') {
        try {
          if (n.contentDocument.body) {
            n.contentDocument.parent = n; // reference
            n.contentDocument.top = n.offsetTop; // reference
            if (n.parent && n.parent.top) {
              n.contentDocument.top += n.parent.top;
            }

            super.tree(n.contentDocument.body, fc, each);
            if (this.docs) {
              this.docs.push(n.contentDocument);
            }
          }
          return NodeFilter.FILTER_REJECT;
        }
        catch (e) {}
      }
      if (n.innerText === '' && n.querySelector('iframe')) {
        return NodeFilter.FILTER_ACCEPT;
      }

      return condition(n);
    };

    super.tree(root, fc, each);
  }
}

window.Find = TCFind;
