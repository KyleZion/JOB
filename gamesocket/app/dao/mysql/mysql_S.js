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

NND.SQLQuery = function (sql, args) {
    return new Promise((resolve,reject) => {
        _pool.query(sql,args,(err,rows,fields) => {
            console.warn(rows,sql,args);
            if(err) reject(err);
            else resolve({'ErrorCode': 0,'ErrorMessage':'','data':rows});
        });
    });
    /*_pool.getConnection(function(err,connection){
        connection.query(sql, args, function (err,data) {
            console.warn(_pool._freeConnections.indexOf(connection)); // -1
            console.warn(_pool.config.connectionLimit);     // passed in max size of the pool
            console.warn(_pool._freeConnections.length);    // number of free connections awaiting use
            console.warn(_pool._allConnections.length);     // number of connections currently created, including ones in use
            console.warn(_pool._acquiringConnections.length); // number of connections in the process of being acquired
            //console.log(_pool._freeConnections.indexOf(connection)); // 0
            connection.release();
            if(!err){
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }else{
                callback({'ErrorCode': 1,'ErrorMessage':err,'rows':data}); 
            }
        });
    });*/
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






