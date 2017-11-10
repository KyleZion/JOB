module.exports = function GameProc_Base(weport,GameName,GameShowName)
{
	this.GPB = this;
	
	this.rKey_Web_user = "user:";
	this.rKey_TITLE = "GS:";
	this.rKey_GAMESERVER =this.rKey_TITLE + "GAMESERVER:";
	this.rKey_GAMESERVER_LIST = this.rKey_GAMESERVER + "List:";
	this.rKey_USER = this.rKey_TITLE + "USER:";
	this.rKey_USER_List = this.rKey_TITLE + "USERLIST:";
	this.rKey_CMD_ALERT =  this.rKey_TITLE + "CMD:ALERT:";
	this.rKey_CMD_KILL =  this.rKey_TITLE + "CMD:KILL:";
	
	var iasync = require('async');
	var clc = require('cli-color');
	this.ShowLog = function (itype,Message)
	{
		switch(itype)
		{
			case -1:
				console.log(clc.yellow(Message));
				break;
			case 0:
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
	this.ShowLog(-1,'GameProc_Base');
	var redis = require('redis');
		
	this.ievents = require('events');
	class MyEmitter extends this.ievents {}
	this.EventEmitter = new MyEmitter();
	this.todos = [ '' ];
	this.DB_Slave;
	this.DB_Master;
	this.GWS;
	this.GS_Redis;
	this.Web_Redis;
	
	
	function Async_Run(GPB,AsyncCallback)
	{
		var iasync = require('async');
		iasync.series({
			/*Init_DB: function(callback){
				Task0_Init_DB(callback,GPB);
			},*/
			/*Init_Web_Redis: function(callback){
				Task1_Init_WebRedis(callback,GPB);
			},*/
			Init_GS_Redis: function(callback){
				Task2_Init_GSRedis(callback,GPB);
			},
			Init_CleanUserGameType: function(callback){
				Task3_Init_CleanUserGameType(callback,GPB);
			},
			/*Init_Socket: function(callback){
				Task4_Init_Socket(callback,GPB);
			},*/
			Init_Start: function(callback){
				Task5_Init_START(callback,GPB);
			}
		},
		AsyncCallback);
	}
	function Task0_Init_DB(callback,GPB)
	{
		GPB.ShowLog(2,'GPB Task0_Init_DB');
		var Db = require('../config/DB_config.js' );
		var MyDB = require('./MyDB.js' );
		
		GPB.DB_Slave = new MyDB(Db.SlaveIP,Db.SlaveACC,Db.SlavePW,Db.SlaveName,Db.SlavePort);
		GPB.DB_Master = new MyDB(Db.MasterIP,Db.MasterACC,Db.MasterPW,Db.MasterName,Db.MasterPort);
		
		callback(null,1);
	}
	function Task1_Init_WebRedis(callback,GPB)
	{
		
		GPB.ShowLog(2,'GPB Task1_Init_WebRedis');
		var rc = require('../config/Web_Redis_config.js');
		RDS_OPTS = {};
		GPB.Web_Redis = redis.createClient(rc.Port,rc.IP,RDS_OPTS);
		GPB.Web_Redis.select(rc.DBindex);	
		GPB.Web_Redis.on('error',function (err,value)
		{
			try{
				callback("Web Redis啟動失敗",1);
			}
			catch(ex){
			}
		});
		GPB.Web_Redis.on('connect',function ()
		{
			callback(null,1);
		});	
	}
	function Task2_Init_GSRedis(callback,GPB)
	{
		
		GPB.ShowLog(2,'GPB Task2_Init_Redis');
		var rc = require('../config/GS_Redis_config.js');
		RDS_OPTS = {};
		GPB.GS_Redis = redis.createClient(rc.Port,rc.IP,RDS_OPTS);
		GPB.GS_Redis.select(rc.DBindex);	
		GPB.GS_Redis.on('error',function (err,value)
		{
			try{
				callback("GS Redis啟動失敗",1);
			}
			catch(ex){
			}
		});
		GPB.GS_Redis.on('connect',function ()
		{
			this.srem(GPB.rKey_GAMESERVER_LIST,GameName);
			this.sadd(GPB.rKey_GAMESERVER_LIST, GameName);
			
			
			this.del(GPB.rKey_GAMESERVER+GameName);
			this.hset(GPB.rKey_GAMESERVER+GameName, "port", weport);
			this.hset(GPB.rKey_GAMESERVER+GameName, "GameName", GameName);
			this.hset(GPB.rKey_GAMESERVER+GameName, "GameShowName", GameShowName);

			/*
			this.hgetall(GPB.rKey_GAMESERVER+GameName, function(err,res){   
				ShowLog(0,"此遊戲參數:");	
				ShowLog(0,res);
			});
			
			this.scard(GPB.rKey_GAMESERVER_LIST, function(err,res){   
				ShowLog(0,"共幾個服務:"+res);
			});
			this.smembers(GPB.rKey_GAMESERVER_LIST, function(err,res){  
				ShowLog(0,"所有遊戲服務名稱:"+res);	
			});
			*/
			
			
			 
			//this.del(GPB.rKey_USER+"GP_Liang",redis.print);
			//this.del(GPB.rKey_USER+"undefined",redis.print);
			//this.del("GS:USER:List:",redis.print);
			
			
			/*
			this.hset("GS:USER:62940", "GAMETYPE","000", redis.print);
			this.hgetall("GS:USER:62940", function(err,res){   
				GPB.ShowLog(0,"玩家參數:62940");	
				GPB.ShowLog(0,res);
			});
			
			*/
			this.smembers(GPB.rKey_USER_List, function(err,res){  
				GPB.ShowLog(0,"所有玩家:"+res);	
				GPB.ShowLog(0,res);	
			});
			
			
	
			GPB.EventEmitter.on('onDisconnect', function(socket,data) {
				//ShowLog(0,'Game onDisconnect ::::'+data);
				GPB.GS_Redis.hget(GPB.rKey_USER+data, "GAMETYPE", function (err, obj) {
					//ShowLog(0,'Game onDisconnect GameName ::::'+obj);
					if(obj!=null && obj== GameName  ){
						GPB.GS_Redis.hset(GPB.rKey_USER+data, "GAMETYPE", "000", function(err,value){});
					}
				});
								
				//
			});
			
			callback(null,1);
		});	
	}
	function Task3_Init_CleanUserGameType(Task3callback,GPB)
	{
		GPB.ShowLog(2,'GPB Task3_Init_CleanUserGameType');
		var keys ;
		var all;
		var l = 0;
		iasync.series({
				/*
				Z: function(callback){
					//測試用
					GPB.GS_Redis.hset(GPB.rKey_USER+"62940", "GAMETYPE","000",function(err,res){ 
						callback(null,res);
					});
				},
				*/
				A: function(callback){
					GPB.GS_Redis.keys(GPB.rKey_USER+"*",function(err,res){ 
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
					
					iasync.whilst(
						function () { 
							return i < keys.length; 
						},
						function (wcallback) {
							var key = keys[i];
							GPB.GS_Redis.hget(key, "GAMETYPE", function (err, obj) {
								//GPB.ShowLog(0,"GameName:"+GameName+" "+key+":\tGAMETYPE:"+obj);
								if(obj==GameName){
									GPB.GS_Redis.hset(key, "GAMETYPE","000",function(err,res){wcallback();});
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
			Task3callback(err,results);
		});
	}
	function Task4_Init_Socket(callback,GPB)
	{
		GPB.ShowLog(2,'GPB Task4_Init_Socket');
		//var GameWebsocket = require('./GameWebsocket.js' );
		//GPB.GWS  = new GameWebsocket(weport,GPB,GameName,GameShowName);
		
		callback(null,1);
	}
	function Task5_Init_START(callback,GPB)
	{
		GPB.ShowLog(2,'GPB Task5_Init_START');
		TaskFunction_Kill(GPB);
		TaskFunction_Alert(GPB);
		callback(null,1);
	}
	this.Run = function() {
		var GPB = this;
		Async_Run(GPB,function(err, results) {
			if(err==null)
			{
				GPB.ShowLog(0,clc.yellow('cb_onRedisConnect'));
				GPB.EventEmitter.emit('onServiceRun','','');
			}
			else
			{
				GPB.ShowLog(2,"啟動失敗");
				GPB.ShowLog(2,err);
			}
		});
    };
	
	
	
	function TaskAsync_Alert(GPB)
	{
		var l = 0;
		iasync.parallel({
				A: function(callback){
					GPB.GS_Redis.llen(GPB.rKey_CMD_ALERT + GameName,function(err,res){ 
						if(err==null)
							 callback(null,res);
						else
							 callback(1,err);
					});
				},
				B: function(callback){
					GPB.GS_Redis.lpop(GPB.rKey_CMD_ALERT + GameName,function(err,res){ 
						if(err==null)
							 callback(null,res);
						else
							 callback(2,err);
					});
				}
		},
		function(err, results) {
			//GPB.ShowLog(0,err);
			//GPB.ShowLog(0,results);
			if(err==null)
			{
				var last_len = results.A;
				var iMessage = results.B;
				if(iMessage!=null)
					GPB.GWS.AlertToAll(iMessage);
				if(last_len>1)
					TaskAsync_Alert(GPB);
			}
				
		});
	}
	function TaskFunction_Alert(GPB)
	{
		task_Alert_Max = 10;
		task_Alert = 0;
		setInterval(function() {
			task_Alert ++;
			if(task_Alert >= task_Alert_Max)
			{
				//GPB.GS_Redis.lpush(GPB.rKey_CMD_ALERT + GameName,"XbbbX",function(err,res){ });//測試用
				task_Alert = 0;
				TaskAsync_Alert(GPB);
			}
		}, 1000);
	}
	
	function TaskAsync_Kill(GPB)
	{
		var l = 0;
		iasync.parallel({
			A: function(callback){
				GPB.GS_Redis.llen(GPB.rKey_CMD_KILL+GameName,function(err,res){ 
					if(err==null)
						 callback(null,res);
					else
						 callback(1,err);
				});
			},
			B: function(callback){
				GPB.GS_Redis.lpop(GPB.rKey_CMD_KILL+GameName,function(err,res){ 
					if(err==null)
						 callback(null,res);
					else
						 callback(2,err);
				});
			}
		},
		function(err, results) {
			//ShowLog(0,err +" : "+results.A);
			if(err==null)
			{
				var last_len = results.A;
				var kill_mid = results.B;
				
				if(kill_mid!=null)
					GPB.GWS.StopUserByMid(kill_mid);
				if(last_len>1)
					TaskAsync_Kill(GPB);
			}
				
		});
	}
	function TaskFunction_Kill(GPB)
	{
		task_kill_Max = 10;
		task_kill = 0;
		setInterval(function() {
			task_kill ++;
			//ShowLog(0,'task_kill:'+task_kill);
			if(task_kill >= task_kill_Max)
			{
				//GPB.GS_Redis.lpush(GPB.rKey_CMD_KILL+GameName,"62940",function(err,res){ });		//測試用
				task_kill = 0;
				TaskAsync_Kill(GPB);
			}
		}, 1000);
	}

	
	
	this.SetGameParam = function(key,value,callback)
	{
		this.GS_Redis.hset(this.rKey_GAMESERVER+GameName, key, value, callback);
	}
	this.GetGameParamByKey = function(key,callback)
	{
		this.GS_Redis.hget(this.rKey_GAMESERVER+GameName, key, callback);
		
	}
	this.GetGameParam = function(callback)
	{
		this.GS_Redis.hgetall(this.rKey_GAMESERVER+GameName, callback);
	}
	
	
	this.SQLQuery =	function (SQL,callback)
	{			
		this.DB_Slave.Query(SQL,function(error, rows, fields){
			if(error){
				ShowLog(0,clc.red('SQLQuery Error:'+ error));
				callback( {'ErrorCode': 1,'ErrorMessage': error});
				return;
			}
			callback( {'ErrorCode': 0,'ErrorMessage': '','rows': rows,'fields': fields});
		});
	}
	this.SQLEX =function (SQL,callback){
		this.DB_Master.Query(SQL, function(error){
			if(error){
				ShowLog(0,clc.red('SQLEX Error:'+ error));
				callback( {'ErrorCode': 1,'ErrorMessage': error});
				return;
			}
			callback( {'ErrorCode': 0,'ErrorMessage': ''});
		}); 
	}
	//Vic SQL INSERT 多筆
	this.SQLEX_all =function (SQL,Val,callback){ 
		this.DB_Master.Query_all(SQL,Val, function(error){
			if(error){
				console.log(clc.red('SQLEX Error:'+ error));
				callback( {'ErrorCode': 1,'ErrorMessage': error});
				return;
			}
			callback( {'ErrorCode': 0,'ErrorMessage': ''});
		}); 
	}
	//Vic SQL 查詢 多筆
	this.SQLQuery_all =function (SQL,Val,callback){ 
		this.DB_Slave.Query_all(SQL,Val, function(error, rows, fields){
			if(error){
				console.log(clc.red('SQLQuery Error:'+ error));
				callback( {'ErrorCode': 1,'ErrorMessage': error});
				return;
			}
			callback( {'ErrorCode': 0,'ErrorMessage': '','rows': rows,'fields': fields});
		});
	}

}