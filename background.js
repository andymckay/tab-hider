var tabUsage = new Map();

function log(msg) {
  console.log(`[snooze-tabs] ${msg}`); // eslint-disable-line no-console
}

async function hideTab(id) {
  await browser.tabs.hide(id);
  // TODO: something about tabs you can't hide.
  let tab = await browser.tabs.get(id);
  if (tab.hidden) {
    tabUsage.delete(id.toString());
  } else {
    log(`Failed to hide tab ${id}`);
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
  browser.tabs.show(message.tab)
    .then(_ => { // eslint-disable-line no-unused-vars
      log("Calling tab update");
      browser.tabs.update(message.tab, {active: true});
    });
}

function closeTab(message) {
  log(`Closing tab: ${message.tab}`);
  browser.tabs.remove(message.tab);
}

function actionTab(message) {
  if (message.action === "show") {
    showTab(message);
  }
  if (message.action === "close") {
    closeTab(message);
  }
}

function removedTab(tabId, removeInfo) {
  log(`Tab ${tabId} was removed from usage when removed`);
  tabUsage.delete(tabId);
}

function activatedTab(activeInfo) {
  log(`Tab ${activeInfo.tabId} was used an entered into usage when activated`);
  tabUsage.set(activeInfo.tabId, Date.now());
}

function updatedTab(tabId, changeInfo, tab) {
  if (changeInfo.hidden) {
    browser.runtime.sendMessage({
      query: "updateTabs",
      tabId: tab.id,
      hidden: changeInfo.hidden
    });
  }
}

const MAX_LENGTH = 1000 * 60 * 1;

function sweepTabs(alarmInfo) {
  log(`Sweeping tabs`);
  let now = Date.now();
  for (let key of tabUsage.keys()) {
    let lastUsed = tabUsage.get(key);
    if ((now - lastUsed) > MAX_LENGTH) {
      hideTab(parseInt(key));
      log(`Closing tab ${key}`);
    }
  }
}

browser.alarms.create('sweep', {periodInMinutes: 1});

browser.alarms.onAlarm.addListener(sweepTabs)
browser.menus.onClicked.addListener(hide);
browser.tabs.onActivated.addListener(activatedTab);
browser.tabs.onUpdated.addListener(updatedTab);
browser.tabs.onRemoved.addListener(removedTab);
browser.runtime.onMessage.addListener(actionTab);