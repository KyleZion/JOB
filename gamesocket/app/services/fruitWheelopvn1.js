var async = require('async');
var pomelo = require('pomelo');
var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();

module.exports = function gameop()
{
    this.gameopvn1 =function (dbmaster,dbslave,redis,gameID,data,gameZone,callback) {

/*        var bonus101 = redis->get('GS:Bonus:051:101'); 
        var bonus102 = redis->get('GS:Bonus:051:102');
        var bonus105 = redis->get('GS:Bonus:051:105');
        var bonus110 = redis->get('GS:Bonus:051:110');
        var RedisCommission101 = redis->get('GS:Commission:051:101');
        var RedisCommission102 = redis->get('GS:Commission:051:102');
        var RedisCommission105 = redis->get('GS:Commission:051:105');
        var RedisCommission110 = redis->get('GS:Commission:051:110');*/
        var bonus = null;
        var RedisCommission = null;

        var DB_B101 = 0;
        var DB_C101 = 0;
        var DB_B102 = 0;
        var DB_C102 = 0;
        var DB_B105 = 0;
        var DB_C105 = 0;
        var DB_B110 = 0;
        var DB_C110 = 0;

        var CommissionPercentage = 0.15; //佣金百分比 [0.1 ~ 1]
        var takePercentage = 0.01; //獎池抽成百分比 (強制收入) [0 ~ 0.2]
        var OpenPoolPercentage = 050; //開獎池機率 越高越難中獎 [10 ~ 90]
        var OpenPoolBase = 3000; //獎池如果大於這個數字 一定開獎 [500 ~ ]
        var PoolThresholdMaxPercentage = 0.7; //送出金額要小於彩池金額的百分比[0 ~ 1]

        var ordercoins = 0; //總押分
        var Commission = 0; //佣金
        var ThisTimeBonus = 0 ;  //獎池累積
        var CanOpenPool = false;  //開獎池與否
        var OpenPoolR_L = 0; 
        var RedisBonus = 0;
        var winbet = new Array(); 
        var flag = 0;

        var OpenPoolNumber = 0;
        var OpenPool_np = 99999999;
        var OpenPool_tmpwin = 0;
        var OpenPool_ordercoins = 0;
        var Minimum_np_Number = 0;
        var Minimum_np = 99999999;
        var Minimum_np_tmpwin = 0;
        var Minimum_np_ordercoins = 0;
        var Maximum_np_Number = 0;
        var Maximum_np = 0;
        var Maximum_np_tmpwin = 0;
        var Maximum_np_ordercoins = 0;
            
        var Last_tmpwin = 0;
        var Last_ordercoins = 0;
        var np = 0; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)
        var num = 0;
        var start = new Date().getTime();
        if(data.length==0){
            console.log('沒有注單不需要算');
            var gameNum = getOpenNum();
            callback({'ErrorCode':0,'ErrorMessage':'','gameNum': gameNum}) ;
        }else{
            async.series({
                Z: function(callback_Z){ //初始化
                    callback_Z(null,0)
                },
                A: function(callback_A){ //將該期該區注單撈出加總押分及計算彩池累積
                    for(var i = 0;i<data.length;i++){
                        ordercoins += data[i]['bet017'];
                    }
                    callback_A(null,0)
                },
                B: function(callback_B){ //檢查是否開彩池
                    ThisTimeBonus = (ordercoins*takePercentage);
                    Commission = ordercoins * CommissionPercentage;
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
                    callback_B(null,0)
                },
                C: function(callback_C){
                    for(var i=0 ; i<7 ; i++){
                        var tmpwin = 0;
                        var item = 0;
                        for(var j=0 ; j<data.length ; j++){
                            var res = gamePlaybet(data[j],i);
                            if(res!=null){
                                //winbet[item] = result;
                                tmpwin += res;
                                item++
                            }
                        }
                        np = ordercoins - tmpwin - ThisTimeBonus - Commission;
                        var poolflag = false;
                        if(CanOpenPool == true && RedisBonus >100){
                            poolflag = true;

                            if(tmpwin == 0){

                            }

                            if(RedisBonus * PoolThresholdMaxPercentage > (tmpwin)){ //最大獎
                                if(tmpwin > OpenPool_tmpwin){
                                    openpool_np = np;
                                    OpenPoolNumber = i;
                                    OpenPool_tmpwin = tmpwin;
                                    OpenPool_ordercoins = ordercoins;
                                    flag = 1;
                                }
                            }
                        }
                        if ( CanOpenPool == false   || ( poolflag == true && flag!=1) ){
                            if( np >= 0 && tmpwin >= 0 ){ //這個號碼   公司會賺錢
                                flag=2;
                            }   
                        }
                        if( np >= 0 &&  np <= Minimum_np && tmpwin >= 0){ //公司賺最少的號碼
                            Minimum_np_Number = i;
                            Minimum_np = np;
                            Minimum_np_tmpwin = tmpwin;
                            Minimum_np_ordercoins = ordercoins;
                            nppositive = true;
                        }
                        
                        if( np <= 0 && np >= Maximum_np && tmpwin <= 0){  //如果公司輸  取 輸最少的
                            Maximum_np_Number = i;
                            Maximum_np = np;
                            Maximum_np_tmpwin = tmpwin;
                            Maximum_np_ordercoins = ordercoins;
                        }
                        
                        Last_tmpwin = tmpwin;
                        Last_ordercoins = ordercoins;
                    }
                    callback_C(null,0);
                },
                D: function(callback_D){
                    if(gameZone == 101)
                        bonus += ThisTimeBonus;
                    else if(gameZone==102)
                        bonus += ThisTimeBonus;
                    else if(gameZone==105)
                        bonus += ThisTimeBonus;
                    else if(gameZone==110)
                        bonus += ThisTimeBonus;
                    var DB_ordercoins = 0;
                    var DB_DT = PUB.formatDate()+"/"+PUB.formatDateTime;
                    var DB_LT = '051'
                    var DB_BC = Last_ordercoins;
                    var DB_SC = Last_tmpwin;
                    var DB_TB = ThisTimeBonus;
                    var DB_TC = Commission;
                    var DB_WT = 5;
                    if(flag==0){
                        if (nppositive==false){ 
                            //echo "<br>50組號碼 每一組都是輸的 找公司輸最少的號碼開";
                            //echo "<br>送出 :". $Maximum_np_tmpwin;
                            //echo "<br>Maximum_n2:".$Maximum_n2;
                            num = Maximum_np_Number;
                            
                            if(gameZone == 101)
                                bonus += Maximum_np; 
                            else if(gameZone==102)
                                bonus += Maximum_np;
                            else if(gameZone==105)
                                bonus += Maximum_np;
                            else if(gameZone==110)
                                bonus += Maximum_np;
                            
                            DB_ordercoins = Maximum_np_ordercoins;
                            DB_SC = Maximum_np_tmpwin;
                            DB_WT = 4;
                        }else{
                            //這個彩種有沒有人中獎
                            //echo "<br>沒有人中獎  | 累積到彩池 : ".$Minimum_n2;
                            num = Minimum_np_Number;
                            if(gameZone == 101)
                                bonus += Minimum_np; 
                            else if(gameZone==102)
                                bonus += Minimum_np;
                            else if(gameZone==105)
                                bonus += Minimum_np;
                            else if(gameZone==110)
                                bonus += Minimum_np;
                            DB_WT = 3;
                            DB_SC = Minimum_np_tmpwin;
                        }
                    }else if(flag==1){
                        //如果決定獎池開獎,但是因為獎池金額太少 導致於送出的金額反而比決定不要獎池開獎來的低
                        if(Minimum_np_tmpwin>OpenPool_tmpwin){
                            //echo "<br>有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : ".$Minimum_n2;
                            //echo "<br>送出 :". $Minimum_n2_tmpwin;
                            num = Minimum_np_Number;
                            if(gameZone == 101)
                                bonus += Minimum_np; 
                            else if(gameZone==102)
                                bonus += Minimum_np;
                            else if(gameZone==105)
                                bonus += Minimum_np;
                            else if(gameZone==110)
                                bonus += Minimum_np;
                            $DB_WT = 2;
                            $DB_SC = Minimum_np_tmpwin;
                        }
                        else{
                            //echo "<br>有人中獎 (彩池送出) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 :".$OpenPool_n2;
                            //echo "<br>送出 :".$OpenPool_tmpwin;
                            //如果超過閥值 但是送出金額要小於 彩池金額
                            //把送出去的獎池 扣掉   (這邊送出去的 是之前慢慢從玩家押注抽成的 )
                            if(gameZone == 101)
                                bonus += OpenPool_np; 
                            else if(gameZone==102)
                                bonus += OpenPool_np;
                            else if(gameZone==105)
                                bonus += OpenPool_np;
                            else if(gameZone==110)
                                bonus += OpenPool_np;
                            num = OpenPoolNumber;
                            DB_WT = 1;
                            DB_SC = OpenPool_tmpwin;
                        }
                    }else if(flag==2){
                        //echo "<br>有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : ".$Minimum_n2;
                        //echo "<br>送出 :". $Minimum_n2_tmpwin;
                        num = Minimum_np_Number;
                        if(gameZone == 101)
                            bonus += Minimum_np; 
                        else if(gameZone==102)
                            bonus += Minimum_np;
                        else if(gameZone==105)
                            bonus += Minimum_np;
                        else if(gameZone==110)
                            bonus += Minimum_np;
                        DB_WT = 2;
                        DB_SC = Minimum_np_tmpwin;
                    }
                    
                    var end = new Date().getTime();
                    if(gameZone == 101){
                        DB_B101 = bonus;
                        DB_C101 = RedisCommission;
                    }
                    else if(gameZone==102){
                        DB_B102 = bonus;
                        DB_C102 = RedisCommission;
                    }
                    else if(gameZone==105){
                        DB_B105 = bonus;
                        DB_C105 = RedisCommission;
                    }
                    else if(gameZone==110){
                        DB_B110 = bonus;
                        DB_C110 = RedisCommission;
                    }
                    
                    DB_num = num;
                    DB_Period = gameID
                    DB_PT = end - start;
                    //======================================================================================
                    //echo "<br>累積後彩池bonus13:".$bonus13;
                    //echo "<br>累積後彩池bonus14:".$bonus14;
                    //echo "<br>累積後彩池bonus15:".$bonus15;
                    //======================================================================================
                    //echo "<br>中獎號碼:".$num;
                    console.log('aaaaaaaaaaaa'+num);
                    var struct_log = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
                    var lib_gameoplog = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("bet_g51",struct_log);
                    lib_gameoplog.params.DT = 1;
                    lib_gameoplog.params.WT = 1;
                    lib_gameoplog.params.LT = award;
                    lib_gameoplog.params.BC = item.Val;
                    lib_gameop.Update(function(res){
                        if(!res){
                            callback(null,award);
                        }else{
                            callback(1,res);
                        }
                    });
                    callback_D(null,0);
                }
            },
            function(err, results) {
                 callback({'ErrorCode':0,'ErrorMessage':'','gameNum': num}) ;
            });

        }
    }
}

function getOpenNum(){
    var gameNum=-1; //開獎號碼初始化
    //  先開獎
    gameNum=Math.floor(Math.random() * 7);
    console.log("開獎號:"+gameNum);
    /*開獎號碼
    6 - 櫻桃
    5 - 橘子
    4 - 葡萄
    3 - 鈴鐺
    2 - 西瓜
    1 - 7
    0 - BAR*/
    return gameNum;
}

function gamePlaybet(data,num){
    var betValue = data.bet014.split(",");
    if(betValue[num]!=0){
        var multiple = 0;
        switch(num)
        {
            case 0:
                multiple=57
                break;
            case 1:
                multiple=27
                break;
            case 2:
                multiple=13
                break;
            case 3:
                multiple=10
                break;
            case 4:
                multiple=6
                break;
            case 5:
                multiple=2
                break;
            case 6:
                multiple=1
                break;
        }
        if(multiple != 0){
            var result = betValue[num]*multiple;
            return result;
        }
    }else{
        return 0;
    }
}

