var logger = require('pomelo-logger').getLogger(__filename);
var pomelo = require('pomelo');
var async = require('async');
var utils = require('../util/utils');
var gameDao = module.exports;

gameDao.getGameId = function(CasinoId,cb){
	dbslave = pomelo.app.get('dbslave');
	var sql = 'SELECT gas001 from games_'+CasinoId+' where gas009 = ? order by gas001 desc limit 1 ';
	var args = [0];
	dbslave.query(sql,args,function(res) {
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorMessage, null);
		} else {
			//if (!!res && res.length === 1) {
			if (!!res) {
				var rs = res.rows[0];
				//console.log(rs);
				utils.invokeCallback(cb, null, rs.gas001);
			} else {
				utils.invokeCallback(cb, null,res);
			}
		}
	});
}

gameDao.getMoney = function(mid,cb){
	dbslave = pomelo.app.get('dbslave');
	//var sql = 'SELECT mem100 from member where mem001 = ?'; //nsc 
	//var sql = 'SELECT mem006 from member2 where mem002 = ?'; //egame
	var sql = 'SELECT mem100 from users where mid = ?'; //duegame
	var args = [mid];
	dbslave.query(sql,args,function(res) {
		//console.log(res);
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorCode, res.ErrorMessage);
		} else {
			var rs = res.rows;
			if (rs.length==1) {
				//console.log(rs[0].mem006);
				//utils.invokeCallback(cb, null, rs.mem100);//nsc
				utils.invokeCallback(cb, null, rs[0].mem006);//egame
			} else {
				utils.invokeCallback(cb, null, 0 );
			}
		}
	});
}

gameDao.getTimezone = function(nowTime,cb){
	dbslave = pomelo.app.get('dbslave');
	var sql='SELECT gas001,(NOW()) as nowtime ,CONCAT(gas006," ",gas007)as endtime FROM games_51 ORDER BY gas001 DESC LIMIT 1'
	var args = [""];
	dbslave.query(sql,args,function(res) {
		//console.log(res);
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorMessage, null);
		} else {
			//if (!!res && res.length === 1) {
			if (!!res) {
				var rs = res.rows[0];
				var timezone =(Date.parse(rs.endtime)-Date.parse(nowTime))/1000;
				utils.invokeCallback(cb, null, timezone);
			} else {
				utils.invokeCallback(cb, null,res);
			}
		}
	});
}

gameDao.getHistory = function(count,cb){
	dbslave = pomelo.app.get('dbslave');
	var sql='SELECT gas001,gas008 FROM games_51 where gas008 <> ? order by gas001 desc limit '+count+'';
	var args=[""];
	dbslave.query(sql,args,function(res) {
		//console.log(res);
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorMessage, null);
		} else {
			//if (!!res && res.length === 1) {
			if (!!res) {
				var history='';
				for (var key in res.rows){
					history=history+res.rows[key].gas008+',';
				}
				history=history.substring(0,history.length-1);
				utils.invokeCallback(cb, null, history);
			} else {
				utils.invokeCallback(cb, null,res);
			}
		}
	});
}

gameDao.getStatus = function(cb){
	dbslave = pomelo.app.get('dbslave');
	var sql='SELECT CONCAT(gas006," ",gas007)as endtime FROM games_51 WHERE gas002  = ? ORDER BY gas001 DESC LIMIT 1'
	var args=[51];
	var status='F';
	dbslave.query(sql,args,function(res) {
		//console.log(res);
		if(res.ErrorCode !=  0) {
			utils.invokeCallback(cb, res.ErrorMessage, null);
		} else {
			//if (!!res && res.length === 1) {
			if (!!res) {
				var NowTime  = Date.parse(new Date());
				var EndTime = Date.parse(res.rows[0].endtime);
				var c = (Date.parse(res.rows[0].endtime)-Date.parse(new Date()))/1000;
				if(c > 0){
					status='T';
				}
				else if(c <= -5){
					status='O';
				}
				else{
					status='F';
				}
				utils.invokeCallback(cb, null, status);
			} else {
				utils.invokeCallback(cb, null,res);
			}
		}
	});
}
gameDao.addMoney = function(betTotal,mid,cb){
	dbmaster = pomelo.app.get('dbmaster');
	//var sql = 'UPDATE member SET mem100 = mem100 + ? where mem001 = ?'; //nsc
	var sql = 'UPDATE member2 SET mem006 = mem006 + ? where mem002 = ?';
	var args=[betTotal,mid];
	dbmaster.update(sql,args,function(res){
		if(res.ErrorCode==0){
			utils.invokeCallback(cb, 0, 200);
		}else{
			utils.invokeCallback(cb, 1 , 500);
		}
	});
}
gameDao.lowerMoney = function(betTotal,mid,cb){
	dbmaster = pomelo.app.get('dbmaster');
	//var sql = 'UPDATE member SET mem100 = mem100 - ? where mem001 = ?';//nsc
	var sql = 'UPDATE member2 SET mem006 = mem006 - ? where mem002 = ?';//egame
	var args=[betTotal,mid];
	dbmaster.update(sql,args,function(res){
		if(res.ErrorCode==0){
			utils.invokeCallback(cb, 0, 200);
		}else{
			utils.invokeCallback(cb, 1 , 500);
		}
	});
}
gameDao.delBet = function(mid,gid,cb){
	dbmaster = pomelo.app.get('dbmaster');
	var sql = 'DELETE FROM bet_g51 where bet005 = ? and bet009 = ?';
	var args=[mid,gid];
	dbmaster.delete(sql,args,function(res){
		if(res.ErrorCode==0){
			utils.invokeCallback(cb, 0, 200);
		}else{
			utils.invokeCallback(cb, 1 , 500);
		}
	});
}

gameDao.delAmountlogBytranNo = function(transfer_no,cb){
	dbmaster = pomelo.app.get('dbmaster');
	var sql = 'DELETE FROM member_amount_log where transfer_no = ? and transfer_type = 20';
	var args=[transfer_no];
	dbmaster.delete(sql,args,function(res){
		if(res.ErrorCode==0){
			utils.invokeCallback(cb, 0, 200);
		}else{
			utils.invokeCallback(cb, 1 , 500);
		}

	});
}

gameDao.delAmountlogById = function(Id,cb){
	dbmaster = pomelo.app.get('dbmaster');
	var sql = 'DELETE FROM member_amount_log where id = ? and transfer_type = 20';
	var args=[Id];
	dbmaster.delete(sql,args,function(res){
		if(res.ErrorCode==0){
			utils.invokeCallback(cb, 0, 200);
		}else{
			utils.invokeCallback(cb, 1 , 500);
		}

	});
}