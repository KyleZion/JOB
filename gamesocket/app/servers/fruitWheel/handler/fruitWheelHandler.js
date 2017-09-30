var pomelo=require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};
//===固定==============================================================
var handler = Handler.prototype;
var redis=pomelo.app.get('redis');
var dbmaster=pomelo.app.get('dbmaster');
var dbslave=pomelo.app.get('dbslave');
var async=require('async');
var md5 = require('md5');
var backendSessionService = pomelo.app.get('backendSessionService');
var sessionService = pomelo.app.get('sessionService');
var gid='051';
var channel = pomelo.app.get('channelService').getChannel('connect',false);
var gameDao = require('../../../dao/gameDao');
var betDao = require('../../../dao/betDao');
//===固定==============================================================

handler.bet = function(msg,session,next){
	var tmp = JSON.parse(msg.bet); //將C2傳來的下注內容string轉JSON
	var betData = null; //下注內容
	betData=tmp.data; //取JSON data
	var gameID=betData.GamesID;
	var amount = 0;//下注總金額
	var sessionMoney= 0 ;//原始帳戶餘額
	var betValue =[0,0,0,0,0,0,0]; //各注數 
	var betSqls=[];//寫入bet_g51的SQL Value
	var amountlogSqls=[20,session.uid,'MAIN',sessionMoney,0,'CTL',0,amount,session.uid,session.get('memberdata').ip,'m','51',formatDate()];;//寫入amount_log的SQL Value
	var betkey=''; 
	var bet2='';
	var trans_no='';
	var logId = 0;
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
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


handler.GetGameID =function(msg,session,next){
	redis.hget('GS:GAMESERVER:fruitWheel', "GameID", function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getGameId(51, cb);
					}
				], 
					function(err,resDao) {
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							next(null,{'ErrorCode':0,'ErrorMessage':'','ID':resDao});
						}
					}
				);
			}else{ //success
				next(null,{'ErrorCode':0,'ErrorMessage':'','ID':res});
			}
		}
	});
}

handler.GetMoney =function(msg,session,next){
	async.waterfall([
		function(cb) {
			gameDao.getMoney(session.uid, cb);
		}
	], 
		function(err,resDao) {
			if(err) {
				next(new Error('SQL error'),500);
			}else{
				next(null,{'ErrorCode':0,'ErrorMessage':'','Money':resDao});
			}
		}
	);
}

handler.GetTimeZone = function(msg,session,next){
	var nowtime = formatDate()+" "+formatDateTime();
	redis.hget('GS:GAMESERVER:fruitWheel', "endTime", function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getTimezone(nowtime,cb);
					}
				], 
					function(err,resDao) {
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							next(null,{'ErrorCode':0,'ErrorMessage':'','TimeZone':resDao});
						}
					}
				);
			}else{
				var endtime = res;
				var timezone = (Date.parse(endtime)-Date.parse(nowtime))/1000;
				next(null,{'ErrorCode':0,'ErrorMessage':'','TimeZone':timezone});
			}
		}
	});
}

handler.GetHistory = function(msg,session,next){ //Redis
	switch(msg.count){
		case "10":
			redis.hget('GS:GAMESERVER:fruitWheel', "gameHistory", function (err, res) {
				if(err){
					next(new Error('redis error'),500);
				}else{
					if(res==null){
						async.waterfall([
							function(cb) {
								gameDao.getHistory(msg,cb);
							}
						], 
							function(err,resDao) {
								if(err) {
									next(new Error('SQL error'),500);
								}else{
									next(null,{'ErrorCode':0,'ErrorMessage':'','History':resDao});
								}
							}
						);
					}else{ //success
						next(null,{'ErrorCode':0,'ErrorMessage':'','History':res});
					}
				}
			});
			break;
		case "30":
			redis.hget('GS:GAMESERVER:fruitWheel', "lobbyHistory", function (err, res) {
				if(err){
					next(new Error('redis error'),500);
				}else{
					if(res==null){
						async.waterfall([
							function(cb) {
								gameDao.getHistory(msg,cb);
							}
						], 
							function(err,resDao) {
								if(err) {
									next(new Error('SQL error'),500);
								}else{
									next(null,{'ErrorCode':0,'ErrorMessage':'','History':resDao});
								}
							}
						);
					}else{ //success
						next(null,{'ErrorCode':0,'ErrorMessage':'','History':res});
					}
				}
			});
			break;
		default:
			next(null,{'ErrorCode':0,'ErrorMessage':'','History':'undefined'});
	}
}

handler.GetStatus = function(msg,session,next){  //Redis
	redis.hget('GS:GAMESERVER:fruitWheel', "Status", function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getStatus(cb);
					}
				], 
					function(err,resDao) {
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							next(null,{'ErrorCode':0,'ErrorMessage':'','GetStatus':resDao});
						}
					}
				);
			}else{ //success
				next(null,{'ErrorCode':0,'ErrorMessage':'','GetStatus':res});
			}
		}
	});
}
handler.GetBetTotal = function(msg,session,next){ //Redis
	var NowBetTotal=[0,0,0,0,0,0,0];

	async.waterfall([
		function(cb) {
			for(var i in NowBetTotal){
				NowBetTotal[i]=Math.floor(Math.random() *21+5)
			}
			cb(null,NowBetTotal.join())
		},
		function(cb){
			betDao.betSQLEX(cb);
		}
	], 
		function(err,res) {
			if(err) {
				next(new Error('random error'),500);
			}else{
				next(null,{'ErrorCode':0,'ErrorMessage':'','GetBetTotal':1});
			}
		}
	);
}

function getSn(num){ //唯一單號亂數
	sn = new Array();
	for(var i=0;i<num;i++)
		{
		sn[i]=Math.floor(Math.random() *10)
		}
	return sn.join("");
}

function formatDate() { //日期格式化
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function formatDateTime() { //時間格式化
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds();

    if (h.length < 2) h = '0' + h;
    if (m.length < 2) m = '0' + m;
    if (s.length < 2) s = '0' + s;

    return [h, m, s].join(':');
}

