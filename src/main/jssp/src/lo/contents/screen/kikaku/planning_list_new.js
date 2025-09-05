Constant.load("lo/common_libs/lo_const");
var $production_flg = false; //ライセンスプロダクションフラグ
var $userInfo = {
    userName : ""
};

// グループにより「担当者」キャプションを切り替える
var $charge_caption = "担当者";

var $initialSearching = false; // 初期検索実施
var $form = {
	ip : ""
	, title_nm : ""
	, kikaku_nm : ""
	, kikaku_status : ""
	, status_list : []
	, not_finish : true
	, kikaku_shohin_nm : ""
	, kikaku_id : ""
	, shinsei_from : ""
	, shinsei_to : ""
	, tantou_sha : ""
	, wf_user : ""
	, kaisha_nm : ""
};

var $banadiumFormatVersion = '1';

var $showColumnDef = '';
	
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
	
    // 画面初期表示
    getDispData();
    
    parseInitialParameter(request);
    
    // ユーザ情報取得
	var userContext = Contexts.getUserContext();
	$userInfo.userName = userContext.userProfile.userName;
	
	$showColumnDef = Constant.LO_CDCLS_KIKAKU_LIST_SHOW_COLUMN;
	
	$form.show_column_map = Content.executeFunction("lo/common_libs/lo_common_fnction", "getListShowColumnDefs", $showColumnDef);	
}

	
/**
 * 画面表示項目取得
 */
function getDispData() {

	// ステータス取得
    var statusList = [];
    statusList.push({label:"",value:"",selected:true});
    
    if ($production_flg){
    	$charge_caption = "BNE担当者";
    	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_KIKAKU_STATUS_PR);
    }else{
    	$charge_caption = "ライセンシー担当者";
    	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_KIKAKU_STATUS_LI);
    }

	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "mergeLabelList", statusList, ",");
    $form.status_list = statusList;
}

/**
 * リクエストパラメータから、画面の初期入力情報を設定します。
 * 
 * @param {Object} request リクエスト
 */
function parseInitialParameter(request) {

	$initialSearching = false;

	if ('ip' in request) {
		$initialSearching = true;
		$form.ip = request.ip;
	}

	if ('title_nm' in request) {
		$initialSearching = true;
		$form.title_nm = request.title_nm;
	}

	if ('kikaku_nm' in request) {
		$initialSearching = true;
		$form.kikaku_nm = request.kikaku_nm;
	}

	var kikakuStatusDefaultSelected = false;
	if ('kikaku_status' in request) {

		$initialSearching = true;
		$form.kikaku_status = request.kikaku_status;
		kikakuStatusDefaultSelected = setSelectedProperty($form.status_list, $form.kikaku_status);
		if (kikakuStatusDefaultSelected == false) {
			var selectValues = $form.kikaku_status.split(",");
			for (var key in selectValues) {
				var selectValue = selectValues[key];
				kikakuStatusDefaultSelected = setSelectedProperty($form.status_list, selectValue, ",");
				if (kikakuStatusDefaultSelected) {
					break;
				}
			}
		}
	}

	if ('kikaku_shohin_nm' in request) {
		$initialSearching = true;
		$form.kikaku_shohin_nm = request.kikaku_shohin_nm;
	}

	if ('kikaku_id' in request) {
		$initialSearching = true;
		$form.kikaku_id = request.kikaku_id;
	}

	if ('shinsei_from' in request) {
		$initialSearching = true;
		if (request.shinsei_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.shinsei_from = request.shinsei_from;
		} else {
			$form.shinsei_from = "";
		}
	}

	if ('shinsei_to' in request) {
		$initialSearching = true;
		if (request.shinsei_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.shinsei_to = request.shinsei_to;
		} else {
			$form.shinsei_to = "";
		}
	}

	if ('tantou_sha' in request) {
		$initialSearching = true;
		$form.tantou_sha = request.tantou_sha;
	}
	
	if ('wf_user' in request) {
		$initialSearching = true;
		$form.wf_user = request.wf_user;
	}
	
	if ('kaisha_nm' in request) {
		$initialSearching = true;
		$form.kaisha_nm = request.kaisha_nm;
	}

	if (kikakuStatusDefaultSelected) {
		$form.not_finish = false;
	} else {
		if ('not_finish' in request) {
			$initialSearching = true;
			$form.not_finish = request.not_finish=="on" ? true : false;
		} else if($initialSearching) {
			$form.not_finish = false;
		}
	}
}

/**
 * 選択状態の設定処理
 * @param {array} list selectedを付与する対象のオブジェクトリスト
 * @param {string} selectValue selectedを付与するvalue値
 * @param {string} delim listのvalue値を分割する区切り文字（指定がなければ分割しない）
 * @returns {boolean} true:selectedを付与できた場合/false:selectedを付与できなかった場合
 */
function setSelectedProperty(list, selectValue, delim) {

	for (var key in list) {
		var data = list[key];
		if (data.value == selectValue) {
			data.selected = true;
			return true;
		}
		if (typeof delim != "undefined") {
			var values = data.value.split(delim);
			if (values.indexOf(selectValue) >= 0) {
				data.selected = true;
				return true;
			}
		}
	}
	return false;
}

/**
 * 企画一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKikakuList(param) {
	
    var accountContext = Contexts.getAccountContext();
    var usercd = accountContext.userCd;
    var locale = accountContext.locale;

	// ライセンスプロダクションか判断
	var is_production = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
    
	var sql = "" ;
	sql += " SELECT DISTINCT " ;
	sql += "   k.kikaku_id " ; 
	sql += "  ,k.kikaku_nm " ; 
	sql += "  ,k.ip_nm " ; 
	sql += "  ,k.kikaku_shubetsu_cd " ; 
	sql += "  ,ko01.cd_naiyo as kikaku_shubetsu_name " ; 
	sql += "  ,k.kikaku_status " ; 
	sql += "  ,ko03.sort_no AS kikaku_status_order ";
	sql += "  ,k.title_nm " ; 
	sql += "  ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; 
	sql += "  ,k.kaisha_nm " ; 
	sql += "  ,k.tantou_sha " ;  
	sql += "  ,k.bne_tantou_sha " ; 
	sql += "  ,ko02.cd_naiyo as shohyo " ; 
	sql += "  ,'' as ip " ; 
	sql += "  ,imw.auth_user_name " ; // ワーフクローの処理者名
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "   ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
	sql += "   AND ko01.cd_id = cast(k.kikaku_shubetsu_cd as character varying) ";
	sql += "   AND ko01.sakujo_flg ='0') ";
	sql += " LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "   ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA + "' ";
	sql += "   AND ko02.cd_id = k.shohyo_chosa_kekka ";
	sql += "   AND ko02.sakujo_flg ='0') ";
    if(is_production) {
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_LIST_STATUS_ORDER_PR + "' ";
		sql += "    AND ko03.cd_id = k.kikaku_status ";
		sql += "    AND ko03.sakujo_flg ='0') ";
    } else {
    	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
    	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_STATUS_LI + "' ";
    	sql += "    AND ko03.cd_id = k.kikaku_status ";
    	sql += "    AND ko03.sakujo_flg ='0') ";
    }
	sql += " LEFT JOIN lo_t_kikaku_shohin AS ks ";
	sql += "   ON (k.kikaku_id = ks.kikaku_id ";
	sql += "   AND k.kikaku_shubetsu_cd = 1 ";
	sql += "   AND ks.sakujo_flg ='0') ";
	
	// ワークフローの処理者取得----------
	// todo　暫定対応もう少しテーブル整理する
	sql += " left join " ; 
	sql += " (select actv.matter_name,users.auth_user_name from imw_t_actv_matter actv " ; 
	sql += "  inner join " ; 
	sql += "   (select system_matter_id,string_agg(auth_user_name,','order by auth_user_name) as auth_user_name " ; 
	sql += "    from imw_t_actv_executable_user  " ; 
	sql += "    where locale_id = '" + locale+ "'" ; 
	sql += "    group by system_matter_id) users " ; 
	sql += "  on actv.system_matter_id = users.system_matter_id " ; 
	//sql += "  where users.locale_id = '" + locale+ "'" ; 
	//sql += "   and  users.auth_user_code = '" + usercd+"'"; 
	sql += " ) imw " ;
	sql += " on k.kikaku_id  = imw.matter_name " ;
	// ----------------------------------------
	
		
	sql += " WHERE k.sakujo_flg ='0' " ; 
	
	// 動的Where句
	var strSearchWhere="";
	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    // 部分一致
    columnNameMap["ip"] = {col:"k.ip_nm",comp:"like"};
    columnNameMap["title_nm"] = {col:"k.title_nm",comp:"like"};
    columnNameMap["kaisha_nm"] = {col:"k.kaisha_nm",comp:"eq"};
    columnNameMap["kikaku_nm"] = {col:"k.kikaku_nm",comp:"like"};
    columnNameMap["kikaku_id"] = {col:"k.kikaku_id",comp:"like"};
    columnNameMap["kikaku_shohin_nm"] = {col:"ks.shohin_nm",comp:"like"};

    // 条件以外
    columnNameMap["not_finish"] = {col:"k.kikaku_status",comp:"ni"};
    if(param.not_finish == "on") {
    	param.not_finish = [Constant.LO_STATUS_KANRYO, Constant.LO_STATUS_IKO];
    } else {
    	param.not_finish = [];
    }
    
    // 複数
    columnNameMap["kikaku_status"] = {col:"k.kikaku_status",comp:"in"};
    
    // 範囲
    //columnNameMap["shinsei_from"] = {col:"k.shinsei_bi",comp:"from"};
    //columnNameMap["shinsei_to"] = {col:"k.shinsei_bi",comp:"to"};
    //todo テーブルの日付をvarchaｒに変えるまでの暫定対応
    columnNameMap["shinsei_from"] = {col:"to_char(k.shinsei_bi,'YYYY/MM/DD')",comp:"ge"};
    columnNameMap["shinsei_to"] = {col:"to_char(k.shinsei_bi,'YYYY/MM/DD')",comp:"le"};
    
    // 「担当者」の検索対象…プロダクション→BNE 担当者(bne_tantou_sha)、ライセンシー→ライセンシー担当者(tantou_sha)
    if(is_production){
    	columnNameMap["wf_user"] = {col:"k.bne_tantou_sha",comp:"like"};
    	
    	if (!(param.kikaku_status) ||
    			(Array.isArray(param.kikaku_status) && param.kikaku_status.length == 0)) {
    	    columnNameMap["not_ichiji_hozon"] = {col:"k.kikaku_status",comp:"ne"};
        	param.not_ichiji_hozon = Constant.LO_STATUS_ICHIJI_HOZON;
    	}

    }else{
    	columnNameMap["tantou_sha"] = {col:"k.tantou_sha",comp:"like"};
    	// ライセンシーの場合会社は固定
    	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
    	columnNameMap["kaisha_id"] = {col:"k.kaisha_id",comp:"eq"};
    }
    
    // 条件設定
    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

    sql += " order by kikaku_status_order, shinsei_bi desc, k.kikaku_id ";
	// todo 表示件数制限（ダミー） 実際は画面の表示件数とページングで色々変える
	// 削除（THATS_RIGHTS-1367 B92 各一覧画面の検索結果について確認です）
	//sql += " LIMIT 100 ";

    // sql実行
    var db = new TenantDatabase();
    Logger.getLogger().info(' [searchKikakuList]　企画一覧検索 SQL ' + sql + " strParam " + ImJson.toJSONString(param, true));
    var result = db.select(sql,strParam);
    
    // ステータス設定
    var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KIKAKU);
	result.data = obj;
    
    // セッション登録
    Client.set('searchCondKikaku', {where: condition.sql, param: strParam});
    
    return result;
}

/**
 * CSVファイル情報取得
 * @returns {object} 検索結果
 */
function getKikakuCsvData() {
	// ライセンスプロダクションか判断
	var proFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
	
	// 検索条件
	var searchCond = Client.get('searchCondKikaku');
	
	// SQL生成
	var sql = "\n";
	sql += " SELECT\n";
	sql += "   k.kikaku_id AS \"企画ID\"\n";
	sql += "   , k.kikaku_nm AS \"企画名\"\n";
	sql += "   , k0005.cd_naiyo AS \"企画種別\"\n";
	sql += "   , k.ip_nm AS \"IP\"\n";
	sql += "   , k.title_nm AS \"タイトル\"\n";
	sql += "   , ki_status.cd_naiyo AS \"企画進捗\"\n";
	sql += "   , to_char(k.shinsei_bi, 'YYYY/MM/DD') AS \"申請日\"\n";
	if(proFlg) {
		sql += "   , k.kaisha_nm AS \"会社名\"\n";
	}
	sql += "   , k.tantou_sha AS \"担当者\"\n";
	if(proFlg) {
		sql += "   , k.tag AS \"タグ\"\n";
		sql += "   , to_char(k.kakunin_bi, 'YYYY/MM/DD') AS \"確認日\"\n";
		sql += "   , k.bne_tantou_sha AS \"BNE担当者\"\n";
		sql += "   , k0030.cd_naiyo AS \"簡易商標調査結果\"\n";
	}
	sql += "   , kyodaku.kyodaku_id AS \"許諾番号\"\n";
	sql += "   , ky_status.cd_naiyo AS \"許諾ステータス\"\n";
	sql += "   , COALESCE(ks.kikaku_edaban, kg.kikaku_edaban, ke.kikaku_edaban) AS \"商品仕様ID\"\n";
	sql += "   , COALESCE(ks.shohin_nm, kg.gakkyoku_nm, ke.event_campaign_nm) AS \"商品仕様名\"\n";
	sql += "   , k0006.cd_naiyo AS \"カテゴリ\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd in (1,3) THEN COALESCE(ks.zeinuki_jodai, ke.zeinuki_jodai)::text\n";
	sql += "          ELSE '－' END AS \"税抜上代\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.kakaku_cd::text\n";
	sql += "          ELSE '－' END AS \"価格(CD)\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.kakaku_digital::text\n";
	sql += "          ELSE '－' END AS \"価格(デジタル配信)\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3 THEN ke.ticket_kakaku::text\n";
	sql += "          ELSE '－' END AS \"チケット価格\"\n";
	sql += "   , COALESCE(ks.mokuhyo_hambai_su, kg.mokuhyo_hambai_su, ke.mokuhyo_hambai_su) AS \"目標販売数\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.mokuhyou_haishin_su::text\n";
	sql += "          ELSE '－' END AS \"目標配信数\"\n";
	sql += "   , COALESCE(ks.shokai_seisanyotei_su, kg.shokaisyukka_mikomi, ke.shokai_seisanyotei_su) AS \"初回生産(出荷)予定数\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 1 THEN ks.sku::text\n";
	sql += "          ELSE '－' END AS \"SKU\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd in (1,2)\n";
	sql += "          THEN k0007.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"地域\"\n";
	sql += "   , COALESCE(ks.hanbai_jiki, kg.hanbai_jiki, ke.kembai_kaishi_jiki) AS \"発売(券売)時期\"\n";
	sql += "   , COALESCE(ks.jyouhou_syosyutu_jiki, kg.jyouhou_syosyutu_jiki, ke.syosyutu_jiki) AS \"情報初出時期\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3 THEN ke.event_kaishi_jiki\n";
	sql += "          ELSE '－' END AS \"イベント開始時期\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3 THEN ke.event_shuryo_jiki\n";
	sql += "          ELSE '－' END AS \"イベント終了時期\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd in (1,3)\n";
	sql += "          THEN k0010.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"描下ろし希望有無\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0014.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"ジャケットヴィジュアル\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd in (1,2)\n";
	sql += "          THEN k0011.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"アソビストアでの取り扱い希望\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0013.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"シングルorアルバム\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN CASE COALESCE(kg.hanbai_keitai_cd,'0')\n";
	sql += "                 || COALESCE(kg.hanbai_keitai_digital,'0')\n";
	sql += "                 || COALESCE(kg.hanbai_keitai_sonota,'0')\n";
	sql += "               WHEN '111' THEN 'CD、デジタル配信、その他'\n";
	sql += "               WHEN '110' THEN 'CD、デジタル配信'\n";
	sql += "               WHEN '101' THEN 'CD、その他'\n";
	sql += "               WHEN '100' THEN 'CD'\n";
	sql += "               WHEN '011' THEN 'デジタル配信、、その他'\n";
	sql += "               WHEN '010' THEN 'デジタル配信'\n";
	sql += "               WHEN '001' THEN 'その他'\n";
	sql += "               ELSE NULL END\n";
	sql += "          ELSE '－' END AS \"販売形態\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN CASE COALESCE(kg.digital_haishin_kobetsuhaishin,'0')\n";
	sql += "                 || COALESCE(kg.digital_haishin_cdtani,'0')\n";
	sql += "                 || COALESCE(kg.digital_haishin_subscription,'0')\n";
	sql += "               WHEN '111' THEN '個別配信、CD単位で配信、サブスクリプション'\n";
	sql += "               WHEN '110' THEN '個別配信、CD単位で配信'\n";
	sql += "               WHEN '101' THEN '個別配信、サブスクリプション'\n";
	sql += "               WHEN '100' THEN '個別配信'\n";
	sql += "               WHEN '011' THEN 'CD単位で配信、サブスクリプション'\n";
	sql += "               WHEN '010' THEN 'CD単位で配信'\n";
	sql += "               WHEN '001' THEN 'サブスクリプション'\n";
	sql += "               ELSE NULL END\n";
	sql += "          ELSE '－' END AS \"デジタル配信詳細\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0015.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"リリースイベント\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0019.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"券売有無\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0020.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"新規グッズ製造\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0021.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"ノベルティ\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0022.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"声優稼働\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0023.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"映像使用希望\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 3\n";
	sql += "          THEN k0024.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"楽曲使用希望\"\n";
	if(proFlg) {
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 1 THEN ks.sozai_mitsumori::text\n";
		sql += "          ELSE '－' END AS \"素材見積もり\"\n";
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 1 THEN ks.ryouritu::text\n";
		sql += "          ELSE '－' END AS \"料率\"\n";
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 1 THEN ks.sample::text\n";
		sql += "          ELSE '－' END AS \"サンプル数\"\n";
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.genban_shiyoryo_mikomi::text\n";
		sql += "          ELSE '－' END AS \"原盤使用料見込み\"\n";
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.chosakuken_shiyoro_mikomi::text\n";
		sql += "          ELSE '－' END AS \"音楽著作使用料見込み\"\n";
		sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2 THEN kg.character_shiyoryo_mikomi::text\n";
		sql += "          ELSE '－' END AS \"キャラクター使用料見込み\"\n";
	}
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0016.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"ドラマパート\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0017.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"封入特典\"\n";
	sql += "   , CASE WHEN k.kikaku_shubetsu_cd = 2\n";
	sql += "          THEN k0018.cd_naiyo\n";
	sql += "          ELSE '－' END AS \"店舗特典\" \n";
	if(proFlg) {
		sql += "   , COALESCE(ks.riyu_joken, kg.riyu_joken, ke.riyu_joken) AS \"理由・条件\"\n";
		sql += "   , COALESCE(ks.royalty_kingaku::varchar, kg.royalty_kingaku::varchar, ke.royalty_kingaku::varchar) AS \"ロイヤリティ金額\"\n";
		sql += "   , k0012.cd_naiyo AS \"承認\"\n";
	}
	sql += " FROM\n";
	sql += "   lo_t_kikaku as k \n";
	sql += "   LEFT JOIN lo_t_kikaku_shohin ks \n";
	sql += "     ON k.kikaku_id = ks.kikaku_id \n";
	sql += "     AND k.kikaku_shubetsu_cd = 1 \n";
	sql += "     AND ks.sakujo_flg ='0' \n";
	sql += "   LEFT JOIN lo_t_kikaku_gakkyoku kg \n";
	sql += "     ON k.kikaku_id = kg.kikaku_id \n";
	sql += "     AND k.kikaku_shubetsu_cd = 2 \n";
	sql += "     AND kg.sakujo_flg ='0' \n";
	sql += "   LEFT JOIN lo_t_kikaku_event ke \n";
	sql += "     ON k.kikaku_id = ke.kikaku_id \n";
	sql += "     AND k.kikaku_shubetsu_cd = 3 \n";
	sql += "     AND ke.sakujo_flg ='0' \n";
	sql += "   LEFT JOIN ( \n";
	sql += "     SELECT DISTINCT\n";
	sql += "       himo.kikaku_id\n";
	sql += "       , FIRST_VALUE(kyo.kyodaku_id) OVER win AS kyodaku_id \n";
	sql += "       , FIRST_VALUE(kyo.kyodaku_status) OVER win AS kyodaku_status \n";
	sql += "     FROM\n";
	sql += "       lo_t_kyodaku_kikaku_himozuke himo \n";
	sql += "       INNER JOIN lo_t_kyodaku kyo \n";
	sql += "         ON himo.kyodaku_id = kyo.kyodaku_id \n";
	sql += "     WHERE\n";
	sql += "       himo.sakujo_flg = '0' \n";
	sql += "       AND kyo.sakujo_flg = '0'\n";
	sql += "     WINDOW win AS (PARTITION BY himo.kikaku_id ORDER BY kyo.touroku_bi DESC)\n";
	sql += "   ) kyodaku \n";
	sql += "     ON k.kikaku_id = kyodaku.kikaku_id\n";
	sql += "   LEFT JOIN lo_m_koteichi k0005    /* 企画種別 */\n";
	sql += "     ON k0005.cd_cls_id = '"+ Constant.LO_CDCLS_KIKAKU_SHUBETSU +"'\n";
	sql += "     AND k.kikaku_shubetsu_cd = k0005.cd_id::smallint\n";
	sql += "     AND k0005.sakujo_flg = '0'\n";
	if(proFlg) {
		sql += "   LEFT JOIN lo_m_koteichi ki_status    /* 企画ステータス（ライセンスプロダクション用） */\n";
		sql += "     ON ki_status.cd_cls_id = '"+ Constant.LO_CDCLS_KIKAKU_STATUS_PR +"'\n";
		sql += "     AND k.kikaku_status = ki_status.cd_id\n";
		sql += "     AND ki_status.sakujo_flg = '0'\n";
		sql += "   LEFT JOIN lo_m_koteichi ky_status    /* 許諾ステータス（ライセンスプロダクション用） */\n";
		sql += "     ON ky_status.cd_cls_id = '"+ Constant.LO_CDCLS_KYODAKU_STATUS_PR +"'\n";
		sql += "     AND kyodaku.kyodaku_status = ky_status.cd_id\n";
		sql += "     AND ky_status.sakujo_flg = '0'\n";
		sql += "   LEFT JOIN lo_m_koteichi k0030    /* 簡易商標調査結果 */\n";
		sql += "     ON k0030.cd_cls_id = '"+ Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA +"'\n";
		sql += "     AND COALESCE(TRIM(k.shohyo_chosa_kekka), '0') = k0030.cd_id\n";
		sql += "     AND k0030.sakujo_flg = '0'\n";
	} else {
		sql += "   LEFT JOIN lo_m_koteichi ki_status    /* 企画ステータス（ライセンシー用） */\n";
		sql += "     ON ki_status.cd_cls_id = '"+ Constant.LO_CDCLS_KIKAKU_STATUS_LI +"'\n";
		sql += "     AND k.kikaku_status = ki_status.cd_id\n";
		sql += "     AND ki_status.sakujo_flg = '0'\n";
		sql += "   LEFT JOIN lo_m_koteichi ky_status    /* 許諾ステータス（ライセンシー用） */\n";
		sql += "     ON ky_status.cd_cls_id = '"+ Constant.LO_CDCLS_KYODAKU_STATUS_LI +"'\n";
		sql += "     AND kyodaku.kyodaku_status = ky_status.cd_id\n";
		sql += "     AND ky_status.sakujo_flg = '0'\n";
	}
	sql += "   LEFT JOIN lo_m_koteichi k0006    /* カテゴリ */\n";
	sql += "     ON k0006.cd_cls_id = '"+ Constant.LO_CDCLS_SHOHIN_CATEGORY +"'\n";
	sql += "     AND COALESCE(ks.shohin_category, kg.gakkyoku_category, ke.event_category)::varchar(1) = k0006.cd_id\n";
	sql += "     AND k0006.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0007    /* 地域 */\n";
	sql += "     ON k0007.cd_cls_id = '"+ Constant.LO_CDCLS_CHIIKI +"'\n";
	sql += "     AND COALESCE(ks.chiiki, kg.chiiki) = k0007.cd_id\n";
	sql += "     AND k0007.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0010    /* 描き下ろし希望有無 */\n";
	sql += "     ON k0010.cd_cls_id = '"+ Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU +"'\n";
	sql += "     AND COALESCE(ks.kakiorosi_kibou_umu, ke.kakioroshi) = k0010.cd_id\n";
	sql += "     AND k0010.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0014    /* ジャケットヴィジュアル */\n";
	sql += "     ON k0014.cd_cls_id = '"+ Constant.LO_CDCLS_JAKETTO_VISUAL +"'\n";
	sql += "     AND kg.jaketto_visual = k0014.cd_id\n";
	sql += "     AND k0014.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0011    /* アソビストアでの取り扱い希望 */\n";
	sql += "     ON k0011.cd_cls_id = '"+ Constant.LO_CDCLS_ASOBISTORE +"'\n";
	sql += "     AND COALESCE(ks.asobistore, kg.asobistore) = k0011.cd_id\n";
	sql += "     AND k0011.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0013    /* シングルorアルバム */\n";
	sql += "     ON k0013.cd_cls_id = '"+ Constant.LO_CDCLS_SINGLE_ALBAM +"'\n";
	sql += "     AND kg.single_albam = k0013.cd_id\n";
	sql += "     AND k0013.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0015    /* リリースイベント */\n";
	sql += "     ON k0015.cd_cls_id = '"+ Constant.LO_CDCLS_RELEASE_EVENT +"'\n";
	sql += "     AND kg.release_event = k0015.cd_id\n";
	sql += "     AND k0015.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0019    /* 券売有無 */\n";
	sql += "     ON k0019.cd_cls_id = '"+ Constant.LO_CDCLS_KEMBAI_UMU +"'\n";
	sql += "     AND ke.kembai_umu = k0019.cd_id\n";
	sql += "     AND k0019.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0020    /* 新規グッズ製造 */\n";
	sql += "     ON k0020.cd_cls_id = '"+ Constant.LO_CDCLS_SHINKI_GOODS_SEIZO +"'\n";
	sql += "     AND ke.shinki_goods_seizo = k0020.cd_id\n";
	sql += "     AND k0020.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0021    /* ノベルティ */\n";
	sql += "     ON k0021.cd_cls_id = '"+ Constant.LO_CDCLS_NOVELTY +"'\n";
	sql += "     AND ke.novelty = k0021.cd_id\n";
	sql += "     AND k0021.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0022    /* 声優稼働 */\n";
	sql += "     ON k0022.cd_cls_id = '"+ Constant.LO_CDCLS_SEIYU_KADO +"'\n";
	sql += "     AND ke.seiyu_kado = k0022.cd_id\n";
	sql += "     AND k0022.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0023    /* 映像使用希望 */\n";
	sql += "     ON k0023.cd_cls_id = '"+ Constant.LO_CDCLS_EIZO_SHIYO_KIBO +"'\n";
	sql += "     AND ke.eizo_shiyo_kibo = k0023.cd_id\n";
	sql += "     AND k0023.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0024    /* 楽曲使用希望 */\n";
	sql += "     ON k0024.cd_cls_id = '"+ Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO +"'\n";
	sql += "     AND ke.gakkyoku_shiyo_kibo = k0024.cd_id\n";
	sql += "     AND k0024.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0016    /* ドラマパート */\n";
	sql += "     ON k0016.cd_cls_id = '"+ Constant.LO_CDCLS_DRAMAPART +"'\n";
	sql += "     AND kg.dramapart = k0016.cd_id\n";
	sql += "     AND k0016.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0017    /* 封入特典 */\n";
	sql += "     ON k0017.cd_cls_id = '"+ Constant.LO_CDCLS_HUNYU_TOKUTEN +"'\n";
	sql += "     AND kg.hunyu_tokuten = k0017.cd_id\n";
	sql += "     AND k0017.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0018    /* 店舗特典 */\n";
	sql += "     ON k0018.cd_cls_id = '"+ Constant.LO_CDCLS_TENPO_TOKUTEN +"'\n";
	sql += "     AND kg.tenpo_tokuten = k0018.cd_id\n";
	sql += "     AND k0018.sakujo_flg = '0'\n";
	if(proFlg) {
		sql += "   LEFT JOIN lo_m_koteichi k0012    /* 承認 */\n";
		sql += "     ON k0012.cd_cls_id = '"+ Constant.LO_CDCLS_OK_NG +"'\n";
		sql += "     AND COALESCE(TRIM(ks.ok_ng), TRIM(kg.ok_ng), TRIM(ke.ok_ng), '0') = k0012.cd_id\n";
		sql += "     AND k0012.sakujo_flg = '0'\n";
	}
	sql += " WHERE\n";
	sql += "   k.sakujo_flg = '0'\n";
	sql += searchCond.where;
	sql += " ORDER BY k.kikaku_id, \"商品仕様ID\"\n";
	
	// sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,searchCond.param);
//    Logger.getLogger().info(' [getKikakuCsvData]　企画一覧CSV SQL ' + sql);
    
    return result;
}
