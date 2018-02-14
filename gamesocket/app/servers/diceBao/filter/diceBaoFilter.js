//var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var dbslave = pomelo.app.get('dbslave');
var dbmaster = pomelo.app.get('dbmaster');
var redis = pomelo.app.get('redis');
var async = require('async');
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
    "G":"GetGameSet"
}

Filter.prototype.before = function (msg, session, next) {
  var ServergameID = 0;
  var checkStatus = false;
  var lockAccount = 0;
  if(msg.route == "diceBao.diceBaoHandler.B")
  {
    var betData = JSON.parse(msg.bet).bets;
    var channelID = JSON.parse(msg.bet).channelID;
    var total = JSON.parse(msg.bet).total
    var ClientgameID = JSON.parse(msg.bet).GamesID;
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.sismember("GS:lockAccount:diceBao",session.uid,function(err,res){
          if(res==0){
            redis.sadd("GS:lockAccount:diceBao",session.uid);
            lockAccount = 1;
            callback(null,200);
          }
          else{
            callback(1,500);
          }
        });
      },
      checkChannel: function(callback){
        if(channelID==101 || channelID==102 || channelID==105)
        {
          callback(null,200);
        }
        else{
          callback(1,500);
        }
      },
      checkStatus: function(callback_0){
        redis.hget('GS:GAMESERVER:diceBao', "Status"+channelID, function (err, res) {
          if(err){
            callback_0(1,500);
          }else{
            if(!res){
              callback_0(1,500);
            }else{ //success
              if(res!='T'){
                checkStatus=false;
                callback_0(0,200);
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
            callback_1(1,500);
          }else{
            if(res==null){
              callback_1(1,500);
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
          if(data.ErrorCode==0)
          {
            if(data.rows[0].c!=0)
            {
              callback_2(1,'該局已下注');
            }
            else
            {
              //dbslave.query('SELECT mem100 from member where mem001 = ?',[session.uid],function(data){ //nsc
              dbslave.query('SELECT mem100 from users where mid = ?',[session.uid],function(data)//duegame
              {
                if(data.ErrorCode==0)
                {
                  //var sessionMoney=data.rows[0].mem100;
                  var sessionMoney=data.rows[0].mem100;
                  //var amount=0;//下注總金額
                  var betDataCheck=false;
                  //計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
                  async.series({
                    Z: function(callback_Z){
                      for(var i in betData){
                        if(betData[i]!=0){
                          //amount= amount+betData[i]; //計算下注總金額
                          betDataCheck=true;
                        }
                      }
                      callback_Z(null,0);
                    },
                    A:function(callback_A){
                      if(!betDataCheck){
                        //檢查沒有押注就送出
                        callback_A(1,'未下注');
                      } 
                      else if(total===0 || sessionMoney<total){ //檢查Client下注總金額和下注內容金額有無相同
                        callback_A(1,'馀额不足或下注错误');
                      }
                      else if(ServergameID!=ClientgameID){
                        //檢查期數
                        callback_A(1,'下注期数错误');
                      }
                      else if(!channelID){
                        callback_A(1,'游戏区号错误');
                      }
                      else if(!checkStatus){
                        callback_A(1,'已关盘');
                      }
                      else if(!lockAccount){
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
          }
        });
      }
    },
    function(err, res)
    {
      if(err)
      {
        if(res.lockAccount==500 || res.checkStatus==500 || res.checkGameID == 500 || res.checkChannel ==500)
        {
          next(new Error('ServerQuestion'),'网路连线异常');
        }else{
          next(new Error('BetQuestion'),res.checkBet);
        }
        
      }else
      {
        //console.log(res); //OK
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"diceBaoFilter"); //放在最後一行
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
        next(new Error('ClientQuestion'),300); //阻擋下注後退出遊戲再進入遊戲
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

