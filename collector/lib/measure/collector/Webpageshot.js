"use strict";

class Screenshot{
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

	prepare(){
		return ;
	}

	afterClick(){
		return ;
	}

	onLoad(){
		this._pictureP = this._webpage.get_webpageshot();
		return ;
	}

	stop(){
		return ;
	}

	async result(){
		const pic = await this._pictureP;
		return {
			webpageshot: pic
		};
	}

	clear(){
		this._pictureP = void 0;
	}

	close(){
		this.clear();

		this._webpage = void 0;
	}
}

module.exports = Screenshot;
