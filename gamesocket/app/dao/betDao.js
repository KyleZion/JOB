var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var async = require('async');
var utils = require('../util/utils');
var gameDao = require('./gameDao');
var betDao = module.exports;

betDao.betSQLEX = function(cb){
	dbslave = pomelo.app.get('dbslave');
	dbmaster = pomelo.app.get('dbmaster');
	async.series({
	Y: function(callback_Y){
		async.waterfall([
			function(cb) {
				gameDao.getMoney(session.uid, cb);
			}
		],
			function(err,resDao) {
				if(err) {
					logger.error('getMoneyError');
					callback_Y(1,0);
				}else{
					sessionMoney=resDao;
					callback_Y(null,0);
				}
			}
		);
	},
	Z: function(callback_Z){
		for(var i=0;i<=6;i++){
			if(betData[i]!=0){
				amount= amount+betData[i]; //計算下注總金額
				betValue[i]=betData[i];
			}
		}
		callback_Z(null,0)
	},
	//=============================================================
	A:function(callback_A){
		
		gameDao.lowerMoney(amount,session.uid,function(err,res){
			if(!err){
				callback_A(0,0);
			}
		});
        /*//dbmaster.update('UPDATE member SET mem100 = mem100 - ? where mem001 = ?',[betData.total,session.uid],function(data){ //nsc
        dbmaster.update('UPDATE member2 SET mem006 = mem006 - ? where mem002 = ?',[betData.total,session.uid],function(data){ //egame
          if(data.ErrorCode==0){
            	console.log('已扣款');
            	callback_A(null,0);
            }else{
				callback_A(1,data.ErrorMessage);
			}
          });*/
	},
	B:function(callback_B){
		var sql="INSERT INTO member_amount_log (transfer_type, from_mid, from_gkey, from_balance, to_mid, to_gkey, to_balance, amount, operator, uip, otype, gameid, bydate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
		dbmaster.insert(sql,amountlogSqls,function(data){
			if(data.ErrorCode==0)
			{
				console.log('insert amount_log success');
				logId=data.rows.insertId
				callback_B(null,0);
				//console.log(amountlogSqls);
			}else{
				logger.error('Insert member_amount_log error');
				gameDao.addMoney(amount,session.uid,function(err,res){
					callback_B(1,data.ErrorMessage);
				});
				
			}
		});
	},
	C: function(callback_C){
		betValue=betValue.join(',');
		betkey=gid+getSn(13);
		var checkSn=true; 
		//檢查唯一單號
		async.whilst(
			function() //test function: while test is true
			{ return checkSn; },
			function(callback) {
				dbslave.query('SELECT bet001 from bet_g51 where bet002 = ?',[betkey+'0001'],function(data){
					if(data.ErrorCode== 0)
					{ //如果有資料則return true 無則return false
						if(data.rows.length== 0)
						{
							console.log('單號未重複');
							checkSn=false;
							bet2=betkey+'0001';
							trans_no=bet2;
							betSqls=[betkey,0,0,formatDate()+" "+formatDateTime(),formatDate()+" "+formatDateTime(),bet2,0,session.uid,gameID,1151,0,1,betValue,1,1,amount,170000,md5(Date.now()),formatDate()];
							//amountlogSqls=[20,trans_no,session.uid,'MAIN',sessionMoney,0,'CTL',0,amount,session.uid,session.get('memberdata').ip,'m','51',formatDate()];
							callback(null,checkSn);
						}else{
							betkey=gid+getSn(13);
						}					
					}
				});
			},
			function (err, checkSn){
				if(!checkSn)
				{
					callback_C(null,0);
				}
			}
		);
	},
	D: function(callback_D){
		var sql="INSERT INTO bet_g51 (betkey,betstate,betwin,betgts,bet000,bet002,bet003,bet005,bet009,bet011,bet012,bet013,bet014,bet015,bet016,bet017,bet018,bet034,bydate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		dbmaster.insert(sql,betSqls,function(data){
			if(data.ErrorCode==0)
			{
				console.log('insert betg51 success');
				callback_D(0,0);
			}else{
				console.log('Insert betg51 fail');
				logger.error('Insert betg51 Error');
				async.parallel([
					function(cb){
						gameDao.delAmountlogById(logId,cb);
					},
					function(cb){
						gameDao.addMoney(amount,session.uid,cb);
					}
				],
				function(err,results){
					if(err){
						logger.error('gameDao Error');
						callback_D(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}else{
						callback_D(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}
				});
				
			}
		});
	},
	E: function(callback_E){
		dbmaster.update("UPDATE member_amount_log SET transfer_no = ? where id = ?",[trans_no,logId],function(data){
			if(data.ErrorCode==0)
			{
				console.log('UPDATE transfer_no success');
				callback_E(null,0);
			}else{
				logger.error('UPDATE member_amount_log Error');
				async.parallel([
					function(cb){
						gameDao.delBet(session.uid,gameID,cb);
					},
					function(cb){
						gameDao.delAmountlogById(logId,cb);
					},
					function(cb){
						gameDao.addMoney(amount,session.uid,cb);
					}
				],
				function(err,results){
					if(err){
						logger.error('gameDao Error');
						callback_E(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}else{
						callback_E(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}
				});
			}
		});
	}
	},
	function(err, results) { //series執行結果
		if(err)//錯誤則刪單並退錢
		{
			next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
		}else{
			console.log("下注完成");
			//UnlockAmount
	 		next(null,{'ErrorCode':0,'ErrorMessage':'','bet': sessionMoney-amount});
		}
	});
}
