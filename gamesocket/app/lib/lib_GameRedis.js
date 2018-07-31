module.exports = function lib_GameRedis(pomelo,app,GameID,GameZone){
	const dbslave = app.get('dbslave');
	const dbmaster = app.get('dbmaster');
	const redis = app.get('redis');
	const async = app.get('async');
	const PUB = new(require(app.getBase()+'/app/lib/public_fun.js'))();
	const md5 = require('md5');
	const code = require(pomelo.app.getBase()+'/app/consts/code.js');
	//console.log("lib_OpenGame:"+GameZone);
	// ------ games -------------------------------------------------------------
	// 設定Games 狀態 為已經結算
	this.RedisLockAccount= function(uid,callback){
		redis.sismember("GS:lockAccount:"+GameID,uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:"+GameID,uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(code.ERR_LOCKACCOUNT,'LockAccount未解除');
          }
        });
	}

	// ------ -------------------------------------------------------------
	function GetStruct_SQL(){
		return new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
	}
	function GetLibSQL_games(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_"+GameID,Struct_SQL)
	}
	function GetLibSQL_betg(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g"+GameID,Struct_SQL)
	}
	function GetLibSQL_amountlog(Struct_SQL){
		return new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",Struct_SQL)
	}
	// ------ -------------------------------------------------------------




}