//'use strict';

//var GameName="";
var co = require('co');
var thunkify = require('thunkify');
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var Base_Param = require('../../../consts/Base_Param.js');
var GPB = new Base_Param();
var sessions=[];
var iasync = require('async');
var sessionService = pomelo.app.get('sessionService');
//var channel = pomelo.app.get('channelService').getChannel('connect',true);
var messageService = require('../../../services/messageService.js');
var gameDao = require('../../../dao/gameDao');
var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
/////////////////////////////////////////////////////////////////////

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};
 
var redis=pomelo.app.get('redis');
/**
 * New client entry.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */


Handler.prototype.Connect = function (msg, session, next) {
	Async_Connection(session);
	next(null,{'ErrorCode':0,'ErrorMessage':'Connnect!'});
};

function Async_Connection(session){
	
	iasync.series({
		/*Init_Redis: function(callback){
			Task1_Init_Redis(callback,socket);
		},*/
		Init_Session: function(callback){
			Task2_Init_Session(callback,session);
		}
		/*Init_MemberLogin: function(callback){
			Task3_Init_MemberLogin(callback,socket);
		},*/ //放入handle.MemberLogin
		/*Init_Timer: function(callback){
			callback(null,0);
		}*/
	},
	function(err, results) {
		console.log(results);
	});
}

Handler.prototype.MemberLogout = function(msg,session,next){
	Close(session);
	next(null,{'ErrorCode':0,'ErrorMessage':'已踢出'});
}
Handler.prototype.MemberLogin = function(msg,session,next){
	var Token = msg.Token;
	var GameName = msg.GameType;
	var gameCode = GameTypeToGameCode(GameName);
	var iasync = require('async');
	var userdata;
	var uid = null;
		iasync.series({
			S:function(MLcallback){
				redis.SMEMBERS(GPB.rKey_GAMESERVER_LIST, function(err,res){
					if(err){
						GPB.ShowLog(2,'Error:'+ err);
						MLcallback(1,0);
					} 
					else{
						if(res==null){ 
							logger.error('GameType ERROR'+GameName+'no data in redis:');
							MLcallback(1,'网路连线异常');
						}
						else{
							if(res.indexOf(GameName) > -1){
								MLcallback(null,0);
							}
							else{
								logger.error('GameType ERROR'+GameName);
								MLcallback(1,'type error');
							}
						}
					}
				});
			},
			T: function(MLcallback){
				if(pomelo.app.getServersByType(GameName).length==0){
					MLcallback(1,'伺服器维护中，请稍后再试')
				}else{
					MLcallback(null,0);
				}
			},
			U: function(MLcallback){
				if(GameName=='transfer'){
					MLcallback(null,0);
				}else{
					redis.hget("GS:LOBBY:GAMESTATUS:LOBBY_GAME_STATUS",gameCode,function(err,obj){
						if(err){
							MLcallback(1,'伺服器维护中，请稍后再试');
						}else{
							if(obj=='0'){
								MLcallback(null,0);
							}else{
								MLcallback(1,'伺服器维护中，请稍后再试');
							}
						}
					});
				}
				
			},
			A: function(MLcallback){
				redis.hgetall(GPB.rKey_Web_user+Token, function(err,res){
					if(err){
						GPB.ShowLog(2,'Error:'+ err);
						StopClient(session);
						MLcallback(1,0);
					} 
					else{
						if(res==null){ //是否判斷res.id ?
							logger.error('Token not Exits'+ Token);
							GPB.ShowLog(2,'no data in redis:'+Token);
							StopClient(session);
							MLcallback(1,'网路连线异常');
						}
						else{
							userdata = res;
							uid=res.id;
							//測試用
							/*if(uid!='62685' && GameName=='diceBao'){
								MLcallback(1,'伺服器维护中，请稍后再试');
							}else{
								MLcallback(null,0);
							}*/
							//-------
							MLcallback(null,0);
						}
					}
				});
			},
			/*
			B: function(MLcallback){
				session.redis.hgetall(GPB.rKey_USER+userdata.id, function(err,res){   
					ShowLog(0,"所有玩家參數:");	
					ShowLog(0,res);
					MLcallback(null,0);
				});
			},
			C: function(MLcallback){
				session.redis.smembers(GPB.rKey_USER_List, function(err,res){  
					ShowLog(0,"所有玩家:"+res);	
					MLcallback(null,0);
				});
			},*/
			D: function(MLcallback){
				redis.sismember(GPB.rKey_USER_List,userdata.id,function(p1,p2){
					if(p2==0){ //
						GPB.ShowLog(0,"從來沒有登入過任何遊戲");
						redis.sadd(GPB.rKey_USER_List, userdata.id,redis.print);
						//LoginSuccess(session,userdata,Token,GameName);
						MLcallback(null,0);
					}
					else{
						MLcallback(null,userdata.id);
					}
				});
			},
			/*D: function(MLcallback){
				redis.HEXISTS(GPB.rKey_USER_List,userdata.id,function(p1,p2){
					if(p2==0){ //
						GPB.ShowLog(0,"從來沒有登入過任何遊戲");
						redis.hset(GPB.rKey_USER_List, userdata.id,'000');
						//LoginSuccess(session,userdata,Token,GameName);
						MLcallback(null,0);
					}
					else{
						MLcallback(null,userdata.id);
					}
				});
			},*/
			E: function(MLcallback){
				redis.hget(GPB.rKey_USER+userdata.id, "GAMETYPE", function (err, obj) {
					userdata.gamename = obj;
					MLcallback(null,0);
				})
			},
			F: function(MLcallback){
				if(userdata.gamename=="000" ||userdata.gamename=="0" || userdata.gamename==null){
					redis.hget(GPB.rKey_USER+userdata.id, "LOGIN_TIME", function (err, obj) {
						var timeDiff = (Math.abs(new Date() - new Date(obj).getTime()))/1000;
						if(timeDiff>10) //連續登入不能低於10秒
						{
							//bind uid
							var self = this;
							if (!uid) {
							    return next(null, {ErrorCode: 1 });
							}
							var onDo = function* () { //匿名generator函數
							    // 踢掉用户
							    yield thunkify(sessionService.kick)(uid);

							    // session绑定uid
							    yield thunkify(session.bind).bind(session)(uid);

							    // 连接断开时的处理
							    session.on('closed', onUserLeave.bind(self, self.app));

							    // session同步，在改变session之后需要同步，以后的请求处理中就可以获取最新session
							    yield thunkify(session.pushAll).bind(session)();
						        LoginSuccess(session,userdata,Token,GameName);
							    };
						    var onError = function (err) {
						        //console.error(err);
								MLcallback(1,err);
							};
							co(onDo).catch(onError);    
							MLcallback(null,0);
						}
						else
						{
							GPB.ShowLog(0,"转帐后或退出游戏后请稍后10秒再进行动作！");
							MLcallback(1,"请稍后10秒再进行动作！");
						}
					});
				}
				else{
					GPB.ShowLog(0,"请先退出目前游戏："+ userdata.gamename +"，再进行下一步动作");
					redis.hgetall(GPB.rKey_GAMESERVER+ userdata.gamename, function(err,res){  
						if(err==null)
						{
							//session.Alert("已經在遊戲裡面 原本遊戲需要先斷線 : "+ res.GameShowName);
							GPB.ShowLog(0,"请先退出目前游戏："+res.GameShowName+"，再进行下一步动作");
							MLcallback(1,"请先退出目前游戏："+res.GameShowName+"，再进行下一步动作");
						}
						else
						{
							GPB.ShowLog(0,"请先退出目前游戏："+res.GameShowName+"，再进行下一步动作");
							MLcallback(1,"请先退出目前游戏："+res.GameShowName+"，再进行下一步动作");
						}
					});
					
				}
			}
		},function(err, results) {
			if(!!err)
			{		
				if(results.S!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.S});
					Close(session);
				}else if(results.T!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.T});
					Close(session);
				}else if(results.U!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.U});
					Close(session);
				}else if(results.A!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.A});
					Close(session);
				}else if(results.F!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.F});
					Close(session);
				}				
			}else{
				//channel.add(uid,session.frontendId)
				/*var a=sessionService.getClientAddressBySessionId(session.id);
				console.log('getClient!!!');*/
				if(gameCode==52){
					next(null,{'ErrorCode':0,'ErrorMessage':'','userdata':userdata,'param':{'limit':["100-50000","50-10000","10-1000"],'channel':[111,222,333]}});
				}else{
					next(null,{'ErrorCode':0,'ErrorMessage':'','userdata':userdata});
				}
			}
		});
}

Handler.prototype.CSLogin = function(msg,session,next){
	var Token = msg.Token;
	//var GameName= msg.GameType;
	var iasync = require('async');
	var userdata;
	var uid = null;
		iasync.series({
			A: function(MLcallback){
				redis.hgetall("CS:User:"+Token, function(err,res){
					if(err){
						GPB.ShowLog(2,'Error:'+ err);
						StopClient(session);
						MLcallback(1,0);
					} 
					else{
						if(res==null){ //是否判斷res.id ?
							logger.error('Token not Exits'+ Token);
							GPB.ShowLog(2,'no data in redis:'+Token);
							StopClient(session);
							MLcallback(1,'网路连线异常');
						}
						else{
							userdata = res;
							uid=res.id;
							MLcallback(null,0);
						}
					}
				});
			},
			D: function(MLcallback){
				redis.sismember("GS:ADMINLIST:",uid,function(p1,p2){
					if(p2==0){ //
						GPB.ShowLog(0,"未登入過後台ADMIN");
						redis.sadd("GS:ADMINLIST:", uid);
						MLcallback(null,0);
					}
					else{
						MLcallback(null,uid);
					}
				});
			},
			E: function(MLcallback){
				redis.hget("GS:GAMESERVER:manager", "USERID", function (err, obj) {
					redis.hget("GS:GAMESERVER:manager", "USER_NAME", function (err, uname) {
						userdata.userID = obj;
						userdata.userName = uname;
						MLcallback(null,0);
					});
				});
			},
			F: function(MLcallback){
				if(userdata.userID=="000" ||userdata.userID=="0" || userdata.userID==null){
					redis.hset("GS:GAMESERVER:manager","USERID",uid);
					//bind uid
					var self = this;
						if (!uid) {
						    return next(null, {
						    ErrorCode: 1 
						    });
						}
						var onDo = function* () {
						    // 踢掉用户
						    yield thunkify(sessionService.kick)(uid);

						    // session绑定uid
						    yield thunkify(session.bind).bind(session)(uid);

						    // 连接断开时的处理
						    session.on('closed', onAdminLeave.bind(self, self.app));

						    // session同步，在改变session之后需要同步，以后的请求处理中就可以获取最新session
						    yield thunkify(session.pushAll).bind(session)();
					        CSLoginSuccess(session,userdata,Token);
						    };
					    var onError = function (err) {
					        console.error(err);
							MLcallback(1,err);
						};
						co(onDo).catch(onError);
						MLcallback(null,0);
				}
				else{
					if(uid==userdata.userID){
						GPB.ShowLog(0,"重複登入功能:"+ userdata.userName);
						MLcallback(1,"請勿重複登入");
					}else{
						GPB.ShowLog(0,"已有相關人員正在使用>>>:"+ userdata.userName);
						MLcallback(1,userdata.userName+"正在使用此功能！");
					}
				}
			}
		},function(err, results) {
			if(!!err)
			{		
				if(results.A!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.A});
					Close(session);
				}else if(results.F!=0){
					next(null,{'ErrorCode':1,'ErrorMessage':results.F});
					Close(session);
				}				
			}else{
				next(null,{'ErrorCode':0,'ErrorMessage':'','userdata':userdata});
			}
		});
}

function LoginSuccess(session,res,Token,GameName)
	{
		GPB.ShowLog(0,"LoginSuccess:"+res.id);
			redis.hset(GPB.rKey_USER+res.id, "ACCOUNT",  res.account);
			redis.hset(GPB.rKey_USER+res.id, "GAMETYPE", GameName, redis.print);
			redis.hset(GPB.rKey_USER+res.id, "LOGIN_TIME", PUB.formatDate()+" "+PUB.formatDateTime());
			//redis.hset(GPB.rKey_USER+session.uid, "TRANS_TIME", new Date());
			//redis.hset(GPB.rKey_USER+res.id, "CASH",results.getMoney);
			session.set("memberdata",res);
			session.set("Mid" , res.id);
			session.set("Token",Token);
			//session.set("Cash",results.getMoney)
			session.set("Logintime", new Date());
			//session.set('sessionRedis',redis);
			session.pushAll();
			
		/*iasync.series({
			getMoney: function(callback_1){
			gameDao.getMoney(res.id, callback_1);
		}
		},
		function(err, results) {
			GPB.ShowLog(0,"LoginSuccess:"+res.id);
			redis.hset(GPB.rKey_USER+res.id, "GAMETYPE", GameName, redis.print);
			redis.hset(GPB.rKey_USER+res.id, "LOGIN_TIME", new Date(), redis.print);
			//redis.hset(GPB.rKey_USER+res.id, "CASH",results.getMoney);
			session.set("memberdata",res);
			session.set("Mid" , res.id);
			session.set("Token",Token);
			//session.set("Cash",results.getMoney)
			session.set("Logintime", new Date());
			//session.set('sessionRedis',redis);
			session.pushAll();
		});*/
		
		/*
		GPB.todos.forEach( function( name ){
			session.on(name, function(data) {
					if(session.Stop!=1 && session.memberdata!=null)
					{
						GPB.EventEmitter.emit(name,session,data);
					}
			});
		});
		GPB.EventEmitter.emit('onLogin',session,'');
		session.SendMessage('0','','MemberLogin',{'account': session.memberdata.account});*/
}

function CSLoginSuccess(session,res,Token)
{
	GPB.ShowLog(0,res.name+"登入管理功能");
	redis.hset("GS:GAMESERVER:manager", "USER_NAME", res.name);
	redis.hset("GS:GAMESERVER:manager", "LOGIN_TIME", PUB.formatDate()+" "+PUB.formatDateTime());
	session.set("memberdata",res);
	session.set("Mid" , res.id);
	session.set("Token",Token);
	session.set("Logintime", new Date());
	session.pushAll();
}

function Task2_Init_Session(callback,session)
{
	GPB.ShowLog(2,'Task2_Init_Session');
	session.set("Connectime",new Date());
	session.set("Stop",0);
	session.set("memberdata",null);
/*		session.on('disconnect', function () {
		ShowLog(2,'disconnected');
		if(socket.redis!=null)
			socket.redis.quit();
		GPB.EventEmitter.emit('onDisconnect',socket,socket.Mid);
		
	});*/
	/*session.SendMessage = function (ErrorCode,ErrorMessage,CMD,DATA)
	{
		socket.emit(CMD, {'ErrorCode': ErrorCode,'ErrorMessage': ErrorMessage,'DATA': DATA});
	}*/
	/*socket.Alert = function (DATA)
	{
		ShowLog(2,'socket.Alert');
		socket.emit("ALERT", {'ErrorCode': 0,'ErrorMessage': '','DATA': {'message':DATA,'date':(new Date()).getTime()}});
	}*/
/*		session.StopClient = function ()
	{
		console.log(session);
		if(session.Stop!=1){
			//GPB.EventEmitter.emit('onStop',socket,'');
			session.Stop = 1;
			session.Stoptime = new Date();
			//session.SendMessage('0','','KICK',{'date': new Date()});
		}
	}
	session.Close = function ()
	{
		//redis.quit();
		sessionService.kickBySessionId(session.id,function(res){
		console.log(session.id);
		console.log('kick Success');
		});
	}
	
	session.GetRedis =function GetRedis(){
		return session.get('redis');
	}*/
	/*session.set('GetMemberData') =function GetMemberData()
	{
		return session.get('memberdata');
	}*/
	session.pushAll();
	callback(null,'Task2_success');
}

	// 登入斷線後處理
	var onUserLeave = function (app, session) {
	    if (!session || !session.uid) {
	        return;
	    }//登出方法修正
	    redis.hget(GPB.rKey_USER+session.uid, "GAMETYPE", function (err, obj) {
			//GPB.ShowLog(0,'Game onDisconnect GameName ::::'+obj);
			redis.hget(GPB.rKey_GAMESERVER+obj,'GameName',function(err,gamename){
				if(obj!=null && obj== gamename){
					redis.hset(GPB.rKey_USER+session.uid, "GAMETYPE", "000", function(err,value){
						redis.hset(GPB.rKey_USER_List, session.uid,"000");
					});
				}
			});
		});
	    console.log(session.uid + '斷線');
	};
	var onAdminLeave = function (app, session) {
	    if (!session || !session.uid) {
	        return;
	    }
	    redis.hget("GS:GAMESERVER:manager", "USERID", function (err, obj) {
			redis.hget("GS:GAMESERVER:manager", "USER_NAME",function(err,username){
				redis.hset("GS:GAMESERVER:manager", "USERID", "000");
				redis.hset("GS:GAMESERVER:manager", "USER_NAME","000" );
				redis.hset("GS:GAMESERVER:manager", "LAST_USERID", obj);
				redis.hset("GS:GAMESERVER:manager", "LAST_USER_NAME", username);
			});
		});
	    console.log(session.uid + '斷線');
	};

	var StopClient = function(session){
        if(session.get('Stop')!=1){
            //GPB.EventEmitter.emit('onStop',socket,'');
            session.set('Stop', 1);
            session.set('Stoptime',new Date());
            session.pushAll();
            //session.SendMessage('0','','KICK',{'date': new Date()});
        }
    }

	var Close = function(session){
        //redis.quit();
        sessionService.kickBySessionId(session.id,function(res){
        //sessionService.sendMessage(session.id,'onKick');
        console.log('kick Success');
        });
    }
	
function GameTypeToGameCode(type){
	switch(type){
		case "fruitWheel":
			return 51;
			break;
		case "diceBao":
			return 52;
			break;
	}
}