"use strict";

const fs = require("fs");

class Scanner{
	static async readScript(file){
		return await new Promise((resolve, reject) => {
			fs.readFile(file, (err, data) => {
				if (err) reject(err);
				let script = JSON.parse(data);
				resolve(script);
			});
		});
	}
};

module.exports = Scanner;
