"use strict";

"use strict";

const URL = require("url");
const QUERYSTRING = require("querystring");

const someUtils = require("../../util/someUtils.js");
const {isString, isObject, isNumber} = someUtils;

class Resource{
	constructor(res){
		this._res = res;
	}

	static flatten(headers){
		let ret = [];
		for (const [name, value] of Object.entries(headers)){
			ret.push({name, value});
		}
		return ret;
	}

	startedDateTime(){
		let wallTime;
		try {
			wallTime = this._res.requestParams.wallTime;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}

		let ret;
		try {
			ret = new Date(wallTime * 1000).toISOString();
		} catch (err){
			if (err instanceof RangeError)
				return undefined;
			throw err;
		}

		return ret;
	}

	time(){
		let timing;
		let finishedTimestamp;
		try {
			timing = this._res.responseParams.response.timing;
			if (!isObject(timing)) throw new TypeError();
			finishedTimestamp = this._res.finishedTime || this._res.failedTime;
			if (!isNumber(finishedTimestamp)) throw new TypeError();
		} catch (err){
			if (err instanceof TypeError)
				return -1;
			throw err;
		}

		return (finishedTimestamp - timing.requestTime) * 1000;
	}

	request_method(){
		try {
			let ret = this._res.requestParams.request.method;
			if (!isString(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	request_url(){
		try {
			let ret = this._res.requestParams.request.url;
			if (!isString(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	request_httpVersion(){
		try {
			let ret = this._res.responseParams.response.protocol;
			if (!isString(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	request_cookies(){
		return [];
	}

	request_headers(){
		let headers;
		try {
			headers = this._res.responseParams.response.requestHeaders;
			if (!isObject(headers)) throw new TypeError();
		} catch (err) {
			if (err instanceof TypeError){
				try {
					headers = this._res.requestParams.request.headers;
					if (!isObject(headers)) throw new TypeError();
				} catch (err) {
					if (err instanceof TypeError)
						return undefined;
					throw err;
				}
			} else
				throw err;
		}

		let ret = Resource.flatten(headers);
		return ret;
	}

	request_queryString(){
		try {
			let url = this._res.requestParams.request.url;
			let parsed = URL.parse(url, true);
			return parsed.query;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			if (err instanceof URIError)
				return undefined;
			throw err;
		}
	}

	request_headersSize(){
		try {
			let httpVersion = this.request_httpVersion();
			if (httpVersion === undefined) throw new TypeError();
			if (!httpVersion.match(/http\/[01]\.[01]/))
				throw new TypeError();

			let headers = this.request_headers();
			if (headers === undefined) throw new TypeError();

			let method = this.request_method();
			if (method === undefined) throw new TypeError();

			let url = this._res.requestParams.request.url;
			let parsed = URL.parse(url);
			let path = parsed.path;

			let ret = 0;
			ret = method.length + 1 + path.length + 1 + httpVersion.length + 2;
			for (let header of headers)
				ret += header.name.length + 2 + header.value.length + 2;
			ret += 2;

			return ret;
		} catch (err) {
			if (err instanceof TypeError)
				return -1;
			if (err instanceof URIError)
				return -1;
			throw err;
		}
	}

	request_bodySize(){
		try {
			let headers = this.request_headers();
			if (headers === undefined) throw new TypeError();
			let header = headers.find((header) => header.name === "Content-Length");
			if (header === undefined) throw new TypeError();
			let ret = parseInt(header.value, 10);
			if (isNaN(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return -1;
			throw err;
		}
	}

	request_postData(){
		let postData;
		try {
			postData = this._res.requestParams.request.postData;
			if (postData === undefined) return undefined;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}

		let mimeType;
		let params;
		let text = postData;

		let headers = this.request_headers();
		if (headers !== undefined){
			let header = headers.find((header) => header.name === "Content-Type");
			if (header){
				mimeType = header.value;
				if (isString(mimeType)){
					if (mimeType === 'application/x-www-form-urlencoded')
						params = Resource.flatten(QUERYSTRING.parse(postData));
					else
						params = [];
				} else
					mimeType = undefined;
			}
		}

		return {
			mimeType, params, text
		}
	}

	request(){
		let ret = {
			method: this.request_method(),
			url: this.request_url(),
			httpVersion: this.request_httpVersion(),
			cookies: this.request_cookies(),
			headers: this.request_headers(),
            queryString : this.request_queryString(),
            headersSize: this.request_headersSize(),
            bodySize: this.request_bodySize(),
            postData: this.request_postData()
		}
		return ret;
	}

	response_status(){
		try {
			let ret = this._res.responseParams.response.status;
			if (!isNumber(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	response_statusText(){
		try {
			let ret = this._res.responseParams.response.statusText;
			if (!isString(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	response_httpVersion(){
		try {
			let ret = this._res.responseParams.response.protocol;
			if (!isString(ret)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	response_cookies(){
		return [];
	}

	response_headers(){
		try {
			let headers = this._res.responseParams.response.headers;
			if (!isObject(headers)) throw new TypeError();
			let ret = Resource.flatten(headers);
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	response_redirectURL(){
		try {
			let headers = this._res.responseParams.response.headers;
			if (!isObject(headers)) throw new TypeError();
			let ret = headers["Location"];
			if (!(ret instanceof String)) throw new TypeError();
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	response_headersSize(){
		try {
			let httpVersion = this.response_httpVersion();
			if (httpVersion === undefined) throw new TypeError();
			if (!httpVersion.match(/http\/[01]\.[01]/)) throw new TypeError();

			let status = this.response_status();
			if (status === undefined) throw new TypeError();
			let statusText = this.response_statusText();
			if (statusText === undefined) throw new TypeError();

			let headers = this.response_headers();

			let ret = httpVersion.length + 1 + 3 + 1 + statusText.length + 2;
			for (let header of headers)
				ret += header.name.length + 2 + header.value.length + 2;
			ret += 2;

			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return -1;
			throw err;
		}
	}

	response_bodySize(){
		let s = this.response_headersSize();
		if (s === -1)
			return -1;
		else if (this._res.failedTime !== undefined)
			return 0;
		else {
			let ret = this._res.size - s;
			if (isNaN(ret)) ret = -1;
			return ret;
		}
	}

	response_transferSize(){
		if (this._res.failedTime !== undefined){
			return this.response_headersSize();
		} else {
			let ret = this._res.size;
			return ret;
		}
	}

	response_content(){
		let size = this._res.contentSize;
		let mimeType;
		try {
			mimeType = this._res.responseParams.response.mimeType;
			if (!isString(mimeType)) throw new TypeError();
		} catch (err){
			if (err instanceof TypeError)
				mimeType = undefined;
			else
				throw err;
		}

		let compression;
		if (this.response_headersSize() === -1)
			compression = undefined;
		else if (this._res.failedTime !== undefined)
			compression = 0;
		else {
			compression = this._res.contentSize - this.response_bodySize();
		}

		let text = this._res.body;
		let encoding = this._res.isBodyBase64 ? "base64" : undefined;

		let ret = {
			size, mimeType, compression, text, encoding
		}

		return ret;
	}

	response(){
		let ret = {
			status: this.response_status(),
			statusText: this.response_statusText(),
			httpVersion: this.response_httpVersion(),
			cookies: this.response_cookies(),
			headers: this.response_headers(),
            redirectURL: this.response_redirectURL(),
            headersSize: this.response_headersSize(),
            bodySize: this.response_bodySize(),
            _transferSize: this.response_transferSize(),
            content: this.response_content()
		}
		return ret;
	}

	cache(){
		return {};
	}

	timings(){
		let timing;
		try {
			timing = this._res.responseParams.response.timing;
			if (!(typeof timing === "object")) throw new TypeError();
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}

		// compute individual components
		let blocked = timing.dnsStart;
		if (blocked < 0){
			blocked = timing.connectStart;
			if (blocked < 0)
				blocked = timing.sendStart;
		}

		let dns = -1;
		if (timing.dnsStart >= 0) {
			let start = timing.connectStart;
			if (start < 0) start = timing.sendStart;

			dns = start - timing.dnsStart;
		}

		let connect = -1;
		if (timing.connectStart >= 0) {
			connect = timing.sendStart - timing.connectStart;
		}

		let send = timing.sendEnd - timing.sendStart;
		let wait = timing.receiveHeadersEnd - timing.sendEnd;
		let receive = this.time() - timing.receiveHeadersEnd;
		let ssl = -1;
		if (timing.sslStart >= 0 && timing.sslEnd >= 0) {
			ssl = timing.sslEnd - timing.sslStart;
		}

		return {
			blocked, dns, connect, send, wait, receive, ssl
		};
	}

	serverIPAddress(){
		try {
			let ret = this._res.responseParams.response.remoteIPAddress;
			if (!isString(ret)) throw new TypeError();
			ret = ret.replace(/^\[(.*)\]$/, '$1');
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	connection(){
		try {
			let id = this._res.responseParams.response.connectionId;
			let ret = String(id);
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	initiator(){
		try {
			let ret = this._res.requestParams.request.initiator;
			return ret;
		} catch (err){
			if (err instanceof TypeError)
				return undefined;
			throw err;
		}
	}

	priority(){
		let ret = this._res.priority;
		if (ret === undefined){
			try {
				ret = this._res.requestParams.request.initialPriority;
			} catch (err){
				if (err instanceof TypeError)
					return undefined;
				throw err;
			}
		}
		return ret;
	}

	fromCache(){
		let ret;
		if (this._res.servedFromCache)
			ret = "memory";
		else {
			try {
				if (this._res.responseParams.response.fromDiskCache === true)
					ret = "disk";
			} catch (err){
				if (!(err instanceof TypeError))
					throw err;
			}
		}
		return ret;
	}

	entry(){
		let ret = {
			startedDateTime: this.startedDateTime(),
			time: this.time(),
			request: this.request(),
			response: this.response(),
			cache: this.cache(),
			timings: this.timings(),
			serverIPAddress: this.serverIPAddress(),
			connection: this.connection(),
			_initiator: this.initiator(),
			_priority: this.priority(),
			_fromCache: this.fromCache()
		}
		return ret;
	}
}

class Har{
	static _traces2pages(traces){
		let startedTime;
		let title;

		for (let event of traces)
			if (event.method === "Network.requestWillBeSent"){
				let params = event.params;
				if (params.initiator.type === "other"){
					startedTime = params.timestamp * 1000;
					title = params.documentURL;
					break;
				}
			}

		let onContentLoadTime, onLoad;
		if (startedTime !== undefined){
			for (let event of traces){
				if (event.method === "Page.domContentEventFired"){
					let params = event.params;
					onContentLoadTime = params.timestamp * 1000;
				}
				if (event.method === "Page.loadEventFired"){
					let params = event.params;
					onLoad = params.timestamp * 1000;
				}
			}
		}

		let page = {id: "page_0"};
		if (title !== undefined)
			page.title = title;
		if (startedTime !== undefined){
			onContentLoadTime -= startedTime;
			onLoad -= startedTime;

			let pageTimings = {
				onContentLoadTime,
				onLoad
			}
			page.pageTimings = pageTimings;
		};

		return [page];

	}

	static _traces2entries(traces){
		let entries = [];

		let resources = new Map();

		for (let trace of traces){
			let method = trace.method;
			if (method === "Network.requestWillBeSent"){
				let params = trace.params;
				if (params.request.url.startsWith("data:")) continue;

				if (params.redirectResponse){
					let entry = resources.get(params.requestId);
					if (!entry) continue;
					entry.responseParams = {
						response: params.redirectResponse
					}

					entry.finishedTime = params.timestamp;
					entry.size = params.redirectResponse.encodedDataLength;

					let newId = params.requestId + "_redirect_" + params.timestamp;
					resources.set(newId, entry);
					resources.delete(params.requestId);
				}

				let entry = {
					requestParams: params,
					responseParams: undefined,
					contentSize: 0,
					size: undefined,
					finishedTime: undefined,
					failedTime: undefined,
					servedFromCache: undefined,
					body: undefined,
					isBodyBase64: undefined,
					priority: undefined
				};

				resources.set(params.requestId, entry);

			} else if (method === "Network.dataReceived"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.contentSize += params.dataLength;

			} else if (method === "Network.loadingFinished"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.size = params.encodedDataLength;
				entry.finishedTime = params.timestamp;

			} else if (method === "Network.getResponseBody"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.body = params.body;
				entry.isBodyBase64 = params.base64Encoded;

			} else if (method === "Network.loadingFailed"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.failedTime = params.timestamp;

			} else if (method === "Network.requestServedFromCache"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.servedFromCache = true;

			} else if (method === "Network.resourceChangedPriority"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.priority = params.newPriority;
			} else if (method === "Network.responseReceived"){
				let params = trace.params;
				let entry = resources.get(params.requestId);
				if (!entry) continue;

				entry.responseParams = params;
			}
		}

		for (let res of resources.values()){
			let resource = new Resource(res);
			let entry = resource.entry();
			entry.pageref = "page_0";
			entries.push(entry);
		}

		return entries;
	}

	static traces2har(traces){
		let har = {
			log: {
				version: '1.2',
				creator: {
					name: 'Chrome HAR Capturer',
					version: "0.10.3"
				},
				pages: [],
				entries: []
			}
		};

		let log = har.log;
		log.pages = Har._traces2pages(traces)
		log.entries = Har._traces2entries(traces);

		return har;
	}

	static audit(artifacts){
		const traces = artifacts.networkTraces;
		if (traces === void 0) return void 0;
		const har = Har.traces2har(traces);

		return {
			"Har": har
		};
	}
}


module.exports = Har;
