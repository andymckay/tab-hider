function log(msg) {
  console.log(`[snooze-tabs] ${msg}`); // eslint-disable-line no-console
}

async function hideTab(id) {
  let res = await browser.tabs.hide(id);
  if (!res.length) {
    log(`Failed to hide tab ${id}`);
    browser.notifications.create(id.toString(), {
      type: "basic",
      title: "Tab hider",
      message: "Failed to hide this tab",
      iconUrl: browser.extension.getURL("/") + "off.svg",
    });
  }
}

async function hide(info, tab) {
  log("Hiding tab");
  let tabId = tab.id;
  if (tab.active === true) {
    let index = tab.index;
    let highestIndex = null;
    // Find a tab to the left.
    browser.tabs.query({windowId: tab.windowId})
      .then(tabs => {
        for (let queryTab of tabs) {
          if (queryTab.hidden === false && queryTab.index < index) {
            highestIndex = queryTab.id;
          }
        }
        if (highestIndex) {
          browser.tabs.update(highestIndex, {active: true})
            .then(_ => hideTab(tabId)); // eslint-disable-line no-unused-vars
        }
      });
  }
  hideTab(tabId);
}

browser.menus.create({
  id: "hide-tab",
  title: "Hide this tab",
  icons: {128: "alarm.svg"},
  contexts: ["tab"]
});

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({"url": "/hidden.html"});
});

function showTab(message) {
  log(`Showing tab: ${message.tab}`);
  browser.tabs.show(message.tab);
}

function listenTab(tabId, changeInfo, tab) {
  if (changeInfo.hidden) {
    browser.runtime.sendMessage({query: "updateTabs", tabId: tab.id, hidden: changeInfo.hidden});
  }
}

browser.menus.onClicked.addListener(hide);
browser.tabs.onUpdated.addListener(listenTab);
browser.runtime.onMessage.addListener(showTab);
