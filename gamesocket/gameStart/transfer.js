module.exports = function SetGame(pomelo,app)
{
	var filterPath = app.getBase()+'/app/servers/transfer/filter/transferfilter';
	var GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	var GPB = new GameProc_Base(3251,"transfer","轉帳入口");
	var Name = "transfer";

	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var EHB = new ErrorHandler_Base();

	app.configure('production|development', 'transfer', function(){
		var transferFilter = require(filterPath);
		app.filter(transferFilter());

	  	var errorHandler = function(err, msg, resp , session, next){
	      	console.log('>>>>>>>>>>>>>transfer errorHandler : ' + err );
	      	console.log( msg );
	 	}
	  	 app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  	 GPB.Run();
	});

}