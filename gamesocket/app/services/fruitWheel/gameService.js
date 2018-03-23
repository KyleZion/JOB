var exp = module.exports;
var async = require('async');
var pomelo = require('pomelo');
var asyncLoop = require('node-async-loop');
var logger = require('pomelo-logger').getLogger('Service-log',__filename);
var serverIP='127.0.0.1';

exp.CalculateBet=function(dbmaster,dbslave,gamesID,gameNum,opBet,gameZone,bonusRate,callback_Calculate){
	//console.log(opBet);
	if(gameNum==7 && bonusRate!==0){
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
						break;7
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
	}
}

function idWinMoneysResult(dbmaster,dbslave,winResult,multiple,gamesID,gameZone,Odds,callback_Win)
{
	var award =0;
	asyncLoop(winResult, function (item, next)
	{
		if(Odds>0){
			award=(Number(item.Val) * Odds * multiple);
		}else{
			award=(Number(item.bet017) * multiple);
		}
		async.waterfall([
			//先更新注單並寫入中獎金額
			function(callback)
			{
				var struct_betgop = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
				var lib_gameop = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g51",struct_betgop);
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
				lib_gameop.Update(function(res){
					if(!res){
						callback(null,award);
					}else{
						callback(1,res);
					}
				});
				/*var args=[1,1,award,item.Val,0,item.bet002,gameZone]
				dbmaster.update('UPDATE bet_g51 SET betstate = ?, betwin = ?, bet032 = ?,bet033 = ? where bet003 = ? and bet002 = ? and bet012 = ?',args,function(data){
	    			if(data.ErrorCode==0){
	    				//console.log("資料庫派獎betg更新成功");
	    				callback(null,award);
	    			}else{
	    				callback(500,'派獎betg錯誤');
	    			}
	  	 		});*/
			},
			//取得中獎注單帳號餘額
			function(award, callback)
			{
				dbmaster.query('SELECT mem100 FROM users where mid = ?',[item.bet005],function(data){ //duegame
					if(data.ErrorCode==0){//開始結算
						callback(null,data.rows[0].mem100,award); //duegame
					}else{
						callback(501,'取得中獎注單帳號餘額錯誤');
					}
				});
			},
			//寫入amount_log
			function(memmoney, award, callback){
				var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
				struct_amount.params.type = 4;
				struct_amount.params.game_id = '51';
				struct_amount.params.game_name = gamesID;
				struct_amount.params.transfer_no = item.bet002;
				struct_amount.params.mid = item.bet005;
				struct_amount.params.money = award;
				struct_amount.params.balance = memmoney;
				struct_amount.params.created_at = formatDate()+" "+formatDateTime();
				struct_amount.params.updated_at = formatDate()+" "+formatDateTime();
				var lib_amount = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
				lib_amount.Insert(function(id){
					if(!!id){
						//amountlogid = id;
				    	//console.log('insert amount_log_new success');
				      	callback(null,award);
					}else{
						//console.log('insert amount_log_ fail');
				      	callback(502,'insert amount_log fail');
					}
			    	
			    });
				/*var amountlogSqls=[];
				amountlogSqls=[22,item.bet002, 0,'CTL',0,item.bet005,'MAIN',memmoney,award,0,serverIP,'c','51',formatDate()];
				var sql="INSERT INTO member_amount_log (transfer_type, transfer_no, from_mid, from_gkey, from_balance, to_mid, to_gkey, to_balance, amount, operator, uip, otype, gameid, bydate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
				dbmaster.insert(sql,amountlogSqls,function(data){
					if(data.ErrorCode==0){
					//console.log('insert amount_log success');
					callback(null,award);
					//console.log(amountlogSqls);
					}else{
						callback(1,'派獎amount_log錯誤');
					}
				});*/
			},
			//最後再更新帳號餘額
			function(award, callback){
			 	dbmaster.update('UPDATE users SET mem100 = mem100 + ? where mid = ?',[award,item.bet005],function(data){  //egame
	 		 		if(data.ErrorCode==0){
	   		 			callback(null,200);
	   		 		}else{
	   		 			callback(503,'更新member餘額發生DB錯誤');
	   		 		}
	   		 	});
			}
			//錯誤則顯示沒有則返回
		],function (err, result) 
		{
			if(err){
				next(err); //有錯誤則終止派獎
			}else{
				next(null);//沒有錯誤繼續派獎
			}

		});
		//console.log(item.Val);
	    // Get object key with: item.key 
	    // Get associated value with: item.value 
	}, function (err)
	{
		if(err){
			callback_Win({'ErrorCode': err,'ErrorMessage': err});
		}else{
			callback_Win({'ErrorCode': 0,'ErrorMessage': '','result': 200});}
	});
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