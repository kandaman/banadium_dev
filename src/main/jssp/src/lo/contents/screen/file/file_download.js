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

var $oshirase = ''; // お知らせ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
	
	loadUserInfo();

	// 画面初期表示
	getDispData();

	parseInitialParameter(request);
	
	//固定値マスタから、列の並び順を取得する
	$showColumnDef = Constant.LO_CDCLS_KAWARI_LIST_SHOW_COLUMN;	
	$form.show_column_map = Content.executeFunction("lo/common_libs/lo_common_fnction", "getListShowColumnDefs", $showColumnDef);
	
	$form.show_column_map = ImJson.toJSONString(["doc_type_name", "kawari_status_name", "shinsei_bi", "bunsho_id", "ip_nm", "title_nm", "bunsho_nm", "kikaku_cls_name", "kyodaku_cls_name", "keiyaku_cls_name", "shohyo", "nyuryoku_sha_nm", "kian_sha_nm", "kaisha_nm", "koushin_bi"],false);

	
	//固定値マスタから、お知らせを取得する
	var tmpOshirase = [];
	tmpOshirase = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", tmpOshirase, Constant.LO_CDCLS_DOWNLOAD_OSHIRASE);	
	
	$oshirase = tmpOshirase[0];

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
	$doc_type_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $doc_type_list, Constant.LO_CDCLS_KAWARI_DOC_TYPE);

	$charge_caption = "BNE担当者";
	
	// ステータス取得
	var statusList = [];
	statusList.push({label:"",value:"",selected:true});	

	var status_list_temp ={};
	
	//ステータスをリスト形式で取得
	status_list_temp = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue", status_list_temp, Constant.LO_CDCLS_KAWARI_STATUS);
	
	for(var i in status_list_temp){
		if(i != Constant.LO_STATUS_SAKUJO){
			statusList.push({label:status_list_temp[i],value:i});
		}
	}

	//statusList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", statusList, Constant.LO_CDCLS_KAWARI_STATUS);
	$form.status_list = statusList;
}

/**
 * リクエストパラメータから、画面の初期入力情報を設定します。
 *
 * @param {Object} request リクエスト
 */
function parseInitialParameter(request) {

	//初期表示時に検索結果を表示する
	$initialSearching = true;	
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
 * 一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchList(param) {

	var accountContext = Contexts.getAccountContext();
	var usercd = accountContext.userCd;
	var locale = accountContext.locale;

	// ライセンスプロダクションか判断
	var is_production = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;

	var sql = "" ;
	sql += " SELECT " ;
	sql += " row_number() over(order by f.sort_no) row_num" ;
	sql += " ,f.file_id " ;
	sql += " ,f.category " ;
	sql += " ,ko01.cd_naiyo as category_nm " ;
	sql += " ,f.file_nm " ;
	sql += " ,f.naiyo " ;
	sql += " ,f.koukai_hani " ;
	sql += " ,ko02.cd_naiyo as koukai_hani_nm " ;
	sql += ",f.file_path" ;
	sql += ",f.file_version" ;
	sql += ",to_char(f.keisai_bi,'YYYY/MM/DD') as keisai_bi" ;
	sql += ",to_char(f.koshin_bi,'YYYY/MM/DD') as koshin_bi" ;
	sql += " FROM lo_m_file as f " ;
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" +  Constant.LO_CDCLS_DOWNLOAD_CATEGORY + "' ";
	sql += "    AND ko01.cd_id = f.category ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" +  Constant.LO_CDCLS_DOWNLOAD_KOUKAI_HANI + "' ";
	sql += "    AND ko02.cd_id = f.koukai_hani ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE f.sakujo_flg ='0' " ;

	// 動的Where句
	var strSearchWhere="";
	// 入力パラメータ
	var strParam=[];

	// 画面入力項目とDB項目のマッピング
	var columnNameMap = {};
	var condition = "";	
	
	// 部分一致
	columnNameMap["file_nm"] = {col:"f.file_nm",comp:"like"};
	
	//ユーザ情報から、公開範囲を設定
	if(is_production){
		sql += " AND f.koukai_hani in ('1','3') ";
	}else{
		sql += " AND f.koukai_hani in ('1','2') ";
	}
	
	// 条件設定
	condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);	
	
	sql += " order by ko01.sort_no,ko02.sort_no,f.sort_no";

	// sql実行

	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchKawariList]　代わり承認WF一覧検索 SQL ' + sql + " strParam " + ImJson.toJSONString(param, true));
	var result = db.select(sql,strParam);
	Logger.getLogger().info(' [searchKawariList]　代わり承認WF一覧検索 SQL ' + sql + " strParam " + ImJson.toJSONString(result.data, true));
	// ステータス設定
	var obj = {}
	obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_KAWARI);
	result.data = obj;
	// セッション登録
	Client.set('searchCondKawari', {where: condition.sql, param: strParam});

	/*
	var result ={"countRow":1,"data":[{"file_nm":"証紙出庫申請書",
	"file_path":"証紙出庫申請書.xls",
	"file_size":"123KB",
	
	"last_update":"2022/01/01 13:02"},
	{"file_nm":"よくあるお問い合わせ",
	"file_path":"よくあるお問い合わせ.pdf",
	"file_size":"256KB",
"last_update":"2022/01/11 13:02"}]};
*/
	Logger.getLogger().info(' [searchKawariList]　代わり承認WF一覧検索 SQL ' + sql + " strParam " + ImJson.toJSONString(result.data, true));
	return result;
}