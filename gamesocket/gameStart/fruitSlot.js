module.exports = function SetGame(pomelo,app)
{
	var async = require('async');
	var fruitSlotInit = require(app.getBase()+'/app/services/fruitSlot/fruitSlotInit.js');

	var filterPath = app.getBase()+'/app/servers/fruitSlot/filter/fruitSlotFilter';
	var GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	var GPB = new GameProc_Base(6054,"fruitSlot","水果拉霸");
	var Name = "fruitSlot";


	var ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	var EHB = new ErrorHandler_Base();

	var ScratchFilter = require(filterPath);
	app.configure('production|development', 'fruitSlot', function() {

	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	  
		  app.filter(ScratchFilter());
		  async.series({
		    A:function(callback_A){
		      GPB.Run();
		      callback_A(null,0);
		    }/*,
		    B:function(callback_B){
		      ScratchInit.init(111);
		      callback_B(null,0);
		    },
		    C:function(callback_C){
		      ScratchInit.init(222);
		      callback_C(null,0);
		    },
		    D:function(callback_D){
		      ScratchInit.init(333);
		      callback_D(null,0);
		    }*/
		  },function(err, results) {
		    console.log("初始化完成");
		    });
	});

}