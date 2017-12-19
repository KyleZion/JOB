var pomelo = require('pomelo');

module.exports.mainGame = function(gameID,endtime,dbmaster,dbslave,redis,gameZone)
{
	var gameService = require('./gameService.js');
	var messageService = require('./messageService.js');
	var fruitWheelInit = require('./fruitWheelInit.js');
	var fruitWheelgameop = require('./fruitWheelopvn1.js.js')
	var async =require('async');
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
				var struct_games = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
				var lib_gameClose = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_51",struct_games);
				struct_games.params.gas009 = 1;
				struct_games.where.gas004 = gameZone;
				struct_games.where.id = gameID;
				lib_gameClose.Update(function(res){
					if(!res){
						console.log('關盤'+gameID);
						messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
					}
				});
			}
			if(Timeout)
			{
				clearTimeout(check);
				var gameopx = setTimeout(function()
				{
					status='O';
					redis.hset('GS:GAMESERVER:fruitWheel', "Status"+gameZone, 'O');
					messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
					//console.log("Timeout");
					//clearTimeout(gameopx);
					async.waterfall([
						function(callback) {

							var gameNum=-1; //開獎號碼初始化
		    	 			//	先開獎
		    	 			gameNum=Math.floor(Math.random() * 7);
							console.log("開獎號:"+gameNum);
							/*開獎號碼
							6 - 櫻桃
							5 - 橘子
							4 - 葡萄
							3 - 鈴鐺
							2 - 西瓜
							1 - 7
							0 - BAR*/
							callback(null,gameNum);//將gameNum傳到第二層
						},
						function(gameNum,callback){
							var struct_gameop = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
							var lib_gameop = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_51",struct_gameop);
							struct_gameop.params.gas008 = gameNum;
							struct_gameop.where.gas004 = gameZone;
							struct_gameop.where.id = gameID;
							lib_gameop.Update(function(res){
								if(!res){
									console.log('寫獎號完成:'+gameNum);
									//VIC: push message to frontend refactory
									//修改messageService方法
									setTimeout(function(){ messageService.broadcast('connector','gameop'+gameZone,{'gameNum':gameNum});}, 5000);
									callback(null,gameNum);
								}
							});
						},
						function(gameNum,callback){
							//select 本期下注成功的注單
							dbslave.query('SELECT bet002,bet005,bet014 FROM bet_g51 where bet009 = ? and bet003 = ? and bet012 = ? order by id',[gameID,0,gameZone],function(data){
								if(data.ErrorCode==0){
									//開始結算
									//var opBet =data.rows;
									gameService.CalculateBet(dbmaster,dbslave,gameID,gameNum,data.rows,gameZone,function(data){
										if(data.ErrorCode==0){
											callback(null,gameNum);
											console.log('結算完成');
										}else{
											console.log('結算錯誤');
											callback(data.ErrorCode,data.ErrorMessage);
										}
									});
								//DB amountlog
								//UPDATE 所有bet_g
								//CalculateBet-->idWinMoneysResult
								}
								});
						},
						function(gameNum,callback){
							//更新games gas012 已結算
							dbmaster.update('UPDATE games_51 SET gas012 = ? where id = ? and gas004 = ?',[1,gameID,gameZone],function(data){	
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
					setTimeout(function(){ fruitWheelInit.init(gameZone); }, 20000);
				}, 5000);
			}
		}
		CheckTime();
}

