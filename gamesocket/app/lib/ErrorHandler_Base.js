module.exports = function Filter_Base()
{

  	this.errorHandler = function(err, msg, resp , session, next){
	    if(resp==500){
	      next(null,{'ErrorCode':1,'ErrorMessage':'網路連線異常'})
	    }
	    else if(session.get('Stop')==1){
	        next(null,{'ErrorCode':1,'ErrorMessage':resp});
	    }
	    else{
	      session.set("Stop",1);
	      session.set('Stoptime',new Date());
	      session.pushAll();
	      next(null,{'ErrorCode':1,'ErrorMessage':resp});
	    }
	}
}