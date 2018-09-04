module.exports = function SetGame(pomelo,app,gameName)
{
	const async = app.get('async');
	const gameConfig = app.get(gameName);
	const gameInit = require(app.getBase()+'/app/services/'+gameName+'/'+gameName+'Init.js');
	const GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	const GPB = new GameProc_Base(gameConfig.PORT,gameName,gameConfig.CNAME);

	const ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	const EHB = new ErrorHandler_Base();

	const gameFilter = require(app.getBase()+'/app/servers/'+gameName+'/filter/'+gameName+'Filter');
	app.configure('production|development', gameName, function() {

	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
		  app.filter(gameFilter());

		  async.series({
		    A:function(callback_A){
		    	
		      GPB.Run();
		      callback_A(null,0);
		    },
		    B:function(callback_B){
		      gameInit.init(101,gameName);
		      callback_B(null,0);
		    },
		    C:function(callback_C){
		      gameInit.init(102,gameName);
		      callback_C(null,0);
		    },
		    D:function(callback_D){
		      gameInit.init(105,gameName);
		      callback_D(null,0);
		    },
		    E:function(callback_E){
		      gameInit.init(110,gameName);
		      callback_E(null,0);
		    }
		  },function(err, results) {
		    console.log(gameName+"初始化完成");
		    });
	});

}