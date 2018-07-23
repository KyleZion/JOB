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
const messageService = pomelo.app.get('messageService');
const sessionService = pomelo.app.get('sessionService');
const casinoId='053';
const GameName = 'Scratch';
//var channel = pomelo.app.get('channelService').getChannel('connect',false);
const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
const lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
const tableHandler = new(require(pomelo.app.getBase()+'/app/lib/lib_TableHandler.js'))(pomelo,async,redis,dbslave,dbmaster,messageService,GameName,casinoId);
const gameOp = new(require(pomelo.app.getBase()+'app/services/Scratch/'))
//const HAN = new(require(pomelo.app.getBase()+'/app/lib/lib_Handler.js'))();
//===固定==============================================================

handler.bet = function(msg,session,next){
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
	//var PeriodID = 0;
	//var UserMoney = 0;
	//var betData = (JSON.stringify(JSON.parse(msg.bet).bets).slice(1,-1)).split(','); //將C2傳來的下注內容string轉JSON
	var channelID = Number(JSON.parse(msg.bet).channelID);
	var amount = (JSON.parse(msg.bet).total); //下注金額
	var betkey=casinoId+session.uid+new Date().getTime(); 
	var transfer_no=betkey+'0001';
	var logId = 0;
	var struct_bet = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //bet_g SQL
	//var afterBetMoney = 0;
	var reward = 0;
	var collect = 0;
	var Period = yyyy+MM+dd+h+m+s+session.uid;
	const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,null,dbslave,dbmaster,53,channelID);

	async function gameMade(){
		var GM = await new Promise ((resolve , reject) => { //寫入期數
			gameSql.InsertPeriod(Period,start,stop,function(res){
				//PeriodID = res;
				//return resolve (res);
				resolve (res);
			});
		});
		return GM;
	}
	async function betSqlInsert(PeriodID){
		const BSI = await new Promise((resolve, reject) => { //寫入注單 20180425
			gameSql.InsertBetg(betkey,transfer_no,session.uid,PeriodID,channelID,amount,casinoId,function(res){ 
				resolve (res);
			});
		});
		return BSI;
	}

	async function getUserMoney(){
		const GUM = await new Promise((resolve, reject) => {
			gameSql.GetUserMoneyMaster(session.uid,function(res){
				//UserMoney = res;
				resolve (res);
			});
		});
		return GUM
	}
	
	async function amountSqlInsert(PeriodID,UserMoney){
		const ASI =await new Promise((resolve, reject) => {//寫入Amountlog
			gameSql.InsertBetsAmountLog(3,PeriodID,transfer_no,session.uid,amount,UserMoney,function(res){
				resolve (res);
			});
		});
		return ASI
	}
	async function lessUserMoney(){
		const LUM = await new Promise((resolve, reject) =>{
			gameSql.UpdateUserMoneyMaster(session.uid,amount,1,function(res){
				resolve (res);
			});
		});
		return LUM
	}
	async function closeGame(PeriodID,reward){
		const CG = await new Promise((resolve, reject) =>{
			if(reward>0){
				gameSql.UpdateGamesStatusToCalculated(PeriodID,function(res){
					resolve(res);
				});
				gameSql.InsertNumber(PeriodID,reward,function(res2){
					
				});

			}else{
				gameSql.UpdateGamesStatusToCalculated(PeriodID,function(res){
					resolve(res);
				});	
			}
		});
		return CG
	}
	async function updateBetg(betID,reward,PeriodID,channelID){
		const UB = await new Promise((resolve, reject) =>{
			if(reward>0){
				gameSql.SetBetsToWin(betID,1,reward,1,function(res){
					resolve(res);
				});	
			}else{
				gameSql.UpdateBetStatusToOpenedById(PeriodID,channelID,betID,function(res){
					resolve(res);
				});	
			}

		});
		return UB
	}
	async function rewardAmountLog(PeriodID,reward,afterBetMoney){
		const RAL = await new Promise((resolve, reject) =>{
			if(reward>0){
				gameSql.InsertBetsAmountLog(4,PeriodID,transfer_no,session.uid,reward,afterBetMoney,function(res){
					resolve(res);
				});	
			}else{
				resolve(0);
			}

		});
		return RAL
	}

	async function betProcess() {
		const res1 = await gameMade(); //回傳期數ID
		const res2 = await betSqlInsert(res1);
		const res3 = await getUserMoney();
		const res4 = await amountSqlInsert(res1,res3);
		const res5 = await lessUserMoney();
		reward = await getAward(channelID);
		const res6 = await closeGame(res1,reward);
		const res7 = await updateBetg(res2,reward,res1,channelID);
		const res8 = await getUserMoney();
		const res9 = await rewardAmountLog(res1,reward,res8);
		//collect = await getAward(channelID,0);
		return [res1,res2,res3,res4,res5,reward,res6,res7];
	}
	betProcess()
		.then(result =>{
			console.error(result);
			gameSql.GetUserMoneyMaster(session.uid,function(res){
				next(null,{'ErrorCode':code.OK,'ErrorMessage':'','reward':reward,'bet':res});
			});
			gameSql.UpdateUserMoneyMaster(session.uid,reward,0,function(res){
			});
		})
		.catch(err =>{
			console.error(err);
		});
}

handler.GetMoney =function(msg,session,next){
	tableHandler.GetUserMoneyMaster(session.uid,function (data){
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
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':msg.ChannelID});//回傳區號,下注上下限
}

handler.LeaveChannel = function(msg,session,next){
	if(msg.ChannelID==0){
		next(null,{'ErrorCode':0,'ErrorMessage':'','cid':'','limit':0});
	}
	var channelService = pomelo.app.get('channelService').getChannel(msg.ChannelID,  false);
	channelService.leave(session.uid,session.frontendId);
	messageService.pushMessageToPlayer({uid:session.uid, sid:'connector-server-1'},'ChannelChange',{'cid':0});
	next(null,{'ErrorCode':0,'ErrorMessage':'','cid':''});
}

async function getAward(channelID){
	switch(channelID){
		case 111:
			var reward = [40000,20000,10000,2000,1000,400,200,120,100,60,40,20,0];
			return reward[Math.floor(Math.random()*reward.length)];
			break;
		case 222:
			var reward = [100000,60000,20000,10000,2000,1000,400,300,200,160,120,100,80,60,40,20,0];
			return reward[Math.floor(Math.random()*reward.length)];
			break;
		case 333:
			var reward = [160000,80000,30000,20000,10000,4000,2000,1400,1000,400,200,160,100,60,40,20,0];
			return reward[Math.floor(Math.random()*reward.length)];
			break;
		case 444:
			var reward = [200000,100000,60000,20000,10000,6000,4000,2000,1600,1000,600,200,120,100,60,40,0];
			//var collect = 2000;
			return reward[Math.floor(Math.random()*reward.length)];
			break;
	}
}