"use strict";

const Log = require("../../logger");

class Condition{
	constructor(args){
		this._phone = args.phone;
	}

	async record(){
		const {app, activity} = await this._phone.get_focus_on();
		let url = void 0;
		try {
			url = await this._phone.get_active_debugger_url();
		} catch (err){
		};

		// structure hash?

		return {
			"app": app,
			"activity": activity,
			"hasWebview": (url !== void 0)
		}
	}

	async check(cond){
		const {app, activity} = await this._phone.get_focus_on();

		if (cond.app !== void 0 && app !== cond.app){
			throw new Error("App names are inconsistent.");
		}

		if (cond.activity !== void 0 && activity !== cond.activity){
			throw new Error("Activity names are inconsistent.");
		}

		let url = void 0;
		try {
			url = await this._phone.get_active_debugger_url();
		} catch (err){
		};
		let hasWebview = (url !== void 0);

		if (cond.hasWebview !== void 0 && hasWebview !== cond.hasWebview){
			throw new Error("Conditions diverge on whether there is an active Webview.");
		}

		return ;
	}

	close(){
		this._phone = null;
	}
}

module.exports = Condition;
