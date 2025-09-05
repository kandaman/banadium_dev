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
	Logger.getLogger().info('request '+ ImJson.toJSONString(request, true));    
	// 契約確認
	if (request.keiyaku_dorafuto_id) {
		var result = getKeiyakuDate(request.keiyaku_dorafuto_id);
		if (result.countRow > 0){
			$data = result.data[0];
			switch ($data.keiyaku_status){
				case Constant.LO_STATUS_ICHIJI_HOZON:
					if ($data.touroku_bi == $data.koushin_bi) {
						$message = MessageManager.getMessage('KE02I001');
					} else {
						$message = MessageManager.getMessage('KE02I002');
					}
					break;
				case Constant.LO_STATUS_KANRYO:
					$message = MessageManager.getMessage('KE02I003'); 
					break;
			}
			$bnsyo_link = "契約確認番号：";
			$bnsyo_link = $bnsyo_link + $data.keiyaku_dorafuto_id;
			$doc_type = Constant.LO_DOC_CLS_KEIYAKU;
		}
		return;
	}

	if (request.kikaku_id_with_kanshu_no_registered) {
		// 監修番号登録
		var result = getKikakuDate(request.kikaku_id_with_kanshu_no_registered);
		$data = result.data[0];
		if ($data.kanshu_no == null || $data.kanshu_no == ""){
			$message = MessageManager.getMessage('KK02I008'); 
		} else {
			$message = MessageManager.getMessage('KK02I007'); 
		}

		$bnsyo_link = "企画番号：";
		$bnsyo_link = $bnsyo_link + $data.kikaku_id;
		$doc_type = Constant.LO_DOC_CLS_KIKAKU;
	} else if (request.kikaku_id_with_shohyo_registered) {
		// 商標調査結果登録(代わり承認）
		var result = getKikakuDate(request.kikaku_id_with_shohyo_registered);
		$data = result.data[0];
		$message = MessageManager.getMessage('KK02I006');
		$bnsyo_link = "企画番号：";
		$bnsyo_link += $data.kikaku_id;
		$doc_type = Constant.LO_DOC_CLS_KIKAKU;
	} else if (request.bunsho_id_with_shohyo_registered) {
		// 商標調査結果登録
		var result = getKawariDate(request.bunsho_id_with_shohyo_registered);
		$data = result.data[0];
		$message = MessageManager.getMessage('KK02I006');
		$bnsyo_link = "文書番号：";
		$bnsyo_link += $data.bunsho_id;
		$doc_type = $data.bunsho_cls;
	}

	// ワークフローからのパラメータ取得
	var imwOrgParam = {};
	if ('imwCallOriginalParams' in request){
		imwOrgParam = ImJson.parseJSON(request.imwCallOriginalParams);	
		
		// 企画
		if ('kikaku_id' in imwOrgParam) {
			var result = getKikakuDate(imwOrgParam.kikaku_id);
			$data = result.data[0];
			switch ($data.kikaku_status){
				case Constant.LO_STATUS_TEISHUTSU:
					$message = MessageManager.getMessage('KK02I009');
					break;
				case Constant.LO_STATUS_SHUSEI_IRAI:
					$message = MessageManager.getMessage('KK02I010');
					break;
				case Constant.LO_STATUS_SHINSEI:
					$message = MessageManager.getMessage('KK02I011');
					break;
				case Constant.LO_STATUS_SASHIMODOSHI:
					$message = MessageManager.getMessage('KK02I012');
					break;
				case Constant.LO_STATUS_SHONIN:
				case Constant.LO_STATUS_SHONIN_OK:
					$message = MessageManager.getMessage('KK02I013');
					break;
				case Constant.LO_STATUS_JITAI:
					$message = MessageManager.getMessage('KK02I014');
					break;
				case Constant.LO_STATUS_HIKETSU:
					$message = MessageManager.getMessage('KK02I015');
					break;
				case Constant.LO_STATUS_KANRYO:
					$message = MessageManager.getMessage('KK02I016');
					break;
			}
			$bnsyo_link = "企画番号：";
			$bnsyo_link = $bnsyo_link + $data.kikaku_id;
			$doc_type = Constant.LO_DOC_CLS_KIKAKU;
		} else if ('kyodaku_id' in imwOrgParam) {
			// 許諾
			var result = getKyodakuDate(imwOrgParam.kyodaku_id);
			$data = result.data[0]; //一行だけ取得
			switch ($data.kyodaku_status){
				case Constant.LO_STATUS_TEISHUTSU:
					$message = MessageManager.getMessage('KY02I003');
					break;
				case Constant.LO_STATUS_SHUSEI_IRAI:
					$message = MessageManager.getMessage('KY02I004');
					break;
				case Constant.LO_STATUS_SHINSEI:
					$message = MessageManager.getMessage('KY02I005');
					break;
				case Constant.LO_STATUS_SASHIMODOSHI:
					$message = MessageManager.getMessage('KY02I006');
					break;
				case Constant.LO_STATUS_SHONIN:
				case Constant.LO_STATUS_SHONIN_OK:
					$message = MessageManager.getMessage('KY02I007');
					break;
				case Constant.LO_STATUS_JITAI:
					$message = MessageManager.getMessage('KY02I008');
					break;
				case Constant.LO_STATUS_HIKETSU:
					$message = MessageManager.getMessage('KY02I009');
					break;
				case Constant.LO_STATUS_KANRYO:
					$message = MessageManager.getMessage('KY02I010');
					break;
			}
			$bnsyo_link = "許諾番号：";
			$bnsyo_link = $bnsyo_link + $data.kyodaku_id;
			$doc_type = Constant.LO_DOC_CLS_KYODAKU;
		} else if ('bunsho_id' in imwOrgParam) {
			// 代わり承認
			var result = getKawariDate(imwOrgParam.bunsho_id);
			$data = result.data[0]; //一行だけ取得
			//Logger.getLogger().info(' [wf_check.js]　 $data.kawari_status:' + $data.kawari_status +";"+"imwOrgParam.kawari_status:"+imwOrgParam.kawari_status);
			
			switch ($data.kawari_status){
				case Constant.LO_STATUS_TEISHUTSU:
					$message = MessageManager.getMessage('KY02I003');
					break;
				case Constant.LO_STATUS_SHUSEI_IRAI:
					$message = MessageManager.getMessage('KY02I004');
					break;
				case Constant.LO_STATUS_SHINSEI:
					if(imwOrgParam.kawari_status == Constant.LO_STATUS_ICHIJI_HOZON
							|| imwOrgParam.kawari_status == Constant.LO_STATUS_TEISHUTSU
							|| imwOrgParam.kawari_status == Constant.LO_STATUS_SASHIMODOSHI){
						$message = MessageManager.getMessage('KY02I005');//起案					
					}else{
						$message = MessageManager.getMessage('KY02I007');//承認
					}					
					break;
				case Constant.LO_STATUS_SASHIMODOSHI:
					$message = MessageManager.getMessage('KY02I006');
					break;
				case Constant.LO_STATUS_SHONIN:
				case Constant.LO_STATUS_SHONIN_OK:
					$message = MessageManager.getMessage('KY02I007');
					break;				
				case Constant.LO_STATUS_KANRYO:
					$message = MessageManager.getMessage('KY02I010');
					break;
			}
			Logger.getLogger().info(' [wf_check.js]　 $message ' +$message);
			$bnsyo_link = "文書番号：";
			$bnsyo_link = $bnsyo_link + $data.bunsho_id;
			$doc_type = Constant.LO_DOC_CLS_KAWARI;
		} else if ('shinsei_id' in imwOrgParam) {
			//アカウント申請
			if(imwOrgParam.shinsei_id.substr(0,2)=="AS"){
				$doc_type = Constant.LO_DOC_CLS_ACCOUNT;
			}else{
				$doc_type = Constant.LO_DOC_CLS_ACCOUNT_SHANAI;
			}
			
				
			// 申請
			var result = getShinseiData($doc_type,imwOrgParam.shinsei_id);
			$data = result.data[0]; //一行だけ取得
			Logger.getLogger().info(' [wf_check.js]　 $data.shinsei_status:' + $data.shinsei_status +";"+"imwOrgParam.shinsei_status:"+imwOrgParam.shinsei_status);
			
			switch ($data.shinsei_status){
				case Constant.LO_STATUS_TEISHUTSU:
					$message = MessageManager.getMessage('KY02I003');//申請
					break;
				case Constant.LO_STATUS_SHUSEI_IRAI:
					$message = MessageManager.getMessage('KY02I004');//修正依頼
					break;
				case Constant.LO_STATUS_SHINSEI:
					if(imwOrgParam.shinsei_status == Constant.LO_STATUS_ICHIJI_HOZON
							|| imwOrgParam.shinsei_status == Constant.LO_STATUS_TEISHUTSU
							|| imwOrgParam.shinsei_status == Constant.LO_STATUS_SASHIMODOSHI
							|| imwOrgParam.shinsei_status == undefined){
						$message = MessageManager.getMessage('KY02I005');//起案					
					}else{
						$message = MessageManager.getMessage('KY02I007');//承認
					}					
					break;
				case Constant.LO_STATUS_SASHIMODOSHI:
					$message = MessageManager.getMessage('KY02I006');//差戻
					break;
				case Constant.LO_STATUS_SHONIN:
				case Constant.LO_STATUS_SHONIN_OK:
					$message = MessageManager.getMessage('KY02I007');//承認
					break;				
				case Constant.LO_STATUS_KANRYO:
					$message = MessageManager.getMessage('KY02I010');
					break;
			}
			Logger.getLogger().info(' [wf_check.js]　 $message ' +$message);
			$bnsyo_link = "申請番号：";
			$bnsyo_link = $bnsyo_link + $data.shinsei_id;
			
		}
	}
	
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
