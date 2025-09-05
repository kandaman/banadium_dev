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
 * 承認経路マスタ取得
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShoninKeiroList() {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.* ";
    sql = sql + " ,u.user_name ichiji_shonin_nm,u2.user_name niji_shonin_nm,u3.user_name sanji_shonin_nm,u4.user_name yoji_shonin_nm,u5.user_name goji_shonin_nm "; 
	sql = sql + " FROM ";
	sql = sql + "  lo_m_shonin_keiro AS k ";
	sql = sql + "  left join imm_user AS u ";
	sql += "   ON k.ichiji_shonin = u.user_cd";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.start_date <= CURRENT_DATE ";
	sql += "   AND u.end_date > CURRENT_DATE ";
	sql += "  left join imm_user AS u2 ";
	sql += "   ON k.niji_shonin = u2.user_cd";
	sql += "   AND u2.delete_flag = '0' ";
	sql += "   AND u2.delete_flag = '0' ";
	sql += "   AND u2.start_date <= CURRENT_DATE ";
	sql += "   AND u2.end_date > CURRENT_DATE ";
	sql += "  left join imm_user AS u3 ";
	sql += "   ON k.sanji_shonin = u3.user_cd";
	sql += "   AND u3.delete_flag = '0' ";
	sql += "   AND u3.delete_flag = '0' ";
	sql += "   AND u3.start_date <= CURRENT_DATE ";
	sql += "   AND u3.end_date > CURRENT_DATE ";
	sql += "  left join imm_user AS u4 ";
	sql += "   ON k.yoji_shonin = u4.user_cd";
	sql += "   AND u4.delete_flag = '0' ";
	sql += "   AND u4.delete_flag = '0' ";
	sql += "   AND u4.start_date <= CURRENT_DATE ";
	sql += "   AND u4.end_date > CURRENT_DATE ";
	sql += "  left join imm_user AS u5 ";
	sql += "   ON k.goji_shonin = u5.user_cd";
	sql += "   AND u5.delete_flag = '0' ";
	sql += "   AND u5.delete_flag = '0' ";
	sql += "   AND u5.start_date <= CURRENT_DATE ";
	sql += "   AND u5.end_date > CURRENT_DATE ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  ORDER BY to_number(k.keiro_id,'999') ASC ";

    var params = [];    

    // sql実行
    var db = new TenantDatabase();
	 Logger.getLogger().info('[retrieveShoninKeiroList]　 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    // Logger.getLogger().info('[retrieveShoninKeiroList]' + ImJson.toJSONString(result, true));
    return result;
}
