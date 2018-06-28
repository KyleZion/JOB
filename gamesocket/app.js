const pomelo = require('pomelo');
const redis = require('redis');
const async = require('async');
const configUtil = require('./app/util/configUtil.js');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'DUegame');

// app configuration
app.configure('production|development', function(){
  if(0){
    console.log = ()=>{};
    console.warn = ()=>{};
  }
  app.set('proxyConfig', {
    timeout: 1000 * 10,
    heartbeat : 300
  });
  
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
  const dbslave = require("./app/dao/mysql/mysql_S.js").init(app); // 初始化db
  app.set("dbslave", dbslave); // dbslave 为外部数据库接口，app.get("dbslave") 来使用

  app.loadConfig("mysql", app.getBase() + "/config/mysql_master.json"); 
  const dbmaster = require("./app/dao/mysql/mysql_M.js").init(app); //dbmaster
  app.set("dbmaster", dbmaster);
  //===========================================================================================
  //lib config
  const messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');//訊息推播
  app.set("messageService", messageService);
/*  const lib_GM = require(pomelo.app.getBase()+'/app/lib/lib_GameMade.js');
  app.set("lib_GM", lib_GM);*/
  app.set("async", async);
  //===========================================================================================
  //filter config
  //app.filter(pomelo.filters.serial()); DU_VIC:造成錯誤?
  //app.enable("systemMonitor"); DU_VIC:造成錯誤?
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
      next(null,{'ErrorCode':150,'ErrorMessage':resp});
    }
  }
  //app.set("errorHandler",errorHandler);
  app.set("globalErrorHandler",globalErrorHandler); //globalErrorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
});
//=====================================connector configure=====================================
//
var games = ['connector','fruitWheel','diceBao','Scratch','fruitSlot','transfer','manager'];
//var games = ['connector','fruitWheel','transfer','manager'];
for (var i = 0; i < games.length ; i++) {

  var path = app.getBase() + "/gameStart/"+ games[i]+".js";

  var game = require(path);
  var iSetGame = new game(pomelo,app,games[i]);

}

// start app

app.start();


process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
