var async = require('async');
var pomelo = require('pomelo');

module.exports = function gameop()
{
    this.gameopvn1 =function (dbmaster,dbslave,gameID,data,gameZone,callback) {
        var CommissionPercentage = 0.15; //佣金百分比 [0.1 ~ 1]
        var takePercentage = 0.01; //獎池抽成百分比 (強制收入) [0 ~ 0.2]
        var OpenPoolPercentage = 050; //開獎池機率 越高越難中獎 [10 ~ 90]
        var OpenPoolBase = 3000; //獎池如果大於這個數字 一定開獎 [500 ~ ]
        var PoolThresholdMaxPercentage = 0.7; //送出金額要小於彩池金額的百分比[0 ~ 1]
        var ordercoins = 0; //總押分
        var Commission = ordercoins*CommissionPercentage; //佣金
        var ThisTimeBonus = 0;  //獎池累積
        var CanOpenPool = false;  //開獎池與否
        var OpenPoolR_L = 0; 
        var RedisBonus = 0;
        console.log(data);
        if(data.length==0){
            console.log('沒有注單不需要算');
            var gameNum = getOpenNum();
            callback({'ErrorCode':0,'ErrorMessage':'','gameNum': gameNum}) ;
        }else{
            async.series({
                A: function(callback_A){ //將該期該區注單撈出加總押分及計算彩池累積
                    for(var i = 0;i<data.length;i++){
                        ThisTimeBonus += (ordercoins*takePercentage);
                        ordercoins += data[i]['bet017'];
                    }
                    callback_A(null,0)
                },
                B: function(callback_B){ //檢查是否開彩池
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
                    console.log(ThisTimeBonus);
                    console.log(ordercoins);
                    console.log(Commission);
                    console.log(CanOpenPool);
                    callback_B(null,0)
                },
                C: function(callback_C){
                    for(var i=0 ; i<7 ; i++){
                        var num = i;
                        var winbet = new Array();
                        var tmpwin = 0;

                        var result = gamePlaybet(data[i]);
                    }
                },
                D: function(callback_D){
                    
                }
            },
            function(err, results) {
                 callback({'ErrorCode':0,'ErrorMessage':'','gameNum': 1}) ;
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

/*
<?

require_once(PATH_SYS.'/config_db_data.php');
require_once(PATH_HOME.'/_pub/dbUtil.php');
require_once(PATH_HOME.'/_pub/casinoUtil.php');
require_once(PATH_HOME.'/_pub/ratioUtil.php');
require_once(PATH_HOME.'/_pub/recordUtil.php');

class gameopvn1 extends AjaxAction{
    function init()
    {
    
    }
    function caclutime()
    {
        $time = explode( " ", microtime());
        $usec = (double)$time[0];
        $sec = (double)$time[1];
        return $sec + $usec;
    }       
    function execute()
    {
        if( !defined ('ISBACKDROP') || ISBACKDROP!=1)
            return $this->toJson(array('ISBACKDROP'=>'ERROR'));
        //http://ts168w.fa88999.com:8088/v/game-gameopvn2
        echo "START<br/>";
        
        $runtype = $this->param('runtype'); //彩別代號
        
        $start = $this->caclutime();
        $redis = getRedis();
        //======================================================================================
        $bonus13 = $redis->get('Bonus:13:000');
        $bonus14 = $redis->get('Bonus:14:000');
        $bonus15 = $redis->get('Bonus:15:000');
        $RedisCommission13 = $redis->get('Commission:13:000');
        $RedisCommission14 = $redis->get('Commission:14:000');
        $RedisCommission15 = $redis->get('Commission:15:000');
        
        
//      $CommissionPercentage = 0.15;   //佣金百分比
//      $takePercentage = 0.01; //獎池抽成百分比 (收入)
//      $OpenPoolPercentage = 50; //開獎池機率 (0~100) 越高越難中獎
//      $OpenPoolBase = 3000;    //獎池越接近著個數字 就越容易開獎  如果大於這個數字 依定開獎
//      $PoolThresholdMaxPercentage = 0.7;   //累積彩池多少後 要開放中獎  但是送出金額要小於 彩池金額的百分比 (最大獎池會吐多少百分比)
        
        if(!isset($bonus13))$bonus13 = 0;
        if(!isset($bonus14))$bonus14 = 0;
        if(!isset($bonus15))$bonus15 = 0;
        if(!isset($RedisCommission13))$RedisCommission13 = 0;
        if(!isset($RedisCommission14))$RedisCommission14 = 0;
        if(!isset($RedisCommission15))$RedisCommission15 = 0;

        //$CommissionPercentage = $redis->get('MinutesLotto:CommissionPercentage:');
        //$takePercentage = $redis->get('MinutesLotto:takePercentage:');
        //$OpenPoolPercentage = $redis->get('MinutesLotto:OpenPoolPercentage:');
        //$OpenPoolBase = $redis->get('MinutesLotto:OpenPoolBase:');
        //$PoolThresholdMaxPercentage = $redis->get('MinutesLotto:PoolThresholdMaxPercentage:');
        
        echo "----------------------------------------------------------------------------------------------------<br/>";
        $CommissionPercentage = $redis->get('MinutesLotto:CommissionPercentage:');
        if(!isset($CommissionPercentage)) {
            echo "Get CommissionPercentage from db <br/>";
            $SQL = 'SELECT sys002 FROM system_config WHERE sys001 ="'.'ML:CommissionPercentage:'.'"';
            echo $SQL."<br/>";
            $gamedata = db_queryOne($SQL);  
            if($gamedata!=null){
                echo "從資料庫得到參數:".$gamedata[0]."<br/>";
                $CommissionPercentage = (float)$gamedata[0];
            }
            else{
                echo "沒有從資料庫得到參數: <br/>";
                $CommissionPercentage = 0.15;
            }
            
            echo "寫入Redis : ".$CommissionPercentage."<br/>";
            $redis->set('MinutesLotto:CommissionPercentage:',$CommissionPercentage);
        }
        echo "----------------------------------------------------------------------------------------------------<br/>";
        $takePercentage = $redis->get('MinutesLotto:takePercentage:');
        if(!isset($takePercentage)) {
            echo "Get takePercentage from db <br/>";
            $SQL = 'SELECT sys002 FROM system_config WHERE sys001 ="'.'ML:takePercentage:'.'"';
            echo $SQL."<br/>";
            $gamedata = db_queryOne($SQL);  
            if($gamedata!=null){
                echo "從資料庫得到參數:".$gamedata[0]."<br/>";
                $takePercentage = (float)$gamedata[0];
            }
            else{
                echo "沒有從資料庫得到參數: <br/>";
                $takePercentage = 0.01;
            }
            
            echo "寫入Redis : ".$takePercentage."<br/>";
            $redis->set('MinutesLotto:takePercentage:',$takePercentage);
        }
        echo "----------------------------------------------------------------------------------------------------<br/>";
        $OpenPoolPercentage = $redis->get('MinutesLotto:OpenPoolPercentage:');
        if(!isset($OpenPoolPercentage)) {
            echo "Get OpenPoolPercentage from db <br/>";
            $SQL = 'SELECT sys002 FROM system_config WHERE sys001 ="'.'ML:OpenPoolPercentage:'.'"';
            echo $SQL."<br/>";
            $gamedata = db_queryOne($SQL);  
            if($gamedata!=null){
                echo "從資料庫得到參數:".$gamedata[0]."<br/>";
                $OpenPoolPercentage = (float)$gamedata[0];
            }
            else{
                echo "沒有從資料庫得到參數: <br/>";
                $OpenPoolPercentage = 50;
            }
            
            echo "寫入Redis : ".$OpenPoolPercentage."<br/>";
            $redis->set('MinutesLotto:OpenPoolPercentage:',$OpenPoolPercentage);
        }
        echo "----------------------------------------------------------------------------------------------------<br/>";
        $OpenPoolBase = $redis->get('MinutesLotto:OpenPoolBase:');
        if(!isset($OpenPoolBase)) {
            echo "Get OpenPoolBase from db <br/>";
            $SQL = 'SELECT sys002 FROM system_config WHERE sys001 ="'.'ML:OpenPoolBase:'.'"';
            echo $SQL."<br/>";
            $gamedata = db_queryOne($SQL);  
            if($gamedata!=null){
                echo "從資料庫得到參數:".$gamedata[0]."<br/>";
                $OpenPoolBase = (float)$gamedata[0];
            }
            else{
                echo "沒有從資料庫得到參數: <br/>";
                $OpenPoolBase = 9999;
            }
            
            echo "寫入Redis : ".$OpenPoolBase."<br/>";
            $redis->set('MinutesLotto:OpenPoolBase:',$OpenPoolBase);
        }
        echo "----------------------------------------------------------------------------------------------------<br/>";
        $PoolThresholdMaxPercentage = $redis->get('MinutesLotto:PoolThresholdMaxPercentage:');
        if(!isset($PoolThresholdMaxPercentage)) {
            echo "Get PoolThresholdMaxPercentage from db <br/>";
            $SQL = 'SELECT sys002 FROM system_config WHERE sys001 ="'.'ML:PoolThresholdMaxPercentage:'.'"';
            echo $SQL."<br/>";
            $gamedata = db_queryOne($SQL);  
            if($gamedata!=null){
                echo "從資料庫得到參數:".$gamedata[0]."<br/>";
                $PoolThresholdMaxPercentage = (float)$gamedata[0];
            }
            else{
                echo "沒有從資料庫得到參數: <br/>";
                $PoolThresholdMaxPercentage = 0.1;
            }
            
            echo "寫入Redis : ".$PoolThresholdMaxPercentage."<br/>";
            $redis->set('MinutesLotto:PoolThresholdMaxPercentage:',$PoolThresholdMaxPercentage);
        }
        echo "----------------------------------------------------------------------------------------------------<br/>";
        
        
        if(!isset($CommissionPercentage)||!isset($takePercentage)||!isset($OpenPoolPercentage)||!isset($OpenPoolBase)||!isset($PoolThresholdMaxPercentage)){
            $CommissionPercentage = 0.15;
            $takePercentage = 0.01;
            $OpenPoolPercentage = 50;
            $OpenPoolBase = 3000;
            $PoolThresholdMaxPercentage = 0.7;
        }
        
        
        $openURL = getSystemValue('MINUTESLOTTO_GAMEOPX');
        echo "<br>openURL : ".$openURL;
        //======================================================================================
        $result =array();
        $casino=getCasinoByKey();
        //======================================================================================
    
    
        
    
        //==================================================================================
        //撈所有期數
        $isTest = false;
        $SQL = '';
        if($isTest == true)
            $SQL = 'SELECT gas001, gas002, gas003 FROM games WHERE gas002 =13 and gas001 = 7658';
        else{
            $lastruntime = $redis->get('MinutesLotto:lastruntime');
            if(!isset($lastruntime)||  ($runtype!=null&&$runtype==1)  )
                $SQL = 'select gas001,gas002,gas003 from games where  TIMESTAMP(gas006,gas007)+0 < now() and gas012=0 and gas009 =0 and gas002 in(13,14,15) order by TIMESTAMP(gas006,gas007),gas002 limit 3 ';
            else
                $SQL = 'select gas001,gas002,gas003 from games where  TIMESTAMP(gas006,gas007)+0 < now() and TIMESTAMP(gas006,gas007)+0 > "'.$lastruntime.'" and gas012=0 and gas009 =0 and gas002 in(13,14,15) order by TIMESTAMP(gas006,gas007),gas002 limit 3 ';
        }
            
        $gamedata = dbp_queryAll($SQL,array(),true);    
        
        $redis->set('MinutesLotto:lastruntime',date("Y-m-d H:i:s"));
            
        echo "<br>".$SQL;
        echo "<br>count(gamedata) : ".count($gamedata);
        //======================================================================================
        for($i=0;$i<count($gamedata);$i++)
        {
    
            //======================================================================================
            $casinoType=$casino[$gamedata[$i][1]][2];
            require_once($GLOBALS['fgame_path'].$casinoType.'/ExResult.class.php');
            $className='\\'.$casinoType.'\\ExResult';
            $resultClz = new $className();
            //======================================================================================
            //撈住單
            //bet002 0  唯一單號
            //bet011 1  玩法代號
            //bet012 2  玩法項目
            //bet014 3  下注內容
            //bet015 4  下注注數
            //bet016 5  下注倍數
            //bet017 6  下注金額   下多少錢
            //bet018 7  基本賠率
            //bet019 8  公司調賠
            //bet020 9  會員賠偏
            //bet021 10 下注賠偏
            //bet118 11 副基本賠率
            //bet119 12 副公司調賠
            //bet120 13 副會員賠偏
            //bet013 14 下注模式 = 1:元 /2:分/3.角
            //bet005 15 會員編號
            
            $SQL = 'select bet002,bet011,bet012,bet014,bet015,bet016,bet017,bet018,bet019,bet020,bet021,bet118,bet119,bet120,bet121,bet013,bet005,betgroup from bet_g'.$gamedata[$i][1].' where bet009='.$gamedata[$i][0].' and bet003=0 order by bet008';
            echo "<br>".$SQL;
            $data = db_queryAll($SQL,true);
            echo "<br>count(data) : ".count($data);
            //======================================================================================
        
            
            $ThisTimeBonus = 0; //這次的獎池累計
            $CanOpenPool = false; //是否開獎池
            $Commission = 0;//佣金
            $ordercoins =0; //總押分
            if($PoolThresholdMaxPercentage > 1 || $PoolThresholdMaxPercentage > 1){
                echo "設定錯誤 送出百分比不能大於1";
                return ;
            }
            
            //======================================================================================
            if(count($data)==0){
                echo "沒有單子 不需要算 直接開號碼";
                $num =$this->getOpenNum();
                $resultClz->setNums($num);
                if($isTest == false){
                    
                
                    
                    echo '<br>真的結算1'.'http://'.$openURL.'/v/game-gameopx?g='.$casino[$gamedata[$i][1]][1].'&i='.$gamedata[$i][2].'&n='.$num;
                    $ch = curl_init('http://'.$openURL.'/v/game-gameopx?g='.$casino[$gamedata[$i][1]][1].'&i='.$gamedata[$i][2].'&n='.$num);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                    $result[] =curl_exec($ch);
                    curl_close($ch);
                    
                    $gametype = $casino[$gamedata[$i][1]][1];
                    $gameid = $casino[$gamedata[$i][1]][1];
                    $gamename = $gamedata[$i][2];
                    $gamenum = $num;
                    $this->InsertNumber($gametype,$gameid,$gamename,$gamenum);
                        
                }
                else 
                    echo "<br>測試模是 不真的結算";
                continue ;
            }
            //======================================================================================
            for($q=0;$q<count($data);$q++){
                //echo "<br>期數:".$gamedata[$i][0]." 唯一單號 : ".$data[$q][0]." 下注金額 : ".$data[$q][6]." 會員編號 : ".$data[$q][15]." 下注內容 : ".$data[$q][3]." 玩法項目 : ".$data[$q][2];
                $ThisTimeBonus  += ($data[$q][6] * $takePercentage); //這次的獎池累計 
                $ordercoins+=$data[$q][6];//總押分
            }
            //======================================================================================
            echo "<br>總押分:".$ordercoins;
            $Commission = $ordercoins * $CommissionPercentage; //算佣金
            echo "<br>佣金:".$Commission;
            if($gamedata[$i][1]==13)
                $RedisCommission13 += $Commission;
            else if($gamedata[$i][1]==14)
                $RedisCommission14 += $Commission;
            else if($gamedata[$i][1]==15)
                $RedisCommission15 += $Commission;

            $redis->set('Commission:13:000',$RedisCommission13);
            $redis->set('Commission:14:000',$RedisCommission14);
            $redis->set('Commission:15:000',$RedisCommission15);
            
            echo "<br>RedisCommission13:".$RedisCommission13;
            echo "<br>RedisCommission14:".$RedisCommission14;
            echo "<br>RedisCommission15:".$RedisCommission15;
            
            //======================================================================================
            $RedisBonus = 0;
            if($gamedata[$i][1]==13)
                $RedisBonus = $bonus13;
            else if($gamedata[$i][1]==14)
                $RedisBonus = $bonus14;
            else if($gamedata[$i][1]==15)
                $RedisBonus = $bonus15;
            //======================================================================================
//          //檢查如果採池大於 $OpenPoolBase 兩倍 表示有異常  採池歸零
//          if ($RedisBonus > $OpenPoolBase * 2){
//              if($gamedata[$i][1]==13)
//                  $RedisBonus = 0;
//              else if($gamedata[$i][1]==14)
//                  $RedisBonus = 0;
//              else if($gamedata[$i][1]==15)
//                  $RedisBonus = 0;
//          }
            //======================================================================================
            
            if($RedisBonus > 0 ){
                $OpenPoolR_L= ($RedisBonus / $OpenPoolBase)*100;
                echo "<br>OpenPoolR_L:".$OpenPoolR_L;
                if( $OpenPoolR_L > 100)
                {
                    $CanOpenPool = true;
                }
                else{
                    $OpenPoolR = mt_rand(0,100) ;
                    echo "<br>OpenPoolR:".$OpenPoolR;
                    $CanOpenPool = $OpenPoolR > $OpenPoolPercentage;
                }
            }
            echo "<br>是否開獎池:". ($CanOpenPool?"是":"否");
            //==以下開50個號碼 看有沒有中獎 ===================================================================
            echo "<br>RedisBonus:".$RedisBonus;
            echo "<br>RedisBonus * PoolThresholdMaxPercentage:".$RedisBonus * $PoolThresholdMaxPercentage;
            //==以下開50個號碼 看有沒有中獎 ===================================================================
        
            $OpenPoolNumber = $this->getOpenNum();
            $OpenPool_n2 = 99999999;
            $OpenPool_tmpwin = 0;
            $OpenPool_ordercoins = 0;
            $Minimum_n2_Number = $this->getOpenNum();
            $Minimum_n2 = 99999999;
            $Minimum_n2_tmpwin = 0;
            $Minimum_n2_ordercoins = 0;
            $Maximum_n2_Number = $this->getOpenNum();
            $Maximum_n2 = 0;
            $Maximum_n2_tmpwin = 0;
            $Maximum_n2_ordercoins = 0;
            
            $Last_tmpwin = 0;
            $Last_ordercoins = 0;
            
            $pary = null;
            $flag = 0;
            $num = "";
            $n2 = 0; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)
            echo "<br>======================================<br>";
            $Run = 50;
            $RunStep = 10;
            $RunMax = 100;
            $n2positive = false;
            for($nn=0;$nn<$Run;$nn++){
            
                $num =$this->getOpenNum();
                $resultClz->setNums($num);      
                $winbet = array();
                $tmpwin = 0;   //總贏分 (玩家贏)

                for($q=0;$q<count($data);$q++){
                    $result = $resultClz->cbPlayBet($data[$q]);
                    if($result!=null){
                        $winbet[]=$result;
                        $tmpwin+=$result[5];
                    }
                }
                
                
                
                $n2 = $ordercoins - $tmpwin - $ThisTimeBonus - $Commission; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)

                if($tmpwin == 0)
                    echo " | Zero". str_pad($nn,3,'0',STR_PAD_LEFT);
                else 
                    echo " | ".$n2."A".$tmpwin;
                
                $poolflag = false;
                if( $CanOpenPool == true   && $RedisBonus > 100){
                    $poolflag = true;
                    
                    if($tmpwin == 0){
                        if($flag!=1 && $nn == ($Run - 1)){
                            $Run += $RunStep;
                            if($Run > $RunMax){
                                $Run = $RunMax;
                            }
                        }
                        continue;
                    }
                    
                    if($RedisBonus * $PoolThresholdMaxPercentage  > ($tmpwin)){
                        if( $tmpwin > $OpenPool_tmpwin ){ //派送最大獎的號碼
                            $OpenPool_n2 = $n2;
                            $OpenPoolNumber = $num;
                            $OpenPool_tmpwin =$tmpwin;
                            $OpenPool_ordercoins = $ordercoins;
                            $flag=1;
                        }
                    }
                }
                
                //if($tmpwin == 0)
                    //continue;
                
                if ( $CanOpenPool == false   || ( $poolflag == true && $flag!=1) ){
                    if( $n2 >= 0 && $tmpwin >= 0 ){ //這個號碼   公司會賺錢
                        $flag=2;
                    }   
                }
                
                if( $n2 >= 0 &&  $n2 <= $Minimum_n2 && $tmpwin >= 0){ //公司賺最少的號碼
                    $Minimum_n2_Number = $num;
                    $Minimum_n2 = $n2;
                    $Minimum_n2_tmpwin = $tmpwin;
                    $Minimum_n2_ordercoins = $ordercoins;
                    $n2positive = true;
                }
                
                if( $n2 <= 0 && $n2 >= $Maximum_n2 && $tmpwin <= 0){  //如果公司輸  取 輸最少的
                    $Maximum_n2_Number = $num;
                    $Maximum_n2 = $n2;
                    $Maximum_n2_tmpwin = $tmpwin;
                    $Maximum_n2_ordercoins = $ordercoins;
                }
                
                $Last_tmpwin = $tmpwin;
                $Last_ordercoins = $ordercoins;
                
            }
            echo "<br>======================================";
            //======================================================================================
            echo "<br>累積前彩池bonus13:".$bonus13;
            echo "<br>累積前彩池bonus14:".$bonus14;
            echo "<br>累積前彩池bonus15:".$bonus15;
            //==以下 累積彩池==========================================================================
//          for($q=0;$q<count($data);$q++){
//              $pvBouns = $data[$q][6] * $takePercentage;
//              if($gamedata[$i][1]==13)
//                  $bonus13 += $pvBouns;
//              else if($gamedata[$i][1]==14)
//                  $bonus14 += $pvBouns;
//              else if($gamedata[$i][1]==15)
//                  $bonus15 += $pvBouns;
//          }
            
            if($gamedata[$i][1]==13)
                $bonus13 += $ThisTimeBonus;
            else if($gamedata[$i][1]==14)
                $bonus14 += $ThisTimeBonus;
            else if($gamedata[$i][1]==15)
                $bonus15 += $ThisTimeBonus;
            
            //======================================================================================
            
            $DB_ordercoins = 0;
            $DB_DT = date ("Y- m - d / H : i : s");
            $DB_LT = $gamedata[$i][1];
            $DB_BC = $Last_ordercoins;
            $DB_SC = $Last_tmpwin;
            $DB_TB = $ThisTimeBonus;
            $DB_TC = $Commission;
            $DB_WT = 5;
            if($flag==0){
                if ($n2positive==false){ 
                    echo "<br>50組號碼 每一組都是輸的 找公司輸最少的號碼開";
                    echo "<br>送出 :". $Maximum_n2_tmpwin;
                    echo "<br>Maximum_n2:".$Maximum_n2;
                    $num = $Maximum_n2_Number;
                    
                    if($gamedata[$i][1]==13)
                        $bonus13 += $Maximum_n2; 
                    else if($gamedata[$i][1]==14)
                        $bonus14 += $Maximum_n2;
                    else if($gamedata[$i][1]==15)
                        $bonus15 += $Maximum_n2;
                    
                    $DB_ordercoins =$Maximum_n2_ordercoins;
                    $DB_SC = $Maximum_n2_tmpwin;
                    $DB_WT = 4;
                }else{
                    //這個彩種有沒有人中獎
                    echo "<br>沒有人中獎  | 累積到彩池 : ".$n2;
//                  if($gamedata[$i][1]==13)
//                      $bonus13 += $n2; 
//                  else if($gamedata[$i][1]==14)
//                      $bonus14 += $n2;
//                  else if($gamedata[$i][1]==15)
//                      $bonus15 += $n2;
//                  $DB_WT = 3;
//                  $DB_SC = 0;
                    echo "<br>沒有人中獎  | 累積到彩池 : ".$Minimum_n2;
                    $num = $Minimum_n2_Number;
                    if($gamedata[$i][1]==13)
                        $bonus13 += $Minimum_n2;
                    else if($gamedata[$i][1]==14)
                        $bonus14 += $Minimum_n2;
                    else if($gamedata[$i][1]==15)
                        $bonus15 += $Minimum_n2;
                    $DB_WT = 3;
                    $DB_SC = $Minimum_n2_tmpwin;
                }
            }else if($flag==1){
                //如果決定獎池開獎,但是因為獎池金額太少 導致於送出的金額反而比決定不要獎池開獎來的低
                //所以加入以下程式碼
                if($Minimum_n2_tmpwin>$OpenPool_tmpwin){
                    echo "<br>有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : ".$Minimum_n2;
                    echo "<br>送出 :". $Minimum_n2_tmpwin;
                    $num = $Minimum_n2_Number;
                    if($gamedata[$i][1]==13)
                        $bonus13 += $Minimum_n2;
                    else if($gamedata[$i][1]==14)
                        $bonus14 += $Minimum_n2;
                    else if($gamedata[$i][1]==15)
                        $bonus15 += $Minimum_n2;
                    $DB_WT = 2;
                    $DB_SC = $Minimum_n2_tmpwin;
                }
                else{
                    echo "<br>有人中獎 (彩池送出) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 :".$OpenPool_n2;
                    echo "<br>送出 :".$OpenPool_tmpwin;
                    //如果超過閥值 但是送出金額要小於 彩池金額
                    //把送出去的獎池 扣掉   (這邊送出去的 是之前慢慢從玩家押注抽成的 )
                    if($gamedata[$i][1]==13)
                        $bonus13 += $OpenPool_n2;
                    else if($gamedata[$i][1]==14)
                        $bonus14 += $OpenPool_n2;
                    else if($gamedata[$i][1]==15)
                        $bonus15 += $OpenPool_n2;
                    $num = $OpenPoolNumber;
                    $DB_WT = 1;
                    $DB_SC = $OpenPool_tmpwin;
                }
            }else if($flag==2){
                echo "<br>有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : ".$Minimum_n2;
                echo "<br>送出 :". $Minimum_n2_tmpwin;
                $num = $Minimum_n2_Number;
                if($gamedata[$i][1]==13)
                    $bonus13 += $Minimum_n2;
                else if($gamedata[$i][1]==14)
                    $bonus14 += $Minimum_n2;
                else if($gamedata[$i][1]==15)
                    $bonus15 += $Minimum_n2;
                $DB_WT = 2;
                $DB_SC = $Minimum_n2_tmpwin;
            }
            
            $end = $this->caclutime();
            $DB_B5 = $bonus13;
            $DB_B3 = $bonus14;
            $DB_B1 = $bonus15;
            
            $DB_C5 = $RedisCommission13;
            $DB_C3 = $RedisCommission14;
            $DB_C1 = $RedisCommission15;
            $DB_num = $num;
            $DB_Period =$gamedata[$i][2];
            $DB_PT = $end - $start;
            $DB_RT = $Run;
            //======================================================================================
            echo "<br>累積後彩池bonus13:".$bonus13;
            echo "<br>累積後彩池bonus14:".$bonus14;
            echo "<br>累積後彩池bonus15:".$bonus15;
            //======================================================================================
            echo "<br>中獎號碼:".$num;
            
            //=====================================蝯�=====================================
            if($isTest == false){
                
                echo '<br>真的結算1'.'http://'.$openURL.'/v/game-gameopx?g='.$casino[$gamedata[$i][1]][1].'&i='.$gamedata[$i][2].'&n='.$num;
                $ch = curl_init('http://'.$openURL.'/v/game-gameopx?g='.$casino[$gamedata[$i][1]][1].'&i='.$gamedata[$i][2].'&n='.$num);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                $result[] =curl_exec($ch);
                curl_close($ch);
                
                $gametype = $casino[$gamedata[$i][1]][1];
                $gameid = $casino[$gamedata[$i][1]][1];
                $gamename = $gamedata[$i][2];
                $gamenum = $num;
                $this->InsertNumber($gametype,$gameid,$gamename,$gamenum);
                
                
            
                
                $SQL = "INSERT INTO minutesLottoLog( DT,WT, LT, BC, SC, TB,TC, B5, B3, B1, C5, C3, C1, num, Period, PT, RT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);'";
                echo "<br>SQL:".$SQL;
                
                $ud = array();
                $ud[0] = $DB_DT;
                $ud[1] = $DB_WT;
                $ud[2] = $DB_LT;
                $ud[3] = $DB_BC;
                $ud[4] = $DB_SC;
                $ud[5] = $DB_TB;
                $ud[6] = $DB_TC;
                $ud[7] = $DB_B5;
                $ud[8] = $DB_B3;
                $ud[9] = $DB_B1;
                $ud[10] = $DB_C5;
                $ud[11] = $DB_C3;
                $ud[12] = $DB_C1;
                $ud[13] = $DB_num;
                $ud[14] = $DB_Period;
                $ud[15] = $DB_PT;
                $ud[16] = $DB_RT;
                $data = db_pUpdate($SQL,$ud );
                
                if($data==true){
                    echo "INSERT 成功";
                }
                else{
                    echo "INSERT 失敗".   $DB_DT." | ".$DB_WT." | ".$DB_LT." | ".$DB_BC." | ".$DB_SC." | ".
                                        $DB_TB." | ".$DB_TC." | ".$DB_B5." | ".$DB_B3." | ".$DB_B1." | ".
                                        $DB_C5." | ".$DB_C3." | ".$DB_C1." | ".$DB_num." | ".$DB_Period." | ".
                                        $DB_PT." | ".$DB_RT." | ";
                }
                
            }
            else 
                echo "<br>測試模是 不真的結算";
            //==========================================================================
            sleep(3);
        }
        
        $redis->set('Bonus:13:000',$bonus13);
        $redis->set('Bonus:14:000',$bonus14);
        $redis->set('Bonus:15:000',$bonus15);
        echo "<br>END<br>";
        return $this->toJson(array('a'=>$result));
    }
    
    function getOpenNum(){
        mt_srand((double)microtime()*1000000);
        $ary =array();
        for ($i = 0; $i < 5; $i++){
            $ary[]= mt_rand(0,9);
        }

        return join(',',$ary);
    }
    
    function InsertNumber($gametype,$gameid,$gamename,$gamenum){
        $db = getDBg_w();
        dbx_Update($db,"INSERT INTO game_data(gametype,gameid,gamename,gamenum,fromip) VALUES ('".$gametype."','".$gameid."','".$gamename."','".$gamenum."','MMS')",array());
    }
}
?>
