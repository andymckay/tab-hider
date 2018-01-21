let root = document.getElementById('results');

function showTab(event) {
  browser.runtime.sendMessage({tab: parseInt(event.target.id)});
  let row = document.getElementById(event.target.id)
  row.parentNode.removeChild(row);
  event.preventDefault();
}

function addTab(tab) {
  let tr = document.createElement('tr');

  let td = document.createElement('td');
  let a = document.createElement('a');
  a.innerText = tab.title;
  a.href = tab.url;
  a.id = tab.id;

  a.addEventListener('click', showTab);

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
  })
}

listTabs();