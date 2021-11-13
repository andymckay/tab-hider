var tabUsage = new Map();

function log(msg) {
  console.log(`[snooze-tabs] ${msg}`); // eslint-disable-line no-console
}

async function hideTab(id) {
  let tab = null;
  try {
    tab = await browser.tabs.get(id);
  } catch(e) {
    console.error(e);
    return;
  }
  if (tab.url.startsWith('about:') || tab.url.startsWith('moz-extension:')) {
    log(`Closing tab: ${id}`);
    browser.tabs.remove(id)
  }
  await browser.tabs.hide(id);
  // TODO: something about tabs you can't hide.
  tab = await browser.tabs.get(id);
  if (!tab.hidden) {
    log(`Failed to hide tab ${id}`);
  }
  updateCount();
}

async function updateCount() {
  let k = 0;
  browser.tabs.query({})
    .then(tabs => {
      for (let tab of tabs) {
        if (tab.hidden) {
          k++;
        }
      }
      browser.browserAction.setBadgeText({text: k.toString()});
    });
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
      browser.tabs.update(message.tab, {active: true})
      .then(_ => { // eslint-disable-line no-unused-vars
        updateCount();
      })
    });
}

function closeHiddenTab(message) {
  let tabId = message.tab;
  browser.tabs.get(tabId)
    .then(tab => {
      if (!tab.active && tab.hidden) {
        log(`Closing tab: ${tab.id}`);
        browser.tabs.remove(tab.id)
        .then(_ => { // eslint-disable-line no-unused-vars
          updateCount();
        })
      }
    })

}

function discardTab(message) {
  log(`Discarding tab: ${message.tab}`);
  browser.tabs.discard(message.tab);
}

function actionTab(message) {
  if (message.action === "show") {
    showTab(message);
  }
  if (message.action === "close") {
    closeHiddenTab(message);
  }
  if (message.action === "discard") {
    discardTab(message);
  }
}

function removedTab(tabId, removeInfo) { // eslint-disable-line no-unused-vars
  log(`Tab ${tabId} is no longer tracked because it was removed`);
  tabUsage.delete(tabId);
  updateCount();
}

function activatedTab(activeInfo) {
  log(`Tab ${activeInfo.tabId} was tracked because it was activated`);
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

async function sweepTabs(alarmInfo) { // eslint-disable-line no-unused-vars
  let config = await browser.storage.local.get();
  await sweepHideTabs(config);
  await sweepCloseTabs(config);
}

async function sweepHideTabs(config) {
  if (!config.enable || config.enable !== "yes") {
    log("Hiding tabs not enabled in config");
    return;
  }
  log("Sweeping tabs to hide");
  let now = Date.now();
  let interval = parseInt(config.interval ? config.interval : 15);
  let MAX_LENGTH = 1000 * 60 * interval;
  log(`Max length is ${MAX_LENGTH}`);
  for (let key of tabUsage.keys()) {
    let lastUsed = tabUsage.get(key);
    if ((now - lastUsed) > MAX_LENGTH) {
      hideTab(key);
      log(`Hiding tab ${key}`);
    } 
  }
}

async function sweepCloseTabs(config) {
  if (!config.enableClose || config.enableClose !== "yes") {
    log("Closing tabs not enabled in config");
    return;
  }
  log("Sweeping tabs to close");
  let now = Date.now();
  let interval = parseInt(config.intervalClose ? config.intervalClose : 60); // minutes
  let MAX_LENGTH = 1000 * 60 * interval;
  log(`Max length is ${MAX_LENGTH}`);
  for (let key of tabUsage.keys()) {
    let lastUsed = tabUsage.get(key);
    if ((now - lastUsed) > MAX_LENGTH) {
      closeHiddenTab({tab: key});
    }
  }
}

browser.alarms.create("count", {periodInMinutes: 1});
browser.alarms.onAlarm.addListener(sweepTabs);
browser.menus.onClicked.addListener(hide);
browser.tabs.onActivated.addListener(activatedTab);
browser.tabs.onUpdated.addListener(updatedTab);
browser.tabs.onRemoved.addListener(removedTab);
browser.runtime.onMessage.addListener(actionTab);
