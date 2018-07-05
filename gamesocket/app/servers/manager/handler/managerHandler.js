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
var GPB = new(require(pomelo.app.getBase()+'/app/consts/Base_Param.js'))();
var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
//===固定==============================================================

handler.GetMembers =function(msg,session,next){
		var keys ;
		var members={};
		async.series({
			A: function(callback){
				redis.keys("GS:USER:*",function(err,res){ 
					if(err==null){
						keys = res;
						callback(null,1);
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
	var sessionService = pomelo.app.get('backendSessionService');
	if(msg.cmdType==1){ //踢出一個玩家
		redis.hget("GS:USER:"+msg.uid,"GAMETYPE",function(err,obj){
			if(err){
				next(new Error('Redis Error'),500);
			}else{
				if(obj=='000' || obj == '0'){
					next(null,{'ErrorCode':601,'ErrorMessage':'該會員不在遊戲中！'});
				}else if(obj==null){
					next(null,{'ErrorCode':602,'ErrorMessage':'該會員不存在！'});
				}else{
					messageService.pushMessageToPlayer({'uid':msg.uid, sid:'connector-server-1'},'onKick',{'message':1});
					sessionService.kickByUid('connector-server-1',msg.uid,function(res){
						console.log(res);
						next(null,{'ErrorCode':600,'ErrorMessage':'已踢出玩家'});
					});
				}
			}
		});
	}else if(msg.cmdType==0 && msg['serverType']!=0){ //踢出該server上所有玩家
		var serverList={'FW':'fruitWheel','DG':'diceBao'}
		var keys;
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
				var serverType = serverList[msg['serverType']];
				async.whilst(
					function () { 
						return i < keys.length; 
					},
					function (wcallback) {
						var key = keys[i];
						var uid = key.substr(8);
						redis.hget(key,'GAMETYPE',function (err, obj) {
							if(obj!='000' && obj==serverType){
								messageService.pushMessageToPlayer({'uid':uid, sid:'connector-server-1'},'onKick',{'message':'KICK000'});
								sessionService.kickByUid('connector-server-1',uid,function(res){
									wcallback();
								});
							}
							else{
								wcallback();
							}
						});
						i++;
					},
					function (err) {
						callback(null,0);
					}
				);
			}
		},
		function(err, results) {
			if(!err){
				next(null,{'ErrorCode':600,'ErrorMessage':'已踢出所有玩家'});
			}else{
				next(null,{'ErrorCode':603,'ErrorMessage':'執行錯誤'});
			}

		});
	}else if(msg.cmdType==0 && msg['serverType']==0){ //踢出電子遊戲所有玩家
		var keys;
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
						var uid = key.substr(8);
						redis.hget(key,'GAMETYPE',function (err, obj) {
							if(obj!='000'){
								messageService.pushMessageToPlayer({'uid':uid, sid:'connector-server-1'},'onKick',{'message':'KICK000'});
								sessionService.kickByUid('connector-server-1',uid,function(res){
									wcallback();
								});
							}
							else{
								wcallback();
							}
						});
						i++;
					},
					function (err) {
						callback(null,0);
					}
				);
			}
		},
		function(err, results) {
			if(!err){
				next(null,{'ErrorCode':600,'ErrorMessage':'已踢出所有玩家'});
			}else{
				next(null,{'ErrorCode':603,'ErrorMessage':'執行錯誤'});
			}
		});
	}else{
		next(null,{'ErrorCode':603,'ErrorMessage':'執行錯誤'});
	}

}

handler.Stop =function(msg,session,next){
	var cp = require('child_process');
	var cmd = "pomelo stop -h 127.0.0.1 -P 3005 "+ msg.ServerID;
	cp.exec(cmd, function(err, stdout, stderr) {
	  //console.warn(stdout);
	  //console.warn(stderr);
	  next(null,{'ErrorCode':0,'ErrorMessage':'Server已下架'});
	});
}

handler.Add =function(msg,session,next){
	var cp = require('child_process');
	var cmd = "pomelo add id="+msg.ServerID+" host=127.0.0.1 port="+msg.Port+" serverType="+msg.ServerType;
	cp.exec(cmd, function(err, stdout, stderr) {
	  //console.warn(stdout);
	  next(null,{'ErrorCode':0,'ErrorMessage':'Server已上架'});
	});
}

handler.ServerStatus = async function(msg,session,next){
	var status = {};
	const serverConfig = await getServerConfig();
	async.series({
		A: function(callback){
			for(var i in serverConfig){
				console.log(serverConfig[i]);
				if(pomelo.app.getServersByType(serverConfig[i]['gc002']).length!=0){
					status[serverConfig[i]['gc001']]=[200,serverConfig[i]['gc002']];
				}else{
					status[serverConfig[i]['gc001']]=[500,serverConfig[i]['gc002']];
				}
			}
			callback(null,0);
		}
	},
		function(err, results){
			next(null,{'ErrorCode':0,'ErrorMessage':'','ServerStatus':status});
		});
}



var Close = function(session){
    var backendSessionService = pomelo.app.get('backendSessionService');
    var connectors = pomelo.app.getServersByType('connector');
    backendSessionService.kickByUid(connectors[0].id,session.uid,function(res){
   		console.log(session.uid+'已從轉帳入口踢出!');
    });
}

async function getServerConfig(){
	const GSC = await new Promise((resolve, reject) =>{
		dbmaster.query('SELECT gc001,gc002,gc007 FROM game_config','',function(data){ 
			if(data.ErrorCode==0){
				resolve(data['rows']); 
			}else{
				reject(null);
			}
		});
	});
	return GSC
}