function log(msg) {
  console.log(`[snooze-tabs] ${msg}`);
}

function hide(info, tab) {
  log('Hiding tab');
  browser.tabs.hide(tab.id);
}

browser.menus.create({
  id: "hide-tab",
  title: "Hide this tab",
  icons: {128: "alarm.svg"},
  contexts: ["tab"]
});

browser.menus.onClicked.addListener(hide);

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({"url": "/hidden.html"});
});

function showTab(message) {
  log('Showing tab');
  log(message.tab);
  browser.tabs.show(message.tab);
}

browser.runtime.onMessage.addListener(showTab);