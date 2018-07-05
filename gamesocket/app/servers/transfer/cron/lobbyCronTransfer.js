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

Cron.prototype.lobbyTransferMessage = function () {
    var redis=pomelo.app.get('redis');

    redis.hgetall('GS:GAMESERVER:fruitWheel', function (err, res) {
        if(err){
            //next(new Error('redis error'),500);
        }else{
            var Status = new Array();
            var History = new Array();
            Status[0] = res.Status101;
            Status[1] = res.Status102;
            Status[2] = res.Status105;
            Status[3] = res.Status110;
            History[0] = res.lobbyHistory101;
            History[1] = res.lobbyHistory102;
            History[2] = res.lobbyHistory105;
            History[3] = res.lobbyHistory110;
            messageService.broadcast('connector','lobbyTransferMessage',{'History':History,'Status':Status});
        }      
    });
};