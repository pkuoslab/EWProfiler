"use strict";

class ActivityTiming{
	constructor(){
	}

	set phone(_phone){
		this._phone = _phone;
	}

	set webpage(_webpage){
		return ;
	}

	set tools(_tools){
		return ;
	}

	async prepare(){
		const timing = {};
		this._timing = timing;
		this._reportFullyDrawnMs = void 0;

		await this._phone.clearLogcat();

		const amPcd = this._phone.logcat("ActivityManager:I");
		this._amPcd = amPcd;

		const amCallback = ({message}) => {
			const pattern =
				  "^"
				+ "Fully drawn "
				+ "([\\w\\.]+)/([\\w\\.]+)"
				+ "\\:"
				+ "\\s+"
				+ "\\+(\\d+)ms"
				+ "\\s*"
				+ "$";

			const matched = message.match(new RegExp(pattern, "m"));
			if (matched === null) return ;

			const app = matched[1];
			const activity = app + matched[2];
			const value = parseInt(matched[3], 10);
			if (isNaN(value)) return ;

			this._reportFullyDrawnMs = value;
		};

		amPcd.on("log", amCallback);
		amPcd.once("stop", () => {
			amPcd.removeListener("log", amCallback);
		});

		const timingPcd = this._phone.logcat("ActivityTiming:V");
		this._timingPcd = timingPcd;

		const tmCallback = ({message}) => {
			try {
				message = JSON.parse(message);
			} catch (err){
				return ;
			}

			Object.assign(timing, message);
		};
		timingPcd.on("log", tmCallback);
		timingPcd.once("stop", () => {
			timingPcd.removeListener("log", tmCallback);
		});

		return ;
	}

	afterClick(){
		return ;
	}

	onLoad(){
		return ;
	}

	stop(){
		this._amPcd.emit("stop");
		this._timingPcd.emit("stop");
	}

	result(){
		const activityBirth = this._timing["beforeOnCreate"] - this._reportFullyDrawnMs;

		const relativeTiming = {};
		Object.entries(this._timing).forEach((pair) => {
			relativeTiming[pair[0]] = pair[1] - activityBirth;
		});

		return {
			"ActivityTiming": relativeTiming
		};
	}

	clear(){
		this._amPcd = void 0;
		this._timingPcd = void 0;
		this._timing = void 0;
		this._reportFullyDrawnMs = void 0;
	}

	close(){
		this.clear();

		this._phone = void 0;
	}
}

module.exports = ActivityTiming;
