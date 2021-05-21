"use strict";

const events = require("events");
const EventEmitter = events.EventEmitter;

const Log = require("../../logger");

const DEFAULT = {
	start:{
		timeout: 500
	},

	events2input: {
		swipe_threshold: 1000
	},
};

function sqr_euclid_distance(P, Q){
	function sqr(x){return x * x};

	return sqr(P.x - Q.x) + sqr(P.y - Q.y);
}

class Input{
	constructor(args){
		this._phone = args.phone;
	}

	async connect(){
		let info = await this._phone.get_touch_dev_info({plain_text: true});
		let {device, name, events} = info;
		this._device = device;
		this._name = name;

		let max_position = {};
		for (let event of events){
			if (event.name === "ABS_MT_POSITION_X")
				max_position.x = event.max;
			if (event.name === "ABS_MT_POSITION_Y")
				max_position.y = event.max;
		}
		this._max_position = max_position;

		info = await this._phone.get_touch_dev_info({plain_text: false});
		let unlabeled = info.events;

		if (events.length !== unlabeled.length){
			Log.error("InputRecorder", "Device event format error.");
			throw new Error();
		}

		let code2name = new Map();
		events.forEach((event, i) => {
			let code = unlabeled[i].name;
			code2name.set(code, event.name);
		});
		code2name.set(0, "SYN_REPORT");
		this._code2name = code2name;

		let resolution = await this._phone.get_resolution();
		this._resolution = resolution;
	}

	santize(events){
		for (let i = 0; i < events.length; ++i){
			let name = this._code2name.get(events[i].code);
			if (name === void 0)
				throw new Error("Unidentified event code.");
			events[i].name = name;
		};

		let ret = [];
		for (let i = 0, j; i < events.length; i = j){
			for (j = i+1; j < events.length; ++j)
				if (events[j].name === "ABS_MT_TRACKING_ID")
					break;

			let empty = true;
			for (let k = i; k < j; ++k){
				let name = events[k].name;
				if (name === "ABS_MT_POSITION_X"){
					empty = false;
				} else if (name === "ABS_MT_POSITION_Y"){
					empty = false;
				}
			}

			if (empty)
				continue;

			if (ret.length > 0)
				throw new Error("Too many inputs");

			for (let k = i; k < j; ++k)
				ret.push(events[k]);
		}

		return ret;
	}

	events2input(events){
		let input = {};
		try {
			events = this.santize(events);

			let slot_id = void 0;
			let x, y;
			let from = void 0, to = void 0;
			let startTime = void 0, endTime = void 0;

			let unknown = false;

			for (let event of events){
				let name = event.name;
				if (name === "ABS_MT_TRACKING_ID"){
					// empty by design
				} else if (name === "ABS_MT_SLOT"){
					if (slot_id){
						unknown = true; break;
					}
					slot_id = event.value;
				} else if (name === "ABS_MT_POSITION_X"){
					x = event.value;
				} else if (name === "ABS_MT_POSITION_Y"){
					y = event.value;
				} else if (name === "SYN_REPORT"){
					if (x === void 0 || y === void 0)
						continue;

					if (from === void 0){
						from = {x, y};
						startTime = event.sec * 1000 + event.usec / 1000;
					} else {
						to = {x, y};
						endTime = event.sec * 1000 + event.usec / 1000;
					}
				}
			}

			let {width, height} = this._resolution;
			let max_position = this._max_position;
			if (from !== void 0){
				from.x = Math.round(width * from.x / max_position.x);
				from.y = Math.round(height * from.y / max_position.y);
			};
			if (to !== void 0){
				to.x = Math.round(width * to.x / max_position.x);
				to.y = Math.round(height * to.y / max_position.y);
			};

			if (unknown || from === void 0){
				input.type = "unknown";
			} else if (to === void 0 || sqr_euclid_distance(from, to) < DEFAULT.events2input.swipe_threshold){
				input.type = "tap";
				input.location = from;
				input.startTime = startTime;
			} else {
				input.type = "swipe";
				input.from = from;
				input.to = to;
				input.duration = Math.round(endTime - startTime);
				input.startTime = startTime;
			}
		} catch (err){
			Log.error("InputRecorder", err.message);
			input.type = "unknown";
		}
		return input;
	}

	record(){
		let event_pcd = this._phone.getevent({device: this._device});
		let input_pcd = new EventEmitter();
		let cut = null;
		let events = [];

		const callback = (event) => {
			if (cut !== null) clearTimeout(cut);
			events.push(event);
			cut = setTimeout(() => {
				let input = this.events2input(events);
				events = [];
				switch (input.type){
					case "tap":
						Log.verbose("InputRecorder", `input: tap <${input.location.x}, ${input.location.y}>`);
						break;
					case "swipe":
						Log.verbose("InputRecorder", `input: swipe <${input.from.x}, ${input.from.y}> <${input.to.x}, ${input.to.y}> ${input.duration}`);
						break;
					case "unknown":
					default:
						Log.error("InputRecorder", "Unknown input recorded. Aborting.");
						break;
				}

				input_pcd.emit("input", input);
			}, DEFAULT.start.timeout);
		};
		event_pcd.on("event", callback);

		event_pcd.once("close", () => {
			input_pcd.emit("close");
		});

		input_pcd.once("stop", () => {
			event_pcd.removeListener("event", callback);
			event_pcd.emit("stop");
		})

		return input_pcd;
	}

	async replay(input){
		switch (input.type){
			case "tap":
				Log.verbose("InputReplayer", `input: tap <${input.location.x}, ${input.location.y}>`);
				break;
			case "swipe":
				Log.verbose("InputReplayer", `input: swipe <${input.from.x}, ${input.from.y}> <${input.to.x}, ${input.to.y}> ${input.duration}`);
				break;
			case "unknown":
			default:
				Log.error("Controller", "Unknown input recorded. Aborting.");
				break;
		}
		await this._phone.input(input);
	}

	close(){
		this._phone = void 0;
	}
}

module.exports = Input;
