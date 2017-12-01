var pomelo = require('pomelo');
var async = require('async');
var messageService = require('./messageService.js');
var exp = module.exports;
var maindiceBao = require('./maindiceBao.js');

Date.prototype.addSeconds = function(s){
	this.setSeconds(this.getSeconds()+s);
	return this;
}

exp.init = function (gameZone) {
	var dbslave =pomelo.app.get('dbslave');
	var dbmaster =pomelo.app.get('dbmaster');
	var redis =pomelo.app.get('redis');
	//先開盤
	gameMade(dbmaster,dbslave,redis,gameZone);
	//觸發局數流程控制 Control
}

var gameMade = function(dbmaster,dbslave,redis,gameZone){
	var gameID = 0;
	var Period='';
	var endtime='';
	var gameHistory='';
	var lobbyHistory='';
	async.waterfall([
		function(callback_0){ //局數顯示
			redis.hget('GS:GAMESERVER:diceBao',"GameSet"+gameZone,function(err,res){
				if(res == null){
					redis.hset('GS:GAMESERVER:diceBao', "GameSet"+gameZone,'0001');
					callback_0(null,'0001');
				}else{
					var GameSet = (Number(res)+1).toString();
					GameSet=GameSet.length >= 4 ? GameSet : new Array(4-GameSet.length+1).join("0") + GameSet;
					redis.hset('GS:GAMESERVER:diceBao', "GameSet"+gameZone,GameSet);
					callback_0(null,GameSet);
				}
			});
		},
		function(GameSet,callback_1){
			//建立新期數 games_xx 成功
			//開盤 寫入期數進GAMES_52---------------------------
			var TimeNow= new Date();
			var yyyy = TimeNow.getFullYear();
			var MM = (TimeNow.getMonth()+1<10 ? '0' : '')+(TimeNow.getMonth()+1);
			var dd = (TimeNow.getDate()<10 ? '0' : '')+TimeNow.getDate();
			var h = (TimeNow.getHours()<10 ? '0' : '')+TimeNow.getHours();
			var m = (TimeNow.getMinutes()<10 ? '0' : '')+TimeNow.getMinutes();
			var s = (TimeNow.getSeconds()<10 ? '0' : '')+TimeNow.getSeconds(); 
			var o_Day = yyyy+'-'+MM+'-'+dd;
			var o_Time = h+':'+m+':'+s;

			var end = TimeNow.addSeconds(20); //關盤時間向後加秒數
			var end_yyyy = end.getFullYear();
			var end_MM = (end.getMonth()+1<10 ? '0' : '')+(end.getMonth()+1);
			var end_dd = (end.getDate()<10 ? '0' : '')+end.getDate();
			var end_h = (end.getHours()<10 ? '0' : '')+end.getHours();
			var end_m = (end.getMinutes()<10 ? '0' : '')+end.getMinutes();
			var end_s = (end.getSeconds()<10 ? '0' : '')+end.getSeconds(); 
			var c_Day = end_yyyy+'-'+end_MM+'-'+end_dd;
			var c_Time = end_h+':'+end_m+':'+end_s;
			endtime = c_Day+" "+c_Time;
			//009 開關盤 010強制關 011停押 012已計算結果
			//Period
			//o_Day開盤日期
			//o_Time開盤時間
			//c_Day關盤日期
			//c_Time關盤時間
			//o_Day歸屬日期
			Period=yyyy+MM+dd+GameSet;

			var struct_games = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
			struct_games.params.gas002 = 52;
			struct_games.params.gas003 = Period;
			struct_games.params.gas004 = gameZone;
			struct_games.params.start = o_Day+' '+o_Time;
			struct_games.params.stop =c_Day+' '+c_Time ;
			struct_games.params.gas009 = 0;
			struct_games.params.created_at = o_Day+' '+o_Time;
			struct_games.params.updated_at = o_Day+' '+o_Time;
			callback_1(null,Period,struct_games);
		},
		function(Period,struct_games,callback_2){
			var init_Game = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("games_52",struct_games);
			init_Game.Insert(function(res){
				if(!!res){
					gameID=res
					console.log('insert games_52 success');
					callback_2(null,gameID);
				}
				
			});
		},
		function(gameID,callback_4){
			var sql='SELECT gas008 FROM games_52 where gas008 <> ? and gas004 = ? order by id desc limit ?';
			var args=["",gameZone,10];
			dbslave.query(sql,args,function(data){
				if(data.ErrorCode==0){
					for (var key in data.rows){
						gameHistory=gameHistory+data.rows[key].gas008+',';
					}
					gameHistory=gameHistory.substring(0,gameHistory.length-1);
					callback_4(null,gameID);
				}
			});						
		},
		function(gameID,callback_5){
			var sql='SELECT gas008 FROM games_52 where gas008 <> ? and gas004 = ? order by id desc limit ?';
			var args=["",gameZone,30];
			dbslave.query(sql,args,function(data){
				if(data.ErrorCode==0){
					for (var key in data.rows){
						lobbyHistory=lobbyHistory+data.rows[key].gas008+',';
					}
					lobbyHistory=lobbyHistory.substring(0,lobbyHistory.length-1);
					callback_5(null,gameID);
				}
			});						
		}
	],
		function(err,result){
			if(err){
				console.log('期數未開');
			}else{
				console.log('開盤:'+result);
				redis.hset('GS:GAMESERVER:diceBao', "GameID"+gameZone, gameID);
				redis.hset('GS:GAMESERVER:diceBao', "endTime"+gameZone, endtime);
				redis.hset('GS:GAMESERVER:diceBao', "gameHistory"+gameZone, gameHistory);
				redis.hset('GS:GAMESERVER:diceBao', "lobbyHistory"+gameZone, lobbyHistory);
				redis.hset('GS:GAMESERVER:diceBao', "Status"+gameZone, 'T');
				redis.del('GS:lockAccount:diceBao');//清空下注key值 解開退出再進入遊戲限制
				maindiceBao.mainGame(gameID,endtime,dbmaster,dbslave,redis,gameZone);
				messageService.broadcast('connector','GetStatus_diceBao',{'status':'T'});
			}
		});
}


