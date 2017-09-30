var pomelo=require('pomelo');

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

	// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>");

	// var param = {
	// 	msg: "message",
	// 	from: "from",
	// 	target: "target"
	// };

	// channel.pushMessage('onChat',param);

	// if( !! channel) {
	// 	channel.add(uid, sid);
	// }


	// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>");
	// users = channel.getMembers();
	// console.log(users);

	// channel.leave(uid, sid);
	
  	next(null, {code: 200, msg: 'this is game server One.'});

};

