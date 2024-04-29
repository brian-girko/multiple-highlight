'use strict';

const app = {};

/* runtime */
app.runtime = {
  on(e, callback) {
    if (e === 'start') {
      chrome.runtime.onStartup.addListener(callback);
      chrome.runtime.onInstalled.addListener(callback);
    }
  },
  get manifest() {
    return chrome.runtime.getManifest();
  },
  connect(tabId, connectInfo) {
    let port;
    if (typeof tabId === 'object') {
      port = chrome.runtime.connect(tabId);
    }
    else {
      port = chrome.tabs.connect(tabId, connectInfo);
    }
    return {
      on(e, callback) {
        if (e === 'message') {
          port.onMessage.addListener(callback);
        }
      },
      post(msg) {
        port.postMessage(msg);
      }
    };
  }
};

/* storage */
app.storage = {
  get(prefs, type = 'managed') {
    return new Promise(resolve => {
      if (type === 'managed') {
        chrome.storage.managed.get(prefs, ps => {
          chrome.storage.local.get(chrome.runtime.lastError ? prefs : ps || prefs, resolve);
        });
      }
      else {
        chrome.storage[type].get(prefs, resolve);
      }
    });
  },
  set(prefs, type = 'managed') {
    return new Promise(resolve => {
      chrome.storage[type === 'remote' ? 'remote' : 'local'].set(prefs, resolve);
    });
  },
  on(e, callback) {
    if (e === 'changed') {
      chrome.storage.onChanged.addListener(callback);
    }
  }
};

/* button */
app.button = {
  set({
    popup
  }, tabId) {
    if (popup !== undefined) {
      chrome.browserAction.setPopup({
        tabId,
        popup
      });
    }
  },
  on(e, callback) {
    if (e === 'clicked') {
      chrome.browserAction.onClicked.addListener(callback);
    }
  }
};

/* tab */
app.tabs = {
  open({
    url
  }) {
    return new Promise(resolve => chrome.tabs.create({url}, resolve));
  },
  current() {
    return new Promise(resolve => chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs = []) => resolve(tabs[0])));
  },
  inject: {
    js(tabId, details) {
      return chrome.scripting.executeScript({
        target: {
          tabId
        },
        ...details
      }).then(r => r.map(r => r.result));
    },
    css(tabId, details) {
      return chrome.scripting.insertCSS({
        target: {
          tabId
        },
        ...details
      });
    }
  }
};

/* window */
app.windows = {
  open({url, left, top, width, height, type}) {
    width = width || 700;
    height = height || 500;
    if (left === undefined) {
      left = screen.availLeft + Math.round((screen.availWidth - width) / 2);
    }
    if (top === undefined) {
      top = screen.availTop + Math.round((screen.availHeight - height) / 2);
    }
    return new Promise(resolve => chrome.windows.create(
      {url, width, height, left, top, type: type || 'popup'},
      resolve
    ));
  }
};

/* menus */
app.menus = {
  add(...items) {
    for (const item of items) {
      chrome.contextMenus.create(Object.assign({
        contexts: item.contexts || ['browser_action']
      }, item));
    }
  },
  on(e, callback) {
    if (e === 'clicked') {
      chrome.contextMenus.onClicked.addListener(callback);
    }
  }
};
