var logger = require('pomelo-logger').getLogger(__filename);
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
  "C":'Connect',
  "M":"MemberLogin",
  "o":"MemberLogout",
  "S":"CSLogin"
}

Filter.prototype.before = function (msg, session, next) {
  //doshomething
  var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"ConnectorFilter"); //放在最後一行
};

Filter.prototype.after = function (err, msg, session, resp, next) {

  next(err, resp);
};

