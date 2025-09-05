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
 * アカウント申請情報取得（社内・社外共通）
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
	sql += "  , ky.koushin_sha";
	sql += "  , to_char(ky.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	
	sql += " FROM ";
	sql += "  lo_t_account_shinsei AS ky ";	
	
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" +  Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS + "' ";
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

/**
 * userCdに紐づく登録済みユーザを取得s
 * @param {string} userCd ユーザCD
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountUserInfo(userCd) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " 'imm' as data_cls";
    sql = sql + " ,dept_ath.*";
    sql = sql + " ,dept.department_cd busho_cd";
    sql = sql + " ,dept.department_name busho_nm";
    sql = sql + " ,usr.user_cd user_cd";
    sql = sql + " ,usr.user_name user_nm";
    sql = sql + " ,usr.user_search_name user_kana"; 
    sql = sql + " ,usr.email_address1 mail_address";
    sql = sql + " ,ss.shonin_keiro_id";    
	sql = sql + " FROM ";
	sql = sql + "  imm_user usr ";
	sql = sql + "  left join ";
	sql = sql + "  imm_department_ath dept_ath ";	
	sql = sql + "  ON dept_ath.user_cd = usr.user_cd ";
	sql = sql + "  left join ";
	sql = sql + "  imm_department dept ";	
	sql = sql + "  ON dept_ath.company_cd = dept.company_cd ";
	sql = sql + "  AND dept_ath.department_cd = dept.department_cd ";
	sql = sql + "  left join ";
	sql = sql + "  lo_m_jocho ss  ";	
	sql = sql + "  ON usr.user_cd = ss.shinsei_sha ";
	sql = sql + "WHERE ";
	sql = sql + "  usr.start_date < now() ";
	sql = sql + "  AND usr.end_date > now() ";
	sql = sql + "  AND usr.delete_flag = '0' ";
	sql = sql + "  AND usr.user_cd = ? ";	
	sql = sql + "  AND (dept.delete_flag = '0' or dept.delete_flag is null) ";
	sql = sql + "ORDER BY ";
	sql = sql + " dept_ath.user_cd ";	

	var params = [];
    params.push(DbParameter.string(userCd));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    
    return result;
}

/**
 * 会社に紐づく登録済みユーザを取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountUserList(kaishaId) {	
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " 'imm' as data_cls";
    sql = sql + " ,dept_ath.*"; 
    sql = sql + " ,dept.department_name busho_nm";
    sql = sql + " ,usr.user_name user_nm";
    sql = sql + " ,usr.user_search_name user_kana"; 
    sql = sql + " ,usr.email_address1 mail_address";
    sql = sql + " ,CASE ";
    sql = sql + "  WHEN ss.tanto_id is not null THEN '1' ";
    sql = sql + "  ELSE '0' ";
    sql = sql + " END keiyakusho_sofusaki_flg ";
	sql = sql + " FROM ";
	sql = sql + "  imm_department_ath dept_ath ";
	sql = sql + "  inner join ";
	sql = sql + "  imm_user usr ";	
	sql = sql + "  ON dept_ath.user_cd = usr.user_cd ";
	sql = sql + "  inner join ";
	sql = sql + "  imm_department dept ";	
	sql = sql + "  ON dept_ath.company_cd = dept.company_cd ";
	sql = sql + "  AND dept_ath.department_cd = dept.department_cd ";
	sql = sql + "  left join ";
	sql = sql + "  lo_m_keiyakusho_sofusaki ss  ";	
	sql = sql + "  ON dept_ath.user_cd = ss.tanto_id ";
	sql = sql + "WHERE ";
	sql = sql + "  usr.start_date < now() ";
	sql = sql + "  AND usr.end_date > now() ";
	sql = sql + "  AND usr.delete_flag = '0' ";
	sql = sql + "  AND dept_ath.company_cd = ? ";	
	sql = sql + "  AND dept.delete_flag = '0' ";
	sql = sql + "ORDER BY ";
	sql = sql + " dept_ath.user_cd ";	
	

    var params = [];
    params.push(DbParameter.string(kaishaId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 申請ユーザ情報取得
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiUserList(shinseiId) {
    var sql = "";
    sql += "SELECT ";
    sql += " au.*";  
    sql += " ,ko.cd_naiyo shinsei_cls_nm";
    sql += " ,dept.department_name busho_nm ";
    //sql += " ,ko2.cd_naiyo riyo_group_nm";
    sql += " ,sk.keiro_nm shonin_keiro_nm ";
	sql += " FROM ";
	sql += "  lo_t_account_user AS au ";
	sql += "  left join ";
	sql += "  imm_department dept ";
	sql += "  ON au.busho_cd = dept.department_cd ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko ";// 申請区分
	sql += "  ON ko.cd_cls_id = '" +  Constant.LO_CDCLS_SHINSEI_CLS + "' ";
	sql += "  AND ko.cd_id = au.shinsei_cls ";
	sql += "  AND ko.sakujo_flg = '0' ";
	sql += "  left join ";
	sql += "  lo_m_shonin_keiro sk ";// 承認経路	
	sql += "  ON sk.keiro_id = au.shonin_keiro ";
	sql += "  AND sk.sakujo_flg = '0' ";
	sql += "WHERE ";
	sql += "  au.sakujo_flg = '0' ";	
	sql += "  AND au.shinsei_id = ? ";
	sql += "ORDER BY ";
	sql += "  au.shinsei_id,au.shinsei_edaban ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql, params, 0);

    if(shinseiId.substr(0,2) == "SS"){ // 社内アカウント申請のみ利用グループの情報を取得
	    // 利用グループを固定値マスタから取得
	    params = [];
	    sql = "SELECT ";
	    sql += " ko2.cd_id riyo_group_cd";  
	    sql += " ,ko2.cd_naiyo riyo_group_nm";    
		sql += " FROM ";
		sql += "  lo_m_koteichi ko2 ";
		sql += "  WHERE ko2.cd_cls_id = '"+Constant.LO_CDCLS_RIYO_GROUP+"' ";	
		sql += "  AND ko2.sakujo_flg = '0' ";
		
		var result2 = db.select(sql, params, 0);
	
		var riyoGroupList = {};
		for(var i in result2.data){
			riyoGroupList[result2.data[i].riyo_group_cd] = result2.data[i].riyo_group_nm;
		}
	
	    var ip_tanto_list = retrieveShinseiIpTantoList(shinseiId);
	    var tanto_kakari_list = retrieveShinseiTantoKakariList(shinseiId);    
	
	    for(var i in result.data){
	    	var edaban = result.data[i].shinsei_edaban;
	    	
	    	if(edaban in ip_tanto_list){
	    		result.data[i].ip_tanto = ip_tanto_list[edaban].group_list;    		
	    	}else{
	    		result.data[i].ip_tanto = [];
	    	}
	    	
	    	if(edaban in tanto_kakari_list){
	    		result.data[i].tanto_kakari = tanto_kakari_list[edaban].tanto_kakari_list;    		
	    	}else{
	    		result.data[i].tanto_kakari = [];
	    	}
	    	
	    	var selectedRiyoGroup = result.data[i].riyo_group.split(",");
	    	
	    	result.data[i].riyo_group_nm = [];
	    	for(var s in selectedRiyoGroup){
	    		result.data[i].riyo_group_nm.push(riyoGroupList[selectedRiyoGroup[s]]);
	    	}   	
	    	
	    	
	    } 
    
    }
    
	
    Logger.getLogger().info('[retrieveShinseiUserList]' + ImJson.toJSONString(result.data, true));

    return result;
}


/**
 * 会社マスタ取得
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountKaisha(kaishaId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.*";
    sql = sql + " ,ko.cd_naiyo keiyakusho_baitai_nm";    
	sql = sql + " FROM ";
	sql = sql + "  lo_m_kaisha AS k ";
	sql = sql + "  left join ";
	sql = sql + "  lo_m_koteichi ko ";
	sql = sql + "  ON ko.cd_cls_id = '" +  Constant.LO_CDCLS_KEIYAKUSHO_BAITAI + "' ";
	sql = sql + "  AND ko.cd_id = k.keiyakusho_baitai ";
	sql = sql + "  AND ko.sakujo_flg = '0' ";	
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.kaisha_id = ? ";

    var params = [];
    params.push(DbParameter.string(kaishaId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 申請会社情報取得
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiKaisha(shinseiId) {
    var sql = "";
    sql += "SELECT ";
    sql += " k.*";
    sql += " ,ko.cd_naiyo keiyakusho_baitai_nm";    
	sql += " FROM ";
	sql += "  lo_t_account_kaisha AS k ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko ";
	sql += "  ON ko.cd_cls_id = '" +  Constant.LO_CDCLS_KEIYAKUSHO_BAITAI + "' ";
	sql += "  AND ko.cd_id = k.keiyakusho_baitai ";		
	sql += "WHERE ";
	sql += "  k.sakujo_flg = '0' ";	
	sql += "  AND k.shinsei_id = ? ";
	sql += "ORDER BY ";
	sql += "  k.shinsei_id ";	
	

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}




/**
 * 契約書送付先マスタ取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountKeiyakushoSofusakiList(kaishaId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.*";
    sql = sql + " ,'1' as data_cls";
    sql = sql + " ,usr.user_name as user_nm";
	sql = sql + " FROM ";
	sql = sql + "  lo_m_keiyakusho_sofusaki AS k ";
	sql = sql + "  left join ";
	sql = sql + "  imm_user usr ";	
	sql = sql + "  ON k.tanto_id = usr.user_cd ";
	sql = sql + "  AND usr.start_date < now() ";
	sql = sql + "  AND usr.end_date > now() ";
	sql = sql + "  AND usr.delete_flag = '0' ";	
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.kaisha_id = ? ";

    var params = [];
    params.push(DbParameter.string(kaishaId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 契約書送付先マスタ取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiKeiyakushoSofusakiList(shinseiId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.*";
    sql = sql + " ,'0' as data_cls";
    sql += " ,case ";
    sql += " when usr.user_name is null then usr2.user_nm ";
    sql += " else usr.user_name ";
    sql += " end user_nm ";
    sql += " ,ko2.cd_naiyo shinsei_cls_nm";
	sql = sql + " FROM ";
	sql = sql + "  lo_t_account_keiyakusho_sofusaki AS k ";
	sql = sql + "  left join ";
	sql = sql + "  imm_user usr ";	
	sql = sql + "  ON k.tanto_id = usr.user_cd ";
	sql = sql + "  AND usr.start_date < now() ";
	sql = sql + "  AND usr.end_date > now() ";
	sql = sql + "  AND usr.delete_flag = '0' ";
	sql = sql + "  left join ";
	sql = sql + "  lo_t_account_user usr2 ";	
	sql = sql + "  ON k.tanto_id = usr2.user_cd ";
	sql = sql + "  AND k.shinsei_id = usr2.shinsei_id ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko2 ";
	sql += "  ON ko2.cd_cls_id = '" +  Constant.LO_CDCLS_SHINSEI_CLS + "' ";
	sql += "  AND ko2.cd_id = k.shinsei_cls ";
	sql += "  AND ko2.sakujo_flg = '0' ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.shinsei_id = ? ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 請求書送付先マスタ取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountSeikyushoSofusakiList(kaishaId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.*";
    sql = sql + " ,'1' as data_cls";
	sql = sql + " FROM ";
	sql = sql + "  lo_m_seikyusho_sofusaki AS k ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.kaisha_id = ? ";
	sql = sql + "  ORDER BY to_number(k.seikyusho_sofusaki_eda,'999') ASC ";

    var params = [];
    params.push(DbParameter.string(kaishaId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 請求書送付先マスタ取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiSeikyushoSofusakiList(shinseiId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.*";
    sql = sql + " ,'0' as data_cls";
    sql += " ,ko2.cd_naiyo shinsei_cls_nm";
	sql = sql + " FROM ";
	sql = sql + "  lo_t_account_seikyusho_sofusaki AS k ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko2 ";
	sql += "  ON ko2.cd_cls_id = '" +  Constant.LO_CDCLS_SHINSEI_CLS + "' ";
	sql += "  AND ko2.cd_id = k.shinsei_cls ";
	sql += "  AND ko2.sakujo_flg = '0' ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.shinsei_id = ? ";
	sql = sql + "  ORDER BY to_number(k.seikyusho_sofusaki_eda,'999') ASC ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveAccountUserList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveAccountUserList]' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 申請IP担当者取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiIpTantoList(shinseiId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql += " k.shinsei_edaban";
    sql += " ,k.shinsei_cls";
    sql += " ,k.user_cd";
    sql += " ,usr.user_name user_nm";
    sql += " ,k.group_cd";
    sql += " ,grp.public_group_name group_nm";
    sql += " ,ko2.cd_naiyo shinsei_cls_nm";
	sql = sql + " FROM ";
	sql = sql + "  lo_t_account_ip_tanto AS k ";
	sql = sql + "  left join ";
	sql = sql + "  imm_user usr ";	
	sql = sql + "  ON k.user_cd = usr.user_cd ";
	sql = sql + "  AND usr.start_date < now() ";
	sql = sql + "  AND usr.end_date > now() ";
	sql = sql + "  AND usr.delete_flag = '0' ";
	sql += " left join imm_public_grp grp";
	sql += " ON k.group_cd = grp.public_group_cd ";
	sql += "   AND grp.delete_flag = '0' ";
	sql += "   AND grp.start_date <= CURRENT_DATE ";
	sql += "   AND grp.end_date > CURRENT_DATE ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko2 ";
	sql += "  ON ko2.cd_cls_id = '" +  Constant.LO_CDCLS_SHINSEI_CLS + "' ";
	sql += "  AND ko2.cd_id = k.shinsei_cls ";
	sql += "  AND ko2.sakujo_flg = '0' ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.shinsei_id = ? ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]' + ImJson.toJSONString(result, true));
    
    var ipTantoList ={};
    
    if(result.countRow >0){

	    var data = result.data;
	    for(var i in data){
	    	if(data[i].shinsei_edaban in ipTantoList){
	    		
	    	}else{
	    		ipTantoList[data[i].shinsei_edaban] ={};
	    		ipTantoList[data[i].shinsei_edaban].shinsei_edaban = data[i].shinsei_edaban;
	    		ipTantoList[data[i].shinsei_edaban].shinsei_cls_nm = data[i].shinsei_cls_nm;
	    		ipTantoList[data[i].shinsei_edaban].user_nm = data[i].user_nm;
	    		ipTantoList[data[i].shinsei_edaban].group_list =[];
	    	}
	    	
	    	ipTantoList[data[i].shinsei_edaban].group_list.push(data[i]);
	    	
	    }
	    	
    }
	    
    Logger.getLogger().info('[ipTantoList]' + ImJson.toJSONString(ipTantoList, true));

    return ipTantoList;
}

/**
 * 申請完了通知先取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiTantoKakariList(shinseiId) {
    var sql = "";
    sql = sql + "SELECT ";
    sql += " k.shinsei_edaban";    
    sql += " ,k.tanto_kakari_cd as group_cd";
    sql += " ,grp.public_group_name as group_nm";
	sql += " FROM ";
	sql += "  lo_t_account_tanto_kakari AS k ";
	sql += " left join imm_public_grp grp";
	sql += " ON k.tanto_kakari_cd = grp.public_group_cd ";
	sql += "   AND grp.delete_flag = '0' ";
	sql += "   AND grp.start_date <= CURRENT_DATE ";
	sql += "   AND grp.end_date > CURRENT_DATE ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  AND k.shinsei_id = ? ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]　申請ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveShinseiKeiyakushoSofusakiList]' + ImJson.toJSONString(result, true));
    
    var tantoKakariList ={};
    
    if(result.countRow >0){
	    var data = result.data;
	    for(var i in data){
	    	if(data[i].shinsei_edaban in tantoKakariList){
	    		
	    	}else{
	    		tantoKakariList[data[i].shinsei_edaban] ={};
	    		tantoKakariList[data[i].shinsei_edaban].shinsei_edaban = data[i].shinsei_edaban;
	    		tantoKakariList[data[i].shinsei_edaban].shinsei_cls_nm = data[i].shinsei_cls_nm;
	    		tantoKakariList[data[i].shinsei_edaban].tanto_kakari_list =[];
	    	}
	    	
	    	tantoKakariList[data[i].shinsei_edaban].tanto_kakari_list.push(data[i]);
	    	
	    }
	    
	    	
    }
	    
    Logger.getLogger().info('[ipTantoList]' + ImJson.toJSONString(tantoKakariList, true));

    return tantoKakariList;
}
	
/**
 * 案件情報の設定
 * @param {String} 文書id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(shinseiData,userInfo) {
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(shinseiData.shinsei_id));
    strParam.push(DbParameter.string(shinseiData.shinsei_id));
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam,0);
    
    var wfResult = {};
    
    Logger.getLogger().info(' [setMatterInfo]　'+ sql + ImJson.toJSONString(strParam, true) + ImJson.toJSONString(result, true));
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	//Logger.getLogger().info(' [setMatterInfo]　return false ');
    	return false;
    }  
    
    
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;
    
    wfResult.systemMatterId = systemMatterId;
    wfResult.type = type;   
    
    //フローIDをもとに、ノード情報を取得
    var nodeDefInfo = getNodeInfo(shinseiData.flow_id);
    
    if (type =='cpl'){
    	// 完了案件情報取得
		var cplMatter = new CplMatter(systemMatterId);
	    var matter = cplMatter.getMatter();
	    
	    // ワークフローに関するパラメータを保持します
	    wfResult.wf_data = {
	        imwGroupId              : '',           //グループ ID 
	        imwUserCode             : '',          //処理者CD
	        imwPageType             : '',          //画面種別
	        imwUserDataId           : matter.data.userDataId,        //ユーザデータ ID
	        imwSystemMatterId       : matter.data.systemMatterId,    //システム案件ID
	        imwNodeId               : ''            //ノード ID       
	    };
	    
	    var cplMatterObj = new CplMatter('ja', systemMatterId);
        var flowInfo = cplMatterObj.getExecFlow().data;
        //フローの履歴からノードリストを取得
        var nodeInfoList = flowInfo.nodes;
        Logger.getLogger().info(' [setMatterInfo]nodeInfoList　'+ ImJson.toJSONString(nodeInfoList, true));
        var nodeList = [];
        //配列つめかえ
        for (var idx = 0; idx < nodeInfoList.length; idx++) {
            nodeList.push(nodeInfoList[idx].nodeId);
        }    
        
        // ノード情報取得
        var cplMatter = new CplMatterNode('ja', systemMatterId);
        
        wfResult.nodeUserslist = {};
        for (var idx in nodeDefInfo) {
        	if(nodeDefInfo[idx].disabled === false){
	            if (nodeList.indexOf(nodeDefInfo[idx].node_id) > -1) {
	                var result = cplMatter.getProcessHistoryList(nodeDefInfo[idx].node_id);
	                
	                for(var i in result.data){
		                if(result.data[i].executeUserCode == userInfo.userCd){
		                	wfResult.route_user_flg = true;
		                	break;
		                }
	                }
	                
	
	                wfResult.nodeUserslist[idx] = getProcessLatestUser(result);               
	                
	                
	            }else{
	            	wfResult.nodeUserslist[idx] =  {"userName":"---","userCd":"---","execFlg":false};
	            }
            }
        }        
    	return wfResult;
    }else{    
	    // 未完了案件情報取得
		var actvMatter = new ActvMatter(systemMatterId);
	    var matter = actvMatter.getMatter();
	    
    	var orgParams = {"shinsei_id":shinseiData.shinsei_id,	                 
                 "shinsei_status":shinseiData.shinsei_status
                 };
                 Logger.getLogger().info(' ******************************');
	    // ワークフローに関するパラメータを保持します
	    wfResult.wf_data = {
	        imwGroupId              : '',           //グループ ID 
	        imwUserCode             : '',          //処理者CD
	        imwPageType             : '',          //画面種別
	        imwUserDataId           : matter.data.userDataId,        //ユーザデータ ID
	        imwSystemMatterId       : matter.data.systemMatterId,    //システム案件ID
	        imwNodeId               : '',            //ノード ID 
	        imwArriveType           : '',        //到達種別
	        imwAuthUserCode         : matter.data.applyAuthUserCode,                           //権限者CD 
	        imwApplyBaseDate        : matter.data.applyBaseDate,     //申請基準日
	        imwContentsId           : '',        //コンテンツ ID
	        imwContentsVersionId    : '', //コンテンツバージョン ID 
	        imwRouteId              : '',           //ルート ID
	        imwRouteVersionId       : '',    //ルートバージョン ID
	        imwFlowId               : matter.data.flowId,            //フローID 
	        imwFlowVersionId        : matter.data.flowVersionId,     //フローバージョンID
	        imwCallOriginalPagePath : 'lo/contents/screen/kyodaku/permission_list', //呼出元ページパス
	        imwCallOriginalParams   : ImJson.toJSONString(orgParams),    //呼出元パラメータ
	        imwAuthUserCodeList     : '',
	        imwNodeSetting			: ''	
	    };

	    //現在のノードid取得    todo 分岐ルートの場合一覧からノードIDを渡す必要があるのでは？
	    var actvNodeList = actvMatter.getActvNodeList();
	    var nodeId = actvNodeList.data[0].nodeId;	    
	
	    wfResult.wf_data.imwNodeId = nodeId;
	    
	    // 戻し先ノードの設定
	    wfResult.wf_data.imwBackNodeSetting = backNodeSetteing(nodeId);
	}
    
    // ノード処理対象者か判定
  	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定

  	var actvMatterNode = new ActvMatterNode('ja',systemMatterId);
    var cond = new ListSearchConditionNoMatterProperty();
    var userlist = actvMatterNode.getExecutableUserList(cond); //ノードの対象者を取得
    Logger.getLogger().info(' [userlist]　 userlist '+ ImJson.toJSONString(userlist, true));
    // 対象者に含まれていればok
    var authUserList = [];
    wfResult.proc_user_flg = false;
    for(var i = 0; i < userlist.data.length; i++) {
	   if (user_cd == userlist.data[i].authUserCode ){
		   wfResult.proc_user_flg = true;
		   break;
	   }
    	authUserList.push(userlist.data[i].authUserCode);
    } 
    
    if (nodeId != ''){	    	
		var actvMatterObj = new ActvMatter('ja', systemMatterId);
		var flowInfo = actvMatterObj.getExecFlow().data;
		//フローに設定されているノード一覧を取得する
		var nodeInfoList = flowInfo.nodes;
		
		var nodeList = [];
		//配列つめかえ
		for (var idx = 0; idx < nodeInfoList.length; idx++) {
			nodeList.push(nodeInfoList[idx].nodeId);
		}			

		// ノード情報取得
	    var actvMatter = new ActvMatterNode('ja', systemMatterId);
	    wfResult.nodeUserslist = {};
		//for (var idx in nodeArray) {
		for (var idx in nodeDefInfo) {
			if(nodeDefInfo[idx].disabled ===false){
				if (nodeList.indexOf(nodeDefInfo[idx].node_id) > -1) {
					wfResult.nodeUserslist[idx] ={};
					
					//フローの履歴情報を取得
					var result = actvMatter.getProcessHistoryList(nodeDefInfo[idx].node_id);					
					Logger.getLogger().info(' [setMatterInfo]result　'+ ImJson.toJSONString(result, true));
					if(result.data.length > 0){
						//最後に実行した処理者を取得
						var userObj = getProcessLatestUser(result);
						
						//ログインユーザが処理済みユーザの一覧に存在する場合は、フラグをtrueにする
						if(userObj.userCd == userInfo.userCd){
							wfResult.route_user_flg = true;
						}				
											
						if(userObj.userCd !=undefined){
							wfResult.nodeUserslist[idx] = userObj;
						}
					}
					
					//実行中フローのノード情報から、プラグイン情報を取得する
					if(wfResult.nodeUserslist[idx].userCd == undefined){
						//処理対象者一覧を取得					
						result = actvMatter.getExecProcessTargetList(nodeDefInfo[idx].node_id);			
						wfResult.nodeUserslist[idx] = getProcessLatestUser(result);	
						Logger.getLogger().info('ここはいってる？');
					}						
		    
				}else{
					wfResult.nodeUserslist[idx] =  {"userName":"---","userCd":"---","execFlg":false};
				}
			}
			
		}		
		// 通知設定取得
		//getSettingMailUsers($oUserParams);
	}
	Logger.getLogger().info(' [setMatterInfo]wfResult.nodeUserslist　'+ ImJson.toJSONString(wfResult.nodeUserslist, true));
	for(var i in wfResult.nodeUserslist){
		if (!wfResult.nodeUserslist[i] || wfResult.nodeUserslist[i].userCd== '') {
			wfResult.nodeUserslist[i] = {"userName":"---","userCd":"---","execFlg":false};
		}
	
	}
	
	if(nodeId == Constant.LO_NODE_APPLY && wfResult.proc_user_flg){
    	//入力ノードかつ、実行者がログインしている場合は、入力者にログイン者の情報を表示する
    	//wfResult.nodeUserslist.apply = {"userName":userInfo.userName,"userCd":userInfo.userCd,"execFlg":false};
	}
	
    // 代理設定の確認
    if (!wfResult.proc_user_flg){
    	// 代理設定を取得
        var oriAct = new OriginalActList(user_cd);
        var systemDatetime = Procedure.imw_datetime_utils.getSystemDateTime();
        var cond = new ListSearchConditionNoMatterProperty();
        cond.addCondition(OriginalActList.START_DATE, systemDatetime, ListSearchCondition.OP_LE);
        cond.addCondition(OriginalActList.LIMIT_DATE, systemDatetime, ListSearchCondition.OP_GE);
        var oriUserlist = oriAct.getPersList (cond);
        
        // 処理対象者が代理元と一致すればok
        for(var i = 0; i < oriUserlist.data.length; i++) {
            if (authUserList.indexOf(oriUserlist.data[i].originalActUserCode) > -1){
            	wfResult.proc_user_flg = true;
            	break;
            }
        }
    }

    return wfResult;
}

/**
 * 承認ノードの差戻先を固定
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function backNodeSetteing(nodeid){
	// 現在のノードIDから戻し先を判断
	var node = {};
	node[Constant.LO_NODE_KIAN] = Constant.LO_NODE_APPLY;	// BNE担当→申請
	node[Constant.LO_NODE_APPR_1] = Constant.LO_NODE_KIAN;	// 承認1→BNE担当
	node[Constant.LO_NODE_APPR_2] = Constant.LO_NODE_KIAN;	// 承認2→BNE担当	
	node[Constant.LO_NODE_SYS] = Constant.LO_NODE_KIAN;	// 契約担当→BNE担当	
	
	var backnode =node[nodeid];

	return backnode;
}

// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessLatestUser(result) {
	// ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();
	var names={};
	
	if (result.data){
    	for (var i=result.data.length-1;0 <= i;i--){    		
    		//処理済み、かつ、処理タイプ申請or承認(=差し戻しや引き戻しは除く）
    		if (result.data[i].authUserName
    				&& (result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apy") //申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_rapy") //再申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apr") //承認
    						)
    					) {
          		 names = {"userName":result.data[i].authUserName,"userCd":result.data[i].executeUserCode,"execFlg":true};
          		 //Logger.getLogger().info('対象者：authUserName' + ImJson.toJSONString(names,true));
          		return names;
    		} else if(result.data[i].processTargetName) {
       		 	names = {"userName":result.data[i].processTargetName,"userCd":result.data[i].parameter,"execFlg":false};
       		 	//Logger.getLogger().info('対象者：processTargetName' + ImJson.toJSONString(names,true));
       		 	return names;
    		}else{    			
    			//空のオブジェクトを返す
    			return names;
    		}    		
    	}    	
    }else{
    	return '';
    }
}

/**
 * ノード情報のオブジェクトを取得
 * @returns {String} ノード設定値
 */
function getNodeInfo(flowId){
	//ルート定義に合わせてオブジェクトを作成
	
	if(flowId == Constant.LO_FLOW_ACCOUNT){//ライセンシー用アカウント申請
		var nodeObj ={
			"apply":{node_id:Constant.LO_NODE_APPLY,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPLY,disabled:false},
			"kian":{node_id:Constant.LO_NODE_KIAN,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_0,disabled:false},
			"appr_1":{node_id:Constant.LO_NODE_APPR_1,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_1,disabled:false},
			"appr_2":{node_id:Constant.LO_NODE_APPR_2,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_2,disabled:false},
			"sys":{node_id:Constant.LO_NODE_SYS,node_name:Constant.LO_NAME_NODE_ACCOUNT_SYS,disabled:false}
		};
		
		//動的承認ノードはtrueに設定
		nodeObj.kian.dc_setting = true;
		nodeObj.appr_1.dc_setting = true;
		nodeObj.appr_2.dc_setting = true;
	}else{//社内向けアカウント申請
		var nodeObj ={
			"apply":{node_id:Constant.LO_NODE_APPLY,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPLY,disabled:false},
			"kian":{node_id:Constant.LO_NODE_KIAN,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_0,disabled:false},
			"appr_1":{node_id:Constant.LO_NODE_APPR_1,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_1,disabled:false},
			"appr_2":{node_id:Constant.LO_NODE_APPR_2,node_name:Constant.LO_NAME_NODE_ACCOUNT_APPR_2,disabled:false},
			"sys":{node_id:Constant.LO_NODE_SYS,node_name:Constant.LO_NAME_NODE_ACCOUNT_SYS,disabled:false}		
		};
		
		//ルート定義上に存在するが使用しないノードはdisabledをtrueに設定
		nodeObj.kian.disabled = true;
		
		//動的承認ノードはtrueに設定		
		nodeObj.appr_1.dc_setting = true;
		nodeObj.appr_2.dc_setting = true;	

	}
	
		

	return nodeObj;
}

/**
 * 承認経路マスタ取得
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShoninKeiroList() {
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " k.* ";
    sql = sql + " ,u.user_name ichiji_shonin_nm,u2.user_name niji_shonin_nm "; 
	sql = sql + " FROM ";
	sql = sql + "  lo_m_shonin_keiro AS k ";
	sql = sql + "  left join imm_user AS u ";
	sql += "   ON k.ichiji_shonin = u.user_cd";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.start_date <= CURRENT_DATE ";
	sql += "   AND u.end_date > CURRENT_DATE ";
	sql = sql + "  left join imm_user AS u2 ";
	sql += "   ON k.niji_shonin = u2.user_cd";
	sql += "   AND u2.delete_flag = '0' ";
	sql += "   AND u2.delete_flag = '0' ";
	sql += "   AND u2.start_date <= CURRENT_DATE ";
	sql += "   AND u2.end_date > CURRENT_DATE ";
	sql = sql + "WHERE ";
	sql = sql + "  k.sakujo_flg = '0' ";	
	sql = sql + "  ORDER BY to_number(k.keiro_id,'999') ASC ";

    var params = [];    

    // sql実行
    var db = new TenantDatabase();
	// Logger.getLogger().info('[retrieveAccountUserList]　 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    // Logger.getLogger().info('[retrieveShoninKeiroList]' + ImJson.toJSONString(result, true));
    return result;
}
