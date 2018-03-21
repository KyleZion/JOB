'use strict';

var pomelo = require('pomelo');
var sessionService = pomelo.app.get('sessionService');
var messageService = require(pomelo.app.getBase()+'/app/services/messageService.js');
////////////////////////////////////////////////////////////////////////////////////

module.exports = function (app) {
    return new Cron(app);
};
var Cron = function (app) {
    this.app = app;
};

Cron.prototype.lobbyDiceBao = function () {
    var redis=pomelo.app.get('redis');

    redis.hgetall('GS:GAMESERVER:diceBao', function (err, res) {
        if(err){
            //next(new Error('redis error'),500);
        }else{
            var Status = new Array();
            var History = new Array();
            Status[0] = res.Status111;
            Status[1] = res.Status222;
            Status[2] = res.Status333;
            History[0] = (res.lobbyHistory111).split("|");
            History[1] = (res.lobbyHistory222).split("|");
            History[2] = (res.lobbyHistory333).split("|");
            messageService.broadcast('connector','lobbyDiceBao',{'History':History,'Status':Status});
        }      
    });
};
