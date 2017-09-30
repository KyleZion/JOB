var pomelo=require('pomelo');
var Code = require('../../../util/code');
var memberDao = require('../../../dao/memberDao');
var backendSessionService = pomelo.app.get('backendSessionService');
var sessionService = pomelo.app.get('sessionService');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};
//===固定==============================================================
var handler = Handler.prototype;
var async=require('async');
var md5 = require('md5');
var redis=pomelo.app.get('redis');
var dbclient=pomelo.app.get('dbclient');
var backendSessionService = pomelo.app.get('backendSessionService');
var sessionService = pomelo.app.get('sessionService');
var connectors = pomelo.app.getServersByType('connector');
var channel = pomelo.app.get('channelService').getChannel('connect',true);

handler.test = function(msg, session, next) {
	//console.log(session.uid);
	//console.log(session.get('memberdata'));
	//console.log(session.frontendId);
	/*backendSessionService.getByUid(session.frontendId,session.uid,function(err,result){
		console.log(result);
	})*/
	var uid = session.uid;
	var sid = session.frontendId;

	console.log('>>>>>>>>>>>>>handler.test:' + msg);

	next(null,{'ErrorCode':0,'ErrorMessage':'test ok'});

};

