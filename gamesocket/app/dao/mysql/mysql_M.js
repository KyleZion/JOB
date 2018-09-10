// mysql CRUD
var sqlclient = module.exports;

var _pool;

var NND = {};
const pomelo = require('pomelo');
const code = require(pomelo.app.getBase()+'/app/consts/code.js');
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

/*NND.SQLQuery = function (sql, args, callback) {
    const resourcePromise = _pool.acquire();
    resourcePromise.then(function (client) {
        client.query(sql, args, function (err,data) {
            console.log(err);
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
        client.query(sql, args, function (err,data) {
            _pool.release(client);
            if(!err){
            	//成功err==null
            	callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }
            
        });
    })
    .catch(function (err) {
        console.error('[SQLEX Error:]'+ err.stack);
        callback({'ErrorCode': 1,'ErrorMessage':err.stack}); 
    });
};*/

NND.SpQuery = function (sql, args, callback) {
    const resourcePromise = _pool.acquire();
    resourcePromise.then(function (client) {
        client.query(sql, args, function (error,results,fields) {
            /*console.log(error); //成功null
            console.log('--------');
            console.log(results); //RowDataPacket
            console.log('--------');*/
            //console.log(fields);//FieldPacket 
            if(!error){
                //成功err==null
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':results}); 
            }
            _pool.release(client);  
        });
    })
    .catch(function (err) {
        console.error('[SQLQuery Error:]'+ err.stack);
        callback({'ErrorCode': 1,'ErrorMessage':err.stack}); 
    });
};
//20180709 連線KEEP問題 改用mysql module getConnection
NND.nSQLQuery = function (sql, args, callback) {
    _pool.getConnection(function(err,connection){
        connection.query(sql, args, function (err,data) {
            connection.release();
            if(!err){
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':data}); 
            }else{
                callback({'ErrorCode': 1,'ErrorMessage':err,'rows':data}); 
            }
        });
        
    });
};

NND.nSQLEX = function (sql, args, callback) {
    _pool.getConnection(function(err,connection){
        connection.query(sql, args, function (err,data) {
            connection.release();
            if(!err){//成功err==null
                callback({'ErrorCode': 0,'ErrorMessage':'','rows':data});
            }else{
                callback({'ErrorCode': 1,'ErrorMessage':err,'rows':data});
            }
           
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
		sqlclient.insert = NND.nSQLEX; //前端調用client.insert即可
		sqlclient.update = NND.nSQLEX;
		sqlclient.delete = NND.nSQLEX;
		sqlclient.query = NND.nSQLQuery;
        //sqlclient.spquery = NND.nSpQuery;
		return sqlclient;
	}
};

/**
 * shutdown database
 */
sqlclient.shutdown = function(app) {
	NND.shutdown(app);
};
