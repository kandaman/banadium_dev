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
	, type :"1"
	, header_title :""
};

var $doc_type_list = [{label:"", value: ""}];

var $banadiumFormatVersion = '1';

var $showColumnDef = '';

var $listData = {};

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
	
	if("t" in request){
		$form.type = request.t;
	}	
	

	// 画面初期表示
	getDispData();

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
	
	switch($form.type){
		case "1":
			$form.header_title = "完了通知先";
			break;
		case "2":
			$form.header_title = "承認経路";
			break;
	}
	
	
	$listData = searchList();
}

/**
 * 代わり承認WF一覧検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchList() {
	
	if($form.type =="1"){
		var sql = "" ;
		sql += " SELECT * from lo_m_title t " ;
		sql += " INNER JOIN lo_m_ip ip " ;
		sql += " ON t.ip_cd = ip.ip_cd " ;
		sql += " AND ip.sakujo_flg = '0' " ;
		sql += " WHERE t.sakujo_flg ='0' " ;
		sql += " order by t.tantou_kakari_cd ";
	
		// sql実行
		var db = new TenantDatabase();	
		var result = db.select(sql);
		Logger.getLogger().info(' [searchKawariList]　代わり承認WF一覧検索 SQL ' + sql + " strParam " + ImJson.toJSONString(result.data, true));
		
		var data = [];
		var idx=1;
		for(var i in result.data){
			result.data[i]["tantou_kakari_nm"] = "特定"+result.data[i].tantou_kakari_cd;
			result.data[i]["edaban"] = idx;
			data.push(result.data[i]);
			idx++;
	//LO_GROUP_CD_SPECIFIC
	
		}	
	}else if($form.type =="2"){
		var result = Content.executeFunction("lo/contents/screen/info/index_data_retriever", "retrieveShoninKeiroList");	
		var data = result.data;
	}
	
	

	
	return data;
}