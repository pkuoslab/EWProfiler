"use strict";

const path = require("path");

const pSpawn = require("../../util/pSpawn");

class SpeedIndex{
	static async audit(artifacts){
		const {videoPath} = artifacts;

		const metricsJSON = await pSpawn("python2", [
			path.resolve(__dirname, "visualmetrics", "visualmetrics.py"),
			"--video", videoPath,
			"--json"
		]);

		const metrics = JSON.parse(metricsJSON);

		return {
			"SpeedIndex": metrics
		}
	}
}

module.exports = SpeedIndex;
