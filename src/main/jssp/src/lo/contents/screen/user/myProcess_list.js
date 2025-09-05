Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , licenseeFlg : "0" //ライセンシーフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
	, shohyoGroupFlg : "0" // 商標フラグ
	, keiyakuGroupFlg : "0" // 契約フラグ
	, homuGroupFlg : "0" // 法務フラグ
	, kawariInputFlg : "0" // 代わり承認入力者フラグ
	, bneGroupFlg : "0" //BNEグループ（パブリックグループ）フラグ
	, bneFlg : "0" // BNEフラグ
	
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
var $charge_caption = "担当者"; // グループにより「担当者」キャプションを切り替える
var $form = {
	pl_ip : ""
	, pl_title_nm : ""
	, kaisha_nm : ""
	, doc_id : ""
	, shinsei_nm : ""
	, doc_type : ""
	, shinsei_bi_from : ""
	, shinsei_bi_to : ""
	, proc_type : ""
	, kikaku_status : ""
	, status_list : []
	, not_finish : true
	, gokuhi_flg :false
	};


var $doc_type_list = [{label:"", value: ""}];

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ユーザ情報取得
	loadUserInfo();
	// コンボボックス取得
	getSelectableValue();
	
	parseInitialParameter(request);
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	$userInfo.userCd = userContext.userProfile.userCd;
	$userInfo.userName = userContext.userProfile.userName;
	
	// ライセンシーか判断
	$userInfo.licenseeFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE) == true ? "1" : "0");
	// ライセンスプロダクションか判断
	$userInfo.licenseProductionFlg = (
			Content.executeFunction(
					"lo/common_libs/lo_common_fnction"
					, "chkUsergroup"
					, [Constant.LO_GROUP_CD_PRODUCTION, Constant.LO_GROUP_APPR_0, Constant.LO_GROUP_APPR_1, Constant.LO_GROUP_APPR_2, Constant.LO_GROUP_APPR_3, Constant.LO_GROUP_APPR_LAST]
			) == true ? "1" : "0"
	);
	// 商標か判断
	$userInfo.shohyoGroupFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_SHOHYO) == true ? "1" : "0");
	// 契約か判断
	$userInfo.keiyakuGroupFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_CONTRACT) == true ? "1" : "0");
	// 法務か判断
	$userInfo.homuGroupFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_HOMU) == true ? "1" : "0");
	// 法務か判断
	$userInfo.homuGroupFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_HOMU) == true ? "1" : "0");
	// 代わり承認入力者か判断
	$userInfo.kawariInputFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_KAWARI_INPUT) == true ? "1" : "0");
	// BNEグループか判断
	$userInfo.bneFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_BNE) == true ? "1" : "0");
	

	if($userInfo.licenseProductionFlg == "1"
			|| $userInfo.shohyoGroupFlg == "1"
			|| $userInfo.keiyakuGroupFlg == "1"
			|| $userInfo.homuGroupFlg == "1"
			|| $userInfo.kawariInputFlg == "1"
			|| $userInfo.bneGroupFlg == "1"
	){
		$userInfo.bneFlg = "1";
	}
	
	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	$userInfo.userCompanyDepartment = userCompanyDepartment;
	
}

function getSelectableValue() {
	// 文書リスト取得
	$doc_type_list = [];
	$doc_type_list.push({label:"",value:"",selected:true});
	
	var doc_type_key = Constant.LO_CDCLS_DOC_TYPE;
	
	if($userInfo.bneFlg =="1") {		
		doc_type_key = Constant.LO_CDCLS_DOC_TYPE_PR;
	}	
	//Logger.getLogger().info(' [searchMyList]　My文書一覧検索 $userInfo ' + ImJson.toJSONString($userInfo, true));
		
	$doc_type_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $doc_type_list, doc_type_key);

	// 企画ステータスリスト取得
    var statusList = [];
    statusList.push({label:"",value:"",selected:true});
	if($userInfo.licenseProductionFlg) {
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

	// THATS_RIGHTS-1529 MY文書画面遷移時検索結果を表示した状態にしたい要望のため最初からtrueにする
	$initialSearching = true;

	if ('pl_ip' in request) {
		$initialSearching = true;
		$form.pl_ip = request.pl_ip;
	}
	
	if ('pl_title_nm' in request) {
		$initialSearching = true;
		$form.pl_title_nm = request.pl_title_nm;
	}
	
	if ('kaisha_nm' in request) {
		$initialSearching = true;
		$form.kaisha_nm = request.kaisha_nm;
	}
	
	if ('doc_id' in request) {
		$initialSearching = true;
		$form.doc_id = request.doc_id;
	}
	
	if ('shinsei_nm' in request) {
		$initialSearching = true;
		$form.shinsei_nm = request.shinsei_nm;
	}
	
	if ('doc_type' in request) {
		$initialSearching = true;
		$form.doc_type = request.doc_type;
		delete $doc_type_list[0].selected;
		for (var i=0; i<$doc_type_list.length; i++) {
			if($doc_type_list[i].value == $form.doc_type){
				$doc_type_list[i].selected = true;
				break;
			}
		}
	}
	
	if ('shinsei_bi_from' in request) {
		$initialSearching = true;
		if (request.shinsei_bi_from.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			var y = request.shinsei_bi_from.slice(0, 4);
			var m = request.shinsei_bi_from.slice(5, 6);
			var d = request.shinsei_bi_from.slice(7, 8);
		
			var date = new Date(y,m-1,d);
			if(date.getFullYear() != y || date.getMonth() != m - 1 || date.getDate() != d){
				$form.shinsei_bi_from = "";
			} else {
				$form.shinsei_bi_from = request.shinsei_bi_from;
			}
		} else {
			$form.shinsei_bi_from = "";
		}
	}
	
	if ('shinsei_bi_to' in request) {
		$initialSearching = true;
		if (request.shinsei_bi_to.match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			var y = request.shinsei_bi_to.slice(0, 4);
			var m = request.shinsei_bi_to.slice(5, 6);
			var d = request.shinsei_bi_to.slice(7, 8);
		
			var date = new Date(y,m-1,d);
			if(date.getFullYear() != y || date.getMonth() != m - 1 || date.getDate() != d){
				$form.shinsei_bi_to = "";
			} else {
				$form.shinsei_bi_to = request.shinsei_bi_to;
			}
			
		} else {
			$form.shinsei_bi_to = "";
		}
	}
	
	if ('proc_type' in request) {
		$initialSearching = true;
		if ([Constant.LO_PROC_TYPE_MISHORI,
		     Constant.LO_PROC_TYPE_SHORIZUMI,
		     Constant.LO_PROC_TYPE_KANRYO].indexOf(request.proc_type) > -1) {
			$form.proc_type = request.proc_type;
		} else {
			$form.proc_type = Constant.LO_PROC_TYPE_MISHORI;
		}
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
	
	if ('gokuhi_flg' in request) {		
		$initialSearching = true;
		$form.gokuhi_flg = true;
		
		Logger.getLogger().info(' [searchMyList] $form ' + ImJson.toJSONString($form, true));

	}
	
	if (kikakuStatusDefaultSelected) {
		$form.not_finish = false;
	} else {
		if ('not_finish' in request) {
			$initialSearching = true;
			$form.not_finish = request.not_finish=="on" ? true : false;
		} else if($initialSearching) {
			$form.not_finish = true;
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
 * My文書一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchMyList(param) {
    //Debug.console('searchMyList');
    //Debug.console(param);

	// ユーザ情報取得
	loadUserInfo();

	Logger.getLogger().info(' [searchMyList]　My文書一覧検索 $userInfo ' + ImJson.toJSONString($userInfo, true));

    var accountContext = Contexts.getAccountContext();
    var usercd = accountContext.userCd;
    var locale = accountContext.locale;

    if (param.proc_type ==''){
    	param.proc_type = Constant.LO_PROC_TYPE_MISHORI;
    }

	var sql = "" ;
	sql += " SELECT  ";
	sql += "  t.doc_type ";
	sql += "  , ko04.cd_naiyo as doc_type_name " ; 
	sql += "  , t.target_doc_type ";
	sql += "  , t.wf_name " ; 
	sql += "  , t.id ";
	sql += "  , t.ip ";
	sql += "  , t.title_nm ";
	sql += "  , t.kaisha_id " ; 
	sql += "  , t.kaisha_nm " ; 
	sql += "  , t.status_cd ";
	sql += "  , t.status_name " ; 
	sql += "  , t.shinsei_nm ";
	sql += "  , t.shinsei_bi ";
	sql += "  , t.nyuryoku_sha_id";
	if ($userInfo.shohyoGroupFlg == '1' || $userInfo.keiyakuGroupFlg == '1') {
		sql += "  , null as node_id ";
	} else {
		sql += "  , imw.node_id ";
	}
	sql += " FROM (  ";
	// 企画
	sql += " SELECT ";
	sql += "  '" + Constant.LO_DOC_CLS_KIKAKU + "' as doc_type";
	sql += " ,'" + Constant.LO_DOC_CLS_KIKAKU + "' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ki.kikaku_id AS id ";
	sql += " ,ki.ip_nm AS ip ";
	sql += " ,ki.title_nm ";
	sql += " ,ki.kaisha_id " ; 
	sql += " ,ki.kaisha_nm " ; 
	sql += " ,ki.kikaku_status as status_cd ";
	sql += " ,ko01.cd_naiyo as status_name " ; 
	sql += " ,ki.kikaku_nm as shinsei_nm";
	sql += " ,to_char(ki.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";
	sql += " ,ki.shohyo_chosa_kekka ";
	sql += " ,case when ki.kikaku_shubetsu_cd in ('" + Constant.LO_KIKAKU_SHUBETSU_MUSIC + "', '" + Constant.LO_KIKAKU_SHUBETSU_EVENT + "')";
	sql += "       then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,'' as gokuhi_flg";
	sql += " ,ki.koushin_sha";
	sql += " ,'' AS nyuryoku_sha_id";
	sql += " FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + ($userInfo.licenseeFlg == '1' ? Constant.LO_CDCLS_KIKAKU_STATUS_LI : Constant.LO_CDCLS_KIKAKU_STATUS_PR) + "' ";
	sql += "    AND ko01.cd_id = ki.kikaku_status ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += " WHERE ki.sakujo_flg ='0' ";
	sql += " UNION ALL ";
	// 許諾
	sql += "SELECT ";
	sql += "  '" + Constant.LO_DOC_CLS_KYODAKU + "' as doc_type";
	sql += " ,'" + Constant.LO_DOC_CLS_KYODAKU + "' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ky.kyodaku_id AS id ";
	sql += " ,ki.ip_nm AS ip ";
	sql += " ,ki.title_nm ";
	sql += " ,ky.kaisha_id " ; 
	sql += " ,ky.kaisha_nm " ; 
	sql += " ,ky.kyodaku_status as status_cd ";
	sql += " ,ko02.cd_naiyo as status_name " ; 
	sql += " ,ky.kyodaku_nm as shinsei_nm";
	sql += " ,ky.shinsei_bi ";
	sql += " ,null as shohyo_chosa_kekka ";
	sql += " ,case when ky.kyodaku_cls = '" + Constant.LO_KYODAKU_SHUBETSU_NEW + "' then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,'' as gokuhi_flg";
	sql += " ,ky.koushin_sha";
	sql += " ,'' AS nyuryoku_sha_id";
	sql += " FROM ";
	sql += "  lo_t_kyodaku AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + ($userInfo.licenseeFlg == '1' ? Constant.LO_CDCLS_KYODAKU_STATUS_LI : Constant.LO_CDCLS_KYODAKU_STATUS_PR) + "' ";
	sql += "    AND ko02.cd_id = ky.kyodaku_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN ( ";
	sql += "  SELECT hi.kyodaku_id";
	sql += "    ,string_agg(distinct ki.ip_nm,','order by ki.ip_nm) as ip_nm ";
	sql += "    ,string_agg(distinct ki.title_nm,','order by ki.title_nm) as title_nm ";
	sql += "    FROM lo_t_kyodaku_kikaku_himozuke AS hi ";
	sql += "  LEFT JOIN lo_t_kikaku AS ki ";
	sql += "    ON  ki.kikaku_id = hi.kikaku_id ";
	sql += "    AND ki.sakujo_flg ='0' ";
	sql += "    AND hi.sakujo_flg ='0' ";
	sql += "  group by hi.kyodaku_id ";
	sql += "  ) as ki ";
	sql += "    ON ky.kyodaku_id = ki.kyodaku_id ";
	sql += "  WHERE  ky.sakujo_flg ='0' ";
	sql += " UNION ALL ";
	// 代わり承認WF
	sql += "SELECT ";
	sql += "  ky.bunsho_cls as doc_type";
	sql += " ,'" + Constant.LO_DOC_CLS_KAWARI + "' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ky.bunsho_id AS id ";	
	sql += " ,ky.ip_nm AS ip ";
	sql += " ,ky.title_nm ";
	sql += " ,ky.kaisha_id " ; 
	sql += " ,CASE " ;
	sql += "      WHEN ky.bunsho_cls ='"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"' THEN  Ko03.cd_naiyo" ; 
	sql += "      ELSE ky.kaisha_nm" ; 
	sql += " END kaisha_nm " ; 
	sql += " ,ky.kawari_status as status_cd ";
	sql += " ,ko02.cd_naiyo as status_name " ; 
	sql += " ,ky.bunsho_nm as shinsei_nm";
	sql += " ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";	
	sql += " ,null as shohyo_chosa_kekka ";
	sql += " ,case when ky.kyodaku_cls = '" + Constant.LO_KYODAKU_SHUBETSU_NEW + "' then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,ky.gokuhi_flg";
	sql += " ,ky.koushin_sha";
	sql += " ,ky.nyuryoku_sha_id";
	sql += " FROM ";
	sql += "  lo_t_kawari AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KAWARI_STATUS + "' ";
	sql += "    AND ko02.cd_id = ky.kawari_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	//LPの場合の海外販社
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND	ky.kaigai_hansha_cd = ko03.cd_id ";
	sql += "    AND ko03.sakujo_flg ='0' ";
	sql += "    AND ky.bunsho_cls='"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"') ";
	sql += "  WHERE  ky.sakujo_flg ='0' ";
	
	sql += " UNION ALL ";
	// アカウント申請WF
	sql += "SELECT ";
	sql += "  '7' as doc_type";
	sql += " ,'7' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ky.shinsei_id AS id ";	
	sql += " ,'' AS ip ";
	sql += " ,'' AS title_nm ";
	sql += " ,ky.kaisha_id " ; 
	sql += " ,ky.kaisha_nm" ; 
	sql += " ,ky.shinsei_status as status_cd ";
	sql += " ,ko02.cd_naiyo as status_name " ; 
	sql += " ,'アカウント申請' as shinsei_nm";
	sql += " ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";	
	sql += " ,'' as shohyo_chosa_kekka ";
	sql += " ,'' as keiyaku_grp_disp_flg ";
	sql += " ,'0' as gokuhi_flg";
	sql += " ,ky.koushin_sha";
	sql += " ,ky.shinsei_sha_id as nyuryoku_sha_id";
	sql += " FROM ";
	sql += "  lo_t_account_shinsei AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS + "' ";
	sql += "    AND ko02.cd_id = ky.shinsei_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";

	sql += "  WHERE  ky.sakujo_flg ='0' ";

	sql += "  ) t ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "    ON (ko04.cd_cls_id = '" + ($userInfo.licenseeFlg == '1' ? Constant.LO_CDCLS_DOC_TYPE : Constant.LO_CDCLS_DOC_TYPE_PR) + "' ";
	sql += "    AND ko04.cd_id = t.doc_type ";
	sql += "    AND ko04.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "    ON ((('" + Constant.LO_DOC_CLS_KIKAKU + "' = t.doc_type ";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KIKAKU_STATUS + "') ";
	sql += "      OR ('" + Constant.LO_DOC_CLS_KYODAKU + "' = t.doc_type ";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KYODAKU_STATUS + "') ";
	sql += "      OR ( t.doc_type in ('"+Constant.LO_DOC_CLS_KAWARI_KIKAKU+"','"+Constant.LO_DOC_CLS_KAWARI_KYODAKU+"','"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"') ";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KAWARI_STATUS + "') ";
	sql += "      OR ( t.doc_type = '"+Constant.LO_DOC_CLS_ACCOUNT+"'";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KAWARI_STATUS + "') )";
	
	sql += "    AND ko05.cd_id = t.status_cd ";
	sql += "    AND ko05.sakujo_flg ='0') ";

	// 未処理案件----------
	if (param.proc_type == Constant.LO_PROC_TYPE_MISHORI){
		if ($userInfo.shohyoGroupFlg == '1') {
			sql+= " WHERE ";
			sql+= "  t.doc_type = '" + Constant.LO_DOC_CLS_KIKAKU + "' ";
			sql+= "  AND t.status_cd in (";
			sql+= " '" + Constant.LO_STATUS_SHINSEI + "',";
			sql+= " '" + Constant.LO_STATUS_SASHIMODOSHI + "',";
			sql+= " '" + Constant.LO_STATUS_SHONIN + "',";
			sql+= " '" + Constant.LO_STATUS_SHONIN_OK + "',";
			sql+= " '" + Constant.LO_STATUS_KANRYO + "')";
			sql+= "  AND coalesce(shohyo_chosa_kekka,'0') = '0' ";
		} else {
			sql += " left join ";
			sql += " (select actv.matter_name,users.node_id from imw_t_actv_matter actv ";
			sql += "  inner join ";
			sql += "   (select eu.system_matter_id,eu.node_id ";
			sql += "    from imw_t_actv_executable_user eu ";
			sql += "    left join imw_t_act act ";
			sql += "    on eu.auth_user_code = act.original_act_user_code ";
			sql += "    and act.start_date <= CURRENT_DATE ";
			sql += "    and act.limit_date > CURRENT_DATE ";
			sql += "    where (eu.auth_user_code = '" + usercd+ "'";
			sql += "           or act.target_code = '" +usercd+ "')";
			sql += "    and eu.locale_id = '" + locale+ "'";
			sql += "    ) users ";
			sql += "  on actv.system_matter_id = users.system_matter_id ";
			sql += " ) imw ";
			sql += " on t.id = imw.matter_name ";
			sql+= " WHERE " ;
			sql+= "    (imw.matter_name is not null ";
			// ライセンシーの場合は同一会社の一時保存も対象
			if ($userInfo.licenseeFlg == '1') {
				var kaisha_id = $userInfo.userCompanyDepartment.companyCd;
				sql+= "      OR (t.status_cd = '" + Constant.LO_STATUS_ICHIJI_HOZON + "' ";
                sql+= "        AND t.kaisha_id = '"+ kaisha_id + "' ";
                sql+= "        AND (t.doc_type ='" + Constant.LO_DOC_CLS_KIKAKU + "' ";
                sql+= "          OR t.doc_type ='" + Constant.LO_DOC_CLS_KYODAKU + "' ";
                sql+= "          OR t.doc_type ='" + Constant.LO_DOC_CLS_ACCOUNT + "'))";
			}
			// プロダクションの場合は代わり承認、アカウントの一時保存を対象にする
			if ($userInfo.licenseeFlg == '0') {
				sql+= "      OR (t.status_cd = '" + Constant.LO_STATUS_ICHIJI_HOZON + "' AND t.koushin_sha = '" + usercd + "' ";
				sql+= "        AND t.doc_type in ('"+Constant.LO_DOC_CLS_KAWARI_KIKAKU+"','"+Constant.LO_DOC_CLS_KAWARI_KYODAKU+"','"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"','"+Constant.LO_DOC_CLS_ACCOUNT+"'))";
			}
			sql+= "    ) ";
			sql+= "  AND t.status_cd not in (";
			sql+= "    '" + Constant.LO_STATUS_JITAI + "',";
			sql+= "    '" + Constant.LO_STATUS_HIKETSU + "',";
			sql+= "    '" + Constant.LO_STATUS_KANRYO + "',";
			sql+= "    '" + Constant.LO_STATUS_IKO + "')";
		}
	}
	// ----------------------------------------
	// 処理済み案件----------
	if (param.proc_type == Constant.LO_PROC_TYPE_SHORIZUMI){
		if ($userInfo.shohyoGroupFlg == '1') {
			sql+= " WHERE ";
			sql+= "  t.doc_type = '" + Constant.LO_DOC_CLS_KIKAKU + "' ";
			sql+= "  AND t.status_cd in (";
			sql+= " '" + Constant.LO_STATUS_SHINSEI + "',";
			sql+= " '" + Constant.LO_STATUS_SASHIMODOSHI + "',";
			sql+= " '" + Constant.LO_STATUS_SHONIN + "',";
			sql+= " '" + Constant.LO_STATUS_SHONIN_OK + "',";
			sql+= " '" + Constant.LO_STATUS_KANRYO + "')";
			sql+= "  AND coalesce(shohyo_chosa_kekka,'0') <> '0' ";
		} else {
			sql += " left join ";
			sql += " (select actv.matter_name,string_agg(users.node_id,','order by users.node_id) as node_id from imw_t_actv_matter actv ";
			sql += "  inner join ";
			sql += "   (select distinct ";
			sql += "      tsk.system_matter_id, ";
			sql += "      case when tsk.status in (";
			sql += " '" + Constant.LO_WF_STATUS_SHINSEI + "',";
			sql += " '" + Constant.LO_WF_STATUS_SHONIN + "',";
			sql += " '" + Constant.LO_WF_STATUS_SASHIMODOSHI + "')";

			sql += "           then tsk.node_id end node_id";
			sql += "    from imw_t_cpl_task tsk ";
			sql += "    inner join imw_t_cpl_user cpl "; 
			sql += "    on tsk.system_matter_id = cpl.system_matter_id "; 
			sql += "    and tsk.task_id = cpl.task_id ";
			sql += "    where cpl.execute_user_code = '" + usercd+ "' ";
			sql += "    ) users ";
			sql += "  on actv.system_matter_id = users.system_matter_id ";
			sql += "  group by actv.matter_name ";
			sql += "  union ";
			sql += " select actv.matter_name,string_agg(users.node_id,','order by users.node_id) as node_id from imw_t_cpl_matter actv "; 
			sql += "  inner join ";
			sql += "   (select distinct ";
			sql += "      tsk.system_matter_id, ";
			sql += "      case when tsk.status in (";
			sql += " '" + Constant.LO_WF_STATUS_SHINSEI + "',";
			sql += " '" + Constant.LO_WF_STATUS_SHONIN + "')";
			sql += "           then tsk.node_id end node_id";
			sql += "    from imw_t_cpl_matter_task tsk ";
			sql += "    inner join imw_t_cpl_matter_user cpl ";
			sql += "    on tsk.system_matter_id = cpl.system_matter_id "; 
			sql += "    and tsk.task_id = cpl.task_id  ";
			sql += "    where cpl.execute_user_code = '" + usercd+ "' ";
			sql += "      and tsk.status in (";
			sql += " '" + Constant.LO_WF_STATUS_SHINSEI + "',";
			sql += " '" + Constant.LO_WF_STATUS_SHONIN + "',";
			sql += " '" + Constant.LO_WF_STATUS_SASHIMODOSHI + "')";
			sql += "    ) users "; 
			sql += "  on actv.system_matter_id = users.system_matter_id " ; 
			sql += "  group by actv.matter_name " ; 
			sql += " ) imw ";
			sql += " on t.id  = imw.matter_name ";
			sql+= " WHERE ";
			sql+= "    imw.matter_name is not null ";
		}
	}
	// ----------------------------------------
	// 完了案件----------
	if (param.proc_type == Constant.LO_PROC_TYPE_KANRYO){
		if ($userInfo.shohyoGroupFlg == '1') {
			sql+= "WHERE ";
			sql+= "  t.doc_type = '" + Constant.LO_DOC_CLS_KIKAKU + "' ";
			sql+= "  AND t.status_cd = '" + Constant.LO_STATUS_KANRYO + "' ";
			sql+= "  AND coalesce(shohyo_chosa_kekka,'0') <> '0' ";
		} else {
			sql += " left join ";
			sql += " (select actv.matter_name,string_agg(users.node_id,','order by users.node_id) as node_id from imw_t_cpl_matter actv "; 
			sql += "  inner join ";
			sql += "   (select distinct ";
			sql += "      tsk.system_matter_id, ";
			sql += "      case when tsk.status in (";
			sql += " '" + Constant.LO_WF_STATUS_SHINSEI + "',";
			sql += " '" + Constant.LO_WF_STATUS_SHONIN + "')";
			sql += "           then tsk.node_id end node_id";
			sql += "    from imw_t_cpl_matter_task tsk ";
			sql += "    inner join imw_t_cpl_matter_user cpl ";
			sql += "    on tsk.system_matter_id = cpl.system_matter_id "; 
			sql += "    and tsk.task_id = cpl.task_id  ";
			sql += "    where cpl.execute_user_code = '" + usercd+ "' ";
			sql += "      and tsk.status in (";
			sql += " '" + Constant.LO_WF_STATUS_SHINSEI + "',";
			sql += " '" + Constant.LO_WF_STATUS_SHONIN + "',";
			sql += " '" + Constant.LO_WF_STATUS_SASHIMODOSHI + "')";
			sql += "    ) users "; 
			sql += "  on actv.system_matter_id = users.system_matter_id " ; 
			sql += "  group by actv.matter_name " ; 
			sql += " ) imw ";
			sql += " on t.id  = imw.matter_name ";
			sql += " WHERE ";
			sql += "    imw.matter_name is not null ";
			sql += "  AND t.status_cd = '" + Constant.LO_STATUS_KANRYO + "' ";
		}
	}
	// ----------------------------------------
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
    columnNameMap["pl_ip"] = {col:"t.ip",comp:"like"};
    columnNameMap["pl_title_nm"] = {col:"t.title_nm",comp:"like"};
    columnNameMap["kaisha_nm"] = {col:"t.kaisha_nm",comp:"eq"};
    columnNameMap["doc_id"] = {col:"t.id",comp:"like"};
    columnNameMap["shinsei_nm"] = {col:"t.shinsei_nm",comp:"like"};
    columnNameMap["doc_type"] = {col:"t.doc_type",comp:"eq"};
    columnNameMap["shinsei_bi_from"] = {col:"t.shinsei_bi",comp:"ge"};
    columnNameMap["shinsei_bi_to"] = {col:"t.shinsei_bi",comp:"le"};
    columnNameMap["not_finish"] = {col:"t.status_cd",comp:"ni"};
    
    //ver2.3プロト 極秘を追加      
    if(param.gokuhi_flg == "1") {    	
    	columnNameMap["gokuhi_flg"] = {col:"t.gokuhi_flg",comp:"eq"};    	
    }else{
    	param.gokuhi_flg = "1";
    	columnNameMap["gokuhi_flg"] = {col:"t.gokuhi_flg",comp:"ne"};    	
    }    
    
    if(param.not_finish == "on") {
    	param.not_finish = [Constant.LO_STATUS_KANRYO, Constant.LO_STATUS_IKO];
    } else {
    	param.not_finish = [];
    }
    columnNameMap["kikaku_status"] = {col:"t.status_cd",comp:"in"};
    // 条件設定
    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);
    // 並び順：１.表示ソート順、２.企画/許諾、３.申請日降順、４．ID
    sql += " ORDER BY RIGHT('00' || ko05.sort_no, 2) ASC ";
	sql += "  ,t.doc_type ASC ";
    sql += "  ,t.shinsei_bi DESC ";
	sql += "  ,t.id ASC ";
    // todo 表示件数制限（ダミー） 実際は画面の表示件数とページングで色々変える
    // 削除（THATS_RIGHTS-1367 B92 各一覧画面の検索結果について確認です）
    //sql += " LIMIT 100 ";

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKyodakuList]　MY文書検索 SQL ' + sql + " strParam " + ImJson.toJSONString(strParam, true));
    var result = db.select(sql,strParam, 0);
    //Logger.getLogger().info(' [searchKyodakuList]　MY文書検索 中身 ' + ImJson.toJSONString(result.data, true));
    var obj = {}
    obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_MY);
    obj = getWFName(obj);
    result.data = obj;
    
    return result;
}

/**
 *  WF名取得
 * @param {object} 検索データ
 * @returns {object} 変換後データ
 */
function getWFName(data) {
	var WFName = {};
	WFName[Constant.LO_NODE_APPLY] = Constant.LO_NAME_NODE_APPLY;
	WFName[Constant.LO_NODE_APPR_0] = Constant.LO_NAME_NODE_APPR_0;
	WFName[Constant.LO_NODE_APPR_1] = Constant.LO_NAME_NODE_APPR_1;
	WFName[Constant.LO_NODE_APPR_2] = Constant.LO_NAME_NODE_APPR_2;
	WFName[Constant.LO_NODE_APPR_3] = Constant.LO_NAME_NODE_APPR_3;
	WFName[Constant.LO_NODE_APPR_LAST] = Constant.LO_NAME_NODE_APPR_LAST;
	
	WFName[Constant.LO_NODE_KIAN] = Constant.LO_NAME_NODE_KIAN;
	WFName[Constant.LO_NODE_APPR_4] = Constant.LO_NAME_NODE_APPR_4;
	WFName[Constant.LO_NODE_APPR_5] = Constant.LO_NAME_NODE_APPR_5;
	WFName[Constant.LO_NODE_LAST_CONFIRM] = Constant.LO_NAME_NODE_LAST_CONFIRM;

	var ret = "";
	for (var i = 0;i < data.length;i++){
		var node_id = data[i].node_id;
		if (node_id==null){
			data[i].wf_name = "";
			continue;
		}
		
		var arr = node_id.split(',')// 複数ノードに所属している場合の対応
		var names=[]
		for (var n=0;n < arr.length;n++){
			ret = WFName[arr[n]];
			if (typeof ret === "undefined"){
				ret ="";
			}else{
				names.push(ret)
			}
		}
		data[i].wf_name = names.join('、');
		/*ret = WFName[data[i].node_id];
		if (typeof ret === "undefined"){
			ret ="";
		}
		data[i].wf_name = ret;
		*/
	}
	return data;
}
