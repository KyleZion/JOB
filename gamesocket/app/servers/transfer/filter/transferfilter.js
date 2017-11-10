var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var dbslave = pomelo.app.get('dbslave');
var dbmaster = pomelo.app.get('dbmaster');
var redis = pomelo.app.get('redis');
var async = require('async');
var Base_Param = require('../../../consts/Base_Param.js');
var GPB = new Base_Param();
module.exports = function() {
  return new Filter();
}


var Filter = function() {

};

var bypass = {
  "T":"Transfer"
}

Filter.prototype.before = function (msg, session, next) {
  //doshomething
  redis.hget(GPB.rKey_USER+session.uid, "TRANS_TIME", function (err, obj) {
    var timeDiff = (Math.abs(new Date() - new Date(obj).getTime()))/1000;
    if(timeDiff>60) //連續轉帳不能低於60秒
    {
      if(msg.amount<10){
        next(new Error('amountError'),'轉帳額度需在10元以上');
      }else{
        redis.hset(GPB.rKey_USER+session.uid, "TRANS_TIME", new Date());//若Redis掛了就Select users updated_at 欄位?
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"transferFilter"); //放在最後一行
      }
    }
    else
    {
      next(new Error('TimeError'),'請勿頻繁轉帳！');
    }
  });
  
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

