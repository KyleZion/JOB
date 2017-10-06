var exp = module.exports;
var async = require('async');
var pomelo = require('pomelo');
var asyncLoop = require('node-async-loop');
var serverIP='127.0.0.1';

exp.CalculateBet=function(dbmaster,dbslave,gamesID,gameNum,opBet,callback_Calculate){
	async.waterfall([
		function(callback){
			var multiple=1;
			switch(gameNum){
				case 0:
					multiple=57
					break;
				case 1:
					multiple=27
					break;
				case 2:
					multiple=13
					break;
				case 3:
					multiple=10
					break;
				case 4:
					multiple=6
					break;
				case 5:
					multiple=2
					break;
				case 6:
					multiple=1
					break;
			}
			callback(null,multiple);
		},
		function(multiple,callback){
			var winResult=[];
			var item=0;
			for(var i=0;i<opBet.length;i++){
				var betValue = opBet[i].bet014.split(",");
					for(var key in betValue){
						if(betValue[key]!=0){
							if(key==gameNum){
								console.log("中:"+opBet[i].bet005);
								winResult[item]=opBet[i];//此處不可用winResult[i]
								winResult[item].Val=betValue[key];
								item++;
							}
						}
					}
			}
			callback(null,winResult,multiple);
		},
		function(winResult,multiple,callback){
			console.log("開獎完畢:"+gamesID)
			dbmaster.update('UPDATE bet_g51 SET betstate=1 where bet009 = ? and bet003 = ? ',[gamesID,0],function(data){
				if(data.ErrorCode==0){
					console.log("開獎完畢進入派獎");
					callback(null,winResult,multiple);
				}else{
					console.log("開獎錯誤");
					callback(-1,'開獎錯誤');
				}
			});
			
		},
		function(winResult,multiple,callback){
			if(winResult.length!=0){
				idWinMoneysResult(dbmaster,dbslave,winResult,multiple,function(data){
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
				console.log("idWinMoneysResultCallBack:")
				console.log(value);
				callback_Calculate({'ErrorCode': 0,'ErrorMessage': '','result':value});
			}

		});
}

function idWinMoneysResult(dbmaster,dbslave,winResult,multiple,callback_Win)
{
	if(winResult.length==0){
		callback_Win( {'ErrorCode': 0,'ErrorMessage': '','result':null});
	}
	var award =0;
	asyncLoop(winResult, function (item, next)
	{
		award=(item.Val * multiple) + Number(item.Val);
		//var tmp=[item.bet002,item.bet005];
		async.waterfall([
			//先更新注單並寫入中獎金額
			function(callback){
				var args=[1,1,award,item.Val,0,item.bet002]
				dbmaster.update('UPDATE bet_g51 SET betstate = ?, betwin = ?, bet032 = ?,bet033 = ? where bet003 = ? and bet002 = ?',args,function(data){
	    			if(data.ErrorCode==0){
	    				//console.log("資料庫派獎betg更新成功");
	    				callback(null,award);
	    			}else{
	    				callback(1,'派獎betg錯誤')
	    			}
	  	 		});
			},
			//取得中獎注單帳號餘額
			function(award, callback){
				//dbslave.query('SELECT mem100 FROM member where mem001 = ?',[item.bet005],function(data){ //nsc
				dbslave.query('SELECT mem006 FROM member2 where mem002 = ?',[item.bet005],function(data){ //egame
					if(data.ErrorCode==0){//開始結算
						//callback(null,data.rows[0].mem100,award); //nsc
						callback(null,data.rows[0].mem006,award); //egame
					}else{
						callback(1,'取得中獎注單帳號餘額錯誤');
					}
				});
			},
			//寫入amount_log
			function(memmoney, award, callback){
				var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
				struct_amount.params.transfer_type = 22;
				struct_amount.params.transfer_no = item.bet002;
				struct_amount.params.from_mid = 0;
				struct_amount.params.from_gkey = 'CTL';
				struct_amount.params.from_balance = 0;
				struct_amount.params.to_mid = item.bet005;
				struct_amount.params.to_gkey = 'MAIN';
				struct_amount.params.to_balance = memmoney;
				struct_amount.params.amount = award;
				struct_amount.params.operator = 0;
				struct_amount.params.uip = serverIP;
				struct_amount.params.otype = 'c';
				struct_amount.params.gameid = '51';
				struct_amount.params.bydate = formatDate();
				var lib_amount = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("member_amount_log",struct_amount);
				lib_amount.Insert(function(id){
					if(!!id){
						//amountlogid = id;
				    	//console.log('insert amount_log_new success');
				      	callback(null,award);
					}else{
						console.log('insert amount_log_ fail');
				      	callback(1,'insert amount_log_ fail');
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
			 	//dbmaster.update('UPDATE member SET mem100 = mem100 + ? where mem001 = ?',[award,item.bet005],function(data){ //nsc
			 	dbmaster.update('UPDATE member2 SET mem006 = mem006 + ? where mem002 = ?',[award,item.bet005],function(data){  //egame
	 		 		if(data.ErrorCode==0){
	   		 			//console.log('UPDATE mem success');
	   		 			callback(null,200);
	   		 		}else{
	   		 			callback(1,'餘額更新錯誤');
	   		 		}
	   		 	});
			}
			//錯誤則顯示沒有則返回
		],	function (err, result) {
			if(err){
				callback_Win({'ErrorCode': 1,'ErrorMessage': result});
			}

		});
		//console.log(item.Val);
	    // Get object key with: item.key 
	    // Get associated value with: item.value 
	    next();
	}, function ()
	{
		callback_Win({'ErrorCode': 0,'ErrorMessage': '','result': 200});
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