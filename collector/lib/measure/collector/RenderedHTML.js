"use strict";

class RenderedHTML{
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
		this._htmlP = this._webpage.get_rendered_HTML();
	}

	stop(){
		return ;
	}

	async result(){
		const html = await this._htmlP;

		return {
			"renderedHTML": html
		};
	}

	clear(){
		this._htmlP = void 0;
		return ;
	}

	close(){
		this.clear();

		this._webpage = void 0;
	}
}

module.exports = RenderedHTML;
