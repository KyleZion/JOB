const pomelo = require('pomelo');
const app = pomelo.app;
const async = app.get('async');
const messageService = app.get('messageService');
const fruitWheelmain = require('./fruitWheelmain.js');
const gameNumop = new(require('./fruitWheelopvn1.js'))();

module.exports.init = function (gameZone,gameName) {
	const dbslave =app.get('dbslave');
	const dbmaster =app.get('dbmaster');
	const redis =app.get('redis');
	var lib_GM = require(pomelo.app.getBase()+'/app/lib/lib_GameMade.js');
	var GM = new lib_GM(pomelo,app,async,redis,dbslave,dbmaster,messageService,gameName,'水果转盘',51,gameZone);
	dbslave.query('SELECT id from games_51 where gas004 = ? and (gas009 = ? or gas012 = ?)',[gameZone,0,0],function(data){
		if(data.ErrorCode==0){
			if(data.rows.length==0){
				GM.Made(25,function(insertID,endTime){
					//console.log(insertID);
					//console.log(endTime);
					messageService.broadcast('connector','GetStatus'+gameZone,{'status':'T'});
					fruitWheelmain.mainGame(insertID,endTime,dbmaster,dbslave,redis,gameZone);
				});
			}else
			{
				//補開獎
				/*gameNumop.gameopvn1(dbmaster,dbslave,redis,gameID,data.rows,gameZone,function(data){
					if(data.ErrorCode==0){
							callback(null,data.gameNum,data.bonusRate);
							//console.log('結算完成');
						}else{
							console.log('結算錯誤1');
							callback(data.ErrorCode,data.ErrorMessage);
						}
					});*/
				//開盤
				//console.log(data.rows);
				GM.Made(25,function(insertID,endTime){
					/*console.log(insertID);
					console.log(endTime);*/
					messageService.broadcast('connector','GetStatus'+gameZone,{'status':'T'});
					fruitWheelmain.mainGame(insertID,endTime,dbmaster,dbslave,redis,gameZone);
				});
			}
		}
	});
}