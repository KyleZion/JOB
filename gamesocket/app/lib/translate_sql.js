
module.exports = function struct_sql(tablename,struct_sql_param)
{
	var array_keys = new Array();
	var array_values = new Array();
	var array_values2 = new Array();

	this.make1 = function()
	{
		if(array_keys.length==0){
			for (var key in struct_sql_param.params) {
				if(struct_sql_param.params[key]==null)
					continue;
			    array_keys.push(key);
			    array_values.push(struct_sql_param.params[key]);
			    array_values2.push('?');
			}
		}
		this.make2();
	}

	var array_keys_where = new Array();
	var array_values_where = new Array();
	this.make2 = function()
	{
		if(array_keys_where.length==0){
			for (var key in struct_sql_param.where) {
				if(struct_sql_param.where[key]==null)
					continue;
			    array_keys_where.push(key);
			    array_values_where.push(struct_sql_param.where[key]);
			}
		}
		this.make3();
	}

	var array_keys_select = new Array();
	this.make3 = function()
	{
		if(array_keys_select.length==0){
			for (var key in struct_sql_param.select) {
				if(struct_sql_param.select[key]==null)
					continue;
			    array_keys_select.push(key);
			}
		}
	}

	this.GetValues = function()
	{
		this.make1();
		return array_values;
	}

	this.GetInsertSQL = function()
	{
		this.make1();
		var sql ="INSERT INTO "+tablename+" (";
		sql += array_keys.toString();
		sql += ") VALUES ( ";
		sql += array_values2.toString();
		sql += " )";
		return sql;
	}

	this.GetUpdateSQL = function()
	{
		this.make1();
		var sql ="UPDATE "+tablename+" SET ";
		for (var i = 0; i < array_keys.length; i++) {
			sql += array_keys[i] + " = ? , ";
		}
		sql = sql.substring(0, sql.length -2);
		sql += "WHERE "
		for (var i = 0; i < array_keys_where.length; i++) {
			sql += array_keys_where[i] + " = " + array_values_where[i] + " and ";
		}
		sql = sql.substring(0, sql.length -4);
		return sql;
	}

	this.GetUpdateSQL2 = function()
	{
		this.make1();
		var sql ="UPDATE "+tablename+" SET ";
		for (var i = 0; i < array_keys.length; i++) {
			sql += array_keys[i] + " = "+array_values[i]+" , ";
		}
		sql = sql.substring(0, sql.length -2);
		sql += "WHERE "
		for (var i = 0; i < array_keys_where.length; i++) {
			sql += array_keys_where[i] + " = " + array_values_where[i] + " and ";
		}
		sql = sql.substring(0, sql.length -4);
		return sql;
	}

	this.GetSelectSQL = function()
	{
		this.make1();
		if( array_keys_select.length>0)
		{
			var sql ="SELECT ";
			sql += array_keys_select.toString();
			sql += " FROM "+tablename+" WHERE "
			if( array_keys_where.length>0)
			{
				for (var i = 0; i < array_keys_where.length; i++) {
					sql += array_keys_where[i] + " = " + array_values_where[i] + " and ";
				}
				sql = sql.substring(0, sql.length -4);
			}
			return sql;
		}
		else
		{
			return "";
		}
	}

	this.GetDeleteSQL = function()
	{
		this.make1();
		if( array_keys_where.length>0)
		{
			var sql ="delete ";
			sql += " FROM "+tablename+" WHERE "
			if( array_keys_where.length>0)
			{
				for (var i = 0; i < array_keys_where.length; i++) {
					sql += array_keys_where[i] + " = " + array_values_where[i] + " and ";
				}
				sql = sql.substring(0, sql.length -4);
			}
			return sql;
		}
		else
		{
			return "";
		}
	}


}