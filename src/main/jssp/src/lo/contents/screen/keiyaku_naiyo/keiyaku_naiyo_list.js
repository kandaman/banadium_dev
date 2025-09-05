Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
    , contractFlg : "0" // 契約担当フラグ
    , accountFlg : "0" // 計上担当フラグ
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
	, keiyakusho_hyodai : ""
	, keiyaku_cls : ""
	, keiyaku_cls_list : []
	, kyodaku_cls : ""
	, kyodaku_status_list : []
	, keiyaku_naiyo_id : ""
	, keiyaku_naiyo_nm : ""
	, keiyaku_status : ""
	, keiyaku_status_list : []
	, not_finish : true
	, ringi_sinsei_nm : ""
	, ringi_sinsei_no : ""
	, kaisha_nm : ""
	, shinsei_bi_from : ""
	, shinsei_bi_to : ""
	, select_show_column_def : ""
	, show_column_defs : []
	, show_column_map : ""
	, kyodaku_number : ""
};

var $keiyakuEnchoClsUnanswered = '';
var $banadiumFormatVersion = '1';

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	Logger.getLogger().info('[init] request　' + ImJson.toJSONString(request, true));
	// ユーザ情報取得
	loadUserInfo();
	
	Logger.getLogger().info('[init] $userInfo　' + ImJson.toJSONString($userInfo, true));
	getSelectableValue(request);
	parseInitialParameter(request);

	$keiyakuEnchoClsUnanswered = Constant.LO_KEIYAKU_ENCHO_CLS_UNANSWERED;

	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_BANADIUM_FORMAT_VERSION);
	$banadiumFormatVersion = $tmpList[0];
	
	Logger.getLogger().info('[init] $form　' + ImJson.toJSONString($form, true));
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo"); 
	
}

function getSelectableValue(request) {

    var keiyakuClsList = [];
    keiyakuClsList.push({label:"",value:"",selected:true});
    keiyakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyakuClsList, Constant.LO_CDCLS_KEIYAKU_CLS);
	$form.keiyaku_cls_list = keiyakuClsList;

    var kyodakuClsList = [];
    kyodakuClsList.push({label:"",value:"",selected:true});
    kyodakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kyodakuClsList, Constant.LO_CDCLS_KYODAKU_CLS);
	$form.kyodaku_cls_list = kyodakuClsList;

    var statusList = [];
	statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, ($userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_STATUS_PR : Constant.LO_CDCLS_KEIYAKU_STATUS_LI));
	$form.keiyaku_status_list = statusList;

	getKeiyakuListShowColumnDefs();
}

function getKeiyakuListShowColumnDefs() {

	var showColumnDefs = [];
	var showColumnDefMap = {};

	var sql = "";

	sql += "SELECT * FROM lo_m_koteichi WHERE cd_cls_id = ? AND sakujo_flg = '0' ORDER BY sort_no";

    // sql実行
    var db = new TenantDatabase();
    var defsResult = db.select(sql, [DbParameter.string(Constant.LO_CDCLS_KEIYAKU_LIST_SHOW_COLUMN)], 0);

    var defaultSelectedValue = null;
    for (var defKey in defsResult.data) {
    	var def = defsResult.data[defKey];
    	var defCd = def.cd_id;
    	var defConfig = ImJson.parseJSON(def.cd_naiyo);
    	var defName = defConfig.name;
    	var authorizations = defConfig.authorizations;
    	var isApproved = false;
    	for (var authKey in authorizations) {
    		isApproved = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", authorizations[authKey]);
    		if (isApproved) {
    			break;
    		}
    	}
    	if (!isApproved) {
    		continue;
    	}
    	if (!defaultSelectedValue) {
        	var defaultPublicGroups = defConfig.default_public_groups;
        	for (var defaultKey in defaultPublicGroups) {
        		var isDefaultSelected = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", defaultPublicGroups[defaultKey]);
        		if (isDefaultSelected) {
        			defaultSelectedValue = defCd;
        		}
        	}
    	}
    	var showColumnList = [];
    	var columnsResult = db.select(sql, [DbParameter.string(defCd)], 0);
    	for (var columnKey in columnsResult.data) {
        	var column = columnsResult.data[columnKey];
        	var columnName = column.cd_naiyo;
        	showColumnList.push(columnName);
    	}

    	showColumnDefs.push({
    		value : defCd
    		, label : defName
    	})
    	showColumnDefMap[defCd] = showColumnList;
    }
    
    if (!defaultSelectedValue) {
    	defaultSelectedValue = showColumnDefs[0].value;
    }

	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", showColumnDefs, defaultSelectedValue);
	$form.select_show_column_def = defaultSelectedValue;

	$form.show_column_defs = showColumnDefs;
	
	$form.show_column_map =  ImJson.toJSONString(showColumnDefMap, false);

}

/**
 * リクエストパラメータから、画面の初期入力情報を設定します。
 * 
 * @param {Object} request リクエスト
 */
function parseInitialParameter(request) {

	$initialSearching = false;

	if ('keiyaku_naiyo_id' in request) {
		$initialSearching = true;
		$form.keiyaku_naiyo_id = request.keiyaku_naiyo_id;
	}

	if ('keiyaku_naiyo_nm' in request) {
		$initialSearching = true;
		$form.keiyaku_naiyo_nm = request.keiyaku_naiyo_nm;
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

	if ('ringi_sinsei_nm' in request) {
		$initialSearching = true;
		$form.ringi_sinsei_nm = request.ringi_sinsei_nm;
	}

	var keiyakuStatusDefaultSelected = false;
	if ('keiyaku_status' in request) {

		$initialSearching = true;
		$form.keiyaku_status = request.keiyaku_status;
		keiyakuStatusDefaultSelected = setSelectedProperty($form.keiyaku_status_list, $form.keiyaku_status);
		if (keiyakuStatusDefaultSelected == false) {
			var selectValues = $form.keiyaku_status.split(",");
			for (var key in selectValues) {
				var selectValue = selectValues[key];
				keiyakuStatusDefaultSelected = setSelectedProperty($form.keiyaku_status_list, selectValue, ",");
				if (keiyakuStatusDefaultSelected) {
					break;
				}
			}
		}
	}

	if ('keiyaku_kaishi_bi_from' in request) {
		$initialSearching = true;
		if (request.keiyaku_kaishi_bi_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.keiyaku_kaishi_bi_from = request.keiyaku_kaishi_bi_from;
		} else {
			$form.keiyaku_kaishi_bi_from = "";
		}
	}

	if ('keiyaku_kaishi_bi_to' in request) {
		$initialSearching = true;
		if (request.keiyaku_kaishi_bi_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.keiyaku_kaishi_bi_to = request.keiyaku_kaishi_bi_to;
		} else {
			$form.keiyaku_kaishi_bi_to = "";
		}
	}

	if ('keiyaku_teiketu_bi_from' in request) {
		$initialSearching = true;
		if (request.keiyaku_teiketu_bi_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.keiyaku_teiketu_bi_from = request.keiyaku_teiketu_bi_from;
		} else {
			$form.keiyaku_teiketu_bi_from = "";
		}
	}

	if ('keiyaku_teiketu_bi_to' in request) {
		$initialSearching = true;
		if (request.keiyaku_teiketu_bi_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.keiyaku_teiketu_bi_to = request.keiyaku_teiketu_bi_to;
		} else {
			$form.keiyaku_teiketu_bi_to = "";
		}
	}

	if ('saisyu_kakunin_bi_from' in request) {
		$initialSearching = true;
		if (request.saisyu_kakunin_bi_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.saisyu_kakunin_bi_from = request.saisyu_kakunin_bi_from;
		} else {
			$form.saisyu_kakunin_bi_from = "";
		}
	}

	if ('saisyu_kakunin_bi_to' in request) {
		$initialSearching = true;
		if (request.saisyu_kakunin_bi_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			$form.saisyu_kakunin_bi_to = request.saisyu_kakunin_bi_to;
		} else {
			$form.saisyu_kakunin_bi_to = "";
		}
	}

	if ('ringi_sinsei_no' in request) {
		$initialSearching = true;
		$form.ringi_sinsei_no = request.ringi_sinsei_no;
	}

	if ('title_nm' in request) {
		$initialSearching = true;
		$form.title_nm = request.title_nm;
	}
	
	if ('kaisha_nm' in request) {
		$initialSearching = true;
		$form.kaisha_nm = request.kaisha_nm;
	}
	
	if ('ip_nm' in request) {
		$initialSearching = true;
		$form.ip_nm = request.ip_nm;
	}
	
	if ('keiyakusho_hyodai' in request) {
		$initialSearching = true;
		$form.keiyakusho_hyodai = request.keiyakusho_hyodai;
	}
	
	if ('tantou_sha' in request) {
		$initialSearching = true;
		$form.tantou_sha = request.tantou_sha;
	}
	
	if (keiyakuStatusDefaultSelected) {
		$form.not_finish = false;
	} else {
		if ('not_finish' in request) {
			$initialSearching = true;
			$form.not_finish = request.not_finish=="on" ? true : false;
		} else if($initialSearching) {
			$form.not_finish = false;
		}
	}
	
	if ('show_column_def' in request) {
		$initialSearching = true;
		$form.select_show_column_def = request.show_column_def;
	}

	if('kyodaku_number' in request) {
		$initialSearching = true;
		$form.kyodaku_number = request.kyodaku_number;
	}
	
	
	Logger.getLogger().info('[init] $form　' + ImJson.toJSONString($form, true));

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
 * 契約一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKeiyakuNaiyoList(param) {
	
	Logger.getLogger().info(' [searchKeiyakuNaiyoList]　許諾一覧検索');
	
	// ユーザ情報取得
	loadUserInfo();

    var accountContext = Contexts.getAccountContext();
    var usercd = accountContext.userCd;
    var locale = accountContext.locale;

    var baseColumnNames = ["keiyaku_naiyo_id", " keiyakusho_hyodai", " keiyakusho_hyodai_nm", " keiyaku_cls", " keiyaku_cls_nm"
                           , " keiyaku_naiyo_nm", " ringi_sinsei_no", " ringi_sinsei_nm", " homu_soudan_no", " keiyaku_hokan_no"
                           , " saiteihosho_ryo", " sozai_seisaku_hi", " keiyaku_status", " keiyaku_status_nm", " kaisha_id", " kaisha_nm"
                           , " busyo_id", " busyo_nm", " licensee_keiyaku_tanto_id", " licensee_keiyaku_tanto_nm", "licensee_keiyaku_tanto_email_address"
                           , " saisyu_kakunin_bi", " keiyaku_teiketu_bi", " keiyaku_kaishi_bi", " keiyaku_manryo_bi"
                           , " keiyaku_encho_cls", " keiyaku_encho_cls_nm", " tsuika_seisan_cls", " tsuika_seisan_cls_nm"
                           , " kyodaku_chiiki", " keiyaku_biko", " biko", " koushin_bi", "koushin_sha_nm", "ryoritsu", "max_comment_koshin_bi"];

    var joinColumnNames = function(columnNames, prefix) {
    	var hasPrefix = prefix !== undefined;
    	return columnNames.reduce(function(accumulator, currentValue, index, array) {
    		var result = accumulator;
    		if (result.length > 0) {
    			result += ", ";
    		}
    		if (hasPrefix && prefix.length > 0) {
    			result += prefix;
    			result += ".";
    		}
			result += currentValue;
    		return result;
    	}, "");
    };

    var baseColumnNameSql = joinColumnNames(baseColumnNames, "");
	// 入力パラメータ
    var strParam=[];

	var sql = "" ;

	/* =========================================================== 
	 * 0) 契約基本 
	 * =========================================================== */
	sql += "WITH base_keiyaku (" + baseColumnNameSql + ") AS ( ";
	sql += "  SELECT ";
	sql += "    kn.keiyaku_naiyo_id AS keiyaku_naiyo_id ";
	sql += "    , kn.keiyakusho_hyodai AS keiyakusho_hyodai ";
	sql += "    , ko03.cd_naiyo AS keiyakusho_hyodai_nm ";
	sql += "    , kn.keiyaku_cls AS keiyaku_cls ";
	sql += "    , ko01.cd_naiyo AS keiyaku_cls_nm ";
	sql += "    , kn.keiyaku_naiyo_nm AS keiyaku_naiyo_nm ";
	sql += "    , kn.ringi_sinsei_no AS ringi_sinsei_no ";
	sql += "    , kn.ringi_sinsei_nm AS ringi_sinsei_nm ";
	sql += "    , kn.homu_soudan_no AS homu_soudan_no ";
	sql += "    , kn.keiyaku_hokan_no AS keiyaku_hokan_no ";
	sql += "    , kn.saiteihosho_ryo AS saiteihosho_ryo ";
	sql += "    , kn.sozai_seisaku_hi AS sozai_seisaku_hi ";
	sql += "    , kn.keiyaku_status AS keiyaku_status ";
	sql += "    , ko02.cd_naiyo AS keiyaku_status_nm ";
	sql += "    , kn.kaisha_id AS kaisha_id ";
	sql += "    , kn.kaisha_nm AS kaisha_nm ";
	sql += "    , kn.busyo_id AS busyo_id ";
	sql += "    , kn.busyo_nm AS busyo_nm ";
	sql += "    , kn.licensee_keiyaku_tanto_id AS licensee_keiyaku_tanto_id ";
	sql += "    , kn.licensee_keiyaku_tanto_nm AS licensee_keiyaku_tanto_nm ";
	sql += "    , user_licensee.email_address1 AS licensee_keiyaku_tanto_email_address ";
	sql += "    , TO_CHAR(kn.saisyu_kakunin_bi, 'YYYY/MM/DD') AS saisyu_kakunin_bi ";
	sql += "    , TO_CHAR(kn.keiyaku_teiketu_bi, 'YYYY/MM/DD') AS keiyaku_teiketu_bi ";
	sql += "    , TO_CHAR(kn.keiyaku_kaishi_bi, 'YYYY/MM/DD') AS keiyaku_kaishi_bi ";
	sql += "    , kn.keiyaku_manryo_bi AS keiyaku_manryo_bi ";
	sql += "    , kn.keiyaku_encho_cls AS keiyaku_encho_cls ";
	sql += "    , ko04.cd_naiyo AS keiyaku_encho_cls_nm ";
	sql += "    , kn.tsuika_seisan_cls AS tsuika_seisan_cls ";
	sql += "    , ko05.cd_naiyo AS tsuika_seisan_cls_nm ";
	sql += "    , kn.kyodaku_chiiki AS kyodaku_chiiki ";
	sql += "    , kn.keiyaku_biko AS keiyaku_biko ";
	sql += "    , kn.biko AS biko ";
	sql += "    , TO_CHAR(kn.koushin_bi, 'YYYY/MM/DD') AS koushin_bi ";
	sql += "    , user_koushin.user_name AS koushin_sha_nm ";
	sql += "    , kn.ryoritsu AS ryoritsu ";
	sql += "    ,(SELECT TO_CHAR(MAX(knc.koushin_bi), 'YYYY/MM/DD HH24:MI:SS') ";
	sql += "      FROM lo_t_keiyaku_naiyo_comment knc ";
	sql += "      WHERE knc.keiyaku_naiyo_id = kn.keiyaku_naiyo_id ";
	sql += "        AND knc.sakujo_flg = '0')  AS max_comment_koshin_bi ";
	sql += "  FROM ";
	sql += "    lo_t_keiyaku_naiyo AS kn ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "      ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "      AND ko01.cd_id = kn.keiyaku_cls ";
	sql += "      AND ko01.sakujo_flg ='0') ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "      ON (ko02.cd_cls_id = '" + ($userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_STATUS_PR : Constant.LO_CDCLS_KEIYAKU_STATUS_LI) + "' ";
	sql += "      AND ko02.cd_id = kn.keiyaku_status ";
	sql += "      AND ko02.sakujo_flg ='0') ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "      ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKUSHO_HYODAI + "' ";
	sql += "      AND ko03.cd_id = kn.keiyakusho_hyodai ";
	sql += "      AND ko03.sakujo_flg ='0') ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "      ON (ko04.cd_cls_id = '" + ($userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_PR : Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_LI) + "' "; 
	sql += "      AND ko04.cd_id = kn.keiyaku_encho_cls ";
	sql += "      AND ko04.sakujo_flg ='0') ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "      ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_TSUIKA_SEISAN_CLS + "' ";
	sql += "      AND ko05.cd_id = kn.tsuika_seisan_cls ";
	sql += "      AND ko05.sakujo_flg ='0') ";
	sql += "    LEFT JOIN  imm_user AS user_licensee ";
	sql += "      ON (user_licensee.user_cd = kn.licensee_keiyaku_tanto_id ";
	sql += "      AND user_licensee.locale_id = 'ja' ";
	sql += "      AND user_licensee.start_date <= CURRENT_DATE ";
	sql += "      AND user_licensee.end_date > CURRENT_DATE ";
	sql += "      AND user_licensee.delete_flag = '0') ";
	sql += "    LEFT JOIN imm_user AS user_koushin ";
	sql += "      ON (user_koushin.user_cd = kn.koushin_sha ";
	sql += "      AND user_koushin.locale_id = 'ja' ";
	sql += "      AND user_koushin.start_date <= CURRENT_DATE ";
	sql += "      AND user_koushin.end_date > CURRENT_DATE ";
	sql += "      AND user_koushin.delete_flag ='0') ";
	sql += "  WHERE ";
	sql += "    kn.sakujo_flg ='0' ";

	// 画面入力項目とDB項目のマッピング　todo 画面入力項目に合わせて追加
	var baseColumnNameMap = {};
	baseColumnNameMap["keiyaku_naiyo_id"] = {col:"kn.keiyaku_naiyo_id",comp:"like"};
	baseColumnNameMap["keiyaku_naiyo_nm"] = {col:"kn.keiyaku_naiyo_nm",comp:"like"};
	baseColumnNameMap["keiyaku_cls"] = {col:"kn.keiyaku_cls",comp:"eq"};
	baseColumnNameMap["ringi_sinsei_nm"] = {col:"kn.ringi_sinsei_nm",comp:"like"};
	baseColumnNameMap["keiyaku_kaishi_bi_from"] = {col:"TO_CHAR(kn.keiyaku_kaishi_bi, 'YYYY/MM/DD')",comp:"ge"};
	baseColumnNameMap["keiyaku_kaishi_bi_to"] = {col:"TO_CHAR(kn.keiyaku_kaishi_bi, 'YYYY/MM/DD')",comp:"le"};
	baseColumnNameMap["keiyaku_teiketu_bi_from"] = {col:"TO_CHAR(kn.keiyaku_teiketu_bi, 'YYYY/MM/DD')",comp:"ge"};
	baseColumnNameMap["keiyaku_teiketu_bi_to"] = {col:"TO_CHAR(kn.keiyaku_teiketu_bi, 'YYYY/MM/DD')",comp:"le"};
	baseColumnNameMap["saisyu_kakunin_bi_from"] = {col:"TO_CHAR(kn.saisyu_kakunin_bi, 'YYYY/MM/DD')",comp:"ge"};
	baseColumnNameMap["saisyu_kakunin_bi_to"] = {col:"TO_CHAR(kn.saisyu_kakunin_bi, 'YYYY/MM/DD')",comp:"le"};
	baseColumnNameMap["keiyaku_status"] = {col:"kn.keiyaku_status",comp:"in"};
	baseColumnNameMap["not_finish"] = {col:"kn.keiyaku_status",comp:"ni"};
	baseColumnNameMap["ringi_sinsei_no"] = {col:"kn.ringi_sinsei_no",comp:"like"};
	baseColumnNameMap["kaisha_nm"] = {col:"kn.kaisha_nm",comp:"eq"};

	if(param.not_finish == "on") {
		param.not_finish = [Constant.LO_KEIYAKU_STATUS_KANRYO];
	} else {
		param.not_finish = [];
	}
	if ($userInfo.licenseeFlg == "1") {
	    // ライセンシーの場合会社は固定
	    param.kaisha_id = $userInfo.userCompanyDepartment.companyCd;
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
	    baseColumnNameMap["kaisha_id"] = {col:"kn.kaisha_id",comp:"eq"};
	}

	var baseCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, baseColumnNameMap);
	sql += baseCondition.sql;
	strParam = strParam.concat(baseCondition.bindParams);

	sql += ") ";

	/* =========================================================== 
	 * 1) 契約 + 許諾 + 企画 
	 * =========================================================== */
	sql += ", keiyaku_kyodaku (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + joinColumnNames(baseColumnNames, "ke");
	sql += "    , ky.kyodaku_id ";
	sql += "    , ki.kikaku_id ";
	sql += "    , ki.ip_cd ";
	sql += "    , ki.ip_nm ";
	sql += "    , ki.title_cd ";
	sql += "    , ki.title_nm ";
	sql += "    , ky.bne_tantou_sha ";
	sql += "    , ky.kyodaku_cls ";
	sql += "    , ko01.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    base_keiyaku AS ke ";
	sql += "    INNER JOIN lo_t_keiyaku_naiyo_kyodaku_himozuke AS knkyh ";
	sql += "      ON (knkyh.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkyh.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kyodaku AS ky ";
	sql += "      ON (ky.kyodaku_id = knkyh.kyodaku_id ";
	sql += "      AND ky.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kyodaku_kikaku_himozuke AS kykh ";
	sql += "      ON (kykh.kyodaku_id = ky.kyodaku_id ";
	sql += "      AND kykh.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kikaku AS ki ";
	sql += "      ON (ki.kikaku_id = kykh.kikaku_id ";
	sql += "      AND ki.sakujo_flg = '0') ";
	sql += "    LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "      ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "      AND ko01.cd_id = ky.kyodaku_cls ";
	sql += "      AND ko01.sakujo_flg ='0') ";
	sql += "  WHERE ";
	sql += "    1 = 1 ";

	var kyodakuColumnNameMap = {};
	kyodakuColumnNameMap["kyodaku_cls"] = {col:"ky.kyodaku_cls",comp:"eq"};
	kyodakuColumnNameMap["ip_nm"] = {col:"ki.ip_nm",comp:"like"};
	kyodakuColumnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
	kyodakuColumnNameMap["tantou_sha"] = {col:"ky.bne_tantou_sha",comp:"like"};
	var kyodakuCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, kyodakuColumnNameMap);
	sql += kyodakuCondition.sql;
	strParam = strParam.concat(kyodakuCondition.bindParams);
	sql += ") ";

	/* =========================================================== 
	 * 2) 契約 + 企画 
	 * =========================================================== */
	sql += ", keiyaku_kikaku (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + joinColumnNames(baseColumnNames, "ke");
	sql += "    , CAST(NULL AS varchar) AS kyodaku_id ";
	sql += "    , ki.kikaku_id ";
	sql += "    , ki.ip_cd ";
	sql += "    , ki.ip_nm ";
	sql += "    , ki.title_cd ";
	sql += "    , ki.title_nm ";
	sql += "    , ki.bne_tantou_sha ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    base_keiyaku AS ke ";
	sql += "    INNER JOIN lo_t_keiyaku_naiyo_kikaku_himozuke AS knkih ";
	sql += "      ON (knkih.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkih.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kikaku AS ki ";
	sql += "      ON (ki.kikaku_id = knkih.kikaku_id ";
	sql += "      AND ki.sakujo_flg = '0') ";
	sql += "  WHERE ";
	sql += "    1 = 1 ";

	var kikakuColumnNameMap = {};
	kikakuColumnNameMap["kyodaku_cls"] = {col: "'" + Constant.LO_KYODAKU_SHUBETSU_NEW + "'", comp:"eq"};
	kikakuColumnNameMap["ip_nm"] = {col:"ki.ip_nm",comp:"like"};
	kikakuColumnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
	kikakuColumnNameMap["tantou_sha"] = {col:"ki.bne_tantou_sha",comp:"like"};

	var kikakuCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, kikakuColumnNameMap);
	sql += kikakuCondition.sql;
	strParam = strParam.concat(kikakuCondition.bindParams);
	sql += ") ";
	
	/* =========================================================== 
	 * 4) 契約 + 代わり企画
	 * =========================================================== */
	sql += ", keiyaku_kawari_kikaku (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + joinColumnNames(baseColumnNames, "ke");
	sql += "    , CAST(NULL AS varchar) AS kyodaku_id ";
	sql += "    , ki.bunsho_id AS kikaku_id ";
	sql += "    , ki.ip_cd ";
	sql += "    , ki.ip_nm ";
	sql += "    , ki.title_cd ";
	sql += "    , ki.title_nm ";
	sql += "    , ki.kian_sha_nm AS bne_tantou_sha ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    base_keiyaku AS ke ";
	sql += "    INNER JOIN lo_t_keiyaku_naiyo_kawari_himozuke AS knkih ";
	sql += "      ON (knkih.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkih.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kawari AS ki ";
	sql += "      ON (ki.bunsho_id = knkih.bunsho_id ";
	sql += "      AND ki.bunsho_cls = '"+ Constant.LO_DOC_CLS_KAWARI_KIKAKU +"' ";
	sql += "      AND ki.sakujo_flg = '0') ";
	sql += "  WHERE ";
	sql += "    1 = 1 ";

	var kawariColumnNameMap = {};
	kawariColumnNameMap["kyodaku_cls"] = {col: "'" + Constant.LO_KYODAKU_SHUBETSU_NEW + "'", comp:"eq"};
	kawariColumnNameMap["ip_nm"] = {col:"ki.ip_nm",comp:"like"};
	kawariColumnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
	kawariColumnNameMap["tantou_sha"] = {col:"ki.kian_sha_nm",comp:"like"};

	var kawariCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, kawariColumnNameMap);
	sql += kawariCondition.sql;
	strParam = strParam.concat(kawariCondition.bindParams);
	sql += ") ";
	
	/* =========================================================== 
	 * 5) 契約 + 代わり許諾
	 * =========================================================== */
	sql += ", keiyaku_kawari_kyodaku (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + joinColumnNames(baseColumnNames, "ke");
	sql += "    , ki.bunsho_id AS kyodaku_id ";
	sql += "    , CAST(NULL AS varchar) AS kikaku_id ";	
	sql += "    , ki.ip_cd ";
	sql += "    , ki.ip_nm ";
	sql += "    , ki.title_cd ";
	sql += "    , ki.title_nm ";
	sql += "    , ki.kian_sha_nm AS bne_tantou_sha ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    base_keiyaku AS ke ";
	sql += "    INNER JOIN lo_t_keiyaku_naiyo_kawari_himozuke AS knkih ";
	sql += "      ON (knkih.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkih.sakujo_flg = '0') ";
	sql += "    INNER JOIN lo_t_kawari AS ki ";
	sql += "      ON (ki.bunsho_id = knkih.bunsho_id ";
	sql += "      AND ki.bunsho_cls = '"+ Constant.LO_DOC_CLS_KAWARI_KYODAKU +"' ";
	sql += "      AND ki.sakujo_flg = '0') ";
	sql += "  WHERE ";
	sql += "    1 = 1 ";

	var kawariColumnNameMap = {};
	kawariColumnNameMap["kyodaku_cls"] = {col: "'" + Constant.LO_KYODAKU_SHUBETSU_NEW + "'", comp:"eq"};
	kawariColumnNameMap["ip_nm"] = {col:"ki.ip_nm",comp:"like"};
	kawariColumnNameMap["title_nm"] = {col:"ki.title_nm",comp:"like"};
	kawariColumnNameMap["tantou_sha"] = {col:"ki.kian_sha_nm",comp:"like"};

	var kawariCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, kawariColumnNameMap);
	sql += kawariCondition.sql;
	strParam = strParam.concat(kawariCondition.bindParams);
	sql += ") ";
	
	/* =========================================================== 
	 * 3) 契約のみ 
	 * =========================================================== */
	sql += ", keiyaku_only (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + joinColumnNames(baseColumnNames, "ke");
	sql += "    , CAST(NULL AS varchar) AS kyodaku_id ";
	sql += "    , CAST(NULL AS varchar) AS kikaku_id ";
	sql += "    , CAST(NULL AS varchar) AS ip_cd ";
	sql += "    , CAST(NULL AS varchar) AS ip_nm ";
	sql += "    , CAST(NULL AS varchar) AS title_cd ";
	sql += "    , CAST(NULL AS varchar) AS title_nm ";
	sql += "    , CAST(NULL AS varchar) AS bne_tantou_sha ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls ";
	sql += "    , CAST(NULL AS varchar) AS kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    base_keiyaku AS ke ";
	sql += "    LEFT JOIN lo_t_keiyaku_naiyo_kyodaku_himozuke AS knkyh ";
	sql += "      ON (knkyh.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkyh.sakujo_flg = '0' ";
	sql += "      AND knkyh.kyodaku_id IS NULL) ";
	sql += "    LEFT JOIN lo_t_keiyaku_naiyo_kikaku_himozuke AS knkih ";
	sql += "      ON (knkih.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkih.sakujo_flg = '0' ";
	sql += "      AND knkih.kikaku_id IS NULL) ";
	sql += "    LEFT JOIN lo_t_keiyaku_naiyo_kawari_himozuke AS knkah ";
	sql += "      ON (knkah.keiyaku_naiyo_id = ke.keiyaku_naiyo_id ";
	sql += "      AND knkah.sakujo_flg = '0' ";
	sql += "      AND knkah.bunsho_id IS NULL) ";
	sql += "  WHERE ";
	if(param.tantou_sha == ""){ // 検索条件にBNE担当者がある場合は、契約のみのデータは不要
		sql += "    1 = 1 ";
	}else{
		sql += "    1 = 0 ";
	}
	
	var keiyakuColumnNameMap = {};
	keiyakuColumnNameMap["kyodaku_cls"] = {col: "''", comp:"eq"};
	keiyakuColumnNameMap["ip_nm"] = {col: "''", comp:"eq"};
	keiyakuColumnNameMap["title_nm"] = {col: "''", comp:"eq"};
	var keiyakuCondition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, keiyakuColumnNameMap);
	sql += keiyakuCondition.sql;
	strParam = strParam.concat(keiyakuCondition.bindParams);
	sql += ") ";
	
	sql += ", keiyaku_all (" + baseColumnNameSql;
	sql += "  , kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "  SELECT " + baseColumnNameSql;
	sql += "    , kyodaku_id ";
	sql += "    , kikaku_id ";
	sql += "    , ip_cd ";
	sql += "    , ip_nm ";
	sql += "    , title_cd ";
	sql += "    , title_nm ";
	sql += "    , bne_tantou_sha ";
	sql += "    , kyodaku_cls ";
	sql += "    , kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    keiyaku_kyodaku ";
	sql += "  UNION ";
	sql += "  SELECT " + baseColumnNameSql;
	sql += "    , kyodaku_id ";
	sql += "    , kikaku_id ";
	sql += "    , ip_cd ";
	sql += "    , ip_nm ";
	sql += "    , title_cd ";
	sql += "    , title_nm ";
	sql += "    , bne_tantou_sha ";
	sql += "    , kyodaku_cls ";
	sql += "    , kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    keiyaku_kikaku ";
	sql += "  UNION ";
	sql += "  SELECT " + baseColumnNameSql;
	sql += "    , kyodaku_id ";
	sql += "    , kikaku_id ";
	sql += "    , ip_cd ";
	sql += "    , ip_nm ";
	sql += "    , title_cd ";
	sql += "    , title_nm ";
	sql += "    , bne_tantou_sha ";
	sql += "    , kyodaku_cls ";
	sql += "    , kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    keiyaku_kawari_kikaku ";
	sql += "  UNION ";
	sql += "  SELECT " + baseColumnNameSql;
	sql += "    , kyodaku_id ";
	sql += "    , kikaku_id ";
	sql += "    , ip_cd ";
	sql += "    , ip_nm ";
	sql += "    , title_cd ";
	sql += "    , title_nm ";
	sql += "    , bne_tantou_sha ";
	sql += "    , kyodaku_cls ";
	sql += "    , kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    keiyaku_kawari_kyodaku ";
	sql += "  UNION ";
	sql += "  SELECT " + baseColumnNameSql;
	sql += "    , kyodaku_id ";
	sql += "    , kikaku_id ";
	sql += "    , ip_cd ";
	sql += "    , ip_nm ";
	sql += "    , title_cd ";
	sql += "    , title_nm ";
	sql += "    , bne_tantou_sha ";
	sql += "    , kyodaku_cls ";
	sql += "    , kyodaku_cls_nm ";
	sql += "  FROM ";
	sql += "    keiyaku_only ";
	sql += ") ";
	sql += ", keiyaku_all_tbl (" + baseColumnNameSql;
	sql += "  , saiteihosho_ryo_sozai_seisaku_hi_gokei, kyodaku_id, kikaku_id, ip_cd, ip_nm, title_cd, title_nm, bne_tantou_sha, kyodaku_cls, kyodaku_cls_nm) AS ( ";
	sql += "SELECT " + baseColumnNameSql;
	sql += "  , CASE WHEN saiteihosho_ryo IS NULL AND sozai_seisaku_hi IS NULL ";
	sql += "    THEN NULL ";
	sql += "    ELSE COALESCE(saiteihosho_ryo, 0) + COALESCE(sozai_seisaku_hi, 0) ";
	sql += "  END AS saiteihosho_ryo_sozai_seisaku_hi_gokei ";
	sql += "  , STRING_AGG(DISTINCT kyodaku_id, CHR(10) ORDER BY kyodaku_id) AS kyodaku_id ";
	sql += "  , STRING_AGG(DISTINCT kikaku_id, CHR(10) ORDER BY kikaku_id) AS kikaku_id ";
	sql += "  , STRING_AGG(DISTINCT ip_cd, CHR(10) ORDER BY ip_cd) AS ip_cd ";
	sql += "  , STRING_AGG(DISTINCT ip_nm, CHR(10) ORDER BY ip_nm) AS ip_nm ";
	sql += "  , STRING_AGG(DISTINCT title_cd, CHR(10) ORDER BY title_cd) AS title_cd ";
	sql += "  , STRING_AGG(DISTINCT title_nm, CHR(10) ORDER BY title_nm) AS title_nm ";
	sql += "  , STRING_AGG(DISTINCT bne_tantou_sha, CHR(10) ORDER BY bne_tantou_sha) AS bne_tantou_sha ";
	sql += "  , STRING_AGG(DISTINCT kyodaku_cls, CHR(10) ORDER BY kyodaku_cls) AS kyodaku_cls ";
	sql += "  , STRING_AGG(DISTINCT kyodaku_cls_nm, CHR(10) ORDER BY kyodaku_cls_nm) AS kyodaku_cls_nm ";
	sql += "FROM ";
	sql += "  keiyaku_all ";
	sql += "GROUP BY " + baseColumnNameSql;
	sql += ") ";
	sql += "SELECT " + baseColumnNameSql;
	sql += "  , saiteihosho_ryo_sozai_seisaku_hi_gokei ";
	sql += "  , kyodaku_id ";
	sql += "  , kikaku_id ";
	sql += "  , ip_cd ";
	sql += "  , ip_nm ";
	sql += "  , title_cd ";
	sql += "  , title_nm ";
	sql += "  , bne_tantou_sha ";
	sql += "  , kyodaku_cls ";
	sql += "  , kyodaku_cls_nm ";
	sql += "FROM ";
	sql += "  keiyaku_all_tbl ";
	sql += "WHERE ";
	sql += "  1 = 1 ";

	// 画面入力項目とDB項目のマッピング(入力項目が一部のテーブルにのみ存在する場合はここで条件を付与する)
    var columnNameMap = {};
    columnNameMap["kyodaku_number"] = {col:"kyodaku_id",comp:"like"};
    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);
    
    sql += " ORDER BY keiyaku_naiyo_id ";

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKeiyakuNaiyoList]　契約内容一覧検索 SQL ' + sql + " Param " + ImJson.toJSONString(param, true));
    var result = db.select(sql,strParam, 0);
    
    // セッション登録
    // TODO これを調整する必要がある。
    /*
    Client.set('searchCondKeiyakuNaiyo', {where: condition.sql, param: strParam});
    */

    return result;

}
