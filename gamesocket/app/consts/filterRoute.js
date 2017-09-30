'use strict';
var async = require('async');
// 路徑定義
module.exports.passRoute = function(route,callback){
	var bypass ={
		ceC:'connector.entryHandler.Connect',
		ceM:"connector.entryHandler.MemberLogin",
		ceMo:"connector.entryHandler.MemberLogout",
		fwB:"fruitWheel.fruitWheelHandler.bet",
		fwG:"fruitWheel.fruitWheelHandler.GetGameID",	
		fwM:"fruitWheel.fruitWheelHandler.GetMoney",
		fwT:"fruitWheel.fruitWheelHandler.GetTimeZone",
		fwH:"fruitWheel.fruitWheelHandler.GetHistory",
		fwS:"fruitWheel.fruitWheelHandler.GetStatus",
		fwGB:"fruitWheel.fruitWheelHandler.GetBetTotal",
	}
	switch(route){
		case 'ceC':
			callback(bypass.ceC);
			break;
		case 'ceM':
			callback(bypass.ceM);
			break;
		case 'ceMo':
			callback(bypass.ceMo);
			break;
		case 'fwB':
			callback(bypass.fwB);
			break;
		case 'fwG':
			callback(bypass.fwG);
			break;
		case 'fwM':
			callback(bypass.fwM);
			break;
		case 'fwT':
			callback(bypass.fwT);
			break;
		case 'fwH':
			callback(bypass.fwH);
			break;
		case 'fwS':
			callback(bypass.fwS);
			break;
		case 'fwGB':
			callback(bypass.fwGB);
			break;
		default:
			callback(null);
	}
}

