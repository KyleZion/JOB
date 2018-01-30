var async = require('async');
var pomelo = require('pomelo');

module.exports = function gameop()
{
    this.gameopvn1 =function (dbmaster,dbslave,redis,gameID,gamebetdata,gameZone,callback) {
        var PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
        var bonus101 = 0;
        var bonus102 = 0;
        var bonus105 = 0;
        var bonus110 = 0;
        var RedisCommission101 = 0;
        var RedisCommission102 = 0;
        var RedisCommission105 = 0;
        var RedisCommission110 = 0;
        var RedisCommission = null;

        var DB_B101 = 0; //1:1區bonus
        var DB_C101 = 0; //1:1區佣金
        var DB_B102 = 0; //1:2區bonus
        var DB_C102 = 0; //1:2區佣金
        var DB_B105 = 0; //1:5區bonus
        var DB_C105 = 0; //1:5區佣金
        var DB_B110 = 0; //1:10區bonus
        var DB_C110 = 0; //1:10區佣金

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

        var OpenPoolNumber = 0; //開獎池號碼
        var OpenPool_np = 99999999;
        var OpenPool_tmpwin = 0;
        var OpenPool_ordercoins = 0;
        var Minimum_np_Number = 0;
        var Minimum_np = 99999999;
        var Minimum_np_tmpwin = 0;
        var Minimum_np_ordercoins = 0;
        var Maximum_np_Number = 0;
        var Maximum_np = -99999999;
        var Maximum_np_tmpwin = 0;
        var Maximum_np_ordercoins = 0;
        var nppositive = false;
        var bonusRate = 0;
            
        var Last_tmpwin = 0;
        var Last_ordercoins = 0;
        var np = 0; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)
        var num = 0;
        var start = new Date().getTime();
        if(gamebetdata.length==0){
            //console.log('沒有注單不需要算');
            var gameNum = getOpenNum();
            callback({'ErrorCode':0,'ErrorMessage':'','gameNum': gameNum}) ;
        }else{
            async.series({
                Z: function(callback_Z){ //初始化
                    async.series({
                        AA: function(callback_AA){
                            redis.hget('GS:GAMESERVER:GAMECONTROL:051', "CommissionPercentage"+gameZone, function (err, res) {
                                if(err){
                                    //DU_VIC:錯誤處理
                                }else{
                                    if(res==null){ //redis 無資料
                                        var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
                                        var args = ['CommissionPercentage','FW',gameZone];
                                        dbslave.query(sql,args,function(data){
                                            if(data.ErrorCode==0){
                                                CommissionPercentage = data.rows[0].value;
                                                redis.hset('GS:GAMESERVER:GAMECONTROL:051', "CommissionPercentage"+gameZone,data.rows[0].value);
                                                callback_AA(null,0);
                                            }/*else{
                                                CommissionPercentage = 0.15;
                                            }*/
                                        });
                                    }else{
                                        CommissionPercentage = Number(res);
                                        callback_AA(null,0);
                                    }
                                }
                            });
                            
                        },
                        BB: function(callback_BB){
                            redis.hget('GS:GAMESERVER:GAMECONTROL:051', "takePercentage"+gameZone, function (err, res) {
                                if(err){
                                    //DU_VIC:錯誤處理
                                }else{
                                    if(res==null){ //redis 無資料
                                        var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
                                        var args = ['takePercentage','FW',gameZone];
                                        dbslave.query(sql,args,function(data){
                                            if(data.ErrorCode==0){
                                                takePercentage = data.rows[0].value;
                                                redis.hset('GS:GAMESERVER:GAMECONTROL:051', "takePercentage"+gameZone,data.rows[0].value);
                                                callback_BB(null,0);
                                            }/*else{
                                                takePercentage = 0.15;
                                            }*/
                                        });
                                    }else{
                                        takePercentage = Number(res) ; 
                                        callback_BB(null,0);
                                    }
                                }
                            });
                        },
                        CC: function(callback_CC){
                            redis.hget('GS:GAMESERVER:GAMECONTROL:051', "OpenPoolPercentage"+gameZone, function (err, res) {
                                if(err){
                                    //DU_VIC:錯誤處理
                                }else{
                                    if(res==null){ //redis 無資料
                                        var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
                                        var args = ['OpenPoolPercentage','FW',gameZone];
                                        dbslave.query(sql,args,function(data){
                                            if(data.ErrorCode==0){
                                                OpenPoolPercentage = data.rows[0].value;
                                                redis.hset('GS:GAMESERVER:GAMECONTROL:051', "OpenPoolPercentage"+gameZone, data.rows[0].value);
                                                callback_CC(null,0);
                                            }/*else{
                                                OpenPoolPercentage = 0.15;
                                            }*/
                                        });
                                    }else{
                                        OpenPoolPercentage = Number(res);
                                        callback_CC(null,0);
                                    }
                                }
                            });
                        },
                        DD: function(callback_DD){
                            redis.hget('GS:GAMESERVER:GAMECONTROL:051', "OpenPoolBase"+gameZone, function (err, res) {
                                if(err){
                                    //DU_VIC:錯誤處理
                                }else{
                                    if(res==null){ //redis 無資料
                                        var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
                                        var args = ['OpenPoolBase','FW',gameZone];
                                        dbslave.query(sql,args,function(data){
                                            if(data.ErrorCode==0){
                                                OpenPoolBase = data.rows[0].value;
                                                redis.hset('GS:GAMESERVER:GAMECONTROL:051', "OpenPoolBase"+gameZone, data.rows[0].value);
                                                callback_DD(null,0);
                                            }/*else{
                                                OpenPoolBase = 0.15;
                                            }*/
                                        });
                                    }else{
                                        OpenPoolBase = Number(res);
                                        callback_DD(null,0);
                                    }
                                }
                            });
                        },
                        EE: function(callback_EE){
                            redis.hget('GS:GAMESERVER:GAMECONTROL:051', "PoolThresholdMaxPercentage"+gameZone, function (err, res) {
                                if(err){
                                    //DU_VIC:錯誤處理
                                }else{
                                    if(res==null){ //redis 無資料
                                        var sql = "SELECT value FROM game_controls where name = ? and gametype = ? and playtype = ?";
                                        var args = ['PoolThresholdMaxPercentage','FW',gameZone];
                                        dbslave.query(sql,args,function(data){
                                            if(data.ErrorCode==0){
                                                PoolThresholdMaxPercentage = data.rows[0].value;
                                                redis.hset('GS:GAMESERVER:GAMECONTROL:051', "PoolThresholdMaxPercentage"+gameZone, data.rows[0].value);
                                                callback_EE(null,0);
                                            }/*else{
                                                PoolThresholdMaxPercentage = 0.15;
                                            }*/
                                        });
                                    }else{
                                        PoolThresholdMaxPercentage = Number(res);
                                        callback_EE(null,0);
                                    }
                                }
                            });
                            
                        },
                        FF: function(callback_FF){
                            redis.hgetall('GS:Bonus:051', function (err, res) {
                                if(err){
                                    bonus101 = 0;
                                    bonus102 = 0;
                                    bonus105 = 0;
                                    bonus110 = 0;
                                    callback_FF(null,0);
                                }else{
                                    if(res!=null){
                                        bonus101 = Number(res.RedisBonus101);
                                        bonus102 = Number(res.RedisBonus102);
                                        bonus105 = Number(res.RedisBonus105);
                                        bonus110 = Number(res.RedisBonus110);
                                        callback_FF(null,0);
                                    }
                                }
                                });
                            
                        },
                        GG: function(callback_GG){
                            redis.hgetall('GS:Commission:051', function (err, res) {
                                if(err){
                                    RedisCommission101 = 0;
                                    RedisCommission102 = 0;
                                    RedisCommission105 = 0;
                                    RedisCommission110 = 0;
                                    callback_GG(null,0);
                                }else{
                                    if(res!=null){
                                        RedisCommission101 = Number(res.RedisCommission101);
                                        RedisCommission102 = Number(res.RedisCommission102);
                                        RedisCommission105 = Number(res.RedisCommission105);
                                        RedisCommission110 = Number(res.RedisCommission110);
                                        callback_GG(null,0);
                                    }
                                }
                            });
                        }
                    },

                    function(err, results) {
                        //console.log(results);
                        callback_Z(null,0)
                    });
                    
                },
                A: function(callback_A){ //將該期該區注單撈出加總押分及計算彩池累積
                    for(var i = 0;i<gamebetdata.length;i++){
                        ordercoins += gamebetdata[i]['bet017'];//總押分
                    }
                    callback_A(null,0)
                },
                B: function(callback_B){ //檢查是否開彩池
                    ThisTimeBonus = (ordercoins*takePercentage);
                    Commission = ordercoins * CommissionPercentage;

                    if(gameZone == 101){
                        RedisCommission101 += Commission;
                        redis.hset('GS:Commission:051', "RedisCommission101", RedisCommission101);
                    }
                    else if(gameZone==102){
                        RedisCommission102 += Commission;
                        redis.hset('GS:Commission:051', "RedisCommission102", RedisCommission102);
                    }
                    else if(gameZone==105){
                        RedisCommission105 += Commission;
                        redis.hset('GS:Commission:051', "RedisCommission105", RedisCommission105);
                    }
                    else if(gameZone==110){
                        RedisCommission110 += Commission;
                        redis.hset('GS:Commission:051', "RedisCommission110", RedisCommission110);
                    }

                    if(gameZone == 101)
                        RedisBonus = bonus101;
                    else if(gameZone==102)
                        RedisBonus = bonus102;
                    else if(gameZone==105)
                        RedisBonus = bonus105;
                    else if(gameZone==110)
                        RedisBonus = bonus110;

                    if(RedisBonus > 0)
                    {
                      var OpenPoolR_L = (RedisBonus / OpenPoolBase)*100;
                      if(OpenPoolR_L > 100)
                      {
                        CanOpenPool = true;
                      }else{
                        var OpenPoolR = Math.floor(Math.random() * 100);
                        //console.log("開獎池機率"+OpenPoolR);
                        CanOpenPool = OpenPoolR> OpenPoolPercentage;
                      }
                    }
                    callback_B(null,0)
                },
                C: function(callback_C){
                    for(var i=0 ; i<8 ; i++){
                        var tmpwin = 0;
                        //var item = 0;
                        for(var j=0 ; j<gamebetdata.length ; j++){
                            var res = gamePlaybet(gamebetdata[j],i);
                            if(res!=null){
                                //winbet[item] = result;
                                tmpwin += res;
                                //item++
                            }
                        }
                        np = ordercoins - tmpwin - ThisTimeBonus - Commission;//押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)
                        var poolflag = false;
                        if(CanOpenPool == true && RedisBonus >100){
                            poolflag = true;

                            if(tmpwin == 0){

                            }
                            if(RedisBonus * PoolThresholdMaxPercentage >= (tmpwin)){
                                if(tmpwin > OpenPool_tmpwin){
                                    OpenPool_np = np;
                                    OpenPoolNumber = i;
                                    OpenPool_tmpwin = tmpwin;
                                    OpenPool_ordercoins = ordercoins;
                                    flag = 1;
                                }
                            }
                            if(RedisBonus * PoolThresholdMaxPercentage >= (ordercoins) && i == 7){
                                console.log('bonus計算')
                                bonusRate = Math.floor((RedisBonus * PoolThresholdMaxPercentage)/ ordercoins);
                                OpenPool_np = np - (ordercoins * bonusRate) + ordercoins;
                                OpenPoolNumber = i;
                                OpenPool_tmpwin = ordercoins * bonusRate;
                                OpenPool_ordercoins = ordercoins;
                                flag = 1;
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
                        
                        if( np <= 0 && np >= Maximum_np && tmpwin >= 0){  //如果公司輸  取 輸最少的
                            Maximum_np_Number = i;
                            Maximum_np = np;
                            Maximum_np_tmpwin = tmpwin;
                            Maximum_np_ordercoins = ordercoins;
                        }
                        /*console.log("獎號"+i);
                        console.log("np"+np);
                        console.log("tmpwin"+tmpwin);
                        console.log("總下注額"+ordercoins);*/
                        Last_tmpwin = tmpwin;
                        Last_ordercoins = ordercoins;
                    }
                    callback_C(null,0);
                },
                D: function(callback_D){
                    if(gameZone == 101)
                        bonus101 += ThisTimeBonus;
                    else if(gameZone==102)
                        bonus102 += ThisTimeBonus;
                    else if(gameZone==105)
                        bonus105 += ThisTimeBonus;
                    else if(gameZone==110)
                        bonus110 += ThisTimeBonus;
                    var DB_ordercoins = 0;
                    var DB_DT = PUB.formatDate()+" "+PUB.formatDateTime();
                    var DB_LT = '51'
                    var DB_BC = Last_ordercoins;
                    var DB_SC = Last_tmpwin;
                    var DB_TB = ThisTimeBonus;
                    var DB_TC = Commission;
                    var DB_WT = 5;
                    if(flag==0){
                        if (nppositive==false){ 
                            //echo "<br>每一組都是輸的 找公司輸最少的號碼開";
                            //echo "<br>送出 :". $Maximum_np_tmpwin;
                            //echo "<br>Maximum_n2:".$Maximum_n2;
                            num = Maximum_np_Number;
                            
                            if(gameZone == 101)
                                bonus101 += Maximum_np; 
                            else if(gameZone==102)
                                bonus102 += Maximum_np;
                            else if(gameZone==105)
                                bonus105 += Maximum_np;
                            else if(gameZone==110)
                                bonus110 += Maximum_np;
                            
                            DB_ordercoins = Maximum_np_ordercoins;
                            DB_SC = Maximum_np_tmpwin;
                            DB_WT = 4;
                            console.log('輸最少'+ num);
                        }else{
                            //這個彩種有沒有人中獎
                            //echo "<br>沒有人中獎  | 累積到彩池 : ".$Minimum_n2;
                            num = Minimum_np_Number;
                            if(gameZone == 101)
                                bonus101 += Minimum_np; 
                            else if(gameZone==102)
                                bonus102 += Minimum_np;
                            else if(gameZone==105)
                                bonus105 += Minimum_np;
                            else if(gameZone==110)
                                bonus110 += Minimum_np;
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
                                bonus101 += Minimum_np; 
                            else if(gameZone==102)
                                bonus102 += Minimum_np;
                            else if(gameZone==105)
                                bonus105 += Minimum_np;
                            else if(gameZone==110)
                                bonus110 += Minimum_np;
                            DB_WT = 2;
                            DB_SC = Minimum_np_tmpwin;
                        }
                        else{
                            //echo "<br>有人中獎 (彩池送出) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 :".$OpenPool_n2;
                            //echo "<br>送出 :".$OpenPool_tmpwin;
                            //如果超過閥值 但是送出金額要小於 彩池金額
                            //把送出去的獎池 扣掉   (這邊送出去的 是之前慢慢從玩家押注抽成的 )

                            if(gameZone == 101)
                                bonus101 += OpenPool_np; 
                            else if(gameZone==102)
                                bonus102 += OpenPool_np;
                            else if(gameZone==105)
                                bonus105 += OpenPool_np;
                            else if(gameZone==110)
                                bonus110 += OpenPool_np;
                            num = OpenPoolNumber;
                            DB_WT = 1;
                            DB_SC = OpenPool_tmpwin;
                        }
                    }else if(flag==2){
                        //echo "<br>有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : ".$Minimum_n2;
                        //echo "<br>送出 :". $Minimum_n2_tmpwin;
                        num = Minimum_np_Number;
                        if(gameZone == 101)
                            bonus101 += Minimum_np; 
                        else if(gameZone==102)
                            bonus102 += Minimum_np;
                        else if(gameZone==105)
                            bonus105 += Minimum_np;
                        else if(gameZone==110)
                            bonus110 += Minimum_np;
                        DB_WT = 2;
                        DB_SC = Minimum_np_tmpwin;
                    }
                    
                    var end = new Date().getTime();
                    if(gameZone == 101){
                        DB_B101 = bonus101;
                        DB_C101 = RedisCommission101;
                    }
                    else if(gameZone==102){
                        DB_B102 = bonus102;
                        DB_C102 = RedisCommission102;
                    }
                    else if(gameZone==105){
                        DB_B105 = bonus105;
                        DB_C105 = RedisCommission105;
                    }
                    else if(gameZone==110){
                        DB_B110 = bonus110;
                        DB_C110 = RedisCommission110;
                    }
                    
                    DB_num = num;
                    DB_Period = gameID
                    DB_PT = (end - start)/1000;
                    //======================================================================================
                    //echo "<br>累積後彩池bonus13:".$bonus13;
                    //echo "<br>累積後彩池bonus14:".$bonus14;
                    //echo "<br>累積後彩池bonus15:".$bonus15;
                    //======================================================================================
                    //echo "<br>中獎號碼:".$num;
                    var struct_log = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
                    var lib_gameoplog = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("game_open_logs",struct_log);
                    struct_log.params.DT = DB_DT;
                    struct_log.params.WT = DB_WT;
                    struct_log.params.LT = DB_LT;
                    struct_log.params.BC = DB_BC;
                    struct_log.params.SC = DB_SC;
                    struct_log.params.TB = DB_TB;
                    struct_log.params.TC = DB_TC;
                    struct_log.params.B110 = DB_B110;
                    struct_log.params.B105 = DB_B105;
                    struct_log.params.B102 = DB_B102;
                    struct_log.params.B101 = DB_B101;
                    struct_log.params.C110 = DB_C110;
                    struct_log.params.C105 = DB_C105;
                    struct_log.params.C102 = DB_C102;
                    struct_log.params.C101 = DB_C101;
                    struct_log.params.num = DB_num;
                    struct_log.params.Period = gameID;
                    struct_log.params.PT = DB_PT;
                    lib_gameoplog.Insert(function(res){
                        if(res){
                            //console.log('wintype'+DB_WT);
                            callback_D(null,0);
                        }else{
                            console.log('寫入資料庫失敗');
                            callback_D(1,0);
                        }
                    });
                }
            },
            function(err, results) {
                if(!err){
                    redis.hset('GS:Bonus:051', "RedisBonus101", bonus101);
                    redis.hset('GS:Bonus:051', "RedisBonus102", bonus102);
                    redis.hset('GS:Bonus:051', "RedisBonus105", bonus105);
                    redis.hset('GS:Bonus:051', "RedisBonus110", bonus110);
                    console.log('最後開:'+num)
                 callback({'ErrorCode':0,'ErrorMessage':'','gameNum': num}) ;
                }
                
            });

        }
    }
}

function getOpenNum(){
    var gameNum=-1; //開獎號碼初始化
    //  先開獎
    gameNum=Math.floor(Math.random() * 7);
    //console.log("開獎號:"+gameNum);
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

function gamePlaybet(gdata,num){
    var betValue = gdata.bet014.split(",");
    if(num!=7){
        if(betValue[num]!=0){
            var multiple = 0;
            switch(num)
            {
                case 0:
                    multiple=58;
                    break;
                case 1:
                    multiple=28;
                    break;
                case 2:
                    multiple=14;
                    break;
                case 3:
                    multiple=11;
                    break;
                case 4:
                    multiple=7;
                    break;
                case 5:
                    multiple=3;
                    break;
                case 6:
                    multiple=2;
                    break;
            }
            if(multiple != 0){
                var result = Number(betValue[num])* multiple * Number(gdata.bet016);
                return result;
            }
        }else{
            return 0;
        }
    }else{
        return Number(gdata.bet017);
    }
    
}

