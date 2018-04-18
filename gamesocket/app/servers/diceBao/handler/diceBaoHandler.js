var pomelo=require('pomelo');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};
//===固定==============================================================
const handler = Handler.prototype;
const redis=pomelo.app.get('redis');
const dbmaster=pomelo.app.get('dbmaster');
const dbslave=pomelo.app.get('dbslave');
const async=require('async');
const md5 = require('md5');
const messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
const sessionService = pomelo.app.get('sessionService');
const GameName = 'diceBao'
const CasinoId = 52;
const gid='052';
const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
const lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const tableHandler = new(require(pomelo.app.getBase()+'/app/lib/lib_TableHandler.js'))(pomelo,async,redis,dbslave,dbmaster,messageService,GameName,CasinoId);
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
const logger = require('pomelo-logger').getLogger('handler-log',__filename);
//===固定==============================================================

handler.bet = function(msg,session,next){
	var betData = (JSON.stringify(JSON.parse(msg.bet).bets).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON
	var gameID=JSON.parse(msg.bet).GamesID;
	var channelID = JSON.parse(msg.bet).channelID
	var betPlay = new Array();
	var betTotal = 0;//下注總金額
	var betkey=gid+session.uid+new Date().getTime(); 
	var bet2='';
	var trans_no=betkey+'0000';
	var logId = 0;
	var struct_bet = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //bet_g SQL
	var afterBetMoney = 0;
	var count = 0;
	async.series({
		A: function(callback_A){
			async.whilst(
				function() //test function: while test is true
				{ return count<betData.length; },
				function(callback) {
					async.series({
					//=============================================================
						AA: function(callback_AA){
							//betkey=gid+session.uid+new Date().getTime();
							betPlay=betData[count].split(':');
							betTotal += Number(betPlay[1]);
							if(count>=10){
								bet2=betkey+'00'+count;
							}else{
								bet2=betkey+'000'+count;
							}
							var md5str = session.uid+gameID;
							struct_bet.params.betkey = betkey;
							struct_bet.params.betstate = 0;
							struct_bet.params.betwin = 0;
							struct_bet.params.bet002 = bet2;
							struct_bet.params.bet003 = 0;
							struct_bet.params.bet005 = session.uid;
							struct_bet.params.bet009 = gameID;
							struct_bet.params.bet011 = 1151;
							struct_bet.params.bet012 = channelID;
							struct_bet.params.bet014 = betPlay[0].replace(/\"/g, "");
							struct_bet.params.bet015 = 1;
							struct_bet.params.bet016 = 1;
							struct_bet.params.bet017 = betPlay[1];
							struct_bet.params.bet018 = 0;
							struct_bet.params.bet034 =md5(md5str);
							struct_bet.params.bydate =PUB.formatDate();
							struct_bet.params.created_at = PUB.formatDate()+" "+PUB.formatDateTime();
							struct_bet.params.updated_at = PUB.formatDate()+" "+PUB.formatDateTime();
							callback_AA(null,0);
						},
						BB: function(callback_BB){
							var lib_bet = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g52",struct_bet);
							lib_bet.Insert(function(res)
							{
								if(!!res)
								{
									//console.log(res);
									console.log('insert betg52 success');
									callback_BB(0,0);
								}else{
									console.log('Insert betg52 fail');
									logger.error('Insert betg52 Error'); 
									callback_BB(1,data.ErrorMessage);
								}

							});
						},
					},
						function(err, results) { //series執行結果
							if(err)//錯誤則刪單並退錢
							{
								next(null,{'ErrorCode':1,'ErrorMessage':'网路连线异常，代碼'});
							}else{
								//console.log("下注完成");
								count++;
								callback(null,count);
								/*async.waterfall([
									function(cb) //此為寫入該期數下注額用於前端顯示遊戲中有其他人下注之實際情況，目前以假資料代替
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
									},
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
											afterBetMoney = resDao;
											count++;
											callback(null,count);
										}
									}
								);*/
							}
					});
				},
				function (err, n){
					if(!err)
					{
						redis.hset('GS:USER:'+session.uid, "ALIVE_TIME",PUB.formatDate()+" "+PUB.formatDateTime());
						callback_A(null,0)
					}
				}
			);
		},
		B: function(callback_B){
			var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
			struct_amount.params.type = 3;
			struct_amount.params.game_id = '52';
			struct_amount.params.game_name = gameID;
			struct_amount.params.mid = session.uid;
		    //mid,金額,amountlogSQL
		    //console.log(betTotal);
			lib_games.DeductMoney(session.uid,betTotal,struct_amount,function(result)
			{
			  switch(result)
			  {
			    case -1:
			      console.log('查無此id');
			      callback_B(-1,result);
			      break;
			    case -2:
			      console.log('餘額不足');
			      callback_B(-2,result);
			      break;
			    case -3:
			      console.log('扣款失敗');
			      callback_B(-3,result);
			      break;
			    case -4:
			      console.log('寫log失敗');
			      callback_B(-4,result);
			      break;
			    default:
			       //result  是扣款成功後 寫入amount 的id
			      logId=result;
			      callback_B(0,result);
			      break;
			  }
			});
		},
		C: function(callback_C){
			var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
			struct_amount.params.transfer_no = trans_no;
			struct_amount.where.id=logId;
			var lib_amount = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
			lib_amount.Update(function(res)
			{
			    if(res==0)
			    {
				    console.log('UPDATE transfer_no success');
					callback_C(null,res);	
			    }else{
					async.parallel([
						function(cb){ 
							gameDao.delBet(session.uid,gameID,cb);
						},
						function(cb){
							gameDao.delAmountlogById(logId,cb);
						},
						function(cb){
							gameDao.addMoney(betPlay[1],session.uid,cb);
						}
					],
					function(err,results){
						if(err){
							logger.error('gameDao Error');
							callback_C(1,'网路连线异常');
							//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
						}else{
							callback_C(1,'网路连线异常');
							//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
						}
					});
			    }
			    
			});
		}
	},
	function(err, results) {
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
					//afterBetMoney = resDao;
					next(null,{'ErrorCode':0,'ErrorMessage':'','bet': resDao});
				}
			}
		);
	});
	
	

}

handler.GetGameID =function(msg,session,next){
	tableHandler.GetGameID(GameName,msg.cid,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.ID});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.GetGameSet =function(msg,session,next){
	tableHandler.GetGameSet(GameName,msg.ChannelID,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.GameSet});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.GetMoney =function(msg,session,next){
	tableHandler.GetUserMoneyMaster(session.uid,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.Money});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.GetTimeZone = function(msg,session,next){
	tableHandler.GetTimeZone(GameName,msg.cid,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.TimeZone});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.GetHistory = function(msg,session,next){ 
	tableHandler.GetHistory(GameName,msg.cid,msg.count,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.History});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.GetStatus = function(msg,session,next){  //Redis
	tableHandler.GetStatus(GameName,msg.cid,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.GetStatus});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}
/*handler.GetBetTotal = function(msg,session,next){ //Redis
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
}*/

handler.AddtoChannel = function(msg,session,next){
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID,  true);
	channelService.add(session.uid,session.frontendId);//加入channel,房間
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':0}); //觸發該玩家監聽訊息function
	var limit = getBetRestrict(msg.ChannelID);
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':msg.ChannelID,'limit':limit});//回傳區號,下注上下限
}

handler.LeaveChannel = function(msg,session,next){
	if(msg.ChannelID==0){
		next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','limit':0});
	}
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID,  false);
	channelService.leave(session.uid,session.frontendId);
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':0});
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','limit':["100-50000","50-10000","10-1000"]});
}

handler.GameResult = function(msg,session,next){
	redis.hget('GS:GAMESERVER:diceBao',"lastGameComb"+msg.ChannelID,function(err1,res1){
		redis.hget('GS:GAMESERVER:diceBao',"lastGameNum"+msg.ChannelID,function(err2,res2){
			next(null,{'ErrorCode':0,'ErrorMessage':'','gameNum':res2,'gameNumComb':res1.split(',')});
		});
	});
	//next(null,{'ErrorCode':0,'ErrorMessage':'','gameNum':gameNum,'gameNumComb':gameNumComb});
}

handler.GameRestrict = function(msg,session,next){
	if(msg.ChannelID==0){
		next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','limit':["100-50000","50-10000","10-1000"]});
	}
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','limit':getBetRestrict(channelID)});
}

function getBetRestrict(channelID){
	switch(channelID){
		case 111:
			return '100-50000';
			break;
		case 222:
			return '50-10000';
			break;
		case 333:
			return '10-1000';
			break;
	}
}