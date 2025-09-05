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
	sql += "     d.kaisha_id as kaisha_cd";
	sql += "    ,d.kaisha_name as kaisha_nm";
	sql += " FROM lo_m_kaigai_kaisha d ";	
	sql += " WHERE d.sakujo_flg = '0' ";	
  
	// 入力パラメータ
    var strParam=[];
    var columnNameMap = {};
        
    if(param.search_cls =="1"){
    	// 完全一致
	    columnNameMap["kaisha_nm"] = {col:"d.kaisha_name",comp:"eq"};    
    }else{
    	// 部分一致
        columnNameMap["kaisha_nm"] = {col:"d.kaisha_name",comp:"like"};
        
    }  
    
    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

    sql+= " ORDER BY d.kaisha_id ";

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索 SQL ' + sql);
    var result = db.select(sql,strParam, 0);

    return result;
}
