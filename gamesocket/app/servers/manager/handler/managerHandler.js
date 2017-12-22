var pomelo=require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};
//===固定==============================================================
var handler = Handler.prototype;
var redis=pomelo.app.get('redis');
var dbmaster=pomelo.app.get('dbmaster');
var dbslave=pomelo.app.get('dbslave');
var async=require('async');
var messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
var sessionService = pomelo.app.get('sessionService');
//var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
//===固定==============================================================

handler.GetMembers =function(msg,session,next){
		var keys ;
		var members={};
		async.series({
			A: function(callback){
				redis.keys("GS:USER:*",function(err,res){ 
					if(err==null){
						keys = res;
						callback(null,res);
					}
					else
						callback(1,err);
				});
			},
			B: function(callback){
				var i = 0;
				async.whilst(
					function () { 
						return i < keys.length; 
					},
					function (wcallback) {
						var key = keys[i];
						redis.hget(key, "GAMETYPE", function (err, obj) {
							redis.hget(key, "ACCOUNT", function (p1, Acc) {
								members[Acc]=obj
								wcallback();
							});
						});
						i++;
					},
					function (err) {
						callback(null,0);
					}
				);
			}
		},
		function(err, results){
			next(err,members);
		});
}

handler.KickMember =function(msg,session,next){
	redis.hget("GS:USER:"+msg.uid,"GAMETYPE",function(err,obj){
		if(err){
			next(new Error('Redis Error'),500);
		}else{
			if(obj=='000' || obj == '0'){
				next(null,{'ErrorCode':601,'ErrorMessage':'該會員不在遊戲中！'});
			}else if(obj==null){
				next(null,{'ErrorCode':602,'ErrorMessage':'該會員不存在！'});
			}else{
				var sessionService = pomelo.app.get('backendSessionService');
				messageService.pushMessageToPlayer({'uid':msg.uid, sid:'connector-server-1'},'onKick',{'message':1});
				sessionService.kickByUid('connector-server-1',msg.uid,function(res){
					console.log(res);
					next(null,{'ErrorCode':600,'ErrorMessage':'已踢出玩家'});
				});
			}
		}
	});
	
}


