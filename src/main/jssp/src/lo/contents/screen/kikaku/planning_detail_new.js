Constant.load("lo/common_libs/lo_const");
var $kikaku_data = {}; //企画情報
var $shohin_list = {}; //商品仕様
var $gakkyoku_list = {}; //楽曲仕様
var $event_list = {}; //イベント仕様
var $eizo_list = {}; //映像仕様
var $file_list = {}; //添付ファイル仕様
var $production_flg = false;
var $shohyo_group_flg = false;
var $kikaku_shubetsu_cd = "1"; // 企画種別判別用
var $kikaku_shubetsu_nm = ""; // 企画種別表示用
var $kikaku_title_nm = ""; // 表示タイトル
var $ticketId = "";
var $shonin_flg = true; //承認判定用 
var $shonin_up_flg = false; //承認更新用 
var $shonin_ng_flg = false; //承認NG判定用 
var $shohyo_kekka_list = []; //商標調査結果（OK/NG）
var $before_apply = false;	//申請前か

var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か

var $sairiyou_flg = false; // 再利用可能か true:再利用可能
var $validationErrorMessages = [];

var $new_window_flg = false;

var $tsuchisakiObj = {}; // 通知先
var $keiro = {}; // 経路
var $keiroCpl = {
		apply : false,
		appr_0 : false,
		appr_1 : false,
		appr_2 : false,
		appr_last : false
};

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// 新規ウィンドウで開かれた場合
	if (request.new_window_flg) {
		$new_window_flg = true;
	}
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
	// 商標調査グループか判断
	$shohyo_group_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_SHOHYO);
	
	// 初期表示項目取得
	getDispData();

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	// パラメータから企画IDを受け取り企画情報取得
	if ('kikaku_id' in request){
		
		var result = getKikakuDate(request.kikaku_id)
		$kikaku_data = result.data[0]; //一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kikaku_data);
		
		// 参照可能チェック
		if(!chkVisible($kikaku_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage", true);
		}
		
		if ($kikaku_data.shinsei_bi == null && !$production_flg) {
			// ユーザ情報取得
			var today = new Date();
			var shinsei_bi = today.getFullYear() + "/" +  (today.getMonth() + 1) + "/"+ today.getDate();
	    	
	    	$kikaku_data.shinsei_bi = shinsei_bi;
		}

		// 案件情報の取得
		if (!setMatterInfo($kikaku_data)){
			// ない場合は新規でセット
			// ワークフローパラメータの設定
			setWorkflowOpenPage($kikaku_data);
		}

		
		// 再利用チェック
		chkSairiyou($kikaku_data);
		
		// 企画種別ごとに商品仕様を取得する
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM || $kikaku_data.kikaku_shubetsu_cd == null ){
			//商品
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_ITEM');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_DETAIL');
			var ret = getKikakuShohin(request.kikaku_id);
			$shohin_list = ret.data; //リスト形式で取得
			chkShonin($shohin_list);
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC){
			//楽曲
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_MUSIC');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_DETAIL');
			var ret = getKikakuGakkyoku(request.kikaku_id);
			$gakkyoku_list = ret.data; //リスト形式で取得
			chkShonin($gakkyoku_list);
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT){
			//イベント
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_EVENT');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_DETAIL');
			var ret = getKikakuEvent(request.kikaku_id);
			$event_list = ret.data; //リスト形式で取得
			chkShonin($event_list);
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO){
			//映像
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_EIZO');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_DETAIL');
			var ret = getKikakuEizo(request.kikaku_id);
			$eizo_list = ret.data; //リスト形式で取得
			chkShonin($eizo_list);
		}		
		// 添付ファイル
		var ret = getKikakuFile(request.kikaku_id);
		$file_list = ret.data; //リスト形式で取得
		
		// 企画種別設定
		$kikaku_shubetsu_cd = "" + $kikaku_data.kikaku_shubetsu_cd;
		
		$ticketId = request.kikaku_id;
		
		// 申請前か
		if($ticketId == Client.get('before_apply_id')) {
			$before_apply = true;
		}
		// 通知先を取得
		getTsuchisaki(request.kikaku_id);

	} else {
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted");
	}

}

/**
 * 参照可能かチェック
 */
function chkVisible(data) {
	
	// ライセンシーフラグ
	var liFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);
	// 会社チェック（編集可能な所属グループかどうか）
	if (liFlg) {
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (data.kaisha_id != kaisha_id) {
			return false;
		}
	}
	
	return true;
}

/**
 * 画面表示項目取得
 */
function getDispData() {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// 商標調査結果選択肢取得
    $shohyo_kekka_list = [];
    $shohyo_kekka_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shohyo_kekka_list, Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA);
    
}

/**
 * 企画情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuDate(kikakuId) {

	var sql = "" ;
	sql += " SELECT " ;
	sql += "   k.kikaku_id " ; 
	sql += "  ,k.kikaku_nm " ; 
	sql += "  ,k.kikaku_shubetsu_cd " ; 
	sql += "  ,ko01.cd_naiyo as kikaku_shubetsu_name " ; 
	sql += "  ,k.kikaku_status " ;
	sql += "  ,k.title_cd " ; 
	sql += "  ,k.title_nm " ; 
	sql += "  ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; 
	sql += "  ,to_char(k.kakunin_bi,'YYYY/MM/DD') as kakunin_bi" ; 
	sql += "  ,k.kaisha_id " ; 
	sql += "  ,k.kaisha_nm " ; 
	sql += "  ,k.tantou_sha " ;
	sql += "  ,ss.seikyusho_sofusaki_nm " ;
	sql += "  ,ss.email_address_to " ;
	sql += "  ,ss.email_address_cc1 " ;
	sql += "  ,ss.email_address_cc2 " ;
	sql += "  ,ss.email_address_cc3 " ;
	sql += "  ,k.tag " ; 
	sql += "  ,k.bne_tantou_sha " ; 
	sql += "  ,k.ip_cd " ; 
	sql += "  ,k.ip_nm " ;
	sql += "  ,k.busyo_nm " ; 
	sql += "  ,k.shohyo_chosa_kekka " ;
	sql += "  ,ko03.cd_naiyo as shohyo_chosa_kekka_nm " ; 
	sql += "  ,k.shohyo_chosa_comment " ;
	sql += "  ,k.kanshu_no " ;
	sql += "  ,to_char(k.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi "	
	sql += "  ,CASE k.kikaku_shubetsu_cd ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_ITEM + "' THEN (SELECT SUM(ks.royalty_kingaku) FROM lo_t_kikaku_shohin AS ks WHERE ks.kikaku_id = k.kikaku_id AND  ks.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_MUSIC + "' THEN (SELECT SUM(kg.royalty_kingaku) FROM lo_t_kikaku_gakkyoku AS kg WHERE kg.kikaku_id = k.kikaku_id AND  kg.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_EVENT + "' THEN (SELECT SUM(ke.royalty_kingaku) FROM lo_t_kikaku_event AS ke WHERE ke.kikaku_id = k.kikaku_id AND  ke.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_EIZO + "' THEN (SELECT SUM(kei.royalty_kingaku) FROM lo_t_kikaku_eizo AS kei WHERE kei.kikaku_id = k.kikaku_id AND  kei.sakujo_flg = '0')  ";
	sql += "    ELSE NULL  ";
	sql += "  END AS total_royalty_kingaku ";
	sql += "  ,CASE k.kikaku_shubetsu_cd ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_ITEM + "' THEN (SELECT to_char(MIN(to_date(ks.hanbai_jiki,'YYYY/MM/DD')),'YYYY/MM/DD') FROM lo_t_kikaku_shohin AS ks WHERE ks.kikaku_id = k.kikaku_id AND  ks.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_MUSIC + "' THEN (SELECT to_char(MIN(to_date(kg.hanbai_jiki,'YYYY/MM/DD')),'YYYY/MM/DD') FROM lo_t_kikaku_gakkyoku AS kg WHERE kg.kikaku_id = k.kikaku_id AND  kg.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_EVENT + "' THEN (SELECT to_char(MIN(to_date(ke.event_kaishi_jiki,'YYYY/MM/DD')),'YYYY/MM/DD') FROM lo_t_kikaku_event AS ke WHERE ke.kikaku_id = k.kikaku_id AND  ke.sakujo_flg = '0')  ";
	sql += "    WHEN '" + Constant.LO_KIKAKU_SHUBETSU_EIZO + "' THEN (SELECT to_char(MIN(to_date(kei.eizo_kaishi_jiki,'YYYY/MM/DD')),'YYYY/MM/DD') FROM lo_t_kikaku_eizo AS kei WHERE kei.kikaku_id = k.kikaku_id AND  kei.sakujo_flg = '0')  ";
	sql += "    ELSE NULL  ";
	sql += "  END AS min_hanbai_jiki ";
	sql += " FROM lo_t_kikaku as k " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
	sql += "    AND ko01.cd_id = CAST(k.kikaku_shubetsu_cd AS character varying) ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA + "' ";
	sql += "    AND ko03.cd_id = k.shohyo_chosa_kekka ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_seikyusho_sofusaki AS ss ";
	sql += "    ON (ss.kaisha_id = k.kaisha_id ";
	sql += "    AND ss.seikyusho_sofusaki_eda = k.seikyusho_sofusaki_id ";
	sql += "    AND ss.sakujo_flg ='0') ";
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 

	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // ステータス設定
    var obj = {}
    obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KIKAKU);
    result.data = obj;
    
    return result;
}

/**
 * 商品情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuShohin(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   s.kikaku_id " ; 
	sql += "  ,s.kikaku_edaban " ; 
	sql += "  ,s.shohin_nm " ;
	sql += "  ,s.hanbai_jiki " ; 
	sql += "  ,s.zeinuki_jodai " ; 
	sql += "  ,s.jyouhou_syosyutu_jiki " ; 
	sql += "  ,s.mokuhyo_hambai_su " ; 
	sql += "  ,s.shokai_seisanyotei_su " ; 
	sql += "  ,s.ryouritu " ; 
	sql += "  ,CASE WHEN s.ryouritu IS NULL OR s.ryouritu = 0 THEN FALSE ELSE TRUE END ryouritu_persent_flg " ; 
	sql += "  ,s.chiiki " ; 
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,s.royalty_kingaku " ; 
	sql += "  ,s.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += " FROM lo_t_kikaku_shohin as s " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = s.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = s.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE s.sakujo_flg ='0' " ; 
	sql += "   AND s.kikaku_id =? " ;
	sql += " ORDER BY s.kikaku_edaban " ;

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {}
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;
}

/**
 * 楽曲情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuGakkyoku(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   g.kikaku_id " ; 
	sql += "  ,g.kikaku_edaban " ; 
	sql += "  ,g.gakkyoku_nm " ; 
	sql += "  ,g.hanbai_jiki " ;
	sql += "  ,g.kakaku_cd as kakaku" ; //種別で変化？
	sql += "  ,g.jyouhou_syosyutu_jiki " ; 
	sql += "  ,g.mokuhyo_hambai_su " ; 
	sql += "  ,g.shokaisyukka_mikomi " ; 
	sql += "  ,g.chiiki " ; 
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,g.royalty_kingaku " ; 
	sql += "  ,g.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += " FROM lo_t_kikaku_gakkyoku as g " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = g.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = g.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.kikaku_id =? " ;
	sql += " ORDER BY g.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {}
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;

}	

/**
 * イベント情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuEvent(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   e.kikaku_id " ; 
	sql += "  ,e.kikaku_edaban " ; 
	sql += "  ,e.event_campaign_nm " ; 
	sql += "  ,e.event_kaishi_jiki as hanbai_jiki " ;
	sql += "  ,e.ticket_kakaku" ;
	sql += "  ,e.syosyutu_jiki as jyouhou_syosyutu_jiki " ; 
	sql += "  ,e.mokuhyo_hambai_su " ; 
	sql += "  ,e.shokai_seisanyotei_su " ; 
	sql += "  ,e.royalty_kingaku " ; 
	sql += "  ,e.sozaihi " ; 
	sql += "  ,e.ok_ng " ;
	sql += "  ,ko01.cd_naiyo as ok_ng_nm " ; 
	sql += " FROM lo_t_kikaku_event as e " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko01.cd_id = e.ok_ng ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ;
	sql += " ORDER BY e.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {}
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;

}

/**
 * 映像情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuEizo(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   e.kikaku_id " ; 
	sql += "  ,e.kikaku_edaban " ; 
	sql += "  ,e.shiyou_youto_nm " ; 
	sql += "  ,e.eizo_kaishi_jiki as hanbai_jiki " ;
	sql += "  ,e.riyou_ryo" ;
	sql += "  ,e.syosyutu_jiki as jyouhou_syosyutu_jiki " ; 
	sql += "  ,e.chiiki " ; 
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,e.royalty_kingaku " ; 
	sql += "  ,e.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += " FROM lo_t_kikaku_eizo as e " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = e.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = e.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ;
	sql += " ORDER BY e.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {}
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;

}
	

/**
 * 添付ファイル情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuFile(kikakuId) {
	
	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   t.kikaku_id " ; 
	sql += "  ,t.file_no " ; 
	sql += "  ,t.file_name " ; 
	sql += "  ,t.file_path " ;
	sql += "  ,t.koushin_sha" ;
	sql += "  ,t.koushin_bi " ;
	sql += " FROM lo_t_kikaku_tempu_file as t " ;
	sql += " WHERE t.sakujo_flg ='0' " ;
	sql += "   AND t.kikaku_id =? " ;
	sql += " ORDER BY t.file_no " ;

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;

}
	
/**
 * 数値にカンマ追加
 * @param {object} 検索データ
 * @returns {object} 変換後データ
 */
function setComma(data) {
	
	var ret = "";
	var ret2 = "";
	var ret3 = "";
	var ret4 = "";
	var ret5 = "";
	var ret6 = "";
	var ret7 = "";
	var ret8 = "";
	for (var i = 0;i < data.length;i++){
		
		// 税抜上代（商品）
		ret = data[i].zeinuki_jodai;
		if (typeof ret === "undefined"){
			ret ="";
		} else {
			ret = comma(ret);
		}
		data[i].zeinuki_jodai = ret;
		
		// 目標販売数（商品・楽曲）
		ret2 = data[i].mokuhyo_hambai_su;
		if (typeof ret2 === "undefined"){
			ret2 ="";
		} else {
			ret2 = comma(ret2);
		}
		data[i].mokuhyo_hambai_su = ret2;
		
		// 価格（楽曲）
		ret3 = data[i].kakaku;
		if (typeof ret3 === "undefined"){
			ret3 ="";
		} else {
			ret3 = comma(ret3);
		}
		data[i].kakaku = ret3;
		
		// 価格（イベント）
		ret4 = data[i].ticket_kakaku;
		if (typeof ret4 === "undefined"){
			ret4 ="";
		} else {
			ret4 = comma(ret4);
		}
		data[i].ticket_kakaku = ret4;
		
		// 初回生産予定数
		ret5 = data[i].shokai_seisanyotei_su;
		if (typeof ret5 === "undefined"){
			ret5 ="";
		} else {
			ret5 = comma(ret5);
		}
		data[i].shokai_seisanyotei_su = ret5;
		
		// ロイヤリティ金額
		ret6 = data[i].royalty_kingaku;
		if (typeof ret6 === "undefined"){
			ret6 ="";
		} else {
			if (ret6) {
				ret6 = comma(ret6);
			} else {
				ret6 ="";
			}
		}
		data[i].royalty_kingaku = ret6;
		
		// 料率
		ret7 = data[i].ryouritu;
		if (typeof ret7 === "undefined"){
			ret7 ="";
		} else {
			if (ret7) {
				ret7 = comma(ret7);
			} else {
				ret7 ="";
			}
		}
		data[i].ryouritu = ret7;
		
		// 料率
		ret8 = data[i].riyou_ryo;
		if (typeof ret8 === "undefined"){
			ret8 ="";
		} else {
			if (ret8) {
				ret8 = comma(ret8);
			} else {
				ret8 ="";
			}
		}
		data[i].riyou_ryo = ret8;
		
	}
	return data;
}

// 3桁カンマ区切りとする.
function comma(num) {
    var s = String(num).split('.');
    var ret = String(s[0]).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    if (s.length > 1 && s[1].length > 0) {
        ret += '.' + s[1];
    }
    return ret;
}


/**
 * 簡易商標調査担当入力欄保存ボタン押下時処理
*/	
function shohyoKekkaSave(inputContents) {
	if(inputContents.shohyo_chosa_kekka == "") inputContents.shohyo_chosa_kekka = null;
	return shohyoKekkaUpdate(inputContents);
}

/**
 * ライセンスプロダクション入力欄保存ボタン押下時処理
*/	
function licenseProductionSave(inputContents) {
	if(inputContents.kanshu_no == "") inputContents.kanshu_no = null;
	return licenseProductionUpdate(inputContents);
}

/**
 * 簡易商標調査担当入力欄更新
 * @param {object} 更新値
 * @returns {object} 結果
 */
function shohyoKekkaUpdate(inputContents) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	var userCd = userContext.userProfile.userCd;

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : ""
	};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		//画面の入力値をDB用オブジェクトに格納
		// todo 必要な項目を追加する
		var dataSet = {
			shohyo_chosa_kekka : inputContents.shohyo_chosa_kekka,
			shohyo_chosa_comment : inputContents.shohyo_chosa_comment
		};
		dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
		// update条件の値を配列で持つ
		var whereObject = [DbParameter.string(inputContents.kikaku_id)];
		// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
		var result = db.update('lo_t_kikaku', dataSet,'kikaku_id = ?',whereObject);
		if (result.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E009');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
	});
	
	// 商標調査完了メール送信-------------------
	Constant.load("lo/common_libs/lo_const");

	// 文書idとノードidから申請者のメールアドレス取得
	var ticket_id = inputContents.kikaku_id;
	var address = Content.executeFunction("lo/common_libs/lo_send_mail",
			"getNodeUserAddress",ticket_id,Constant.LO_NODE_APPR_0);
	
	// 送信用パラメータ作成
	var param = {
			ticket_id :ticket_id, // 文書番号
			//mail_id : Constant.LO_MAIL_ID_SHOHYO_END,    //メールid 処理依頼
			mail_id : Constant.LO_MAIL_ID_ZACRO_END,    //メールid 処理依頼
			to_address : address,                       //送信先アドレス
			comment : inputContents.shohyo_chosa_comment,      				//コメント
			execUserCd : userCd    //実行者コード
	}
	// メール送信
	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",param);
	// end商標調査完了メール送信-------------------


	return ret;
}

/**
 * ライセンスプロダクション入力欄更新
 * @param {object} 更新値
 * @returns {object} 結果
 */
function licenseProductionUpdate(inputContents) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : ""
	};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		//画面の入力値をDB用オブジェクトに格納
		// todo 必要な項目を追加する
		var dataSet = {
			kanshu_no : inputContents.kanshu_no
		};
		dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
		// update条件の値を配列で持つ
		var whereObject = [DbParameter.string(inputContents.kikaku_id)];
		// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
		var result = db.update('lo_t_kikaku', dataSet,'kikaku_id = ?',whereObject);
		if (result.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E010');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		} else {
			if (dataSet.kanshu_no == "") {
				ret.altmsg = MessageManager.getMessage('KK02I008');
			} else {
				ret.altmsg = MessageManager.getMessage('KK02I007');
			}
			
			
		}
		
	});
	return ret;
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {object} 企画データ
 */
//function setWorkflowOpenPage(kikakuId) {
function setWorkflowOpenPage(kikakuData) {
	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定	
	
    // ワークフローに関するパラメータを保持します
    $wf_data = {
        imwGroupId              : '',		//グループ ID 
        imwUserCode             : '',		//処理者CD
        imwPageType             : '0',		//画面種別
        imwUserDataId           : '',		//ユーザデータ ID
        imwSystemMatterId       : '',		//システム案件ID
        imwNodeId               : Constant.LO_NODE_ID,	//ノード ID 
        imwArriveType           : '',		//到達種別
        imwAuthUserCode         : user_cd,	//権限者CD 
        imwApplyBaseDate        : Content.executeFunction("lo/common_libs/lo_common_fnction","getTodayAsString"),	//申請基準日
        imwContentsId           : '',		//コンテンツ ID
        imwContentsVersionId    : '',		//コンテンツバージョン ID 
        imwRouteId              : '',		//ルート ID
        imwRouteVersionId       : '',		//ルートバージョン ID
        imwFlowId               : Constant.LO_FLOW_KIKAKU,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/planning_form_new',	//呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString({'kikaku_id':kikakuData.kikaku_id,'kikaku_shubetsu_cd':kikakuData.kikaku_shubetsu_cd}),	//呼出元パラメータ
        //imwCallOriginalParams   : ImJson.toJSONString(kikakuData),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
    //BNE担当処理対象者を設定
	$wf_data.imwNodeSetting = Content.executeFunction("lo/common_libs/lo_common_fnction"
		,"nodeSetteing", kikakuData.kikaku_id, Constant.LO_TICKET_ID_HEAD_KIKAKU);
}


/**
 * 案件情報の設定
 * @param {object} 企画データ
 * @returns {boolean} true:案件あり false:案件なし
 */
//function setMatterInfo(kikakuId) {
function setMatterInfo(kikakuData) {
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(kikakuData.kikaku_id));
    strParam.push(DbParameter.string(kikakuData.kikaku_id));
    //strParam.push(DbParameter.string(kikakuId));
    //strParam.push(DbParameter.string(kikakuId));
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	return false;
    }
    
    //案件id取得
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;
    
    if (type =='cpl'){
        // 各ノードの処理対象者を取得する
        getNodeSettings(systemMatterId, true);
    	//完了案件はワークフローの設定の必要なし
    	return true;
    }
    
    // 未完了案件情報取得
	var actvMatter = new ActvMatter(systemMatterId);
    var matter = actvMatter.getMatter();
	
    //呼出元パラメータ json変換＆半角パーセントを%25にエンコード
    //var strJsonParam = ImJson.toJSONString(kikakuData).replace(/%(?![0-9a-fA-F]{2})/g, '%25');	
    
    // ワークフローに関するパラメータを保持します
    $wf_data = {
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
        imwCallOriginalPagePath : 'lo/contents/screen/kikaku/planning_list_new', //呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString({'kikaku_id':kikakuData.kikaku_id,'kikaku_shubetsu_cd':kikakuData.kikaku_shubetsu_cd}),    //呼出元パラメータ
        //imwCallOriginalParams   : ImJson.toJSONString(kikakuData),    //呼出元パラメータ
        //imwCallOriginalParams   : strJsonParam,    //呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
    
	// BNE担当処理対象者を設定
    $wf_data.imwNodeSetting = Content.executeFunction("lo/common_libs/lo_common_fnction"
    	,"nodeSetteing", kikakuData.kikaku_id, Constant.LO_TICKET_ID_HEAD_KIKAKU);
    
    //現在のノードid取得    todo 分岐ルートの場合一覧からノードIDを渡す必要があるのでは？
    var actvNodeList = actvMatter.getActvNodeList();
    var nodeId = actvNodeList.data[0].nodeId;
    $wf_data.imwNodeId = nodeId;
    
    // 戻し先ノードの設定
    $wf_data.imwBackNodeSetting = backNodeSetteing(nodeId);


    // ノード処理対象者か判定
  	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定

  	var actvMatterNode = new ActvMatterNode(systemMatterId);
    var cond = new ListSearchConditionNoMatterProperty();
    var userlist = actvMatterNode.getExecutableUserList(cond); //ノードの対象者を取得
    // 対象者に含まれていればok
    var authUserList = [];
    for(var i = 0; i < userlist.data.length; i++) {
	   /*if (user_cd == userlist.data[i].authUserCode ){
		   $proc_user_flg = true;
		   break;
	   }*/
    	authUserList.push(userlist.data[i].authUserCode);
    }
    if (authUserList.indexOf(user_cd) > -1){
    	$proc_user_flg = true;
    }
    // 代理設定の確認
    if (!$proc_user_flg){
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
            	$proc_user_flg = true;
            	break;
            }
        }
    }    

    // 各ノードの処理対象者を取得する
    getNodeSettings(systemMatterId, false);
    
    return true;
}

/**
 * 承認ノードの差戻先を固定
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function backNodeSetteing(nodeid){
	// 現在のノードIDから戻し先を判断
	var node = {};
	node[Constant.LO_NODE_APPR_0] = Constant.LO_NODE_APPLY;		// BNE担当→申請
	node[Constant.LO_NODE_APPR_1] = Constant.LO_NODE_APPR_0;	// 承認1→BNE担当
	node[Constant.LO_NODE_APPR_2] = Constant.LO_NODE_APPR_0;	// 承認2→BNE担当
	node[Constant.LO_NODE_APPR_LAST] = Constant.LO_NODE_APPLY;	// 最終承認→申請
	
	var backnode =node[nodeid];
	return backnode;
}

/**
 * 承認判定
 * @param {object} 企画情報
 * @returns 判定結果
 */
function chkShonin(data) {
	for (var i = 0;i < data.length;i++) {
		if (data[i].ok_ng == Constant.LO_OKNG_MIKAKUNIN) {
			$shonin_flg = false;
			break;
		} else if (data[i].ok_ng == Constant.LO_OKNG_NG) {
			$shonin_ng_flg = true;
		}
	}
}

/**
 * 再利用可否判定
 * @param {object} 企画情報
 */
function chkSairiyou(kikakuData) {
	
	// 企画ステータスが「辞退」or「否決」or「完了」であること
	if ([Constant.LO_STATUS_JITAI,
	     Constant.LO_STATUS_HIKETSU,
	     Constant.LO_STATUS_KANRYO].indexOf(kikakuData.kikaku_status) == -1) {
		return;
	}
	
	// ユーザーがライセンスプロダクションではないこと
	if ($production_flg) {
		return;
	}

	// ユーザーの会社と企画の会社が同一であること
	// 組織情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var companyCd = userCompanyDepartment.companyCd;
	if (kikakuData.kaisha_id != companyCd) {
		return;
	}
	$sairiyou_flg = true;
}

/**
 * 再利用
 */
function sairiyou(inputContents) {
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userCd = userContext.userProfile.userCd;
	var userName = userContext.userProfile.userName;
	// 組織情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var companyCd = userCompanyDepartment.companyCd;
	var companyName = userCompanyDepartment.companyName;
	var companyShortName = userCompanyDepartment.companyShortName;
	var departmentCd = userCompanyDepartment.departmentCd;
	var departmentName = userCompanyDepartment.departmentName;
	var departmentFullName = userCompanyDepartment.departmentFullName;

	var sysDate = new Date();

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		kikaku_id : ""
	};
	var kikakuId = inputContents.kikaku_id;
	var kiSql = "" ;
	kiSql += "SELECT ";
	kiSql += "  ki.* ";
	kiSql += "FROM ";
	kiSql += "  lo_t_kikaku AS ki ";
	kiSql += "WHERE ";
	kiSql += "  ki.sakujo_flg = '0' ";
	kiSql += "  AND ki.kikaku_id = ?  ";
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));

    // sql実行
    var db = new TenantDatabase();
	Transaction.begin(function() {

	    var kiResult = db.select(kiSql,strParam);
	    if (kiResult.countRow === 0) {
	    	// TODO 再利用対象がなかった場合の対処
	    }
	    var kikakuData = kiResult.data[0];
		Logger.getLogger().info(' [sairiyou]　kikakuData ' + ImJson.toJSONString(kikakuData, true));

		// 企画ID
		var newKikakuId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KIKAKU);
	    
	    // 引き継がないプロパティを削除 
	    if ('kikaku_nm' in kikakuData) {
		    delete kikakuData.kikaku_nm;
    	}
	    if ('shinsei_bi' in kikakuData) {
		    delete kikakuData.shinsei_bi;
    	}
	    if ('kakunin_bi' in kikakuData) {
		    delete kikakuData.kakunin_bi;
    	}
	    if ('bne_tantou_sha' in kikakuData) {
		    delete kikakuData.bne_tantou_sha;
    	}
	    if ('shohyo_chosa_kekka' in kikakuData) {
	    	delete kikakuData.shohyo_chosa_kekka;
	    }
	    if ('shohyo_chosa_comment' in kikakuData) {
	    	delete kikakuData.shohyo_chosa_comment;
	    }
	    if ('kanshu_no' in kikakuData) {
	    	delete kikakuData.kanshu_no;
	    }
	    
	    // タイトルマスタの確認
		var strParamTitle=[];
		strParamTitle.push(DbParameter.string(kikakuData.title_cd));
	    var tiSql = "select 1 from lo_m_title where title_cd = ? and sakujo_flg ='0'";
	    	
	    var tiResult = db.select(tiSql,strParamTitle);

	    // タイトルマスタに存在しない場合、IP・タイトルを空欄にする
	    if (tiResult.countRow === 0) {
	    	delete kikakuData.title_cd;
	    	delete kikakuData.title_nm;
	    	delete kikakuData.ip_cd;
	    	delete kikakuData.ip_nm;
	    }
	    
		kikakuData.kikaku_id = newKikakuId;
		kikakuData.kikaku_status = Constant.LO_STATUS_ICHIJI_HOZON; //一時保存
		kikakuData.kaisha_nm = companyName;
		kikakuData.busyo_nm = departmentName;
		kikakuData.tantou_sha = userName;
		kikakuData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuData, true);

		Logger.getLogger().info(' [sairiyou]　lo_t_kikaku ' + ImJson.toJSONString(kikakuData, true));
		var kiResult = db.insert('lo_t_kikaku', kikakuData);
		if (kiResult.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E011');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		
		// 添付ファイル
		var tpSql = "" ;
		tpSql += "SELECT ";
		tpSql += "  ki.* ";
		tpSql += "FROM ";
		tpSql += "  lo_t_kikaku_tempu_file AS ki ";
		tpSql += "WHERE ";
		tpSql += "  ki.sakujo_flg = '0' ";
		tpSql += "  AND ki.kikaku_id = ?  ";
		var tpResult = db.select(tpSql,strParam);
		var kikakuTempFileDatas = tpResult.data;
		for (var tpIndex in kikakuTempFileDatas) {
			var kikakuTempFileData = kikakuTempFileDatas[tpIndex];
		    kikakuTempFileData.kikaku_id = newKikakuId;
		    kikakuTempFileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuTempFileData, true, kikakuData.koushin_bi);
			kikakuTempFileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", kikakuTempFileData.file_path, newKikakuId);
			
			var ktResult = db.insert('lo_t_kikaku_tempu_file', kikakuTempFileData);
			if (ktResult.error) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E011');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}
		// 商品
		if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM) {

			var ksSql = "";
			ksSql += "SELECT ";
			ksSql += "  ks.* ";
			ksSql += "FROM ";
			ksSql += "  lo_t_kikaku_shohin AS ks ";
			ksSql += "WHERE ";
			ksSql += "  ks.sakujo_flg = '0' ";
			ksSql += "  AND ks.kikaku_id = ?  ";
			ksSql += "ORDER BY ";
			ksSql += "  ks.kikaku_edaban ASC  ";
		    var ksResult = db.select(ksSql,strParam);
		    var kikakuShohinDatas = ksResult.data;
		    for (var index in kikakuShohinDatas) {
				Logger.getLogger().info(' [sairiyou]　index ' + index);
		    	var kikakuShohinData = kikakuShohinDatas[index];
		    	var newEdaban = (Number(index) + 1);
		    	var oldEdaban = kikakuShohinData.kikaku_edaban;
		    	
			    // 引き継がないプロパティを削除
			    if ('ok_ng' in kikakuShohinData) {
				    delete kikakuShohinData.ok_ng;
		    	}
			    if ('sozai_mitsumori' in kikakuShohinData) {
				    delete kikakuShohinData.sozai_mitsumori;
		    	}
			    if ('ryouritu' in kikakuShohinData) {
				    delete kikakuShohinData.ryouritu;
		    	}
			    if ('sample' in kikakuShohinData) {
				    delete kikakuShohinData.sample;
		    	}
			    if ('riyu_joken' in kikakuShohinData) {
				    delete kikakuShohinData.riyu_joken;
		    	}
			    if ('royalty_kingaku' in kikakuShohinData) {
				    delete kikakuShohinData.royalty_kingaku;
		    	}

		    	kikakuShohinData.kikaku_id = newKikakuId;
		    	kikakuShohinData.kikaku_edaban = newEdaban;
		    	kikakuShohinData.ok_ng = Constant.LO_OKNG_MIKAKUNIN;
		    	kikakuShohinData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuShohinData, true, kikakuData.koushin_bi);

				Logger.getLogger().info(' [sairiyou]　lo_t_kikaku_shohin ' + ImJson.toJSONString(kikakuShohinData, true));
				var ksResult = db.insert('lo_t_kikaku_shohin', kikakuShohinData);
				if (ksResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('ER01E011');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
				// 検索値をセット
				var fileParam=[];
				fileParam.push(DbParameter.string(kikakuId));
				fileParam.push(DbParameter.number(oldEdaban));
			    
			    // sql実行
			    var fileResult = db.select(fileSql,fileParam);
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					fileData.kikaku_id = newKikakuId;
					fileData.kikaku_edaban = newEdaban;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true, kikakuData.koushin_bi);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, newKikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('ER01E011');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
		    }
		}
		// 楽曲
		if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
			var kgSql = "";
			kgSql += "SELECT ";
			kgSql += "  kg.* ";
			kgSql += "FROM ";
			kgSql += "  lo_t_kikaku_gakkyoku AS kg ";
			kgSql += "WHERE ";
			kgSql += "  kg.sakujo_flg = '0' ";
			kgSql += "  AND kg.kikaku_id = ? ";
			kgSql += "ORDER BY ";
			kgSql += "  kg.kikaku_edaban ASC  ";
		    var kgResult = db.select(kgSql,strParam);
		    var kikakuGakkyokuDatas = kgResult.data;
		    for (var index in kikakuGakkyokuDatas) {
		    	var kikakuGakkyokuData = kikakuGakkyokuDatas[index];
		    	var newEdaban = (Number(index) + 1);
		    	var oldEdaban = kikakuGakkyokuData.kikaku_edaban;
		    	
			    // 引き継がないプロパティを削除 
			    if ('ok_ng' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.ok_ng;
		    	}
			    if ('riyu_joken' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.riyu_joken;
		    	}
			    if ('genban_shiyoryo_mikomi' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.genban_shiyoryo_mikomi;
		    	}
			    if ('chosakuken_shiyoro_mikomi' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.chosakuken_shiyoro_mikomi;
		    	}
			    if ('character_shiyoryo_mikomi' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.character_shiyoryo_mikomi;
		    	}
			    if ('royalty_kingaku' in kikakuGakkyokuData) {
				    delete kikakuGakkyokuData.royalty_kingaku;
		    	}

		    	kikakuGakkyokuData.kikaku_id = newKikakuId;
		    	kikakuGakkyokuData.kikaku_edaban = newEdaban;
		    	kikakuGakkyokuData.ok_ng = Constant.LO_OKNG_MIKAKUNIN;
		    	kikakuGakkyokuData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuGakkyokuData, true, kikakuData.koushin_bi);

				Logger.getLogger().info(' [sairiyou]　lo_t_kikaku_gakkyoku ' + ImJson.toJSONString(kikakuGakkyokuData, true));
				var kgResult = db.insert('lo_t_kikaku_gakkyoku', kikakuGakkyokuData);
				if (kgResult.error) {
					ret.error = true;
					ret.msg="登録失敗"
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;  
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
				// 検索値をセット
				var fileParam=[];
				fileParam.push(DbParameter.string(kikakuId));
				fileParam.push(DbParameter.number(oldEdaban));
			    
			    // sql実行
			    var fileResult = db.select(fileSql,fileParam);
			    
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					fileData.kikaku_id = newKikakuId;
					fileData.kikaku_edaban = newEdaban;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true, kikakuData.koushin_bi);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, newKikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('ER01E011');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
		    }
		}
		// イベント
		if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT) {
			var keSql = "";
			keSql += "SELECT ";
			keSql += "  ke.* ";
			keSql += "FROM ";
			keSql += "  lo_t_kikaku_event AS ke ";
			keSql += "WHERE ";
			keSql += "  ke.sakujo_flg = '0' ";
			keSql += "  AND ke.kikaku_id = ? ";
			keSql += "ORDER BY ";
			keSql += "  ke.kikaku_edaban ASC  ";
		    var keResult = db.select(keSql,strParam);
		    var kikakuEventDatas = keResult.data;
		    for (var index in kikakuEventDatas) {
		    	var kikakuEventData = kikakuEventDatas[index];
		    	var newEdaban = (Number(index) + 1);
		    	var oldEdaban = kikakuEventData.kikaku_edaban;
		    	
			    // 引き継がないプロパティを削除 
			    if ('ok_ng' in kikakuEventData) {
				    delete kikakuEventData.ok_ng;
		    	}
			    if ('riyu_joken' in kikakuEventData) {
				    delete kikakuEventData.riyu_joken;
		    	}
			    if ('royalty_kingaku' in kikakuEventData) {
				    delete kikakuEventData.royalty_kingaku;
		    	}
				
				kikakuEventData.kikaku_id = newKikakuId;
				kikakuEventData.kikaku_edaban = newEdaban;
				kikakuEventData.ok_ng = Constant.LO_OKNG_MIKAKUNIN;
				kikakuEventData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuEventData, true, kikakuData.koushin_bi);

				Logger.getLogger().info(' [sairiyou]　lo_t_kikaku_event ' + ImJson.toJSONString(kikakuEventData, true));
				var keResult = db.insert('lo_t_kikaku_event', kikakuEventData);
				if (keResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('ER01E011');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
				// 検索値をセット
				var fileParam=[];
				fileParam.push(DbParameter.string(kikakuId));
				fileParam.push(DbParameter.number(oldEdaban));

			    // sql実行
			    var fileResult = db.select(fileSql,fileParam);
			    
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
			    	
					var fileData = fileDatas[idx];
					fileData.kikaku_id = newKikakuId;
					fileData.kikaku_edaban = newEdaban;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true, kikakuData.koushin_bi);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, newKikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('ER01E011');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
		    }
		}
		// 映像
		if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO) {
			var keSql = "";
			keSql += "SELECT ";
			keSql += "  ke.* ";
			keSql += "FROM ";
			keSql += "  lo_t_kikaku_eizo AS ke ";
			keSql += "WHERE ";
			keSql += "  ke.sakujo_flg = '0' ";
			keSql += "  AND ke.kikaku_id = ? ";
			keSql += "ORDER BY ";
			keSql += "  ke.kikaku_edaban ASC  ";
		    var keResult = db.select(keSql,strParam);
		    var kikakuEizoDatas = keResult.data;
		    for (var index in kikakuEizoDatas) {
		    	var kikakuEizoData = kikakuEizoDatas[index];
		    	var newEdaban = (Number(index) + 1);
		    	var oldEdaban = kikakuEizoData.kikaku_edaban;
		    	
			    // 引き継がないプロパティを削除 
			    if ('ok_ng' in kikakuEizoData) {
				    delete kikakuEizoData.ok_ng;
		    	}
			    if ('riyu_joken' in kikakuEizoData) {
				    delete kikakuEizoData.riyu_joken;
		    	}
			    if ('royalty_kingaku' in kikakuEizoData) {
				    delete kikakuEizoData.royalty_kingaku;
		    	}
				
				kikakuEizoData.kikaku_id = newKikakuId;
				kikakuEizoData.kikaku_edaban = newEdaban;
				kikakuEizoData.ok_ng = Constant.LO_OKNG_MIKAKUNIN;
				kikakuEizoData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuEizoData, true, kikakuData.koushin_bi);

				Logger.getLogger().info(' [sairiyou]　lo_t_kikaku_eizo ' + ImJson.toJSONString(kikakuEizoData, true));
				var keResult = db.insert('lo_t_kikaku_eizo', kikakuEizoData);
				if (keResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('ER01E011');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
				// 検索値をセット
				var fileParam=[];
				fileParam.push(DbParameter.string(kikakuId));
				fileParam.push(DbParameter.number(oldEdaban));

			    // sql実行
			    var fileResult = db.select(fileSql,fileParam);
			    
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
			    	
					var fileData = fileDatas[idx];
					fileData.kikaku_id = newKikakuId;
					fileData.kikaku_edaban = newEdaban;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true, kikakuData.koushin_bi);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, newKikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('ER01E011');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
		    }
		}
		ret.kikaku_id = newKikakuId;
		ret.msg = MessageManager.getMessage('KK02I017');

	});
	Client.set('kikaku_edit_id', ret.kikaku_id);
	return ret;
    
}
/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KK02E";
	var message_last_num = 20;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList", message_ids);

	return ImJson.toJSONString(messages, false);
}

function getKikakuShohinCsvData(inputContents) {
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		kikaku_id : "",
		data : []
	};
	var kikakuId = inputContents.kikaku_id;
	var kikaku_shubetsu_cd = inputContents.kikaku_shubetsu_cd;

	ret.kikaku_id = kikakuId;

	var sql = "";
	
	if (Constant.LO_KIKAKU_SHUBETSU_ITEM == kikaku_shubetsu_cd) {

		sql += "SELECT ";
		sql += "  ki.kikaku_id AS \"企画番号\" ";
		sql += "  , ki.kikaku_nm AS \"企画名\" ";
		sql += "  , ko01.cd_naiyo AS \"企画種別\" ";
		sql += "  , ki.title_nm AS \"タイトル\" ";
		sql += "  , ki.kaisha_nm AS \"ライセンシー名\" ";
		sql += "  , ROW_NUMBER() OVER (PARTITION BY ki.kikaku_id ORDER BY ks.kikaku_edaban ASC) AS \"商品仕様ID\" ";
		sql += "  , ks.shohin_nm AS \"商品仕様名\" ";
		sql += "  , ko02.cd_naiyo AS \"カテゴリ\" ";
		sql += "  , ks.zeinuki_jodai AS \"税抜上代\" ";
		sql += "  , ks.mokuhyo_hambai_su AS \"目標販売数\" ";
		sql += "  , ks.shokai_seisanyotei_su AS \"初回生産予定数\" ";
		sql += "  , ks.sku AS \"SKU\" ";
		sql += "  , ko03.cd_naiyo AS \"地域\" ";
		sql += "  , ks.hanbaiyoteikosu_nihon AS \"初回生産予定数(内訳)_日本\" ";
		sql += "  , ks.hanbaiyoteikosu_chugoku AS \"初回生産予定数(内訳)_中国本土\" ";
		sql += "  , ks.hanbaiyoteikosu_asia AS \"初回生産予定数(内訳)_アジア（中国本土除く）\" ";
		sql += "  , ks.hanbaiyoteikosu_chunanbei AS \"初回生産予定数(内訳)_北米・中南米\" ";
		sql += "  , ks.hanbaiyoteikosu_europe AS \"初回生産予定数(内訳)_ヨーロッパ\" ";
		sql += "  , ks.hanbaikoku_shosai AS \"販売国詳細\" ";
		sql += "  , ks.hanbai_jiki AS \"発売時期\" ";
		sql += "  , ks.jyouhou_syosyutu_jiki AS \"情報初出時期\" ";
		sql += "  , ks.uriba_tempo AS \"売り場_店舗\" ";
		sql += "  , ks.uriba_event AS \"売り場_ECサイト販売\" ";
		sql += "  , ks.uriba_ecsite AS \"売り場_イベント\" ";
		sql += "  , ks.urikata_ippanryutsu AS \"売り方_一般流通\" ";
		sql += "  , ks.urikata_juchuhambai AS \"売り方_受注販売\" ";
		sql += "  , ks.urikata_senkohambai AS \"売り方_先行販売\" ";
		sql += "  , ks.urikata_tempo_kaijogenteihambai AS \"売り方_店舗・会場限定販売\" ";
		sql += "  , ks.hanro AS \"主な販路\" ";
		sql += "  , ko04.cd_naiyo AS \"証紙\" ";
		sql += "  , ko05.cd_naiyo AS \"トレーディング仕様\" ";
		sql += "  , ko06.cd_naiyo AS \"描き下ろし希望有無\" ";
		sql += "  , ko07.cd_naiyo AS \"アソビストアでの取り扱い希望\" ";
		sql += "  , ks.sendenhansoku_keikaku AS \"宣伝販促計画\" ";
		sql += "  , ks.shohin_setsumei AS \"商品説明\" ";
		sql += "  , ks.sozai AS \"素材\" ";
		sql += "  , ks.size AS \"サイズ\" ";
		sql += "  , ks.bikou AS \"備考\" ";
		sql += "  , ko08.cd_naiyo AS \"審査結果\" ";
		sql += "FROM ";
		sql += "  lo_t_kikaku AS ki ";
		sql += "  INNER JOIN lo_t_kikaku_shohin AS ks ";
		sql += "    ON (ks.kikaku_id = ki.kikaku_id ";
		sql += "    AND ks.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
		sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
		sql += "    AND ko01.cd_id = CAST(ki.kikaku_shubetsu_cd AS varchar) ";
		sql += "    AND ko01.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
		sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_SHOHIN_CATEGORY + "' ";
		sql += "    AND ko02.cd_id = CAST(ks.shohin_category AS varchar) ";
		sql += "    AND ko02.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
		sql += "    AND ko03.cd_id = ks.chiiki ";
		sql += "    AND ko03.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
		sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_SHOSHI + "' ";
		sql += "    AND ko04.cd_id = ks.shoshi ";
		sql += "    AND ko04.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
		sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_TRADING + "' ";
		sql += "    AND ko05.cd_id = ks.trading ";
		sql += "    AND ko05.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
		sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU + "' ";
		sql += "    AND ko06.cd_id = ks.kakiorosi_kibou_umu ";
		sql += "    AND ko06.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
		sql += "    ON (ko07.cd_cls_id = '" + Constant.LO_CDCLS_ASOBISTORE + "' ";
		sql += "    AND ko07.cd_id = ks.asobistore ";
		sql += "    AND ko07.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko08 ";
		sql += "    ON (ko08.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
		sql += "    AND ko08.cd_id = COALESCE(ks.ok_ng, '0') ";
		sql += "    AND ko08.sakujo_flg = '0') ";
		sql += "WHERE ";
		sql += "  ki.sakujo_flg = '0' ";
		sql += "  AND ki.kikaku_id = ? ";
		sql += "ORDER BY ";
		sql += "  ki.kikaku_id ASC ";
		sql += "  , ks.kikaku_edaban ASC ";

	} else if (Constant.LO_KIKAKU_SHUBETSU_MUSIC == kikaku_shubetsu_cd) {

		sql += "SELECT ";
		sql += "  ki.kikaku_id AS \"企画番号\" ";
		sql += "  , ki.kikaku_nm AS \"企画名\" ";
		sql += "  , ko01.cd_naiyo AS \"企画種別\" ";
		sql += "  , ki.title_nm AS \"タイトル\" ";
		sql += "  , ki.kaisha_nm AS \"ライセンシー名\" ";
		sql += "  , ROW_NUMBER() OVER (PARTITION BY ki.kikaku_id ORDER BY kg.kikaku_edaban ASC) AS \"商品仕様ID\" ";
		sql += "  , kg.gakkyoku_nm AS \"シングル/アルバム名\" ";
		sql += "  , ko02.cd_naiyo AS \"シングル or アルバム\" ";
		sql += "  , kg.hanbai_keitai_cd AS \"販売形態_CD\" ";
		sql += "  , kg.hanbai_keitai_digital AS \"販売形態_デジタル配信\" ";
		sql += "  , kg.hanbai_keitai_sonota AS \"販売形態_その他\" ";
		sql += "  , kg.digital_haishin_kobetsuhaishin AS \"デジタル配信詳細_個別配信\" ";
		sql += "  , kg.digital_haishin_cdtani AS \"デジタル配信詳細_CD単位で配信\" ";
		sql += "  , kg.digital_haishin_subscription AS \"デジタル配信詳細_サブスクリプション\" ";
		sql += "  , kg.kakaku_cd AS \"価格_CD\" ";
		sql += "  , kg.kakaku_digital AS \"価格_デジタル配信\" ";
		sql += "  , kg.shokaisyukka_mikomi AS \"初回出荷数見込み\" ";
		sql += "  , kg.mokuhyo_hambai_su AS \"目標販売数\" ";
		sql += "  , kg.mokuhyou_haishin_su AS \"目標配信数\" ";
		sql += "  , ko03.cd_naiyo AS \"地域\" ";
		sql += "  , kg.hanbaiyoteikosu_nihon AS \"初回出荷数(内訳)_日本\" ";
		sql += "  , kg.hanbaiyoteikosu_chugoku AS \"初回出荷数(内訳)_中国本土\" ";
		sql += "  , kg.hanbaiyoteikosu_asia AS \"初回出荷数(内訳)_アジア（中国本土除く）\" ";
		sql += "  , kg.hanbaiyoteikosu_chunanbei AS \"初回出荷数(内訳)_北米・中南米\" ";
		sql += "  , kg.hanbaiyoteikosu_europe AS \"初回出荷数(内訳)_ヨーロッパ\" ";
		sql += "  , kg.hanbaikoku_shosai AS \"販売国詳細\" ";
		sql += "  , kg.hanbai_jiki AS \"発売時期\" ";
		sql += "  , kg.jyouhou_syosyutu_jiki AS \"情報初出時期\" ";
		sql += "  , kg.uriba_tempo AS \"売り場_店舗\" ";
		sql += "  , kg.uriba_event AS \"売り場_イベント\" ";
		sql += "  , kg.uriba_ecsite AS \"売り場_ECサイト販売\" ";
		sql += "  , kg.urikata_ippanryutsu AS \"売り方_一般流通\" ";
		sql += "  , kg.urikata_juchuhambai AS \"売り方_受注販売\" ";
		sql += "  , kg.urikata_senkohambai AS \"売り方_先行販売\" ";
		sql += "  , kg.urikata_tempo_kaijogenteihambai AS \"売り方_店舗・会場限定販売\" ";
		sql += "  , kg.hanro AS \"主な販路\" ";
		sql += "  , ko04.cd_naiyo AS \"ジャケットヴィジュアル\" ";
		sql += "  , ko05.cd_naiyo AS \"リリースイベント\" ";
		sql += "  , ko06.cd_naiyo AS \"アソビストアでの取り扱い希望\" ";
		sql += "  , kg.syuroku_naiyo AS \"宣伝販促計画\" ";
		sql += "  , kg.gakkyoku_setsumei AS \"楽曲説明\" ";
		sql += "  , kg.kyokusu AS \"曲数\" ";
		sql += "  , ko07.cd_naiyo AS \"ドラマパート\" ";
		sql += "  , ko08.cd_naiyo AS \"封入特典\" ";
		sql += "  , ko09.cd_naiyo AS \"店舗特典\" ";
		sql += "  , kg.tokutei_naiyo AS \"特典内容\" ";
		sql += "  , kg.bikou AS \"備考\" ";
		sql += "  , ko10.cd_naiyo AS \"審査結果\" ";
		sql += "FROM ";
		sql += "  lo_t_kikaku AS ki ";
		sql += "  INNER JOIN lo_t_kikaku_gakkyoku AS kg ";
		sql += "    ON (kg.kikaku_id = ki.kikaku_id ";
		sql += "    AND kg.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
		sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
		sql += "    AND ko01.cd_id = CAST(ki.kikaku_shubetsu_cd AS varchar) ";
		sql += "    AND ko01.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
		sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_SINGLE_ALBAM + "' ";
		sql += "    AND ko02.cd_id = kg.single_albam ";
		sql += "    AND ko02.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
		sql += "    AND ko03.cd_id = kg.chiiki ";
		sql += "    AND ko03.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
		sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_JAKETTO_VISUAL + "' ";
		sql += "    AND ko04.cd_id = kg.jaketto_visual ";
		sql += "    AND ko04.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
		sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_RELEASE_EVENT + "' ";
		sql += "    AND ko05.cd_id = kg.release_event ";
		sql += "    AND ko05.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
		sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_ASOBISTORE + "' ";
		sql += "    AND ko06.cd_id = kg.asobistore ";
		sql += "    AND ko06.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
		sql += "    ON (ko07.cd_cls_id = '" + Constant.LO_CDCLS_DRAMAPART + "' ";
		sql += "    AND ko07.cd_id = kg.dramapart ";
		sql += "    AND ko07.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko08 ";
		sql += "    ON (ko08.cd_cls_id = '" + Constant.LO_CDCLS_HUNYU_TOKUTEN + "' ";
		sql += "    AND ko08.cd_id = kg.hunyu_tokuten ";
		sql += "    AND ko08.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko09 ";
		sql += "    ON (ko09.cd_cls_id = '" + Constant.LO_CDCLS_TENPO_TOKUTEN + "' ";
		sql += "    AND ko09.cd_id = kg.tenpo_tokuten ";
		sql += "    AND ko09.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko10 ";
		sql += "    ON (ko10.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
		sql += "    AND ko10.cd_id = kg.tenpo_tokuten ";
		sql += "    AND ko10.sakujo_flg = '0') ";
		sql += "WHERE ";
		sql += "  ki.sakujo_flg = '0' ";
		sql += "  AND ki.kikaku_id = ? ";
		sql += "ORDER BY ";
		sql += "  ki.kikaku_id ASC ";
		sql += "  , kg.kikaku_edaban ASC ";

	} else if (Constant.LO_KIKAKU_SHUBETSU_EVENT == kikaku_shubetsu_cd) {

		sql += "SELECT ";
		sql += "  ki.kikaku_id AS \"企画番号\" ";
		sql += "  , ki.kikaku_nm AS \"企画名\" ";
		sql += "  , ko01.cd_naiyo AS \"企画種別\" ";
		sql += "  , ki.title_nm AS \"タイトル\" ";
		sql += "  , ki.kaisha_nm AS \"ライセンシー名\" ";
		sql += "  , ROW_NUMBER() OVER (PARTITION BY ki.kikaku_id ORDER BY ke.kikaku_edaban ASC) AS \"商品仕様ID\" ";
		sql += "  , ke.event_campaign_nm AS \"イベント・キャンペーン名\" ";
		sql += "  , ke.event_kaishi_jiki AS \"イベント開始時期\" ";
		sql += "  , ke.event_shuryo_jiki AS \"イベント終了時期\" ";
		sql += "  , ke.syosyutu_jiki AS \"情報初出時期\" ";
		sql += "  , ko02.cd_naiyo AS \"券売有無\" ";
		sql += "  , ke.kembai_kaishi_jiki AS \"券売開始時期\" ";
		sql += "  , ke.ticket_kakaku AS \"チケット価格\" ";
		sql += "  , ke.kaisaibasho_jisshitempo AS \"開催場所・実施店舗（店舗数）\" ";
		sql += "  , ke.senden_hansoku AS \"海外を含む場合は対象国・地域を記載\" ";
		sql += "  , ko03.cd_naiyo AS \"新規グッズ製造\" ";
		sql += "  , ko04.cd_naiyo AS \"描き下ろし希望有無\" ";
		sql += "  , ko05.cd_naiyo AS \"ノベルティ\" ";
		sql += "  , ko06.cd_naiyo AS \"声優稼働\" ";
		sql += "  , ke.seiyu_kado_syosai AS \"声優稼働詳細\" ";
		sql += "  , ko07.cd_naiyo AS \"映像使用希望\" ";
		sql += "  , ke.eizo_shiyo_sozai AS \"映像使用想定素材\" ";
		sql += "  , ko08.cd_naiyo AS \"楽曲使用希望\" ";
		sql += "  , ke.gakkyoku_shiyo_sozai AS \"楽曲使用想定素材\" ";
		sql += "  , ke.senden_hansoku_kibo AS \"宣伝販促規模\" ";
		sql += "  , ke.shiyoryo_kikan_gokei AS \"使用料（期間合計）\" ";
		sql += "  , ke.sozaihi AS \"素材費\" ";
		sql += "  , ke.event_gaiyo AS \"イベント概要\" ";
		sql += "  , ke.bikou AS \"備考\" ";
		sql += "  , ko09.cd_naiyo AS \"審査結果\" ";
		sql += "FROM ";
		sql += "  lo_t_kikaku AS ki ";
		sql += "  INNER JOIN lo_t_kikaku_event AS ke ";
		sql += "    ON (ke.kikaku_id = ki.kikaku_id ";
		sql += "    AND ke.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
		sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
		sql += "    AND ko01.cd_id = CAST(ki.kikaku_shubetsu_cd AS varchar) ";
		sql += "    AND ko01.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
		sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEMBAI_UMU + "' ";
		sql += "    AND ko02.cd_id = ke.kembai_umu ";
		sql += "    AND ko02.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_SHINKI_GOODS_SEIZO + "' ";
		sql += "    AND ko03.cd_id = ke.shinki_goods_seizo ";
		sql += "    AND ko03.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
		sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU + "' ";
		sql += "    AND ko04.cd_id = ke.kakioroshi ";
		sql += "    AND ko04.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
		sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_NOVELTY + "' ";
		sql += "    AND ko05.cd_id = ke.novelty ";
		sql += "    AND ko05.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
		sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_SEIYU_KADO + "' ";
		sql += "    AND ko06.cd_id = ke.seiyu_kado ";
		sql += "    AND ko06.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
		sql += "    ON (ko07.cd_cls_id = '" + Constant.LO_CDCLS_EIZO_SHIYO_KIBO + "' ";
		sql += "    AND ko07.cd_id = ke.eizo_shiyo_kibo ";
		sql += "    AND ko07.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko08 ";
		sql += "    ON (ko08.cd_cls_id = '" + Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO + "' ";
		sql += "    AND ko08.cd_id = ke.gakkyoku_shiyo_kibo ";
		sql += "    AND ko08.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko09 ";
		sql += "    ON (ko09.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
		sql += "    AND ko09.cd_id = COALESCE(ke.ok_ng, '0') ";
		sql += "    AND ko09.sakujo_flg = '0') ";
		sql += "WHERE ";
		sql += "  ki.sakujo_flg = '0' ";
		sql += "  AND ki.kikaku_id = ? ";
		sql += "ORDER BY ";
		sql += "  ki.kikaku_id ASC ";
		sql += "  , ke.kikaku_edaban ASC ";

	} else if (Constant.LO_KIKAKU_SHUBETSU_EIZO == kikaku_shubetsu_cd) {

		sql += "SELECT ";
		sql += "  ki.kikaku_id AS \"企画番号\" ";
		sql += "  , ki.kikaku_nm AS \"企画名\" ";
		sql += "  , ko01.cd_naiyo AS \"企画種別\" ";
		sql += "  , ki.title_nm AS \"タイトル\" ";
		sql += "  , ki.kaisha_nm AS \"ライセンシー名\" ";
		sql += "  , ROW_NUMBER() OVER (PARTITION BY ki.kikaku_id ORDER BY ke.kikaku_edaban ASC) AS \"商品仕様ID\" ";
		sql += "  , ko02.cd_naiyo AS \"映像カテゴリ\" ";
		sql += "  , ke.shiyou_youto_nm AS \"使用用途名\" ";
		sql += "  , ke.riyou_ryo AS \"利用料\" ";
		sql += "  , ke.riyou_ryo_bikou AS \"利用料備考\" ";
		sql += "  , ke.chiiki AS \"地域\" ";
		sql += "  , ke.haishin_chiiki AS \"配信地域詳細\" ";
		sql += "  , ke.kaisai_basho AS \"開催場所\" ";
		sql += "  , ke.eizo_kaishi_jiki AS \"開始時期\" ";
		sql += "  , ke.eizo_shuryo_jiki AS \"利用終了時期\" ";
		sql += "  , ke.shuryo_bikou AS \"終了時期備考\" ";
		sql += "  , ke.syosyutu_jiki AS \"情報初出時期\" ";
		sql += "  , ke.riyo_saki AS \"利用先\" ";
		sql += "  , ke.senden_hansoku AS \"宣伝販促計画\" ";
		sql += "  , ko03.cd_naiyo AS \"映像利用希望\" ";
		sql += "  , ke.eizo_shiyoryo_syousai AS \"映像使用料詳細\" ";
		sql += "  , ko04.cd_naiyo AS \"楽曲利用希望\" ";
		sql += "  , ke.gakkyoku_shiyoryo_syousai AS \"楽曲使用料詳細\" ";
		sql += "  , ko05.cd_naiyo AS \"描き下ろし希望\" ";
		sql += "  , ke.kakioroshi_shiyoryo_syousai AS \"描き下ろし使用料詳細\" ";
		sql += "  , ko06.cd_naiyo AS \"ボイス利用希望\" ";
		sql += "  , ke.voice_shiyoryo_syousai AS \"ボイス使用料詳細\" ";
		sql += "  , ke.kikaku_setsumei AS \"企画説明\" ";
		sql += "  , ke.bikou AS \"備考\" ";
		sql += "  , ko07.cd_naiyo AS \"審査結果\" ";
		sql += "FROM ";
		sql += "  lo_t_kikaku AS ki ";
		sql += "  INNER JOIN lo_t_kikaku_eizo AS ke ";
		sql += "    ON (ke.kikaku_id = ki.kikaku_id ";
		sql += "    AND ke.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
		sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
		sql += "    AND ko01.cd_id = CAST(ki.kikaku_shubetsu_cd AS varchar) ";
		sql += "    AND ko01.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
		sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_EIZO_CATEGORY + "' ";
		sql += "    AND ko02.cd_id = CAST(ks.eizo_category AS varchar) ";
		sql += "    AND ko02.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_EIZO_SHIYO_KIBO + "' ";
		sql += "    AND ko03.cd_id = ke.eizo_riyo_kibo ";
		sql += "    AND ko03.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
		sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO + "' ";
		sql += "    AND ko04.cd_id = ke.gakkyoku_riyo_kibo ";
		sql += "    AND ko04.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
		sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU + "' ";
		sql += "    AND ko05.cd_id = ke.kakioroshi_kibo ";
		sql += "    AND ko05.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
		sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_SEIYU_KADO + "' ";
		sql += "    AND ko06.cd_id = ke.voice_riyo_kibo ";
		sql += "    AND ko06.sakujo_flg = '0') ";
		sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
		sql += "    ON (ko09.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
		sql += "    AND ko09.cd_id = COALESCE(ke.ok_ng, '0') ";
		sql += "    AND ko09.sakujo_flg = '0') ";
		sql += "WHERE ";
		sql += "  ki.sakujo_flg = '0' ";
		sql += "  AND ki.kikaku_id = ? ";
		sql += "ORDER BY ";
		sql += "  ki.kikaku_id ASC ";
		sql += "  , ke.kikaku_edaban ASC ";

	} else {

		ret.error = true;
		ret.msg = MessageManager.getMessage('KK02E017');
		return ret;

	}

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));

    // sql実行
    var db = new TenantDatabase();

    var result = db.select(sql, strParam, 0);
	if (result.error) {
		ret.error = true;
		ret.msg = MessageManager.getMessage('KK02E017');
		return ret;
	}
    ret.data = result.data;

    return ret;
}

function getTsuchisaki(ticketId) {
	Constant.load('lo/common_libs/lo_const');
	var mailKey1 = 'mail_1';
	var mailKey3 = 'mail_3';
	var mailKey4 = 'mail_4';
	var mailKey5 = 'mail_5';
	var mailGroupList = {};
	mailGroupList[Constant.LO_MAIL_GROUP_KIAN] = mailKey1;
	mailGroupList[Constant.LO_MAIL_GROUP_END] = mailKey3;
	mailGroupList[Constant.LO_MAIL_GROUP_KEIYAKU] = mailKey4;
	mailGroupList[Constant.LO_MAIL_GROUP_KEIJOU] = mailKey5;
	$tsuchisakiObj = Content.executeFunction('lo/common_libs/lo_send_mail', 'getMailSettingUsers', ticketId, mailGroupList);
	
	var noUserObj = {user_cd : "", user_name : "---"};
	if (!$tsuchisakiObj[mailKey1] || $tsuchisakiObj[mailKey1].length == 0) {
		$tsuchisakiObj[mailKey1] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey3] || $tsuchisakiObj[mailKey3].length == 0) {
		$tsuchisakiObj[mailKey3] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey4] || $tsuchisakiObj[mailKey4].length == 0) {
		$tsuchisakiObj[mailKey4] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey5] || $tsuchisakiObj[mailKey5].length == 0) {
		$tsuchisakiObj[mailKey5] = [noUserObj];
	}
	
}

function getNodeSettings(systemMatterId, cplFlg) {
	var noUserObj = {user_cd : "", user_name : "---"};
	var applyUser = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPLY, cplFlg);
	if (applyUser == null) {
		$keiro["apply"] = noUserObj;
	} else {
		 $keiro["apply"] = applyUser;
	}
	var app_0User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_0, cplFlg);
	if (app_0User == null) {
		$keiro["appr_0"] = noUserObj;
	} else {
		$keiro["appr_0"] = app_0User;
	}
	var app_1User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_1, cplFlg);
	if (app_1User == null) {
		$keiro["appr_1"] = noUserObj;
	} else {
		$keiro["appr_1"] = app_1User;
	}
	var app_2User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_2, cplFlg);
	if (app_2User == null) {
		$keiro["appr_2"] = noUserObj;
	} else {
		$keiro["appr_2"] = app_2User;
	}
	var app_lastUser = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_LAST, cplFlg);
	if (app_lastUser == null) {
		$keiro["appr_last"] = noUserObj;
	} else {
		$keiro["appr_last"] = app_lastUser;
	}
	// 現在実行中
	if (cplFlg) {
		$keiroCpl.apply = true;
		$keiroCpl.appr_0 = true;
		$keiroCpl.appr_1 = true;
		$keiroCpl.appr_2 = true;
		$keiroCpl.appr_last = true;
	} else {
		var condNoMatterProperty = new ListSearchConditionNoMatterProperty();
		var actvMatterNode = new ActvMatterNode("ja", systemMatterId);
		var excutableUserListObj = actvMatterNode.getExecutableUserList(condNoMatterProperty);
		if (excutableUserListObj.resultFlag && excutableUserListObj.data != null) {
			var excutableUserList = excutableUserListObj.data;
			if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_0) {
				$keiroCpl.apply = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_1) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_2) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
				$keiroCpl.appr_1 = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_LAST) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
				$keiroCpl.appr_1 = true;
				$keiroCpl.appr_2 = true;
			}
		}
	}
}

/**
 * 明細テーブルのロイヤリティ金額でメインテーブルを更新する
 */
function updateRoyalty(kikakuId) {	

	var db = new TenantDatabase();
	
	//詳細テーブルデータを取得（データがある場合は、新規番号が発番されている前提）			
	var whereDetailObject = [
	DbParameter.string(kikakuId)
	];
	
	//企画データから企画種別を取得
	var sql = "";
	sql += "  SELECT kikaku_shubetsu_cd" ;	
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ;
	
	var result = db.select(sql,whereDetailObject);
	
	var kikaku_shubetsu_cd = result.data[0].kikaku_shubetsu_cd;
		
	//最も早い発売時期、ロイヤリティ金額の合計金額をメインテーブルに追加
	sql = "";
	sql += "  SELECT " ;
	sql += "  SUM(s.royalty_kingaku) AS royalty_kingaku" ;
	
	//企画種別によって、参照する詳細テーブルを切り替える
	switch(kikaku_shubetsu_cd.toString()){
	case Constant.LO_KIKAKU_SHUBETSU_ITEM:
		sql += "  ,MIN(s.hanbai_jiki) AS hanbai_jiki" ;
		sql += " FROM lo_t_kikaku_shohin as s " ; 
		break;
	case Constant.LO_KIKAKU_SHUBETSU_MUSIC:
		sql += "  ,MIN(s.hanbai_jiki) AS hanbai_jiki" ;
		sql += " FROM lo_t_kikaku_gakkyoku as s " ; 
		break;
	case Constant.LO_KIKAKU_SHUBETSU_EVENT:
		sql += "  ,MIN(s.event_kaishi_jiki) AS hanbai_jiki" ;
		sql += " FROM lo_t_kikaku_event as s " ; 
		break;
	case Constant.LO_KIKAKU_SHUBETSU_EIZO:
		sql += "  ,MIN(s.eizo_kaishi_jiki) AS hanbai_jiki" ;
		sql += " FROM lo_t_kikaku_eizo as s " ; 
		break;
	default:
		sql += "  ,MIN(s.hanbai_jiki) AS hanbai_jiki" ;
		sql += " FROM lo_t_kikaku_shohin as s " ; 
		break;	
	
	}
	
	sql += " WHERE s.sakujo_flg ='0' " ; 
	sql += "   AND s.kikaku_id =? " ;			
	
	var result = db.select(sql,whereDetailObject);
		
	var kikakuShohinData = result.data[0];
	
	var dataSet = {
	               "royalty_kingaku": kikakuShohinData.royalty_kingaku
	               ,"hanbai_jiki": kikakuShohinData.hanbai_jiki
	               };	
	
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	
	var whereObject = [
    DbParameter.string(kikakuId)
	];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	result = db.update('lo_t_kikaku', dataSet,"kikaku_id = ? ", whereObject);
	
	var ret = {};
	if (result.countRow != 1) {
		ret.error = true;
		ret.msg = MessageManager.getMessage('ER01E004');
		Transaction.rollback();
		return ret;
	}
}

/**
 * 請求書送付先情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveSeikyushoSofusakiList(request) {
	Logger.getLogger().info(' [retrieveSeikyushoSofusakiList]　契約内容確認表示 request ' + ImJson.toJSONString(request, true));
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveSeikyushoSofusakiList", request.kaisha_id);
	}
}

