import * as vscode from 'vscode';

interface Item {
    id: string;
    text: string;
}

export class ItemViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _items: Item[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      // localResourceRoots: [this._extensionUri]
    };
        
    const scriptUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "public", "index.js")
    );
    const styleUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "public", "index.css")
    );

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, scriptUri, styleUri);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'addItem':
          this._addItem(data.text);
          break;
        case 'deleteItem':
          this._deleteItem(data.id);
          break;
        case 'getItems':
          this._updateWebview();
          break;
        case 'copyToClipboard':
          this._copyToClipboard(data.text);
          break;
        case 'pasteToTerminal':
          this._pasteToTerminal(data.text);
          break;
        }
      });
    }

    private _getHtmlForWebview(webview: vscode.Webview, scriptUri: vscode.Uri, styleUri: vscode.Uri) {
      return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TODO List</title>
        <link rel="stylesheet" href="${styleUri}">
      </head>
      <body>
        <input type="text" id="newItem" placeholder="New TODO">
        <button onclick="addItem()">Add</button>
        <ul id="itemList"></ul>
        <script src="${scriptUri}" />
      </body>
      </html>`;
    }

    private _addItem(text: string) {
        const item: Item = {
            id: Date.now().toString(),
            text: text
        };
        this._items.push(item);
        this._updateWebview();
    }

    private _deleteItem(id: string) {
        this._items = this._items.filter(todo => todo.id !== id);
        this._updateWebview();
    }

    private _updateWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateItems',
                items: this._items
            });
        }
    }

    private _copyToClipboard(text: string) {
      vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage(`📋Copied to clipboard \`${text}\``);
    }

    private _pasteToTerminal(text: string) {
      // vscode.window.activeTerminal?.sendText(text);
      const activeTerminal = vscode.window.activeTerminal;
      if (activeTerminal) {
        activeTerminal.sendText(text, false);
        activeTerminal.show();
      } else {
        vscode.window.showInformationMessage('No active terminal found');
      }
    }
}
