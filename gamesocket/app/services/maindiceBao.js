module.exports.mainGame = function(gameID,Period,endtime,dbmaster,dbslave,redis)
{
	var diceBaoService = require('./diceBaoService.js');
	var diceBaoInit = require('./diceBaoInit.js');
	var messageService = require('./messageService.js');
	var async =require('async')
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
				redis.hset('GS:GAMESERVER:diceBao', "Status", 'F');
				//關盤DB
				dbmaster.update('UPDATE games_52 SET gas009 = ? where gas003  = ?',[1,Period],function(data){
					if(data.ErrorCode==0){
						console.log('關盤'+Period);
						messageService.broadcast('connector','GetStatus',{'status':status});
					}
				});
			}
			if(Timeout)
			{                                                                                                                                                                                                                                                                                                                                                                                              
				clearInterval(CheckTime);
				var gameopx = setTimeout(function()
				{
					status='O';
					redis.hset('GS:GAMESERVER:diceBao', "Status", 'O');
					messageService.broadcast('connector','GetStatus',{'status':status});
					console.log("Timeout");
					//clearTimeout(gameopx);
					async.waterfall([
						function(callback) {
							var gameNum = []
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
							console.log("52開獎號:"+gameNum);
							callback(null,gameNum);//將gameNum傳到第二層
						},
						function(gameNum,callback){
	    					dbmaster.update('UPDATE games_52 SET gas008 = ? where gas003  = ?',[gameNum[0]+','+gameNum[1]+','+gameNum[2],Period],function(data){
								//寫獎號到games_51
								if(data.ErrorCode==0){
									console.log('寫獎號完成:'+gameNum);
									callback(null,gameNum);
								}
							});
						},
						function(gameNum,callback){
							//select 本期下注成功的注單
							dbslave.query('SELECT bet002,bet005,bet014 FROM bet_g52 where bet009 = ? and bet003 = ? order by bet008',[gameID,0],function(data){
								if(data.ErrorCode==0){
									//開始結算
									//var opBet =data.rows;
									diceBaoService.CalculateBet(dbmaster,dbslave,gameID,gameNum,data.rows,function(data){
										if(data.ErrorCode==0){
											callback(null,gameNum);
											console.log('結算完成');
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
							dbmaster.update('UPDATE games_52 SET gas012 = ? where gas003  = ?',[1,Period],function(data){	
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
							setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':results});}, 20000);
						}
					});
					setTimeout(function(){ diceBaoInit.init(); }, 30000);
				}, 5000);
			}
		},2000);
}