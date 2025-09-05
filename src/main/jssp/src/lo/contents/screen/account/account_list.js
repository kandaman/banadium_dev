Constant.load("lo/common_libs/lo_const");
var $production_flg = false; //ライセンスプロダクションフラグ
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
    , kawariInputFlg : "0" // 代わり承認入力者フラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
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
	, doc_type : ""
	, bunsho_id : "" //kikaku_id
	, shinsei_from : ""
	, shinsei_to : ""
	, tantou_sha : ""
	, wf_user : ""
	, kaisha_nm : ""
};

var $doc_type_list = [{label:"", value: ""}];

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
	
	// ライセンシーの場合は表示させない
	if (!$production_flg) {
		//Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}
	
	loadUserInfo();

	// 画面初期表示
	getDispData();

	parseInitialParameter(request);
	
	//固定値マスタから、列の並び順を取得する
	$showColumnDef = Constant.LO_CDCLS_ACCOUNT_LIST_SHOW_COLUMN;
	$form.show_column_map = Content.executeFunction("lo/common_libs/lo_common_fnction", "getListShowColumnDefs", $showColumnDef);	

}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "getUserInfo"); 
}

/**
 * 画面表示項目取得
 */
function getDispData() {
	// 文書リスト取得
	$doc_type_list = [];
	$doc_type_list.push({label:"",value:"",selected:true});
	$doc_type_list.push({label:"アカウント申請",value:"AS",selected:false});
	$doc_type_list.push({label:"アカウント申請（BNE社内ユーザ用）",value:"SS",selected:false});
	
	$charge_caption = "BNE担当者";
	
	// ステータス取得
	var statusList = [];
	statusList.push({label:"",value:"",selected:true});	

	var status_list_temp ={};
	
	//ステータスをリスト形式で取得
	status_list_temp = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue", status_list_temp, Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS);
	
	for(var i in status_list_temp){
		if(i != Constant.LO_STATUS_SAKUJO){
			statusList.push({label:status_list_temp[i],value:i});
		}
	}

	//statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS);
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

	if ('bunsho_nm' in request) {
		$initialSearching = true;
		$form.bunsho_nm = request.bunsho_nm;
	}

	var kawariStatusDefaultSelected = false;
	if ('kawari_status' in request) {
		$initialSearching = true;
		$form.kawari_status = request.kawari_status;
		kawariStatusDefaultSelected = setSelectedProperty($form.status_list, $form.kawari_status);
		if (kawariStatusDefaultSelected == false) {
			var selectValues = $form.kawari_status.split(",");
			for (var key in selectValues) {
				var selectValue = selectValues[key];
				kawariStatusDefaultSelected = setSelectedProperty($form.status_list, selectValue, ",");
				if (kawariStatusDefaultSelected) {
					break;
				}
			}
		}
	}	

	if ('bunsho_id' in request) {
		$initialSearching = true;
		$form.bunsho_id = request.bunsho_id;
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

	if ('wf_user' in request) {
		$initialSearching = true;
		$form.wf_user = request.wf_user;
	}

	if ('kaisha_nm' in request) {
		$initialSearching = true;
		$form.kaisha_nm = request.kaisha_nm;
	}

	if (kawariStatusDefaultSelected) {
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
 * 代わり承認WF一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKawariList(param) {

	var accountContext = Contexts.getAccountContext();
	var usercd = accountContext.userCd;
	var locale = accountContext.locale;

	// ライセンスプロダクションか判断
	var is_production = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;

	var sql = "" ;
	sql += " SELECT DISTINCT " ;	
	sql += "  case ";
	sql += "  when substr(k.shinsei_id,1,2) = 'AS' then 'ライセンシー' " ; // 文書種別名
	sql += "  else 'BNE' " ; // 文書種別名
	sql += "   end doc_type_name " ; // 文書種別名
	sql += "  ,k.shinsei_status as shinsei_status " ; // ステータス
	sql += "  ,k.shinsei_id as shinsei_id " ; // 文書番号	
	sql += "  ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; // 申請日	
	sql += "  ,k.shinsei_sha_id " ; // 起案者
	sql += "  ,COALESCE(k.shinsei_sha_nm,'') as shinsei_sha_nm" ; // 起案者
	sql += "  ,k.tantou_sha_id " ; // 起案者
	sql += "  ,COALESCE(k.tantou_sha_nm,'') as tantou_sha_nm" ; // 起案者
	sql += "  ,to_char(k.koushin_bi,'YYYY/MM/DD') as koushin_bi " ; // 最終更新日	
	sql += "   ,COALESCE(k.kaisha_nm,'') as kaisha_nm" ;	
	sql += "   ,k.koushin_sha " ; // 更新者
	sql += "  ,imw.auth_user_cd " ; // ワーフクローの処理者コード
	sql += "  ,imw.auth_user_name " ; // ワーフクローの処理者名
	sql += "  ,ko03.cd_naiyo AS shinsei_status_name ";
	sql += "  ,ko03.sort_no AS shinsei_status_order ";
	sql += " FROM lo_t_account_shinsei as k " ;
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS + "' ";
	sql += "    AND ko03.cd_id = k.shinsei_status ";
	sql += "    AND ko03.sakujo_flg ='0') ";

	// ワークフローの処理者取得----------
	// todo　暫定対応もう少しテーブル整理する
	sql += " left join " ;
	sql += " (select actv.matter_name,users.auth_user_cd,users.auth_user_name from imw_t_actv_matter actv " ;
	sql += "  inner join " ;
	sql += "   (select system_matter_id,string_agg(auth_user_code,','order by auth_user_code) as auth_user_cd,";
	sql += "   	string_agg(auth_user_name,','order by auth_user_name) as auth_user_name " ;
	sql += "    from imw_t_actv_executable_user  " ;
	sql += "    where locale_id = '" + locale+ "'" ;
	sql += "    group by system_matter_id) users " ;
	sql += "  on actv.system_matter_id = users.system_matter_id " ;
	sql += " ) imw " ;
	sql += " on k.shinsei_id  = imw.matter_name " ;
	// ----------------------------------------

	sql += " WHERE k.sakujo_flg ='0' " ;

	// 動的Where句
	var strSearchWhere="";
	// 入力パラメータ
	var strParam=[];

	// 画面入力項目とDB項目のマッピング
	var columnNameMap = {};
	var condition = "";	
	
	//入力者 or 起案者の名称検索
	if(param["wf_user"] !=""){
		sql += " AND ( ";
		sql += "k.tantou_sha_nm ilike '%'||?||'%'  OR ";
		sql += "k.shinsei_sha_nm ilike '%'||?||'%' ";
		sql += ") ";
		
		strParam.push(DbParameter.string(param["wf_user"]));
		strParam.push(DbParameter.string(param["wf_user"]));
	}
	
	// 部分一致
	columnNameMap["title_nm"] = {col:"k.title_nm",comp:"like"};	
	columnNameMap["doc_type"] = {col:"k.shinsei_id",comp:"like"};
	columnNameMap["shinsei_id"] = {col:"k.shinsei_id",comp:"like"};

	// 条件以外
	columnNameMap["not_finish"] = {col:"k.shinsei_status",comp:"ni"};
	if(param.not_finish == "on") {
		param.not_finish = [Constant.LO_STATUS_KANRYO, Constant.LO_STATUS_IKO];
	} else {
		param.not_finish = [];
	}
	// 複数
	columnNameMap["shinsei_status"] = {col:"k.shinsei_status",comp:"eq"};
	// 範囲
	columnNameMap["shinsei_from"] = {col:"to_char(k.shinsei_bi,'YYYY/MM/DD')",comp:"ge"};
	columnNameMap["shinsei_to"] = {col:"to_char(k.shinsei_bi,'YYYY/MM/DD')",comp:"le"};
	// 「担当者」の検索対象…プロダクション→BNE 担当者(bne_tantou_sha)、ライセンシー→ライセンシー担当者(tantou_sha)
	
	
	// 「担当者」の検索対象…プロダクション→BNE 担当者(bne_tantou_sha)、ライセンシー→ライセンシー担当者(tantou_sha)
    if(is_production){
		if(param["kaisha_nm"] !=""){
			columnNameMap["kaisha_nm"] = {col:"k.kaisha_nm",comp:"eq"};	
		}
		
    	if (!(param.shinsei_status) ||
    			(Array.isArray(param.shinsei_status) && param.shinsei_status.length == 0)) {
    	    columnNameMap["not_ichiji_hozon"] = {col:"k.shinsei_status",comp:"ne"};
        	param.not_ichiji_hozon = Constant.LO_STATUS_ICHIJI_HOZON;
    	}

    }else{    	
    	// ライセンシーの場合会社は固定
    	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (param.kaisha_id == null || param.kaisha_id == "") {
			param.kaisha_id = Constant.LO_DUMMY_KAISHA_CD;
		}
    	columnNameMap["kaisha_id"] = {col:"k.kaisha_id",comp:"eq"};
    }
    
    // 条件設定
	condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	sql += " order by shinsei_status_order, shinsei_bi desc, k.shinsei_id ";

	// sql実行
	var db = new TenantDatabase();

	var result = db.select(sql,strParam);
	Logger.getLogger().info(' [init]　$nodeUserslist.' + sql+ ImJson.toJSONString(result,true));
	// ステータス設定
	var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_ACCOUNT);
	result.data = obj;
	// セッション登録
	Client.set('searchCondKawari', {where: condition.sql, param: strParam});

	return result;
}