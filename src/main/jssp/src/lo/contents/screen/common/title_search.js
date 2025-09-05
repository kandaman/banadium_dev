Constant.load("lo/common_libs/lo_const");
var $radio_mode = false; // 選択方式
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	if (request.mode == "radio") {
		$radio_mode = true;
	}
}

/**
 * タイトル検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchTitleList(param) {
	
	Logger.getLogger().info(' [searchTitleList]　タイトル選択一覧検索');

	var sql = "" ;
	sql += "SELECT ";
	sql += "  ti.ip_cd ";
	sql += " ,ti.ip_nm ";
	sql += " ,ti.title_cd ";
	sql += " ,ti.title_nm ";
	sql += " ,ti.sort_no ";
	sql += " ,1 AS data_order ";
	sql += "FROM ";
	sql += "  lo_v_title AS ti ";
	sql += "WHERE " ; 
	sql += "  1 = 1 ";

	// 入力パラメータ
	var strParam=[];

    // 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    columnNameMap["ip_nm"] = {col:"ti.ip_nm",comp:"like"};
    columnNameMap["title_nm"] = {col:"ti.kensaku_word",comp:"like"};

    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

    // THATS_RIGHTS-1615 タイトル検索結果から「その他」を抑止※今後要望があれば復活できるようコメントアウト
    //sql += " UNION SELECT '___' AS ip_cd, 'その他' AS ip_nm, '" + Constant.LO_TITLE_CD_OTHER + "' AS title_cd, 'その他' AS title_nm, 9999 AS sort_no, 2 AS data_order "

    sql+= " ORDER BY sort_no ASC";
    
    //Debug.console(sql);

    // sql実行
    var db = new TenantDatabase();
    Logger.getLogger().info(' [searchTitleList]　タイトル選択一覧検索 SQL ' + sql);
    var result = db.select(sql,strParam, 0);

    return result;

}
