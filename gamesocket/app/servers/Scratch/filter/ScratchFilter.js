//var logger = require('pomelo-logger').getLogger(__filename);
const pomelo = require('pomelo');
const dbslave = pomelo.app.get('dbslave');
const dbmaster = pomelo.app.get('dbmaster');
const redis = pomelo.app.get('redis');
const async = require('async');
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
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.sismember("GS:lockAccount:Scratch",session.uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:Scratch",session.uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(1,500);
          }
        });
      },
      checkChannel: function(callback){
        if(channelID==111){
          cost = 20;
          callback(null,200);
        }else if(channelID==222){
          cost = 40;
          callback(null,200);
        }else if(channelID==333){
          cost = 60;
          callback(null,200);
        }else if(channelID==444){
          cost = 100;
          callback(null,200);
        }
        else{
          callback(1,500);
        }
      },
      checkBet: function(callback_2){
        dbslave.query('SELECT mem100 from users where mid = ?',[session.uid],function(data)//duegame
          {
            if(data.ErrorCode==0)
            {
              var sessionMoney=data.rows[0].mem100;
              //計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
              async.series({
                A:function(callback_A){
                  if(total===0 || sessionMoney<total){ //檢查Client下注總金額和下注內容金額有無相同
                    callback_A(1,'馀额不足或下注错误');
                  }else if(!channelID){
                    callback_A(1,'游戏区号错误');
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
              callback_2(1,'网路连线异常');
            }
          });
      }
    },
    function(err, res)
    {
      if(err)
      {
        if(res.lockAccount==500 || res.checkChannel ==500)
        {
          next(new Error('ServerQuestion'),'网路连线异常，代码500');
        }else{
          next(new Error('BetQuestion'),res.checkBet);
        }
        
      }else
      {
        //console.log(res); //OK
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); //放在最後一行
      }
    });//async.series END
  }
  else if(msg.route == "Scratch.ScratchHandler.A")
  {
    redis.sismember("GS:lockAccount:Scratch",session.uid,function(err,res){
      if(res==0){ 
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ScratchFilter"); 
      }
      else{
        next(new Error('ClientQuestion'),300); //阻擋下注後退出遊戲再進入遊戲
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

