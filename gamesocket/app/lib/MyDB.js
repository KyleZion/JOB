module.exports = function MyDB(Host, User, PW , DB, Port) {
	var sHost = Host;
	var sUser = User;
	var sPW = PW;
	var sDB = DB;
	var sPort = Port;
	var mysql = require('mysql');
	this.pool  = mysql.createPool({
		host: sHost,
		user: sUser,
		password: sPW,
		database: sDB,
		port:sPort
	});
	this.query = function(SQL,callback)	{
		this.pool.getConnection(function(err, connection) {
			connection.query( SQL, function(err, rows,fields) {
			 callback(err, rows,fields);
			connection.release();
		  });
		});
	};
	this.insert = function(SQL,val,callback)	{ //Vic 多筆執行
		this.pool.getConnection(function(err, connection) {
			connection.query( SQL,[val], function(err, rows,fields) {
			 callback(err, rows,fields);
			connection.release();
		  });
		});
	};
}