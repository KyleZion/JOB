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
const casinoId='053';
const 
//var channel = pomelo.app.get('channelService').getChannel('connect',false);
var gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
const lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const HAN = new(require(pomelo.app.getBase()+'/app/lib/lib_Handler.js'))();
//===固定==============================================================

handler.bet = function(msg,session,next){
	var betData = (JSON.stringify(JSON.parse(msg.bet).bets).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON
	//betData=tmp.split(','); //取JSON data
	var gameID=JSON.parse(msg.bet).GamesID;
	var channelID = JSON.parse(msg.bet).channelID
	var betPlay = new Array();
	//var betValue =new Array();
	var amount = 0//下注金額
	var betkey=''; 
	var bet2='';
	var b015 = 0;
	//var odds = 1;
	var trans_no='';
	var betDataCheck=false;
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
	var logId = 0;
	var struct_bet = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //bet_g SQL
	var afterBetMoney = 0;
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
	
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
	if(msg.ChannelID==0)
	{
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