module.exports = function lib_GameMade(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID,GameZone)
{
	//console.log("lib_GameMade:"+GameZone);
	var lib_OG = require(app.getBase()+'/app/lib/lib_OpenGame.js');
	var OG = new lib_OG(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID,GameZone);

	
	this.Made = function(Made_callback,GameSeconds)
	{
		var InsertID = 0;
		var Period='';
		var endtime='';
		var gameHistory='';
		var lobbyHistory='';
		var GameSet='';

		async.waterfall([
			function(callback_0){
				redis.hget('GS:GAMESERVER:'+GameName,"GameSet"+GameZone,function(err,res){
					if(res == null){
						GameSet = "0001";
						redis.hset('GS:GAMESERVER:'+GameName, "GameSet"+GameZone,GameSet);
						callback_0(null);
					}else{
						GameSet = (Number(res)+1).toString();
						GameSet=GameSet.length >= 4 ? GameSet : new Array(4-GameSet.length+1).join("0") + GameSet;
						redis.hset('GS:GAMESERVER:'+GameName, "GameSet"+GameZone,GameSet);
						callback_0(null);
					}
				});
			},
			function(callback_1){
				var TimeNow= new Date();//009 開關盤 010強制關 011停押 012已計算結果
				var yyyy = TimeNow.getFullYear();
				var MM = (TimeNow.getMonth()+1<10 ? '0' : '')+(TimeNow.getMonth()+1);
				var dd = (TimeNow.getDate()<10 ? '0' : '')+TimeNow.getDate();
				var h = (TimeNow.getHours()<10 ? '0' : '')+TimeNow.getHours();
				var m = (TimeNow.getMinutes()<10 ? '0' : '')+TimeNow.getMinutes();
				var s = (TimeNow.getSeconds()<10 ? '0' : '')+TimeNow.getSeconds(); 
				var o_Day = yyyy+'-'+MM+'-'+dd;//o_Day開盤日期 //o_Day歸屬日期
				var o_Time = h+':'+m+':'+s;//o_Time開盤時間

				var end = TimeNow.addSeconds(GameSeconds); //關盤時間向後加秒數
				var end_yyyy = end.getFullYear();
				var end_MM = (end.getMonth()+1<10 ? '0' : '')+(end.getMonth()+1);
				var end_dd = (end.getDate()<10 ? '0' : '')+end.getDate();
				var end_h = (end.getHours()<10 ? '0' : '')+end.getHours();
				var end_m = (end.getMinutes()<10 ? '0' : '')+end.getMinutes();
				var end_s = (end.getSeconds()<10 ? '0' : '')+end.getSeconds(); 
				var c_Day = end_yyyy+'-'+end_MM+'-'+end_dd;//c_Day關盤日期
				var c_Time = end_h+':'+end_m+':'+end_s;//c_Time關盤時間
				endtime = c_Day+" "+c_Time;
				
				Period=yyyy+MM+dd+GameZone+GameSet;

				var start = o_Day+' '+o_Time;
				var stop = c_Day+' '+c_Time;
				
				OG.InsertPeriod(function(iInsertID){
					InsertID = iInsertID;
					if(iInsertID>0)
						callback_1(null);
					else
						callback_1(0);
				},Period,start,stop);


			},
			function(callback_4){
				OG.GetHistoryNumber(function(igameHistory){
					gameHistory = igameHistory;
					callback_4(null);
				},10);
			},
			function(callback_5){
				OG.GetHistoryNumber(function(igameHistory){
					lobbyHistory =igameHistory;
					callback_5(null);
				},30);
			}
		],
		function(err,result){
			if(err){
				console.log('期數未開');
				Made_callback(0);
			}else{
				console.log('開盤:'+InsertID);
				redis.hset('GS:GAMESERVER:'+GameName, "GameID"+GameZone, InsertID);
				redis.hset('GS:GAMESERVER:'+GameName, "endTime"+GameZone, endtime);
				redis.hset('GS:GAMESERVER:'+GameName, "gameHistory"+GameZone, gameHistory);
				redis.hset('GS:GAMESERVER:'+GameName, "lobbyHistory"+GameZone, lobbyHistory);
				redis.hset('GS:GAMESERVER:'+GameName, "Status"+GameZone, 'T');
				redis.hset('GS:GAMESERVER:'+GameName, "NowbetTotal"+GameZone,'0,0,0,0,0,0,0');
				redis.del('GS:lockAccount:'+GameName);//清空下注key值 解開退出再進入遊戲限制
				Made_callback(InsertID,endtime);
			}
		});

	}
}


