const logger = require('pomelo-logger').getLogger('con-log','ScratchFilter');
const pomelo = require('pomelo');
const dbslave = pomelo.app.get('dbslave');
const dbmaster = pomelo.app.get('dbmaster');
const redis = pomelo.app.get('redis');
const async = require('async');
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
module.exports = function() {
  return new Filter();
}

var Filter = function() {
};

var bypass = {
    "B":"bet",
    "I":"GetGameID", 
    "M":"GetMoney",
    "A":"AddtoChannel",
    "L":"LeaveChannel"
}

Filter.prototype.before = function (msg, session, next) {
  var lockAccount = 0;
  if(msg.route == "Scratch.ScratchHandler.B"){
    var cost = 0;
    var betData = JSON.parse(msg.bet);
    var channelID = betData.channelID;
    var total = betData.total;
    const gameSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameSql.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,53,channelID);
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.sismember("GS:lockAccount:Scratch",session.uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:Scratch",session.uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(code.ERR_LOCKACCOUNT,'本期尚未开奖，请稍后');
          }
        });
      },
      checkChannel: function(callback){
        if(channelID==111 && total == 20){
          callback(null,200);
        }else if(channelID==222 && total == 40){
          callback(null,200);
        }else if(channelID==333 && total == 60){
          callback(null,200);
        }else if(channelID==444 && total == 100){
          callback(null,200);
        }
        else{
          callback(code.ERR_CHANNEL,'下注区错误');
        }
      },
      checkBet: function(callback_2){
        gameSql.GetUserMoneyMaster(session.uid,function(res){
          if(res){
            var sessionMoney=res;
            if(total===0 || res<total){
              callback_2(code.NOT_ENOUGH_MONEY,'馀额不足');
            }else{
              callback_2(null,200);
            }
          }else{ //取餘額錯誤 
            callback_2(code.SQLERROR,'资料库错误');
          }
        });
      }
    },
    function(err, res){
      switch(err){
        case -1:
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.lockAccount);
          break;
        case -2:
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.checkChannel);
          break;
        case -3:
          next(new Error('ServerQuestion'),'网路连线异常:'+err);
          logger.error('ERROR：'+err+'|'+res.checkBet);
          break;
        default:
          var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); //放在最後一行
      }
    });
  }
  else if(msg.route == "Scratch.ScratchHandler.A"){
    redis.sismember("GS:lockAccount:Scratch",session.uid,function(err,res){
      if(res==0){ 
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); 
      }
      else{
        next(new Error('ServerQuestion'),'网路连线异常:'+code.ERR_LOCKACCOUNT);
        logger.error('ERROR：LOCK_ACCOUNT');      
      }
    });
  }
  else{ //非下注route
   var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); //放在最後一行
  }
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

