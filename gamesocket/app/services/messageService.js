var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
//var EntityType = require('../consts/consts').EntityType;

var exp = module.exports;

exp.pushMessageByUids = function (uids, route, msg) {
	pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, errHandler);
};

exp.pushMessageToPlayer = function (uid, route, msg) {

  exp.pushMessageByUids([uid], route, msg);
};

exp.pushMessageToChannel = function (uid, route, msg) {

  pomelo.app.get('channel').pushMessage(route, msg, opts, cb)
};

exp.broadcast = function (stype, route, msg) {

  pomelo.app.get('channelService').broadcast(stype, route,msg, {  
    binded: true  
}, function(err) {  
    if (err) {  
        console.log(err);  
    }  
});
};

/*exp.pushMessageByAOI = function (area, msg, pos, ignoreList) {
  var uids = area.timer.getWatcherUids(pos, [EntityType.PLAYER], ignoreList);

  if (uids.length > 0) {
    exp.pushMessageByUids(uids, msg.route, msg);
  }
};*/

function errHandler(err, fails){
	if(!!err){
		logger.error('Push Message error! %j', err.stack);
	}
}