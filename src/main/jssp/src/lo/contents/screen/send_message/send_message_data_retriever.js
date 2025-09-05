/**
 * ユーザー情報取得処理
 * 
 */
function getUserInfo() {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var userInfo = {};

	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	userInfo.userCd = userContext.userProfile.userCd;
	userInfo.userName = userContext.userProfile.userName;

	// 所属グループ判断
	userInfo.bneFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_BNE) == true ? "1" : "0");
	userInfo.licenseProductionFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION) == true ? "1" : "0");
	userInfo.licenseeFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE) == true ? "1" : "0");
	userInfo.kawariInputFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_KAWARI_INPUT) == true ? "1" : "0");

	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	userInfo.userCompanyDepartment = userCompanyDepartment;

	return userInfo;
}

/**
 * 代わり承認情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiData(shinseiId) {

	Logger.getLogger().info(' [retrieveShinseiData]　申請情報検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var userInfo = getUserInfo();

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ky.shinsei_id ";
	sql += "  , ky.flow_id ";
	sql += "  , ky.shinsei_status ";
	sql += "  , ko03.cd_naiyo AS shinsei_status_name ";	
	sql += "  ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ;
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.biko ";
	sql += "  , ky.natsuin_change_flg ";
	sql += "  , ky.shinsei_title_cd ";
	sql += "  , tt.title_nm as shinsei_title_nm ";

	sql += "  , to_char(ky.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	
	sql += " FROM ";
	sql += "  lo_t_account_shinsei AS ky ";	
	
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" +  Constant.LO_CDCLS_KAWARI_STATUS + "' ";
	sql += "    AND ko03.cd_id = ky.shinsei_status ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	
	sql += "  LEFT JOIN lo_m_title AS tt ON tt.title_cd = ky.shinsei_title_cd ";
	sql += "    AND tt.sakujo_flg ='0' ";
	sql += "WHERE ";
	sql += "  ky.sakujo_flg = '0' ";
	sql += "  AND ky.shinsei_id = ? ";
	sql += "GROUP BY ";
	sql += "  ky.shinsei_id ";
	sql += "  , ky.shinsei_status ";	
	sql += "  , ko03.cd_naiyo ";
	sql += "  , tt.title_nm ";
		
    var params = [];
    params.push(DbParameter.string(shinseiId));

	// sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().debug('[retrieveKyodakuData]　許諾情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveKyodakuData]　result ' + ImJson.toJSONString(result, true));
    return result;
}