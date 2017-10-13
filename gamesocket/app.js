var pomelo = require('pomelo');
var redis = require('redis');
var async = require('async');
var configUtil = require('./app/util/configUtil.js');
var fruitWheelInit = require('./app/services/fruitWheelInit.js');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'pomelo_test');

// app configuration
app.configure('production|development', function(){
  //redis config
  var redis_config = configUtil.load('redis');
  var client = redis.createClient(redis_config.development.port,redis_config.development.IP,{});
  client.select(redis_config.development.DBindex);
  client.on('connect',function(){
    
  });
  client.on('error',function (err,value)
  {
    try{
        callback("Redis啟動失敗",1);
       }
      catch(ex){
       }
  });
  app.set('redis',client);
  //===========================================================================================
  //mySQL config
  app.loadConfig("mysql", app.getBase() + "/config/mysql_slave.json"); // 添加配置
  var dbslave = require("./app/dao/mysql/mysql_S.js").init(app); // 初始化db
  app.set("dbslave", dbslave); // dbslave 为外部数据库接口，app.get("dbslave") 来使用

  app.loadConfig("mysql", app.getBase() + "/config/mysql_master.json"); 
  var dbmaster = require("./app/dao/mysql/mysql_M.js").init(app); 
  app.set("dbmaster", dbmaster);
  

  app.filter(pomelo.filters.serial());
  var globalFilter = require('./app/servers/global/filter/globalFilter');
  app.globalFilter(globalFilter());
  //GlobalFilter錯誤皆會送來此
  var globalErrorHandler = function(err, msg, resp , session, next){
    if(session.get('Stop')==1){
        next(null,{'ErrorCode':1,'ErrorMessage':resp});
    }
    else{
      session.set("Stop",1);
      session.set('Stoptime',new Date());
      session.pushAll();
      next(null,{'ErrorCode':1,'ErrorMessage':resp});
    }
  }
  //app.set("errorHandler",errorHandler);
  app.set("globalErrorHandler",globalErrorHandler); //globalErrorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
});
//=====================================connector configure=====================================
var games = ['connector','fruitWheel','transfer'];
for (var i = 0; i < games.length ; i++) {

  var path = app.getBase() + "/gameStart/"+ games[i]+".js";


  var game = require(path);
  var iSetGame = new game(pomelo,app);

}
/*app.configure('production|development', 'connector', function(){
  //  app.set('sessionConfig', {
  //    singleSession: true
  //});
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.sioconnector, //sioconnector -> socketio 通訊
      // 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
      transports : ['websocket', 'polling-xhr', 'polling-jsonp', 'polling'],
      heartbeats : true,
      closeTimeout : 60*1000 ,
      heartbeatTimeout : 60*1000 ,
      heartbeatInterval : 25*1000
    });

});
var fruitFilter = require('./app/servers/fruitWheel/filter/fruitWheelFilter');
app.configure('production|development', 'fruitWheel', function() {
  var errorHandler = function(err, msg, resp , session, next){
    if(resp==500){
      next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'})
    }
    else if(session.get('Stop')==1){
        next(null,{'ErrorCode':1,'ErrorMessage':resp});
    }
    else{
      session.set("Stop",1);
      session.set('Stoptime',new Date());
      session.pushAll();
      next(null,{'ErrorCode':1,'ErrorMessage':resp});
    }
  }
  app.set("errorHandler",errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
  
  app.filter(fruitFilter());
  async.series({
    A:function(callback_A){
      GPB.Run();
      callback_A(null,0);
    },
    B:function(callback_B){
      fruitWheelInit.init();
      callback_B(null,0);
    }
  },function(err, results) {
    console.log("初始化完成");
    });
});*/



// start app
app.start();


process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
