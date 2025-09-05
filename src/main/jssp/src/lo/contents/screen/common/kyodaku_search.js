Constant.load("lo/common_libs/lo_const");
var $bne_flg = "0"; //ライセンシーフラグ
var $licensee_flg = "0"; //ライセンシーフラグ
var $moto_flg = "0"; // 元許諾検索フラグ
var $radio_mode = false; // 選択方式
var $form = {
	restraint_values : ""
};
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	
	// パブリックグループ判断
	$bne_flg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_BNE) == true ? "1" : "0");
	$licensee_flg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE) == true ? "1" : "0");
	if (request.moto_flg == "1") {
		$moto_flg = "1";
	} else {
		$moto_flg = "0";
	}

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
		, $licensee_flg ? Constant.LO_CDCLS_KYODAKU_STATUS_LI : Constant.LO_CDCLS_KYODAKU_STATUS_PR
	);

	if ('kyodaku_status' in restraint_values) {
		statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "filterValueList", statusList, restraint_values.kyodaku_status);
	}

	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "mergeLabelList", statusList, ",");
    statusList.unshift({label:"",value:"",selected:true});
    
    // 検索で対象外にしているものはリストから外しておく
    for(var i=0; i<statusList.length; i++) {
    	Logger.getLogger().info(statusList[i].value);
    	if([Constant.LO_STATUS_ICHIJI_HOZON, Constant.LO_STATUS_JITAI, Constant.LO_STATUS_HIKETSU, Constant.LO_STATUS_IKO].indexOf(statusList[i].value) > -1) {
    		statusList.splice(i, 1);
    		i--;
    	}
    }

	$form.kyodaku_status_list = statusList;

}

/**
 * 許諾一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKyodakuList(param, motoFlg) {
	Logger.getLogger().info(' [searchKyodakuList]　許諾選択 param ' + ImJson.toJSONString(param, true));
	
	var licFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);

	if (ImJson.checkJSONString(param.restraint_values)) {
		var restraint_values = ImJson.parseJSON(param.restraint_values);
	    for(var key in restraint_values) {
	    	var restraint_value = restraint_values[key];
	    	param["restraint_" + key] = restraint_value;
	    }
	}

	var sql = "" ;
	sql += "SELECT ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.keiyaku_cls ";
	sql += "  , ko01.cd_naiyo AS keiyaku_cls_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko02.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.busyo_id ";
	sql += "  , ky.busyo_nm ";
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , ky.kyodaku_kikan_from ";
	sql += "  , ky.kyodaku_kikan_to ";
	sql += "  , STRING_AGG(DISTINCT ki.ip_cd, ',' ORDER BY ki.ip_cd) AS ip_cd ";
	sql += "  , STRING_AGG(DISTINCT ki.ip_nm, ',' ORDER BY ki.ip_nm) AS ip_nm ";
	sql += "  , STRING_AGG(DISTINCT ki.title_cd, ',' ORDER BY ki.title_cd) AS title_cd ";
	sql += "  , STRING_AGG(DISTINCT ki.title_nm, ',' ORDER BY ki.title_nm) AS title_nm ";
	sql += "  , ky.kyodaku_chiiki ";
	sql += "FROM ";
	sql += "  lo_t_kyodaku AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko01.cd_id = ky.keiyaku_cls ";
	sql += "    AND ko01.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = ky.kyodaku_cls ";
	sql += "    AND ko02.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_t_kyodaku_kikaku_himozuke AS kkh ";
	sql += "    ON (kkh.kyodaku_id = ky.kyodaku_id ";
	sql += "    AND kkh.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_t_kikaku AS ki ";
	sql += "    ON (ki.kikaku_id = kkh.kikaku_id ";
	sql += "    AND ki.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_t_moto_kyodaku_himozuke AS moky ";
	sql += "    ON ky.kyodaku_id = moky.kyodaku_id ";
	sql += "    AND moky.sakujo_flg = '0' ";
	sql += "WHERE " ; 
	sql += "  ky.sakujo_flg ='0' ";
	sql += "  AND ky.kyodaku_status NOT IN ";
	sql += " ('" + Constant.LO_STATUS_ICHIJI_HOZON + "'";
	sql += " , '" + Constant.LO_STATUS_JITAI + "'";
	sql += " , '" + Constant.LO_STATUS_HIKETSU + "'";
	sql += " , '" + Constant.LO_STATUS_IKO + "'";
	sql += " ) ";
	if (motoFlg) {
		sql += "  AND moky.kyodaku_id IS NULL "; // 1度元許諾を指定した追加申請は、元としては指定させないため結果に出さない
	}
	Logger.getLogger().info(' [searchKyodakuList]　motoFlg 【' + motoFlg + '】');

	// 入力パラメータ
	var strParam=[];

	// 画面入力項目とDB項目のマッピング
	var columnNameMap = {};
	columnNameMap["kyodaku_id"] = {col:"ky.kyodaku_id",comp:"like"};
	columnNameMap["kyodaku_status"] = {col:"ky.kyodaku_status",comp:"in"};
	columnNameMap["kaisha_nm"] = {col:"ky.kaisha_nm",comp:"like"};
	columnNameMap["restraint_kyodaku_status"] = {col:"ky.kyodaku_status",comp:"in"}
	columnNameMap["restraint_kyodaku_cls"] = {col:"ky.kyodaku_cls",comp:"in"}
	columnNameMap["restraint_keiyaku_cls"] = {col:"ky.keiyaku_cls",comp:"in"}
	columnNameMap["restraint_kaisha_id"] = {col:"ky.kaisha_id",comp:"eq"}
	if (licFlg){
		// ライセンシーの場合会社は固定
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
		columnNameMap["kaisha_id"] = {col:"ky.kaisha_id",comp:"eq"}
	}

    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);
    
	sql+= " GROUP BY ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.keiyaku_cls ";
	sql += "  , ko01.cd_naiyo ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko02.cd_naiyo ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.busyo_id ";
	sql += "  , ky.busyo_nm ";
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , ky.kyodaku_kikan_from ";
	sql += "  , ky.kyodaku_kikan_to ";
	sql += "  , ky.kyodaku_chiiki ";
	sql+= " ORDER BY ky.kyodaku_id ";

	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKyodakuList]　許諾選択 SQL ' + sql);
	var result = db.select(sql, strParam, 0);

	var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KYODAKU);
	result.data = obj;
	return result;

}
