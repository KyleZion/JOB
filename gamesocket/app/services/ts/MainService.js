module.exports = function MainService(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID)
{
	function EverySecond(){
		//console.log( GameName +" Execute : "+ ExecuteTimerCount);
	}

	function TaskProgram(TaskStatus){
		switch(TaskStatus)
		{
			case "START":
				Mission0();
				break;
			case "Mission1":
				Mission1();
				break;
			case "Mission2":
				Mission2();
				break;
		}
	}

	//--確認狀態-----------------------------------------------------------------------------
	async function Mission0() {
		console.log("確認遊戲狀態");

	    SetTask("Mission1");return;
		OG.GetUnOpenGames(function(data){
			console.log("GetUnOpenGames...");
			console.log(data);
		});
	};

	



	
	//--Mission1-----------------------------------------------------------------------------
	async function Mission1() {
		console.log("Mission1");
	  	var GameSeconds = 30; //每一期時間 sec
		GM.Made(function(InsertID,endtime){
			if(InsertID>0)
			{
				//新增成功
				console.log("GameMade GameMade..新增成功."+InsertID);
			}
			else
			{
				//新增失敗
				console.log("GameMade GameMade..新增失敗."+InsertID);
			}
		},GameSeconds);
	};


	//--Mission2-----------------------------------------------------------------------------
	async function Mission2() {
		console.log("Mission2");
	  	const posts2 = await Mission2_Task4("");
	};
	function Mission2_Task4 (para) {
	    return new Promise(function(resolve, reject) {
	        resolve("Task3:>");
	        SetTask("START");
	    });
	}

	//-------------------------------------------------------------------------------
	function OpenGame2()
	{
		console.log( "OpenGame2");
		OG.GetUnOpenBets(function(data){
			console.log("GetUnOpenBets...");
			console.log(data);

		});
	}
	

	

	//=============================================================================================================
	var lib_OG = require(app.getBase()+'/app/lib/lib_OpenGame.js');
	var OG = null;
	var lib_GameMade = require(app.getBase()+'/app/lib/lib_GameMade.js');
	var GM = null;
	//=============================================================================================================
	//=============================================================================================================
	//messageService.broadcast('connector','GetStatus'+gameZone,{'status':status});
	//messageService.broadcast('connector','gameop'+gameZone,{'gameNum':gameNum});
	this.Stop = function(){
		clearTimeout(check);
	}
	this.Run = function(GameZonex)
	{
		GameZone = GameZonex;
		OG = new lib_OG(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID,GameZone);
		GM = new lib_GameMade(pomelo,app,async,redis,dbslave,dbmaster,messageService,GameName,GameShowName,GameID,GameZone)
		console.log( "Run");
		SetTask("START");
		//GameMade();
		Execute();
	}
	function Execute(){
		var TaskStatus = GetTask();
		TaskProgram(TaskStatus);
		EverySecond();
		ExecuteTimer = setTimeout(Execute,1000);
		ExecuteTimerCount++;
	}
	var GameZone = 0;
	var ExecuteTimerCount = 0;
	var ExecuteTimer = null;
	var TaskQueue = new Array();
	function SetTask(taskname){
		TaskQueue.push(taskname);
	}
	function GetTask(){
		return TaskQueue.shift();
	}
	//=============================================================================================================
	//=============================================================================================================
}

