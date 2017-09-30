var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var async = require('async');
var utils = require('../util/utils');

var memberDao = module.exports;

memberDao.getMem100 = function(mem001,cb){
	dbslave = pomelo.app.get('dbslave');
	var sql = 'SELECT mem100 from member where mem001 = ?';
	var args = [mem001];
	dbslave.query(sql,args,function(res) {
		//console.log(res);
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorMessage, null);
		} else {
			//if (!!res && res.length === 1) {
			if (!!res) {
				var rs = res.rows[0];
				//console.log(rs);
				utils.invokeCallback(cb, null, rs.mem100);
			} else {
				utils.invokeCallback(cb, null,res);
			}
		}
	});
}
