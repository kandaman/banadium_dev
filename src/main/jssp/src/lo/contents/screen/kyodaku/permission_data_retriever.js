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

	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	userInfo.userCompanyDepartment = userCompanyDepartment;

	return userInfo;
}

/**
 * 許諾情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuData(kyodakuId) {

	Logger.getLogger().info(' [retrieveKyodakuData]　許諾情報検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var userInfo = getUserInfo();

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_status ";
	sql += "  , ko03.cd_naiyo AS kyodaku_status_name ";
	sql += "  , ky.keiyaku_status ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko01.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , ky.keiyaku_cls ";
	sql += "  , ko02.cd_naiyo AS keiyaku_cls_nm ";
	sql += "  , ky.shinsei_bi ";
	sql += "  , ky.kakunin_bi ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.bne_tantou_sha ";
	sql += "  , ky.kyodaku_kikan_from ";
	sql += "  , ky.kyodaku_kikan_to ";
	sql += "  , ky.saiteihosho_kigen ";
	sql += "  , ky.sozai_biko ";
	sql += "  , ky.biko ";
	sql += "  , substring(ky.sozai_biko from 1 for 1000) || CASE WHEN char_length(ky.sozai_biko) > 1000 THEN '...' ELSE '' END AS short_sozai_biko ";
	sql += "  , substring(ky.biko from 1 for 1000) || CASE WHEN char_length(ky.biko) > 1000 THEN '...' ELSE '' END AS short_biko ";
	sql += "  , to_char(ky.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	sql += "  , ky.sozai_hi ";
	sql += "  , ky.kyodaku_chiiki ";
	sql += "  , ky.seikyusho_sofusaki_id ";
	sql += "  ,ss.seikyusho_sofusaki_nm " ;
	sql += "  ,ss.email_address_to " ;
	sql += "  ,ss.email_address_cc1 " ;
	sql += "  ,ss.email_address_cc2 " ;
	sql += "  ,ss.email_address_cc3 " ;
	sql += "  , moky.moto_kyodaku_id ";
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , string_agg(DISTINCT ki.ip_cd, ',' ORDER BY ki.ip_cd) AS ip_cd ";
	sql += "  , string_agg(DISTINCT ki.ip_nm, ',' ORDER BY ki.ip_nm) AS ip_nm ";
	sql += "  , string_agg(DISTINCT ki.title_cd, ',' ORDER BY ki.title_cd) AS title_cd ";
	sql += "  , string_agg(DISTINCT ki.title_nm, ',' ORDER BY ki.title_nm) AS title_nm ";
	sql += "  , REGEXP_REPLACE(ky.kyodaku_chiiki, '\r|\n|\r\n', '', 'g') AS kyodaku_chiiki_without_lf ";
	sql += "FROM ";
	sql += "  lo_t_kyodaku AS ky ";
	sql += "  LEFT JOIN lo_t_kyodaku_kikaku_himozuke AS kkh ";
	sql += "    ON (kkh.kyodaku_id = ky.kyodaku_id ";
	sql += "    AND kkh.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_t_kikaku AS ki ";
	sql += "    ON (ki.kikaku_id = kkh.kikaku_id ";
	sql += "    AND ki.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko01.cd_id = ky.kyodaku_cls ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = ky.keiyaku_cls ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + (userInfo.licenseeFlg == "1" ? Constant.LO_CDCLS_KYODAKU_STATUS_LI : Constant.LO_CDCLS_KYODAKU_STATUS_PR) + "' ";
	sql += "    AND ko03.cd_id = ky.kyodaku_status ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_t_moto_kyodaku_himozuke AS moky ";
	sql += "    ON ky.kyodaku_id = moky.kyodaku_id ";
	sql += "    AND moky.sakujo_flg = '0' ";
	sql += "  LEFT JOIN lo_m_seikyusho_sofusaki AS ss ";
	sql += "    ON (ss.kaisha_id = ky.kaisha_id ";
	sql += "    AND ss.seikyusho_sofusaki_eda = ky.seikyusho_sofusaki_id ";
	sql += "    AND ss.sakujo_flg ='0') ";
	sql += "WHERE ";
	sql += "  ky.sakujo_flg = '0' ";
	sql += "  AND ky.kyodaku_id = ? ";
	sql += "GROUP BY ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_status ";
	sql += "  , ky.keiyaku_status ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ky.keiyaku_cls ";
	sql += "  , ky.shinsei_bi ";
	sql += "  , ky.kakunin_bi ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.bne_tantou_sha ";
	sql += "  , ky.kyodaku_kikan_from ";
	sql += "  , ky.kyodaku_kikan_to ";
	sql += "  , ky.saiteihosho_kigen ";
	sql += "  , ky.sozai_biko ";
	sql += "  , ky.biko ";
	sql += "  , ky.koushin_bi ";
	sql += "  , ky.sozai_hi ";
	sql += "  , ky.kyodaku_chiiki ";
	sql += "  , ky.seikyusho_sofusaki_id ";
	sql += "  ,ss.seikyusho_sofusaki_nm " ;
	sql += "  ,ss.email_address_to " ;
	sql += "  ,ss.email_address_cc1 " ;
	sql += "  ,ss.email_address_cc2 " ;
	sql += "  ,ss.email_address_cc3 " ;
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , ko01.cd_naiyo ";
	sql += "  , ko02.cd_naiyo ";
	sql += "  , ko03.cd_naiyo ";
	sql += "  , moky.moto_kyodaku_id ";
	sql += "  , REGEXP_REPLACE(ky.kyodaku_chiiki, '\r|\n|\r\n', '', 'g')";

    var params = [];
    params.push(DbParameter.string(kyodakuId));

	// sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKyodakuData]　許諾情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 企画情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuList(kyodakuId) {
	Logger.getLogger().info(' [retrieveKikakuList]　企画情報検索');
    var sql = ""; 
	sql = sql + "SELECT ";
	sql = sql + "  ki.kikaku_id ";
	sql = sql + "  , ki.kikaku_nm ";
	sql = sql + "  , ki.ip_cd ";
	sql = sql + "  , ki.ip_nm ";
	sql = sql + "  , ki.title_cd ";
	sql = sql + "  , ki.title_nm ";
	sql = sql + "  , ki.kaisha_nm ";
	sql = sql + "  , ki.busyo_nm ";
	sql = sql + "  , ki.tantou_sha ";
	sql = sql + "  , ki.bne_tantou_sha ";
	sql = sql + "FROM ";
	sql = sql + "  lo_t_kyodaku_kikaku_himozuke AS hi ";
	sql = sql + "  INNER JOIN lo_t_kikaku AS ki ";
	sql = sql + "    ON (ki.kikaku_id = hi.kikaku_id) ";
	sql = sql + "WHERE ";
	sql = sql + "  hi.sakujo_flg = '0' ";
	sql = sql + "  AND ki.sakujo_flg = '0' ";
	sql = sql + "  AND hi.kyodaku_id = ? ";
	sql = sql + "ORDER BY ";
	sql = sql + "  hi.id ";

    var params = [];
    params.push(DbParameter.string(kyodakuId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKikakuList]　企画情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 商品情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShohinList(kyodakuId) {

	Logger.getLogger().info(' [retrieveShohinList]　商品情報検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = ""; 
	sql += "SELECT ";
	sql += "  sh.kyodaku_id ";
	sql += "  , sh.kyodaku_edaban ";
	sql += "  , sh.shohin_mei ";
	sql += "  , to_char(sh.hatsubai_bi,'YYYY/MM/DD') as hatsubai_bi ";
	sql += "  , sh.zeinuki_jodai ";
	sql += "  , sh.ryoritsu ";
	sql += "  , sh.siyoryo ";
	sql += "  , sh.saiteihosho_su_shinseisu ";
	sql += "  , sh.saiteihosho_su_kyodakuryo ";
	sql += "  , sh.shoshi ";
	sql += "  , ko01.cd_naiyo AS shoshi_nm ";
	sql += "  , sh.mihon_suryo ";
	sql += "  , sh.hanbai_chiiki ";
	sql += "  , ko02.cd_naiyo AS hanbai_chiiki_nm ";
	sql += "  , sh.shohin_hansokubutsu_hanbetsu ";
	sql += "  , ko40.cd_naiyo AS shohin_hansokubutsu_hanbetsu_nm ";
	sql += "FROM ";
	sql += "  lo_t_kyodaku_shohin AS sh ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_SHOSHI + "' ";
	sql += "    AND ko01.cd_id = sh.shoshi ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_HANBAI_CHIIKI + "' ";
	sql += "    AND ko02.cd_id = sh.hanbai_chiiki ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko40 ";
	sql += "    ON (ko40.cd_cls_id = '" + Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU + "' ";
	sql += "    AND ko40.cd_id = sh.shohin_hansokubutsu_hanbetsu ";
	sql += "    AND ko40.sakujo_flg ='0') ";
	sql += "WHERE ";
	sql += "  sh.sakujo_flg = '0' ";
	sql += "  AND sh.kyodaku_id = ? ";
	sql += "ORDER BY ";
	sql += "  sh.kyodaku_edaban ";

    var params = [];
    params.push(DbParameter.string(kyodakuId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveShohinList]　商品情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 添付ファイル情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveTempuFileList(kyodakuId) {
	Logger.getLogger().info(' [retrieveTempuFileList]　添付ファイル情報検索');
	
    var sql = ""; 
	sql = sql + "SELECT ";
	sql = sql + "  tf.kyodaku_id ";
	sql = sql + "  , tf.file_no ";
	sql = sql + "  , tf.file_name ";
	sql = sql + "  , tf.file_path ";
	sql = sql + "FROM ";
	sql = sql + "  lo_t_kyodaku_tempu_file AS tf ";
	sql = sql + "WHERE ";
	sql = sql + "  tf.sakujo_flg = '0' ";
	sql = sql + "  AND tf.kyodaku_id = ? ";
	sql = sql + "ORDER BY ";
	sql = sql + "  tf.file_no ";

    var params = [];
    params.push(DbParameter.string(kyodakuId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveTempuFileList]　添付ファイル情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}