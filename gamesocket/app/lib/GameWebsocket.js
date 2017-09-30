module.exports = function GameWebsocket(port,GPB,GameName,GameShowName)
{
	var clc = require('cli-color');
	var ShowLog = function (itype,Message)
	{
		switch(itype)
		{
			case -1:
				console.log(clc.yellow(Message));
				break;
			case 0:
				//console.log(GameName);
				console.log(Message);
				break;
			case 1:
				console.log(clc.green(Message));
				break;
			case 2:
				console.log(clc.red(Message));
				break;
			
		}
	}
	var express = require('express');
	var app = express();
	var server = require('http').createServer(app);
	server.listen(port, function () {
		ShowLog(-1,'GameWebsocket Server listening at port '+port );
		CheckLogin();
	});
	var io = require('socket.io'); // 加入 Socket.IO
	var serv_io = io.listen(server);
	
		
	serv_io.on('connection', function (socket) {
		Async_Connection(socket);
	});
	function Async_Connection(socket)
	{
		var iasync = require('async');
		iasync.series({
			Init_Redis: function(callback){
				Task1_Init_Redis(callback,socket);
			},
			Init_Socket: function(callback){
				Task2_Init_Socket(callback,socket);
			},
			Init_MemberLogin: function(callback){
				Task3_Init_MemberLogin(callback,socket);
			},
			Init_Timer: function(callback){
				callback(null,0);
			}
		},
		function(err, results) {
		});
	}
	
	function Task1_Init_Redis(callback,socket)
	{
		ShowLog(2,'Task1_Init_Redis');
		var rc = require('../config/GS_Redis_config.js' );
		var redis = require('redis'),
		RDS_PORT = 6379,        //端口号
		RDS_HOST = '60.244.116.180',    //服务器IP
		RDS_OPTS = {},            //设置项
		client = redis.createClient(rc.Port,rc.IP,RDS_OPTS);
		client.select(rc.DBindex);	
		client.on('connect',function(){
			socket.redis = client;
			ShowLog(2,'redis connect');
			callback(null,1);
		});
		client.on('error',function(){
			callback(0,1);
		});		
	}
	function Task2_Init_Socket(callback,socket)
	{
		ShowLog(2,'Task2_Init_Socket');
		socket.Connectime = new Date();
		socket.Stop = 0;
		socket.memberdata==null;
		socket.on('disconnect', function () {
			ShowLog(2,'disconnected');
			if(socket.redis!=null)
				socket.redis.quit();
			GPB.EventEmitter.emit('onDisconnect',socket,socket.Mid);
			
		});
		socket.SendMessage = function (ErrorCode,ErrorMessage,CMD,DATA)
		{
			socket.emit(CMD, {'ErrorCode': ErrorCode,'ErrorMessage': ErrorMessage,'DATA': DATA});
		}
		socket.Alert = function (DATA)
		{
			ShowLog(2,'socket.Alert');
			socket.emit("ALERT", {'ErrorCode': 0,'ErrorMessage': '','DATA': {'message':DATA,'date':(new Date()).getTime()}});
		}
		socket.StopClient = function ()
		{
			if(socket.Stop!=1){
				GPB.EventEmitter.emit('onStop',socket,'');
				socket.Stop = 1;
				socket.Stoptime = new Date();
				socket.SendMessage('0','','KICK',{'date': new Date()});
			}
		}
		socket.SocketClose = function ()
		{
			socket.redis.quit();
			socket.disconnect();
		}
		socket.GetMembderData =function GetMembderData()
		{
			return socket.memberdata;
		}
		socket.GetRedis =function GetRedis(){
			return socket.redis;
		}
		
		callback(null,1);
	}

	function Task3_Init_MemberLogin(callback,socket)
	{
		ShowLog(2,'Task3_Init_MemberLogin');

		socket.Connectime = new Date();
		socket.on('MemberLogin', function (data)
		{
			if(socket.Stop==1 || socket.memberdata!=null || socket.redis ==null){
				return;
			}
			
			var Token = data['Token'];
			ShowLog(2,'MemberLogin :'+Token);
			var iasync = require('async');
			var userdata;
			iasync.series({
				A: function(MLcallback){
					GPB.Web_Redis.hgetall(GPB.rKey_Web_user+Token, function(err,res){
						if(err){
							ShowLog(2,'Error:'+ err);
							socket.StopClient();
							MLcallback(1,0);
						} 
						else{
							if(res==null){
								ShowLog(2,'no data in redis:'+Token);
								socket.StopClient();
								MLcallback(1,0);
							}
							else{
								userdata = res;
								MLcallback(null,0);
							}
						}
					});
				},/*
				B: function(MLcallback){
					socket.redis.hgetall(GPB.rKey_USER+userdata.id, function(err,res){   
						ShowLog(0,"所有玩家參數:");	
						ShowLog(0,res);
						MLcallback(null,0);
					});
				},
				C: function(MLcallback){
					socket.redis.smembers(GPB.rKey_USER_List, function(err,res){  
						ShowLog(0,"所有玩家:"+res);	
						MLcallback(null,0);
					});
				},*/
				D: function(MLcallback){
					socket.redis.sismember(GPB.rKey_USER_List,userdata.id,function(p1,p2){
						if(p2==0){ //
							ShowLog(0,"從來沒有登入過任何遊戲");
							socket.redis.sadd(GPB.rKey_USER_List, userdata.id,socket.redis.print);
							LoginSuccess(socket,userdata,Token);
							MLcallback(1,0);
						}
						else{
							MLcallback(null,0);
						}
					});
				},
				E: function(MLcallback){
					socket.redis.hget(GPB.rKey_USER+userdata.id, "GAMETYPE", function (err, obj) {
						userdata.gamename = obj;
						MLcallback(null,0);
					})
				},
				F: function(MLcallback){
					if(userdata.gamename=="000" ||userdata.gamename=="0" || userdata.gamename==null){
						socket.redis.hget(GPB.rKey_USER+userdata.id, "LOGIN_TIME", function (err, obj) {
							var timeDiff = (Math.abs(new Date() - new Date(obj).getTime()))/1000;
							if(timeDiff>10) //連續登入不能低於10秒
							{
								LoginSuccess(socket,userdata,Token);
								MLcallback(null,0);
							}
							else
							{
								ShowLog(0,"連續登入不能低於10秒");
								socket.Alert("連續登入不能低於10秒");
								MLcallback(null,0);
							}
						});
					}
					else{
						ShowLog(0,"已經在遊戲裡面 原本遊戲需要先斷線 : "+ userdata.gamename);
						socket.redis.hgetall(GPB.rKey_GAMESERVER+ userdata.gamename, function(err,res){  
							if(err==null)
							{
								socket.Alert("已經在遊戲裡面 原本遊戲需要先斷線 : "+ res.GameShowName);
								ShowLog(0,"已經在遊戲裡面 原本遊戲需要先斷線 : "+ res.GameShowName);
							}
							else
							{
								socket.Alert("已經在遊戲裡面 原本遊戲需要先斷線 : ");
								ShowLog(0,"已經在遊戲裡面 原本遊戲需要先斷線 : "+ res.GameShowName);
							}
								
						});
						MLcallback(null,1);
					}
				}
			},function(err, results) {
				
			});
		});
		callback(null,1);
	}

	
	
	//=======================================================================
	prv_StopUserByToken = function(Token)
	{
		prv_GetLoginSocket(function(socket){
			if(socket.Token!=null && socket.Token == Token)
				socket.StopClient();
		});
	}
	prv_StopUserByMid = function (Mid)
	{
		ShowLog(0,'StopUserByMid:'+Mid);
		prv_GetLoginSocket(function(socket){
			if(socket.Mid!=null && socket.Mid == Mid)
				socket.StopClient();
		});
	}
	prv_GetLoginSocket= function(callback)
	{
		Object.keys(serv_io.sockets.sockets).forEach(function(id) {
			var socket = serv_io.sockets.connected[id];
			if(socket.Mid!=null )
			{
				callback(socket);
				//socket.Alert(Message);
			}
		});
	}
	prv_GetAllSocket= function(callback)
	{
		//ShowLog(1,"prv_GetAllSocket : ");
		var keys = Object.keys(serv_io.sockets.sockets);
		//ShowLog(0,keys);
		Object.keys(serv_io.sockets.sockets).forEach(function(id) {
			var socket = serv_io.sockets.connected[id];
			//ShowLog(0,socket.id);
			//ShowLog(1," :socket Stop: "+socket.Stop);
			//ShowLog(1," :socket Mid : "+socket.Mid);
			callback(socket);
		});
	}
	//=======================================================================
	this.StopUserByToken = function(Token)
	{
		prv_StopUserByToken(Token);
	}
	this.StopUserByMid = function (Mid)
	{
		prv_StopUserByMid(Mid);
	}
	this.GetLoginSocket= function(callback)
	{
		prv_GetLoginSocket(callback);
	}
	this.AlertToAll = function(Message){
		//ShowLog(0,'AlertToAll:'+Message);
		prv_GetLoginSocket(function(socket){
			socket.Alert(Message);
		});
	}
	this.SendMessageToAll = function (ErrorCode,ErrorMessage,CMD,DATA)
	{
		//ShowLog(0,'SendMessageToAll:');
		//ShowLog(0,DATA);
		prv_GetLoginSocket(function(socket){
			socket.SendMessage(ErrorCode,ErrorMessage,CMD,DATA);
		});
	}

	function LoginSuccess(socket,res,Token)
	{
		ShowLog(0,"LoginSuccess:"+res.id);
		socket.redis.hset(GPB.rKey_USER+res.id, "GAMETYPE", GameName, socket.redis.print);
		socket.redis.hset(GPB.rKey_USER+res.id, "LOGIN_TIME", new Date(), socket.redis.print);
		socket.memberdata = res;
		socket.Mid = res.id;
		socket.Token = Token;
		socket.Logintime = new Date();
		GPB.todos.forEach( function( name ){
			socket.on(name, function(data) {
					if(socket.Stop!=1 && socket.memberdata!=null)
					{
						GPB.EventEmitter.emit(name,socket,data);
					}
			});
		});
		GPB.EventEmitter.emit('onLogin',socket,'');
		socket.SendMessage('0','','MemberLogin',{'account': socket.memberdata.account});
	}
	function CheckLogin(){
		//ShowLog(1,"CheckLogin : ");
		var nowDT = new Date();
		var iasync = require('async');
		iasync.series({
			A: function(callback){
				//ShowLog(1,"CheckLogin A: ");
				prv_GetAllSocket(function(socket){
					//ShowLog(1,"prv_GetAllSocket C: "+socket.id);
					//ShowLog(0,socket);
					if(socket.memberdata==null)
					{
						var d = new Date(socket.Connectime);
						var seconds = parseInt((nowDT-d)/1000);
						ShowLog(1,"Unlogin : "+seconds);
						if(seconds>60){
							socket.SocketClose();
							ShowLog(1,"Unlogin : x");
						}
					}
					else if(socket.Stop==1)
					{
						var d = new Date(socket.Stoptime);
						var seconds = parseInt((nowDT-d)/1000);
						ShowLog(1,"Stop : "+seconds);
						if(seconds>10){
							socket.SocketClose();
							ShowLog(1,"Stop : x");
						}
					}
				});
				callback(null,0);
			},
			B: function(callback){
				//ShowLog(1,"CheckLogin B: ");
				setTimeout(CheckLogin, 5000);
				callback(null,0);
			}
		},
		function(err,value){
		});
	}
	
}