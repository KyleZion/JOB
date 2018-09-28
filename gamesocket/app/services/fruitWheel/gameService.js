//const exp = module.exports;
const pomelo = require('pomelo');
const app = pomelo.app;
const dbmaster =app.get('dbmaster');
const dbslave = app.get('dbslave');
const async = require('async');
const asyncLoop = require('node-async-loop');
const logger = require('pomelo-logger').getLogger('Service-log',__filename);

module.exports.CalculateBet= async function(gamesID,gameNum,opBet,gameZone,bonusRate){
	const gameSql = new(require(app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,app,app.get('EGAMEID'),gameZone);
	//console.log(opBet);
	if(gameNum==7 && bonusRate!==0){
		let res = await gameSql.UpdateBetStatusToOpened(gamesID,gameZone);
		let res2 = await idWinMoneysResult(opBet,bonusRate,gamesID,gameZone,-1);
		return {'ErrorCode': 0,'ErrorMessage': '','result':results}
	}else{
		let multiple = getMultiple(gameNum);
		let Odds = getOdds(gameZone);
		var winResult=[];
			var item=0;
			for(var i=0;i<opBet.length;i++)
			{
				var betValue = opBet[i].bet014.split(",");
					for(var key in betValue)
					{
						if(betValue[key]!=0)
						{
							if(key==gameNum)
							{
								winResult[item]=opBet[i];//此處不可用winResult[i]
								winResult[item].Val=betValue[key];
								item++;
							}
						}
					}
			}
		await gameSql.UpdateBetStatusToOpened(gamesID,gameZone);
		if(winResult.length!=0){
			let WinResult = await idWinMoneysResult(winResult,multiple,gamesID,gameZone,Odds);
				if(WinResult.result ==200)
					return ({'ErrorCode': 0,'ErrorMessage': '','result':200});
		}else{
			return 0;
		}
	}
	/*if(gameNum==7 && bonusRate!==0){
		async.series({
			A: function(callback_A){
				dbmaster.update('UPDATE bet_g51 SET betstate=1 where bet009 = ? and bet003 = ? and bet012= ? ',[gamesID,0,gameZone],function(data){
					if(data.ErrorCode==0){
						callback_A(null,0);
					}else{
						console.log("開獎錯誤");
						callback_A(-1,'開獎錯誤');
					}
				});
			},
			B: function(callback_B){
				idWinMoneysResult(dbmaster,dbslave,opBet,bonusRate,gamesID,gameZone,-1,function(data){
					if(data.ErrorCode==0){
						callback_B(null,data.result);
					}else{
						callback_B(-2,data.ErrorMessage);
					}
				});	
			}
		},
		function(err, results) {
			if(err){
				callback_Calculate({'ErrorCode':err,'ErrorMessage':results});
			}else{
				callback_Calculate({'ErrorCode': 0,'ErrorMessage': '','result':results});
			}
		});
	}else{
		async.waterfall([
			function(callback)
			{
				var multiple=1;
				switch(gameNum)
				{
					case 0:
						multiple=58;
						break;
					case 1:
						multiple=28;
						break;
					case 2:
						multiple=14;
						break;
					case 3:
						multiple=11;
						break;
					case 4:
						multiple=7;
						break;
					case 5:
						multiple=3;
						break;
					case 6:
						multiple=2;
						break;
				}
				callback(null,multiple);
			},
			function(multiple,callback)
			{
				var Odds=1; //區號倍數
				switch(gameZone)
				{
					case 101:
						Odds = 1
						break;
					case 102:
						Odds = 2
						break;
					case 105:
						Odds = 5
						break;
					case 110:
						Odds = 10
						break;
				}
				callback(null,multiple,Odds);
			},
			function(multiple,Odds,callback)
			{
				var winResult=[];
				var item=0;
				for(var i=0;i<opBet.length;i++)
				{
					var betValue = opBet[i].bet014.split(",");
						for(var key in betValue)
						{
							if(betValue[key]!=0)
							{
								if(key==gameNum)
								{
									winResult[item]=opBet[i];//此處不可用winResult[i]
									winResult[item].Val=betValue[key];
									item++;
								}
							}
						}
				}
				callback(null,winResult,multiple,Odds);		
			},
			function(winResult,multiple,Odds,callback){
				dbmaster.update('UPDATE bet_g51 SET betstate=1 where bet009 = ? and bet003 = ? and bet012= ? ',[gamesID,0,gameZone],function(data){
					if(data.ErrorCode==0){
						//console.log("開獎完畢進入派獎");
						//console.log(winResult);
						callback(null,winResult,multiple,Odds);
					}else{
						console.log("開獎錯誤");
						callback(-1,'開獎錯誤');
					}
				});
			},
			function(winResult,multiple,Odds,callback){
				if(winResult.length!=0){
					idWinMoneysResult(dbmaster,dbslave,winResult,multiple,gamesID,gameZone,Odds,function(data){
						if(data.ErrorCode==0){
							callback(null,data.result);
						}else{
							callback(-2,data.ErrorMessage);
						}
					});	
				}else{
					callback(null,'No One Win and No Enter idWinMoneysResult');
				}
			}
		],
			function(err,value){
				if(err){
					callback_Calculate({'ErrorCode':err,'ErrorMessage':value});
				}else{
					callback_Calculate({'ErrorCode': 0,'ErrorMessage': '','result':value});
				}

		});
	}*/
}

async function idWinMoneysResult(winResult,multiple,gamesID,gameZone,Odds)
{
	var award =0;
	asyncLoop(winResult,async function (item, next)
	{
		if(Odds>0){
			award=(Number(item.Val) * Odds * multiple);
		}else{
			award=(Number(item.bet017) * multiple);
		}

		var struct_betgop = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
		var lib_gameop = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("bet_g51",struct_betgop);
		struct_betgop.params.betstate = 1;
		struct_betgop.params.betwin = 1;
		struct_betgop.params.bet018 = multiple;
		struct_betgop.params.bet032 = award;
		if(Odds>0){
			struct_betgop.params.bet033 = item.Val;
		}else{
			struct_betgop.params.bet033 = item.bet017;
		}
		struct_betgop.where.bet002 = item.bet002;
		struct_betgop.where.bet003 = 0;
		struct_betgop.where.bet012 = gameZone;
		let res1 = await lib_gameop.Update2();
		let res2 = await gameSql.GetUserMoneyMaster(item.bet005);

		var struct_amount = new (require(app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
		struct_amount.params.type = 4;
		struct_amount.params.game_id = '51';
		struct_amount.params.game_name = gamesID;
		struct_amount.params.transfer_no = item.bet002;
		struct_amount.params.mid = item.bet005;
		struct_amount.params.money = award;
		struct_amount.params.balance = memmoney;
		struct_amount.params.created_at = formatDate()+" "+formatDateTime();
		struct_amount.params.updated_at = formatDate()+" "+formatDateTime();
		var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
		let res3 = await lib_amount.Insert();
		let res4 = await gameSql.UpdateUserMoneyMaster(item.bet005,award,0);
		if(res1 && res2 && res3 && res4)
			next(null)
		else
			next(err);
	 	//-------------------------------------------------------------------------------------------------

		//console.log(item.Val);
	    // Get object key with: item.key 
	    // Get associated value with: item.value 
	}, function (err)
	{
		if(err){
			return ({'ErrorCode': err,'ErrorMessage': err});
		}else{
			return ({'ErrorCode': 0,'ErrorMessage': '','result': 200});}
	});
}

function getMultiple(gameNum){
	let multiple=1;
	switch(gameNum)
	{
		case 0:
			multiple=58;
			break;
		case 1:
			multiple=28;
			break;
		case 2:
			multiple=14;
			break;
		case 3:
			multiple=11;
			break;
		case 4:
			multiple=7;
			break;
		case 5:
			multiple=3;
			break;
		case 6:
			multiple=2;
			break;
	}
	return multiple;
}

function getOdds(gameZone){
	let Odds = 1;
	switch(gameZone)
	{
		case 101:
			Odds = 1
			break;
		case 102:
			Odds = 2
			break;
		case 105:
			Odds = 5
			break;
		case 110:
			Odds = 10
			break;
	}
	return Odds;
}

function formatDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function formatDateTime() {
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds();

    if (h.length < 2) h = '0' + h;
    if (m.length < 2) m = '0' + m;
    if (s.length < 2) s = '0' + s;

    return [h, m, s].join(':');
}