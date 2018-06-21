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
const casinoId='054';
const GameName = 'fruitSlot'
//var channel = pomelo.app.get('channelService').getChannel('connect',false);
const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
const lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入amount_log,回傳amount_log Index ID
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
const tableHandler = new(require(pomelo.app.getBase()+'/app/lib/lib_TableHandler.js'))(pomelo,async,redis,dbslave,dbmaster,messageService,GameName,casinoId);
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
	const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,null,dbslave,dbmaster,54,channelID);

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
		const res2 = await betSqlInsert(res1); //res2= betg insertID
		const res3 = await getUserMoney();//取餘額
		const res4 = await amountSqlInsert(res1,res3); //res4 = amountlog insertID
		const res5 = await lessUserMoney();//扣款
		const gameNum = await getGameNum(channelID);//開獎
		const trans = await transGameNum(gameNum);
		const res6 = await closeGame(res1,reward);
		const res7 = await updateBetg(res2,reward,res1,channelID);
		const res8 = await getUserMoney();
		const res9 = await rewardAmountLog(res1,reward,res8);
		//collect = await getAward(channelID,0);
		return [res1,res2,res3,res4,res5,reward,res6,res7];
	}
	betProcess()
		.then(result =>{
			console.log(result);
			gameSql.GetUserMoneyMaster(session.uid,function(res){
				next(null,{'ErrorCode':code.OK,'ErrorMessage':'','result':0,'bet':res});
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

async function getGameNum(channelID){
	var num=[];
    //先開獎
    for(let i=0;i<3;i++){
    	num[i]=[Math.floor(Math.random() * 10),Math.floor(Math.random() * 10),Math.floor(Math.random() * 10)];
    }
    return num;
}

98644640006710112647
async function transGameNum(gameNum)
{
	var gameNumCombo = new Array();
	var c=0;
	if((gameNum[0][0]==gameNum[0][1])&&(gameNum[0][1]==gameNum[0][2])&&(gameNum[0][2]==gameNum[0][0])&&(gameNum[0][0]==0)){
	    gameNumCombo[c]='8001';
	    c++;
  	}
	if((gameNum[0][0]==gameNum[0][1])&&(gameNum[0][1]==gameNum[0][2])&&(gameNum[0][2]==gameNum[0][0])&&(gameNum[0][0]==1)){
	    gameNumCombo[c]='8001';
	    c++;
  	}
	if((gameNum[0][0]==gameNum[0][1])&&(gameNum[0][1]==gameNum[0][2])&&(gameNum[0][2]==gameNum[0][0])&&(gameNum[0][0]==2)){
	    gameNumCombo[c]='8001';
	    c++;
  	}
	if((gameNum[0][0]==gameNum[0][1])&&(gameNum[0][1]==gameNum[0][2])&&(gameNum[0][2]==gameNum[0][0])&&(gameNum[0][0]==3)){
	    gameNumCombo[c]='8001';
	    c++;
  	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==5)){
	    gameNumCombo[c]='8005';
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==6)){
	    gameNumCombo[c]='8006';
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])){
	    gameNumCombo[c]='8007';
	    c++;
	}
	if((gameNum[0]==1 && gameNum[1]==1) || (gameNum[1]==1 && gameNum[2]==1)){
	    gameNumCombo[c]='8008';
	    c++;
	}
	if((gameNum[0]==2 && gameNum[1]==2) || (gameNum[1]==2 && gameNum[2]==2)){
	    gameNumCombo[c]='8009';
	    c++;
	}
	if((gameNum[0]==3 && gameNum[1]==3) || (gameNum[1]==3 && gameNum[2]==3)){
	    gameNumCombo[c]='8010';
	    c++;
	}
	if((gameNum[0]==4 && gameNum[1]==4) || (gameNum[1]==4 && gameNum[2]==4)){
	    gameNumCombo[c]='8011';
	    c++;
	}
	if((gameNum[0]==5 && gameNum[1]==5) || (gameNum[1]==5 && gameNum[2]==5)){
	    gameNumCombo[c]='8012';
	    c++;
	}
	if((gameNum[0]==6 && gameNum[1]==6) || (gameNum[1]==6 && gameNum[2]==6)){
	    gameNumCombo[c]='8013';
	    c++;
	}
	if((gameNum[0]==1&&gameNum[1]==2)||(gameNum[1]==1&&gameNum[2]==2)||(gameNum[0]==1&&gameNum[2]==2)){
	    gameNumCombo[c]='8028';
	    c++;
	}
	if((gameNum[0]==1&&gameNum[1]==3)||(gameNum[1]==1&&gameNum[2]==3)||(gameNum[0]==1&&gameNum[2]==3)){
	    gameNumCombo[c]='8029';
	    c++;
	}
	if((gameNum[0]==1&&gameNum[1]==4)||(gameNum[1]==1&&gameNum[2]==4)||(gameNum[0]==1&&gameNum[2]==4)){
	    gameNumCombo[c]='8030';
	    c++;
	}
	if((gameNum[0]==1&&gameNum[1]==5)||(gameNum[1]==1&&gameNum[2]==5)||(gameNum[0]==1&&gameNum[2]==5)){
	    gameNumCombo[c]='8031';
	    c++;
	}
	if((gameNum[0]==1&&gameNum[1]==6)||(gameNum[1]==1&&gameNum[2]==6)||(gameNum[0]==1&&gameNum[2]==6)){
	    gameNumCombo[c]='8032';
	    c++;
	}
	if((gameNum[0]==2&&gameNum[1]==3)||(gameNum[1]==2&&gameNum[2]==3)||(gameNum[0]==2&&gameNum[2]==3)){
	    gameNumCombo[c]='8033';
	    c++;
	}
	if((gameNum[0]==2&&gameNum[1]==4)||(gameNum[1]==2&&gameNum[2]==4)||(gameNum[0]==2&&gameNum[2]==4)){
	    gameNumCombo[c]='8034';
	    c++;
	}
	if((gameNum[0]==2&&gameNum[1]==5)||(gameNum[1]==2&&gameNum[2]==5)||(gameNum[0]==2&&gameNum[2]==5)){
	    gameNumCombo[c]='8035';
	    c++;
	}
	if((gameNum[0]==2&&gameNum[1]==6)||(gameNum[1]==2&&gameNum[2]==6)||(gameNum[0]==2&&gameNum[2]==6)){
	    gameNumCombo[c]='8036';
	    c++;
	}
	if((gameNum[0]==3&&gameNum[1]==4)||(gameNum[1]==3&&gameNum[2]==4)||(gameNum[0]==3&&gameNum[2]==4)){
	    gameNumCombo[c]='8037';
	    c++;
	}
	if((gameNum[0]==3&&gameNum[1]==5)||(gameNum[1]==3&&gameNum[2]==5)||(gameNum[0]==3&&gameNum[2]==5)){
	    gameNumCombo[c]='8038';
	    c++;
	}
	if((gameNum[0]==3&&gameNum[1]==6)||(gameNum[1]==3&&gameNum[2]==6)||(gameNum[0]==3&&gameNum[2]==6)){
	    gameNumCombo[c]='8039';
	    c++;
	}
	if((gameNum[0]==4&&gameNum[1]==5)||(gameNum[1]==4&&gameNum[2]==5)||(gameNum[0]==4&&gameNum[2]==5)){
	    gameNumCombo[c]='8040';
	    c++;
	}
	if((gameNum[0]==4&&gameNum[1]==6)||(gameNum[1]==4&&gameNum[2]==6)||(gameNum[0]==4&&gameNum[2]==6)){
	    gameNumCombo[c]='8041';
	    c++;
	}
	if((gameNum[0]==5&&gameNum[1]==6)||(gameNum[1]==5&&gameNum[2]==6)||(gameNum[0]==5&&gameNum[2]==6)){
	    gameNumCombo[c]='8042';
	    c++;
	}
	if(gameNum[0]==1 || gameNum[1]==1 || gameNum[2]==1){
	    gameNumCombo[c]='8043';
	    c++;
	}
	if(gameNum[0]==2 || gameNum[1]==2 || gameNum[2]==2){
	    gameNumCombo[c]='8044';
	    c++;
	}
	if(gameNum[0]==3 || gameNum[1]==3 || gameNum[2]==3){
	    gameNumCombo[c]='8045';
	    c++;
	}
	if(gameNum[0]==4 || gameNum[1]==4 || gameNum[2]==4){
	    gameNumCombo[c]='8046';
	    c++;
	}
	if(gameNum[0]==5 || gameNum[1]==5 || gameNum[2]==5){
	    gameNumCombo[c]='8047';
	    c++;
	}
	if(gameNum[0]==6 || gameNum[1]==6 || gameNum[2]==6){
	    gameNumCombo[c]='8048';
	    c++;
	}
	if(gameNum[3]==2){
	    gameNumCombo[c]='8049';
	    c++;
	}
	if(gameNum[3]==1){
	    gameNumCombo[c]='8050';
	    c++;
	}
	if(gameNum[4]==1 && gameNum[3]!=0){
	    gameNumCombo[c]='8051';
	    c++;
	}
	if(gameNum[4]==0 && gameNum[3]!=0){
	    gameNumCombo[c]='8052';
	    c++;
	}
	return [gameNumCombo];
}