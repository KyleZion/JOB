module.exports = function SetGame(pomelo,app)
{
	var async = require('async');
	var redis = app.get('redis');
	var filterPath = app.getBase()+'/app/servers/manager/filter/managerFilter';
	var GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	var GPB = new GameProc_Base(3252,"manager","後臺管理");
	var Name = "manager";

	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var EHB = new ErrorHandler_Base();

	var managerFilter = require(filterPath);
	app.configure('production|development', 'manager', function() {
		var errorHandler = function(err, msg, resp , session, next){
	      	console.log('>>>>>>>>>>>>>manager errorHandler : ' + err );
	      	console.log(msg);
	 	}
	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  
		  app.filter(managerFilter());

/*		  async.series({
		    A:function(callback_A){
		      
		      callback_A(null,0);
		    }
		  },function(err, results) {
		    console.log("初始化完成");
		    });*/
		    GPB.Run();
		    redis.hset('GS:GAMESERVER:manager', 'USERID', '000');
	});

}