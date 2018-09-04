module.exports = function() {
  return new Filter();
}

var Filter = function() {
};

Filter.prototype.before = function (msg, session, next) {
  const pomelo = require('pomelo');
  const bypass = (require(pomelo.app.getBase()+'/app/config/Filter_BypassParam.js')).gameFilter;
  const logger = require('pomelo-logger').getLogger('server-error','fruitWheelFilter');
  const dbslave = pomelo.app.get('dbslave');
  const redis = pomelo.app.get('redis');
  const config = pomelo.app.get(pomelo.app.getServerType());
  const async = require('async');
  const code = require(pomelo.app.getBase()+'/app/consts/code.js');
  const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,config.EGAMEID,channelID);
  //const gameRedis = new (require(pomelo.app.getBase()+'/app/lib/lib_GameRedis.js'))(pomelo,pomelo.app,config.EGAMEID,channelID);
  var ServergameID = 0;
  var checkStatus = false;
  var lockAccount = 0;
  if(msg.route == "fruitWheel.fruitWheelHandler.B")
  {
    var betData = (JSON.parse(msg.bet)).data;
    var channelID = betData.channelID;
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.sismember("GS:lockAccount:fruitWheel",session.uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:fruitWheel",session.uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(code.ERR_LOCKACCOUNT,'LockAccount未解除');
          }
        });
      },
      checkChannel: function(callback){
        if(channelID==101 || channelID==102 || channelID==105 || channelID==110){
          callback(null,200);
        }
        else{
          callback(code.ERR_CHANNEL,'下注区错误');
        }
      },
      checkStatus: function(callback_0){
        redis.hget('GS:GAMESERVER:fruitWheel', "Status"+channelID, function (err, res) {
          if(err){
            callback_0(code.REDIS_ERROR,'Redis ERROR');
          }else{
            if(!res){
              callback_0(code.REDIS_ERROR,'Redis ERROR');
            }else{ //success
              if(res!='T'){
                //checkStatus=false;
                callback_0(code.ERR_GAME_STATUS,'已關盤不可下注,帳號:'+session.uid);
              }else{
                //checkStatus=true;
                callback_0(null,200);
              }
            }
          }
        });
      },
      checkGameID: function(callback_1){
        redis.hget('GS:GAMESERVER:fruitWheel', "GameID"+channelID, function (err, res) {
          if(err){
            callback_1(code.REDIS_ERROR,'Redis ERROR');
          }else{
            if(res==null){
              callback_1(code.REDIS_ERROR,'Redis NULL result');
            }else{
              ServergameID=res;
              if(res==betData.GamesID){
                callback_1(null,200);
              }else{
                callback_1(code.ERR_PERIODID,'下注期数错误');
              }
            }
          }
        });
      },
      checkBet: function(callback_2){
        dbslave.query('SELECT count(*) as c FROM bet_g51 where bet005 = ? and bet009 = ? and betstate = ? and bet012 = ?',[session.uid,ServergameID,0,channelID],function(data)
        {
          if(data.ErrorCode==0){
            if(data.rows[0].c!=0){
              callback_2(1,'该局已下注');
            }else{
              gameSql.GetUserMoneyMaster(session.uid,function(res){
                if(res!=null){
                  if(betData.total===0 || res<betData.total){ //檢查Client下注總金額和下注內容金額有無相同
                    callback_2(code.NOT_ENOUGH_MONEY,'馀额不足或下注错误');
                  }
                  else{
                    callback_2(null,200);
                  }
                }else{ //取餘額錯誤 
                  callback_2(code.SQL_ERROR,'SQL ERROR');
                }
              });
            }
          }
        });
      },
      checkBetLimit: function(callback_3){
        //計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
        var betDataCheck = false;
        for(let i =0 ; i<6 ; i++){
          if(betData[i]>0)
            betDataCheck = true;
        }
        /*var betDataCheck = betData.some(function(item, index, array){
          return item > 0 ;
        });*/
        if(!betDataCheck){
          callback_3(code.ERR_OVER_BET_LIMIT,'单一下注超出限制或低于限制');
        }else{
          callback_3(null,200);
        }
      }
    },
    function(err, res)
    {
      switch(err){
        case -1: //LockAccount帳戶鎖定
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.lockAccount);
          break;
        case -2: //區號ID錯誤
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkChannel);
          break;
        case -3: //餘額不足
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkBet);
          break;
        case -4: //已下注
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkBet);
          break;
        case -5: //已關盤
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkStatus);
          break;
        case -6: //超出下注限制
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkBetLimit);
          break;
        case -7: //期數ID錯誤
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+res.checkGameID);
          break;
        case 500:
        case 501:
          next(new Error('ServerQuestion'),err);
          logger.error('ERROR：'+err+'|'+'SQL REDIS ERROR');
          break;
        default:
          var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); //放在最後一行
      }
    });//async.series END
  }
  else if(msg.route == "fruitWheel.fruitWheelHandler.A")
  {
    redis.sismember("GS:lockAccount:fruitWheel",session.uid,function(err,res){
      if(res==0){ 
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); 
      }
      else{
        next(new Error('ClientQuestion'),300); //阻擋下注後退出遊戲再進入遊戲
      }
    });
  }
  else
  { //非下注route
    var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); //放在最後一行
  }
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

