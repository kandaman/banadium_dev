Constant.load("lo/common_libs/lo_const");
var $radio_mode = false; // 選択方式
var $doc_type_list =[]; // 文書種別のセレクトボックス
var $status_list =[]; // 文書種別のセレクトボックス

var $initialSearching = true;// 初期検索あり 
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	if (request.mode == "radio") {
		$radio_mode = true;
	}
	
	$radio_mode = false;
	
	// 文書リスト取得
	$doc_type_list = [];
	$doc_type_list.push({label:"",value:"",selected:true});
	$doc_type_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $doc_type_list, Constant.LO_CDCLS_DOC_TYPE_PR);


	$status_list.push({label:"",value:"",selected:true});
	
	var status_list_temp ={};
	//ステータスをリスト形式で取得
	status_list_temp = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue", status_list_temp, Constant.LO_CDCLS_KIKAKU_STATUS_PR);
	
	$status_list.push({label:status_list_temp[Constant.LO_STATUS_KANRYO],value:Constant.LO_STATUS_KANRYO});
	$status_list.push({label:status_list_temp[Constant.LO_STATUS_IKO],value:Constant.LO_STATUS_IKO});
}

/**
 * 関連文書 検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchList(param) {
	
	// 特定**　パブリックグループを取得
	var searchStr = 'lo_specific_group';
	
	var db = new TenantDatabase();
	
	var sql = "SELECT * FROM imm_public_grp grp";
	sql += " WHERE grp.delete_flag = '0' ";
	sql += "   AND grp.start_date <= CURRENT_DATE ";
	sql += "   AND grp.end_date > CURRENT_DATE ";
	sql += "   AND grp.public_group_cd like ? ";
	sql += "   ORDER BY grp.public_group_cd ";
	
		
	var param = [];
	
	param.push(DbParameter.string(searchStr+'%'));
	
	var result = db.select(sql,param);
	var list = [];
	
	for(var i in result.data){
		list.push({"tanto_kakari_cd":result.data[i].public_group_cd,"tanto_kakari":result.data[i].public_group_name,"biko":result.data[i].notes});
	}


	return list;	
}
