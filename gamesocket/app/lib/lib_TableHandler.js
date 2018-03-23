module.exports = function lib_TableHandler(pomelo,async,redis,dbslave,dbmaster,messageService,GameName,CasinoId){

	const code = require(pomelo.app.getBase()+'/app/consts/code.js');
	const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
	const gameDao = require(pomelo.app.getBase()+'/app/dao/gameDao');
	// ------ games -------------------------------------------------------------
	this.GetGameSet = function(GameName,GameZone,callback){
		redis.hget('GS:GAMESERVER:'+GameName, "GameSet"+GameZone, function (err, res) {
			if(err){
				callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
			}else{
				if(res==null){
					async.waterfall([
						function(cb) {
							gameDao.getGameSet(CasinoId,GameZone,cb);
						}
					], 
						function(err,resDao) {
							if(err) {
								callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
							}else{
								var GameSet = resDao.substring(8)
								callback({'ErrorCode':code.OK,'ErrorMessage':'','GameSet':GameSet});
							}
						}
					);
				}else{ //success
					callback({'ErrorCode':code.OK,'ErrorMessage':'','GameSet':res});
				}
			}
		});
	}
	this.GetGameID = function(GameName,GameZone,callback){
		redis.hget('GS:GAMESERVER:'+GameName, "GameID"+GameZone, function (err, res) {
			if(err){
				callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
			}else{
				if(res==null){
					async.waterfall([
						function(cb) {
							gameDao.getGameId(CasinoId,GameZone,cb);
						}
					], 
						function(err,resDao) {
							if(err) {
								callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
							}else{
								callback({'ErrorCode':code.OK,'ErrorMessage':'','ID':resDao});
							}
						}
					);
				}else{ //success
					console.log('aaa');
					callback({'ErrorCode':code.OK,'ErrorMessage':'','ID':res});
				}
			}
		});
	}
	this.GetUserMoneyMaster = function(mid,callback){
		dbmaster.query('SELECT mem100 FROM users where mid = ?',[mid],function(data){ //duegame
			if(data.ErrorCode==0){
				callback({'ErrorCode':code.OK,'ErrorMessage':'','Money':data.rows[0].mem100}); 
			}else{
				callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
			}
		});
	}
	this.GetTimeZone = function(GameName,GameZone,callback){
		let nowtime = PUB.formatDate()+" "+PUB.formatDateTime();
		redis.hget('GS:GAMESERVER:'+GameName, "endTime"+GameZone, function (err, res) {
			if(err){
				callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
			}else{
				if(res==null){
					async.waterfall([
						function(cb) {
							gameDao.getTimezone(nowtime,GameZone,CasinoId,cb);
						}
					], 
						function(err,resDao) {
							if(err) {
								callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
							}else{
								callback({'ErrorCode':code.OK,'ErrorMessage':'','TimeZone':resDao});
							}
						}
					);
				}else{
					var endtime = res;
					var timezone = (Date.parse(endtime)-Date.parse(nowtime))/1000;
					next({'ErrorCode':code.OK,'ErrorMessage':'','TimeZone':timezone});
				}
			}
		});
	}
	this.GetHistory = function(GameName,GameZone,count,callback){
		switch(count){
			case 20:
				redis.hget('GS:GAMESERVER:'+GameName, "gameHistory"+GameZone, function (err, res) {
					if(err){
						callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
					}else{
						if(res==null){
							async.waterfall([
								function(cb) {
									gameDao.getHistory(count,CasinoId,cb);
								}
							], 
								function(err,resDao) {
									if(err) {
										callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
									}else{
										let history = resDao.split("|");
										callback({'ErrorCode':code.OK,'ErrorMessage':'','History':history});
									}
								}
							);
						}else{ //success
							let history = res.split("|");
							callback({'ErrorCode':code.OK,'ErrorMessage':'','History':history});
						}
					}
				});
				break;
			case 10:
				redis.hgetall('GS:GAMESERVER:'+GameName, function (err, res) {
					if(err){
						callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
					}else{
						if(res==null){
							async.waterfall([
								function(cb) {
									gameDao.getHistory(count,CasinoId,cb);
								}
							], 
								function(err,resDao) {
									if(err) {
										callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
									}else{
										callback({'ErrorCode':code.OK,'ErrorMessage':'','History':resDao});
									}
								}
							);
						}else{ //success
							var record = new Array();
							record[0] = res.lobbyHistory111;
							record[1] = res.lobbyHistory222;
							record[2] = res.lobbyHistory333;
							callback({'ErrorCode':code.OK,'ErrorMessage':'','History':record});
						}
					}
				});
				break;
			default:
				callback({'ErrorCode':code.PARAM_ERROR,'ErrorMessage':'PARAM_ERROR','History':'000'});
		}
	}
	this.GetStatus = function(GameName,GameZone,callback){
		if(GameZone==0){ 
			redis.hgetall('GS:GAMESERVER:'+GameName, function (err, res) {
					if(err){
						callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
					}else{
						if(res==null){ //沒有大廳用的dao???
							async.waterfall([
								function(cb) {
									gameDao.getStatus(GameZone,CasinoId,cb);
								}
							], 
								function(err,resDao) {
									if(err) {
										callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
									}else{
										callback({'ErrorCode':code.OK,'ErrorMessage':'','GetStatus':resDao});
									}
								}
							);
						}else{ //success
							var record = new Array();
							record[0] = res.Status111;
							record[1] = res.Status222;
							record[2] = res.Status333;
							callback({'ErrorCode':code.OK,'ErrorMessage':'','GetStatus':record});
						}
					}
			});
		}else{
			redis.hget('GS:GAMESERVER:'+GameName, "Status"+GameZone, function (err, res) {
				if(err){
					callback({'ErrorCode':code.REDIS_ERROR,'ErrorMessage':'RedisError'});
				}else{
					if(res==null){
						async.waterfall([
							function(cb) {
								gameDao.getStatus(GameZone,CasinoId,cb);
							}
						], 
							function(err,resDao) {
								if(err) {
									callback({'ErrorCode':code.SQL_ERROR,'ErrorMessage':'SQLError'});
								}else{
									callback({'ErrorCode':code.OK,'ErrorMessage':'','GetStatus':resDao});
								}
							}
						);
					}else{ //success
						callback({'ErrorCode':code.OK,'ErrorMessage':'','GetStatus':res});
					}
				}
			});
		}
	}
	this.UpdateUserMoneyMaster = function(callback,mid,shiftMoney){
		dbmaster.update('UPDATE users SET mem100 = mem100 + ? where mid = ?',[shiftMoney,mid],function(data){  //egame
	 		if(data.ErrorCode==0){
	 			callback(true);
	 		}else{
	 			callback(false);
	 		}
	 	});
	}
	this.InsertBetsAmountLog = function(type,PeriodID,transfer_no,mid,shiftMoney,balance,callback){
		var struct_amount = GetStruct_SQL(); //amount_log SQL
		struct_amount.params.type = type;//4;
		struct_amount.params.game_id = CasinoId;
		struct_amount.params.game_name = PeriodID;
		struct_amount.params.transfer_no = transfer_no;
		struct_amount.params.mid = mid;
		struct_amount.params.money = shiftMoney;
		struct_amount.params.balance = memmoney;
		struct_amount.params.created_at = formatDate()+" "+formatDateTime();
		struct_amount.params.updated_at = formatDate()+" "+formatDateTime();
		var lib_amount = GetLibSQL_amountlog(struct_amount);
		lib_amount.Insert(function(id){
			if(!!id){
		      	callback(true);
			}else{
		      	callback(false);
			}
	    	
	    });
	}
	// ------ -------------------------------------------------------------
	function GetStruct_SQL(){
		return new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
	}
	function GetLibSQL_games(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_"+CasinoId,Struct_SQL)
	}
	function GetLibSQL_betg(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g"+CasinoId,Struct_SQL)
	}
	function GetLibSQL_amountlog(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",Struct_SQL)
	}
	// ------ -------------------------------------------------------------




}