module.exports = function SetGame(pomelo,app,gameName)
{
	var filterPath = app.getBase()+'/app/servers/'+gameName+'/filter/filter';


	app.configure('production|development', gameName, function(){

		var iFilter = require(filterPath);
		app.filter(iFilter());
		app.set('sessionConfig', {
		    singleSession: true
		});
	  	app.set('connectorConfig',
	    {
	      	connector : pomelo.connectors.sioconnector, //sioconnector -> socketio 通訊
		      // 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
		      transports : ['websocket', 'polling-xhr', 'polling-jsonp', 'polling'],
		      heartbeat: 3,
		      //heartbeats : true,
		      closeTimeout : 30*1000 ,
		      heartbeatTimeout : 60*1000 ,
		      heartbeatInterval : 25*1000
		});


	  	var errorHandler = function(err, msg, resp , session, next){
	      	console.log('>>>>>>>>>>>>>connector errorHandler : ' + err );
	      	console.log(msg);
	 	}
	  	app.set("errorHandler",errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
	});

}