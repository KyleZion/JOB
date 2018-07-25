module.exports = function() {
  return new Filter();
}

var Filter = function() {
};

var bypass = {
    "B":"bet",
    "I":"GetGameID", 
    "M":"GetMoney",
    "T":"GetTimeZone",
    "H":"GetHistory",
    "S":"GetStatus",
    "O":"GetBetTotal",
    "A":"AddtoChannel",
    "L":"LeaveChannel",
    "G":"GetGameSet",
    "R":"GameResult",
    "E":"GameRestrict"
}

Filter.prototype.before = function (msg, session, next) {
  const logger = require('pomelo-logger').getLogger('con-log','diceBaoFilter');
  const pomelo = require('pomelo');
  const dbslave = pomelo.app.get('dbslave');
  const dbmaster = pomelo.app.get('dbmaster');
  const redis = pomelo.app.get('redis');
  const async = require('async');
  const code = require(pomelo.app.getBase()+'/app/consts/code.js');
  var ServergameID = 0;
  var checkStatus = false;
  var lockAccount = 0;
  if(msg.route == "diceBao.diceBaoHandler.B")
  {
    var betData = JSON.parse(msg.bet).bets;
    var channelID = JSON.parse(msg.bet).channelID;
    var total = JSON.parse(msg.bet).total
    var ClientgameID = JSON.parse(msg.bet).GamesID;
    const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,channelID);
    var min =0;
    var max =0;
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.sismember("GS:lockAccount:diceBao",session.uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:diceBao",session.uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(code.ERR_LOCKACCOUNT,'LockAccount未解除');
          }
        });
      },
      checkChannel: function(callback){
        if(channelID==111){
          max = 50000;
          min = 100;
          callback(null,200);
        }else if(channelID==222){
          max = 10000;
          min = 50;
          callback(null,200);
        }else if(channelID==333){
          max = 1000;
          min = 10;
          callback(null,200);
        }
        else{
          callback(code.ERR_CHANNEL,'下注区错误');
        }
      },
      checkStatus: function(callback_0){
        redis.hget('GS:GAMESERVER:diceBao', "Status"+channelID, function (err, res) {
          if(err){
            callback_0(code.REDIS_ERROR,'Redis ERROR');
          }else{
            if(!res){
              callback_0(code.REDIS_ERROR,'Redis ERROR');
            }else{ //success
              if(res!='T'){
                checkStatus=false;
                callback_0(code.ERR_GAME_STATUS,'已關盤不可下注,帳號:'+session.uid);
              }else{
                checkStatus=true;
                callback_0(null,200);
              }
            }
          }
        });
      },
      checkGameID: function(callback_1){
        //betData = (JSON.parse(msg.bet)).data; //將C2傳來的下注內容string轉JSON
        redis.hget('GS:GAMESERVER:diceBao', "GameID"+channelID, function (err, res) {
          if(err){
            callback_1(code.REDIS_ERROR,'Redis ERROR');
          }else{
            if(res==null){
              callback_1(code.REDIS_ERROR,'REDIS NULL result');
            }else{
              ServergameID=res;
              callback_1(null,200);
            }
          }
        });
      },
      checkBet: function(callback_2){
        dbslave.query('SELECT count(*) as c FROM bet_g52 where bet005 = ? and bet009 = ? and betstate = ?  and bet012 = ?',[session.uid,ServergameID,0,channelID],function(data)
        {
          if(data.ErrorCode==0){
            if(data.rows[0].c!=0){
              callback_2(1,'該局已下注');
            }
            else{
              gameSql.GetUserMoneyMaster(session.uid,function(res){
                //UserMoney = res;
                if(res!=null){
                  var betDataCheck = betData.some(function(value, index,) {
                      return (value > max && value <min) ? true : false ;
                  });
                  async.series({
                    A:function(callback_A){
                      if(!betDataCheck){
                        //押注超出限制
                        callback_A(code.ERR_OVER_BET_LIMIT,'单一下注超出限制或低于限制');
                      } else if(total===0 || res<total){ //檢查Client下注總金額和下注內容金額有無相同
                        callback_A(code.NOT_ENOUGH_MONEY,'馀额不足或下注错误');
                      }else if(ServergameID!=ClientgameID){
                        //檢查期數
                        callback_A(code.ERR_PERIODID,'下注期数错误');
                      }else if(!checkStatus){
                        callback_A(1,'已关盘');
                      }else if(!lockAccount){
                        callback_A(1,'请勿连续下注');
                      }
                      else{
                        callback_A(null,200);
                      }
                      //=============================================================
                    }
                  },
                  function(err, results) {
                    if(err){
                      console.log("下注檢查完成,錯誤");
                      callback_2(1,results.A);
                      //next(new Error('BetQuestion'),results.A);
                    }else{
                      console.log("下注檢查完成");
                      callback_2(null,200);
                    }
                  });
                }else{ //取餘額錯誤 
                  callback_2(code.SQL_ERROR,'SQL ERROR');
                }
              });
            }
          }
        });
      }
    },
    function(err, res)
    {
      switch(err){
        case -1: //LockAccount
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.lockAccount);
          break;
        case -2: //ChannelID ERROR
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.checkChannel);
          break;
        case -3: //餘額不足
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.checkBet);
          break;
        case -4: //已關盤
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.checkStatus);
          break;
        default:
          var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); //放在最後一行
      }
    });//async.series END
  }
  else if(msg.route == "diceBao.diceBaoHandler.A")
  {
    redis.sismember("GS:lockAccount:diceBao",session.uid,function(err,res){
      if(res==0){ 
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"diceBaoFilter"); 
      }
      else{
        next(new Error('ServerQuestion'),'网路连线异常:'+code.ERR_LOCKACCOUNT);
        logger.error('ERROR：LOCK_ACCOUNT');
      }
    });
  }
  else{ //非下注route
   var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"diceBaoFilter"); //放在最後一行
  }
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

