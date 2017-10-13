//'use strict';

var GameName="transfer";
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var Base_Param = require('../../../consts/Base_Param.js');
var GPB = new Base_Param();
var sessions=[];
var messageService = require('../../../services/messageService.js');
var gameDao = require('../../../dao/gameDao');
/////////////////////////////////////////////////////////////////////

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};
 
var redis=pomelo.app.get('redis');

Handler.prototype.Connect = function (msg, session, next) {
	Async_Connection(session);
	next(null,{'ErrorCode':0,'ErrorMessage':''});
};

function Async_Connection(session){
	
	iasync.series({
		Init_Session: function(callback){
			Task2_Init_Session(callback,session);
		}

	},
	function(err, results) {
		console.log(results);
	});
}



Handler.prototype.Transfer = function(msg,session,next){
	var async = require('async');
	var logId=0;
	var lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入member_amount_log,回傳amount_log Index ID
	async.series({
			A: function(callback_A){
				var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
				struct_amount.params.transfer_type = 81;
				struct_amount.params.transfer_no = '';
				struct_amount.params.from_gkey = 'MAIN';
				struct_amount.params.to_gkey = 'CTL';
				struct_amount.params.operator = session.uid;
				struct_amount.params.uip = session.get('memberdata').ip;
				struct_amount.params.otype = 'm';
				struct_amount.params.gameid = '51';
				struct_amount.params.bydate = formatDate();
			    //mid,金額,amountlogSQL
				lib_games.DeductMoney(session.uid,msg.amount,struct_amount,function(result)
				{
				  switch(result)
				  {
				    case -1:
				      console.log('查無此id');
				      callback_A(-1,result);
				      break;
				    case -2:
				      console.log('餘額不足');
				      callback_A(-2,result);
				      break;
				    case -3:
				      console.log('扣款失敗');
				      callback_A(-3,result);
				      break;
				    case -4:
				      console.log('寫log失敗');
				      callback_A(-4,result);
				      break;
				    default:
				       //result  是扣款成功後 寫入amount 的id
				      var logId=result;
				      callback_A(0,result);
				      break;
				  }
				});
			},
			B: function(callback_B){
				console.log('aaa'+logId);
				callback_B(null,0);
			}
		},
		function(err, results)
		{ 
			if(err)
			{

			}else{
				next(null,'轉出成功已扣除電子遊戲帳戶！');
			}
			
		});
		
}

	
function formatDate() { //日期格式化
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}