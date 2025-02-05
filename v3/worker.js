/* global utils */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/data/popup/utils.js');
}

// delete history when it is disabled
chrome.storage.onChanged.addListener(prefs => {
  if (prefs['history-enabled'] && prefs['history-enabled'].newValue === false) {
    chrome.storage.local.set({
      'history-cache': {}
    });
  }
});

//
chrome.commands.onCommand.addListener(async command => {
  if (command === 'ckey_highlight') {
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    if (tabs.length) {
      const tab = tabs[0];
      const prefs = await chrome.storage.local.get(utils.prefs);
      const ckey = utils.ckey(prefs['history-mode'], tab.url);

      const v = prefs['history-cache'][ckey];
      if (v && prefs['history-enabled']) {
        await utils.inject(tab.id);
        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          injectImmediately: true,
          files: ['/data/inject/control.js']
        });

        const port = chrome.tabs.connect(tab.id, {
          name: 'highlight'
        });
        port.postMessage({
          method: 'search',
          query: v.query,
          separator: prefs.separator,
          prefs,
          origin: 'background'
        });
      }
    }
  }
  else if (command === 'remove_highlight') {
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    if (tabs.length) {
      const [tab] = tabs;
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        injectImmediately: true,
        files: ['/data/inject/mark.es6.js']
      });
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        func: () => {
          /* global Mark */
          const instance = new Mark(document.body);
          delete window.cache;
          delete window.query;
          delete window.offset;
          delete window.total;
          instance.unmark();
        }
      });
    }
  }
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
