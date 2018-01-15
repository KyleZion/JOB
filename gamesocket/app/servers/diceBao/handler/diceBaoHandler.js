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
var messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
var sessionService = pomelo.app.get('sessionService');
var gid='052';
//var channel = pomelo.app.get('channelService').getChannel('connect',false);
var gameDao = require('../../../dao/gameDao');
var lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
//===固定==============================================================

handler.bet = function(msg,session,next){
	var betData = (JSON.stringify(JSON.parse(msg.bet).bets).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON
	console.log(betData);
	//betData=tmp.split(','); //取JSON data
	var gameID=JSON.parse(msg.bet).GamesID;
	var channelID = JSON.parse(msg.bet).channelID
	var betPlay = new Array();
	//var betValue =new Array();
	var amount = JSON.parse(msg.bet).total;//下注總金額
	console.log(gameID);
	var betkey=''; 
	var bet2='';
	var b015 = 0;
	var odds = 1;
	var trans_no='';
	var betDataCheck=false;
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
	var logId = 0;
	var struct_bet = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //bet_g SQL
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
	//VIC:骰寶下注修正
	async.series({
		Y: function(callback_Y){
			switch(channelID){
				case 101:
					callback_Y(null,0);
					break;
				case 102:
					//amount = amount * 2 ; 
					odds = 2;
					callback_Y(null,0);
					break;
				case 105:
					//amount = amount * 5;
					odds = 5;
					callback_Y(null,0);
					break;
				case 110:
					//amount = amount * 10;
					odds = 10;
					callback_Y(null,0);
					break;
			}
		},
		Z: function(callback_Z){
			for(var i=0;i<betData.length-3;i++){
				if(betData[i].split(':')[1]!=0){
					//amount= amount+betData[i]; //計算下注總金額
					betPlay.push(Number((betData[i].split(':')[0]).replace(/\"/g, "")));
					b015 +=1 ;
					//betValue[i]=betData[i];
				}
			}
			callback_Z(null,0)
		},
		//=============================================================
		A:function(callback_A){
			var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
			struct_amount.params.type = 3;
			struct_amount.params.game_id = '52';
			struct_amount.params.game_name = gameID;
			struct_amount.params.mid = session.uid;
		    //mid,金額,amountlogSQL
			lib_games.DeductMoney(session.uid,amount,struct_amount,function(result)
			{
			  switch(result)
			  {
			    case -1:
			      console.log('查無此id');
			      callback_A(-1,result);
			      break;
			    case -2:
			      console.log('餘額不足');
			      callback_A(-2,result);
			      break;
			    case -3:
			      console.log('扣款失敗');
			      callback_A(-3,result);
			      break;
			    case -4:
			      console.log('寫log失敗');
			      callback_A(-4,result);
			      break;
			    default:
			       //result  是扣款成功後 寫入amount 的id
			      logId=result;
			      callback_A(0,result);
			      break;
			  }
			});
		},
		B: function(callback_B){
			betPlay=betPlay.join(',');
			betkey=gid+PUB.getSn(13);
			var checkSn=true;
			//檢查唯一單號
			async.whilst(
				function() //test function: while test is true
				{ return checkSn; },
				function(callback) {
					dbslave.query('SELECT id from bet_g52 where bet002 = ?',[betkey+'0001'],function(data){
						if(data.ErrorCode== 0)
						{ //如果有資料則return true 無則return false
							if(data.rows.length== 0)
							{
								console.log('單號未重複');
								checkSn=false;
								bet2=betkey+'0001';
								trans_no=bet2;
								var md5str = session.uid+gameID;
								struct_bet.params.betkey = betkey;
								struct_bet.params.betstate = 0;
								struct_bet.params.betwin = 0;
								struct_bet.params.bet002 = bet2;
								struct_bet.params.bet003 = 0;
								struct_bet.params.bet005 = session.uid;
								struct_bet.params.bet009 = gameID;
								struct_bet.params.bet011 = 1152;
								struct_bet.params.bet012 = channelID;
								struct_bet.params.bet014 = betPlay;
								struct_bet.params.bet015 = b015;
								struct_bet.params.bet016 = odds;
								struct_bet.params.bet017 = amount;
								struct_bet.params.bet018 = 170000;
								struct_bet.params.bet034 =md5(md5str);
								struct_bet.params.bydate =PUB.formatDate()
								struct_bet.params.created_at = PUB.formatDate()+" "+PUB.formatDateTime();
								struct_bet.params.updated_at = PUB.formatDate()+" "+PUB.formatDateTime();
								callback(null,checkSn);
							}else{
								betkey=gid+PUB.getSn(13);
							}					
						}
					});
				},
				function (err, checkSn){
					if(!checkSn)
					{
						callback_B(null,0);
					}
				}
			);
		},
		C: function(callback_C){
			var lib_bet = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g52",struct_bet);
			lib_bet.Insert(function(res)
			{
				if(!!res)
				{
					//console.log(res);
					console.log('insert betg52 success');
					callback_C(0,0);
				}else{
					console.log('Insert betg52 fail');
					logger.error('Insert betg52 Error');
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
							callback_C(1,data.ErrorMessage);
							//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
						}else{
							callback_C(1,data.ErrorMessage);
							//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
						}
					});
				}

			});
		},
		D: function(callback_D){
			var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
			struct_amount.params.transfer_no = trans_no;
			struct_amount.where.id=logId;
			var lib_amount = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
			lib_amount.Update(function(res)
			{
			    if(res===0)
			    {
				    console.log('UPDATE transfer_no success');
					callback_D(null,res);	
			    }else{
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
							callback_D(1,'网路连线异常');
							//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
						}else{
							callback_D(1,'网路连线异常');
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
				async.waterfall([
					/*function(cb) //此為寫入該期數下注額用於前端顯示遊戲中有其他人下注之實際情況，目前以假資料代替
					{
						redis.hget('GS:GAMESERVER:fruitWheel', "NowbetTotal"+channelID,function(err,res){
							if(err){

							}else{
								var tmp= res.split(",");
								var redisTotal =periodBetTotal.map(function(element,index,periodBetTotal){
									return Number(tmp[index])+Number(element);
								});
								redis.hset('GS:GAMESERVER:fruitWheel', "NowbetTotal"+channelID,redisTotal.join(","));
								cb(null);
							}
						});
					},*/
					function(cb)
					{
						gameDao.getMoney(session.uid, cb);
					}
					], 
					function(err,resDao)
					{
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							redis.hset('GS:USER:'+session.uid, "ALIVE_TIME",PUB.formatDate()+" "+PUB.formatDateTime());
							next(null,{'ErrorCode':0,'ErrorMessage':'','bet': resDao});
						}
					}
				);
			}
	});

}

handler.GetGameID =function(msg,session,next){
	redis.hget('GS:GAMESERVER:diceBao', "GameID"+msg.cid, function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getGameId(52,msg.cid,cb);
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

handler.GetGameSet =function(msg,session,next){
	redis.hget('GS:GAMESERVER:diceBao', "GameSet"+msg.cid, function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getGameSet(52,msg.cid,cb);
					}
				], 
					function(err,resDao) {
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							var GameSet = resDao.substring(8)
							next(null,{'ErrorCode':0,'ErrorMessage':'','GameSet':GameSet});
						}
					}
				);
			}else{ //success
				next(null,{'ErrorCode':0,'ErrorMessage':'','GameSet':res});
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
	var nowtime = PUB.formatDate()+" "+PUB.formatDateTime();
	redis.hget('GS:GAMESERVER:diceBao', "endTime"+msg.cid, function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getTimezone(nowtime,msg.cid,cb);
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

handler.GetHistory = function(msg,session,next){ 
	switch(msg.count){
		case 20:
			redis.hget('GS:GAMESERVER:diceBao', "gameHistory"+msg.cid, function (err, res) {
				if(err){
					next(new Error('redis error'),500);
				}else{
					if(res==null){

						async.waterfall([
							function(cb) {
								gameDao.getHistory(msg.count,cb);
							}
						], 
							function(err,resDao) {
								if(err) {
									next(new Error('SQL error'),500);
								}else{
									var history = resDao.split("|");
									next(null,{'ErrorCode':0,'ErrorMessage':'','History':history});
								}
							}
						);
					}else{ //success
						var history = res.split("|");
						next(null,{'ErrorCode':0,'ErrorMessage':'','History':history});
					}
				}
			});
			break;
		case 10:
			redis.hgetall('GS:GAMESERVER:diceBao', function (err, res) {
				if(err){
					next(new Error('redis error'),500);
				}else{
					if(res==null){
						async.waterfall([
							function(cb) {
								gameDao.getHistory(msg.count,cb);
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
						var record = new Array();
						record[0] = res.lobbyHistory101;
						record[1] = res.lobbyHistory102;
						record[2] = res.lobbyHistory105;
						console.log(record);
						next(null,{'ErrorCode':0,'ErrorMessage':'','History':record});
					}
				}
			});
			break;
		default:
			next(null,{'ErrorCode':0,'ErrorMessage':'','History':'000'});
	}
}

handler.GetStatus = function(msg,session,next){  //Redis
	if(msg.cid==0){ 
		redis.hgetall('GS:GAMESERVER:diceBao', function (err, res) {
				if(err){
					next(new Error('redis error'),500);
				}else{
					if(res==null){
						async.waterfall([
							function(cb) {
								gameDao.getStatus(0,cb);
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
						var record = new Array();
						record[0] = res.Status101;
						record[1] = res.Status102;
						record[2] = res.Status105;
						next(null,{'ErrorCode':0,'ErrorMessage':'','GetStatus':record});
					}
				}
		});
	}else{
		redis.hget('GS:GAMESERVER:diceBao', "Status"+msg.cid, function (err, res) {
			if(err){
				next(new Error('redis error'),500);
			}else{
				if(res==null){
					async.waterfall([
						function(cb) {
							gameDao.getStatus(msg.cid,cb);
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

handler.GetGameSet =function(msg,session,next){
	redis.hget('GS:GAMESERVER:diceBao', "GameSet"+msg.cid, function (err, res) {
		if(err){
			next(new Error('redis error'),500);
		}else{
			if(res==null){
				async.waterfall([
					function(cb) {
						gameDao.getGameSet(51,msg.cid,cb);
					}
				], 
					function(err,resDao) {
						if(err) {
							next(new Error('SQL error'),500);
						}else{
							var GameSet = resDao.substring(8)
							next(null,{'ErrorCode':0,'ErrorMessage':'','GameSet':GameSet});
						}
					}
				);
			}else{ //success
				next(null,{'ErrorCode':0,'ErrorMessage':'','GameSet':res});
			}
		}
	});
}

handler.AddtoChannel = function(msg,session,next){
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID,  true);
	channelService.add(session.uid,session.frontendId);//加入channel,房間
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':msg.ChannelID}); //觸發該玩家監聽訊息function
	var odds = PUB.getOddsbyChannel(msg.ChannelID);
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':msg.ChannelID,'odds':odds});//回傳區號,賠率
}
handler.LeaveChannel = function(msg,session,next){
	if(msg.ChannelID==0)
	{
		next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','odds':0});
	}
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID,  false);
	channelService.leave(session.uid,session.frontendId);
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':0});
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','odds':0});
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