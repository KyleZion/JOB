module.exports = function(app) {
  return new Cron(app);
};
var Cron = function(app) {
  this.app = app;
};
var cron = Cron.prototype;
var pomelo=require('pomelo');
var iasync = require('async');
var sessionService = pomelo.app.get('sessionService');
var GameProc_Base = require('../../../consts/Base_Param.js');
var GPB = new GameProc_Base();

cron.CheckLogin = function(){
	//GPB.ShowLog(1,"CheckLogin : ");
	var nowDT = new Date();
	iasync.series({
		A: function(callback){
			//ShowLog(1,"CheckLogin A: ");
			//prv_GetAllSocket(function(socket)
			sessionService.forEachSession(function(session){
				if(session.uid==null)
				{
					console.log(session.id);
					var d = new Date(session.get('Connectime'));
					var seconds = parseInt((nowDT-d)/1000);
					GPB.ShowLog(1,"Unlogin : "+seconds);
					if(seconds>30){
						Close(session);
						GPB.ShowLog(1,"Unlogin : x");
					}
				}
				else if(session.get('Stop')==1)
				{
					var d = new Date(session.get('Stoptime'));
					var seconds = parseInt((nowDT-d)/1000);
					GPB.ShowLog(1,"Stop : "+seconds);
					if(seconds>30){
						Close(session);
						GPB.ShowLog(1,"Stop : x");
					}
				}
			});
			callback(null,0);
		},
		B: function(callback){
			//ShowLog(1,"CheckLogin B: ");
			setTimeout(CheckLogin, 5000);
			callback(null,0);
		}
	},
	function(err,value){
	});
}

var StopClient = function(session){
		if(session.get('Stop')!=1){
			//GPB.EventEmitter.emit('onStop',socket,'');
			session.set('Stop', 1);
			session.set('Stoptime',new Date());
			session.pushAll();
			//session.SendMessage('0','','KICK',{'date': new Date()});
		}
}
var Close = function(session){
	//redis.quit();
		sessionService.kickBySessionId(session.id,function(res){
		sessionService.sendMessage(session.id,'onKick');
		console.log('kick Success');
		});
}
