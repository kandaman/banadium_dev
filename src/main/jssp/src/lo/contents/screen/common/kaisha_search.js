Constant.load("lo/common_libs/lo_const");
var $production_flg = false; //ライセンシープロダクションフラグ
var $radio_mode = false; // 選択方式
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION);
	
	if (request.mode == "radio") {
		$radio_mode = true;
	}
}

/**
 * ライセンシー 検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKaishaList(param) {
	
	Logger.getLogger().info(' [searchKaishaList]　ライセンシー 選択一覧検索');

	var locale_id = 'ja';
	
	var sql = "" ;
	sql += " SELECT ";
	sql += "     MIN(d.company_cd) as kaisha_cd ";
	sql += "    ,d.department_name as kaisha_nm ";
	sql += " FROM imm_department d ";
	sql += " INNER JOIN imm_company c ";
	sql += "   ON d.company_cd = c.company_cd ";
	sql += "   AND d.department_cd = c.company_cd ";
	sql += " WHERE d.delete_flag = '0' ";
	sql += "   AND d.locale_id = '"+locale_id+"' ";
	sql += "   AND d.start_date <= CURRENT_DATE ";
	sql += "   AND d.end_date > CURRENT_DATE ";
  
	// 入力パラメータ
    var strParam=[];
    var columnNameMap = {};
    
    if(param.search_cls =="1"){
    	// 部分一致
	    columnNameMap["kaisha_nm"] = {col:"d.department_name",comp:"eq"};    
	    columnNameMap["kaisha_nm_kana"] = {col:"d.department_search_name",comp:"eq"};
    }else{
    	// 部分一致
        columnNameMap["kaisha_nm"] = {col:"d.department_name",comp:"like"};    
        columnNameMap["kaisha_nm_kana"] = {col:"d.department_search_name",comp:"like"};
        	
    }    
    
    param.kaisha_nm_kana = param.kaisha_nm;
    
    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereConditionOr", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

	sql+= " GROUP BY d.department_name ";
    sql+= " ORDER BY MIN(d.company_cd) ";

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索 SQL ' + sql);
    var result = db.select(sql,strParam, 0);

    return result;
}
