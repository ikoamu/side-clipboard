const vscode = acquireVsCodeApi();

let items = [];

function addItem() {
  const input = document.getElementById("newItem");
  const text = input.value.trim();
  if (text) {
    vscode.postMessage({ type: "addItem", text: text });
    input.value = "";
  }
}

function deleteItem(id) {
  vscode.postMessage({ type: "deleteItem", id: id });
}

function copyToClipboard(text) {
  vscode.postMessage({ type: "copyToClipboard", text });
}

function pasteToTerminal(text) {
  vscode.postMessage({ type: "pasteToTerminal", text });
}

function updateItems() {
  const list = document.getElementById("itemList");
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.text}</span>
      <button onclick="copyToClipboard('${item.text}')">copy</button>
      <button onclick="pasteToTerminal('${item.text}')">paste</button>
      <button onclick="deleteItem('${item.id}')">Delete</button>`;
    list.appendChild(li);
  });
}

window.addEventListener("message", (event) => {
  const message = event.data;
  switch (message.type) {
    case "updateItems":
      items = message.items;
      updateItems();
      break;
  }
});

vscode.postMessage({ type: "getItems" });
