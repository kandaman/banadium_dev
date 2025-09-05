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
		, $licensee_flg ? Constant.LO_CDCLS_KIKAKU_STATUS_LI : Constant.LO_CDCLS_KIKAKU_STATUS_PR
	);

    if ('kikaku_status' in restraint_values) {
		statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "filterValueList", statusList, restraint_values.kikaku_status);
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

	$form.kikaku_status_list = statusList;

}

/**
 * 企画一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKikakuList(param) {
	
	Logger.getLogger().info('[searchKikakuList]　企画選択一覧検索');
	
	var licFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);
	
	if (ImJson.checkJSONString(param.restraint_values)) {
		var restraint_values = ImJson.parseJSON(param.restraint_values);
		Logger.getLogger().info('[searchKikakuList]　restraint_values ' + ImJson.toJSONString(restraint_values, true));
	    for(var key in restraint_values) {
	    	var restraint_value = restraint_values[key];
	    	param["restraint_" + key] = restraint_value;
	    }
	}

	var sql = "" ;
	sql += "SELECT ";
	sql += "  ki.kikaku_id ";
	sql += " ,ki.kikaku_nm ";
	sql += " ,ki.kikaku_status " ; 
	sql += " ,ki.ip_cd ";
	sql += " ,ki.ip_nm ";
	sql += " ,ki.title_cd ";
	sql += " ,ki.title_nm ";
	sql += " ,ki.kaisha_id " ; 
	sql += " ,ki.kaisha_nm " ; 
	sql += " ,ki.busyo_id " ; 
	sql += " ,ki.busyo_nm " ; 
	sql += " ,ki.tantou_sha " ; 
	sql += " ,ki.bne_tantou_sha "
	sql += "FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "WHERE " ; 
	sql += "  ki.sakujo_flg ='0' ";
	sql += "  AND ki.kikaku_status NOT IN ";
	sql += " ('" + Constant.LO_STATUS_ICHIJI_HOZON + "'";
	sql += " , '" + Constant.LO_STATUS_JITAI + "'";
	sql += " , '" + Constant.LO_STATUS_HIKETSU + "'";
	sql += " , '" + Constant.LO_STATUS_IKO + "'";
	sql += " ) ";

	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    columnNameMap["kikaku_id"] = {col:"ki.kikaku_id",comp:"like"};
    columnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
    columnNameMap["kaisha_mei"] = {col:"ki.kaisha_nm",comp:"like"};
    columnNameMap["kikaku_status"] = {col:"ki.kikaku_status",comp:"in"};
	columnNameMap["restraint_kikaku_status"] = {col:"ki.kikaku_status",comp:"in"}
	columnNameMap["restraint_kikaku_shubetsu_cd"] = {col:"ki.kikaku_shubetsu_cd",comp:"in"}
	columnNameMap["restraint_kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"}
	if (licFlg){
		// ライセンシーの場合会社は固定
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
		columnNameMap["kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"}
	}
	
	// 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

	sql+= " ORDER BY ki.kikaku_id ";
	
	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKyodakuList]　企画選択一覧検索 SQL ' + sql);
	var result = db.select(sql,strParam, 0);
	
	var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KIKAKU);
	result.data = obj;
	return result;

}
