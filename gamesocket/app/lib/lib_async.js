
module.exports = function lib_amount(struct_amountlog)
{
	var async = require('async');
	this.example_waterfall = function()
	{
		async.waterfall([
			function(cb) {
				cb(null,'a');
			},
			function(param,cb) {
				console.error(param);
				cb(null,param+'b');
			},
			function(param,cb) {
				console.error(param);
				cb(null,param+'cxxx');
			}
		],
		function(err,resDao) {
			console.error(err);
			console.error(resDao);
		});
	}

	this.example_series = function()
	{
		async.series({
			A: function(callback_A){
				callback_A(null,0)
			},
			B: function(callback_B){
				callback_B(null,0)
			}
		},
		function(err, results) { 
		
		});
	}
	
}