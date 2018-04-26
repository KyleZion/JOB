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
const casinoId='053';
//var channel = pomelo.app.get('channelService').getChannel('connect',false);
const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
const lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
//const HAN = new(require(pomelo.app.getBase()+'/app/lib/lib_Handler.js'))();
//===固定==============================================================

handler.bet = function(msg,session,next){
	const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,null,dbslave,dbmaster,53,(msg.bet).channelID);
	var TimeNow= new Date();//009 開關盤 010強制關 011停押 012已計算結果
	var yyyy = TimeNow.getFullYear();
	var MM = (TimeNow.getMonth()+1<10 ? '0' : '')+(TimeNow.getMonth()+1);
	var dd = (TimeNow.getDate()<10 ? '0' : '')+TimeNow.getDate();
	var h = (TimeNow.getHours()<10 ? '0' : '')+TimeNow.getHours();
	var m = (TimeNow.getMinutes()<10 ? '0' : '')+TimeNow.getMinutes();
	var s = (TimeNow.getSeconds()<10 ? '0' : '')+TimeNow.getSeconds();
	var o_Day = yyyy+'-'+MM+'-'+dd;//o_Day開盤日期 //o_Day歸屬日期
	var o_Time = h+':'+m+':'+s;//o_Time開盤時間
	var start = o_Day+' '+o_Time;
	var stop = start;
	var PeriodID = 0;
	var UserMoney = 0;
	//var betData = (JSON.stringify(JSON.parse(msg.bet).bets).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON
	var channelID = JSON.parse(msg.bet).channelID
	var amount = JSON.parse(msg.bet).total //下注金額
	var betkey=casinoId+session.uid+new Date().getTime(); 
	var b015 = 0;
	var transfer_no=betkey+'0001';
	//計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
	var logId = 0;
	var struct_bet = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //bet_g SQL
	var afterBetMoney = 0;
	var reward = 0;
	var collect = 0;
	var Period = yyyy+MM+dd+h+m+s+session.uid;

	const gameMade = new Promise ((resolve , reject) => { //寫入期數
		gameSql.InsertPeriod(Period,start,stop,function(res){
			PeriodID = res;
			return resolve (res);
		});
	});

	const betSqlInsert = new Promise((resolve, reject) => { //寫入注單 20180425
		gameSql.InsertBetg(betkey,transfer_no,session.uid,PeriodID,(msg.bet).channelID,function(res){ 
			return resolve (res);
		});
	});
	const getUserMoney = new Promise((resolve, reject) => {
		gameSql.GetUserMoneyMaster(session.uid,function(res){
			UserMoney = res;
			return resolve (res);
		});
	});
	const amountSqlInsert =new Promise((resolve, reject) => {//寫入Amountlog
		gameSql.InsertBetsAmountLog(3,PeriodID,transfer_no,session.uid,amount,UserMoney,function(res){
			return resolve (res);
		});
	});

	const lessUserMoney new Promise((resolve, reject) =>{
		gameSql.UpdateUserMoneyMaster(session.uid,amount,1,function(res){
			return resolve (res);
		})
	});

	const betProcess = async() =>{
		const res1 = await gameMade;
		const res2 = await betSqlInsert;
		const res3 = await getUserMoney;
		const res4 = await amountSqlInsert;
		const res5 = await lessUserMoney;
		reward = await getAward(channelID,1);
		collect = await getAward(channelID,0);
		return [res1,res2,res3,res4,reward,collect];
	}
	betProcess()
		.then(result =>{
			console.log(result);
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','reward':reward,'collect':collect});
		})
		.catch(err =>{
			console.error(err);
		});
		//next(null,{'ErrorCode':code.OK,'ErrorMessage':'','reward':reward,'collect':collect});
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

handler.GetHistory = function(msg,session,next){ 
	tableHandler.GetHistory(GameName,msg.cid,msg.count,function (data) {
		if(data.ErrorCode==code.OK){
			next(null,{'ErrorCode':code.OK,'ErrorMessage':'','res':data.History});
		}else{
			next(new Error(data.ErrorMessage),data.ErrorCode);
		}
	});
}

handler.AddtoChannel = function(msg,session,next){
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID, true);
	channelService.add(session.uid,session.frontendId);//加入channel,房間
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':0}); //觸發該玩家監聽訊息function
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

async function getAward(channelID,type){
	switch(channelID){
		case 111:
			var reward = [40000,20000,10000,2000,1000,400,200,120,100,60,40,20];
			var collect = 600;
			if(type){
				return reward[Math.floor(Math.random()*reward.length)];
			}else{
				return collect;
			}
			break;
		case 222:
			var reward = [100000,60000,20000,10000,2000,1000,400,300,200,160,120,100,80,60,40,20];
			var collect = 1000;
			if(type){
				return reward[Math.floor(Math.random()*reward.length)];
			}else{
				return collect;
			}
			break;
		case 333:
			var reward = [160000,80000,30000,20000,10000,4000,2000,1400,1000,400,200,160,100,60,40,20];
			var collect = 1400;
			if(type){
				return reward[Math.floor(Math.random()*reward.length)];
			}else{
				return collect;
			}
			break;
		case 444:
			var reward = [200000,100000,60000,20000,10000,6000,4000,2000,1600,1000,600,200,120,100,60,40];
			var collect = 2000;
			if(type){
				return reward[Math.floor(Math.random()*reward.length)];
			}else{
				return collect;
			}
			break;
	}
}