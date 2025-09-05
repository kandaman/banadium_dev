Constant.load("lo/common_libs/lo_const");
var $production_flg = false;
//イベント情報
var $event_data = {
	kikaku_id:"",
	kikaku_edaban: "",
	koushin_bi: ""	// 企画情報の排他制御用
}; 
// コンボボックス
var $kembai_umu = [];
var $shinki_goods_seizo = [];
var $kakioroshi = [];
var $novelty = [];
var $seiyu_kado = [];
var $eizo_shiyo_kibo = [];
var $gakkyoku_shiyo_kibo = [];
var $shoninList = [];
var $fileList = []; // 完成イメージ
var $validationErrorMessages = [];
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト

var $kikaku_status = ""; //企画ステータス情報

var $shanaiShuseiFlg = false; // 社内修正フラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE) ? false : true;
		
	// 初期表示項目取得
	getDispData();
	
	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	// 企画データ取得
	var kikakuData = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKikakuData", request.kikaku_id);
	
	// 削除チェック（親企画）
	Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", kikakuData);
	
	// 編集可能チェック
	if(!chkEditable(kikakuData)){
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}
	
	// 企画ステータス取得
	$kikaku_status = kikakuData.kikaku_status;

	// 編集
	// パラメータに企画ID,枝番がある場合、楽曲情報取得
	if ('kikaku_id' in request && 'kikaku_edaban' in request){
		var result = getEventDate(request.kikaku_id,request.kikaku_edaban);
		
		if (result.countRow > 0){
			$event_data = result.data[0]; //一行だけ取得
			
			// 削除チェック
			Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $event_data);
			
			var fileResult = getFileData($event_data.kikaku_id, $event_data.kikaku_edaban);
			Logger.getLogger().info(' [init]　fileResult ' + ImJson.toJSONString(fileResult, true));
			$fileList = fileResult.data;
			
		}
	}else{
		// ライセンシー以外は表示させない
		if ($production_flg) {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		// 新規
		$event_data.kikaku_id = request.kikaku_id;
		//DBから枝番最大値+1を取得
		$event_data.kikaku_edaban = "" + getEdaban(request.kikaku_id);
	}
	
	// 企画情報の更新日は排他制御に使用する
	$event_data.koushin_bi = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKoushinBi", $event_data.kikaku_id).toString();
}

/**
 * 社内修正であるかチェック
 */
function chkShanaiShusei(kikakuStatus) {
	// BNE担当グループに所属しているかを確認
	var bneTantoShozokuFlg = Content.executeFunction( "lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_APPR_0);
	if (bneTantoShozokuFlg) {
		if (kikakuStatus == Constant.LO_STATUS_TEISHUTSU || kikakuStatus == Constant.LO_STATUS_SASHIMODOSHI) {
			// 提出済　または　差戻し
			return true;
		}
	}
	return false;
}

/**
 * 編集可能かチェック
 */
function chkEditable(data) {
	
	// ステータスチェック（編集可能なステータスかどうか）
	if ($production_flg) {
		// プロダクション
		var uketsukeFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_APPR_0);
		if (!uketsukeFlg || (data.kikaku_status != Constant.LO_STATUS_TEISHUTSU && data.kikaku_status != Constant.LO_STATUS_SASHIMODOSHI)) {
			// 受付担当で、受付中か差戻のみOK
			return false;
		} else {
			$shanaiShuseiFlg = true;
			// TODO BNE担当者がノード処理対象者か判定する必要があれば
		}
	} else {
		// ライセンシー
		if (data.kikaku_status != Constant.LO_STATUS_ICHIJI_HOZON && data.kikaku_status != Constant.LO_STATUS_SHUSEI_IRAI) {
			// 一時保存か修正依頼のみOK
			return false;
		}
	}
	
	// 会社チェック（編集可能な所属グループかどうか）
	if (!$production_flg) {
		// ライセンシー
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (data.kaisha_id != kaisha_id) {
			return false;
		}
	}
	
	return true;
}

/**
 * 画面表示項目取得
 */
function getDispData() {

	$kembai_umu = [];
	$kembai_umu.push({label:"",value:""});
	$kembai_umu = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $kembai_umu, Constant.LO_CDCLS_KEMBAI_UMU);
	
	$shinki_goods_seizo = [];
	$shinki_goods_seizo.push({label:"",value:""});
	$shinki_goods_seizo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shinki_goods_seizo, Constant.LO_CDCLS_SHINKI_GOODS_SEIZO);

	$kakioroshi = [];
	$kakioroshi.push({label:"",value:""});
	$kakioroshi = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $kakioroshi, Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU);

	$novelty = [];
	$novelty.push({label:"",value:""});
	$novelty = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $novelty, Constant.LO_CDCLS_NOVELTY);

	$seiyu_kado = [];
	$seiyu_kado.push({label:"",value:""});
	$seiyu_kado = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $seiyu_kado, Constant.LO_CDCLS_SEIYU_KADO);
	
	$eizo_shiyo_kibo = [];
	$eizo_shiyo_kibo.push({label:"",value:""});
	$eizo_shiyo_kibo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $eizo_shiyo_kibo, Constant.LO_CDCLS_EIZO_SHIYO_KIBO);

	$gakkyoku_shiyo_kibo = [];
	$gakkyoku_shiyo_kibo.push({label:"",value:""});
	$gakkyoku_shiyo_kibo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $gakkyoku_shiyo_kibo, Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO);

	$shoninList = [];
	$shoninList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoninList, Constant.LO_CDCLS_OK_NG);
	
	//添付ファイルメッセージ及び拡張子リスト取得
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_SHOHINSHIYO_EXT);
    $extstr = "";
    for ( var i = 0; i < $extList.length; i++) {
    	if ($extstr == "") {
    		$extstr = $extList[i];
    	} else {
    		$extstr = $extstr + "/" + $extList[i];
    	}
    }
    $extListstr = $extstr.replace(/\./g, "");
    $extstr = MessageManager.getMessage('KK05I003', $extstr);
    
}

/**
 * イベント情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getEventDate(kikakuId,edaban) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT " ;
	sql += "   e.*  " ; 
	sql += " FROM lo_t_kikaku_event e " ; 
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ; 
	sql += "   AND e.kikaku_edaban = ? " ; 

	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.number(Number(edaban)));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
   
}

/**
 * イベント情報登録
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function create(formParams) {

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		kikaku_id : "",
		kikaku_edaban : ""
	};


	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
				
		var kikaku_id = formParams.kikaku_id;
		var kikaku_edaban = formParams.kikaku_edaban;
		
		// ステータス取得
		var status = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKikakuStatus", kikaku_id);

		//画面の入力値をDB用オブジェクトに格納
		var dataSet = setDataOj(formParams, status);
		var fileDataSet = setFileObjs(formParams);
		
		var result = checkEdaban(kikaku_id, kikaku_edaban);

		// 枝番がなければ新規登録
		if(result.countRow == 0){
			ret.msg = MessageManager.getMessage('KK05E018');
			ret.altmsg = MessageManager.getMessage('KK05I001');
			
			//DBから枝番最大値+1を取得
			kikaku_edaban = "" + getEdaban(kikaku_id);
			
			//検索キーと登録者も設定
			dataSet.kikaku_id = kikaku_id;
			dataSet.kikaku_edaban = chgNum(kikaku_edaban);
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, true);
			
			// insert
			var result = db.insert('lo_t_kikaku_event', dataSet);
			
		}else{
			ret.msg = MessageManager.getMessage('KK05E019');
			ret.altmsg = MessageManager.getMessage('KK05I002');

			// 社内修正だった場合は自動的にコメントを出力する
			if (chkShanaiShusei(status)) {
				var resultInsertComment = insertSabunComment(dataSet, result.data[0]);
				if (resultInsertComment.error) {
					ret.error = true;
					ret.altmsg = "";
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
			}

			//検索条件設定
			var whereObject = [DbParameter.string(kikaku_id),DbParameter.number(Number(kikaku_edaban))];
			// update
			result = db.update('lo_t_kikaku_event', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
		
		}
		
		if (result.error) {
			ret.error = true;
			ret.altmsg = "";
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		ret.msg = "";
		
		if ([Constant.LO_STATUS_ICHIJI_HOZON, Constant.LO_STATUS_SHUSEI_IRAI].indexOf(status) >= 0) {
			db.remove('lo_t_kikaku_shohin_file', 'kikaku_id = ? and kikaku_edaban = ?', [DbParameter.string(kikaku_id),DbParameter.number(Number(kikaku_edaban))]);
			for (var idx = 0; idx < fileDataSet.length; idx++) {
				var fileData = fileDataSet[idx];
				var fileName = fileData.file_path.split("/").reverse()[0];
				fileData.kikaku_id = dataSet.kikaku_id ? dataSet.kikaku_id : kikaku_id;
				fileData.kikaku_edaban = Number(dataSet.kikaku_edaban ? dataSet.kikaku_edaban : kikaku_edaban);
				fileData.file_path = fileData.kikaku_id + "/img/" + fileName;
				fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true, dataSet.koushin_bi);
				Logger.getLogger().info(' [create]　fileData ' + ImJson.toJSONString(fileData, true));
				db.insert('lo_t_kikaku_shohin_file', fileData);
				
				var sessionFile = Constant.LO_PATH_SESSION_STORAGE + fileName;
				var sessionStorage = new SessionScopeStorage(sessionFile);
	
				// セッションストレージにファイルが無ければエラー
				if (sessionStorage.isFile()) {
					// パブリックストレージ取得
					var dir = Constant.LO_PATH_PUBLIC_STORAGE;
					var subDir = fileData.kikaku_id + "/img/";
					var publicDir = new PublicStorage(dir + subDir);
					if (!publicDir.isDirectory()) {
						// ディレクトリが存在しなければ作成
						publicDir.makeDirectories();
					}
	
					// パブリックストレージにコピー
					var publicStrageFile = dir + fileData.file_path;
					var publicStorage = new PublicStorage(publicStrageFile);
					sessionStorage.copy(publicStorage, true);
				}
			}
		}
		
		// 戻り値に企画id 枝番セット
		ret.kikaku_id = kikaku_id;
		ret.kikaku_edaban = kikaku_edaban;

		// 排他制御のため、企画本体の更新日時も設定する
		if (!updateKikakuTimestamp(formParams.kikaku_id, formParams.koushin_bi)) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
		}	
	});
	
	// セッション登録
	Client.set('kikaku_edit_id',ret.kikaku_id);
	
	return ret;
}



// DB設定用にフォームの入力内容をオブジェクトに格納
function setDataOj(formParams, status){
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;

	//画面の入力値をDB用オブジェクトに格納
	var dataSet = {};
	if ([Constant.LO_STATUS_TEISHUTSU, Constant.LO_STATUS_SASHIMODOSHI].indexOf(status) >= 0) {
		// 受付中（ライセンスプロダクション入力欄登録）
		// 差戻（ライセンスプロダクション入力欄登録）
		dataSet = {
			event_category  : chgNum(formParams.event_category), 
			event_campaign_nm  : formParams.event_campaign_nm, 
			zeinuki_jodai  : chgNum(formParams.zeinuki_jodai), 
			mokuhyo_hambai_su  : chgNum(formParams.mokuhyo_hambai_su), 
			shokai_seisanyotei_su  : chgNum(formParams.shokai_seisanyotei_su), 
			event_kaishi_jiki  : formParams.event_kaishi_jiki, 
			event_shuryo_jiki  : formParams.event_shuryo_jiki, 
			syosyutu_jiki  : formParams.syosyutu_jiki, 
			kembai_umu  : formParams.kembai_umu, 
			kembai_kaishi_jiki  : (formParams.kembai_umu == '2')?null:formParams.kembai_kaishi_jiki,
			ticket_kakaku  : (formParams.kembai_umu == '2')?0:chgNum(formParams.ticket_kakaku),
			kaisaibasho_jisshitempo  : formParams.kaisaibasho_jisshitempo, 
			senden_hansoku  : formParams.senden_hansoku, 
			shinki_goods_seizo  : formParams.shinki_goods_seizo, 
			kakioroshi  : formParams.kakioroshi, 
			novelty  : formParams.novelty, 
			seiyu_kado  : formParams.seiyu_kado, 
			seiyu_kado_syosai  : (formParams.seiyu_kado == '2')?null:formParams.seiyu_kado_syosai,
			eizo_shiyo_kibo  : formParams.eizo_shiyo_kibo, 
			eizo_shiyo_sozai  : (formParams.eizo_shiyo_kibo == '2')?null:formParams.eizo_shiyo_sozai,
			gakkyoku_shiyo_kibo  : formParams.gakkyoku_shiyo_kibo, 
			gakkyoku_shiyo_sozai  : (formParams.gakkyoku_shiyo_kibo == '2')?null:formParams.gakkyoku_shiyo_sozai,
			senden_hansoku_kibo  : formParams.senden_hansoku_kibo, 
			shiyoryo_kikan_gokei : formParams.shiyoryo_kikan_gokei ? chgNum(formParams.shiyoryo_kikan_gokei) : null,
			sozaihi : formParams.sozaihi ? chgNum(formParams.sozaihi) : null,
			event_gaiyo  : formParams.event_gaiyo, 
			event_image  : '',
			bikou  : formParams.bikou,
			riyu_joken  : formParams.riyu_joken,
			ok_ng  : formParams.ok_ng,
			royalty_kingaku : chgNum(formParams.royalty_kingaku)
		};
	} else {
		// 通常登録
		dataSet = {
			event_category  : chgNum(formParams.event_category), 
			event_campaign_nm  : formParams.event_campaign_nm, 
			zeinuki_jodai  : chgNum(formParams.zeinuki_jodai), 
			mokuhyo_hambai_su  : chgNum(formParams.mokuhyo_hambai_su), 
			shokai_seisanyotei_su  : chgNum(formParams.shokai_seisanyotei_su), 
			event_kaishi_jiki  : formParams.event_kaishi_jiki, 
			event_shuryo_jiki  : formParams.event_shuryo_jiki, 
			syosyutu_jiki  : formParams.syosyutu_jiki, 
			kembai_umu  : formParams.kembai_umu, 
			kembai_kaishi_jiki  : (formParams.kembai_umu == '2')?null:formParams.kembai_kaishi_jiki,
			ticket_kakaku  : (formParams.kembai_umu == '2')?0:chgNum(formParams.ticket_kakaku),
			kaisaibasho_jisshitempo  : formParams.kaisaibasho_jisshitempo, 
			senden_hansoku  : formParams.senden_hansoku, 
			shinki_goods_seizo  : formParams.shinki_goods_seizo, 
			kakioroshi  : formParams.kakioroshi, 
			novelty  : formParams.novelty, 
			seiyu_kado  : formParams.seiyu_kado, 
			seiyu_kado_syosai  : (formParams.seiyu_kado == '2')?null:formParams.seiyu_kado_syosai,
			eizo_shiyo_kibo  : formParams.eizo_shiyo_kibo, 
			eizo_shiyo_sozai  : (formParams.eizo_shiyo_kibo == '2')?null:formParams.eizo_shiyo_sozai,
			gakkyoku_shiyo_kibo  : formParams.gakkyoku_shiyo_kibo, 
			gakkyoku_shiyo_sozai  : (formParams.gakkyoku_shiyo_kibo == '2')?null:formParams.gakkyoku_shiyo_sozai,
			senden_hansoku_kibo  : formParams.senden_hansoku_kibo, 
			shiyoryo_kikan_gokei : formParams.shiyoryo_kikan_gokei ? chgNum(formParams.shiyoryo_kikan_gokei) : null,
			sozaihi : formParams.sozaihi ? chgNum(formParams.sozaihi) : null,
			event_gaiyo  : formParams.event_gaiyo, 
			event_image  : '',
			bikou  : formParams.bikou,
			ok_ng  : formParams.ok_ng
		};
	}

	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	return dataSet;
}

// 枝番取得
function getEdaban(kikaku_id){
    // sql実行
    var db = new TenantDatabase();
    var sql = "select COALESCE(max(kikaku_edaban),0)+1 as edaban from lo_t_kikaku_event where kikaku_id = ? and sakujo_flg = '0'";
    var result = db.select(sql,[DbParameter.string(kikaku_id)]);

	return result.data[0].edaban;
}

// DB有無確認
function checkEdaban(kikaku_id, kikaku_edaban){
	// 入力パラメータ
    var strParam=[];
	strParam.push(DbParameter.string(kikaku_id));
	strParam.push(DbParameter.number(Number(kikaku_edaban)));
	
    // sql実行
    var db = new TenantDatabase();
    var sql = "select * from lo_t_kikaku_event where kikaku_id = ? AND kikaku_edaban =? ";
    var result = db.select(sql, strParam);

	return result;
}

// 1ならそのまま,それ以外なら0を返す
function chkVal(val){
	return (val=="1")?"1":"0";
}
// 数値型に変換
function chgNum(val){
	if (isNaN(val)){
		return null;
	}else{
		return Number(val);
	}
}

/**
 * 企画情報(楽曲)完成イメージ検索
 * @param {string} 企画ID
 * @param {number} 企画枝番
 * @returns {object} 検索結果
 */
function getFileData(kikakuId,edaban) {
	var sql = "" ;
	
	sql += " SELECT " ;
	sql += "  ksf.file_name " ; 
	sql += "  , ksf.file_path " ; 
	sql += "  , ksf.comment " ; 
	sql += " FROM lo_t_kikaku_shohin_file ksf " ; 
	sql += " WHERE ksf.sakujo_flg ='0' " ; 
	sql += "   AND ksf.kikaku_id =? " ; 
	sql += "   AND ksf.kikaku_edaban =? " ; 
	sql += " ORDER By ksf.file_no " ; 

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.number(Number(edaban)));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
}

// DB設定用にフォームの入力内容をオブジェクトに格納
function setFileObjs(formParams){
	
	var fileObjs = [];
	if (formParams.item_upFile_name === undefined) {
		return fileObjs;
	}
	
	if (isArray(formParams.item_upFile_name)) {
		for (var idx = 0; idx < formParams.item_upFile_name.length; idx++) {
			var fileObj = {
			    file_no: (idx + 1)
				, file_name: formParams.item_upFile_name[idx]
				, file_path: formParams.item_upFile_resname[idx]
				//, comment: formParams.comment[idx]
			};
			fileObjs.push(fileObj);
		}
	} else {
		var fileObj = {
		    file_no: 1
			, file_name: formParams.item_upFile_name
			, file_path: formParams.item_upFile_resname
			//, comment: formParams.comment
		};
		fileObjs.push(fileObj);
	}
	return fileObjs;
}

/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KK05E";
	var message_last_num = 40;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}

/**
 * 企画情報の排他制御用に、更新日のみ設定する(商品仕様情報更新時)
 */
function updateKikakuTimestamp(kikakuId, koushinBi){
	var db = new TenantDatabase();
	var dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", {}, false);
	var whereObject = [DbParameter.string(kikakuId), DbParameter.string(koushinBi)];
	var result = db.update('lo_t_kikaku', dataSet, "kikaku_id = ? and to_char(koushin_bi, 'YYYYMMDDHH24MISSMS') = ?", whereObject);
	return !result.error && result.countRow == 1;
}

/**
 * コメント用テキストを取得する
 */
function getCommentText(attachVal, columVal){
	var lineBreakChar = "\r\n";
	if (columVal == null) {
		return attachVal + lineBreakChar;
	}
	return attachVal + columVal + lineBreakChar;
}

/**
 * Nullを空文字に変える
 */
function changeNullToEmptyStrring(val) {
	if (val == null) {
		return "";
	}
	return val;
}

/**
 * Nullを0に変える
 */
function changeNullToZero(val) {
	if (val == null) {
		return 0;
	}
	return val;
}

/**
 * 社内修正コメントを登録する
 */
function insertSabunComment(inputData, recordData) {
	var kembaiUmuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_KEMBAI_UMU);
	var shinkiGoodsSeizoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_SHINKI_GOODS_SEIZO);
	var kakioroshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU);
	var noveltyList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_NOVELTY);
	var seiyuKadoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_SEIYU_KADO);
	var eizoShiyoKiboList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_EIZO_SHIYO_KIBO);
	var gakkyokuShiyoKiboList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO);

	var shuseiKomokuChar = "修正項目：";
	var shuseiMaeChar = "[ 修正前 ]：\r\n";
	var shuseiGoChar =  "[ 修正後 ]：\r\n";
	var lineBreakChar = "\r\n";
	var autoSabunCommentList = [];
	var tempComment = "";

	// 戻り値
	var ret = {
		error : false,
		message : ""
	};

	// イベント・キャンペーン名
	if(inputData.event_campaign_nm != recordData.event_campaign_nm) {
		tempComment = tempComment + shuseiKomokuChar + "イベント・キャンペーン名" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.event_campaign_nm);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.event_campaign_nm);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// イベント開始時期
	if(inputData.event_kaishi_jiki != recordData.event_kaishi_jiki) {
		tempComment = tempComment + shuseiKomokuChar + "イベント開始時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.event_kaishi_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.event_kaishi_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// イベント終了時期
	if(inputData.event_shuryo_jiki != recordData.event_shuryo_jiki) {
		tempComment = tempComment + shuseiKomokuChar + "イベント終了時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.event_shuryo_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.event_shuryo_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 情報初出時期
	if(inputData.syosyutu_jiki != recordData.syosyutu_jiki) {
		tempComment = tempComment + shuseiKomokuChar + "情報初出時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.syosyutu_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.syosyutu_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 券売有無
	if(inputData.kembai_umu != recordData.kembai_umu) {
		tempComment = tempComment + shuseiKomokuChar + "券売有無" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < kembaiUmuList.length; idx++) {
			if (kembaiUmuList[idx].value == recordData.kembai_umu) {
				tempComment = tempComment + shuseiMaeChar + kembaiUmuList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < kembaiUmuList.length; idx++) {
			if (kembaiUmuList[idx].value == inputData.kembai_umu) {
				tempComment = tempComment + shuseiGoChar + kembaiUmuList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 券売開始時期
	if(changeNullToEmptyStrring(inputData.kembai_kaishi_jiki) != changeNullToEmptyStrring(recordData.kembai_kaishi_jiki)) {
		tempComment = tempComment + shuseiKomokuChar + "券売開始時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.kembai_kaishi_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.kembai_kaishi_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// チケット価格
	if(changeNullToZero(inputData.ticket_kakaku) != changeNullToZero(recordData.ticket_kakaku)) {
		tempComment = tempComment + shuseiKomokuChar + "チケット価格" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.ticket_kakaku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.ticket_kakaku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 開催場所・実施店舗（店舗数）
	if(inputData.kaisaibasho_jisshitempo != recordData.kaisaibasho_jisshitempo) {
		tempComment = tempComment + shuseiKomokuChar + "開催場所・実施店舗（店舗数）" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.kaisaibasho_jisshitempo);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.kaisaibasho_jisshitempo);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 海外を含む場合は対象国・地域を記載
	if(inputData.senden_hansoku != recordData.senden_hansoku) {
		tempComment = tempComment + shuseiKomokuChar + "海外を含む場合は対象国・地域を記載" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.senden_hansoku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.senden_hansoku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 新規グッズ製造
	if(inputData.shinki_goods_seizo != recordData.shinki_goods_seizo) {
		tempComment = tempComment + shuseiKomokuChar + "新規グッズ製造" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < shinkiGoodsSeizoList.length; idx++) {
			if (shinkiGoodsSeizoList[idx].value == recordData.shinki_goods_seizo) {
				tempComment = tempComment + shuseiMaeChar + shinkiGoodsSeizoList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < shinkiGoodsSeizoList.length; idx++) {
			if (shinkiGoodsSeizoList[idx].value == inputData.shinki_goods_seizo) {
				tempComment = tempComment + shuseiGoChar + shinkiGoodsSeizoList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 描き下ろし希望有無
	if(inputData.kakioroshi != recordData.kakioroshi) {
		tempComment = tempComment + shuseiKomokuChar + "描き下ろし希望有無" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < kakioroshiList.length; idx++) {
			if (kakioroshiList[idx].value == recordData.kakioroshi) {
				tempComment = tempComment + shuseiMaeChar + kakioroshiList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < kakioroshiList.length; idx++) {
			if (kakioroshiList[idx].value == inputData.kakioroshi) {
				tempComment = tempComment + shuseiGoChar + kakioroshiList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// ノベルティ
	if(inputData.novelty != recordData.novelty) {
		tempComment = tempComment + shuseiKomokuChar + "ノベルティ" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < noveltyList.length; idx++) {
			if (noveltyList[idx].value == recordData.novelty) {
				tempComment = tempComment + shuseiMaeChar + noveltyList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < noveltyList.length; idx++) {
			if (noveltyList[idx].value == inputData.novelty) {
				tempComment = tempComment + shuseiGoChar + noveltyList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 声優稼働
	if(inputData.seiyu_kado != recordData.seiyu_kado) {
		tempComment = tempComment + shuseiKomokuChar + "声優稼働" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < seiyuKadoList.length; idx++) {
			if (seiyuKadoList[idx].value == recordData.seiyu_kado) {
				tempComment = tempComment + shuseiMaeChar + seiyuKadoList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < seiyuKadoList.length; idx++) {
			if (seiyuKadoList[idx].value == inputData.seiyu_kado) {
				tempComment = tempComment + shuseiGoChar + seiyuKadoList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 声優稼働詳細
	if(changeNullToEmptyStrring(inputData.seiyu_kado_syosai) != changeNullToEmptyStrring(recordData.seiyu_kado_syosai)) {
		tempComment = tempComment + shuseiKomokuChar + "声優稼働詳細" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.seiyu_kado_syosai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.seiyu_kado_syosai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 映像使用希望
	if(inputData.eizo_shiyo_kibo != recordData.eizo_shiyo_kibo) {
		tempComment = tempComment + shuseiKomokuChar + "映像使用希望" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < eizoShiyoKiboList.length; idx++) {
			if (eizoShiyoKiboList[idx].value == recordData.eizo_shiyo_kibo) {
				tempComment = tempComment + shuseiMaeChar + eizoShiyoKiboList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < eizoShiyoKiboList.length; idx++) {
			if (eizoShiyoKiboList[idx].value == inputData.eizo_shiyo_kibo) {
				tempComment = tempComment + shuseiGoChar + eizoShiyoKiboList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 映像使用想定素材
	if(changeNullToEmptyStrring(inputData.eizo_shiyo_sozai) != changeNullToEmptyStrring(recordData.eizo_shiyo_sozai)) {
		tempComment = tempComment + shuseiKomokuChar + "映像使用想定素材" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.eizo_shiyo_sozai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.eizo_shiyo_sozai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 楽曲使用希望
	if(inputData.gakkyoku_shiyo_kibo != recordData.gakkyoku_shiyo_kibo) {
		tempComment = tempComment + shuseiKomokuChar + "楽曲使用希望" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < gakkyokuShiyoKiboList.length; idx++) {
			if (gakkyokuShiyoKiboList[idx].value == recordData.gakkyoku_shiyo_kibo) {
				tempComment = tempComment + shuseiMaeChar + gakkyokuShiyoKiboList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < gakkyokuShiyoKiboList.length; idx++) {
			if (gakkyokuShiyoKiboList[idx].value == inputData.gakkyoku_shiyo_kibo) {
				tempComment = tempComment + shuseiGoChar + gakkyokuShiyoKiboList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 楽曲使用想定素材
	if(changeNullToEmptyStrring(inputData.gakkyoku_shiyo_sozai) != changeNullToEmptyStrring(recordData.gakkyoku_shiyo_sozai)) {
		tempComment = tempComment + shuseiKomokuChar + "楽曲使用想定素材" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.gakkyoku_shiyo_sozai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.gakkyoku_shiyo_sozai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 宣伝販促規模
	if(inputData.senden_hansoku_kibo != recordData.senden_hansoku_kibo) {
		tempComment = tempComment + shuseiKomokuChar + "宣伝販促規模" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.senden_hansoku_kibo);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.senden_hansoku_kibo);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 使用料（期間合計）
	if(inputData.shiyoryo_kikan_gokei != recordData.shiyoryo_kikan_gokei) {
		tempComment = tempComment + shuseiKomokuChar + "使用料（期間合計）" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.shiyoryo_kikan_gokei);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.shiyoryo_kikan_gokei);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 素材費
	if(inputData.sozaihi != recordData.sozaihi) {
		tempComment = tempComment + shuseiKomokuChar + "素材費" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.sozaihi);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.sozaihi);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// イベント概要
	if(inputData.event_gaiyo != recordData.event_gaiyo) {
		tempComment = tempComment + shuseiKomokuChar + "イベント概要" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.event_gaiyo);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.event_gaiyo);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 備考
	if(inputData.bikou != recordData.bikou) {
		tempComment = tempComment + shuseiKomokuChar + "備考" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.bikou);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.bikou);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}

	if (autoSabunCommentList.length > 0) {
		var autoSabunComment = "";
		autoSabunComment = "【ライセンスプロダクション修正箇所】 #" + recordData.kikaku_edaban + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < autoSabunCommentList.length; idx++) {
			autoSabunComment = autoSabunComment + autoSabunCommentList[idx];
		}
		autoSabunComment = autoSabunComment;
		var resultComment = Content.executeFunction("lo/common_libs/lo_common_fnction", "insertComment", recordData.kikaku_id, autoSabunComment, Constant.LO_COMMENT_STATUS, [], null, null, null, Constant.LO_NAME_NODE_APPR_0, "社内修正");
		if (resultComment.error) {
			ret.error = resultComment.error;
			ret.message = resultComment.message;
			return ret;
		}
	}

	return ret;
}