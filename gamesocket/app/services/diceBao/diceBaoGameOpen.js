const async = require('async');
const pomelo = require('pomelo');

module.exports = function diceBaoGameOpen()
{	
	this.gameopvn1 =function (dbmaster,dbslave,redis,gameID,gamebetdata,gameZone,callback) {
		const GameOpenSql = new (require(pomelo.app.getBase()+'/app/lib/lib_GameOpenFun.js'))(pomelo,pomelo.app,async,redis,dbslave,dbmaster,52,gameZone);
        const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
        var bonus111 = 0;
        var bonus222 = 0;
        var bonus333 = 0;
        var RedisCommission111 = 0;
        var RedisCommission222 = 0;
        var RedisCommission333 = 0;
        var RedisCommission = null;

        var DB_B111 = 0; //1區bonus
        var DB_C111 = 0; //1區佣金
        var DB_B222 = 0; //2區bonus
        var DB_C222 = 0; //2區佣金
        var DB_B333 = 0; //3區bonus
        var DB_C333 = 0; //3區佣金

        var CommissionPercentage = 0.15; //佣金百分比 [0.1 ~ 1]
        var takePercentage = 0.01; //獎池抽成百分比 (強制收入) [0 ~ 0.2]
        var OpenPoolPercentage = 50; //開獎池機率 越高越難中獎 [10 ~ 90]
        var OpenPoolBase = 3000; //獎池如果大於這個數字 一定開獎 [500 ~ ]
        var PoolThresholdMaxPercentage = 0.7; //送出金額要小於彩池金額的百分比[0 ~ 1]

        var ordercoins = 0; //總押分
        var Commission = 0; //佣金
        var ThisTimeBonus = 0 ;  //獎池累積
        var CanOpenPool = false;  //開獎池與否
        var OpenPoolR_L = 0; 
        var RedisBonus = 0;
        var flag = 0;

        var OpenPoolNumber = getOpenNum(); //開獎池號碼
        var OpenPool_np = 99999999;
        var OpenPool_tmpwin = 0;
        var OpenPool_ordercoins = 0;
        var Minimum_n2_Number = getOpenNum();
        var Minimum_n2 = 99999999;
        var Minimum_n2_tmpwin = 0;
        var Minimum_n2_ordercoins = 0;
        var Maximum_n2_Number = getOpenNum();
        var Maximum_n2 = -99999999;
        var Maximum_n2_tmpwin = 0;
        var Maximum_n2_ordercoins = 0;
        var n2positive = false;
        var bonusRate = 0;
            
        var Last_tmpwin = 0;
        var Last_ordercoins = 0;
        var n2 = 0; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)
        var num = 0;
        var start = new Date().getTime();

		//======================================================================================
		if(gamebetdata.length==0){
            console.log('沒有注單不需要算');
            callback({'ErrorCode':0,'ErrorMessage':'','gameNum': getOpenNum()});
        }else{
	        // 	CommissionPercentage = 0.15;   //佣金百分比
			// 	takePercentage = 0.01; //獎池抽成百分比 (收入)
			// 	OpenPoolPercentage = 50; //開獎池機率 (0~100) 越高越難中獎
			// 	OpenPoolBase = 3000;    //獎池越接近著個數字 就越容易開獎  如果大於這個數字 依定開獎
			// 	PoolThresholdMaxPercentage = 0.7;   //累積彩池多少後 要開放中獎  但是送出金額要小於 彩池金額的百分比 (最大獎池會吐多少百分比)
			async function getCommissionPercentage(){
				return GCP = await new Promise((resolve, reject) =>{
					redis.hget('GS:GAMESERVER:GAMECONTROL:052', "CommissionPercentage"+gameZone, function (err, res) {
			            if(err){
			                //DU_VIC:錯誤處理
			                resolve (0.15);
			            }else{
			                if(res==null){ //redis 無資料
			                	GameOpenSql.SelectGameControlConfig("CommissionPercentage","52",gameZone,function(data){
			                		if(data){
			                			resolve (data);
			                			redis.hset('GS:GAMESERVER:GAMECONTROL:052', "CommissionPercentage"+gameZone,data);
			                		}else{
			                			resolve (0.15);
			                		}
			                	});
			                }else{
			                    resolve (Number(res));
			                }
			            }
			        });
				});
			}

			async function getTakePercentage(){
				return GTP = await new Promise((resolve, reject) =>{
					redis.hget('GS:GAMESERVER:GAMECONTROL:052', "takePercentage"+gameZone, function (err, res) {
			            if(err){
			                //DU_VIC:錯誤處理
			                resolve (0.01);
			            }else{
			                if(res==null){ //redis 無資料
			                	GameOpenSql.SelectGameControlConfig("takePercentage","52",gameZone,function(data){
			                		if(data){
			                			resolve (data);
			                			redis.hset('GS:GAMESERVER:GAMECONTROL:052', "takePercentage"+gameZone,data);
			                		}else{
			                			resolve (0.01);
			                		}
			                	});
			                }else{
			                    resolve (Number(res));
			                }
			            }
			        });
				});
			}
			async function getOpenPoolPercentage(){
				return GOP = await new Promise((resolve, reject) =>{
					redis.hget('GS:GAMESERVER:GAMECONTROL:052', "OpenPoolPercentage"+gameZone, function (err, res) {
			            if(err){
			                //DU_VIC:錯誤處理
			                resolve (50);
			            }else{
			                if(res==null){ //redis 無資料
			                	GameOpenSql.SelectGameControlConfig("OpenPoolPercentage","52",gameZone,function(data){
			                		if(data){
			                			resolve (data);
			                			redis.hset('GS:GAMESERVER:GAMECONTROL:052', "OpenPoolPercentage"+gameZone,data);
			                		}else{
			                			resolve (50);
			                		}
			                	});
			                }else{
			                    resolve (Number(res));
			                }
			            }
			        });
				});
			}
			async function getOpenPoolBase(){
				return GOPB = await new Promise((resolve, reject) =>{
					redis.hget('GS:GAMESERVER:GAMECONTROL:052', "OpenPoolBase"+gameZone, function (err, res) {
			            if(err){
			                //DU_VIC:錯誤處理
			                resolve (3000);
			            }else{
			                if(res==null){ //redis 無資料
			                	GameOpenSql.SelectGameControlConfig("OpenPoolBase","52",gameZone,function(data){
			                		if(data){
			                			resolve (data);
			                			redis.hset('GS:GAMESERVER:GAMECONTROL:052', "OpenPoolBase"+gameZone,data);
			                		}else{
			                			resolve (3000);
			                		}
			                	});
			                }else{
			                    resolve (Number(res));
			                }
			            }
			        });
				});
			}
			async function getPoolThresholdMaxPercentage(){
				return GPTMP = await new Promise((resolve, reject) =>{
					redis.hget('GS:GAMESERVER:GAMECONTROL:052', "PoolThresholdMaxPercentage"+gameZone, function (err, res) {
			            if(err){
			                //DU_VIC:錯誤處理
			                resolve (0.7);
			            }else{
			                if(res==null){ //redis 無資料
			                	GameOpenSql.SelectGameControlConfig("PoolThresholdMaxPercentage","52",gameZone,function(data){
			                		if(data){
			                			resolve (data);
			                			redis.hset('GS:GAMESERVER:GAMECONTROL:052', "PoolThresholdMaxPercentage"+gameZone,data);
			                		}else{
			                			resolve (0.7);
			                		}
			                	});
			                }else{
			                    resolve (Number(res));
			                }
			            }
			        });
				});
			}
			async function getRedisBonus(){
				return GRB = await new Promise((resolve, reject) =>{
					redis.hgetall('GS:Bonus:052', function (err, res) {
		                if(err){
		                    bonus111 = 0;
		                    bonus222 = 0;
		                    bonus333 = 0;
		                    resolve (true);
		                }else{
		                    if(res!=null){
		                        bonus111 = Number(res.RedisBonus111);
		                        bonus222 = Number(res.RedisBonus222);
		                        bonus333 = Number(res.RedisBonus333);
		                        resolve (true);
		                    }
		                }
		            });
				});
			}
			async function getRedisCommission(){
				return GRC = await new Promise((resolve, reject) =>{
					redis.hgetall('GS:Commission:052', function (err, res) {
		                if(err){
		                    RedisCommission111 = 0;
		                    RedisCommission222 = 0;
		                    RedisCommission333 = 0;
		                    resolve (true);
		                }else{
		                    if(res!=null){
		                        RedisCommission111 = Number(res.RedisCommission111);
		                        RedisCommission222 = Number(res.RedisCommission222);
		                        RedisCommission333 = Number(res.RedisCommission333);
		                        resolve (true);
		                    }
		                }
		            });
				});
			}
			async function getParmProcess() {
				CommissionPercentage = await getCommissionPercentage(); 
				takePercentage = await getTakePercentage(); 
				OpenPoolPercentage = await getOpenPoolPercentage(); 
				OpenPoolBase = await getOpenPoolBase(); 
				PoolThresholdMaxPercentage = await getPoolThresholdMaxPercentage();
				res1 = await getRedisCommission();
				res2 = await getRedisBonus();
				return [CommissionPercentage,takePercentage,OpenPoolPercentage,OpenPoolBase,PoolThresholdMaxPercentage,res1,res2];
			}
			getParmProcess()
				.then(result =>{
					console.error(result);
				})
				.catch(err =>{
					console.error(err);
				});
			
			if(!(CommissionPercentage)||!(takePercentage)||!(OpenPoolPercentage)||!(OpenPoolBase)||!(PoolThresholdMaxPercentage)){
				CommissionPercentage = 0.15;
				takePercentage = 0.01;
				OpenPoolPercentage = 50;
				OpenPoolBase = 3000;
				PoolThresholdMaxPercentage = 0.7;
			}	
			//==========================================================================================
			ordercoins = gamebetdata.reduce(function(prev, element){
			   return prev + element['bet017'];
			}, 0); 
			ThisTimeBonus = (ordercoins*takePercentage);
	        Commission = (ordercoins * CommissionPercentage);

	        if(gameZone == 111){
	            RedisCommission111 += Commission;
	            redis.hset('GS:Commission:052', "RedisCommission111", RedisCommission111);
	        }
	        else if(gameZone==222){
	            RedisCommission222 += Commission;
	            redis.hset('GS:Commission:052', "RedisCommission222", RedisCommission222);
	        }
	        else if(gameZone==333){
	            RedisCommission333 += Commission;
	            redis.hset('GS:Commission:052', "RedisCommission333", RedisCommission333);
	        }

	        if(gameZone == 111)
	            RedisBonus = bonus111;
	        else if(gameZone==222)
	            RedisBonus = bonus222;
	        else if(gameZone==333)
	            RedisBonus = bonus333;
	        //20180628

			//======================================================================================
			CanOpenPool = false; //是否開獎池
			//======================================================================================
// 			//檢查如果採池大於 OpenPoolBase 兩倍 表示有異常  採池歸零
// 			if (RedisBonus > OpenPoolBase * 2){
// 				if(gamedata[i][1]==13)
// 					RedisBonus = 0;
// 				else if(gamedata[i][1]==14)
// 					RedisBonus = 0;
// 				else if(gamedata[i][1]==15)
// 					RedisBonus = 0;
// 			}
			//======================================================================================
			
			if(RedisBonus > 0 ){
				OpenPoolR_L= (RedisBonus / OpenPoolBase)*100;
				if( OpenPoolR_L > 100)
				{
					CanOpenPool = true;
				}
				else{
					var OpenPoolR = Math.floor(Math.random() * 100);
					//console.log("開獎池機率"+OpenPoolR);
					CanOpenPool = OpenPoolR > OpenPoolPercentage;
					//console.log(CanOpenPool?"是":"否");
				}
			}
			//==以下開10個號碼 看有沒有中獎 ==================================================================
			var Run = 10;
			var RunStep = 10;
			var RunMax = 30;

			for(let nn=0;nn<Run;nn++){
				num = getOpenNum();	
				combo = getOpenCombo(num,num[3]);
				var tmpwin = 0;   //總贏分 (玩家贏)
				var c = 0;
				var winbet = new Array();
				gamebetdata.forEach((e1)=>
				  combo[0].forEach((e2)=> {
					if(e1['bet014'] === e2){
						winbet[c] = e1;
						tmpwin+=gamePlaybet(e1,e2,combo[1],combo[2]);
						c++;
					}
				  }
				));
				
				n2 = ordercoins - tmpwin - ThisTimeBonus - Commission; //押分 - 贏分 - 彩池分數 - 佣金  = 可以被中獎的分數(如果都沒有人中 就累積彩池)

				if(tmpwin == 0)
					console.log ("Zero");
				else 
					console.log(n2+"A"+tmpwin+"B"+num+"C"+nn+"D");
				
				poolflag = false;
				if( CanOpenPool == true   && RedisBonus > 100){
					poolflag = true;
					
					if(tmpwin == 0){
						if(flag!=1 && nn == (Run - 1)){
							Run += RunStep;
							if(Run > RunMax){
								Run = RunMax;
							}
						}
						continue;
					}
					
					if(RedisBonus * PoolThresholdMaxPercentage  > (tmpwin)){
						if( tmpwin > OpenPool_tmpwin ){ //派送最大獎的號碼
							OpenPool_n2 = n2;
							OpenPoolNumber = num;
							OpenPool_tmpwin =tmpwin;
							OpenPool_ordercoins = ordercoins;
							flag=1;
						}
					}
				}
				
				//if(tmpwin == 0)
					//continue;
				
				if ( CanOpenPool == false   || ( poolflag == true && flag!=1) ){
					if( n2 >= 0 && tmpwin >= 0 ){ //這個號碼   公司會賺錢
						flag=2;
					}	
				}
				
				if( n2 >= 0 &&  n2 <= Minimum_n2 && tmpwin >= 0){ //公司賺最少的號碼
					Minimum_n2_Number = num;
					Minimum_n2 = n2;
					Minimum_n2_tmpwin = tmpwin;
					Minimum_n2_ordercoins = ordercoins;
					n2positive = true;
				}
		
				//if( n2 <= 0 && n2 >= Maximum_n2 && tmpwin <= 0){  //如果公司輸  取 輸最少的
				if(n2 >= Maximum_n2 ){  //如果公司輸  取 輸最少的
					Maximum_n2_Number = num;
					Maximum_n2 = n2;
					Maximum_n2_tmpwin = tmpwin;
					Maximum_n2_ordercoins = ordercoins;	
				}
				
				Last_tmpwin = tmpwin;
				Last_ordercoins = ordercoins;
				
			}
			//==以下 累積彩池==========================================================================
			if(gameZone == 111)
                bonus111 += ThisTimeBonus;
            else if(gameZone==222)
                bonus222 += ThisTimeBonus;
            else if(gameZone==333)
                bonus333 += ThisTimeBonus;
			
			//======================================================================================
			
			DB_ordercoins = 0;
			DB_DT = PUB.formatDate()+" "+PUB.formatDateTime();
			DB_LT = '52'
			DB_BC = Last_ordercoins;
			DB_SC = Last_tmpwin;
			DB_TB = ThisTimeBonus;
			DB_TC = Commission;
			DB_WT = 5;
			if(flag==0){
				if (n2positive==false){ 
					console.log( "10組號碼 每一組都是輸的 找公司輸最少的號碼開");
					console.log( "送出 :"+Maximum_n2_tmpwin);
					console.log( "Maximum_n2:"+Maximum_n2);
					num = Maximum_n2_Number;
					
					if(gameZone == 111)
                		bonus111  += Maximum_n2; 
					else if(gameZone==222)
                		bonus222 += Maximum_n2;
					else if(gameZone==333)
						bonus333 += Maximum_n2;
					
					DB_ordercoins =Maximum_n2_ordercoins;
					DB_SC = Maximum_n2_tmpwin;
					DB_WT = 4;
				}else{
					//這個彩種有沒有人中獎
					console.log( "沒有人中獎  | 累積到彩池 : "+n2);
// 					if(gamedata[i][1]==13)
// 						bonus13 += n2; 
// 					else if(gamedata[i][1]==14)
// 						bonus14 += n2;
// 					else if(gamedata[i][1]==15)
// 						bonus15 += n2;
// 					DB_WT = 3;
// 					DB_SC = 0;
					console.log( "沒有人中獎  | 累積到彩池 : ".Minimum_n2);
					num = Minimum_n2_Number;
					if(gameZone == 111)
                		bonus111  += Minimum_n2;
					else if(gameZone==222)
                		bonus222 += Minimum_n2;
					else if(gameZone==333)
						bonus333 += Minimum_n2;
					DB_WT = 3;
					DB_SC = Minimum_n2_tmpwin;
				}
			}else if(flag==1){
				//如果決定獎池開獎,但是因為獎池金額太少 導致於送出的金額反而比決定不要獎池開獎來的低
				//所以加入以下程式碼
				if(Minimum_n2_tmpwin>OpenPool_tmpwin){
					console.log( "有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : "+Minimum_n2);
					console.log( "送出 :"+Minimum_n2_tmpwin);
					num = Minimum_n2_Number;
					if(gameZone == 111)
                		bonus111  += Minimum_n2;
					else if(gameZone==222)
                		bonus222 += Minimum_n2;
					else if(gameZone==333)
						bonus333 += Minimum_n2;
					DB_WT = 2;
					DB_SC = Minimum_n2_tmpwin;
				}
				else{
					console.log( "有人中獎 (彩池送出) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 :"+OpenPool_n2);
					console.log( "送出 :"+OpenPool_tmpwin);
					//如果超過閥值 但是送出金額要小於 彩池金額
					//把送出去的獎池 扣掉   (這邊送出去的 是之前慢慢從玩家押注抽成的 )
					if(gameZone == 111)
                		bonus111  += OpenPool_n2;
					else if(gameZone==222)
                		bonus222 += OpenPool_n2;
					else if(gameZone==333)
						bonus333 += OpenPool_n2;
					num = OpenPoolNumber;
					DB_WT = 1;
					DB_SC = OpenPool_tmpwin;
				}
			}else if(flag==2){
				console.log( "有人中獎 (自然中獎) 挑選公司賺最少的號碼    扣除被玩家贏走的餘額_累積到彩池 : "+Minimum_n2);
				console.log( "送出 :"+ Minimum_n2_tmpwin);
				num = Minimum_n2_Number;
				if(gameZone == 111)
            		bonus111  += Minimum_n2;
				else if(gameZone==222)
            		bonus222 += Minimum_n2;
				else if(gameZone==333)
					bonus333 += Minimum_n2;
				DB_WT = 2;
				DB_SC = Minimum_n2_tmpwin;
			}
			
			var end = new Date().getTime();
			if(gameZone == 111){
                DB_B111 = bonus111;
                DB_C111 = RedisCommission111;
            }
            else if(gameZone==222){
                DB_B222 = bonus222;
                DB_C222 = RedisCommission222;
            }
            else if(gameZone==333){
                DB_B333 = bonus333;
                DB_C333 = RedisCommission333;
            }
			DB_B333 = bonus333;
			DB_B222 = bonus222;
			DB_B111 = bonus111;
			
			DB_C333 = RedisCommission333;
			DB_C222 = RedisCommission222;
			DB_C111 = RedisCommission111;
			num.pop();
			DB_num = num.join(',');
			DB_Period =gameID;
			DB_PT = (end - start)/1000;
			DB_RT = Run;
			//======================================================================================
			console.log( "累積後彩池bonus111:"+bonus111);
			console.log( "累積後彩池bonus222:"+bonus222);
			console.log( "累積後彩池bonus333:"+bonus333);
			//======================================================================================
			console.log( "中獎號碼:"+num);
			console.log( "彩池開否:"+CanOpenPool);
			//=====================================寫入LOG=====================================
			var struct_log = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
            var lib_gameoplog = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("game_open_logs",struct_log);
            struct_log.params.DT = DB_DT;
            struct_log.params.WT = DB_WT;
            struct_log.params.LT = DB_LT;
            struct_log.params.BC = DB_BC;
            struct_log.params.SC = DB_SC;
            struct_log.params.TB = DB_TB;
            struct_log.params.TC = DB_TC;
            struct_log.params.B110 = 0;
            struct_log.params.B105 = DB_B333;
            struct_log.params.B102 = DB_B222;
            struct_log.params.B101 = DB_B111;
            struct_log.params.C110 = 0;
            struct_log.params.C105 = DB_C333;
            struct_log.params.C102 = DB_C222;
            struct_log.params.C101 = DB_C111;
            struct_log.params.num = DB_num;
            struct_log.params.Period = gameID;
            struct_log.params.PT = DB_PT;
            lib_gameoplog.Insert(function(res){
                if(res){
                    console.log( "INSERT 成功");
                }else{
                    console.log('寫入資料庫失敗');
                }
            });
				
			//==========================================================================
			
            redis.hset('GS:Bonus:052', "RedisBonus111", bonus111);
            redis.hset('GS:Bonus:052', "RedisBonus222", bonus222);
            redis.hset('GS:Bonus:052', "RedisBonus333", bonus333);
			console.log( "END");
			callback({'ErrorCode':0,'ErrorMessage':'','gameNum':num,});
        }

	}
	function getOpenNum(){
	   var gameNum = [];
		/*gameNum[0] = 1;
		gameNum[1] = 3;
		gameNum[2] = 5;*/
		gameNum[0] = Math.floor((Math.random() * 6) + 1);
		gameNum[1] = Math.floor((Math.random() * 6) + 1);
		gameNum[2] = Math.floor((Math.random() * 6) + 1);
		gameNum.sort(function (a, b) {
			return a - b ;
		});
		gameNum[3] = gameNum.reduce((a,b)=>a+b)
	    return gameNum;
	}
	function gamePlaybet(gdata,num,threeSameCount,twoSameCount){
	    var betValue = gdata.bet017;
        var multiple = 0;
        switch(num)
        {
            case '8001':
			case '8002':
			case '8003':
			case '8004':
			case '8005':
			case '8006':
                multiple=180;
                break;
            case '8007':
                multiple=31;
                break;
            case '8008':
			case '8009':
			case '8010':
			case '8011':
			case '8012':
			case '8013':
                multiple=11;
                break;
            case '8014':
            case '8027':
                multiple=62;
                break;
            case '8015':
            case '8026':
                multiple=31;
                break;
            case '8016':
            case '8025':
                multiple=18;
                break;
            case '8017':
            case '8024':
                multiple=12;
                break;
            case '8018':
            case '8023':
                multiple=8;
                break;
            case '8019':
            case '8022':
                multiple=7;
                break;
            case '8020':
            case '8021':
                multiple=6;
                break;
            case '8028':
			case '8029':
			case '8030':
			case '8031':
			case '8032':
			case '8033':
			case '8034':
			case '8035':
			case '8036':
			case '8037':
			case '8038':
			case '8039':
			case '8040':
			case '8041':
			case '8042':
				multiple=6;
                break;
            case '8043':
            	if(threeSameCount==1)
					multiple = 3;
				else if(twoSameCount==1)
					multiple = 2;
				else
					multiple = 1;
                break;
			case '8044':
				if(threeSameCount==2)
					multiple = 3;
				else if(twoSameCount==2)
					multiple = 2;
				else
					multiple = 1;
                break;
			case '8045':
				if(threeSameCount==3)
					multiple = 3;
				else if(twoSameCount==3)
					multiple = 2;
				else
					multiple = 1;
		        break;
			case '8046':
				if(threeSameCount==4)
					multiple = 3;
				else if(twoSameCount==4)
					multiple = 2;
				else
					multiple = 1;	
                break;
			case '8047':
				if(threeSameCount==5)
					multiple = 3;
				else if(twoSameCount==5)
					multiple = 2;
				else
					multiple = 1;	
                break;
			case '8048':
				if(threeSameCount==6)
					multiple = 3;
				else if(twoSameCount==6)
					multiple = 2;
				else
					multiple = 1;	
                break;
            case '8049':
			case '8050':
			case '8051':
			case '8052':
				multiple=1;
                break;
        }
        return Number(betValue)* multiple * Number(gdata.bet016);
	}

	function getOpenCombo(gameNum,numSum)
	{
		var gameNumCombo = new Array();
		let threeSameCount = 0;
		let twoSameCount = 0;
		var c=0;
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==1)){
		    gameNumCombo[c]='8001';
		    threeSameCount = 1;
		    c++;
	  	}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==2)){
		    gameNumCombo[c]='8002';
		    threeSameCount = 2;
		    c++;
		}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==3)){
		    gameNumCombo[c]='8003';
		    threeSameCount = 3;
		    c++;
		}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==4)){
		    gameNumCombo[c]='8004';
		    threeSameCount = 4;
		    c++;
		}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==5)){
		    gameNumCombo[c]='8005';
		    threeSameCount = 5;
		    c++;
		}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])&&(gameNum[0]==6)){
		    gameNumCombo[c]='8006';
		    threeSameCount = 6;
		    c++;
		}
		if((gameNum[0]==gameNum[1])&&(gameNum[1]==gameNum[2])&&(gameNum[2]==gameNum[0])){
		    gameNumCombo[c]='8007';
		    c++;
		}
		if((gameNum[0]==1 && gameNum[1]==1) || (gameNum[1]==1 && gameNum[2]==1)){
		    gameNumCombo[c]='8008';
		    twoSameCount = 1;
		    c++;
		}
		if((gameNum[0]==2 && gameNum[1]==2) || (gameNum[1]==2 && gameNum[2]==2)){
		    gameNumCombo[c]='8009';
		    twoSameCount = 2;
		    c++;
		}
		if((gameNum[0]==3 && gameNum[1]==3) || (gameNum[1]==3 && gameNum[2]==3)){
		    gameNumCombo[c]='8010';
		    twoSameCount = 3;
		    c++;
		}
		if((gameNum[0]==4 && gameNum[1]==4) || (gameNum[1]==4 && gameNum[2]==4)){
		    gameNumCombo[c]='8011';
		    twoSameCount = 4;
		    c++;
		}
		if((gameNum[0]==5 && gameNum[1]==5) || (gameNum[1]==5 && gameNum[2]==5)){
		    gameNumCombo[c]='8012';
		    twoSameCount = 5;
		    c++;
		}
		if((gameNum[0]==6 && gameNum[1]==6) || (gameNum[1]==6 && gameNum[2]==6)){
		    gameNumCombo[c]='8013';
		    twoSameCount = 6;
		    c++;
		}
		if(numSum==4){
		    gameNumCombo[c]='8014';
		    c++;
		}
		if(numSum==5){
		    gameNumCombo[c]='8015';
		    c++;
		}
		if(numSum==6){
		    gameNumCombo[c]='8016';
		    c++;
		}
		if(numSum==7){
		    gameNumCombo[c]='8017';
		    c++;
		}
		if(numSum==8){
		    gameNumCombo[c]='8018';
		    c++;
		}
		if(numSum==9){
		    gameNumCombo[c]='8019';
		    c++;
		}
		if(numSum==10){
		    gameNumCombo[c]='8020';
		    c++;
		}
		if(numSum==11){
		    gameNumCombo[c]='8021';
		    c++;
		}
		if(numSum==12){
		    gameNumCombo[c]='8022';
		    c++;
		}
		if(numSum==13){
		    gameNumCombo[c]='8023';
		    c++;
		}
		if(numSum==14){
		    gameNumCombo[c]='8024';
		    c++;
		}
		if(numSum==15){
		    gameNumCombo[c]='8025';
		    c++;
		}
		if(numSum==16){
		    gameNumCombo[c]='8026';
		    c++;
		}
		if(numSum==17){
		    gameNumCombo[c]='8027';
		    c++;
		}
		if((gameNum[0]==1&&gameNum[1]==2)||(gameNum[1]==1&&gameNum[2]==2)||(gameNum[0]==1&&gameNum[2]==2)){
		    gameNumCombo[c]='8028';
		    c++;
		}
		if((gameNum[0]==1&&gameNum[1]==3)||(gameNum[1]==1&&gameNum[2]==3)||(gameNum[0]==1&&gameNum[2]==3)){
		    gameNumCombo[c]='8029';
		    c++;
		}
		if((gameNum[0]==1&&gameNum[1]==4)||(gameNum[1]==1&&gameNum[2]==4)||(gameNum[0]==1&&gameNum[2]==4)){
		    gameNumCombo[c]='8030';
		    c++;
		}
		if((gameNum[0]==1&&gameNum[1]==5)||(gameNum[1]==1&&gameNum[2]==5)||(gameNum[0]==1&&gameNum[2]==5)){
		    gameNumCombo[c]='8031';
		    c++;
		}
		if((gameNum[0]==1&&gameNum[1]==6)||(gameNum[1]==1&&gameNum[2]==6)||(gameNum[0]==1&&gameNum[2]==6)){
		    gameNumCombo[c]='8032';
		    c++;
		}
		if((gameNum[0]==2&&gameNum[1]==3)||(gameNum[1]==2&&gameNum[2]==3)||(gameNum[0]==2&&gameNum[2]==3)){
		    gameNumCombo[c]='8033';
		    c++;
		}
		if((gameNum[0]==2&&gameNum[1]==4)||(gameNum[1]==2&&gameNum[2]==4)||(gameNum[0]==2&&gameNum[2]==4)){
		    gameNumCombo[c]='8034';
		    c++;
		}
		if((gameNum[0]==2&&gameNum[1]==5)||(gameNum[1]==2&&gameNum[2]==5)||(gameNum[0]==2&&gameNum[2]==5)){
		    gameNumCombo[c]='8035';
		    c++;
		}
		if((gameNum[0]==2&&gameNum[1]==6)||(gameNum[1]==2&&gameNum[2]==6)||(gameNum[0]==2&&gameNum[2]==6)){
		    gameNumCombo[c]='8036';
		    c++;
		}
		if((gameNum[0]==3&&gameNum[1]==4)||(gameNum[1]==3&&gameNum[2]==4)||(gameNum[0]==3&&gameNum[2]==4)){
		    gameNumCombo[c]='8037';
		    c++;
		}
		if((gameNum[0]==3&&gameNum[1]==5)||(gameNum[1]==3&&gameNum[2]==5)||(gameNum[0]==3&&gameNum[2]==5)){
		    gameNumCombo[c]='8038';
		    c++;
		}
		if((gameNum[0]==3&&gameNum[1]==6)||(gameNum[1]==3&&gameNum[2]==6)||(gameNum[0]==3&&gameNum[2]==6)){
		    gameNumCombo[c]='8039';
		    c++;
		}
		if((gameNum[0]==4&&gameNum[1]==5)||(gameNum[1]==4&&gameNum[2]==5)||(gameNum[0]==4&&gameNum[2]==5)){
		    gameNumCombo[c]='8040';
		    c++;
		}
		if((gameNum[0]==4&&gameNum[1]==6)||(gameNum[1]==4&&gameNum[2]==6)||(gameNum[0]==4&&gameNum[2]==6)){
		    gameNumCombo[c]='8041';
		    c++;
		}
		if((gameNum[0]==5&&gameNum[1]==6)||(gameNum[1]==5&&gameNum[2]==6)||(gameNum[0]==5&&gameNum[2]==6)){
		    gameNumCombo[c]='8042';
		    c++;
		}
		if(gameNum[0]==1 || gameNum[1]==1 || gameNum[2]==1){
		    gameNumCombo[c]='8043';
		    c++;
		}
		if(gameNum[0]==2 || gameNum[1]==2 || gameNum[2]==2){
		    gameNumCombo[c]='8044';
		    c++;
		}
		if(gameNum[0]==3 || gameNum[1]==3 || gameNum[2]==3){
		    gameNumCombo[c]='8045';
		    c++;
		}
		if(gameNum[0]==4 || gameNum[1]==4 || gameNum[2]==4){
		    gameNumCombo[c]='8046';
		    c++;
		}
		if(gameNum[0]==5 || gameNum[1]==5 || gameNum[2]==5){
		    gameNumCombo[c]='8047';
		    c++;
		}
		if(gameNum[0]==6 || gameNum[1]==6 || gameNum[2]==6){
		    gameNumCombo[c]='8048';
		    c++;
		}
		if(gameNum[3]==2){
		    gameNumCombo[c]='8049';
		    c++;
		}
		if(gameNum[3]==1){
		    gameNumCombo[c]='8050';
		    c++;
		}
		if(gameNum[4]==1 && gameNum[3]!=0){
		    gameNumCombo[c]='8051';
		    c++;
		}
		if(gameNum[4]==0 && gameNum[3]!=0){
		    gameNumCombo[c]='8052';
		    c++;
		}
		return [gameNumCombo,threeSameCount,twoSameCount];
	}
}