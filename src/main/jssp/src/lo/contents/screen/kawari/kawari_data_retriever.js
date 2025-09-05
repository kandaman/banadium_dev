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
function retrieveKawariData(bunshoId) {

	Logger.getLogger().info(' [retrieveKawariData]　代わり承認情報検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var userInfo = getUserInfo();

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ky.bunsho_id ";
	sql += "  , ky.kawari_status ";
	sql += "  , ko03.cd_naiyo AS kawari_status_name ";	
	sql += "  , ky.kikaku_shubetsu_cd ";
	sql += "  , ko05.cd_naiyo AS kikaku_shubetsu_name ";
	sql += "  , ky.keiyaku_cls ";
	sql += "  , ko02.cd_naiyo AS keiyaku_cls_nm ";
	sql += "  , ky.kyodaku_cls ";
	sql += "  , ko01.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , ky.bunsho_cls ";
	sql += "  , ky.bunsho_nm ";
	sql += "  , ky.ip_cd ";
	sql += "  , ky.ip_nm ";
	sql += "  , ky.title_nm ";
	sql += "  , ky.title_cd ";
	sql += "  , ky.gokuhi_flg ";
	//TODO:固定値マスタから取得
	sql += "  , case when ky.gokuhi_flg ='1' then '経路上のみ公開' else '全体公開' end gokuhi_nm ";
	sql += "  ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; 

	sql += "  , ky.kaisha_id ";
	sql += "  , ky.kaisha_nm ";
	sql += "  , ky.kaigai_hansha_cd ";
	sql += "  , ko07.cd_naiyo AS kaigai_hansha_nm ";
	sql += "  , ky.royalty_kingaku_genchi ";
	sql += "  , ky.currency_cd ";
	sql += "  , ko06.cd_naiyo AS currency_nm ";
	sql += "  , ky.kawase_rate ";
	sql += "  , ky.haibun_rate ";
	sql += "  , ky.royalty_kingaku ";
	sql += "  , ky.royalty_kingaku_biko";
	sql += "  , to_char(ky.hatsubai_jiki,'YYYY/MM/DD') as hatsubai_jiki";
	sql += "  , to_char(ky.hatsubai_bi,'YYYY/MM/DD') as hatsubai_bi";
	sql += "  , ky.naiyo ";
	sql += "  , ky.biko ";	

	sql += "  , ky.kyodaku_kikan_from,'YYYY/MM/DD'";
	sql += "  , ky.kyodaku_kikan_to,'YYYY/MM/DD'";

	sql += "  , ky.saiteihosho_su_shinseisu ";
	sql += "  , ky.saiteihosho_ryo_kyodakuryo ";
	sql += "  , ky.sozai_hi ";
	sql += "  , ky.sairiyou_bunsho_id ";
	sql += "  , ky.shohyo_chosa_kekka ";
	sql += "  , ko08.cd_naiyo AS shohyo_chosa_kekka_nm ";
	sql += "  , ky.shohyo_chosa_comment ";
	sql += "  , ky.nyuryoku_sha_id ";
	sql += "  , ky.nyuryoku_sha_nm ";
	sql += "  , ky.kian_sha_id";
	sql += "  , ky.kian_sha_nm";
	sql += "  , ky.koushin_sha";
	sql += "  , to_char(ky.koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') AS koushin_bi ";
	
	sql += " FROM ";
	sql += "  lo_t_kawari AS ky ";
	
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko01.cd_id = ky.kyodaku_cls ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = ky.keiyaku_cls ";
	sql += "    AND ko02.sakujo_flg ='0') ";	
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" +  Constant.LO_CDCLS_KAWARI_STATUS + "' ";
	sql += "    AND ko03.cd_id = ky.kawari_status ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "    ON (ko05.cd_cls_id = '" +  Constant.LO_CDCLS_KAWARI_KIKAKU_CLS + "' ";
	sql += "    AND ko05.cd_id = CAST(ky.kikaku_shubetsu_cd AS character varying) ";
	sql += "    AND ko05.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
	sql += "    ON (ko06.cd_cls_id = '" +  Constant.LO_CDCLS_CURRENCY + "' ";
	sql += "    AND ko06.cd_id = CAST(ky.currency_cd AS character varying) ";
	sql += "    AND ko06.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
	sql += "    ON (ko07.cd_cls_id = '" +  Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND ko07.cd_id = ky.kaigai_hansha_cd ";
	sql += "    AND ko07.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko08 ";
	sql += "    ON (ko08.cd_cls_id = '" +  Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA + "' ";
	sql += "    AND ko08.cd_id = ky.shohyo_chosa_kekka ";
	sql += "    AND ko08.sakujo_flg ='0') ";
	
	sql += "WHERE ";
	sql += "  ky.sakujo_flg = '0' ";
	sql += "  AND ky.bunsho_id = ? ";
	sql += "GROUP BY ";
	sql += "  ky.bunsho_id ";
	sql += "  , ky.kawari_status ";
	sql += "  , ky.kikaku_shubetsu_cd ";
	
	sql += "  , ky.bunsho_nm ";
	
	sql += "  , ko01.cd_naiyo ";
	sql += "  , ko02.cd_naiyo ";
	sql += "  , ko03.cd_naiyo ";
	sql += "  , ko05.cd_naiyo ";
	sql += "  , ko06.cd_naiyo ";
	sql += "  , ko07.cd_naiyo ";
	sql += "  , ko08.cd_naiyo ";
	
    var params = [];
    params.push(DbParameter.string(bunshoId));

	// sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKyodakuData]　許諾情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    //Logger.getLogger().info('[retrieveKyodakuData]　result ' + ImJson.toJSONString(result, true));
    return result;
}

/**
 * 関連文書情報取得
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKanrenbunshoList(bunshoId) {
	Logger.getLogger().info(' [retrieveKanrenbunshoList]　関連文書情報検索 start bunshoid:'+bunshoId);
    var sql = "";
    sql = sql + "SELECT ";
    sql = sql + " t.* ";
    sql = sql + " ,ko01.cd_naiyo AS bunsho_cls_nm ";
    sql = sql + " FROM (";
	sql = sql + "SELECT ";
	sql = sql + "  kkb.bunsho_id ";
	sql = sql + "  ,kkb.kanren_bunsho_id ";
	sql = sql + "  ,CASE ";
	sql = sql + "    WHEN ki.kikaku_id is not null THEN ki.kikaku_nm ";
	sql = sql + "    WHEN ky.kyodaku_id is not null THEN ky.kyodaku_nm ";
	sql = sql + "    WHEN kw.bunsho_id is not null THEN kw.bunsho_nm ";	
	sql = sql + "    ELSE '' ";
	sql = sql + "  END bunsho_nm ";
	sql = sql + "  ,CASE ";
	sql = sql + "    WHEN ki.kikaku_id is not null THEN '1' ";
	sql = sql + "    WHEN ky.kyodaku_id is not null THEN '2' ";
	sql = sql + "    WHEN kw.bunsho_id is not null THEN kw.bunsho_cls ";
	sql = sql + "    ELSE '' ";
	sql = sql + "  END bunsho_cls ";
	sql = sql + "FROM ";
	sql = sql + "  lo_t_kawari_kanren_bunsho AS kkb ";
	sql = sql + "  LEFT JOIN lo_t_kikaku AS ki ";
	sql = sql + "    ON (kkb.kanren_bunsho_id = ki.kikaku_id) ";
	sql = sql + "  LEFT JOIN lo_t_kyodaku AS ky ";
	sql = sql + "    ON (kkb.kanren_bunsho_id = ky.kyodaku_id) ";
	sql = sql + "  LEFT JOIN lo_t_kawari AS kw ";
	sql = sql + "    ON (kkb.kanren_bunsho_id = kw.bunsho_id) ";	
	sql = sql + "WHERE ";
	sql = sql + "  kkb.sakujo_flg = '0' ";	
	sql = sql + "  AND kkb.bunsho_id = ? ";
	sql = sql + "ORDER BY ";
	sql = sql + "  kkb.bunsho_id,kkb.bunsho_edaban ";
	sql = sql + ") t";	
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" +  Constant.LO_CDCLS_DOC_TYPE_PR + "' ";
	sql += "    AND ko01.cd_id = t.bunsho_cls ";
	sql += "    AND ko01.sakujo_flg ='0') ";

    var params = [];
    params.push(DbParameter.string(bunshoId))

    // sql実行
    var db = new TenantDatabase();
	//Logger.getLogger().info('[retrieveKanrenbunshoList]　関連文書情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 添付ファイル情報取得
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveTempuFileList(bunshoId) {
	Logger.getLogger().info(' [retrieveTempuFileList]　添付ファイル情報検索');
	
    var sql = ""; 
	sql = sql + "SELECT ";
	sql = sql + "  tf.bunsho_id ";
	sql = sql + "  , tf.file_no ";
	sql = sql + "  , tf.file_name ";
	sql = sql + "  , tf.file_path ";
	sql = sql + "FROM ";
	sql = sql + "  lo_t_kawari_tempu_file AS tf ";
	sql = sql + "WHERE ";
	sql = sql + "  tf.sakujo_flg = '0' ";
	sql = sql + "  AND tf.bunsho_id = ? ";
	sql = sql + "ORDER BY ";
	sql = sql + "  tf.file_no ";

    var params = [];
    params.push(DbParameter.string(bunshoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveTempuFileList]　添付ファイル情報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * 許諾詳細情報取得 
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuShohinList(bunshoId) {

	Logger.getLogger().info(' [retrieveShohinList]　商品情報検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = ""; 
	sql += "SELECT ";
	sql += "  sh.bunsho_id ";
	sql += "  , sh.bunsho_edaban ";
	sql += "  , sh.shohin_nm ";
	sql += "  , case ";
	sql += "     when sh.hatsubai_bi is null then '' ";
	sql += "     else to_char(sh.hatsubai_bi,'YYYY/MM/DD') ";
	sql += "    end hatsubai_bi";
	sql += "  , sh.kokuchi_kaishi_jiki";
	sql += "  , sh.zeinuki_jodai ";
	sql += "  , sh.ryoritsu ";
	sql += "  , sh.siyoryo ";
	sql += "  , sh.saiteihosho_su_shinseisu ";
	sql += "  , sh.saiteihosho_ryo_kyodakuryo ";
	sql += "  , sh.shoshi ";
	sql += "  , ko01.cd_naiyo AS shoshi_nm ";
	sql += "  , sh.mihon_suryo ";
	sql += "  , sh.chiiki as chiiki ";
	sql += "  , ko02.cd_naiyo AS chiiki_nm ";
	sql += "  , sh.shohin_hansokubutsu_hanbetsu ";
	sql += "  , ko40.cd_naiyo AS shohin_hansokubutsu_hanbetsu_nm ";
	sql += "FROM ";
	sql += "  lo_t_kawari_detail AS sh ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_SHOSHI + "' ";
	sql += "    AND ko01.cd_id = sh.shoshi ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_HANBAI_CHIIKI + "' ";
	sql += "    AND ko02.cd_id = sh.chiiki ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko40 ";
	sql += "    ON (ko40.cd_cls_id = '" + Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU + "' ";
	sql += "    AND ko40.cd_id = sh.shohin_hansokubutsu_hanbetsu ";
	sql += "    AND ko40.sakujo_flg ='0') ";
	sql += "WHERE ";
	sql += "  sh.sakujo_flg = '0' ";
	sql += "  AND sh.bunsho_id = ? ";
	sql += "ORDER BY ";
	sql += "  sh.bunsho_edaban ";

    var params = [];
    params.push(DbParameter.string(bunshoId))

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().debug('[retrieveKyodakuShohinList]　許諾詳細報検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);

    return result;
}

/**
 * 企画商品情報取得 
 * @param {string} kyodakuId 許諾ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuShohinList(bunshoId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ;
	
	sql += " SELECT " ;
	sql += "   g.bunsho_id ";
	sql += "   , g.bunsho_edaban ";
	sql += "   , g.shohin_category ";
	sql += "   , ko01.cd_naiyo as shohin_category_nm " ; 
	sql += "   , g.shohin_nm ";
	sql += "   , g.zeinuki_jodai ";
	sql += "   , g.mokuhyo_hanbai_su ";
	sql += "   , g.shokai_seisanyotei_su ";
	sql += "   , g.chiiki ";
	sql += "   , ko02.cd_naiyo as chiiki_nm " ;	
	sql += "   , g.hanbai_jiki ";
	sql += "   , g.kokuchi_kaishi_jiki ";
	sql += "   , g.ryoritsu ";	
	sql += "   , g.royalty_kingaku ";
	sql += "   , g.sakujo_flg ";
	sql += "   , g.touroku_sha ";
	sql += "   , g.touroku_bi ";
	sql += "   , g.koushin_sha ";
	sql += "   , g.koushin_bi ";
	sql += " FROM lo_t_kawari_detail g " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_SHOHIN_CATEGORY + "' ";
	sql += "    AND ko01.cd_id = CAST(g.shohin_category AS character varying) ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko02.cd_id = g.chiiki ";
	sql += "    AND ko02.sakujo_flg ='0') ";	
	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.bunsho_id =? " ;	
	sql += "ORDER BY ";
	sql += "  g.bunsho_edaban ";
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(bunshoId));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);

    return result;
}