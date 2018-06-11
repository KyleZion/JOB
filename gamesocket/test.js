function sleep(para) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(para * para)
        }, 1000)
    })
}




var result =  sleep(2)
console.log(result);
var result1 = await sleep(2);
console.log(result1);
var result2 = await sleep(result1);
console.log(result2);
var result3 = await sleep(result2);
console.log(result3);

