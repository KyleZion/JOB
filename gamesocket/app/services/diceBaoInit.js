var pomelo = require('pomelo');
var async = require('async');
var messageService = require('./messageService.js');
var exp = module.exports;
var maindiceBao = require('./maindiceBao.js');
var gameID = 0;
var status='F';
var Period='';
var endtime='';

	Date.prototype.addSeconds = function(s){
  	  this.setSeconds(this.getSeconds()+s);
  	  return this;
	}

exp.init = function () {
	var dbslave =pomelo.app.get('dbslave');
	var dbmaster =pomelo.app.get('dbmaster');
	var redis =pomelo.app.get('redis');
	//先開盤
	gameMade(dbmaster,dbslave,redis);
	//觸發局數流程控制 Control
}

var gameMade = function(dbmaster,dbslave,redis){
	var gameID = 0;
	var Period='';
	var endtime='';
	var gameHistory='';
	var lobbyHistory='';
	async.waterfall([
		function(callback_1){
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
			
			var gasSQL=[];
			endtime = c_Day+" "+c_Time;
			//009 開關盤 010強制關 011停押 012已計算結果
			//Period
			//o_Day開盤日期
			//o_Time開盤時間
			//c_Day關盤日期
			//c_Time關盤時間
			//o_Day歸屬日期
			Period=yyyy+MM+dd+h+m+s;
			gasSQL=[52,Period,o_Day,o_Time,c_Day,c_Time,0,o_Day];
			callback_1(null,Period,gasSQL);
		},
		function(Period,gasSQL,callback_2){
			var sql="INSERT INTO games_52 (gas002,gas003,gas004,gas005,gas006,gas007,gas009,gas013) VALUES (?,?,?,?,?,?,?,?)";
			dbmaster.insert(sql,gasSQL,function(data){
				if(data.ErrorCode==0){
					console.log('insert games_52 success');
					callback_2(null);
				}
			});
		},
		function(callback_3){ //多CONCAT就undefined????? 改用字串組成
			//dbclient.query('SELECT gas003,CONCAT(gas006," ",gas007)as endtime FROM games_52 WHERE gas002  = ? AND CONCAT(gas004," ",gas005 )<= NOW() AND CONCAT(gas006," ",gas007)>= NOW() ORDER BY gas001 DESC LIMIT 1',[52],function(data){
			dbslave.query('SELECT gas001 FROM games_52 where gas002 = ? order by gas001 desc limit 1',[52],function(data){
				if(data.ErrorCode==0){
					gameID=data.rows[0].gas001;
					callback_3(null,gameID)
				}
			});
		},
		function(gameID,callback_4){
			var sql='SELECT gas001,gas008 FROM games_52 where gas008 <> ? order by gas001 desc limit ?';
			var args=["",10];
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
			var sql='SELECT gas001,gas008 FROM games_52 where gas008 <> ? order by gas001 desc limit ?';
			var args=["",30];
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
				redis.hset('GS:GAMESERVER:diceBao', "GameID", gameID);
				redis.hset('GS:GAMESERVER:diceBao', "endTime", endtime);
				redis.hset('GS:GAMESERVER:diceBao', "gameHistory", gameHistory);
				redis.hset('GS:GAMESERVER:diceBao', "lobbyHistory", lobbyHistory);
				redis.hset('GS:GAMESERVER:diceBao', "Status", 'T');
				maindiceBao.mainGame(gameID,Period,endtime,dbmaster,dbslave,redis);
				messageService.broadcast('connector','GetStatus',{'status':'T'});
			}
		});
}


