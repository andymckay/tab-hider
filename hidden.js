let root = document.getElementById("results");

function showTab(event) {
  let id = event.target.parentNode.parentNode.id;
  browser.runtime.sendMessage({tab: parseInt(id)});
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

  let td = document.createElement("td");
  let a = document.createElement("a");
  a.innerText = tab.title;
  a.href = tab.url;

  tr.id = tab.id;

  a.addEventListener("click", showTab);

  td.appendChild(a);
  tr.appendChild(td);
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
