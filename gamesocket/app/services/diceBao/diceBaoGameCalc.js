module.exports = function diceBaoGameCalc(redis,dbslave,dbmaster,messageService,gameZone,CasinoId){
	const pomelo = require('pomelo');
	const async =require('async');
	const code = require(pomelo.app.getBase()+'/app/consts/code.js');
	//const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
	//const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
	const gameSql = new(require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
	const diceBaoService = require('./diceBaoService.js');
	// ------ games -------------------------------------------------------------
	this.GameCalc = function(gameID,reCalc,callback_gameOpen){
		var sum = 0;
		var gameNumComb;
		var twoSameCount = 0 ;
		var threeSameCount = 0;

		async.waterfall([
			function(callback) {
				var gameNum = [];
				/*gameNum[0] = 1;
				gameNum[1] = 3;
				gameNum[2] = 5;*/
				gameNum[0] = Math.floor((Math.random() * 6) + 1);
				gameNum[1] = Math.floor((Math.random() * 6) + 1);
				gameNum[2] = Math.floor((Math.random() * 6) + 1);
				var tmp=0;
				for(var i=0;i<gameNum.length;i++){
					for(var j=i+1;j<gameNum.length;j++){
						if(gameNum[i]>gameNum[j]){
						tmp=gameNum[i];
						gameNum[i]=gameNum[j];
						gameNum[j]=tmp;
						}
					}
				}
				//console.log("52開獎號:"+gameNum);
				callback(null,gameNum);//將gameNum傳到第二層
			},
			function(gameNum,callback){
				sum = gameNum[0]+gameNum[1]+gameNum[2];

				if((gameNum[0]==gameNum[1]) && (gameNum[1]==gameNum[2]))
					gameNum[3] = 0;
				else if(gameNum[0]+gameNum[1]+gameNum[2]<=10)
					gameNum[3] = 1;
				else if(gameNum[0]+gameNum[1]+gameNum[2]>10)
					gameNum[3] = 2;
				else
					gameNum[3] = 404;

				if(sum%2==0)
					gameNum[4] = 0;
				else
					gameNum[4] = 1;

				transGameNum(gameNum,sum).then(data =>{
					gameNumComb = data[0];
					threeSameCount = data[1];
					twoSameCount = data[2];
					callback(null,gameNum);//將gameNum傳到第二層
				}).catch(error =>{
					callback(1,error);//將error傳到第二層
				});
			},
			function(gameNum,callback){
				gameSql.InsertNumber(gameID,gameNum.join(','),function(res){
					if(res){
						console.log('寫獎號完成:'+gameNum);
						callback(null,gameNum);
					}
				});
			},
			function(gameNum,callback){
				//select 本期下注成功的注單
				dbslave.query('SELECT id,betkey,bet005,bet014,bet017 FROM bet_g52 where bet009 = ? and bet003 = ? and bet012 = ? and bet014 IN (?)  order by id',[gameID,0,gameZone,gameNumComb],function(data){
					if(data.ErrorCode==0){
						//開始結算 
						//console.log(data);
						diceBaoService.CalculateBet(dbmaster,dbslave,gameID,gameNum,sum,data.rows,gameZone,twoSameCount,threeSameCount,function(data){
							if(data.ErrorCode==0){
								callback(null,gameNum);
								console.log('結算完成');
							}else{
								console.log('結算錯誤');
								callback(data.ErrorCode,data.ErrorMessage);
							}
						});
					}
				});
			},
			function(gameNum,callback){
				//更新games gas012 已結算
				gameSql.UpdateGamesStatusToCalculated(gameID,function(res){
					if(res){
						console.log(gameID+'期已結算結果');
						if(!reCalc){ //若不是補開獎
							messageService.broadcast('connector','diceBaogameop'+gameZone,{'gameNum':gameNum,'gameNumComb':gameNumComb});
							redis.hset('GS:GAMESERVER:diceBao', "lastGameNum"+gameZone, gameNum.toString());
							redis.hset('GS:GAMESERVER:diceBao', "lastGameComb"+gameZone, gameNumComb.toString());
						}
						callback(null,gameNum);
					}else{
						callback(1,code.SQL_ERROR)
					}
				});
			}
		],function(err, results) {
			if(err){
				callback_gameOpen(results);
			}else{
				callback_gameOpen(code.OK);
			}
		});
	}
}



async function transGameNum(gameNum,numSum)
{
	var gameNumCombo = new Array();
	let threeSameCount = 0;
	let twoSameCount = 0;
	var c=0;
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==1)){
	    gameNumCombo[c]='8001';
	    threeSameCount = 1;
	    c++;
  	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==2)){
	    gameNumCombo[c]='8002';
	    threeSameCount = 2;
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==3)){
	    gameNumCombo[c]='8003';
	    threeSameCount = 3;
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==4)){
	    gameNumCombo[c]='8004';
	    threeSameCount = 4;
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==5)){
	    gameNumCombo[c]='8005';
	    threeSameCount = 5;
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==6)){
	    gameNumCombo[c]='8006';
	    threeSameCount = 6;
	    c++;
	}
	if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])){
	    gameNumCombo[c]='8007';
	    c++;
	}
	if((gameNum[0]==1 && gameNum[1]==1) || (gameNum[1]==1 && gameNum[2]==1)){
	    gameNumCombo[c]='8008';
	    twoSameCount = 1;
	    c++;
	}
	if((gameNum[0]==2 && gameNum[1]==2) || (gameNum[1]==2 && gameNum[2]==2)){
	    gameNumCombo[c]='8009';
	    twoSameCount = 2;
	    c++;
	}
	if((gameNum[0]==3 && gameNum[1]==3) || (gameNum[1]==3 && gameNum[2]==3)){
	    gameNumCombo[c]='8010';
	    twoSameCount = 3;
	    c++;
	}
	if((gameNum[0]==4 && gameNum[1]==4) || (gameNum[1]==4 && gameNum[2]==4)){
	    gameNumCombo[c]='8011';
	    twoSameCount = 4;
	    c++;
	}
	if((gameNum[0]==5 && gameNum[1]==5) || (gameNum[1]==5 && gameNum[2]==5)){
	    gameNumCombo[c]='8012';
	    twoSameCount = 5;
	    c++;
	}
	if((gameNum[0]==6 && gameNum[1]==6) || (gameNum[1]==6 && gameNum[2]==6)){
	    gameNumCombo[c]='8013';
	    twoSameCount = 6;
	    c++;
	}
	if(numSum==4){
	    gameNumCombo[c]='8014';
	    c++;
	}
	if(numSum==5){
	    gameNumCombo[c]='8015';
	    c++;
	}
	if(numSum==6){
	    gameNumCombo[c]='8016';
	    c++;
	}
	if(numSum==7){
	    gameNumCombo[c]='8017';
	    c++;
	}
	if(numSum==8){
	    gameNumCombo[c]='8018';
	    c++;
	}
	if(numSum==9){
	    gameNumCombo[c]='8019';
	    c++;
	}
	if(numSum==10){
	    gameNumCombo[c]='8020';
	    c++;
	}
	if(numSum==11){
	    gameNumCombo[c]='8021';
	    c++;
	}
	if(numSum==12){
	    gameNumCombo[c]='8022';
	    c++;
	}
	if(numSum==13){
	    gameNumCombo[c]='8023';
	    c++;
	}
	if(numSum==14){
	    gameNumCombo[c]='8024';
	    c++;
	}
	if(numSum==15){
	    gameNumCombo[c]='8025';
	    c++;
	}
	if(numSum==16){
	    gameNumCombo[c]='8026';
	    c++;
	}
	if(numSum==17){
	    gameNumCombo[c]='8027';
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
	return [gameNumCombo,threeSameCount,twoSameCount];
}