Constant.load("lo/common_libs/lo_const");
var $message = "";
var $bnsyo_link = "";
var $data = "";
var $doc_type = "1";  // データ種別

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	$message = "メール送信が完了しました。"; 
	$bnsyo_link = "";	
}

/**
 * 企画情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuDate(kikakuId) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT *" ;
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 

	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    return result;
}

/**
 * 許諾情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKyodakuDate(kyodakuId) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT *" ;
	sql += " FROM lo_t_kyodaku as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kyodaku_id =? " ; 
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kyodakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
	
	return result;
}

/**
 * 契約情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKeiyakuDate(keiyaku_dorafuto_id) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT *" ;
	sql += " FROM lo_t_keiyaku_dorafuto as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.keiyaku_dorafuto_id =? " ; 
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(keiyaku_dorafuto_id));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
	
	return result;
}

/**
 * 代わり承認情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKawariDate(bunsho_id) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT *" ;
	sql += " FROM lo_t_kawari as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.bunsho_id =? " ; 
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(bunsho_id));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
	
	return result;
}

/**
 * アカウント申請情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getShinseiData(type,id) {
	
	var sql = "" ;
	
	switch(type){
	case "7":
	case "8":
		//todo 必要に応じて加工をする
		sql += " SELECT *" ;
		sql += " FROM lo_t_account_shinsei as k " ; 
		sql += " WHERE k.sakujo_flg ='0' " ; 
		sql += "   AND k.shinsei_id =? " ; 
		break;
	default:
		break;
	}
		
		
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(id));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
	
	return result;
}
