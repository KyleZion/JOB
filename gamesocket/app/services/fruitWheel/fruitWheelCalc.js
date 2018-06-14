module.exports = function fruitWheelCalc(redis,dbslave,dbmaster,messageService,gameZone,CasinoId){
	const pomelo = require('pomelo');
	const async =require('async');
	const code = require(pomelo.app.getBase()+'/app/consts/code.js');
	const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
	const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
	const gameSql = new(require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
	const diceBaoService = require('./diceBaoService.js');
	// ------ games -------------------------------------------------------------
	this.GameCalc = function(gameID,reCalc,callback_gameOpen){
		async.waterfall([
			function(callback) {
				dbslave.query('SELECT bet002,bet005,bet014,bet016,bet017 FROM bet_g51 where bet009 = ? and bet003 = ? and bet012 = ? order by id',[gameID,0,gameZone],function(data){
					if(data.ErrorCode==0){
						/*console.log(data.rows);
						var gameNum = gameNumop.gameopvn1(data.rows);
						callback(null,gameNum);*/
						gameNumop.gameopvn1(dbmaster,dbslave,redis,gameID,data.rows,gameZone,function(data){
							if(data.ErrorCode==0){
								callback(null,data.gameNum,data.bonusRate);
								//console.log('結算完成');
							}else{
								console.log('結算錯誤1');
								callback(data.ErrorCode,data.ErrorMessage);
							}
						});
					}
				});
				//callback(null,gameNum);//將gameNum傳到第二層
			},
			function(gameNum,bonusRate,callback){
				var struct_gameop = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
				var lib_gameop = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_51",struct_gameop);
				struct_gameop.params.gas008 = gameNum;
				struct_gameop.where.gas004 = gameZone;
				struct_gameop.where.id = gameID;
				lib_gameop.Update(function(res){
					if(!res){
						//console.log('寫獎號完成:'+gameNum);
						//VIC: push message to frontend refactory
						//修改messageService方法
						setTimeout(function(){ messageService.broadcast('connector','gameop'+gameZone,{'gameNum':gameNum,'BonusRate':bonusRate});}, 5000);
						callback(null,gameNum,bonusRate);
					}
				});
			},
			function(gameNum,bonusRate,callback){
				//select 本期下注成功的注單
				dbslave.query('SELECT bet002,bet005,bet014,bet017 FROM bet_g51 where bet009 = ? and bet003 = ? and bet012 = ? order by id',[gameID,0,gameZone],function(data){
					if(data.ErrorCode==0){
						//開始結算
						//var opBet =data.rows;
						gameService.CalculateBet(dbmaster,dbslave,gameID,gameNum,data.rows,gameZone,bonusRate,function(data){
							if(data.ErrorCode==0){
								callback(null,gameNum);
								//console.log('結算完成');
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
						//console.log(gameID+'期已結算結果');
						callback(null,gameNum);
					}else{
						console.log(gameID+'期結算失敗');
						callback(data.ErrorCode,data.ErrorMessage);
					}
				});
			}
		],function(err, results) {
			if(err){
				//console.log('結算失敗20秒後送獎號到前台:'+results);
			}else{
				//console.log('結算完20秒後送獎號到前台:'+results);
				//setTimeout(function(){ messageService.broadcast('connector','gameop',{'gameNum':results});}, 20000);
			}
		});
	}
}