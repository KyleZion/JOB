var pomelo = require('pomelo');

module.exports.mainGame = function(gameID,Period,endtime,dbmaster,dbslave,redis)
{
	var gameService = require('./gameService.js');
	var messageService = require('./messageService.js');
	var fruitWheelInit = require('./fruitWheelInit.js');
	var async =require('async');
	var status='';
		//進入流程控制 
		//console.log(data);
		//var Period = data.rows[0].gas003;
		var EndTime = Date.parse(endtime);//Date.parse(data.rows[0].endtime);
		console.log("GameControl");
		CheckTime = setInterval(function() 
		{
			var NowTime  = Date.parse(new Date());
			var Timeout = false;
			status ='T';
			if( NowTime>= EndTime)
			{
				Timeout = true;
				status = 'F';
				redis.hset('GS:GAMESERVER:fruitWheel', "Status", 'F');
				//關盤DB
				var struct_games = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
				var lib_gameClose = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_51",struct_games);
				struct_games.params.gas009 = 1;
				struct_games.where.gas003 = Period;
				lib_gameClose.Update(function(res){
					if(!res){
						console.log('關盤'+Period);
						messageService.broadcast('connector','GetStatus',{'status':status});
					}
				});
				/*dbmaster.update('UPDATE games_51 SET gas009 = ? where gas003  = ?',[1,Period],function(data){
					if(data.ErrorCode==0){
						console.log('關盤'+Period);
						messageService.broadcast('connector','GetStatus',{'status':status});
					}
				});*/
			}
			if(Timeout)
			{
				clearInterval(CheckTime);
				var gameopx = setTimeout(function()
				{
					status='O';
					redis.hset('GS:GAMESERVER:fruitWheel', "Status", 'O');
					messageService.broadcast('connector','GetStatus',{'status':status});
					console.log("Timeout");
					//clearTimeout(gameopx);
					async.waterfall([
						function(callback) {
							var gameNum=-1; //開獎號碼初始化
		    	 			//	先開獎
		    	 			gameNum=Math.floor(Math.random() * 7);
							console.log("開獎號:"+gameNum);
							/*開獎號碼
							6 - 橘子
							5 - 櫻桃
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
							struct_gameop.where.gas003 = Period;
							lib_gameop.Update(function(res){
								if(!res){
									console.log('寫獎號完成:'+gameNum);
									setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':gameNum});}, 20000);
									callback(null,gameNum);
								}
							});
	    					/*dbmaster.update('UPDATE games_51 SET gas008 = ? where gas003  = ?',[gameNum,Period],function(data){
								//寫獎號到games_51
								if(data.ErrorCode==0){
									console.log('寫獎號完成:'+gameNum);
									setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':gameNum});}, 20000);
									callback(null,gameNum);
								}
							});*/
						},
						function(gameNum,callback){
							//select 本期下注成功的注單
							dbslave.query('SELECT bet002,bet005,bet014 FROM bet_g51 where bet009 = ? and bet003 = ? order by bet008',[gameID,0],function(data){
								if(data.ErrorCode==0){
									//開始結算
									//var opBet =data.rows;
									gameService.CalculateBet(dbmaster,dbslave,gameID,gameNum,data.rows,function(data){
										if(data.ErrorCode==0){
											callback(null,gameNum);
											console.log('結算完成');
										}else{
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
							dbmaster.update('UPDATE games_51 SET gas012 = ? where gas003  = ?',[1,Period],function(data){	
								if(data.ErrorCode==0){
									console.log(Period+'期已結算結果');
									callback(null,gameNum);
								}
							});
						}
					],function(err, results) {
						if(err){
							console.log(err);
						}else{
							console.log('結算完20秒後送獎號到前台:'+results);
							//setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':results});}, 20000);
						}
					});
					setTimeout(function(){ fruitWheelInit.init(); }, 30000);
				}, 5000);
			}
		},2000);
}

