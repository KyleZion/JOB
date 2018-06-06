function GetPluginSettings()
{
	return {
		"name": "eGameScratch",
		"id": "eGameScratch",
		"description": "description.",
		"author": "du",
		"help url": "http://www.google.com",
		"category": "Web",
		"type":	"object",
		"rotatable": false,
		"dependency":	"socket.io.min.js;pomeloclient.js",
		"flags": pf_singleglobal //****
	};
};

//======================================================================================================================================
//---------------------------------------------------------------------------------------
AddStringParam("Address","The address (eg. URL or IP) to connect to. Supports cross-domain requests.","\"\"");
AddNumberParam("Port","The port to try and connect to the address through. This should be specific to your server.","80");
AddAction(0,0,"連線","基本動作","Connect to <b>{0}</b> <b>{1}</b>","Connect to an address (eg. URL or IP).","Connect");
//---------------------------------------------------------------------------------------
AddAction(1,0,"斷線","基本動作","Disconnect","Disconnect from the current connection.","Disconnect");
//---------------------------------------------------------------------------------------
AddStringParam("Token","info:Token","\"\"");
AddAction(2, 0, "登入", "遊戲動作", "登入Token <i>{0}</i>", "登入遊戲.","MemberLogin");
AddAction(3, 0, "登出", "遊戲動作", "登出", "登出遊戲.","MemberLogout");
AddStringParam("下注","請填下注內容","\"\"");
AddAction(4, 0, "下注","遊戲動作","下注 <b>{0}</b>","下注號碼","bet");
AddAction(5, 0, "取得餘額","遊戲動作","取得帳戶餘額,成功回傳參數1,失敗-1","帳戶餘額","GetMoney");
AddNumberParam("遊戲區號","輸入加入的區號","\"\"");
AddAction(6, 0, "加入遊戲區","遊戲動作","加入遊戲區賠率<i>{0}</i>","加入遊戲區","AddToChannel");
AddNumberParam("遊戲區號","輸入離開的區號","\"\"");
AddAction(7, 0, "離開遊戲區","遊戲動作","離開遊戲區","離開遊戲區","LeaveChannel");
AddAction(8,0, "取得期數ID","遊戲動作","取得期數ID","取得期數ID","GetGameID");
//======================================================================================================================================

//cf_trigger cf_fake_trigger****
AddCondition(1, cf_trigger,"連線成功","基本事件","連線成功","T","OnConnect");
AddCondition(2, cf_trigger,"錯誤事件","基本事件","server錯誤","接受Server端傳送的錯誤","OnError");
AddCondition(3, cf_trigger,"已經斷線","基本事件","已經斷線","T","OnDisconnect");
//AddStringParam("Socket Event","The Event to check.","\"\"");
AddCondition(4, cf_trigger,"登入成功","遊戲事件","登入成功","T","OnMemberLogin");
AddCondition(5, cf_trigger,"被踢出","遊戲事件","被踢出","T","OnKickout");
AddCondition(6, cf_trigger, "開獎","遊戲事件","開獎比對及派獎","開獎比對及派獎","OnOpData");
AddCondition(7, cf_trigger,"下注完成","遊戲事件","下注完成","下注完成回傳玩家帳戶餘額","OnBetSuccess");
AddCondition(8, cf_trigger, "歷史紀錄","遊戲事件","歷史紀錄","取得歷史紀錄","OnHistoryRecord");
AddCondition(9, cf_trigger, "取得帳號餘額","遊戲事件","帳戶餘額","取得帳號餘額","OnGetMoney");
AddCondition(10, cf_trigger, "加入遊戲區","遊戲事件","加入遊戲區","加入遊戲區","OnChannel");
AddCondition(11, cf_trigger, "離開遊戲區","遊戲事件","離開遊戲區","離開遊戲區","OnChannelLeave");
//======================================================================================================================================
AddExpression(0,ef_return_any,"玩家帳號","遊戲參數","UserAccount","玩家帳號.");
//AddExpression(1,ef_return_any,"系統時間","遊戲參數","ServerDate","系統時間.");
AddExpression(1,ef_return_any,"刮刮樂開獎金額","遊戲參數","OpData","刮刮樂開獎金額.");
AddExpression(2,ef_return_any,"遊戲額度","遊戲參數","UserMoney","遊戲額度.");
AddExpression(3,ef_return_any,"回傳狀態碼","遊戲參數","isSuccess","狀態碼");
AddExpression(4,ef_return_any,"錯誤訊息","遊戲參數","ErrorMessage","錯誤訊息");
AddExpression(5,ef_return_any,"遊戲區號","遊戲參數","ChannelID","遊戲區號");
ACESDone();


var property_list = [
];

function CreateIDEObjectType()
{
	return new IDEObjectType();
}

function IDEObjectType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

IDEObjectType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");

	this.instance = instance;
	this.type = type;
	
	this.properties = {};
	
	for(property in property_list)
		this.properties[property.name] = property.initial_value;
}
IDEInstance.prototype.OnCreate = function()
{
}
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
}
IDEInstance.prototype.Draw = function(renderer)
{
}
IDEInstance.prototype.OnRendererReleased = function()
{
}
