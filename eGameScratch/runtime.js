/*! Socket.IO.min.js build:0.8.7, production. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */
document.write("<script src='socket.io.min.js'><\/script>");
document.write("<script src='pomeloclient.js'><\/script>");
// ECMAScript 5 strict mode
"use strict";

//Socket plugin
assert2(cr,"cr namespace not created");
assert2(cr.plugins_,"cr.plugins not created");

cr.plugins_.eGameScratch = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var pluginProto = cr.plugins_.eGameScratch.prototype;

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
		this.UserAccount = '';
		this.UserMoney=0;
		this.ServerDate = null;
		this.OpData = null;
		this.GameID='0';
		this.ChannelID = 0;
		this.isSuccess;
		this.ErrorMessage = '';
		this.param = 0;
		this.reward = 0;
	};
	
	var instanceProto = pluginProto.Instance.prototype;
	var pomelo = window['pomelo'];
	//var pomelo.request = window['pomelo']['request'];
	//var Cookie =window.Cookies;
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
        		}
          });
        });
	    pomelo.on('onKick',function(data){
	      //alert('已登出遊戲');
	      runtime.trigger(pluginProto.cnds.OnKickout,instance);
	    });
	};

	instanceProto.MemberLogin = function(Token)
	{
		var runtime = this.runtime;
		var instance = this;
        pomelo.request("c.e.M", {'Token':Token,'GameType':'Scratch'}, function(data) {
        	if(data['ErrorCode']==0){
        	    instance.UserAccount = data['userdata']['name'];
        		instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnMemberLogin,instance);
        	}else{
        		instance.UserAccount = '000' ;
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
        pomelo.request("c.e.o",'', function(data) {
			runtime.trigger(pluginProto.cnds.OnKickout,instance);
		});
	};
	instanceProto.bet = function(Betdata)
	{
		var runtime = this.runtime;
		var instance = this;
		//pomelo.request("s.g.B", {'bet':Betdata}, function(resp) {
		pomelo.request("s.g.B", {'bet':'{"channelID":"444","total":100}'}, function(resp) {
			if(resp['ErrorCode']==0){
				instance.UserMoney = resp['bet'];
				instance.OpData = resp['reward'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnBetSuccess,instance);
			}else{
				instance.isSuccess = -1;
				instance.ErrorMessage = resp['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	};
	instanceProto.GetMoney = function()
	{
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("s.g.M",'',function(money){
			if(money['ErrorCode']==0){
				instance.UserMoney = money['res'];
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
		pomelo.request("s.g.I",{'cid':instance.ChannelID},function(gid){
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
	instanceProto.AddToChannel = function(joinID){
		var runtime = this.runtime;
		var instance = this;
		pomelo.request("s.g.A",{'ChannelID':joinID},function(res){
			if(res['ErrorCode']==0){
				instance.ChannelID = res['cid'];
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
		pomelo.request("s.g.L",{'ChannelID':leaveID},function(res){
			if(res['ErrorCode']==0){
				instance.ChannelID = res['cid'];
				instance.isSuccess = 1;
				runtime.trigger(pluginProto.cnds.OnChannelLeave,instance);
			}else{
				//instance.BetTotal = NowBetTotal['GetBetTotal'];
				instance.isSuccess = -1;
				instance.ErrorMessage = res['ErrorMessage'];
				runtime.trigger(pluginProto.cnds.OnError,instance);
			}
		});
	}
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
	acts.GetMoney = function()
	{
		this.GetMoney();
	};
	acts.GetGameID = function()
	{
		this.GetGameID();
	};
	acts.AddToChannel = function(joinID)
	{
		this.AddToChannel(joinID);
	};
	acts.LeaveChannel = function(joinID)
	{
		this.LeaveChannel(joinID);
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
	cnds.OnMemberLogin = function()
	{
		return true;
	};
	cnds.OnKickout = function()
	{
		return true;
	};
	cnds.OnDate = function()
	{
		return true;
	};
	cnds.OnOpData =function()
	{
		return true;
	};
	cnds.OnGetMoney=function()
	{
		return true;
	};
	cnds.OnGameID=function()
	{
		return true;
	};
	cnds.OnBetSuccess = function()
	{
		return true;
	};
	cnds.OnChannel=function()
	{
		return true;
	};
	cnds.OnChannelLeave=function()
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
		result.set_string(this.UserAccount);
	};
	exps.ServerDate = function(result) //時間
	{
		result.set_string(this.ServerDate);
	};
	exps.UserMoney = function(result)//帳號餘額
	{
		result.set_any(this.UserMoney);
	};
	exps.OpData = function(result) //開獎號
	{
		result.set_string(String(this.OpData));
	};
	exps.HistoryRecord=function(result) //歷史紀錄
	{
		result.set_any(this.HistoryRecord);
	};
	exps.GameID=function(result)
	{
		result.set_any(this.GameID);
	};
	exps.ChannelID=function(result)
	{
		result.set_any(this.ChannelID);
	}
	exps.param = function (result) 
	{
		result.set_any(this.param);
	}
	exps.GameNumComb = function(result)
	{
		result.set_any(this.GameNumComb);
	}
	exps.isSuccess= function(result)
	{
		result.set_any(this.isSuccess);
	}
	exps.ErrorMessage=function(result)
	{
		result.set_any(this.ErrorMessage);
	};
}());
