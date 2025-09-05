Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};

var $initialSearching = false; // 初期検索実施
var $form = {
	ip_nm : ""
	, title_nm : ""
	, kyodaku_nm : ""
	, kyodaku_status : ""
	, kyodaku_shohin_nm : ""
	, kyodaku_id : ""
	, not_finish : true
	, shinsei_bi_from : ""
	, shinsei_bi_to : ""
	, tantou_sha : ""
	, kaisha_nm : ""
	, keiyaku_cls : ""
	, kyodaku_cls : ""
	, kyodaku_status_list : [{label:"", value: ""}]
	, keiyaku_cls_list : []
	, kyodaku_cls_list : []
};

var $banadiumFormatVersion = '1';

var $showColumnDef = '';

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ユーザ情報取得
	loadUserInfo();	
	
	getSelectableValue(request);
	parseInitialParameter(request);
	
	$showColumnDef = Constant.LO_CDCLS_KYODAKU_LIST_SHOW_COLUMN;
	
	$form.show_column_map = Content.executeFunction("lo/common_libs/lo_common_fnction", "getListShowColumnDefs", $showColumnDef);	
	
	Logger.getLogger().info(' [init]許諾一覧　 $form.show_column_map ' + ImJson.toJSONString($form.show_column_map, true));
	
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "getUserInfo"); 
	
}

function getSelectableValue(request) {

    var statusList = [];
    statusList.push({label:"",value:"",selected:true});
    if ($userInfo.licenseeFlg == "0"){
    	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_KYODAKU_STATUS_PR);
    }else{
    	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_KYODAKU_STATUS_LI);
    }
	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "mergeLabelList", statusList, ",");
	$form.kyodaku_status_list = statusList;

	var keiyakuClsList = [];
	keiyakuClsList.push({label:"",value:"",selected:true});
	keiyakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyakuClsList, Constant.LO_CDCLS_KEIYAKU_CLS);
	$form.keiyaku_cls_list = keiyakuClsList;

	var kyodakuClsList = [];
	kyodakuClsList.push({label:"",value:"",selected:true});
	kyodakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kyodakuClsList, Constant.LO_CDCLS_KYODAKU_CLS);
	$form.kyodaku_cls_list = kyodakuClsList;
}

/**
 * リクエストパラメータから、画面の初期入力情報を設定します。
 * 
 * @param {Object} request リクエスト
 */
function parseInitialParameter(request) {

	$initialSearching = false;

	if ('ip_nm' in request) {
		$initialSearching = true;
		$form.ip_nm = request.ip_nm;
	}

	if ('title_nm' in request) {
		$initialSearching = true;
		$form.title_nm = request.title_nm;
	}

	if ('kyodaku_nm' in request) {
		$initialSearching = true;
		$form.kyodaku_nm = request.kyodaku_nm;
	}

	var kyodakuStatusDefaultSelected = false;
	if ('kyodaku_status' in request) {

		$initialSearching = true;
		$form.kyodaku_status = request.kyodaku_status;
		kyodakuStatusDefaultSelected = setSelectedProperty($form.kyodaku_status_list, $form.kyodaku_status);
		if (kyodakuStatusDefaultSelected == false) {
			var selectValues = $form.kyodaku_status.split(",");
			for (var key in selectValues) {
				var selectValue = selectValues[key];
				kyodakuStatusDefaultSelected = setSelectedProperty($form.kyodaku_status_list, selectValue, ",");
				if (kyodakuStatusDefaultSelected) {
					break;
				}
			}
		}
	}

	if ('kyodaku_shohin_nm' in request) {
		$initialSearching = true;
		$form.kyodaku_shohin_nm = request.kyodaku_shohin_nm;
	}

	if ('kyodaku_id' in request) {
		$initialSearching = true;
		$form.kyodaku_id = request.kyodaku_id;
	}

	if ('shinsei_bi_from' in request) {
		$initialSearching = true;
		if (request.shinsei_bi_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.shinsei_bi_from = request.shinsei_bi_from;
		} else {
			$form.shinsei_bi_from = "";
		}
	}

	if ('shinsei_bi_to' in request) {
		$initialSearching = true;
		if (request.shinsei_bi_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.shinsei_bi_to = request.shinsei_bi_to;
		} else {
			$form.shinsei_bi_to = "";
		}
	}

	if ('tantou_sha' in request) {
		$initialSearching = true;
		$form.tantou_sha = request.tantou_sha;
	}
	
	if ('kaisha_nm' in request) {
		$initialSearching = true;
		$form.kaisha_nm = request.kaisha_nm;
	}

	if (kyodakuStatusDefaultSelected) {
		$form.not_finish = false;
	} else {
		if ('not_finish' in request) {
			$initialSearching = true;
			$form.not_finish = request.not_finish=="on" ? true : false;
		} else if($initialSearching) {
			$form.not_finish = false;
		}
	}

	if ('keiyaku_cls' in request) {
		$initialSearching = true;
		$form.keiyaku_cls = request.keiyaku_cls;
		setSelectedProperty($form.keiyaku_cls_list, $form.keiyaku_cls);
	}

	if ('kyodaku_cls' in request) {
		$initialSearching = true;
		$form.kyodaku_cls = request.kyodaku_cls;
		setSelectedProperty($form.kyodaku_cls_list, $form.kyodaku_cls);
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
 * 許諾一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKyodakuList(param) {
	
	Logger.getLogger().info(' [searchKyodakuList]　許諾一覧検索');
	
	// ユーザ情報取得
	loadUserInfo();

    var accountContext = Contexts.getAccountContext();
    var usercd = accountContext.userCd;
    var locale = accountContext.locale;

	var sql = "" ;
	
	sql += "SELECT DISTINCT ";
//	sql += "  ki.kikaku_id ";
	sql += "  ki.ip_nm ";
	sql += " ,ki.title_nm ";
	sql += " ,ky.kaisha_nm " ; 
	sql += " ,ky.tantou_sha_nm " ; 
	sql += " ,ky.kyodaku_id ";
	sql += " ,ky.kyodaku_nm ";
	sql += " ,ky.kyodaku_cls ";
	sql += " ,ko01.cd_naiyo AS kyodaku_cls_nm ";
	sql += " ,ky.keiyaku_cls";
	sql += " ,ko02.cd_naiyo AS keiyaku_cls_nm ";
	sql += " ,ky.kyodaku_status ";
	sql += " ,ko03.sort_no AS kyodaku_status_order ";
	sql += " ,ky.shinsei_bi ";
//	sql += " ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";
	sql += " ,ky.bne_tantou_sha ";
	sql += " ,ky.koushin_bi ";
	sql += " ,imw.auth_user_name ";
	sql += "FROM ";
	sql += "  lo_t_kyodaku AS ky ";
	sql += "  LEFT JOIN lo_t_kyodaku_kikaku_himozuke AS hi ";
	sql += "    ON (hi.kyodaku_id = ky.kyodaku_id ";
	sql += "    AND hi.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_t_kikaku AS ki ";
	sql += "    ON (ki.kikaku_id = hi.kikaku_id ";
	sql += "    AND ki.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko01.cd_id = ky.kyodaku_cls ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = ky.keiyaku_cls ";
	sql += "    AND ko02.sakujo_flg ='0') ";
    if ($userInfo.bneFlg == "1") {
		sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
		sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_LIST_STATUS_ORDER_PR + "' ";
		sql += "    AND ko03.cd_id = ky.kyodaku_status ";
		sql += "    AND ko03.sakujo_flg ='0') ";
    } else {
    	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
    	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_STATUS_LI + "' ";
    	sql += "    AND ko03.cd_id = ky.kyodaku_status ";
    	sql += "    AND ko03.sakujo_flg ='0') ";
    }
	sql += " LEFT JOIN lo_t_kyodaku_shohin AS kds ";
	sql += "   ON (ky.kyodaku_id = kds.kyodaku_id ";
	sql += "   AND kds.sakujo_flg ='0') ";

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
	sql += " ) imw " ;
	sql += " on ky.kyodaku_id  = imw.matter_name " ;
	// ----------------------------------------
	

	sql += "WHERE " ; 
	sql += "  ky.sakujo_flg ='0' ";

	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング　todo 画面入力項目に合わせて追加
    var columnNameMap = {};
    // 部分一致(like)
    // 完全一致(eq)
    // より大きい(gt)
    // より小さい(lt)
    // 以上(ge)
    // 以下(le)
    // 以外(ne)
    // いずれか(in)
    columnNameMap["ip_nm"] = {col:"ki.ip_nm",comp:"like"};
    columnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
    columnNameMap["kaisha_nm"] = {col:"ky.kaisha_nm",comp:"eq"};
    columnNameMap["kyodaku_nm"] = {col:"ky.kyodaku_nm",comp:"like"};
    columnNameMap["kyodaku_id"] = {col:"ky.kyodaku_id",comp:"like"};
    columnNameMap["kyodaku_status"] = {col:"ky.kyodaku_status",comp:"in"};
    columnNameMap["kyodaku_shohin_nm"] = {col:"kds.shohin_mei",comp:"like"};
    columnNameMap["shinsei_bi_from"] = {col:"ky.shinsei_bi",comp:"ge"};
    columnNameMap["shinsei_bi_to"] = {col:"ky.shinsei_bi",comp:"le"};
    columnNameMap["not_finish"] = {col:"ky.kyodaku_status",comp:"ni"};
    if(param.not_finish == "on") {
    	param.not_finish = [Constant.LO_STATUS_KANRYO, Constant.LO_STATUS_IKO];
    } else {
    	param.not_finish = [];
    }
    
    if ($userInfo.licenseeFlg == "1") {
	    columnNameMap["tantou_sha"] = {col:"ky.tantou_sha_nm",comp:"like"};
	    // ライセンシーの場合会社は固定
	    param.kaisha_id = $userInfo.userCompanyDepartment.companyCd;
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
	    columnNameMap["kaisha_id"] = {col:"ky.kaisha_id",comp:"eq"};
	}else{
		columnNameMap["bne_tantou_sha"] = {col:"ky.bne_tantou_sha",comp:"like"};
		
    	if (!(param.kyodaku_status) ||
    			(Array.isArray(param.kyodaku_status) && param.kyodaku_status.length == 0)) {
    	    columnNameMap["not_ichiji_hozon"] = {col:"ky.kyodaku_status",comp:"ne"};
        	param.not_ichiji_hozon = Constant.LO_STATUS_ICHIJI_HOZON;
    	}
	}
    columnNameMap["keiyaku_cls"] = {col:"ky.keiyaku_cls",comp:"eq"};
    columnNameMap["kyodaku_cls"] = {col:"ky.kyodaku_cls",comp:"eq"};

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);
    
    sql += " ORDER BY kyodaku_status_order, shinsei_bi desc, ky.kyodaku_id ";
    // todo 表示件数制限（ダミー） 実際は画面の表示件数とページングで色々変える
    // 削除（THATS_RIGHTS-1367 B92 各一覧画面の検索結果について確認です）
    //sql += " LIMIT 100 ";

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKyodakuList]　許諾一覧検索 SQL ' + sql + " Param " + ImJson.toJSONString(param, true));
    var result = db.select(sql,strParam, 0);
    
    // ステータス設定
    var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KYODAKU);
	result.data = obj;
    
    // セッション登録
    Client.set('searchCondKyodaku', {where: condition.sql, param: strParam});
    
    return result;

}

/**
 * CSVファイル情報取得
 * @returns {object} 検索結果
 */
function getKyodakuCsvData() {
	// ライセンスプロダクションか判断
	var proFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
	
	// 検索条件
	var searchCond = Client.get('searchCondKyodaku');
	
	var sql = "" ;
	sql += " SELECT\n";
	sql += "   ki.kikaku_id AS \"企画番号\"\n";
	sql += "   , ki.kikaku_nm AS \"企画名\"\n";
	sql += "   , ki.ip_nm AS \"IP\"\n";
	sql += "   , ki.title_nm AS \"タイトル名\"\n";
	sql += "   , ki.kaisha_nm AS \"会社\"\n";
	sql += "   , ki.tantou_sha AS \"ライセンシー担当者（企画）\"\n";
	sql += "   , ki.bne_tantou_sha AS \"BNE担当者（企画）\"\n";
	sql += "   , ky.kyodaku_id AS \"許諾番号\"\n";
	sql += "   , ky.kyodaku_nm AS \"許諾申請名\"\n";
	sql += "   , status.cd_naiyo AS \"許諾ステータス\"\n";
	sql += "   , ky.shinsei_bi AS \"許諾申請日\"\n";
	sql += "   , ky.kakunin_bi AS \"許諾確認日\"\n";
	sql += "   , ky.tantou_sha_nm AS \"ライセンシー担当者（許諾）\"\n";
	sql += "   , ky.bne_tantou_sha AS \"BNE担当者（許諾）\"\n";
	sql += "   , k0027.cd_naiyo AS \"許諾種別\"\n";
	sql += "   , k0028.cd_naiyo AS \"契約種別\"\n";
	sql += "   , SUM(kds.saiteihosho_su_shinseisu) OVER (PARTITION BY kkh.kikaku_id, kkh.kyodaku_id) AS \"合計最低保証数（申請数）\"\n";
	sql += "   , SUM(kds.saiteihosho_su_kyodakuryo) OVER (PARTITION BY kkh.kikaku_id, kkh.kyodaku_id) AS \"合計最低保証料（許諾料）\"\n";
	sql += "   , ky.kyodaku_kikan_from AS \"許諾開始日\"\n";
	sql += "   , ky.kyodaku_kikan_to AS \"許諾終了日\"\n";
	sql += "   , ky.saiteihosho_kigen AS \"最低保証料支払い期限\"\n";
	sql += "   , k0040.cd_naiyo AS \"商品/販促物\"\n";
	sql += "   , kds.shohin_mei AS \"商品名\"\n";
	sql += "   , TO_CHAR(kds.hatsubai_bi,'YYYY/MM/DD') AS \"発売日\"\n";
	sql += "   , kds.zeinuki_jodai AS \"税抜上代\"\n";
	sql += "   , kds.ryoritsu AS \"料率\"\n";
	sql += "   , kds.siyoryo AS \"使用料（単価）\"\n";
	sql += "   , kds.saiteihosho_su_shinseisu AS \"最低保証数（申請数）\"\n";
	sql += "   , kds.saiteihosho_su_kyodakuryo AS \"最低保証料（許諾料）\"\n";
	sql += "   , k0008.cd_naiyo AS \"証紙\"\n";
	sql += "   , kds.mihon_suryo AS \"見本数量\"\n";
	sql += "   , k0029.cd_naiyo AS \"地域\"\n";
	if(proFlg) {
		sql += "   , gs.ringi_no AS \"稟議番号\"\n";
		sql += "   , gs.ringi_status AS \"稟議ステータス\"\n";
		sql += "   , gs.keiyaku_hokan_no AS \"契約保管番号\"\n";
		sql += "   , gs.keijo_status AS \"計上ステータス\" \n";
	}
	sql += " FROM\n";
	sql += "   lo_t_kyodaku ky \n";
	sql += "   LEFT JOIN lo_t_kyodaku_kikaku_himozuke kkh \n";
	sql += "     ON ky.kyodaku_id = kkh.kyodaku_id \n";
	sql += "     AND kkh.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_t_kikaku ki \n";
	sql += "     ON kkh.kikaku_id = ki.kikaku_id \n";
	sql += "     AND ki.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_t_kyodaku_shohin kds \n";
	sql += "     ON ky.kyodaku_id = kds.kyodaku_id \n";
	sql += "     AND kds.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_m_koteichi status    /* 許諾ステータス */\n";
	if(proFlg) {
		sql += "     ON status.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_STATUS_PR + "'\n";
	} else {
		sql += "     ON status.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_STATUS_LI + "'\n";
	}
	sql += "     AND ky.kyodaku_status = status.cd_id\n";
	sql += "     AND status.sakujo_flg = '0'\n";
	sql += "   LEFT JOIN lo_m_koteichi k0027 /* 許諾種別 */\n";
	sql += "     ON k0027.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' \n";
	sql += "     AND ky.kyodaku_cls = k0027.cd_id \n";
	sql += "     AND k0027.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_m_koteichi k0028 /* 契約種別 */\n";
	sql += "     ON k0028.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' \n";
	sql += "     AND ky.keiyaku_cls = k0028.cd_id \n";
	sql += "     AND k0028.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_m_koteichi k0040 /* 商品販促物 */\n";
	sql += "     ON k0040.cd_cls_id = '" + Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU + "' \n";
	sql += "     AND kds.shohin_hansokubutsu_hanbetsu = k0040.cd_id \n";
	sql += "     AND k0040.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_m_koteichi k0008 /* 証紙 */\n";
	sql += "     ON k0008.cd_cls_id = '" + Constant.LO_CDCLS_SHOSHI + "' \n";
	sql += "     AND kds.shoshi = k0008.cd_id \n";
	sql += "     AND k0008.sakujo_flg = '0' \n";
	sql += "   LEFT JOIN lo_m_koteichi k0029 /* 販売地域 */\n";
	sql += "     ON k0029.cd_cls_id = '" + Constant.LO_CDCLS_HANBAI_CHIIKI + "' \n";
	sql += "     AND kds.hanbai_chiiki = k0029.cd_id \n";
	sql += "     AND k0029.sakujo_flg = '0' \n";
	if(proFlg) {
		sql += "   LEFT JOIN lo_t_gaibu_status gs /* 外部ステータス */\n";
		sql += "     ON ky.kyodaku_id = gs.bunsho_no \n";
		sql += "     AND gs.sakujo_flg = '0' \n";
	}
	sql += " WHERE\n";
	sql += "   ky.sakujo_flg = '0'\n";
	sql += searchCond.where;
	sql += " ORDER BY ky.kyodaku_id, ki.kikaku_id, kds.kyodaku_edaban \n";
	
	// sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,searchCond.param);
//    Logger.getLogger().info(' [getKyodakuCsvData]　許諾一覧CSV SQL ' + sql);

    return result;
}