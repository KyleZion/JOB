var async = require('async');
var pomelo = require('pomelo');
module.exports = function() {
  return new Filter();
}

var Filter = function() {
};


var bypass = {
  "ce":'connector.entryHandler.',
  "fw":"fruitWheel.fruitWheelHandler.",
  "tt":"transfer.transferHandler.",
  "dd":"diceBao.diceBaoHandler.",
  "mm":"manager.managerHandler.",
  "sg":"Scratch.ScratchHandler."
}


//globalfilter---->globalhandle---->routerecord--->gamefilter---->gamehandler

Filter.prototype.before = function (msg, session, next) {
  var routeFilter=(msg.route).replace(/\./g,"");
  var res1 = routeFilter.substring(0, 2);
  var res2 = routeFilter.substring(2, 3);

  var ts = "";
  async.waterfall([
    function(callback_1){
      msg.route = bypass[res1];
      if( msg.route==null)
          callback_1(1,'cmd error');

      msg.route =  msg.route + res2;
      ts = (msg.route).split('.');
      callback_1(null)
    },
    function(callback_2){

      if(session.get('Stop')==1)
      {   
        callback_2(1,'Stop');
      }
      else
      {
        if(session.uid == null)
        {
          if(routeFilter=='ceC' || routeFilter=='ceM' || routeFilter=='ceS')
            callback_2(null,'OK');
          else
            callback_2(1,'請登入遊戲！!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        }
        else if(routeFilter=='ceC' || routeFilter=='ceM' || routeFilter=='ceS'){
            callback_2(2,'請勿重新登入');
        }
        else if(routeFilter=='ceo'){ //登出
          callback_2(null,'OK');
        }
        else
        {
          var serverType = ts[0];
          var redis=pomelo.app.get('redis');
          var Base_Param = require('../../../consts/Base_Param.js');
          var GPB = new Base_Param();
          var gamename = "000";
          if(serverType!="manager"){
            async.series({
              E: function(MLcallback){
                redis.hget(GPB.rKey_USER+session.uid, "GAMETYPE", function (err, obj) {
                  gamename = obj;
                  MLcallback(null,0);
                })
              },
              F: function(MLcallback){
                if(gamename=="000" ||gamename=="0" || gamename==null)
                  MLcallback(1,'請登入遊戲！');
                else{
                  if(gamename==serverType)
                    MLcallback(null,'OK');
                  else
                    MLcallback(2,'指令不相符');
                }
              }
            },function(err, results) { callback_2(err,results);});
          }else{ //manager
            callback_2(null,'OK');
          }
        }
      }
      
  }], 
    function(err,res) {
      if(err){
        next(new Error(res),msg.route,res);
      }
      else if(msg.route==null){
         next(new Error('routeError'),msg.route,'routeError');
      }
      else{
        var routeRecord={
            route: msg.route,
            serverType: ts[0],
            handler: ts[1],
            method: ts[2]
        };
        next(null,routeRecord);
      }

    }
  );
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  next(err, resp);
};

