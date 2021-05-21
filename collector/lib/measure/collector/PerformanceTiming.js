"use strict";

class PerformanceTiming{
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

	async onLoad(){
		this._timingP = this._webpage.get_performance_timing();
	}

	stop(){
		return ;
	}

	async result(){
		const timing = await this._timingP;
		return {
			"performanceTiming": timing
		};
	}

	clear(){
		this._timingP = void 0;
	}

	close(){
		this.clear();

		this._webpage = void 0;
	}
}

module.exports = PerformanceTiming;
