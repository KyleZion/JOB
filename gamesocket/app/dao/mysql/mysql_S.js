// mysql CRUD
var sqlclient = module.exports;

var _pool;

var NND = {};

/*
 * Init sql connection pool
 * @param {Object} app The app for the server.
 */
NND.init = function(app){
	_pool = require('./dao-pool.js').createMysqlPool(app);
};

/**
 * Excute sql statement
 * @param {String} sql Statement The sql need to excute.
 * @param {Object} args The args for the sql.
 * @param {fuction} cb Callback function.
 * 
 */
//generic-pool最新版是用ES6，使用promise而不再使用function(callback)，這邊也更改使用.then(:39)
/*NND.query = function(sql, args, cb){
	_pool.acquire(function(err, client) {
		if (!!err) {
			console.error('[sqlqueryErr] '+err.stack);
			return;
		}
		client.query(sql, args, function(err, res) {
			_pool.release(client);
			cb(err, res);
		});
	});
};*/

NND.SQLQuery = function (sql, args, callback) {
    const resourcePromise = _pool.acquire();
    resourcePromise.then(function (client) {
        client.query(sql, args, function (err,data) {
            _pool.release(client);
            if(!err){
            	//成功err==null
            	callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }
            
        });
    })
    .catch(function (err) {
        console.error('[SQLQuery Error:]'+ err.stack);
        callback({'ErrorCode': 1,'ErrorMessage':err.stack}); 
    });
};

NND.SQLEX = function (sql, args, callback) {
    const resourcePromise = _pool.acquire();
    resourcePromise.then(function (client) {
        client.query(sql, args, function (err) {
            _pool.release(client);
            if(!err){
            	//成功err==null
            	callback({'ErrorCode': 0,'ErrorMessage':''}); 
            }
            
        });
    })
    .catch(function (err) {
        console.error('[SQLEX Error:]'+ err.stack);
        callback({'ErrorCode': 1,'ErrorMessage':err.stack}); 
    });
};


NND.nSQLQuery = function (sql, args, callback) {
    _pool.getConnection(function(err,connection){
        connection.query(sql, args, function (err,data) {
            console.warn(sql);
            console.warn(args);
            if(!err){
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }
            
        });
        connection.release();
    });
/*    .catch(function (err) {
        console.error('[SQLQuery Error:]'+ err.stack);
        callback({'ErrorCode': 1,'ErrorMessage':err.stack}); 
    });*/
};

NND.nSQLEX = function (sql, args, callback) {
    _pool.getConnection(function(err,connection){
        connection.query(sql, args, function (err,data) {
            console.log(err)
            if(!err){
                //成功err==null
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }
            connection.release();
        });
    });
};


/**
 * Close connection pool.
 */
NND.shutdown = function(){
	_pool.destroyAllNow();
};

/**
 * init database
 */
sqlclient.init = function(app) {
	if (!!_pool){
		return sqlclient;
	} else {
		NND.init(app);
		//sqlclient.insert = NND.SQLEX; //前端調用client.insert即可
		//sqlclient.update = NND.SQLEX;
		//sqlclient.delete = NND.SQLEX;
		sqlclient.query = NND.SQLQuery;
		return sqlclient;
	}
};

/**
 * shutdown database
 */
sqlclient.shutdown = function(app) {
	NND.shutdown(app);
};






