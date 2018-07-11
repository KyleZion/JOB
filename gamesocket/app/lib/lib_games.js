
module.exports = function lib_games()
{
	var logger = require('pomelo-logger').getLogger(__filename);
	var pomelo = require('pomelo');
	var async = require('async');
	var app = pomelo.app;

	this.DeductMoney = function(mid,money,struct_amount,callback)
	{
		var amountlogid = -1;
		async.waterfall([
			function(cb) {
			    var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
			    //var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member2",struct_sql);
			    var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("users",struct_sql);
			    struct_sql.select.mem100 = "1";
			    struct_sql.where.mid = mid;
			    lib_amount.Select(function(id){
			      cb(null,id);
			    });
			},
		  	function(param,cb) {
			  	if(param.length==0){
			  		cb(-1,0);
			  	}
			  	else{
				  	//if(param[0]['mem006'] >= money)
					if(param[0]['mem100'] >= money)				  		
				  	{
			 			var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
					    //var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member2",struct_sql);
					    var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("users",struct_sql);
					    //struct_sql.params.mem006 = "mem006-"+money;
					   	//struct_sql.where.mem002 = mid;
					   	//struct_amount.params.from_balance = param[0]['mem006'];
					   	struct_sql.params.mem100 = "mem100-"+money;
					   	struct_sql.where.mid = mid;
					   	struct_amount.params.balance = param[0]['mem100'];
					    lib_amount.Update2(function(resDao){
					      cb(null,resDao);
					    });
				  	}
				  	else
				  	{
				  		cb(-2,0); 
				  	}
				}
		 	},
		 	function(param,cb) {
			  	if(param==0)
			  	{
				    //var struct_amount = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
				    /*var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member_amount_log",struct_amount);
				    struct_amount.params.from_mid = mid;
				    struct_amount.params.amount = money;*/
				    var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("amount_log",struct_amount);
				    struct_amount.params.mid = mid;
				    struct_amount.params.money = money;
				    struct_amount.params.created_at = formatDate()+' '+formatDateTime();
				    struct_amount.params.updated_at = formatDate()+' '+formatDateTime();
				    lib_amount.Insert(function(id){
				    	amountlogid = id;
				      	cb(null,id);
				    });
			  	}
			  	else
			  	{
			  		cb(-3,''); //扣款失敗
			  	}
		  	},
		  	function(param,cb) {
			  	if(param>0)
			  	{
				    cb(null,param); // 寫amount log 成功
			  	}
			  	else
			  	{
			  		var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
				    /*var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member2",struct_sql);
				    struct_sql.params.mem006 = "mem006+"+money;
				   	struct_sql.where.mem002 = mid;*/
				   	var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("users",struct_sql);
				    struct_sql.params.mem100 = "mem100+"+money;
				   	struct_sql.where.mid = mid;
				    lib_amount.Update2(function(resDao){
				      cb(-4,''); //寫log失敗
				    });
			  	}
		  	}
		],
		function(err,resDao) {
		  	//console.log(resDao);
		  	if(err==null)
		  		callback(resDao);
		  	else{
		  		callback(err);
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

function formatDateTime() { //時間格式化
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds();

    if (h.length < 2) h = '0' + h;
    if (m.length < 2) m = '0' + m;
    if (s.length < 2) s = '0' + s;

    return [h, m, s].join(':');
}

// async.waterfall([
//   function(cb) {
//     var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
//     var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member_amount_log",struct_sql);
//     struct_sql.select.transfer_type = "1";
//     struct_sql.where.id = "933";
//     struct_sql.where.transfer_type = "22";
//     lib_amount.Select(function(id){
//       cb(null,id);
//     });
//   }
// ],
// function(err,resDao) {
//   console.error(resDao);
// });


// async.waterfall([
//   function(cb) {
//     var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
//     var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member_amount_log",struct_sql);
//     struct_sql.params.transfer_type = "20";
//     struct_sql.params.from_mid = "100";
//     lib_amount.Insert(function(id){
//       cb(null,id);
//     });
//   },
//   function(id,cb) {
//     var struct_sql = new (require(app.getBase()+'/app/lib/struct_sql.js'))();
//     var lib_amount = new (require(app.getBase()+'/app/lib/lib_SQL.js'))("member_amount_log",struct_sql);
//     struct_sql.params.transfer_type = "22";
//     struct_sql.params.from_mid = "120";
//     struct_sql.where.id = id;
//     lib_amount.Update(function(){
//       cb(null,'');
//     });
//   }
// ],
// function(err,resDao) {
//   console.error("ook");
// });

}