'use strict';

module.exports = {
    OK: 0, // 成功
    PARAM_ERROR: 600, // 参数错误
    SQL_ERROR: 500, 
    REDIS_ERROR: 501,
	ERR_LOCKACCOUNT 	: -1, //帳戶鎖定
	ERR_CHANNEL			: -2, //區號ID錯誤
	NOT_ENOUGH_MONEY	: -3, //遊戲餘額不足
	ERR_ALREADY_BET		: -4, //已下注
	ERR_GAME_STATUS		: -5, //已關盤或不可下注
	ERR_OVER_BET_LIMIT	: -6, //超過下注限制
	ERR_PERIODID		: -7, //期數ID錯誤
};