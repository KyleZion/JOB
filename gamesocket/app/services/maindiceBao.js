var pomelo = require('pomelo');

module.exports.mainGame = function(gameID,endtime,dbmaster,dbslave,redis,gameZone)
{
	var diceBaoService = require('./diceBaoService.js');
	var diceBaoInit = require('./diceBaoInit.js');
	var messageService = require('./messageService.js');
	var async =require('async')
	var status='';
	//進入流程控制 
	var EndTime = Date.parse(endtime);//Date.parse(data.rows[0].endtime);

	function DiceBaoMain() 
	{
		var NowTime  = Date.parse(new Date());
		var Timeout = false;
		status ='T';
		check=setTimeout(DiceBaoMain,2000);
		if( NowTime>= EndTime)
		{
			Timeout = true;
			status = 'F';
			redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'F');
			//關盤DB
			var struct_games = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
			var lib_gameClose = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_52",struct_games);
			struct_games.params.gas009 = 1;
			struct_games.where.gas004 = gameZone;
			struct_games.where.id = gameID;
			lib_gameClose.Update(function(res){
				if(!res){
					console.log('關盤'+gameID);
					messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':status});
				}
			});
		}
		if(Timeout)
		{
			clearTimeout(check);
			var gameopx = setTimeout(function()
			{
				status='O';
				redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'O');
				messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':status});
				console.log("Timeout");
				//clearTimeout(gameopx);
				async.waterfall([
					function(callback) {
						var gameNum = [];
						gameNum[0] = Math.floor((Math.random() * 6) + 1);
						gameNum[1] = Math.floor((Math.random() * 6) + 1);
						gameNum[2] = Math.floor((Math.random() * 6) + 1);
						var tmp=0;
						for(var i=0;i<gameNum.length;i++){
							for(var j=i+1;j<gameNum.length;j++){
								if(gameNum[i]>gameNum[j]){
								tmp=gameNum[i];
								gameNum[i]=gameNum[j];
								gameNum[j]=tmp;
								}
							}
						}
						//console.log("52開獎號:"+gameNum);
						callback(null,gameNum);//將gameNum傳到第二層
					},
					function(gameNum,callback){
						var sum = gameNum[0]+gameNum[1]+gameNum[2];

						if((gameNum[0]==gameNum[1]) && (gameNum[1]==gameNum[2]))
							gameNum[3] = 0;
						else if(gameNum[0]+gameNum[1]+gameNum[2]<=10)
							gameNum[3] = 1;
						else if(gameNum[0]+gameNum[1]+gameNum[2]>10)
							gameNum[3] = 2;
						else
							gameNum[3] = 404;

						if(sum%2==0)
							gameNum[4] = 0;
						else
							gameNum[4] = 1;

						callback(null,gameNum);//將gameNum傳到第二層
					},
					function(gameNum,callback){
						var struct_gameop = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
						var lib_gameop = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_52",struct_gameop);
						struct_gameop.params.gas008 = gameNum.join(',');
						struct_gameop.where.gas004 = gameZone;
						struct_gameop.where.id = gameID;
						lib_gameop.Update(function(res){
							if(!res){
								console.log('寫獎號完成:'+gameNum);
								//VIC: push message to frontend refactory
								//修改messageService方法
								setTimeout(function(){ messageService.broadcast('connector','diceBaogameop'+gameZone,{'gameNum':gameNum});}, 20000);
								callback(null,gameNum);
							}
						});
					},
					function(gameNum,callback){
						//select 本期下注成功的注單
						dbslave.query('SELECT bet002,bet005,bet014 FROM bet_g52 where bet009 = ? and bet003 = ? and bet012 = ? order by id',[gameID,0,gameZone],function(data){
							if(data.ErrorCode==0){
								//開始結算 暫時不結算
								
								callback(null,gameNum);
								/*diceBaoService.CalculateBet(dbmaster,dbslave,gameID,gameNum,data.rows,gameZone,function(data){
									if(data.ErrorCode==0){
										callback(null,gameNum);
										console.log('結算完成');
									}else{
										console.log('結算錯誤');
										callback(data.ErrorCode,data.ErrorMessage);
									}
								});*/
							}
							});
					},
					function(gameNum,callback){
						//更新games gas012 已結算
						dbmaster.update('UPDATE games_52 SET gas012 = ? where id = ? and gas004 = ?',[1,gameID,gameZone],function(data){	
							if(data.ErrorCode==0){
								console.log(gameID+'期已結算結果');
								callback(null,gameNum);
							}
						});
					}
				],function(err, results) {
					if(err){
						console.log('結算失敗20秒後送獎號到前台:'+results);
					}else{
						console.log('結算完20秒後送獎號到前台:'+results);
						//setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':results});}, 20000);
					}
				});
				setTimeout(function(){ diceBaoInit.init(gameZone); }, 30000);
			}, 5000);
		}
	}
	DiceBaoMain();
}