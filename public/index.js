(function () {
  const vscode = acquireVsCodeApi();
  const previousState = vscode.getState();

  let items = previousState?.items ?? [];
  document.getElementById("newItem").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const input = document.getElementById("newItem");
      const text = input.value.trim();
      addItem(text);
      input.value = "";
    }
  });

  function addItem(text) {
    if (!text) {
      return;
    }

    items.push({ id: Date.now().toString(), text });
    vscode.setState({ items });
    updateItems();
  }

  function deleteItem(id) {
    items = items.filter((item) => item.id !== id);
    vscode.setState({ items });
    updateItems();
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

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("trash-button");
      deleteButton.innerHTML = `<i class="codicon codicon-close"></i>`;
      deleteButton.addEventListener("click", () => deleteItem(item.id));
      li.appendChild(deleteButton);

      const codeBlockContainer = document.createElement("div");
      codeBlockContainer.classList.add("side-clipboard-code-block-container");

      const codeBlock = document.createElement("div");
      codeBlock.classList.add("side-clipboard-code-block");
      codeBlock.textContent = item.text;
      codeBlockContainer.appendChild(codeBlock);

      const actionButtonsContainer = document.createElement("div");
      actionButtonsContainer.classList.add("action-buttons-container");

      const copyButton = document.createElement("button");
      copyButton.classList.add("action-button");
      copyButton.innerHTML = `<i class="codicon codicon-copy"></i>`;
      copyButton.addEventListener("click", () => copyToClipboard(item.text));
      actionButtonsContainer.appendChild(copyButton);

      const pasteButton = document.createElement("button");
      pasteButton.classList.add("action-button");
      pasteButton.innerHTML = `<i class="codicon codicon-terminal"></i>`;
      pasteButton.addEventListener("click", () => pasteToTerminal(item.text));
      actionButtonsContainer.appendChild(pasteButton);
      codeBlockContainer.appendChild(actionButtonsContainer);
      li.appendChild(codeBlockContainer);

      list.appendChild(li);
    });
  }

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "addItem": {
        console.log("addItem", message.text);
        addItem(message.text);
        break;
      }
    }
  });

  updateItems();
})();
