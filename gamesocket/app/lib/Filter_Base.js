module.exports = function Filter_Base(bypass,msg,next,name)
{
	var async = require('async');
	var ts=(msg.route).split('.');
  	var method = bypass[ts[2]];
 	async.waterfall([
  		function(callback_1){	
     		if( method!=null)
		    {
		        msg.route =  ts[0] +'.'+ ts[1] +'.'+ method;
		        var routeRecord={
		            route: msg.route,
		            serverType: ts[0],
		            handler: ts[1],
		            method: method
		    	};
       			 next(null,routeRecord);
      		}
     	 	else
        		next(new Error('routeError'),'routeError');
      
      		callback_1(null);
    }],function(err,res) { 

  	});
}