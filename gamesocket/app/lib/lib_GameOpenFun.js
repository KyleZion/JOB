module.exports = function lib_GameOpenFun(pomelo,app,async,redis,dbslave,dbmaster,GameID,GameZone){
	const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
	const md5 = require('md5');
	//console.log("lib_OpenGame:"+GameZone);
	// ------ games -------------------------------------------------------------
	// 設定Games 狀態 為已經結算
	this.SelectGameControlConfig= function(paramName,gameType,gameZone,callback){
		var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
        var args = [paramName,gameType,gameZone];
        dbslave.query(sql,args,function(data){
            if(data.ErrorCode==0){
                callback(data.rows[0].value);
            }else{
                callback(null);
            }
        });
	}
	this.UpdateGamesStatusToCalculated= function(AutoIndex,callback){
		dbmaster.update('UPDATE games_'+GameID+' SET gas009 = ? , gas012 = ? where id = ? and gas004 = ?',[1,1,AutoIndex,GameZone],function(data){	
			if(data.ErrorCode==0)
				callback(true);
			else
				callback(false);
		});
	}
	// 新增期數
	this.InsertPeriod= function(Period,start,stop,callback){
		var struct_games = GetStruct_SQL();
		struct_games.params.gas002 = GameID;
		struct_games.params.gas003 = Period;
		struct_games.params.gas004 = GameZone;
		struct_games.params.start = start;
		struct_games.params.stop = stop;
		struct_games.params.gas009 = 0;
		struct_games.params.created_at = start;
		struct_games.params.updated_at = start;
		var init_Game = GetLibSQL_games(struct_games);
		init_Game.Insert(function(res){
			if(!!res){
				InsertID=res;
				callback(InsertID);
			}
			else{
				callback(0);
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