"use strict";

class ScreenRecorder{
	constructor(){

	}

	set phone(_phone){
		this._phone = _phone;
	}

	set webpage(_webpage){
		return ;
	}

	set tools(_tools){
		return ;
	}

	prepare(){
		const pcd = this._phone.screenrecord(ScreenRecorder.remotePath);
		this._pcd = pcd;
		return ;
	}

	afterClick(){
		return ;
	}

	onLoad(){
		this._pcd.emit("stop");
		this._videoP = (async () => {
			await new Promise((resolve) => setTimeout(resolve, 15000));
			await this._phone.pull(ScreenRecorder.remotePath, ScreenRecorder.localPath);
		})();
	}

	stop(){
		this._pcd.emit("stop");
	}

	async result(){
		await this._videoP;

		return {
			videoPath: ScreenRecorder.localPath
		};
	}

	clear(){
		this._pcd = void 0;
		this._videoP = void 0;
	}
}

ScreenRecorder.remotePath = "/sdcard/screenrecord.mp4";
ScreenRecorder.localPath = "/tmp/screenrecord.mp4";

module.exports = ScreenRecorder;
