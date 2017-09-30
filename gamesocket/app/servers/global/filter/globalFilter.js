var async = require('async');

module.exports = function() {
  return new Filter();
}

var Filter = function() {
};

var bypass = {
  "ce":'connector.entryHandler.',
  "fw":"fruitWheel.fruitWheelHandler.",
}

//globalfilter---->globalhandle---->routerecord--->gamefilter---->gamehandler

Filter.prototype.before = function (msg, session, next) {
  var routeFilter=(msg.route).replace(/\./g,"");
  var res1 = routeFilter.substring(0, 2);
  var res2 = routeFilter.substring(2, 3);

	async.waterfall([
		function(callback_1){
      msg.route = bypass[res1];
      if( msg.route==null)
          callback_1(1,'cmd error');

      msg.route =  msg.route + res2;
      callback_1(null);
		},
    function(callback_2){
      if(routeFilter=='ceC' || routeFilter=='ceM'){
        callback_2(null,'OK');
      }
      else{
        if(session.uid == null){
          callback_2(1,'請登入遊戲！');
          //next(new Error('Unlogin!'));
          //return;
        }
        else if(session.get('Stop')==1){
          callback_2(1,'Stop');
        }
        else{
          callback_2(null,'OK');
        }
      }
    } 
	], 
		function(err,res) {
      if(err){
        next(new Error(res),msg.route,res);
      }
			else if(msg.route==null){
				 next(new Error('routeError'),msg.route,'routeError');
			}
      else{
        var ts=(msg.route).split('.');
        var routeRecord={
            route: msg.route,
            serverType: ts[0],
            handler: ts[1],
            method: ts[2]
        };
        next(null,routeRecord);
      }
      console.log('>>>>>>>>>>>>>globalFilter before' );
		}
	);
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  console.log('>>>>>>>>>>>>>globalFilter after:' );
  
  next(err, resp);
};

