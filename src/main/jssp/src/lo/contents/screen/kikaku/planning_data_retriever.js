/**
 * 添付ファイル情報取得
 * @param {string} kikakuId 企画ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveTempuFileList(kikakuId) {
	Logger.getLogger().info(' [retrieveTempuFileList]　添付ファイル情報検索');
	
    var sql = ""; 
	sql = sql + "SELECT ";
	sql = sql + "  tf.kikaku_id ";
	sql = sql + "  , tf.file_no ";
	sql = sql + "  , tf.file_name ";
	sql = sql + "  , tf.file_path ";
	sql = sql + "FROM ";
	sql = sql + "  lo_t_kikaku_tempu_file AS tf ";
	sql = sql + "WHERE ";
	sql = sql + "  tf.sakujo_flg = '0' ";
	sql = sql + "  AND tf.kikaku_id = ? ";
	sql = sql + "ORDER BY ";
	sql = sql + "  tf.file_no ";

    var params = [];
    params.push(DbParameter.string(kikakuId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveTempuFileList]　添付ファイル情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 企画トラン取得
 * @param {string} 企画ID
 * @return {object} 該当の企画トラン1行
 */
function getKikakuData(kikakuId) {
	
	var sql = "";
	sql += " SELECT " ;
	sql += "  k.* ";
	sql += " FROM lo_t_kikaku as k "; 
	sql += " WHERE k.sakujo_flg ='0' ";
	sql += "   AND k.kikaku_id =? ";
	
	var params = [];
    params.push(DbParameter.string(kikakuId));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql, params, 1);
    
    if(result.data[0]) {
    	return result.data[0];
    } else {
    	return null;
    }
}

/**
 * 企画ステータス検索
 * @param {string} 企画ID
 * @returns {string} 企画ステータス
 */
function getKikakuStatus(kikakuId) {
	
	var sql = "" ;
	sql += " SELECT " ;
	sql += "  k.kikaku_status " ;
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 
	
	// 検索値をセット
	var params=[];
	params.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,params);
    
    if(result.data[0].kikaku_status) {
    	return result.data[0].kikaku_status;
    } else {
    	return "";
    }
}

/**
 * 更新日取得
 * @param {string} 企画ID
 * @return {string} 更新日(YYYYMMDDHH24MISSMS形式)
 */
function getKoushinBi(kikakuId) {
	
	var sql = "";
	sql += " SELECT " ;
	sql += "  to_char(k.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";
	sql += " FROM lo_t_kikaku as k "; 
	sql += " WHERE k.sakujo_flg ='0' ";
	sql += "   AND k.kikaku_id =? ";
	
	var params = [];
    params.push(DbParameter.string(kikakuId));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql, params, 1);
    
    if(result.data[0].koushin_bi) {
    	return result.data[0].koushin_bi;
    } else {
    	return "";
    }
}