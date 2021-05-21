"use strict";

const excludingArtifacts = [
//	"videoPath"
];

class Raw{
	static audit(artifacts){
		const ret = {};
		for (const [key, value] of Object.entries(artifacts))
			if (!excludingArtifacts.includes(key))
				ret[key] = value;
		return ret;
	}
}

module.exports = Raw;
