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
  app.loadConfig("mysql", app.getBase() + "/config/mysql_slave.json"); 
  var dbslave = require("./app/dao/mysql/mysql_S.js").init(app); 
  app.set("dbslave", dbslave);

  app.loadConfig("mysql", app.getBase() + "/config/mysql_master.json"); 
  var dbmaster = require("./app/dao/mysql/mysql_M.js").init(app); 
  app.set("dbmaster", dbmaster);
  

  app.filter(pomelo.filters.serial());
  var globalFilter = require('./app/servers/global/filter/globalFilter2');
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






var games = ['connector','ts'];
for (var i = 0; i < games.length ; i++) {

  var path = app.getBase() + "/gameStart/"+ games[i]+".js";


  var game = require(path);
  var iSetGame = new game(pomelo,app);

}






var lib_games = new (require(app.getBase()+'/app/lib/lib_games.js'))();

var struct_amount = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
struct_amount.params.from_gkey = 'MAIN';
                     //mid,金額
lib_games.DeductMoney('5',50,struct_amount,function(result)
{
  switch(result)
  {
    case -1:
      console.log('查無此id');
      break;
    case -2:
      console.log('餘額不足');
      break;
    case -3:
      console.log('扣款失敗');
      break;
    case -4:
      console.log('寫log失敗');
      break;
    default:
       // result  是扣款成功後 寫入amount 的id
      console.log(result);
      break;
  }
});


//app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
