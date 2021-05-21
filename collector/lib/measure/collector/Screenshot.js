"use strict";

class Screenshot{
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
		return ;
	}

	afterClick(){
		return ;
	}

	onLoad(){
		this._pictureP = (async () => {
			await this._phone.save_screenshot(Screenshot.remotePath);
			await this._phone.pull(Screenshot.remotePath, Screenshot.localPath);
		})();
		return ;
	}

	stop(){
	}

	async result(){
		await this._pictureP;

		return {
			screenshotPath: Screenshot.localPath
		};
	}

	clear(){
		this._pictureP = void 0;
	}

	close(){
		this.clear();

		this._phone = void 0;
	}
}

Screenshot.remotePath = "/sdcard/screenshot.png";
Screenshot.localPath = "/tmp/screenshot.png";

module.exports = Screenshot;
