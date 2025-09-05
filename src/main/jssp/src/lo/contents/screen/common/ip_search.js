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
 * IP 検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchIpList(param) {
	
	Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索');

	var sql = "";
	sql += "select mip.ip_cd, mip.ip_nm ";
	sql += "from lo_m_ip mip ";
	sql += "where mip.sakujo_flg = '0'";

	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    columnNameMap["ip_nm"] = {col:"mip.ip_nm",comp:"like"};
    
    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

	sql+= " order by mip.sort_no ";

	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索 SQL ' + sql);
	var result = db.select(sql,strParam, 0);

	return result;
}
