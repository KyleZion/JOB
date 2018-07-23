module.exports.init = function (gameZone,gameName) {
	const pomelo = require('pomelo');
	const app = pomelo.app;
	const async = app.get('async');
	const messageService = app.get('messageService');
	const fruitWheelmain = require('./fruitWheelmain.js');
	const gameNumop = new(require('./fruitWheelopvn1.js'))();
	const dbslave =app.get('dbslave');
	const dbmaster =app.get('dbmaster');
	const redis =app.get('redis');
	const lib_GM = require(pomelo.app.getBase()+'/app/lib/lib_GameMade.js');
	const GM = new lib_GM(pomelo,app,async,redis,dbslave,dbmaster,messageService,gameName,'水果转盘',51,gameZone);
	const gameSql = new(require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,app,async,redis,dbslave,dbmaster,51,gameZone);
	const FWC = new (require(app.getBase()+'/app/services/fruitWheel/fruitWheelCalc.js'))(redis,dbslave,dbmaster,messageService,gameZone);
	gameSql.GetUnOpenGames(function(res){
		gameID = res;
		if(res==0){
			GM.Made(25,function(insertID,endTime){
				messageService.broadcast('connector','GetStatus'+gameZone,{'status':'T'});
				fruitWheelmain.mainGame(gameName,insertID,endTime,dbmaster,dbslave,redis,gameZone);
			});
		}else{ //補開獎
			const reCalc = new Promise((resolve , reject) =>{
				gameID.forEach(function(item, index, array) {
					FWC.GameCalc(item.id,1,function(res){
						if(!res){
							console.log('OK');
						}else{
							console.log('aa');
						}
					});
				});
				return resolve('OKOK');
			});
			
			const gameOpen = async() =>{
				const result = await reCalc;
				return result;
			}
			gameOpen()
			.then(result =>{
				GM.Made(25,function(insertID,endTime){
					messageService.broadcast('connector','GetStatus'+gameZone,{'status':'T'});
					fruitWheelmain.mainGame(gameName,insertID,endTime,dbmaster,dbslave,redis,gameZone);
				});
			})
			.catch(err =>{
				console.error(err);
			});
		}
	});
}