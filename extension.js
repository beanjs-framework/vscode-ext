// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const serial_wrapper = require("./serial_wrapper");
const beanjs_terminal = require("./beanjs_terminal");

const babel_core = require("@babel/core");
const babel_perset_minify = require("babel-preset-minify")

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.beanjsConnect', function () {
		if (!beanjs_terminal.isOpened()) {
			serial_wrapper.list()
				.then((portInfos) => {
					var serial_infos = [];

					portInfos.forEach(port => {
						serial_infos.push({
							dev: port.comName,
							driver: serial_wrapper
						})
					});

					vscode.window.showQuickPick(serial_infos.map((item) => {
						return item.dev
					})).then((selected) => {
						var sel_port = serial_infos.find((item) => {
							return item.dev == selected
						});
						beanjs_terminal.open(sel_port.dev, sel_port.driver);
					})
				})
		} else {
			beanjs_terminal.show();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.beanjsDownNormal', function () {
		if (!beanjs_terminal.isOpened()) {
			vscode.window.showErrorMessage("Connected Invalid")
		} else {
			var act_doc = vscode.window.activeTextEditor.document;

			if (act_doc.languageId == "javascript") {
				var file_context = act_doc.getText();
				babel_core.transform(file_context, {
					comments: false,
				}, (err, com_result) => {
					beanjs_terminal.down(com_result.code);
				})
			} else {
				vscode.window.showErrorMessage("Javascript File Only");
			}
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.beanjsDownMinify', function () {
		if (!beanjs_terminal.isOpened()) {
			vscode.window.showErrorMessage("Connected Invalid")
		} else {
			var act_doc = vscode.window.activeTextEditor.document;

			if (act_doc.languageId == "javascript") {
				var file_context = act_doc.getText();
				babel_core.transform(file_context, {
					comments: false,
					compact: true,
					minified: true,
					presets: [
						babel_perset_minify
					],
					plugins: [

					]
				}, (err, com_result) => {
					beanjs_terminal.down(com_result.code);
				})
			} else {
				vscode.window.showErrorMessage("Javascript File Only");
			}
		}
	}));

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}