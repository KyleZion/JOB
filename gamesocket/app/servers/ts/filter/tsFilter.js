var pomelo = require('pomelo');
module.exports = function() {
  return new Filter();
}

var Filter = function() {
};


var bypass = {
  "t":'test'
}
Filter.prototype.before = function (msg, session, next) {

 
  var iFilter_Base = new require(pomelo.app.getBase() + "/app/lib/Filter_Base.js")(bypass,msg,next,"tsfilter");//放在最後一行
};

Filter.prototype.after = function (err, msg, session, resp, next) {
  	next(err, resp);
};

