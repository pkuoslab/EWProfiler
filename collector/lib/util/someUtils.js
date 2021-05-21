"use strict";

function isString(val){
	return (typeof val === "string") || (val instanceof String)
}

function isObject(val){
	return val && typeof val === "object" && val.constructor === Object;
}

function isNumber(val){
	return typeof val === "number" && isFinite(val);
}

module.exports = {
	isString,
	isObject,
	isNumber
}
