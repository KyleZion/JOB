module.exports = function SetGame(pomelo,app)
{	//自行修改變數
	var GameName = "ts";
	var GameID = "91";
	var GameShowName = "測試x";

	app.configure('production|development', GameName, function() {
		//------------------------------以下內容不需要修改------------------------------
		var async = require('async');
		var redis = pomelo.app.get('redis');
		var dbslave = pomelo.app.get('dbslave');
		var dbmaster = pomelo.app.get('dbmaster');

		//
		var messageService = require( app.getBase()+'/app/services/messageService.js');
		//過濾 
		var filterPath = app.getBase()+'/app/servers/'+GameName+'/filter/tsFilter';
		var iFilter = require(filterPath);
		//統一初始化
		var Game_Init = require(app.getBase()+'/app/lib/Game_Init.js');
		var GI = new Game_Init(pomelo.app,redis,GameName,GameShowName);
		//統一錯誤處理
		var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
		var EHB = new ErrorHandler_Base();
		//統一Service入口
		var MainService = require(app.getBase()+'/app/services/'+GameName+'/MainService.js');
		var MS = new MainService(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID);

		//------------------------------以上內容不需要修改------------------------------

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
		      MS.Run(101);
		      callback_C(null,0);
		    }
		},function(err, results) {
		    console.log( GameName +" 初始化完成 : " +err);
		});


	});

	
}