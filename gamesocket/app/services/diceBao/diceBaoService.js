const exp = module.exports;
const async = require('async');
const pomelo = require('pomelo');
const asyncLoop = require('node-async-loop');
const logger = require('pomelo-logger').getLogger('Service-log',__filename);
const serverIP='127.0.0.1';
const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
const lib_gameSql = require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js');
exp.CalculateBet=function(dbmaster,dbslave,gamesID,gameNum,numSum,opBet,gameZone,twoSameCount,threeSameCount,callback_Calculate)
{
	const gameSql = new lib_gameSql(pomelo,pomelo.app,async,null,dbslave,dbmaster,52,gameZone);
	async.waterfall([
		function(callback){
			var winResult = new Array();
			var item = 0;
			for(var i=0;i<opBet.length;i++){
				switch(opBet[i].bet014){
					case '8001':
					case '8002':
					case '8003':
					case '8004':
					case '8005':
					case '8006'://三同骰單一
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=180;
						item++;
						break;
					case '8007'://三同骰全骰
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=31;
						item++;
						break;
					case '8008':
					case '8009':
					case '8010':
					case '8011':
					case '8012':
					case '8013'://二同骰
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=11;
						item++;
						break;
					case '8014':
					case '8015':
					case '8016':
					case '8017':
					case '8018':
					case '8019':
					case '8020':
					case '8021':
					case '8022':
					case '8023':
					case '8024':
					case '8025':
					case '8026':
					case '8027'://和值
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=multipleDecide_Sum(numSum);
						item++;
						break;
					case '8028':
					case '8029':
					case '8030':
					case '8031':
					case '8032':
					case '8033':
					case '8034':
					case '8035':
					case '8036':
					case '8037':
					case '8038':
					case '8039':
					case '8040':
					case '8041':
					case '8042'://二不同骰
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=6;
						item++;
						break;
					case '8043'://單一骰 VIC 20170402 市場回報修正單骰下注賠率問題
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==1){
							winResult[item].multiple=3;
						}else if(twoSameCount==1){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8044':
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==2){
							winResult[item].multiple=3;
						}else if(twoSameCount==2){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8045':
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==3){
							winResult[item].multiple=3;
						}else if(twoSameCount==3){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8046':
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==4){
							winResult[item].multiple=3;
						}else if(twoSameCount==4){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8047':
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==5){
							winResult[item].multiple=3;
						}else if(twoSameCount==5){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8048':
						winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						if(threeSameCount==6){
							winResult[item].multiple=3;
						}else if(twoSameCount==6){
							winResult[item].multiple=2;
						}else{
							winResult[item].multiple=1;
						}
						item++;
						break;
					case '8049':
					case '8050':
					case '8051':
					case '8052'://大小單雙
					 	winResult[item]=opBet[i];
						winResult[item].Val=opBet[i].bet017;
						winResult[item].multiple=1;
						item++;
						break;
				}
			}
			callback(null,winResult);
		},
			function(winResult,callback){
			console.log("開獎完畢:"+gamesID);
			gameSql.UpdateBetStatusToOpened(gamesID,gameZone,function(res){
				if(res){
					console.log("52開獎完畢進入派獎");
					callback(null,winResult);
				}
			})
		},
		function(winResult,callback){
			if(winResult.length!=0){
				idWinMoneysResult(dbmaster,dbslave,gameSql,winResult,gamesID,function(data){
					if(data.ErrorCode==0);
					callback(null,data.result);
				});	
			}else{
				callback(null,'n200');
			}
		}
	],
		function(err,value){
			//console.log("52idWinMoneysResultCallBack:");
			console.log(value+':'+gameZone);
			callback_Calculate({'ErrorCode': 0,'ErrorMessage': ''});
		});
}

function idWinMoneysResult(dbmaster,dbslave,gameSql,winResult,gamesID,callback_Win)
	{
		if(winResult.length==0){
			callback_Win( {'ErrorCode': 0,'ErrorMessage': '','result':null});
		}
		// Get object key with: item.key 
		// Get associated value with: item.value 
		var count = 0;
		async.whilst(
			function() //test function: while test is true
			{ return count<winResult.length; },
			function(callback) {
				async.waterfall([
					//先更新注單並寫入中獎金額
					function(callback){
						var award=Number(winResult[count].Val * winResult[count].multiple)+ Number(winResult[count].Val);
						var args=[1,1,winResult[count].multiple,award,1,0,winResult[count].id]
			  	 		gameSql.SetBetsToWin(winResult[count].id,winResult[count].multiple,award,1,function(res){
							if(res){
								console.log("資料庫派獎betg52更新成功");
			    				if(winResult[count].bet032==null){
			    					winResult[count].bet032 = award;
			    				}
			    				else{
			    					winResult[count].bet032 = winResult[count].bet032 + award;
			    				}
			    				callback(null,award);
							}
						});
					},
					//取得中獎注單帳號餘額
					function(award, callback){
						if(count+1>=winResult.length){
							gameSql.GetUserMoneyMaster(winResult[count].bet005,function(res){
								if(res>=0 && res !=null)
								callback(null,res,1);
							});
						}else{
							if(winResult[count].bet005==winResult[count+1].bet005){
								winResult[count+1].bet032 =winResult[count].bet032;
								callback(null,0,-1);
							}else{
								gameSql.GetUserMoneyMaster(winResult[count].bet005,function(res){
									if(res>=0 && res !=null)
									callback(null,res,1);
								});
							}
						}
					},
					//寫入amount_log
					function(memmoney, award, callback){
						if(award==-1){
							callback(null,-1);
						}else{
							gameSql.InsertBetsAmountLog(4,gamesID,winResult[count].betkey +'0000',winResult[count].bet005,winResult[count].bet032,memmoney,function(res){
								if(res){
									callback(null,award);
								}else{
									callback(502,'insert amount_log_ fail');
								}
							});
						}
					},
					//最後再更新帳號餘額
					function(award, callback){
						if(award==-1){
							callback(null,0);
						}else{
							gameSql.UpdateUserMoneyMaster(winResult[count].bet005,winResult[count].bet032,function(){
								console.log('52UPDATE mem success');
				   		 		callback(null,0);
							});
						}
					}
					//錯誤則顯示沒有則返回
				],	function (err, result) {
					if(err){
						callback_Win(1,err);
					}else{
						count++;
						callback(null,count);
					}
					
				});
			},
			function (err, n){
				if(!err)
				{
					callback_Win( {'ErrorCode': 0,'ErrorMessage': '','result':200});
				}
			}
		);
	}
var multipleDecide_Sum = function(numSum){
		if(numSum==4 || numSum==17)
			return 62;
		if(numSum==5 || numSum==16)
			return 31;
		if(numSum==6 || numSum== 15)
			return 18;
		if(numSum==7 || numSum==14)
			return 12;
		if(numSum==8 || numSum==13)
			return 8;
		if(numSum==9 || numSum==12)
			return 7;
		if(numSum==10 || numSum==11)
			return 6;
}
var multipleDecide_Single = function(gameNum){
	if(gameNum[0]==gameNum[1] && gameNum[1]==gameNum[2] && gameNum[2]==gameNum[0]){
		return 3;
	}
	if((gameNum[0]==gameNum[1] && gameNum[0]!=gameNum[2])||(gameNum[1]==gameNum[2] && gameNum[1]!=gameNum[0])){
		return 2;
	}
	if(gameNum[0]!=gameNum[1] && gameNum[1]!=gameNum[2] && gameNum[2]!=gameNum[0]){
		return 1;
	}
	
}