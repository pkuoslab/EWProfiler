"use strict";

const path = require("path");
const fs = require("fs");

class Printer{
	static async saveScript(script, dest){
		let str = JSON.stringify(script);

		return await new Promise((resolve, reject) => {
			fs.writeFile(dest, str, (err) => {
				if (err) reject(err); resolve();
			});
		});
	}

	static async saveResults(results, dest){
		const pcd = []; // proceeding

		if (!fs.existsSync(dest))
			fs.mkdirSync(dest);

		for (let index = 0; index < results.length; ++index){
			const result = results[index];
			let f;
			Object.entries(result).forEach(([key, value]) => {
				switch (key){
					case "screenshotPath":
					case "videoPath":
						f = path.resolve(dest, path.basename(value));
						pcd.push(new Promise((resolve, reject) => {
							fs.copyFile(value, f, (err) => {
								if (err) reject(err); resolve();
							});
						}));
						break;
					case "renderedHTML":
						f = path.resolve(dest, `${key}.html`);
						pcd.push(new Promise((resolve, reject) => {
							fs.writeFile(f, value, (err) => {
								if (err) reject(err); resolve();
							});
						}));
						break;
					case "webpageshot":
						f = path.resolve(dest, "webpageshot.png");
						pcd.push(new Promise((resolve, reject) => {
							fs.writeFile(f, new Buffer(value.data, "base64"), (err) => {
								if (err) reject(err); resolve();
							});
						}));
						break;

					default:
						f = path.resolve(dest, `${key}.json`);
						const data = JSON.stringify(value);
						pcd.push(new Promise((resolve, reject) => {
							fs.writeFile(f, data, (err) => {
								if (err) reject(err); resolve();
							});
						}));
						break;
				}
			});
		}
		await Promise.all(pcd);
	}
}

module.exports = Printer;
