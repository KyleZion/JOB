var pomelo=require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};
//===固定==============================================================
const handler = Handler.prototype;
const GPB = new(require(pomelo.app.getBase()+'/app/consts/Base_Param.js'))();
const redis=pomelo.app.get('redis');
const async=require('async');
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const dbmaster=pomelo.app.get('dbmaster');
//===固定==============================================================


handler.Transfer = function(msg,session,next){
	next(null,{'ErrorCode':0,'ErrorMessage':'转出成功已扣除电子游戏帐户！','Newbalance':5000});
} 

handler.Test = function(msg,session,next){
	this.app.rpc.manager.managerRemote.transMoney(session,msg,session.uid,function(err,data) {
		next(null,data);
		Close(session);
	});
}

var Close = function(session){
    var backendSessionService = pomelo.app.get('backendSessionService');
    var connectors = pomelo.app.getServersByType('connector');
    backendSessionService.kickByUid(connectors[0].id,session.uid,function(res){
   		console.log(session.uid+'已從轉帳入口踢出!');
    });
}