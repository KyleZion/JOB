module.exports = function SetGame(pomelo,app)
{
	var async = require('async');
	var fruitWheelInit = require(app.getBase()+'/app/services/fruitWheelInit.js');

	var filterPath = app.getBase()+'/app/servers/fruitWheel/filter/fruitWheelFilter';
	var GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	var GPB = new GameProc_Base(3010,"fruitWheel","水果盤");
	var Name = "fruitWheel";


	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var EHB = new ErrorHandler_Base();

	var fruitFilter = require(filterPath);
	app.configure('production|development', 'fruitWheel', function() {
	    	

	console.error(' fruitWheel fruitWheelfruitWheelfruitWheelfruitWheelfruitWheelfruitWheelfruitWheelfruitWheelfruitWheelfruitWheel: ');



	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  
		  app.filter(fruitFilter());
		  async.series({
		    A:function(callback_A){
		      GPB.Run();
		      callback_A(null,0);
		    },
		    B:function(callback_B){

		    console.log("初始化完成");
		      fruitWheelInit.init();
		      callback_B(null,0);
		    }
		  },function(err, results) {
		    console.log("初始化完成");
		    });
	});


}