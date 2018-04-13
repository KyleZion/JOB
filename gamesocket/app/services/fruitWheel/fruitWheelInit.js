var exp = module.exports;
var pomelo = require('pomelo');
var async = require('async');
var messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
var fruitWheelmain = require('./fruitWheelmain.js');
var gameNumop = new(require('./fruitWheelopvn1.js'))();

exp.init = function (gameZone) {
	var dbslave =pomelo.app.get('dbslave');
	var dbmaster =pomelo.app.get('dbmaster');
	var redis =pomelo.app.get('redis');
	var lib_GM = require(pomelo.app.getBase()+'/app/lib/lib_GameMade.js');
	var GM = new lib_GM(pomelo,pomelo.app,async,redis,dbslave,dbmaster,messageService,'fruitWheel','水果转盘',51,gameZone);
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