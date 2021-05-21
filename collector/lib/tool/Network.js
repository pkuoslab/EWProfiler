"use strict";

const Proxy = require("./network/Proxy.js");

class Network{
	constructor(_phone){
		this._phone = _phone;
	}

	set phone(_phone){
		this._phone = _phone;
	}

	proxyStart(){
		this._proxy = new Proxy();
		this._proxy.start();
	}

	proxyIntercept(){
		this._proxy.intercept();
	}

	proxyRelease(){
		this._proxy.release();
	}

	proxyClose(){
		this._proxy.close();
		this._proxy = void 0;
	}
}

module.exports = Network;
