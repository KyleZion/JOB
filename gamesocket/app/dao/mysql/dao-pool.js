var _poolModule = require('generic-pool');
var mysql = require('mysql');
/******generic-pool最新版是用ES6，使用promise而不再使用function(callback)。http://nodejs.netease.com/topic/58a95bcb489e266d5be92744
var createMysqlPool = function(app) {
	var mysqlConfig = app.get('mysql');
	return _poolModule.createPool({
		name: 'mysql',
		create: function(callback) {
			
			var client = mysql.createConnection({
				host: my sqlConfig.host,
				user: mysqlConfig.user,
				password: mysqlConfig.password,
				database: mysqlConfig.database,
				port:mysqlConfig.port
			});
			callback(null, client);
		},
		destroy: function(client) {
			client.end();
		},
		max: 10,
		idleTimeoutMillis : 30000,
		log : false
	});
};

exports.createMysqlPool = createMysqlPool;
*/

/*
 * Create mysql connection pool.
 */
// lib/mysql/dao-pool.js中的createMysqlPool方法改为：
var createMysqlPool = function(app){
  var mysqlConfig = app.get('mysql');
  return _poolModule.createPool({
    name     : 'mysql',
    create: function(){
      return new Promise(function(resolve, reject){
        var client = mysql.createConnection({
          host: mysqlConfig.host,
          user: mysqlConfig.user,
          password: mysqlConfig.password,
          database: mysqlConfig.database,
          port:mysqlConfig.port
        });
        resolve(client);
      })
    },

    destroy: function(client) {
      return new Promise(function(resolve){
        client.end();
      })
    }
  }, {
    max: 10,
    idleTimeoutMillis: 30000,
    log: false
  });
};

exports.createMysqlPool = createMysqlPool;