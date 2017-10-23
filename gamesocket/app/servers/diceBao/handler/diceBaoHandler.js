var pomelo=require('pomelo');

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
var gid='052';
var channel = pomelo.app.get('channelService').getChannel('connect',false);
var gameDao = require('../../../dao/gameDao');
//===固定==============================================================

handler.bet = function(msg,session,next){

	console.log(msg);
	var tmp = ((JSON.stringify(JSON.parse(msg.bet).data)).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON

	var betData = tmp; //下注內容
	//betData=tmp.split(','); //取JSON data
	var gameID=(betData[tmp.length-1].split(':'))[1];
	console.log(gameID);

	var betPlay = betData[key].split('|');
	var betValue =null;
		betValue =getbetValue(betPlay[0]);
	var amount = betPlay[1];//下注總金額
	var amount = 0;//下注總金額
	var sessionMoney= 0 ;//原始帳戶餘額
	var betSqls=[];//寫入bet_g51的SQL Value
	var amountlogSqls=[];//寫入amount_log的SQL Value
	var betkey=''; 
	var bet2='';
	var trans_no='';
	var betDataCheck=false;
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
				betDataCheck=true;
			}
		}
		callback_Z(null,0)
	},
	//=============================================================
	A: function(callback_A){
		betValue=betValue.join(',');
		betkey=gid+getSn(13);
		var checkSn=true; 
		//檢查唯一單號
		async.whilst(
			function() //test function: while test is true
			{ return checkSn; },
			function(callback) {
				dbslave.query('SELECT bet001 from bet_g52 where bet002 = ?',[betkey+'0001'],function(data){
					if(data.ErrorCode== 0)
					{ //如果有資料則return true 無則return false
						if(data.rows.length== 0)
						{
							console.log('單號未重複');
							checkSn=false;
							bet2=betkey+'0001';
							trans_no=bet2;
							betSqls=[betkey,0,0,formatDate()+" "+formatDateTime(),formatDate()+" "+formatDateTime(),bet2,0,session.uid,gameID,1151,0,1,betValue,1,1,amount,170000,md5(Date.now()),formatDate()];
							amountlogSqls=[20,trans_no,session.uid,'MAIN',sessionMoney,0,'CTL',0,amount,session.uid,session.get('memberdata').ip,'m','52',formatDate()];
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
					callback_A(null,0);
				}
			}
		);
	},
	B: function(callback_B){
		var sql="INSERT INTO bet_g52 (betkey,betstate,betwin,betgts,bet000,bet002,bet003,bet005,bet009,bet011,bet012,bet013,bet014,bet015,bet016,bet017,bet018,bet034,bydate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		dbmaster.insert(sql,betSqls,function(data){
			if(data.ErrorCode==0)
			{
				console.log('insert betg52 success');
				callback_B(null,0);
			}else{
				console.log('insert betg52 fail');
				callback_B(1,data.ErrorMessage);
			}
		});
	},
  	C:function(callback_C){
		var sql="INSERT INTO member_amount_log (transfer_type, transfer_no, from_mid, from_gkey, from_balance, to_mid, to_gkey, to_balance, amount, operator, uip, otype, gameid, bydate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		dbmaster.insert(sql,amountlogSqls,function(data){
			if(data.ErrorCode==0)
			{
				console.log('insert amount_log success');
				callback_C(null,0);
				//console.log(amountlogSqls);
			}else{
				callback_C(0,data.ErrorMessage);
			}
		});
	}
	},
	function(err, results) { //series執行結果
		if(err)//錯誤則刪單並退錢
		{
			async.parallel([
				function(cb){
					gameDao.delBet(session.uid,gameID,cb);
				},
				function(cb){
					gameDao.delAmountlog(trans_no,cb);
				},
				function(cb){
					gameDao.addMoney(amount,session.uid,cb);
				}
			],
			function(err,results){
				if(err){
					next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
				}else{
					next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
				}
			});
		}else{
			console.log("下注完成");
	 		next(null,{'ErrorCode':0,'ErrorMessage':'','bet':200});
		}
	});
}
/*handler.GameInit = function(msg,session,next){
	async.series({
		gamedata: function(G_callback){
			var sql='SELECT gas001,(NOW()) as nowtime ,CONCAT(gas006," ",gas007)as endtime FROM games_52 WHERE CONCAT(gas004," ",gas005 )<= NOW() AND CONCAT(gas006," ",gas007)>= NOW() ORDER BY gas001 DESC LIMIT 1'
			var args=[""];
			 dbclient.query(sql,args,function(data){
			 	G_callback(data.ErrorCode,data);
			 })
		},
		memberdata: function(M_callback){
			var memberid = session.uid;
			var sql='SELECT mem006 FROM member where mem002 = ?';
			var args=[session.uid];
				dbclient.query(sql,args,function(data)
				{
					session.set('money',data.rows[0].mem100);
					session.pushAll();
					M_callback(data.ErrorCode,data);
				});	
		},
		historydata: function(H_callback){
			var sql='SELECT gas001,gas008 FROM games_52 where gas008 <> ? order by gas001 desc limit 10';
			var args=[""];
			dbclient.query(sql,args,function(data){
				console.log("GameInit:");
				console.log(data);
				H_callback(data.ErrorCode,data);
				if(err){
					console.log('ERR:'+err);
					H_callback(null, { msg: "Server Error", 'ErrorCode': 1 });
				}else{
					var history ='';
					for (var key in data){
						history=history+data[key].gas008+',';
					}
					history=history.substring(0,history.length-1);
					console.log(history);
					H_callback(null, { 'history': history, 'ErrorCode': 0 });
				}
			});
		}
	},
	function(err,result){
		var GameData = result.gamedata;
		var MemberData = result.memberdata;
		var HistoryData = result.historydata;

		var endtime = new Date(GameData.rows[0].endtime);
		var nowtime = GameData.rows[0].nowtime;

		var timezone = (Date.parse(endtime.toISOString())-Date.parse(nowtime.toISOString()))/1000;
		//var Period = GameData.rows[0].gas003;
		var gameID = GameData.rows[0].gas001;
		var moneys = MemberData.rows[0].mem100;

		var history='';
		for (var key in HistoryData.rows){
			history=history+HistoryData.rows[key].gas008+',';
		}
		history=history.substring(0,history.length-1);
		var initdata = {'ErrorCode':0,'Money':moneys,'Period':gameID,'TimeZone':timezone,'History':history,'Max':5000,'Min':10};
			//initdata = JSON.stringify(initdata);
			//console.log(initdata);
			console.log(endtime.toISOString());
			console.log(nowtime.toISOString());
		next(null,initdata);
	});
}*/

handler.GetGameID =function(msg,session,next){
	redis.hget('GS:GAMESERVER:diceBao', "GameID", function (err, res) {
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
	redis.hget('GS:GAMESERVER:diceBao', "endTime", function (err, res) {
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
			redis.hget('GS:GAMESERVER:diceBao', "gameHistory", function (err, res) {
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
			redis.hget('GS:GAMESERVER:diceBao', "lobbyHistory", function (err, res) {
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
	redis.hget('GS:GAMESERVER:diceBao', "Status", function (err, res) {
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
		}
	], 
		function(err,res) {
			if(err) {
				next(new Error('random error'),500);
			}else{
				next(null,{'ErrorCode':0,'ErrorMessage':'','GetBetTotal':res});
			}
		}
	);
}

handler.GetNowBetTotal = function(msg,session,next){
	var NowBetTotal=[0,0,0,0,0,0,0];

	async.waterfall([
		function(cb) {
			for(var i in NowBetTotal){
				NowBetTotal[i]=Math.floor(Math.random() *21+5)
			}
			cb(null,NowBetTotal.join())
		}
	], 
		function(err,res) {
			if(err) {
				next(new Error('random error'),500);
			}else{
				next(null,{'ErrorCode':0,'ErrorMessage':'','GetBetTotal':res});
			}
		}
	);
}


function getSn(num){
	sn = new Array();
	for(var i=0;i<num;i++)
		{
		sn[i]=Math.floor(Math.random() *10)
		}
	return sn.join("");
}

function getbetValue(code)
{
	switch(code)
	{
		case 8001:
			return '1,1,1'; //豹子
			break;
		case 8002:
			return '2,2,2';
			break;
		case 8003:
			return '3,3,3';
			break;
		case 8004:
			return '4,4,4';
			break;
		case 8005:
			return '5,5,5';
			break;
		case 8006:
			return '6,6,6';
			break;
		case 8007:
			return '7,7,7';
			break;
		case 8008:
			return '1,1'; //雙骰
			break;
		case 8009:
			return '2,2';
			break;
		case 8010:
			return '3,3';
			break;
		case 8011:
			return '4,4';
			break;
		case 8012:
			return '5,5';
			break;
		case 8013:
			return '6,6';
			break;
		case 8014:
			return '4';//和值
			break;
		case 8015:
			return '5';
			break;
		case 8016:
			return '6';
			break;
		case 8017:
			return '7';
			break;
		case 8018:
			return '8';
			break;
		case 8019:
			return '9';
			break;
		case 8020:
			return '10';
			break;
		case 8021:
			return '11';
			break;
		case 8022:
			return '12';
			break;
		case 8023:
			return '13';
			break;
		case 8024:
			return '14';
			break;
		case 8025:
			return '15';
			break;
		case 8026:
			return '16';
			break;
		case 8027:
			return '17';
			break;
		case 8028:
			return '1,2';//二不同骰
			break;
		case 8029:
			return '1,3';
			break;
		case 8030:
			return '1,4';
			break;
		case 8031:
			return '1,5';
			break;
		case 8032:
			return '1,6';
			break;
		case 8033:
			return '2,3';
			break;
		case 8034:
			return '2,4';
			break;
		case 8035:
			return '2,5';
			break;
		case 8036:
			return '2,6';
			break;
		case 8037:
			return '3,4';
			break;
		case 8038:
			return '3,5';
			break;
		case 8039:
			return '3,6';
			break;
		case 8040:
			return '4,5';
			break;
		case 8041:
			return '4,6';
			break;
		case 8042:
			return '5,6';
			break;
		case 8043:
			return '1001';//單骰
			break;
		case 8044:
			return '1002';
			break;
		case 8045:
			return '1003';
			break;
		case 8046:
			return '1004';
			break;
		case 8047:
			return '1005';
			break;
		case 8048:
			return '1006';
			break;
		case 8049:
			return 1; //大
			break;
		case 8050:
			return 0;//小
			break;
		case 8051:
			return 1;//單
			break;
		case 8052:
			return 0;//雙
			break;
	}
}