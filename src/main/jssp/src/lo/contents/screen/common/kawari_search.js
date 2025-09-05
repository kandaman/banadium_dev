Constant.load("lo/common_libs/lo_const");
var $licensee_flg = false; //ライセンシーフラグ
var $radio_mode = false; // 選択方式
var $form = {
	restraint_values : ""
};
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ライセンスプロダクションか判断
	$licensee_flg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);

	getSelectableValue(request);

	if (request.mode == "radio") {
		$radio_mode = true;
	}
}

function getSelectableValue(request) {

	var restraint_values = {};
    if (request.restraint_values && ImJson.checkJSONString(request.restraint_values)) {
		restraint_values = ImJson.parseJSON(request.restraint_values);
		$form.restraint_values = request.restraint_values;
	}

	var statusList = [];
	statusList = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "getSelectList"
		, statusList
		, Constant.LO_CDCLS_KAWARI_STATUS
	);

    if ('kawari_status' in restraint_values) {
		statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "filterValueList", statusList, restraint_values.kawari_status);
	}

	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "mergeLabelList", statusList, ",");
    statusList.unshift({label:"",value:"",selected:true});
    
    // 検索で対象外にしているものはリストから外しておく
    for(var i=0; i<statusList.length; i++) {
    	Logger.getLogger().info(statusList[i].value);
    	if([Constant.LO_STATUS_ICHIJI_HOZON, Constant.LO_STATUS_JITAI, Constant.LO_STATUS_HIKETSU].indexOf(statusList[i].value) > -1) {
    		statusList.splice(i, 1);
    		i--;
    	}
    }

	$form.kawari_status_list = statusList;

}

/**
 * 代わり承認申請選択一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKawariList(param) {
	
	Logger.getLogger().info('[searchKawariList]　代わり承認申請選択一覧検索');
	
	var licFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);
	
	if (ImJson.checkJSONString(param.restraint_values)) {
		var restraint_values = ImJson.parseJSON(param.restraint_values);
		Logger.getLogger().info('[searchKawariList]　restraint_values ' + ImJson.toJSONString(restraint_values, true));
	    for(var key in restraint_values) {
	    	var restraint_value = restraint_values[key];
	    	param["restraint_" + key] = restraint_value;
	    }
	}

	var sql = "" ;
	sql += " SELECT ";
	sql += "    kw.bunsho_id ";
	sql += "  , kw.bunsho_nm ";
	sql += "  , kw.kawari_status " ; 
	sql += "  , ko01.cd_naiyo AS kawari_status_nm ";
	sql += "  , kw.bunsho_cls ";
	sql += "  , ko02.cd_naiyo AS bunsho_cls_nm ";
	sql += "  , kw.kyodaku_cls ";
	sql += "  , ko03.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , kw.ip_cd ";
	sql += "  , kw.ip_nm ";
	sql += "  , kw.title_cd ";
	sql += "  , kw.title_nm ";
	sql += "  , kw.kaisha_id " ;
	sql += "  , CASE WHEN kw.bunsho_cls = '" + Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL + "' ";
	sql += "         THEN ko04.cd_naiyo ELSE kw.kaisha_nm END AS kaisha_nm ";
	sql += "  , kw.kian_sha_nm AS bne_tantou_sha ";
	sql += " FROM ";
	sql += "  lo_t_kawari AS kw ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KAWARI_STATUS + "' ";
	sql += "    AND ko01.cd_id = kw.kawari_status ";
	sql += "    AND ko01.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KAWARI_DOC_TYPE + "' ";
	sql += "    AND ko02.cd_id = kw.bunsho_cls ";
	sql += "    AND ko02.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko03.cd_id = kw.kyodaku_cls ";
	sql += "    AND ko03.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND ko04.cd_id = kw.kaigai_hansha_cd ";
	sql += "    AND ko04.sakujo_flg = '0') ";
	sql += " WHERE " ; 
	sql += "  kw.sakujo_flg ='0' ";
	sql += "  AND kw.bunsho_cls <> '" + Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL + "'";
	sql += "  AND kw.kawari_status NOT IN ";
	sql += " ('" + Constant.LO_STATUS_ICHIJI_HOZON + "'";
	sql += " , '" + Constant.LO_STATUS_JITAI + "'";
	sql += " , '" + Constant.LO_STATUS_HIKETSU + "'";
	sql += " ) ";

	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    columnNameMap["bunsho_id"] = {col:"kw.bunsho_id",comp:"like"};
    columnNameMap["kaisha_nm"] = {col:"kw.kaisha_nm",comp:"like"};
    columnNameMap["kawari_status"] = {col:"kw.kawari_status",comp:"in"};
	columnNameMap["restraint_kawari_status"] = {col:"kw.kawari_status",comp:"in"}
	columnNameMap["restraint_kaisha_id"] = {col:"kw.kaisha_id",comp:"eq"}
	// 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

	sql+= " ORDER BY kw.bunsho_cls ";
	sql+= "  , kw.bunsho_id ";
	
	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKyodakuList]　代わり承認申請選択一覧検索 SQL ' + sql);
	var result = db.select(sql,strParam, 0);

	var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KAWARI);
	result.data = obj;
	return result;
}
