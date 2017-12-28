/*! Socket.IO.min.js build:0.8.7, production. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */
document.write("<script src='socket.io.min.js'></script>");
document.write("<script src='pomeloclient.js'></script>");
// ECMAScript 5 strict mode
"use strict";

//Socket plugin
assert2(cr,"cr namespace not created");
assert2(cr.plugins_,"cr.plugins not created");

cr.plugins_.pomelo = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.pomelo.prototype;

	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;
	typeProto.onCreate = function()
	{

	};

	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		this.socket = null;
		this.UserAccount = null;
		this.UserName = '';
		this.UserMoney=0;
		this.OpData = 0;
		//this.OnTimer = null;
		this.OnStatus = '';
		this.LobbyHistory1 = '';
		this.LobbyHistory2 = '';
		this.LobbyHistory3 = '';
		this.LobbyHistory4 = '';
		this.LobbyStatus1 = '' ;
		this.LobbyStatus2 = '' ;
		this.LobbyStatus3 = '' ;
		this.LobbyStatus4 = '' ;
		this.HistoryRecord = '';
		this.GameID = 0;
		this.BetTotal='';
		this.TimeZone = 0;
		this.ChannelID = 0;
		this.GameSet = '';
		this.isSuccess;
		this.ErrorMessage='';
		this.Odds = 0;
	};
	
	var instanceProto = pluginProto.Instance.prototype;
	var pomelo = window['pomelo'];
	var Cookie =window.Cookies;
	var GAMEOPLISTEN;
	var STATUSLISTEN;
	var LOBBYLISTEN;
	instanceProto.onCreate = function()
	{
		
	};
	instanceProto.send = function(data)
	{
		var socket = this.socket;
		
		if(socket != null)
			socket["emit"]('message',data);
	};
	instanceProto.disconnect = function()
	{
		var socket = this.socket;
		
		if(socket != null)
			socket["disconnect"]();
	};
	
    var MAX_SLOTS_FOR_DATA = 100;
    

	instanceProto.connect = function(host,port)
	{
		var runtime = this.runtime;
		var instance = this;
		
		pomelo.init({
          host: host,
          port: port,
          log: true
        }, function() {
        	//pomelo.request("connector.entryHandler.Connect", '', function(data) {
        	pomelo.request("c.e.C", '', function(data) {
        		if(data['ErrorCode']==0){
        			instance.isSuccess = 1;
        			runtime.trigger(pluginProto.cnds.OnConnect,instance);
        		}/*else{
        			instance.isSuccess = -1;
        			instance.ErrorMessage = '無法連線';
        			runtime.trigger(pluginProto.cnds.OnError,instance);
        		}*/
          });
        });
	    pomelo.on('onKick',function(data){
	    	console.log(11);
	      console.log(data['message']);
	      if(data['message']==1)
	      	console.log('媽我在這')
	      runtime.trigger(pluginProto.cnds.OnKickout,instance);
	    });
	      	
	};
	instanceProto.MemberLogin = function(Token)
	{
		var runtime = this.runtime;
		var instance = this;
        pomelo.request("c.e.M", {'Token':Token,'GameType':'fruitWheel'}, function(data) {
        	if(data['ErrorCode']==0){
        		instance.UserAccount = data['userdata']['account'];
        		instance.UserName = data['userdata']['name'];
        		instance.isSuccess = 1;
        		LOBBYLISTEN =function(data){
			    	instance.LobbyStatus1 = data['Status'][0];
			    	instance.LobbyStatus2 = data['Status'][1];
			    	instance.LobbyStatus3 = data['Status'][2];
			    	instance.LobbyStatus4 = data['Status'][3];
			    	instance.LobbyHistory1 = data['History'][0];
			    	instance.LobbyHistory2 = data['History'][1];
			    	instance.LobbyHistory3 = data['History'][2];
			    	instance.LobbyHistory4 = data['History'][3];
					runtime.trigger(pluginProto.cnds.OnLobbyStatus,instance);
					runtime.trigger(pluginProto.cnds.OnLobbyHistory,instance);
				}
				pomelo.on('lobbyMessage',LOBBYLISTEN);
				runtime.trigger(pluginProto.cnds.OnMemberLogin,instance);
        	}else{
        		instance.UserAccount = '000';
        		instance.UserName = '000';
        		instance.isSuccess = -1;
        		instance.ErrorMessage = data['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
        	}
		});
	};
	instanceProto.MemberLogout = function()
	{	
		var runtime = this.runtime;
		var instance = this;
        pomelo.request("c.e.Mo",'', function(data) {
			runtime.trigger(pluginProto.cnds.OnKickout,instance);
		});
	};
	instanceProto.bet = function(Betdata)
	{	
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.B", {'bet':Betdata}, function(resp) {
			if(resp['ErrorCode']==0){
				instance.UserMoney = resp['bet'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnBetSuccess,instance);
			}else{
				instance.isSuccess = -1;
				instance.ErrorMessage = resp['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};

	instanceProto.GetHistory = function(count)
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.H",{'count':count,'cid':instance.ChannelID},function(HistoryRec){
			if(HistoryRec['ErrorCode']==0){
				instance.HistoryRecord = HistoryRec['History'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnHistoryRecord,instance);
			}else{
				instance.isSuccess = -1;
				instance.ErrorMessage = HistoryRec['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetTimeZone = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.T",{'cid':instance.ChannelID},function(GetTimeZone){
			if(GetTimeZone['ErrorCode']==0){
				instance.TimeZone = GetTimeZone['TimeZone'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnGetTimeZone,instance);
			}else{
				//instance.TimeZone = GetTimeZone['TimeZone'];
				instance.isSuccess = -1;
				instance.ErrorMessage = GetTimeZone['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetMoney = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.M",'',function(money){
			if(money['ErrorCode']==0){
				instance.UserMoney = money['Money'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnGetMoney,instance);
			}else{
				instance.UserMoney = 0;
				instance.isSuccess = -1;
				instance.ErrorMessage = money['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetGameID = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.I",{'cid':instance.ChannelID},function(gid){
			if(gid['ErrorCode']==0){
				instance.GameID = gid['ID'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnGameID,instance);
			}else{
				instance.GameID = 0 ;
				instance.isSuccess = -1;
				instance.ErrorMessage = gid['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetStatus = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.S",{'cid':instance.ChannelID},function(ServerStatus){
			if(ServerStatus['ErrorCode']==0){
				instance.OnStatus = ServerStatus['GetStatus'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnGameStatus,instance);
			}else{
				instance.OnStatus = '0';
				instance.isSuccess = -1;
				instance.ErrorMessage = ServerStatus['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetBetTotal = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.O",{'cid':instance.ChannelID},function(NowBetTotal){
			if(NowBetTotal['ErrorCode']==0){
				instance.BetTotal = NowBetTotal['GetBetTotal'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnBetTotal,instance);
			}else{
				//instance.BetTotal = NowBetTotal['GetBetTotal'];
				instance.isSuccess = -1;
				instance.ErrorMessage = NowBetTotal['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.AddToChannel = function(joinID){
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.A",{'ChannelID':joinID},function(res){
			if(res['ErrorCode']==0){
				instance.ChannelID = res['cid'];
				instance.Odds = res['odds'];
				GAMEOPLISTEN =function(data){
					instance.OpData = data['gameNum'];
					//console.log(data);
					runtime.trigger(pluginProto.cnds.OnOpData,instance);
				}
				STATUSLISTEN = function(data){
					instance.OnStatus = data['status'];
					//console.log(data);
					runtime.trigger(pluginProto.cnds.OnGameStatus,instance);
				}
				pomelo.on('gameop'+res['cid'],GAMEOPLISTEN);
			    pomelo.on('GetStatus'+res['cid'],STATUSLISTEN);
			    pomelo.removeListener('lobbyMessage',LOBBYLISTEN);
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnChannel,instance);
			}else{
				instance.isSuccess = -1;
				instance.ErrorMessage = res['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	}
	instanceProto.LeaveChannel = function(leaveID){
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.L",{'ChannelID':leaveID},function(res){
			if(res['ErrorCode']==0){
				instance.ChannelID = res['cid'];
				instance.Odds = 0;
				pomelo.removeListener('gameop'+leaveID,GAMEOPLISTEN);
				pomelo.removeListener('GetStatus'+leaveID,STATUSLISTEN);
				LOBBYLISTEN =function(data){
			    	instance.LobbyStatus1 = data['Status'][0];
			    	instance.LobbyStatus2 = data['Status'][1];
			    	instance.LobbyStatus3 = data['Status'][2];
			    	instance.LobbyStatus4 = data['Status'][3];
			    	instance.LobbyHistory1 = data['History'][0];
			    	instance.LobbyHistory2 = data['History'][1];
			    	instance.LobbyHistory3 = data['History'][2];
			    	instance.LobbyHistory4 = data['History'][3];
					runtime.trigger(pluginProto.cnds.OnLobbyStatus,instance);
					runtime.trigger(pluginProto.cnds.OnLobbyHistory,instance);
				}
				pomelo.on('lobbyMessage',LOBBYLISTEN);
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnChannel,instance);
			}else{
				//instance.BetTotal = NowBetTotal['GetBetTotal'];
				instance.isSuccess = -1;
				instance.ErrorMessage = res['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	}
	instanceProto.GetGameSet = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("f.w.G",{'cid':instance.ChannelID},function(gs){
			if(gs['ErrorCode']==0){
				instance.GameSet = gs['GameSet'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnGameSet,instance);
			}else{
				instance.GameSet = 0 ;
				instance.isSuccess = -1;
				instance.ErrorMessage = gs['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	//=======================================================Action
	pluginProto.acts = {};
	var acts = pluginProto.acts;

	acts.Connect = function(host,port)
	{
		host = host.toString();
		port = port.toString();
		this.connect(host,port);
	};

	acts.Disconnect = function()
	{
		this.disconnect();
	};
	
	acts.MemberLogin = function(cookieName)
	{
		var name = cookieName + "=";
		var Token = '';
		var ca = document.cookie.split(';');
			for(var i=0; i<ca.length; i++) {
		      var c = ca[i];
		      while (c.charAt(0)==' ') c = c.substring(1);
		      if (c.indexOf(name) == 0) Token = c.substring(name.length,c.length);
		  	}
		//return "";
		this.MemberLogin(Token);
	};
	acts.MemberLogout = function()
	{
		this.MemberLogout();
	};
	acts.bet = function(Betdata)
	{
		this.bet(Betdata);
	};

	acts.GetHistory =function(count)
	{
		this.GetHistory(count);
	};
	acts.GetTimeZone = function()
	{
		this.GetTimeZone();
	};
	acts.GetMoney = function()
	{
		this.GetMoney();
	};
	acts.GetGameID = function()
	{
		this.GetGameID();
	};
	acts.GetStatus = function()
	{
		this.GetStatus();
	};
	acts.GetBetTotal = function()
	{
		this.GetBetTotal();
	};
	acts.AddToChannel = function(joinID)
	{
		this.AddToChannel(joinID);
	};
	acts.LeaveChannel = function(joinID)
	{
		this.LeaveChannel(joinID);
	};
	acts.GetGameSet = function()
	{
		this.GetGameSet();
	};
	//=======================================================
	//=======================================================Condition
	pluginProto.cnds = {};
	var cnds = pluginProto.cnds;
	cnds.OnConnect = function()
	{
		return true;
	};
	cnds.OnDisconnect = function()
	{
		return true;
	};
	cnds.OnError = function()
	{
		return true;
	};
	cnds.OnGameStatus =function()
	{
		return true;
	};
	cnds.OnMemberLogin = function()
	{
		return true;
	};
	cnds.OnKickout = function()
	{
		return true;
	};
	cnds.OnBetSuccess = function()
	{
		return true;
	};
	cnds.OnOpData =function()
	{
		return true;
	};
	cnds.OnHistoryRecord =function()
	{
		return true;
	};
	cnds.OnGetMoney=function()
	{
		return true;
	};
	cnds.OnGetTimeZone=function()
	{
		return true;
	};
	cnds.OnBetTotal=function()
	{
		return true;
	};
	cnds.OnGameID=function()
	{
		return true;
	};
	cnds.OnChannel=function()
	{
		return true;
	};
	cnds.OnLobbyHistory=function()
	{
		return true;
	};
	cnds.OnLobbyStatus=function()
	{
		return true;
	};
	cnds.OnGameSet=function()
	{
		return true;
	};
	cnds.OnError=function()
	{
		return true;
	};
	//=======================================================
	//=======================================================Expression
	pluginProto.exps = {};
	var exps = pluginProto.exps;
	exps.UserAccount = function(result,index) //帳號
	{
		result.set_any(this.UserAccount);
	};
	exps.UserName = function(result) //玩家暱稱
	{
		result.set_any(this.UserName);
	}
	exps.UserMoney = function(result)//帳號餘額
	{
		result.set_any(this.UserMoney);
	};
	exps.OpData = function(result) //開獎號
	{
		result.set_any(String(this.OpData));
	};
	exps.LobbyHistory1 = function(result) //1區紀錄
	{
		result.set_any(this.LobbyHistory1);
	};
	exps.LobbyHistory2 = function(result) //2區紀錄
	{
		result.set_any(this.LobbyHistory2);
	};
	exps.LobbyHistory3 = function(result) //3區紀錄
	{
		result.set_any(this.LobbyHistory3);
	};
	exps.LobbyHistory4 = function(result) //4區紀錄
	{
		result.set_any(this.LobbyHistory4);
	};
	exps.LobbyStatus1 = function(result) //1區狀態
	{
		result.set_any(this.LobbyStatus1);
	};
	exps.LobbyStatus2 = function(result) //2區狀態
	{
		result.set_any(this.LobbyStatus2);
	};
	exps.LobbyStatus3 = function(result) //3區狀態
	{
		result.set_any(this.LobbyStatus3);
	};
	exps.LobbyStatus4 = function(result) //4區狀態
	{
		result.set_any(this.LobbyStatus4);
	};
	exps.OnStatus =function(result) //Server開盤狀態
	{
		result.set_any(this.OnStatus);
	};
	exps.HistoryRecord=function(result) //歷史紀錄
	{
		result.set_any(this.HistoryRecord);
	};
	exps.GameID=function(result)
	{
		result.set_any(this.GameID);
	};
	exps.BetTotal=function(result)
	{
		result.set_any(this.BetTotal);
	};
	exps.TimeZone=function(result)
	{
		result.set_any(this.TimeZone);
	};
	exps.isSuccess=function(result)
	{
		result.set_any(this.isSuccess);
	};
	exps.ChannelID=function(result)
	{
		result.set_any(this.ChannelID);
	}
	exps.Odds = function (result) 
	{
		result.set_any(this.Odds);
	}
	exps.GameSet = function (result) 
	{
		result.set_any(this.GameSet);
	}
	exps.ErrorMessage=function(result)
	{
		result.set_any(this.ErrorMessage);
	};
}());
