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
    "G":"GetGameID", 
    "M":"GetMoney",
    "T":"GetTimeZone",
    "H":"GetHistory",
    "S":"GetStatus",
    "O":"GetBetTotal"
}

Filter.prototype.before = function (msg, session, next) {
  var gameID = 0;
  var checkStatus = false;
  var betData;
  var lockAccount = 0;
  if(msg.route=="fruitWheel.fruitWheelHandler.B"){
    async.series({
      lockAccount: function(callback){ //redis修正
        redis.hexists("lockAccount:"+session.uid,"BET_TIME",function(p1,p2)
        {
          if(p2==0)
          { //未進入程序過
            redis.hset("lockAccount:"+session.uid,"BET_TIME",new Date(),function(err,res)
            {
              if(res==1)
              {
                console.log('aaaaaaa');
                lockAccount=res;
                callback(null,200);
              }else
              {
                callback(null,500);
              }
            });
          }
          else
          { //
            redis.hget("lockAccount:"+session.uid,"BET_TIME", function (err, obj) {
              var timeDiff = (Math.abs(new Date() - new Date(obj).getTime()))/1000;
              if(timeDiff>10)
              {
                console.log('bbbbbbbbbbb');
                lockAccount=1;
                redis.hset("lockAccount:"+session.uid, "BET_TIME", new Date());
                callback(null,200);
              }else{
                callback(null,500);
              }
            });
          }
        });

      },
      checkStatus: function(callback_0){
        redis.hget('GS:GAMESERVER:fruitWheel', "Status", function (err, res) {
          if(!err){
            callback_0(0,500);
          }else{
            if(!res){
              callback_0(0,500);
            }else{ //success
              if(res!='T'){
                checkStatus=false;
                callback_0(0,500);
              }else{
                checkStatus=true;
                callback_0(null,200);
              }
            }
          }
        });
      },
      checkGameID: function(callback_1){
        betData = (JSON.parse(msg.bet)).data; //將C2傳來的下注內容string轉JSON
        redis.hget('GS:GAMESERVER:fruitWheel', "GameID", function (err, res) {
          if(err){

          }else{
            if(res==null){

            }else{
              gameID=res;
              callback_1(null,res);
            }
          }
        });
      },
      checkBet: function(callback_2){
        dbslave.query('SELECT count(*) as c FROM bet_g51 where bet005 = ? and bet009 = ? and betstate = ?',[session.uid,gameID,0],function(data)
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
              dbslave.query('SELECT mem006 from member2 where mem002 = ?',[session.uid],function(data)//egame
              {
                if(data.ErrorCode==0)
                {
                  //var sessionMoney=data.rows[0].mem100;
                  var sessionMoney=data.rows[0].mem006;
                  //var amount=0;//下注總金額
                  var betDataCheck=false;
                  //計算下注總金額以及下注內容轉資料庫格式key0~6為下注號碼
                  async.series({
                    Z: function(callback_Z){
                      for(var i=0;i<=6;i++){
                        if(betData[i]!=0){
                          //amount= amount+betData[i]; //計算下注總金額
                          betDataCheck=true;
                        }
                      }
                      callback_Z(null,0);
                    },
                    A: function(callback_A){
                      if(!betDataCheck){
                        //檢查沒有押注就送出
                        callback_A(1,'未下注');
                      } 
                      else if(betData.total===0 || sessionMoney<betData.total){ //檢查Client下注總金額和下注內容金額有無相同
                        callback_A(1,'餘額不足或下注錯誤');
                      }
                      else if(betData.GamesID!=gameID){
                        //檢查期數
                        callback_A(1,'下注期數錯誤');
                      }
                      else if(!checkStatus){
                        callback_A(1,'已關盤');
                      }
                      else if(!lockAccount){
                        callback_A(1,'請勿連續下注');
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
                  callback_2(1,'網路連線異常');
                }
              });
            }
          }
        });
      }
    },
    function(err, res) {
      if(err){
        next(new Error('BetQuestion'),res.checkBet);
      }else{
        //console.log(res); //OK
        var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); //放在最後一行
      }
    }
    )
  }else{ //非下注route
   var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"fruitWheelFilter"); //放在最後一行
  }
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  /*redis.srem('lockAccount:',session.uid,function(err,res){
    if(res==1){
      next(err, resp);
    }else{
      next(err, resp);
    }
  });*/
  next(err, resp);
};

