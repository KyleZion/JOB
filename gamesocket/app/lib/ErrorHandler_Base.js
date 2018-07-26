module.exports = function Filter_Base()
{
  	this.errorHandler = function(err, msg, resp , session, next){
	    if(resp==500){
	      next(null,{'ErrorCode':1,'ErrorMessage':'网路连线异常，代码500'})
	    }
/*	    else if(resp==300){
	    	next(null,{'ErrorCode':1,'ErrorMessage':'帐号结算中,请稍待1分钟后进入游戏'});
	    }*/
	    else if(session.get('Stop')==1){
	        next(null,{'ErrorCode':1,'ErrorMessage':resp});
	    }
	    else{
	      session.set("Stop",1);
	      session.set('Stoptime',new Date());
	      session.pushAll();
	      next(null,{'ErrorCode':resp,'ErrorMessage':'网路连线异常:'+resp});
	    }
	}
}