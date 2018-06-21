
module.exports = function lib_SQL(tablename,struct_amountlog)
{
	var logger = require('pomelo-logger').getLogger(__filename);
	var pomelo = require('pomelo');
	var async = require('async');
	var translate_sql = new (require(pomelo.app.getBase()+'/app/lib/translate_sql.js'))(tablename,struct_amountlog);
	var dbmaster=pomelo.app.get('dbmaster');
	var dbslave=pomelo.app.get('dbslave');
	this.Insert = function(callback)
	{
		//console.warn(translate_sql.GetInsertSQL());
		//console.warn(translate_sql.GetValues());
		var sql = translate_sql.GetInsertSQL();
		var values = translate_sql.GetValues();
		async.waterfall([
			function(cb) {
				dbmaster.insert(sql,values,function(data){
					cb(null,data);
				});
			},
			function(data,cb) {
				if(data.ErrorCode==0)
				{
					//console.log(data);
					logId=data.rows.insertId
					cb(null,logId);
				}else{
					logger.error('Insert  error');
					cb(1,data.ErrorMessage);
				}
				
			}
		],
		function(err,resDao) {
			if(err==null)
			{
				//insert成功
				//console.log('insert  success:'+resDao);
				callback(resDao);
			}
			else
			{
				//insert失敗
				console.log(resDao);
				callback(-1);
			}
		});
	}

	this.Update = function(callback)
	{
		//console.warn(translate_sql.GetUpdateSQL());
		//console.warn(translate_sql.GetValues());

		var sql = translate_sql.GetUpdateSQL();
		var values = translate_sql.GetValues();


		async.waterfall([
			function(cb) {
				dbmaster.update(sql,values,function(data){
					cb(null,data);
				});
			},
			function(data,cb) {
				if(data.ErrorCode==0)
				{
					//console.log(data);
					logId=data.rows.insertId
					cb(null,data.ErrorCode);
				}else{
					logger.error('Update error');
					cb(1,data.ErrorMessage);
				}
				
			}
		],
		function(err,resDao) {
			if(err==null)
			{
				//insert成功
				//console.log('Update success:'+resDao);
				callback(resDao);
			}
			else
			{
				//insert失敗
				console.log(resDao);
				callback(-1);
			}
		});

	}

	this.Update2 = function(callback)
	{
		//console.warn(translate_sql.GetUpdateSQL2());
		//console.error(translate_sql.GetValues());

		var sql = translate_sql.GetUpdateSQL2();
		var values = [];


		async.waterfall([
			function(cb) {
				dbmaster.update(sql,values,function(data){
					cb(null,data);
				});
			},
			function(data,cb) {
				if(data.ErrorCode==0)
				{
					logId=data.rows.insertId
					cb(null,logId);
				}else{
					logger.error('Update error');
					cb(1,data.ErrorMessage);
				}
				
			}
		],
		function(err,resDao) {
			if(err==null)
			{
				//insert成功
				//console.log('Update success:'+resDao);
				callback(resDao);
			}
			else
			{
				//insert失敗
				console.log(resDao);
				callback(-1);
			}
		});

	}
	this.Select = function(callback)
	{
		//console.warn(translate_sql.GetSelectSQL());
		var sql = translate_sql.GetSelectSQL();
		var values = [];
		async.waterfall([
			function(cb) {
				dbslave.query(sql,values,function(data){
					cb(null,data);
				});
			},
			function(data,cb) {
				if(data.ErrorCode==0)
				{
					var rows=data.rows
					cb(null,rows);
				}else{
					console.log('Select error');
					cb(1,data.ErrorMessage);
				}
				
			}
		],
		function(err,resDao) {
			if(err==null)
			{
				//insert成功
				//console.log('Select success:'+resDao);
				callback(resDao);
			}
			else
			{
				//insert失敗
				console.log('Select error');
				console.log(resDao);
				callback(null);
			}
		});
	}

	this.Delete = function(callback)
	{
		//console.warn('Delete');
		//console.warn(translate_sql.GetDeleteSQL());
		var sql = translate_sql.GetDeleteSQL();
		callback(1);
		// var values = [];
		// async.waterfall([
		// 	function(cb) {
		// 		dbmaster.delete(sql,values,function(data){
		// 			cb(null,data);
		// 		});
		// 	},
		// 	function(data,cb) {
		// 		if(data.ErrorCode==0)
		// 		{
		// 			var rows=data.rows
		// 			cb(null,rows);
		// 		}else{
		// 			console.log('Select error');
		// 			cb(1,data.ErrorMessage);
		// 		}
				
		// 	}
		// ],
		// function(err,resDao) {
		// 	if(err==null)
		// 	{
		// 		//insert成功
		// 		console.log('Select success:'+resDao);
		// 		callback(resDao);
		// 	}
		// 	else
		// 	{
		// 		//insert失敗
		// 		console.log('Select error');
		// 		console.log(resDao);
		// 		callback(null);
		// 	}
		// });
	}

	this.example =function()
	{
		//var struct_amountlog = new (require(app.getBase()+'/app/lib/struct_amountlog.js'))();
		//------------- Insert Amountlog
		//this.struct_amountlog.params.transfer_type = "20";
		//this.struct_amountlog.params.from_mid = "100";
		//console.error(translate_sql.GetInsertSQL());
		//console.error(translate_sql.GetValues());
		//------------- UPDATE Amountlog
		// struct_amountlog.params.transfer_type = "20";
		// struct_amountlog.where.mem001 = "10";
		// console.error(struct_amountlog.GetUpdateSQL());
		// console.error(struct_amountlog.GetValues());
		//------------- select Amountlog
		//struct_amountlog.select.transfer_type = "1";
		//struct_amountlog.select.from_mid = "1";
		//struct_amountlog.where.mem001 = "10";
		//console.error(translate_sql.GetSelectSQL());
	}
}