// 定数読み込み
Constant.load("lo/common_libs/lo_const");
/**
 * ユーザー情報取得処理
 * 
 */
function getUserInfo() {

	var userInfo = {};

	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	userInfo.userCd = userContext.userProfile.userCd;
	userInfo.userName = userContext.userProfile.userName;

	// 所属グループ判断
	userInfo.bneFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_BNE) == true ? "1" : "0");
	userInfo.licenseProductionFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION) == true ? "1" : "0");
	userInfo.licenseeFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE) == true ? "1" : "0");
	userInfo.contractFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_CONTRACT) == true ? "1" : "0");
	userInfo.accountFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_ACCOUNT) == true ? "1" : "0");


	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	userInfo.userCompanyDepartment = userCompanyDepartment;

	Logger.getLogger().info(' [getUserInfo]　userInfo ' + ImJson.toJSONString(userInfo, true));

	return userInfo;
}

/**
 * 契約内容情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuNaiyoData(keiyakuNaiyoId) {

	Logger.getLogger().info(' [retrieveKeiyakuNaiyoData]　契約内容情報検索');

	var userInfo = getUserInfo();

    var sql = ""; 

	sql += "SELECT ";
	sql += "  kn.keiyaku_naiyo_id ";
	sql += "  , kn.keiyakusho_hyodai ";
	sql += "  , ko01.cd_naiyo AS keiyakusho_hyodai_nm ";
	sql += "  , kn.keiyaku_cls ";
	sql += "  , ko02.cd_naiyo AS keiyaku_cls_nm ";
	sql += "  , kn.keiyaku_naiyo_nm ";
	sql += "  , kn.ringi_sinsei_no ";
	sql += "  , kn.ringi_sinsei_nm ";
	sql += "  , kn.homu_soudan_no ";
	sql += "  , kn.keiyaku_hokan_no ";
	sql += "  , kn.saiteihosho_ryo ";
	sql += "  , kn.sozai_seisaku_hi ";
	sql += "  , kn.keiyakusho_baitai ";
	sql += "  , ko06.cd_naiyo AS keiyakusho_baitai_nm ";
	sql += "  , kn.ryoritsu ";
	sql += "  , kn.keiyaku_status ";
	sql += "  , ko03.cd_naiyo AS keiyaku_status_nm ";
	sql += "  , kn.keiyaku_biko ";
	sql += "  , kn.kaisha_id ";
	sql += "  , kn.kaisha_nm ";
	sql += "  , kn.busyo_id ";
	sql += "  , kn.busyo_nm ";
	sql += "  , kn.licensee_keiyaku_tanto_id ";
	sql += "  , kn.licensee_keiyaku_tanto_nm ";
	sql += "  , to_char(kn.saisyu_kakunin_bi, 'YYYY/MM/DD') AS saisyu_kakunin_bi  ";
	sql += "  , to_char(kn.keiyaku_teiketu_bi, 'YYYY/MM/DD') AS keiyaku_teiketu_bi  ";
	sql += "  , to_char(kn.keiyaku_kaishi_bi, 'YYYY/MM/DD') AS keiyaku_kaishi_bi  ";
	sql += "  , kn.keiyaku_encho_cls ";
	sql += "  , ko04.cd_naiyo AS keiyaku_encho_cls_nm ";
	sql += "  , kn.tsuika_seisan_cls ";
	sql += "  , ko05.cd_naiyo AS tsuika_seisan_cls_nm ";
	sql += "  , kn.keiyaku_manryo_bi ";
	sql += "  , kn.kyodaku_chiiki ";
	sql += "  , kn.biko ";
	sql += "  , kn.sakujo_flg ";
	sql += "  , kn.touroku_sha ";
	sql += "  , to_char(kn.touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi  ";
	sql += "  , kn.koushin_sha ";
	sql += "  , to_char(kn.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi  ";
	sql += "  , user_koushin.user_name AS koushin_sha_nm ";
	sql += "  , (SELECT TO_CHAR(SUM(c.cnt), '0') AS cnt ";
	sql += "     FROM ( ";
	sql += "       SELECT COUNT(cnt1.kyodaku_id) AS cnt ";
	sql += "       FROM lo_t_keiyaku_naiyo_kyodaku_himozuke cnt1 ";
	sql += "       WHERE cnt1.keiyaku_naiyo_id=kn.keiyaku_naiyo_id AND cnt1.sakujo_flg='0' ";
	sql += "       UNION ALL ";
	sql += "       SELECT COUNT(cnt2.kikaku_id) AS cnt ";
	sql += "       FROM lo_t_keiyaku_naiyo_kikaku_himozuke cnt2 ";
	sql += "       WHERE cnt2.keiyaku_naiyo_id=kn.keiyaku_naiyo_id AND cnt2.sakujo_flg='0' ";
	sql += "       UNION ALL ";
	sql += "       SELECT COUNT(cnt3.bunsho_id) AS cnt ";
	sql += "       FROM lo_t_keiyaku_naiyo_kawari_himozuke cnt3 ";
	sql += "       WHERE cnt3.keiyaku_naiyo_id=kn.keiyaku_naiyo_id AND cnt3.sakujo_flg='0' ";
	sql += "     ) c) AS cnt_ky_ki ";
	sql += "  , kn.keiyakusho_sofusaki_tanto_id ";
	sql += "  , kn.seikyusho_sofusaki_eda ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo AS kn ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKUSHO_HYODAI + "' ";
	sql += "    AND ko01.cd_id = kn.keiyakusho_hyodai ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = kn.keiyaku_cls ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + (userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_STATUS_PR : Constant.LO_CDCLS_KEIYAKU_STATUS_LI) + "' ";
	sql += "    AND ko03.cd_id = kn.keiyaku_status ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "    ON (ko04.cd_cls_id = '" + (userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_PR : Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_LI) + "' ";
	sql += "    AND ko04.cd_id = kn.keiyaku_encho_cls ";
	sql += "    AND ko04.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_TSUIKA_SEISAN_CLS + "' ";
	sql += "    AND ko05.cd_id = kn.tsuika_seisan_cls ";
	sql += "    AND ko05.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
	sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKUSHO_BAITAI + "' ";
	sql += "    AND ko06.cd_id = kn.keiyakusho_baitai ";
	sql += "    AND ko06.sakujo_flg ='0') ";
	sql += "  LEFT JOIN imm_user AS user_koushin ";
	sql += "    ON (user_koushin.user_cd = kn.koushin_sha ";
	sql += "    AND user_koushin.locale_id = 'ja' ";
	sql += "    AND user_koushin.start_date <= CURRENT_DATE ";
	sql += "    AND user_koushin.end_date > CURRENT_DATE ";
	sql += "    AND user_koushin.delete_flag ='0') ";
	sql += "WHERE ";
	sql += "  kn.sakujo_flg = '0' ";
	sql += "  AND kn.keiyaku_naiyo_id = ? ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId));

	// sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKeiyakuNaiyoData]　契約内容情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

function retrieveKeiyakuNaiyoGemponHimozukeData(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKeiyakuNaiyoData]　契約内容原本情報検索');

	var userInfo = getUserInfo();
	
	var sql = ""; 
	
	sql += "SELECT ";
	sql += "  kngh.keiyaku_naiyo_id ";
	sql += "  , kngh.gempon_keiyaku_naiyo_id ";
	sql += "  , kngh.mae_keiyaku_naiyo_id ";
	sql += "  , kngh.sakujo_flg ";
	sql += "  , kngh.touroku_sha ";
	sql += "  , to_char(kngh.touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi  ";
	sql += "  , kngh.koushin_sha ";
	sql += "  , to_char(kngh.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi  ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_gempon_himozuke AS kngh ";
	sql += "WHERE ";
	sql += "  kngh.sakujo_flg = '0' ";
	sql += "  AND kngh.keiyaku_naiyo_id = ? ";
	
	var params = [];
	params.push(DbParameter.string(keiyakuNaiyoId));
	
	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKeiyakuNaiyoData]　契約内容原本情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
	var result = db.select(sql, params, 0);
	return result;
}

function retrieveKeiyakuNaiyoTsugiHimozukeData(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKeiyakuNaiyoData]　契約内容次情報検索');

	var userInfo = getUserInfo();
	
	var sql = ""; 
	
	sql += "SELECT ";
	sql += "  kngh.keiyaku_naiyo_id ";
	sql += "  , kngh.gempon_keiyaku_naiyo_id ";
	sql += "  , kngh.mae_keiyaku_naiyo_id ";
	sql += "  , kngh.sakujo_flg ";
	sql += "  , kngh.touroku_sha ";
	sql += "  , to_char(kngh.touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi  ";
	sql += "  , kngh.koushin_sha ";
	sql += "  , to_char(kngh.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi  ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_gempon_himozuke AS kngh ";
	sql += "WHERE ";
	sql += "  kngh.sakujo_flg = '0' ";
	sql += "  AND kngh.mae_keiyaku_naiyo_id = ? ";
	
	var params = [];
	params.push(DbParameter.string(keiyakuNaiyoId));
	
	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKeiyakuNaiyoData]　契約内容次情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
	var result = db.select(sql, params, 0);
	return result;
}

/**
 * 追加契約の元契約のステータスを取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuNaiyoMotoKeiyakuStatus(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKeiyakuNaiyoMotoKeiyakuStatus]　追加契約の元契約のステータスを取得');

	var sql = "select ";
	
	sql += "k.keiyaku_naiyo_id";
	sql += ",ko.cd_naiyo keiyaku_status";
	sql += ",k.keiyaku_naiyo_nm";
	sql += ",h.kyodaku_id";
	sql += ",kh.moto_kyodaku_id";
	sql += ",h2.keiyaku_naiyo_id moto_keiyaku_id";
	sql += ",ko2.cd_naiyo moto_keiyaku_status ";
	sql += "from lo_t_keiyaku_naiyo k ";
	sql += "inner join lo_t_keiyaku_naiyo_kyodaku_himozuke h ";
	sql += "on k.keiyaku_naiyo_id = h.keiyaku_naiyo_id ";
	sql += "and k.sakujo_flg='0' and h.sakujo_flg='0' ";
	sql += "inner join lo_t_kyodaku kd ";
	sql += "on h.kyodaku_id = kd.kyodaku_id ";
	sql += "and kd.sakujo_flg='0' ";
	sql += "inner join lo_t_moto_kyodaku_himozuke kh ";
	sql += "on kd.kyodaku_id = kh.kyodaku_id and kh.sakujo_flg='0' ";
	sql += " inner join lo_t_kyodaku kd2 ";
	sql += "on kh.kyodaku_id = kd2.kyodaku_id and kd2.sakujo_flg='0' ";
	sql += "inner join lo_t_keiyaku_naiyo_kyodaku_himozuke h2 ";
	sql += "on kh.moto_kyodaku_id = h2.kyodaku_id and h2.sakujo_flg='0'";
	sql += " inner join lo_t_keiyaku_naiyo k2 on h2.keiyaku_naiyo_id = k2.keiyaku_naiyo_id and k2.sakujo_flg='0'";
	sql += " left join lo_m_koteichi ko on k.keiyaku_status = ko.cd_id and ko.cd_cls_id='0060' and ko.sakujo_flg ='0' "
	sql += " left join lo_m_koteichi ko2 on k2.keiyaku_status = ko2.cd_id and ko2.cd_cls_id='0060' and ko2.sakujo_flg ='0' ";
	sql += " where k.keiyaku_naiyo_id = ? ";
	sql +="  and kd.kyodaku_cls='2'";
		
	// 条件設定
	var strParam=[];
	strParam.push(DbParameter.string(keiyakuNaiyoId))
	
	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);
	Logger.getLogger().debug('[retrieveKeiyakuNaiyoMotoKeiyakuStatus]　追加契約の元契約のステータスを取得 SQL ' + sql + " params " + ImJson.toJSONString(result, true));
	return result;
}

/**
 * 企画情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKikakuList]　企画情報検索');
    var sql = ""; 
	sql += "SELECT ";
	sql += "  ki.kikaku_id ";
	sql += "  , ki.kikaku_nm ";
	sql += "  , ki.ip_cd ";
	sql += "  , ki.ip_nm ";
	sql += "  , ki.title_cd ";
	sql += "  , ki.title_nm ";
	sql += "  , ki.kaisha_id ";
	sql += "  , ki.kaisha_nm ";
	sql += "  , ki.busyo_id ";
	sql += "  , ki.busyo_nm ";
	sql += "  , ki.tantou_sha ";
	sql += "  , ki.bne_tantou_sha ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_kikaku_himozuke AS hi ";
	sql += "  INNER JOIN lo_t_kikaku AS ki ";
	sql += "    ON (ki.kikaku_id = hi.kikaku_id) ";
	sql += "WHERE ";
	sql += "  hi.sakujo_flg = '0' ";
	sql += "  AND ki.sakujo_flg = '0' ";
	sql += "  AND hi.keiyaku_naiyo_id = ? ";
	sql += "ORDER BY ";
	sql += "  hi.id ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKikakuList]　企画情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 許諾情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKyodakuList]　許諾情報検索');
    var sql = ""; 
	sql += "SELECT ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko02.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , string_agg(DISTINCT ki.ip_cd, ',' ORDER BY ki.ip_cd) AS ip_cd ";
	sql += "  , string_agg(DISTINCT ki.ip_nm, ',' ORDER BY ki.ip_nm) AS ip_nm ";
	sql += "  , string_agg(DISTINCT ki.title_cd, ',' ORDER BY ki.title_cd) AS title_cd ";
	sql += "  , string_agg(DISTINCT ki.title_nm, ',' ORDER BY ki.title_nm) AS title_nm ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.busyo_id ";
	sql += "  , ky.busyo_nm ";
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , ky.bne_tantou_sha ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_kyodaku_himozuke AS knkh ";
	sql += "  INNER JOIN lo_t_kyodaku AS ky ";
	sql += "    ON (ky.kyodaku_id = knkh.kyodaku_id) ";
	sql += "  INNER JOIN lo_t_kyodaku_kikaku_himozuke AS kkh ";
	sql += "    ON (kkh.kyodaku_id = ky.kyodaku_id) ";
	sql += "  INNER JOIN lo_t_kikaku AS ki ";
	sql += "    ON (ki.kikaku_id = kkh.kikaku_id) ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = ky.kyodaku_cls ";
	sql += "    AND ko02.sakujo_flg = '0') ";
	sql += "WHERE ";
	sql += "  knkh.sakujo_flg = '0' ";
	sql += "  AND ky.sakujo_flg = '0' ";
	sql += "  AND kkh.sakujo_flg = '0' ";
	sql += "  AND ki.sakujo_flg = '0' ";
	sql += "  AND knkh.keiyaku_naiyo_id = ? ";
	sql += "GROUP BY ";
	sql += "  ky.kyodaku_id ";
	sql += "  , ky.kyodaku_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko02.cd_naiyo ";
	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.busyo_id ";
	sql += "  , ky.busyo_nm ";
	sql += "  , ky.tantou_sha_id ";
	sql += "  , ky.tantou_sha_nm ";
	sql += "  , ky.bne_tantou_sha ";
	sql += "ORDER BY ";
	sql += "  ky.kyodaku_id ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKyodakuList]　許諾情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 代わり承認申請情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKawariList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveKawariList]　代わり承認申請情報検索');
    var sql = ""; 
	sql += "SELECT ";
	sql += "  kw.bunsho_id ";
	sql += "  , kw.bunsho_nm ";
	sql += "  , kw.bunsho_cls ";
	sql += "  , ko01.cd_naiyo AS bunsho_cls_nm ";
	sql += "  , kw.kyodaku_cls ";
	sql += "  , ko02.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , kw.ip_cd ";
	sql += "  , kw.ip_nm ";
	sql += "  , kw.title_cd ";
	sql += "  , kw.title_nm ";
	sql += "  , kaisha_id ";
	sql += "  , CASE WHEN kw.bunsho_cls = '" + Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL + "' ";
	sql += "         THEN ko03.cd_naiyo ELSE kw.kaisha_nm END AS kaisha_nm ";
	sql += "  , kw.kian_sha_nm AS bne_tantou_sha ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_kawari_himozuke AS knkh ";
	sql += "  INNER JOIN lo_t_kawari AS kw ";
	sql += "    ON (kw.bunsho_id = knkh.bunsho_id) ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KAWARI_DOC_TYPE + "' ";
	sql += "    AND ko01.cd_id = kw.bunsho_cls ";
	sql += "    AND ko01.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = kw.kyodaku_cls ";
	sql += "    AND ko02.sakujo_flg = '0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND ko03.cd_id = kw.kaigai_hansha_cd ";
	sql += "    AND ko03.sakujo_flg = '0') ";
	sql += "WHERE ";
	sql += "  knkh.sakujo_flg = '0' ";
	sql += "  AND kw.sakujo_flg = '0' ";
	sql += "  AND knkh.keiyaku_naiyo_id = ? ";
	sql += "ORDER BY ";
	sql += "  kw.bunsho_cls ";
	sql += "  , kw.bunsho_id ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKyodakuList]　代わり承認申請情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 稟議情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveRingiList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveRingiList]　稟議情報検索');
    var sql = ""; 
	sql += "SELECT ";
	sql += "  * ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_ringi_himozuke AS k ";
	sql += "WHERE ";
	sql += "  k.sakujo_flg = '0' ";
	sql += "  AND k.keiyaku_naiyo_id = ? ";
	sql += "ORDER BY ";
	sql += " k.id ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveRingiList]　稟議申請情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

function retrieveLicenseeCompanyList() {
	Logger.getLogger().info(' [retrieveLicenseeCompanyList]　ライセンシー会社情報検索');
    var sql = ""; 
    sql += "SELECT ";
    sql += "  c.company_cd AS kaisha_id ";
    sql += "  , c.department_name AS kaisha_nm ";
    sql += "FROM ";
    sql += "  imm_department AS c ";
    sql += "WHERE ";
    sql += "  c.company_cd = c.department_cd ";
    sql += "  AND c.locale_id = 'ja' ";
    sql += "  AND c.delete_flag = '0' ";
    sql += "  AND c.company_cd NOT IN ( ";
    sql += "    SELECT ";
    sql += "      cd_naiyo ";
    sql += "    FROM ";
    sql += "      lo_m_koteichi ";
    sql += "    WHERE ";
    sql += "      cd_cls_id = '" + Constant.LO_CDCLS_BNE_COMPANY_CD + "' ";
    sql += "      AND sakujo_flg = '0' ";
    sql += "  ) ";
    sql += "  AND c.company_cd NOT LIKE '9%' ";
    sql += "ORDER BY ";
    sql += "  c.sort_key ";
    sql += "  , c.company_cd ";

    var params = [];
    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveLicenseeCompanyList]　ライセンシー会社情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;

}

	
/**
 * 指定会社に所属するユーザ情報を取得します。
 * 
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveUserList(kaishaId) {
	
    return Content.executeFunction("lo/common_libs/lo_common_fnction", "getCompanyUserList", kaishaId);

}

/**
 * コメント情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveCommentList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveComment]　コメント情報検索');
	
	var userInfo = getUserInfo();
    var params = [];

    var sql = ""; 
	sql += "SELECT ";
	sql += "  cm.keiyaku_naiyo_id ";
	sql += "  , cm.task_id ";
	sql += "  , cm.koukai_hani ";
	sql += "  , cm.naiyo ";
	sql += "  , to_char(cm.touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi  ";
	sql += "  , tsk.irai_sha_user_nm ";
//	sql += "  , CASE WHEN tsk.irai_sha_kaisha_cd IN (SELECT cd_naiyo FROM lo_m_koteichi WHERE cd_cls_id = '" + Constant.LO_CDCLS_BNE_COMPANY_CD + "' AND sakujo_flg = '0') ";
	sql += "  , CASE WHEN cm.koukai_hani = '" + Constant.LO_GROUP_CD_BNE + "' ";
	sql += "    THEN '1' ";
	sql += "    ELSE '0' ";
	sql += "  END AS is_bne ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_comment AS cm ";
	sql += "  INNER JOIN lo_t_keiyaku_naiyo_task AS tsk ";
	sql += "    ON (tsk.keiyaku_naiyo_id = cm.keiyaku_naiyo_id ";
	sql += "    AND tsk.task_id = cm.task_id ";
	sql += "    AND tsk.sakujo_flg = '0') ";
	
	sql += "WHERE ";
	sql += "  cm.sakujo_flg = '0' ";
	sql += "  AND cm.keiyaku_naiyo_id = ? ";
    params.push(DbParameter.string(keiyakuNaiyoId))
	if (userInfo.licenseeFlg == '1') {
		sql += "  AND cm.koukai_hani = ? ";
	    params.push(DbParameter.string(Constant.LO_GROUP_SET_CD));
	}
	sql += "ORDER BY ";
	sql += "  cm.touroku_bi ";

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveComment]　コメント情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 添付ファイル情報取得
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveTempuFileList(keiyakuNaiyoId) {
	Logger.getLogger().info(' [retrieveTempuFileList]　添付ファイル情報検索');
	
    var sql = ""; 
	sql += "SELECT ";
	sql += "  tf.keiyaku_naiyo_id ";
	sql += "  , tf.task_id ";
	sql += "  , tf.file_no ";
	sql += "  , tf.file_name ";
	sql += "  , tf.file_path ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_tempu_file AS tf ";
	sql += "WHERE ";
	sql += "  tf.sakujo_flg = '0' ";
	sql += "  AND tf.keiyaku_naiyo_id = ? ";
	sql += "ORDER BY ";
	sql += "  tf.task_id ";
	sql += "  , tf.file_no ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveTempuFileList]　添付ファイル情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * コメントテンプレート一覧取得
 * 
 * @returns {DatabaseResult} 検索結果
 */
function retrieveCommentTemplateList() {
	Logger.getLogger().info('[retrieveCommentTemplateList]　コメントテンプレート一覧検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ct.comment_template_id ";
	sql += "  , ct.comment_template_nm ";
	sql += "FROM ";
	sql += "  lo_m_comment_template AS ct ";
	sql += "WHERE ";
	sql += "  ct.sakujo_flg = '0' ";
	sql += "ORDER BY ";
	sql += "  ct.sort_no ";

    var params = [];

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveCommentTemplateList]　コメントテンプレート一覧検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * コメントテンプレートコンテンツ取得
 * 
 * @param {number} commentTemplateId コメントテンプレートID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveCommentTemplateContent(commentTemplateId) {
	Logger.getLogger().info('[retrieveCommentTemplateContent]　コメントテンプレートコンテンツ検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ct.comment_template_content ";
	sql += "FROM ";
	sql += "  lo_m_comment_template AS ct ";
	sql += "WHERE ";
	sql += "  ct.sakujo_flg = '0' ";
	sql += "  AND ct.comment_template_id = ? ";
	sql += "ORDER BY ";
	sql += "  ct.sort_no ";

    var params = [];
    params.push(DbParameter.number(commentTemplateId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveCommentTemplateContent]　コメントテンプレートコンテンツ検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 契約内容未処理タスク情報取得
 * 
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuTaskData(keiyakuNaiyoId, taskId) {
	Logger.getLogger().info('[retrieveKeiyakuTaskData]　契約内容タスク情報検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  keiyaku_naiyo_id ";
	sql += "  , task_id ";
	sql += "  , keiyaku_status ";
	sql += "  , irai_sha_kaisha_cd ";
	sql += "  , irai_sha_kaisha_nm ";
	sql += "  , irai_sha_busho_cd ";
	sql += "  , irai_sha_busho_nm ";
	sql += "  , irai_sha_user_cd ";
	sql += "  , irai_sha_user_nm ";
	sql += "  , shori_cls ";
	sql += "  , shori_sha_kaisha_cd ";
	sql += "  , shori_sha_kaisha_nm ";
	sql += "  , shori_sha_busho_cd ";
	sql += "  , shori_sha_busho_nm ";
	sql += "  , shori_sha_user_cd ";
	sql += "  , shori_sha_user_nm ";
	sql += "  , sakujo_flg ";
	sql += "  , touroku_sha ";
	sql += "  , to_char(touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi ";
	sql += "  , koushin_sha ";
	sql += "  , to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_task ";
    sql += "WHERE ";
    sql += "  keiyaku_naiyo_id = ? ";
    sql += "  AND task_id = ? ";
    sql += "  AND sakujo_flg = '0'";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId));
    params.push(DbParameter.string(taskId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveKeiyakuTaskData]　契約内容タスク情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
	Logger.getLogger().info('[retrieveKeiyakuTaskData]　契約内容タスク情報検索 result ' + ImJson.toJSONString(result, true));
    return result;
	
}

/**
 * 契約内容未処理タスク情報取得
 * 
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuUntreatedTaskData(keiyakuNaiyoId) {
	Logger.getLogger().info('[retrieveKeiyakuUntreatedTaskData]　契約内容未処理タスク情報検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  keiyaku_naiyo_id ";
	sql += "  , task_id ";
	sql += "  , keiyaku_status ";
	sql += "  , irai_sha_kaisha_cd ";
	sql += "  , irai_sha_kaisha_nm ";
	sql += "  , irai_sha_busho_cd ";
	sql += "  , irai_sha_busho_nm ";
	sql += "  , irai_sha_user_cd ";
	sql += "  , irai_sha_user_nm ";
	sql += "  , shori_cls ";
	sql += "  , shori_sha_kaisha_cd ";
	sql += "  , shori_sha_kaisha_nm ";
	sql += "  , shori_sha_busho_cd ";
	sql += "  , shori_sha_busho_nm ";
	sql += "  , shori_sha_user_cd ";
	sql += "  , shori_sha_user_nm ";
	sql += "  , sakujo_flg ";
	sql += "  , touroku_sha ";
	sql += "  , to_char(touroku_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS touroku_bi ";
	sql += "  , koushin_sha ";
	sql += "  , to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_task ";
    sql += "WHERE ";
    sql += "  keiyaku_naiyo_id = ? ";
    sql += "  AND shori_cls = ? ";
    sql += "  AND sakujo_flg = '0' ";

    var params = [];
    params.push(DbParameter.string(keiyakuNaiyoId));
    params.push(DbParameter.string(Constant.LO_TASK_SHORI_CLS_MISHORI));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveKeiyakuUntreatedTaskData]　契約内容未処理タスク情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
	Logger.getLogger().info('[retrieveKeiyakuUntreatedTaskData]　契約内容未処理タスク情報検索 result ' + ImJson.toJSONString(result, true));
    return result;
	
}

/**
 * 契約内容タスク対象情報取得
 * 
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @param {string} taskId タスクID
 * @param {array} recipientTypes 受信タイプ
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuTaskTargetData(keiyakuNaiyoId, taskId, recipientTypes) {
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetData]　契約内容タスク対象情報検索');

    var sql = ""; 
    sql += "SELECT * FROM lo_t_keiyaku_naiyo_task_target WHERE sakujo_flg = '0' ";

    var param = {};
    param.keiyakuNaiyoId = keiyakuNaiyoId;
    param.taskId = taskId;
    if (recipientTypes) {
        param.recipientTypes = recipientTypes;
    }
    

	// 画面入力項目とDB項目のマッピング　todo 画面入力項目に合わせて追加
    var columnNameMap = {};
    columnNameMap["keiyakuNaiyoId"] = {col:"keiyaku_naiyo_id",comp:"eq"};
    columnNameMap["taskId"] = {col:"task_id",comp:"eq"};
    columnNameMap["recipientTypes"] = {col:"recipient_type",comp:"in"};

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetData]　契約内容タスク対象情報検索 SQL ' + sql + " params " + ImJson.toJSONString(condition.bindParams, true));
    var result = db.select(sql, condition.bindParams, 0);
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetData]　契約内容タスク対象情報検索 result ' + ImJson.toJSONString(result, true));
    return result;
	
}

function retrieveKeiyakuEnchoTantoGroupCds(keiyakuNaiyoId) {

	Logger.getLogger().info('[retrieveKeiyakuEnchoTantoGroupCds]　契約延長担当グループCD keiyakuNaiyoId ' + keiyakuNaiyoId);

	var kyodakuResult = retrieveKyodakuList(keiyakuNaiyoId);
	var kikakuResult = retrieveKikakuList(keiyakuNaiyoId);
	var kawariResult = retrieveKawariList(keiyakuNaiyoId);

	var param = {};
	param["KD"] = [];
	param["KK"] = [];
	param["KW"] = [];

    if (kyodakuResult.countRow > 0) {
    	for (var key in kyodakuResult.data) {
    		param["KD"].push(kyodakuResult.data[key].kyodaku_id);
    	}
    }

    if (kikakuResult.countRow > 0) {
    	for (var key in kikakuResult.data) {
    		param["KK"].push(kikakuResult.data[key].kikaku_id);
    	}
    }
    
    if (kawariResult.countRow > 0) {
    	for (var key in kawariResult.data) {
    		param["KW"].push(kawariResult.data[key].bunsho_id);
    	}
    }
    
    var groupList = [];
    
    for (var ticket_Type in param) {
    	var ticketIds = param[ticket_Type];
    	for (var key in ticketIds) {
    		var ticket_id = ticketIds[key];
    		var resultList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getIpGroupList", ticket_id, ticket_Type)
    		groupList = groupList.concat(resultList);
    	}
	}
    
    // 重複を削除
	var ipTantoGroupCds = groupList.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

	Logger.getLogger().info('[retrieveKeiyakuEnchoTantoGroupCds]　契約延長担当グループCD ipTantoGroupCds ' + ImJson.toJSONString(ipTantoGroupCds, true));
	
    return ipTantoGroupCds;
}

function retrieveKeiyakuEnchoTantoUsers(keiyakuNaiyoId) {

	Logger.getLogger().info('[retrieveKeiyakuEnchoTantoUsers]　契約延長担当ユーザ keiyakuNaiyoId ' + keiyakuNaiyoId);

	var ipTantoGroupCds = retrieveKeiyakuEnchoTantoGroupCds(keiyakuNaiyoId);
	
	Logger.getLogger().info('[retrieveKeiyakuEnchoTantoUsers]　ipTantoGroupCds ' + ImJson.toJSONString(ipTantoGroupCds, true));

    return retrievePublicGroupUsers(ipTantoGroupCds);
}

function retrievePublicGroupUsers(publicGroupCds) {
	var sql = "";
	sql += "SELECT DISTINCT ";
	sql += "  u.user_cd ";
	sql += "  , u.user_name AS user_nm ";
	sql += "  , u.email_address1 ";
	sql += "FROM ";
	sql += "  imm_public_grp_ath AS pga ";
	sql += "  LEFT JOIN  imm_user AS u ";
	sql += "    ON (u.user_cd = pga.user_cd ";
	sql += "    AND u.locale_id = 'ja' ";
	sql += "    AND u.start_date <= CURRENT_DATE ";
	sql += "    AND u.end_date > CURRENT_DATE ";
	sql += "    AND u.delete_flag = '0') ";
	sql += "WHERE ";
	sql += "    pga.start_date <= CURRENT_DATE ";
	sql += "    AND pga.end_date > CURRENT_DATE ";
	sql += "    AND pga.delete_flag = '0' ";

    var columnNameMap = {};
    columnNameMap["publicGroupSetCd"] = {col:"pga.public_group_set_cd", comp:"eq"};
    columnNameMap["publicGroupCds"] = {col:"pga.public_group_cd", comp:"in"};
    
    var param = {};
    param.publicGroupSetCd = Constant.LO_GROUP_SET_CD;
    param.publicGroupCds = publicGroupCds;

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    
    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;
	Logger.getLogger().info('[retrievePublicGroupUsers]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);

	var users = [];
    if (result.countRow > 0) {
    	users = users.concat(result.data);
    }

	Logger.getLogger().info('[retrievePublicGroupUsers]　users ' + ImJson.toJSONString(users, true));
    return users;
}

function retrieveCommentDestinationPresetList(isMyList) {
	var userInfo = getUserInfo();
	var sql = "";
    sql += "SELECT ";
    sql += "  cdp.preset_id ";
    sql += "  , cdp.owner_id ";
    sql += "  , cdp.preset_nm ";
    sql += "  , to_char(cdp.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
    sql += "FROM ";
    sql += "  lo_m_comment_destination_preset AS cdp ";
    sql += "WHERE ";
    sql += "  sakujo_flg = '0' ";
    
    var columnNameMap = {};
    var param = {};
    columnNameMap["userCds"] = {col:"cdp.owner_id", comp:"in"};
    param.userCds = [userInfo.userCd];
    if (!isMyList) {
    	param.userCds.push("tenant");
    }
    

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);

    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;
    sql += "ORDER BY ";
    sql += "  cdp.preset_id ";

	Logger.getLogger().info('[retrieveCommentDestinationPresetList]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveCommentDestinationPresetList]　result ' + ImJson.toJSONString(result, true));
    return result;
}

function retrieveCommentDestinationPreset(presetId) {
	var sql = "";
    sql += "SELECT ";
    sql += "  cdp.preset_id ";
    sql += "  , cdp.owner_id ";
    sql += "  , cdp.preset_nm ";
    sql += "  , to_char(cdp.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
    sql += "FROM ";
    sql += "  lo_m_comment_destination_preset AS cdp ";
    sql += "WHERE ";
    sql += "  sakujo_flg = '0' ";
    
    var columnNameMap = {};
    columnNameMap["presetId"] = {col:"cdp.preset_id", comp:"eq"};
    
    var param = {};
    param.presetId = presetId;

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);

    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;

	Logger.getLogger().info('[retrieveCommentDestinationPreset]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveCommentDestinationPreset]　result ' + ImJson.toJSONString(result, true));
    return result;
}

function retrieveCommentDestinationPresetTarget(presetId) {
	var sql = "";
    sql += "SELECT ";
    sql += "  cdpt.preset_id ";
    sql += "  , cdpt.preset_item_no ";
    sql += "  , cdpt.recipient_type ";
    sql += "  , cdpt.target_type ";
    sql += "  , cdpt.matter_attr_cd ";
    sql += "  , cdpt.public_group_set_cd ";
    sql += "  , cdpt.public_group_cd ";
    sql += "  , pg.public_group_name ";
    sql += "  , cdpt.company_cd ";
    sql += "  , d.department_name";
    sql += "  , cdpt.user_cd ";
    sql += "  , u.user_name ";
    sql += "FROM ";
    sql += "  lo_m_comment_destination_preset_target AS cdpt ";
    sql += "  LEFT JOIN imm_public_grp AS pg ";
    sql += "    ON (pg.public_group_set_cd = cdpt.public_group_set_cd ";
    sql += "    AND pg.public_group_cd = cdpt.public_group_cd ";
    sql += "    AND pg.locale_id = 'ja' ";
    sql += "    AND pg.start_date <= CURRENT_DATE ";
    sql += "    AND pg.end_date > CURRENT_DATE ";
    sql += "    AND pg.delete_flag = '0') ";
    sql += "  LEFT JOIN imm_department AS d ";
    sql += "    ON (d.company_cd = cdpt.company_cd ";
    sql += "    AND d.department_cd = cdpt.company_cd ";
    sql += "    AND d.locale_id = 'ja' ";
    sql += "    AND d.start_date <= CURRENT_DATE ";
    sql += "    AND d.end_date > CURRENT_DATE ";
    sql += "    AND d.delete_flag = '0') ";
    sql += "  LEFT JOIN imm_user AS u ";
    sql += "    ON (u.user_cd = cdpt.user_cd";
    sql += "    AND u.locale_id = 'ja' ";
    sql += "    AND u.start_date <= CURRENT_DATE ";
    sql += "    AND u.end_date > CURRENT_DATE ";
    sql += "    AND u.delete_flag = '0') ";
    sql += "WHERE ";
    sql += "  cdpt.sakujo_flg = '0' ";

    var columnNameMap = {};
    columnNameMap["presetId"] = {col:"cdpt.preset_id", comp:"eq"};
    
    var param = {};
    param.presetId = presetId;

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);

    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;
    sql += "ORDER BY ";
    sql += "  cdpt.preset_id ";
    sql += "  , cdpt.preset_item_no ";

	Logger.getLogger().info('[retrieveCommentDestinationPresetTarget]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveCommentDestinationPresetTarget]　result ' + ImJson.toJSONString(result, true));
    return result;
}

function retrieveCommentDestinationPresetTargetUserData(presetId) {
	var sql = "";
    sql += "WITH valid_user(user_cd, user_name, email_address1, is_bne) AS ( ";
    sql += "  SELECT ";
    sql += "    u.user_cd ";
    sql += "    , u.user_name ";
    sql += "    , u.email_address1 ";
    sql += "    , CASE WHEN EXISTS ";
    sql += "      (SELECT ";
    sql += "        * ";
    sql += "      FROM ";
    sql += "        imm_department_ath AS da ";
    sql += "      WHERE ";
    sql += "        da.company_cd IN (SELECT cd_naiyo FROM lo_m_koteichi WHERE cd_cls_id = '" + Constant.LO_CDCLS_BNE_COMPANY_CD + "' AND sakujo_flg = '0') ";
    sql += "        AND da.user_cd = u.user_cd ";
    sql += "        AND da.start_date <= CURRENT_DATE ";
    sql += "        AND da.end_date > CURRENT_DATE ";
    sql += "        AND da.delete_flag = '0') ";
    sql += "      THEN '1' ";
    sql += "      ELSE '0' ";
    sql += "    END AS is_bne ";
    sql += "  FROM ";
    sql += "    imm_user AS u ";
    sql += "  WHERE ";
    sql += "    u.locale_id = 'ja' ";
    sql += "    AND u.start_date <= CURRENT_DATE ";
    sql += "    AND u.end_date > CURRENT_DATE ";
    sql += "    AND u.delete_flag = '0' ";
    sql += ") ";
    sql += "SELECT ";
    sql += "  cdpt.preset_id ";
    sql += "  , cdpt.preset_item_no ";
    sql += "  , cdpt.recipient_type ";
    sql += "  , cdpt.target_type ";
    sql += "  , cdpt.matter_attr_cd ";
    sql += "  , cdpt.public_group_set_cd ";
    sql += "  , cdpt.public_group_cd ";
    sql += "  , cdpt.company_cd ";
    sql += "  , CASE ";
    sql += "    WHEN cdpt.target_type = '" +Constant. LO_PRESET_TARGET_TYPE_PUBLIC_GROUP + "' THEN pga.user_cd ";
    sql += "    ELSE cdpt.user_cd ";
    sql += "  END AS user_cd ";
    sql += "  , CASE ";
    sql += "    WHEN cdpt.target_type = '" +Constant. LO_PRESET_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.user_name ";
    sql += "    ELSE u.user_name ";
    sql += "  END AS user_nm ";
    sql += "  , CASE ";
    sql += "    WHEN cdpt.target_type = '" +Constant. LO_PRESET_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.email_address1 ";
    sql += "    ELSE u.email_address1 ";
    sql += "  END AS email_address1 ";
    sql += "  , CASE ";
    sql += "    WHEN cdpt.target_type = '" +Constant. LO_PRESET_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.is_bne ";
    sql += "    ELSE u.is_bne ";
    sql += "  END AS is_bne ";
    sql += "FROM ";
    sql += "  lo_m_comment_destination_preset_target AS cdpt ";
    sql += "  LEFT JOIN imm_public_grp_ath AS pga ";
    sql += "    ON (pga.public_group_set_cd = cdpt.public_group_set_cd ";
    sql += "    AND pga.public_group_cd = cdpt.public_group_cd ";
    sql += "    AND pga.start_date <= CURRENT_DATE ";
    sql += "    AND pga.end_date > CURRENT_DATE ";
    sql += "    AND pga.delete_flag = '0') ";
    sql += "  LEFT JOIN valid_user AS pgau ";
    sql += "    ON (pgau.user_cd = pga.user_cd) ";
    sql += "  LEFT JOIN valid_user AS u ";
    sql += "    ON (u.user_cd = cdpt.user_cd) ";
    sql += "WHERE ";
    sql += "  cdpt.sakujo_flg = '0' ";
    //ユーザ名を取得できなかったユーザを除外する
	sql += " AND ( ";
    sql += "  (cdpt.target_type ='public_group' and (pgau.user_name is not null OR u.user_name is not null)) or ";
    sql += "  (cdpt.target_type <>'public_group')";
    sql += " ) ";
	
    var columnNameMap = {};
    columnNameMap["presetId"] = {col:"cdpt.preset_id", comp:"eq"};
    
    var param = {};
    param.presetId = presetId;

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);

    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;
    sql += "ORDER BY ";
    sql += "  cdpt.preset_id ";
    sql += "  , cdpt.preset_item_no ";

	Logger.getLogger().info('[retrieveCommentDestinationPresetTargetUserData]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveCommentDestinationPresetTargetUserData]　result ' + ImJson.toJSONString(result, true));
    return result;
}

function retrieveWorkflowTaskHistory(ticketIds) {
    var allBindParams = [];
    var sql = "";
    sql += "WITH latest_numbering_matter_task (system_matter_id, flow_id, matter_name, status, task_id, node_id, node_name, create_date, task_status, latest_order ";
    sql += "  , locale_id, auth_user_code, auth_user_name, auth_company_code, auth_company_name, auth_orgz_set_code, auth_orgz_code, auth_orgz_name ";
    sql += "  , execute_user_code, execute_user_name, operate_user_code, operate_user_name) AS ( ";
    sql += "SELECT ";
    sql += "  cm.system_matter_id ";
    sql += "  , cm.flow_id ";
    sql += "  , cm.matter_name ";
    sql += "  , cm.status ";
    sql += "  , cmt.task_id ";
    sql += "  , cmt.node_id ";
    sql += "  , cmt.node_name ";
    sql += "  , cmt.create_date ";
    sql += "  , cmt.status AS task_status ";
    sql += "  , ROW_NUMBER() OVER (PARTITION BY cm.system_matter_id, cmt.node_id ORDER BY cmt.create_date DESC) AS latest_order ";
    sql += "  , cmu.locale_id ";
    sql += "  , cmu.auth_user_code ";
    sql += "  , cmu.auth_user_name ";
    sql += "  , cmu.auth_company_code ";
    sql += "  , cmu.auth_company_name ";
    sql += "  , cmu.auth_orgz_set_code ";
    sql += "  , cmu.auth_orgz_code ";
    sql += "  , cmu.auth_orgz_name ";
    sql += "  , cmu.execute_user_code ";
    sql += "  , cmu.execute_user_name ";
    sql += "  , cmu.operate_user_code ";
    sql += "  , cmu.operate_user_name ";
    sql += "FROM ";
    sql += "  imw_t_cpl_matter AS cm ";
    sql += "  INNER JOIN imw_t_cpl_matter_task AS cmt ";
    sql += "    ON (cmt.system_matter_id = cm.system_matter_id) ";
    sql += "  INNER JOIN imw_t_cpl_matter_user AS cmu ";
    sql += "    ON (cmu.system_matter_id = cmt.system_matter_id ";
    sql += "    AND cmu.task_id = cmt.task_id ";
    sql += "    AND cmu.locale_id = 'ja') ";
    sql += "WHERE ";
    sql += "  1 = 1 ";

    var cmColumnNameMap = {};
    cmColumnNameMap["ticketIds"] = {col:"cm.matter_name", comp:"in"};
    var cmParam = {};
    cmParam.ticketIds = ticketIds;
    var cmCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", cmParam, cmColumnNameMap);
	allBindParams = allBindParams.concat(cmCondition.bindParams);
    sql += cmCondition.sql;

    sql += "UNION ";
    sql += "SELECT ";
    sql += "  am.system_matter_id ";
    sql += "  , am.flow_id ";
    sql += "  , am.matter_name ";
    sql += "  , 'active' AS status ";
    sql += "  , amt.task_id ";
    sql += "  , amt.node_id ";
    sql += "  , amt.node_name ";
    sql += "  , amt.create_date ";
    sql += "  , amt.status AS task_status ";
    sql += "  , ROW_NUMBER() OVER (PARTITION BY am.system_matter_id, amt.node_id ORDER BY amt.create_date DESC) AS latest_order ";
    sql += "  , amu.locale_id ";
    sql += "  , amu.auth_user_code ";
    sql += "  , amu.auth_user_name ";
    sql += "  , amu.auth_company_code ";
    sql += "  , amu.auth_company_name ";
    sql += "  , amu.auth_orgz_set_code ";
    sql += "  , amu.auth_orgz_code ";
    sql += "  , amu.auth_orgz_name ";
    sql += "  , amu.execute_user_code ";
    sql += "  , amu.execute_user_name ";
    sql += "  , amu.operate_user_code ";
    sql += "  , amu.operate_user_name ";
    sql += "FROM ";
    sql += "  imw_t_actv_matter AS am ";
    sql += "  INNER JOIN imw_t_cpl_task AS amt ";
    sql += "    ON (amt.system_matter_id = am.system_matter_id) ";
    sql += "  INNER JOIN imw_t_cpl_user AS amu ";
    sql += "    ON (amu.system_matter_id = amt.system_matter_id ";
    sql += "    AND amu.task_id = amt.task_id ";
    sql += "    AND amu.locale_id = 'ja') ";
    sql += "WHERE ";
    sql += "  1 = 1 ";
    
    var amColumnNameMap = {};
    amColumnNameMap["ticketIds"] = {col:"am.matter_name", comp:"in"};
    var amParam = {};
    amParam.ticketIds = ticketIds;
    var amCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", amParam, amColumnNameMap);
	allBindParams = allBindParams.concat(amCondition.bindParams);
    sql += amCondition.sql;


    sql += ") ";
    sql += "SELECT ";
    sql += "  lnmt.system_matter_id ";
    sql += "  , lnmt.flow_id ";
    sql += "  , lnmt.matter_name ";
    sql += "  , lnmt.status ";
    sql += "  , lnmt.task_id ";
    sql += "  , lnmt.node_id ";
    sql += "  , lnmt.node_name ";
    sql += "  , lnmt.create_date ";
    sql += "  , lnmt.task_status ";
    sql += "  , lnmt.latest_order ";
    sql += "  , lnmt.locale_id ";
    sql += "  , lnmt.auth_user_code ";
    sql += "  , lnmt.auth_user_name ";
    sql += "  , lnmt.auth_company_code ";
    sql += "  , lnmt.auth_company_name ";
    sql += "  , lnmt.auth_orgz_set_code ";
    sql += "  , lnmt.auth_orgz_code ";
    sql += "  , lnmt.auth_orgz_name ";
    sql += "  , lnmt.execute_user_code ";
    sql += "  , lnmt.execute_user_name ";
    sql += "  , lnmt.operate_user_code ";
    sql += "  , lnmt.operate_user_name ";
    sql += "FROM ";
    sql += "  latest_numbering_matter_task AS lnmt ";
    sql += "WHERE ";
    sql += "  lnmt.latest_order = 1 ";
    sql += "ORDER BY ";
    sql += "  lnmt.system_matter_id ";
    sql += "  , lnmt.create_date ";

	Logger.getLogger().info('[retrieveWorkflowTaskHistory]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveWorkflowTaskHistory]　result ' + ImJson.toJSONString(result, true));
    return result;
}

function retrieveBelongCompany(userCds) {
	
	var sql = "";
    sql += "SELECT DISTINCT ";
    sql += "  da.user_cd";
    sql += "  , da.company_cd ";
    sql += "FROM ";
    sql += "  imm_department_ath AS da ";
    sql += "WHERE ";
    sql += "  da.start_date <= CURRENT_DATE ";
    sql += "  AND da.end_date > CURRENT_DATE ";
    sql += "  AND da.delete_flag = '0'";
    
    var columnNameMap = {};
    columnNameMap["userCds"] = {col:"da.user_cd", comp:"in"};
    var param = {};
    param.userCds = userCds;
    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;

	Logger.getLogger().info('[retrieveBelongCompany]　sql ' + sql);

    var db = new TenantDatabase();
	var result = db.select(sql, condition.bindParams, 0);
	Logger.getLogger().info('[retrieveBelongCompany]　result ' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 会社属性情報取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKaishaData(kaishaId) {
	var sql = "";
	sql += "SELECT ";
	sql += "  k.kessaisha_nm ";
	sql += "  , k.yakushoku_nm ";
	sql += "  , k.busho_nm ";
	sql += "  , k.address1 ";
	sql += "  , ko.cd_naiyo AS keiyakusho_baitai_nm ";
	sql += "FROM lo_m_kaisha AS k ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko ";
	sql += "  ON ko.cd_id = k.keiyakusho_baitai ";
	sql += "  AND ko.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKUSHO_BAITAI + "' ";
	sql += "  AND ko.sakujo_flg = '0' ";
	sql += "WHERE ";
	sql += "  k.sakujo_flg = '0' ";
	var columnNameMap = {};
	columnNameMap["kaishaId"] = {col:"k.kaisha_id", comp:"eq"};
    var param = {};
    param.kaishaId = kaishaId;
    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);
	sql += condition.sql;
	Logger.getLogger().info('[retrieveKaishaData]　sql ' + sql);
	var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveKaishaData]　result ' + ImJson.toJSONString(result, true));
	return result;
}

/**
 * 契約書送付先情報取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakushoSofusakiList(kaishaId) {
	var sql = "";
	sql += "SELECT ";
	sql += "  ks.tanto_id ";
	sql += "  , u.user_name AS tanto_nm ";
	sql += "  , ks.busho_nm ";
	sql += "  , u.email_address1 ";
	sql += "  , ks.zip_code ";
	sql += "  , ks.address1 ";
	sql += "  , ks.telephone_number ";
	sql += "FROM lo_m_keiyakusho_sofusaki AS ks ";
	sql += "  LEFT JOIN imm_user AS u ";
	sql += "  ON u.user_cd = ks.tanto_id ";
	sql += "  AND u.locale_id = 'ja' ";
	sql += "  AND u.delete_flag = '0' ";
	sql += "WHERE ";
	sql += "  ks.sakujo_flg = '0' ";

	var param = {};
	param.kaishaId = kaishaId;
	var columnNameMap = {};
	columnNameMap["kaishaId"] = {col:"ks.kaisha_id", comp:"eq"};
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);
	sql += condition.sql;
	sql += "ORDER BY ";
	sql += "  ks.tanto_id ";
	Logger.getLogger().info('[retrieveKeiyakushoSofusakiList]　sql ' + sql);
	var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveKeiyakushoSofusakiList]　result ' + ImJson.toJSONString(result, true));
	return result;
}

/**
 * 請求書送付先情報取得
 * @param {string} kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveSeikyushoSofusakiList(kaishaId) {
	var sql = "";
	sql += "SELECT ";
	sql += "  ss.seikyusho_sofusaki_eda AS sofusaki_eda ";
	sql += "  , ss.seikyusho_sofusaki_nm ";
	sql += "  , ss.email_address_to ";
	sql += "  , ss.email_address_cc1 ";
	sql += "  , ss.email_address_cc2 ";
	sql += "  , ss.email_address_cc3 ";
	sql += "FROM lo_m_seikyusho_sofusaki AS ss ";
	sql += "WHERE ";
	sql += "  ss.sakujo_flg = '0' ";

	var param = {};
	param.kaishaId = kaishaId;
	var columnNameMap = {};
	columnNameMap["kaishaId"] = {col:"ss.kaisha_id", comp:"eq"};
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);
	sql += condition.sql;
	sql += "ORDER BY ";
	sql += "  LPAD(ss.seikyusho_sofusaki_eda, '9','0' ) ";
	Logger.getLogger().info('[retrieveSeikyushoSofusakiList]　sql ' + sql);
	var db = new TenantDatabase();
	var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveSeikyushoSofusakiList]　result ' + ImJson.toJSONString(result, true));
	return result;
}
