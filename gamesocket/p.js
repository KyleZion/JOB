var pomelo = require('pomelo');
var redis = require('redis');
var async = require('async');
var configUtil = require('./app/util/configUtil.js');
//const gameSql = new(require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
//var fruitWheelInit = require('./app/services/fruitWheelInit.js');
var dbmaster;
var dbslave;

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
  dbmaster = require("./app/dao/mysql/mysql_M.js").init(app); 
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
struct_amount.params.transfer_type = 20;
struct_amount.params.from_gkey = 'MAIN';
struct_amount.params.to_gkey = 'CTL';
struct_amount.params.operator = 62748;
struct_amount.params.uip = '127.0.0.1';
struct_amount.params.otype = 'm';
struct_amount.params.gameid = '51';

                   //mid,金額

/*async function timeout(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);

  });
}

async function asyncPrint(value, ms) {
  await timeout(ms);
  console.log(value);
}
for(let i = 0 ; i<10 ; i++){
  
  console.log(i);
}
asyncPrint('hello world', 5000);*/

var res=1000;
/*let sql ="CALL spModifyAmount(?,?,?,?,?,?,@a); SELECT @a";

dbmaster.spquery(sql,[51,0,0,'',62748,100,res],(data) =>{
    res = data.rows[3][0]['@a'];
    console.log(res);
    if (data.ErrorCode!=0) {
      return console.warn(data.message);
    }
    //console.log(fields);
});*/

let sql ="CALL spSelectMemberMem100(?);";

/*dbmaster.spquery(sql,[62748],(data) =>{
    //res = data.rows[3][0]['@a'];
    console.log(data.rows[0][0]['mem100']);
    if (data.ErrorCode!=0) {
      return console.warn(data.message);
    }
});*/

/*var count = 0;
var a=['b','c'];
async.whilst(
    function() { return count < 2; },
    function(callback) {
        console.log(a[count]);
        count++;
        callback(null,count);
    },
    function (err, n) {
        // 5 seconds have passed, n = 5
    }
);*/
/*var gameID = 564;
var gameZone = 111;
var gameNum = [8034,8037];

dbmaster.query('SELECT bet002,bet005,bet014,bet017 FROM bet_g52 where bet009 = ? and bet003 = ? and bet012 = ? and bet014 IN (?)  order by id',[gameID,0,gameZone,gameNum],function(data){
  if(data.ErrorCode==0){
    //開始結算 暫時不結算
    
    console.log(data);
  }
});*/


async function transGameNum(gameNum,numSum)
{
  var gameNumCombo = new Array();
  var c=0;
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==1)){
      gameNumCombo[c]='8001';
      c++;
    }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==2)){
      gameNumCombo[c]='8002';
      c++;
  }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==3)){
      gameNumCombo[c]='8003';
      c++;
  }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==4)){
      gameNumCombo[c]='8004';
      c++;
  }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==5)){
      gameNumCombo[c]='8005';
      c++;
  }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==6)){
      gameNumCombo[c]='8006';
      c++;
  }
  if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])){
      gameNumCombo[c]='8007';
      c++;
  }
  if((gameNum[0]==1 && gameNum[1]==1) || (gameNum[1]==1 && gameNum[2]==1)){
      gameNumCombo[c]='8008';
      c++;
  }
  if((gameNum[0]==2 && gameNum[1]==2) || (gameNum[1]==2 && gameNum[2]==2)){
      gameNumCombo[c]='8009';
      c++;
  }
  if((gameNum[0]==3 && gameNum[1]==3) || (gameNum[1]==3 && gameNum[2]==3)){
      gameNumCombo[c]='8010';
      c++;
  }
  if((gameNum[0]==4 && gameNum[1]==4) || (gameNum[1]==4 && gameNum[2]==4)){
      gameNumCombo[c]='8011';
      c++;
  }
  if((gameNum[0]==5 && gameNum[1]==5) || (gameNum[1]==5 && gameNum[2]==5)){
      gameNumCombo[c]='8012';
      c++;
  }
  if((gameNum[0]==6 && gameNum[1]==6) || (gameNum[1]==6 && gameNum[2]==6)){
      gameNumCombo[c]='8013';
      c++;
  }
  if(numSum==4){
      gameNumCombo[c]='8014';
      c++;
  }
  if(numSum==5){
      gameNumCombo[c]='8015';
      c++;
  }
  if(numSum==6){
      gameNumCombo[c]='8016';
      c++;
  }
  if(numSum==7){
      gameNumCombo[c]='8017';
      c++;
  }
  if(numSum==8){
      gameNumCombo[c]='8018';
      c++;
  }
  if(numSum==9){
      gameNumCombo[c]='8019';
      c++;
  }
  if(numSum==10){
      gameNumCombo[c]='8020';
      c++;
  }
  if(numSum==11){
      gameNumCombo[c]='8021';
      c++;
  }
  if(numSum==12){
      gameNumCombo[c]='8022';
      c++;
  }
  if(numSum==13){
      gameNumCombo[c]='8023';
      c++;
  }
  if(numSum==14){
      gameNumCombo[c]='8024';
      c++;
  }
  if(numSum==15){
      gameNumCombo[c]='8025';
      c++;
  }
  if(numSum==16){
      gameNumCombo[c]='8026';
      c++;
  }
  if(numSum==17){
      gameNumCombo[c]='8027';
      c++;
  }
  if(numSum==17){
      gameNumCombo[c]='8027';
      c++;
  }
  if((gameNum[0]==1&&gameNum[1]==2)||(gameNum[1]==1&&gameNum[2]==2)||(gameNum[0]==1&&gameNum[2]==2)){
      gameNumCombo[c]='8028';
      c++;
  }
  if((gameNum[0]==1&&gameNum[1]==3)||(gameNum[1]==1&&gameNum[2]==3)||(gameNum[0]==1&&gameNum[2]==3)){
      gameNumCombo[c]='8029';
      c++;
  }
  if((gameNum[0]==1&&gameNum[1]==4)||(gameNum[1]==1&&gameNum[2]==4)||(gameNum[0]==1&&gameNum[2]==4)){
      gameNumCombo[c]='8030';
      c++;
  }
  if((gameNum[0]==1&&gameNum[1]==5)||(gameNum[1]==1&&gameNum[2]==5)||(gameNum[0]==1&&gameNum[2]==5)){
      gameNumCombo[c]='8031';
      c++;
  }
  if((gameNum[0]==1&&gameNum[1]==6)||(gameNum[1]==1&&gameNum[2]==6)||(gameNum[0]==1&&gameNum[2]==6)){
      gameNumCombo[c]='8032';
      c++;
  }
  if((gameNum[0]==2&&gameNum[1]==3)||(gameNum[1]==2&&gameNum[2]==3)||(gameNum[0]==2&&gameNum[2]==3)){
      gameNumCombo[c]='8033';
      c++;
  }
  if((gameNum[0]==2&&gameNum[1]==4)||(gameNum[1]==2&&gameNum[2]==4)||(gameNum[0]==2&&gameNum[2]==4)){
      gameNumCombo[c]='8034';
      c++;
  }
  if((gameNum[0]==2&&gameNum[1]==5)||(gameNum[1]==2&&gameNum[2]==5)||(gameNum[0]==2&&gameNum[2]==5)){
      gameNumCombo[c]='8035';
      c++;
  }
  if((gameNum[0]==2&&gameNum[1]==6)||(gameNum[1]==2&&gameNum[2]==6)||(gameNum[0]==2&&gameNum[2]==6)){
      gameNumCombo[c]='8036';
      c++;
  }
  if((gameNum[0]==3&&gameNum[1]==4)||(gameNum[1]==3&&gameNum[2]==4)||(gameNum[0]==3&&gameNum[2]==4)){
      gameNumCombo[c]='8037';
      c++;
  }
  if((gameNum[0]==3&&gameNum[1]==5)||(gameNum[1]==3&&gameNum[2]==5)||(gameNum[0]==3&&gameNum[2]==5)){
      gameNumCombo[c]='8038';
      c++;
  }
  if((gameNum[0]==3&&gameNum[1]==6)||(gameNum[1]==3&&gameNum[2]==6)||(gameNum[0]==3&&gameNum[2]==6)){
      gameNumCombo[c]='8039';
      c++;
  }
  if((gameNum[0]==4&&gameNum[1]==5)||(gameNum[1]==4&&gameNum[2]==5)||(gameNum[0]==4&&gameNum[2]==5)){
      gameNumCombo[c]='8040';
      c++;
  }
  if((gameNum[0]==4&&gameNum[1]==6)||(gameNum[1]==4&&gameNum[2]==6)||(gameNum[0]==4&&gameNum[2]==6)){
      gameNumCombo[c]='8041';
      c++;
  }
  if((gameNum[0]==5&&gameNum[1]==6)||(gameNum[1]==5&&gameNum[2]==6)||(gameNum[0]==5&&gameNum[2]==6)){
      gameNumCombo[c]='8042';
      c++;
  }
  if(gameNum[0]==1 || gameNum[1]==1 || gameNum[2]==1){
      gameNumCombo[c]='8043';
      c++;
  }
  if(gameNum[0]==2 || gameNum[1]==2 || gameNum[2]==2){
      gameNumCombo[c]='8044';
      c++;
  }
  if(gameNum[0]==3 || gameNum[1]==3 || gameNum[2]==3){
      gameNumCombo[c]='8045';
      c++;
  }
  if(gameNum[0]==4 || gameNum[1]==4 || gameNum[2]==4){
      gameNumCombo[c]='8046';
      c++;
  }
  if(gameNum[0]==5 || gameNum[1]==5 || gameNum[2]==5){
      gameNumCombo[c]='8047';
      c++;
  }
  if(gameNum[0]==6 || gameNum[1]==6 || gameNum[2]==6){
      gameNumCombo[c]='8048';
      c++;
  }
  if(gameNum[3]==2){
      gameNumCombo[c]='8049';
      c++;
  }
  if(gameNum[3]==1){
      gameNumCombo[c]='8050';
      c++;
  }
  if(gameNum[4]==1 && gameNum[3]!=0){
      gameNumCombo[c]='8051';
      c++;
  }
  if(gameNum[4]==0 && gameNum[3]!=0){
      gameNumCombo[c]='8052';
      c++;
  }
  return gameNumCombo;
}

/*const code = require(pomelo.app.getBase()+'/app/consts/code.js');

var gameNum = [1,1,1,0,1]; //[n1,n2,n3,大2小1豹0,奇1偶0]
var numSum = 3;
transGameNum(gameNum,numSum).then(data =>{
  console.log(code.SQL_ERROR);
  console.log(data);
}).catch(error => {
  console.log(error);
});*/

/*const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,null,dbslave,dbmaster,53,111);
let isFriendReady = 1;
const watchMovie = new Promise((resolve, reject) => {
  if (isFriendReady) {
      return resolve('You are going to watch a Fast Furious 8');
  } else {
      var reason = new Error('Your friend is not Ready');
      return reject(reason);
  }
});

const gameMade = new Promise ((resolve , reject) => { //寫入期數
    gameSql.InsertPeriod(111,1111,11111,function(res){
      return resolve (res);
    });
  });
const askFriend = async() => {
  const result = await watchMovie;
  const result2 = await gameMade;
  console.log(result2)
  return result;
}
askFriend()
  .then(result => {
     //console.log(result);
  })
  .catch(err => {
      console.error(err);
  })*/

/*var a = 1;
const a1 = new Promise((resolve,reject) =>{
  setTimeout(function(){
    console.log(a);
    a = 2;
    console.log('a1');
    return resolve(5);
  },2000);
});

const b2 = new Promise((resolve,reject) =>{
    setTimeout(function(){
    console.log('b2');
    console.log(a);
    return resolve('b2');
  },3000);
});

const c3 = new Promise((resolve,reject) =>{
    setTimeout(function(){
    console.log('c3');
    return resolve('c3');
  },4000);
});

const test1 = async() => {
  const res1 = await a1;
  const res2 = await b2;
  const res3 = await c3;
  console.log(8);
  return [res1,res2,res3];
}

test1()
  .then(result => {
      console.log(result);
  })
  .catch(err => {
      console.error(err);
  });*/


/*async function waitAndPrint(toPrint) {
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(toPrint);
      resolve();
    },  1000);
  });
}

const arrayOfNumbers = [1, 2, 3, 4];

async function forEachAsync(array, func) {
  for (const item of array) {
    await func(item);
  }
}

forEachAsync(arrayOfNumbers, async (num) => {
  await waitAndPrint(num)
});

console.log('hello !');*/


/*  var cont = 1;
  function signin (){
  console.log(cont);
  // i am doing some async
  return new Promise((resolve, reject)=>{
    if((++cont) === 6){
      setTimeout(reject(cont),1000*cont);
    } else {
      setTimeout(resolve(cont),1000*cont);
    }
  })
}

async function main() {
  try {
    await signin();
    await signin();
    await signin();
    await signin();
    await signin();
    await signin();
    await signin();
    return signin();
  } catch(er){
    console.log("error: " +cont);
    return er;
  }
}

main();*/

const arr = [1,2,3,4,5]
const asyncFn = data => {
  console.warn(data);
}
const p = arr.map(async num => {
  await asyncFn(num)
  return ++num
})

Promise.all(p).then(results => {
  console.log(results)
})

//app.start();


process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
