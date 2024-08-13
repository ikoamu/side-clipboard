import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const provider = new ItemsViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ItemsViewProvider.viewType,
      provider,
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("sideClipboard.addItemFromInputBox", () => {
      provider.addItemFromInputBox();
    }),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

export class ItemsViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  public static readonly viewType = "sideClipboard.itemsView";

  constructor(private readonly extensionUri: vscode.Uri) {}

  public addItemFromInputBox() {
    vscode.env.clipboard.readText().then((text) => {
      if (!this._view) {
        return;
      }

      const input = vscode.window.createInputBox();
      input.placeholder = "New Item";
      input.value = text;
      input.onDidAccept((_) => {
        if (!input.value) {
          return;
        }

        this._view?.webview.postMessage({
          type: "addItem",
          text: input.value,
        });
        input.hide();
      });
      input.show();
    });
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "public", "index.js"),
    );
    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "public", "index.css"),
    );
    const codiconsUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css",
      ),
    );

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "public"),
        vscode.Uri.joinPath(
          this.extensionUri,
          "node_modules",
          "@vscode/codicons",
          "dist",
        ),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      scriptUri,
      styleUri,
      codiconsUri,
    );

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "copyToClipboard":
          this._copyToClipboard(data.text);
          break;
        case "pasteToTerminal":
          this._pasteToTerminal(data.text);
          break;
      }
    });
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    scriptUri: vscode.Uri,
    styleUri: vscode.Uri,
    codiconsUri: vscode.Uri,
  ) {
    const nonce = getNonce();
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${styleUri}">
        <link href="${codiconsUri}" rel="stylesheet" />
      </head>
      <body>
        <input type="text" id="newItem" class="input" placeholder="New Item">
        <ul id="itemList"></ul>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _copyToClipboard(text: string) {
    vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage(`📋Copied to clipboard \"${text}\"`);
  }

  private _pasteToTerminal(text: string) {
    const paste = (t: vscode.Terminal) => {
      t.sendText(text, false);
      t.show();
    };

    const activeTerminal = vscode.window.activeTerminal;
    if (activeTerminal) {
      paste(activeTerminal);
      return;
    }

    const terminals = vscode.window.terminals;
    if (terminals.length) {
      paste(terminals[0]);
    } else {
      paste(vscode.window.createTerminal());
    }
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
