"use strict";

const os = require("os");
const http = require("http");
const net = require("net");
const url = require("url");
const events = require("events");
const EventEmitter = events.EventEmitter;

const Log = require("../../../logger");

class Proxy{
	constructor(options){
		if (options === undefined) options = {};

		this._options = options;
		this._shouldIntercept = false;
		this._forwards = [];

		this._proxy = http.createServer();
		this._proxy
		.on("connect", (cReq, cSocket) => {
			let parsed = url.parse("http://" + cReq.url);
			Log.verbose("Proxy", "Request received.");

			let forward = function (){
				let sSocket = net.connect(parsed.port, parsed.hostname, () => {
					cSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
					sSocket.pipe(cSocket);
				});

				sSocket
					.on("error", (err) => {
						Log.error("Proxy", err.message);
						cSocket.end();
					});

				cSocket.pipe(sSocket);
			};

			if (this._shouldIntercept)
				this._forwards.push(forward);
			else
				forward();
		})
		.on("error", (err) => {
			Log.error("Proxy", err.message);
		});
	}

	start(){
		let options = this._options;
		if (options.ip_address === undefined){
			let iface = undefined;
			let nifs = os.networkInterfaces();
			for (let drv in nifs){
				if (drv === "lo") continue;

				iface = nifs[drv].find(({family}) => {
					//if (family !== "IPv4") return false;
					return true;
				});

				if (iface !== undefined)
					break;
			}
			if (iface === undefined)
				throw new Error("No network interface found.");

			options.ip_address = iface.address;
		}

		if (options.tcp_port === undefined)
			options.tcp_port = 7979;

		Log.verbose("Proxy", "proxy listen on " + options.ip_address + ":" + options.tcp_port);
		this._proxy.listen(options.tcp_port, options.ip_address);
	}

	intercept(){
		Log.verbose("Proxy", "proxy intercept");
		this._shouldIntercept = true;
	}

	release(){
		Log.verbose("Proxy", "proxy release");
		this._shouldIntercept = false;
		for (let f of this._forwards) f();
		this._forwards = [];
	}

	close(){
		Log.verbose("Proxy", "proxy close");
		this._proxy.close();
	}
}

module.exports = Proxy;
