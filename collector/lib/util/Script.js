"use strict";

const fs = require("fs");

class Script{
	static generate(args){
		let {serial, inputs, conds} = args;

		let script = {serial};
		let actions = [];
		if (inputs.length !== conds.length){
			Log.warn("Script.generate", `inputs length ${inputs.length} is not equal to conds length ${conds.length}`);
		}
		let n = inputs.length;
		for (let i = 0; i < n; ++i){
			let action = {};
			action.id = "action_" + i;

			let input = {};
			input.type = inputs[i].type;
			switch (input.type){
				case "tap":
					input.location = inputs[i].location;
					break;
				case "swipe":
					input.from = inputs[i].from;
					input.to = inputs[i].to;
					input.duration = inputs[i].duration;
					break;
			}
			action.input = input;

			if (i < n-1){
				action.time = inputs[i+1].startTime - inputs[i].startTime;
			} else {
				action.time = 6000;
			}

			action.postCondition = conds[i];
			action.passes = [];

			actions.push(action);
		}

		script.actions = actions;
		return script;
	}
}

module.exports = Script;
