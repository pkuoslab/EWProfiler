"use strict";

const Phone = require("../platform/Phone.js");
const WebPage = require("../platform/WebPage.js");

const events = require("events");
const EventEmitter = events.EventEmitter;

const Log = require("../../logger");

const fs = require("fs");
const Collectors = {
	"ActivityTiming": require("../measure/collector/ActivityTiming.js"),
	"BlockedNetworkListener": require("../measure/collector/BlockedNetworkListener.js"),
	"NetworkListener": require("../measure/collector/NetworkListener.js"),
	"PerformanceTiming": require("../measure/collector/PerformanceTiming.js"),
	"RenderedHTML": require("../measure/collector/RenderedHTML.js"),
	"Webpageshot": require("../measure/collector/Webpageshot.js"),
	"Screenshot": require("../measure/collector/Screenshot.js"),
	"ScreenRecorder": require("../measure/collector/ScreenRecorder.js"),
};

const Auditors = {
	"Har": require("../measure/auditor/Har.js"),
	"SpeedIndex": require("../measure/auditor/SpeedIndex.js"),
	"Raw": require("../measure/auditor/Raw.js")
}

class Client{
	constructor(){
	};

	set phone(_phone){
		this._phone = _phone;
	}

	set webpage(_webpage){
		this._webpage = _webpage;
	}

	set tools(_tools){
		this._tools = _tools;
	}

	schedule(schedule){
		const collectors = schedule.collectors.map((name) => {
			const c = new Collectors[name]();
			c.phone = this._phone;
			c.tools = this._tools;
			return c;
		});
		this._collectors = collectors;

		const auditors = schedule.auditors.map((name) => Auditors[name]);
		this._auditors = auditors;
	}

	async _collect(){
		const collectors = this._collectors;
		await Promise.all(collectors.map((collector) => {
			return collector.afterClick();
		}));

		let pcd;
		if (this._webpage)
			pcd = await this._webpage.proceeding();
		else
			pcd = this._phone.activityProceeding();

		await new Promise((resolve, reject) => {
			pcd.once("onLoad", resolve);
			setTimeout(resolve, 5000);
		});
		pcd.emit("stop");

		const data = await Promise.all(collectors.map(async (collector) => {
			await collector.onLoad();
			await collector.stop();
			const result = await collector.result();
			await collector.clear();
			return result;
		}));

		const artifacts = data.reduce((chain, artifact) => {
			return Object.assign(chain, artifact);
		}, {});
		this._artifacts = artifacts;
	}

	async _audit(){
		const auditors = this._auditors;
		const data = await Promise.all(auditors.map((auditor) => {
			return auditor.audit(this._artifacts);
		}));
		const results = data.reduce((chain, result) => {
			return Object.assign(chain, result);
		}, {});
		this._results = results;
	}

	async beforeClick(){
		const collectors = this._collectors;
		await Promise.all(collectors.map((collector) => {
			return collector.prepare();
		}));
	}

	async afterClick(){
		const collectors = this._collectors;
		collectors.forEach((collector) => {
			collector.webpage = this._webpage;
		});

		await this._collect();
		await this._audit();
		return this._results;
	}

	async beforeReload(){
		const collectors = this._collectors;
		await Promise.all(collectors.map((collector) => {
			collector.webpage = this._webpage;
			return collector.prepare();
		}));
	}

	async afterReload(){
		await this._collect();
		await this._audit();
		return this._results;
	}

	async cancel(){
		const collectors = this._collectors;
		await Promise.all(collectors.map(async (collector) => {
			await collector.stop();
			await collector.clear();
		}));

		this.clear();
	}

	clear(){
		this._collectors = void 0;
		this._auditors = void 0;
		this._artifacts = void 0;
		this._results = void 0;
	}

	close(){
		this.clear();

		this._phone = void 0;
		this._webpage = void 0;
		this._tools = void 0;
	}
}

module.exports = Client;
