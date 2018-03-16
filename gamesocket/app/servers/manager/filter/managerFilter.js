//var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var dbslave = pomelo.app.get('dbslave');
var dbmaster = pomelo.app.get('dbmaster');
var redis = pomelo.app.get('redis');
var async = require('async');
var GPB = new(require(pomelo.app.getBase()+'/app/consts/Base_Param.js'))();
module.exports = function() {
  return new Filter();
}

var Filter = function() {
};

var bypass = {
    "K":"KickMember",
    "G":"GetMembers",
    "P":"Stop",
    "A":"Add",
    "T":"Transfer",
    "S":"ServerStatus"
}

Filter.prototype.before = function (msg, session, next) {
  	if(msg.route == "manager.managerHandler.K"){
  		if(msg.uid == null){
  			next(new Error('UID Error'),'ID參數錯誤');
  		}else{
  			var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); //放在最後一行
  		}
  	}
    else{
      		var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); //放在最後一行
      	}
    };

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

