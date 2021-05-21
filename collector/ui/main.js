"use strict";

const Controller = require("../lib/Controller.js");
const Log = require("../logger");

const program = require("commander");


async function run(){
	program
		.option("-t, --type <number>", "", parseInt)
		.option("-o, --output <path>", "", _ => _ || "out")
		.parse(process.argv);


	const controller = new Controller();
	const options = {
		type: program.type,
		output: program.output
	};

	await controller.start(options);
	Log.verbose("main", "Finish to start controller.");
}

Log.setLevel("verbose")
run();
