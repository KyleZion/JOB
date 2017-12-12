module.exports = function Public_FUN()
{
    this.formatDate = function () { //年月日格式化
        var d = new Date(),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = ''+d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    this.formatDateTime = function() { //時間格式化
        var d = new Date(),
            h = ''+d.getHours(),
            m = ''+d.getMinutes(),
            s = ''+d.getSeconds();

        if (h.length < 2) h = '0' + h;
        if (m.length < 2) m = '0' + m;
        if (s.length < 2) s = '0' + s;

        return [h, m, s].join(':');
    }

    this.getSn =function (num){ //唯一單號亂數
    sn = new Array();
    for(var i=0;i<num;i++)
        {
        sn[i]=Math.floor(Math.random() *10)
        }
    return sn.join("");
    }

    this.getOddsbyChannel =function (channelID) { //判斷channelID回傳賠率
    var odds = 0;
    switch(channelID){
        case 101:
            odds = 1;
            break;
        case 102:
            odds = 2;
            break;
        case 105:
            odds = 5;
            break;
        case 110:
            odds = 10;
            break;
    }
    return odds;
    }
}