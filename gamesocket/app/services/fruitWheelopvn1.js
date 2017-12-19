var async = require('async');
var pomelo = require('pomelo');

module.exports = function gameop()
{

    this.gameopvn1 =function () {
        var CommissionPercentage = 0.15; //佣金百分比 [0.1 ~ 1]
        var takePercentage = 0.01; //獎池抽成百分比 (強制收入) [0 ~ 0.2]
        var OpenPoolPercentage = 050; //開獎池機率 越高越難中獎 [10 ~ 90]
        var OpenPoolBase = 3000; //獎池如果大於這個數字 一定開獎 [500 ~ ]
        var PoolThresholdMaxPercentage = 0.7; //送出金額要小於彩池金額的百分比[0 ~ 1]
        var ordercoins = 0; //總押分
        var Commission = ordercoins*CommissionPercentage; //佣金
        var ThisTimeBonus = ordercoins*takePercentage;  //獎池累積
        var CanOpenPool = false;  //開獎池與否
        var OpenPoolR_L = 0; 
        var RedisBonus = 0;
        if(RedisBonus > 0)
        {
          var OpenPoolR_L = (RedisBonus / OpenPoolBase)*100;
          if(OpenPoolR_L > 100)
          {
            CanOpenPool = true;
          }else{
            var OpenPoolR = Math.floor(Math.random() * 100);
            CanOpenPool = OpenPoolR> OpenPoolPercentage;
          }
        }
        var x = 0; //連輸次數
        var y = 0; //下注總金額
        var z = 0; //輸多少總數

        var prob = 0 ;

        console.log('aa');
    }
}