let root = document.getElementById("results");

function showTab(event) {
  let id = event.target.parentNode.parentNode.id;
  browser.runtime.sendMessage({tab: parseInt(id), action: "show"});
  removeTab(id);
  event.preventDefault();
}

function closeTab(event) {
  let id = event.target.parentNode.parentNode.id;
  browser.runtime.sendMessage({tab: parseInt(id), action: "close"});
  removeTab(id);
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

  let tdClose = document.createElement("td");
  let aClose = document.createElement("a");
  aClose.innerText = "x";
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

browser.runtime.onMessage.addListener(updateTabs);
listTabs();
