"use strict";

class NetworkListener{
	constructor(){
	}

	set phone(_phone){
		return ;
	}

	set webpage(_webpage){
		this._webpage = _webpage;
	}

	set tools(_tools){
		return ;
	}

	async prepare(){
		const pcd = await this._webpage.enable("Network");
		await this._webpage.clearCache();
		this._pcd = pcd;
		this._traces = [];
		this._gettingBodiesPs = [];

		const callback = (result) => {
			this._traces.push(result);
			if (result.method === "Network.loadingFinished"){
				let p = this._webpage.getResponseBody(result.params.requestId);
				p = p.then((params) => {
					params.requestId = result.params.requestId;
					return {
						method: "Network.getResponseBody",
						params: params
					};
				}).catch((err) => {
					return void 0;
				});
				this._gettingBodiesPs.push(p);
			}
		};

		pcd.on("event", callback);
		pcd.once("stop", () => {
			pcd.removeListener("event", callback);
		});
	}

	afterClick(){
		return ;
	}

	onLoad(){
		this._waitAfterOnLoadP = new Promise((resolve) => {
			setTimeout(resolve, 5000)
		});
		return ;
	}

	async stop(){
		this._pcd.emit("stop");
	}

	async result(){
		await this._waitAfterOnLoadP;
		this._pcd.emit("stop");
		this._bodies = await Promise.all(this._gettingBodiesPs);

		const firstEventIndex = this._traces.findIndex((event) => {
			return event.method === "Network.requestWillBeSent"
				&& event.params.initiator.type === "other";
		});
		if (firstEventIndex === void 0){
			Log.error("NetworkListener", "No initiator request found.");
			throw new Error();
		}
		this._traces.splice(0, firstEventIndex);

		this._bodies = this._bodies.filter(body => body !== void 0);
		this._traces = this._traces.concat(this._bodies);

		return {
			"networkTraces": this._traces
		};
	}

	clear(){
		this._waitAfterOnLoadP = void 0;
		this._gettingBodiesPs = void 0;
		this._pcd = void 0;
		this._traces = void 0;
		this._bodies = void 0;
	}

	close(){
		this.clear();

		this._webpage = void 0;
	}
}

module.exports = NetworkListener;
