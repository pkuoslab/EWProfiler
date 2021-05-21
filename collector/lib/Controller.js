"use strict";

const path = require("path");
const fs = require("fs");
const events = require("events");
const EventEmitter = events.EventEmitter;

const express = require("express");

const Phone = require("./platform/Phone.js");
const WebPage = require("./platform/WebPage.js");

const Network = require("./tool/Network.js");

const Client = require("./tool/Client.js");
const Printer = require("./util/printer.js");

const Log = require("../logger");

const DEFAULT = {
	pass: [{
		activity: [{
			collectors: ["ActivityTiming", "ScreenRecorder", "Screenshot"],
			auditors: ["Raw", "SpeedIndex"]
		}],
		webview: [{
			collectors: ["PerformanceTiming", "ScreenRecorder", "RenderedHTML", "Screenshot", "Webpageshot"],
			auditors: ["Raw", "SpeedIndex"]
		}, {
			collectors: ["NetworkListener"],
			auditors: ["Har"]
		}],
	}, {
		activity: [{
			collectors: [],
			auditors: []
		}],
		webview: [{
			collectors: ["BlockedNetworkListener"],
			auditors: ["Har"]
		}]
	}],

	passMetrics: [{
		activity: ["ActivityTiming", "Screenshot", "SpeedIndex"],
		webview: ["PerformanceTiming", "RenderedHTML", "Webpageshot", "Screenshot", "SpeedIndex", "ReloadHar"]
	}, {
		activity: [],
		webview: ["Har"]
	}]
};

class Controller{
	constructor(){
	}

	async connect(options){
		if (options === void 0) options = {};
		this._phone = await Phone.device(options);
	}

	async start(options){
		if (options === void 0) options = {};

		let phone;
		if (options.serial)
			phone = new Phone(options.serial);
		else
			phone = await Phone.device();
		this._phone = phone;

		const {type} = options;
		const outputRoot = options.output;

		const nc = new Network({phone: this._phone});
		nc.proxyStart();

		const client = new Client();
		client.phone = this._phone;
		client.tools = {
			network: nc
		};

		const DEFAULTPASS = DEFAULT.pass[type];
		const DEFAULTPASSMETRICS = DEFAULT.passMetrics[type];

		const cmd = new EventEmitter();
		const app = express();

		let req, res;
		app.get("/beforeClick", (_req, _res) => {
			req = _req; res = _res;
			cmd.emit("beforeClick");
		});
		app.get("/afterClick", (_req, _res) => {
			req = _req, res = _res;
			cmd.emit("afterClick");
		});
		app.listen(9292, () => {
		});

		Log.verbose("Controller", "Server started.");

		while (true){
			const results = [];
			const meta = {};
			meta.browseId = options.type;

			// before click
			await new Promise((resolve) => {
				cmd.once("beforeClick", resolve);
			});
			Log.verbose("Controller", "/beforeClick command received.");

			let hasWebview;
			let passes;
			try {
				hasWebview = req.query.hasWebview === "true";
				meta.hasWebview = hasWebview;

				passes = hasWebview ? DEFAULTPASS.webview : DEFAULTPASS.activity;
				meta.metrics = hasWebview ? DEFAULTPASSMETRICS.webview : DEFAULTPASSMETRICS.activity;

				client.schedule(passes[0]);

				await client.beforeClick();

				Log.verbose("Controller", "/beforeClick command finish.");
				res.json({message: "finish"});
			} catch (err){
				Log.error("Controller", err.message);
				res.json({message: "error"});
				continue;
			}

			// after click
			await new Promise((resolve) => {
				cmd.once("afterClick", resolve);
			});
			Log.verbose("Controller", "/afterClick command received.");

			let webpage;
			try {
				if (hasWebview){
					const url = await this._phone.get_active_debugger_url();
					webpage = new WebPage(url);
					await webpage.connect();
					client.webpage = webpage;
					meta.url = await webpage.get_url();
				}

				const focusOn = await this._phone.get_focus_on();
				meta.appName = focusOn.app;
				meta.activityName = focusOn.activity;

				let result = await client.afterClick();
				if (Object.keys(result).length > 0)
					results.push(result);

				for (let i = 1; i < passes.length; ++i){
					const pass = passes[i];
					client.schedule(pass);

					await client.beforeReload();
					Log.verbose("Controller", "reload");
					await webpage.reload();

					Log.verbose("Controller", "afterReload");
					result = await client.afterReload();
					if (Object.keys(result).length > 0)
						results.push(result);
				}

				if (hasWebview){
					webpage.close();
				}

				await Controller.saveResultsAndMetadata(outputRoot, results, meta)

				Log.verbose("Controller", "/afterClick command finish.");
				res.json({message: "finish"});
			} catch (err){
				Log.error("Controller", err.message);
				res.json({message: "error"});
			}
		}

		Log.verbose("Controller", "start finished.");
	}

	static async saveResultsAndMetadata(outputRoot, results, meta){
		if (results.length === 0) return ;
		if (!fs.existsSync(outputRoot)) fs.mkdirSync(outputRoot);
		const outputApp = path.resolve(outputRoot, meta.appName);
		delete meta.appName;
		if (!fs.existsSync(outputApp)) fs.mkdirSync(outputApp);

		const dirList = fs.readdirSync(outputApp)
			.map(value => parseInt(value))
			.filter(value => !isNaN(value) && value >= 0)
			.sort((x, y) => x - y);

		let dirIndex = dirList.findIndex((value, index) => value != index);
		if (dirIndex === -1) dirIndex = dirList.length;
		const outputDir = path.resolve(outputApp, dirIndex.toString());

		Log.verbose("Controller", `Saving results to ${outputDir}`);
		await Printer.saveResults(results, outputDir);

		const metaDataPath = path.resolve(outputApp, "metadata.json");
		let metas = {};
		if (fs.existsSync(metaDataPath)){
			try {
				metas = JSON.parse(fs.readFileSync(metaDataPath));
			} catch (err){
			}
		};

		metas[dirIndex] = meta;
		fs.writeFileSync(metaDataPath, JSON.stringify(metas, void 0, 1));
	}
}

module.exports = Controller;
