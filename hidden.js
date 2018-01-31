let root = document.getElementById("results");
let button = document.querySelectorAll("button")[0];

function getId(event) {
  return event.target.parentNode.parentNode.id;
}

function sendMessage(tabId, action) {
  browser.runtime.sendMessage({tab: parseInt(tabId), action: action});
}

function showTab(event) {
  let id = getId(event);
  sendMessage(id, "show");
  removeTab(id);
  event.preventDefault();
}

function closeTab(event) {
  let id = getId(event);
  sendMessage(id, "close");
  removeTab(id);
  event.preventDefault();
}

function discardTab(event) {
  sendMessage(getId(event), "discard");
  event.preventDefault();
}

function removeTab(id) {
  let row = document.getElementById(id.toString());
  if (row) {
    row.parentNode.removeChild(row);
  }
}

function addTab(tab) {
  let tr = document.createElement("tr");
  tr.id = tab.id;

  let tdIcon = document.createElement("td");
  let imgIcon = document.createElement("img");
  if (tab.favIconUrl && tab.favIconUrl.startsWith("http")) {
    imgIcon.src = tab.favIconUrl;
  }
  tdIcon.appendChild(imgIcon);
  tr.appendChild(tdIcon);

  let td = document.createElement("td");
  let a = document.createElement("a");
  a.innerText = tab.title;
  a.href = tab.url;
  a.addEventListener("click", showTab);
  td.appendChild(a);
  tr.appendChild(td);

  let tdDiscard = document.createElement("td");
  let aDiscard = document.createElement("a");
  aDiscard.innerText = "Discard";
  aDiscard.href = "#";
  aDiscard.addEventListener("click", discardTab);
  tdDiscard.appendChild(aDiscard);
  tr.appendChild(tdDiscard);

  let tdClose = document.createElement("td");
  let aClose = document.createElement("a");
  aClose.innerText = "Close";
  aClose.href = "#";
  aClose.addEventListener("click", closeTab);
  tdClose.appendChild(aClose);
  tr.appendChild(tdClose);

  root.appendChild(tr);
}

function listTabs() {
  browser.tabs.query({})
    .then(tabs => {
      for (let tab of tabs) {
        if (tab.hidden === true) {
          addTab(tab);
        }
      }
    });
}

function updateTabs(message) {
  let tabId = message.tabId;
  let hidden = message.hidden;

  if (hidden) {
    removeTab(tabId);
  }
  browser.tabs.get(tabId)
    .then(tab => addTab(tab));
}


async function processForm(event) {
  event.preventDefault();

  function revertButton() {
    button.innerText = "Update";
    button.className = "btn btn-primary";
  }
  let config = await browser.storage.local.get();
  config.enable = document.getElementById("enable").value;
  config.interval = parseInt(document.getElementById("interval").value);

  config.enableClose = document.getElementById("enableClose").value;
  config.intervalClose = parseInt(document.getElementById("intervalClose").value);
  await browser.storage.local.set(config);

  button.innerText = "Saved";
  button.className = "btn btn-success";
  window.setTimeout(revertButton, 1000);
}

browser.runtime.onMessage.addListener(updateTabs);

async function setupPage() {
  listTabs();
  let config = await browser.storage.local.get();
  document.getElementById("enable").value = config.enable ? "yes" : "no";
  document.getElementById("interval").value = config.interval ? config.interval : "15";

  document.getElementById("enableClose").value = config.enableClose ? "yes" : "no";
  document.getElementById("intervalClose").value = 
    config.intervalClose ? config.intervalClose : "60"; // 60 minutes

  button.disabled = false;
  button.addEventListener("click", processForm);
}

setupPage();
