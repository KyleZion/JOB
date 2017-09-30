var pomelo = require('pomelo');
var redis = require('redis');
var async = require('async');
var configUtil = require('./app/util/configUtil.js');
//var GameInit = require('./app/services/GameInit.js');
var DiceInit = require('./app/services/DiceInit.js');
var GameProc_Base = require('./app/lib/GameProc_Base.js');
var GPB = new GameProc_Base(3010,"GP_Liang","水果盤");
/*var GameName = "GP_Liang";
var GameShowName = "水果盤";*/

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

    console.log('redis connect');
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
  app.loadConfig("mysql", app.getBase() + "/config/mysql.json"); // 添加配置
  var dbclient = require("./app/dao/mysql/mysql.js").init(app); // 初始化dbclient
    app.set("dbclient", dbclient);// dbclient 为外部数据库接口，app.get("dbclient") 来使用
  app.filter(pomelo.filters.serial());
  var globalFilter = require('./app/servers/global/filter/globalFilter');
  app.globalFilter(globalFilter());
});




//=====================================connector configure=====================================
app.configure('production|development', 'connector', function(){
/*    app.set('sessionConfig', {
      singleSession: true
  });*/
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.sioconnector, //sioconnector -> socketio 通訊
      // 'websocket', 'polling-xhr', 'polling-jsonp', 'polling'
      transports : ['websocket', 'polling'],
      heartbeats : true,
      closeTimeout : 60 * 1000,
      heartbeatTimeout : 60 * 1000,
      heartbeatInterval : 25 * 1000
    });

});



app.configure('production|development', 'ts', function() {
  // async.series({
  //   A:function(callback_A){
  //     GPB.Run();
  //     callback_A(null,0);
  //   },
  //   B:function(callback_B){
  //     GameInit.init();
  //     callback_B(null,0);
  //   }
  // },function(err, results) {
  //   console.log("初始化完成");
  // });

   //app.set('SendMessage',new SendMessage(app))

  var tsFilter = require('./app/servers/ts/filter/tsFilter');
  app.filter(tsFilter());
});



// start app
app.start();


process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
