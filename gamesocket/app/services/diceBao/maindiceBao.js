const pomelo = require('pomelo');

module.exports.mainGame = function(gameID,endtime,dbmaster,dbslave,redis,gameZone)
{
	const diceBaoInit = require('./diceBaoInit.js');
	const messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
	const async =require('async');
	const lib_gameSql = require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js');
	const gameSql = new lib_gameSql(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
	const DBGC = new (require(pomelo.app.getBase()+'/app/services/diceBao/diceBaoGameCalc.js'))(redis,dbslave,dbmaster,messageService,gameZone);
	var status='';
	//進入流程控制 
	var EndTime = Date.parse(endtime);//Date.parse(data.rows[0].endtime);
	function DiceBaoMain(){
		var NowTime  = Date.parse(new Date());
		var Timeout = false;
		status ='T';
		check=setTimeout(DiceBaoMain,2000);
		if( NowTime>= EndTime)
		{
			Timeout = true;
			status = 'F';
			messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':status});
			setTimeout(function(){
			    redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'F');
				//關盤DB
				gameSql.UpdateGamesStatusToClosed(gameID,function(res){
					if(res){
						console.log('關盤'+gameID);
					}
				});
			},3000);
		}
		if(Timeout){
			clearTimeout(check);
			var gameopx = setTimeout(function()
			{
				status='O';
				redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'O');
				messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':status});
				setTimeout(function(){ 
					messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':'C'}); 
					redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'C');
				}, 8000); //總計13秒
				DBGC.GameCalc(gameID,0,function(res){
					if(!res){
						setTimeout(function(){ diceBaoInit.init(gameZone); }, 15000); //總計20秒後
					}else{ //開獎失敗
						setTimeout(function(){ diceBaoInit.init(gameZone); }, 15000); //總計20秒後
					}
				});
			}, 5000);
		}
	}
	DiceBaoMain();
}


