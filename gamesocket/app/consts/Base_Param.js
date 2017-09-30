
// 定義字串
module.exports = function Base_Param(){
	var clc = require('cli-color');
	this.ShowLog = function (itype,Message)
	{
		switch(itype)
		{
			case -1:
				console.log(clc.yellow(Message));
				break;
			case 0:
				console.log(Message);
				break;
			case 1:
				console.log(clc.green(Message));
				break;
			case 2:
				console.log(clc.red(Message));
				break;
			
		}
	}
	this.GPB = this;
	this.rKey_Web_user = "user:";
	this.rKey_TITLE = "GS:";
	this.rKey_GAMESERVER =this.rKey_TITLE + "GAMESERVER:";
	this.rKey_GAMESERVER_LIST = this.rKey_GAMESERVER + "List:";
	this.rKey_USER = this.rKey_TITLE + "USER:";
	this.rKey_USER_List = this.rKey_TITLE + "USERLIST:";
	this.rKey_CMD_ALERT =  this.rKey_TITLE + "CMD:ALERT:";
	this.rKey_CMD_KILL =  this.rKey_TITLE + "CMD:KILL:";
	this.ievents = require('events');
	class MyEmitter extends this.ievents {}
	this.EventEmitter = new MyEmitter();
};
