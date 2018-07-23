const pomelo = require('pomelo');
const app = pomelo.app;
module.exports.mainGame = function(gameName,gameID,endtime,dbmaster,dbslave,redis,gameZone)
{
	const gameService = require('./gameService.js');
	const messageService = require(app.getBase()+'/app/services/messageService.js');
	const fruitWheelInit = require('./fruitWheelInit.js');
	const FWC = new (require(app.getBase()+'/app/services/fruitWheel/fruitWheelCalc.js'))(redis,dbslave,dbmaster,messageService,gameZone);
	const gameNumop = new(require('./fruitWheelopvn1.js'))();
	const async =require('async');
	var status='';
		//進入流程控制 
		var EndTime = Date.parse(endtime);//Date.parse(data.rows[0].endtime);

		function CheckTime() 
		{
			var NowTime  = Date.parse(new Date());
			var Timeout = false;
			var NowBetTotal = [0,0,0,0,0,0,0];
			status ='T';
			async.waterfall([ //此為寫入該期數下注額用於前端顯示遊戲中有其他人下注之實際情況，目前是在此做假資料代替
				function(cb) {
					for(var i in NowBetTotal){
						NowBetTotal[i]=Math.floor(Math.random() *12+5);
					}
					cb(null,NowBetTotal)
				}
			], 
				function(err,periodBetTotal) {
					redis.hget('GS:GAMESERVER:fruitWheel', "NowbetTotal"+gameZone,function(err,res){
						if(err){

						}else{
							var tmp= res.split(",");
							var redisTotal =periodBetTotal.map(function(element,index,periodBetTotal){
								return Number(tmp[index])+Number(element);
							});
							redis.hset('GS:GAMESERVER:fruitWheel', "NowbetTotal"+gameZone,redisTotal.join(","));
							//cb(null);
						}
					});
				}
			);
			check=setTimeout(CheckTime,2000);
			if( NowTime>= EndTime)
			{
				Timeout = true;
				status = 'F';
				redis.hset('GS:GAMESERVER:fruitWheel', "Status"+gameZone, 'F');
				//關盤DB
				var struct_games = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
				var lib_gameClose = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("games_51",struct_games);
				struct_games.params.gas009 = 1;
				struct_games.where.gas004 = gameZone;
				struct_games.where.id = gameID;
				lib_gameClose.Update(function(res){
					if(!res){
						messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
					}else{
						console.log('DB關盤失敗'+gameID);
						messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
					}
				});
			}
			if(Timeout){
				clearTimeout(check);
				var gameopx = setTimeout(function(){
					status='O';
					redis.hset('GS:GAMESERVER:fruitWheel', "Status"+gameZone, 'O');
					messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
					FWC.GameCalc(gameID,0,function(res){
					if(!res){
						setTimeout(function(){ fruitWheelInit.init(gameZone,gameName); }, 20000); //總計20秒後
					}else{ //開獎失敗
						setTimeout(function(){ fruitWheelInit.init(gameZone,gameName); }, 20000); //總計20秒後
					}
				});
					//console.log("Timeout");
					//clearTimeout(gameopx);
					
				}, 5000);
			}
		}
		CheckTime();
}

