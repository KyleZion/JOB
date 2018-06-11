async.series({
//=============================================================
	A:function(callback_A){
		var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
		struct_amount.params.type = 3;
		struct_amount.params.game_id = '52';
		struct_amount.params.game_name = gameID;
		struct_amount.params.mid = session.uid;
		betPlay=betData[count].split(':');
	    //mid,金額,amountlogSQL
		lib_games.DeductMoney(session.uid,betPlay[1],struct_amount,function(result)
		{
		  switch(result)
		  {
		    case -1:
		      console.log('查無此id');
		      callback_A(-1,result);
		      break;
		    case -2:
		      console.log('餘額不足');
		      callback_A(-2,result);
		      break;
		    case -3:
		      console.log('扣款失敗');
		      callback_A(-3,result);
		      break;
		    case -4:
		      console.log('寫log失敗');
		      callback_A(-4,result);
		      break;
		    default:
		       //result  是扣款成功後 寫入amount 的id
		      logId=result;
		      callback_A(0,result);
		      break;
		  }
		});
	},
	B: function(callback_B){
		//betkey=gid+session.uid+new Date().getTime();
		if(count>=10){
			bet2=betkey+'00'+count;
		}else{
			bet2=betkey+'000'+count;
		}
		trans_no=bet2;
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
		struct_bet.params.bydate =PUB.formatDate()
		struct_bet.params.created_at = PUB.formatDate()+" "+PUB.formatDateTime();
		struct_bet.params.updated_at = PUB.formatDate()+" "+PUB.formatDateTime();
		callback_B(null,0);
	},
	C: function(callback_C){
		var lib_bet = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g52",struct_bet);
		lib_bet.Insert(function(res)
		{
			if(!!res)
			{
				//console.log(res);
				console.log('insert betg52 success');
				callback_C(0,0);
			}else{
				logger.error('Insert betg52 Error'); 
				async.parallel([
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
						callback_C(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}else{
						callback_C(1,data.ErrorMessage);
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}
				});
			}

		});
	},
	D: function(callback_D){
		var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
		struct_amount.params.transfer_no = trans_no;
		struct_amount.where.id=logId;
		var lib_amount = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
		lib_amount.Update(function(res)
		{
		    if(res==0)
		    {
			    console.log('UPDATE transfer_no success');
				callback_D(null,res);	
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
						callback_D(1,'网路连线异常');
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}else{
						callback_D(1,'网路连线异常');
						//next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'});
					}
				});
		    }
		    
		});
	}
},
	function(err, results) { //series執行結果
		if(err)//錯誤則刪單並退錢
		{
			next(null,{'ErrorCode':1,'ErrorMessage':'网路连线异常，代碼'});
		}else{
			//console.log("下注完成");
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
						afterBetMoney = resDao;
						count++;
						callback(null,count);
					}
				}
			);
		}
});