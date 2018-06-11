const pomelo = require('pomelo');
const async = require('async');
const messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
const exp = module.exports;
const maindiceBao = require('./maindiceBao.js');

exp.init = function (gameZone) {
	const dbslave =pomelo.app.get('dbslave');
	const dbmaster =pomelo.app.get('dbmaster');
	const redis =pomelo.app.get('redis');
	const DBGC = new (require(pomelo.app.getBase()+'/app/services/diceBao/diceBaoGameCalc.js'))(redis,dbslave,dbmaster,messageService,gameZone);
	const gameSql = new(require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
	//先開盤
	const lib_TI = require(pomelo.app.getBase()+'/app/lib/lib_TableInit.js');
	const TI = new lib_TI(pomelo,pomelo.app,async,redis,dbslave,dbmaster,messageService,'diceBao','骰宝',52,gameZone);
	var gameID = new Array();
	//觸發局數流程控制 Control
	gameSql.GetUnOpenGames(function(res){
		gameID = res;
		if(res==0){
			TI.Made(35,20,10,function(insertID,endTime){
				messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':'T'});
				maindiceBao.mainGame(insertID,endTime,dbmaster,dbslave,redis,gameZone);
			});
		}else{
			const reCalc = new Promise((resolve , reject) =>{
				for(item of gameID){
					//console.log(item);
					DBGC.GameCalc(item.id,1,function(res){
						if(!res){
							//console.log('OK');
						}else{
							//console.log('aa');
						}
					});
				}
				return resolve('OKOK');
			});
			const gameOpen = async() =>{
				const result = await reCalc;
				return result;
			}
			gameOpen()
				.then(result =>{
					TI.Made(35,20,10,function(insertID,endTime){
						//console.log(insertID);
						//console.log(endTime);
						messageService.broadcast('connector','diceBaoStatus'+gameZone,{'status':'T'});
						maindiceBao.mainGame(insertID,endTime,dbmaster,dbslave,redis,gameZone);
					});
				})
				.catch(err =>{
					console.log(err);
				});
		}
	});
}


