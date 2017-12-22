module.exports = function Game_Init2(app,GS_Redis,GameName,GameShowName)
{
	var Base_Param = require(app.getBase()+'/app/consts/Base_Param.js');
	var GPB = new Base_Param();
	var iasync = require('async');
	this.Init_SetRedisParam = function(fcallback)
	{
		iasync.series({
			A: function(callback){
				GS_Redis.srem(GPB.rKey_GAMESERVER_LIST,GameName,function(err,res){callback(err,res);});
			},
			B: function(callback){
				GS_Redis.sadd(GPB.rKey_GAMESERVER_LIST, GameName,function(err,res){callback(err,res);});
			},
			C: function(callback){
				GS_Redis.del(GPB.rKey_GAMESERVER+GameName,function(err,res){callback(err,res);});
			},
			E: function(callback){
				GS_Redis.hset(GPB.rKey_GAMESERVER+GameName, "GameName", GameName,function(err,res){callback(err,res);});
			},
			F: function(callback){
				GS_Redis.hset(GPB.rKey_GAMESERVER+GameName, "GameShowName", GameShowName,function(err,res){callback(err,res);});
			}
		},
		function(err, results) {
			fcallback(err, results);
		});
	}


	this.Init_CleanUserGameType = function(fcallback)
	{
		GPB.ShowLog(2,'Init_CleanUserGameType:');
		var keys ;
		var all;
		var l = 0;
		iasync.series({
				A: function(callback){
					GS_Redis.keys(GPB.rKey_USER+"*",function(err,res){ 
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
							GS_Redis.hget(key, "GAMETYPE", function (err, obj) {
								if(obj==GameName){
									GS_Redis.hset(key, "GAMETYPE","000",function(err,res){wcallback();});
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
			fcallback(err, results);
		});
	}
}