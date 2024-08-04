import * as vscode from 'vscode';
import { ItemViewProvider } from './ItemViewProvider';

export function activate(context: vscode.ExtensionContext) {


	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'sideClipboardView',
			new ItemViewProvider(context.extensionUri)
		),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
