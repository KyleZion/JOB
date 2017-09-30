module.exports = function SetGame(pomelo,app)
{
	var async = require('async');
	
	var GameName = "ts";
	var GameShowName = "測試x";
	var filterPath = app.getBase()+'/app/servers/'+GameName+'/filter/tsFilter';
	var Game_Init = require(app.getBase()+'/app/lib/Game_Init.js');
	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var redis=pomelo.app.get('redis');
	var GI = new Game_Init(pomelo.app,redis,GameName,GameShowName);
	var EHB = new ErrorHandler_Base();

	
	app.configure('production|development', GameName, function() {
	   	
	   	var iFilter = require(filterPath);
		app.filter(iFilter());


	  	app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  
		async.series({
		    A:function(callback_A){
		      	GI.Init_SetRedisParam(function(err, results) {
					callback_A(err, results);
				});
		    },
		    B:function(callback_B){
		      	GI.Init_CleanUserGameType(function(err, results) {
					callback_B(err, results);
				});
		    },
		    C:function(callback_C){
		      //fruitWheelInit.init();
		      callback_C(null,0);
		    }
		},function(err, results) {
		    console.log("初始化完成 : " +err);
		});
	});

	
}