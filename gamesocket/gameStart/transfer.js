module.exports = function SetGame(pomelo,app,gameName)
{
	const GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	const GPB = new GameProc_Base(3251,gameName,"轉帳入口");

	const ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	const EHB = new ErrorHandler_Base();
	const gameFilter = require(app.getBase()+'/app/servers/'+gameName+'/filter/'+gameName+'Filter');
	app.configure('production|development', 'transfer', function(){
		
		app.filter(gameFilter());

	  	const errorHandler = function(err, msg, resp , session, next){
	      	console.log('>>>>>>>>>>>>>transfer errorHandler : ' + err );
	      	console.log( msg );
	 	}
	  	 app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  	 GPB.Run();
	});

}