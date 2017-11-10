module.exports = function SetGame(pomelo,app)
{
	var async = require('async');
	var diceBaoInit = require(app.getBase()+'/app/services/diceBaoInit.js');

	var filterPath = app.getBase()+'/app/servers/diceBao/filter/diceBaoFilter';
	var GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	var GPB = new GameProc_Base(3011,"diceBao","骰寶");
	var Name = "diceBao";


	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var EHB = new ErrorHandler_Base();

	var diceBaoFilter = require(filterPath);
	app.configure('production|development', 'diceBao', function() {
	    	
	console.error(' diceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBaodiceBao: ');

	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  
		  app.filter(diceBaoFilter());
		  async.series({
		    A:function(callback_A){
		      GPB.Run();
		      callback_A(null,0);
		    },
		    B:function(callback_B){
		      diceBaoInit.init();
		      callback_B(null,0);
		    }
		  },function(err, results) {
		    console.log("初始化完成");
		    });
	});

}