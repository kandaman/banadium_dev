Constant.load("lo/common_libs/lo_const");
var $production_flg = false;
var $categoryList = []; //カテゴリーコンボボックス
var $chiikiList = []; //地域コンボボックス
var $shoshiList = []; //証紙コンボボックス
var $tradingList = []; //トレーディングコンボボックス
var $kakioroshiList = []; //描き下ろしコンボボックス
var $asobistoreList = []; //アソビストアコンボボックス
var $shoninList = []; //承認コンボボックス
var $localizeShohinUmuList = []; // ローカライズ商品名の有無コンボボックス
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト

var $item_data = {}; //商品情報
var $fileList = []; // 完成イメージ
//企画情報
var $kikaku_data = {
	kikaku_id:"",
	kikaku_edaban: "",
	koushin_bi: ""	// 企画情報の排他制御用
}; 
var $chkbox_chk = {};//チェックボックスボタンの初期値チェック
var $kikaku_status = ""; //企画ステータス情報
var $category_nm = "";
var $validationErrorMessages = [];

var $shanaiShuseiFlg = false; // 社内修正フラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　request ' + ImJson.toJSONString(request, true));

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
	// パラメータに企画ID,枝番がある場合、商品情報取得
	if ('kikaku_id' in request && 'kikaku_edaban' in request) {
		var result = getShohinDate(request.kikaku_id, request.kikaku_edaban);
		
		$kikaku_data.kikaku_id = request.kikaku_id;
		$kikaku_data.kikaku_edaban = request.kikaku_edaban;
		
		if (result.countRow > 0){
			$item_data = result.data[0]; //一行だけ取得
			
			// 削除チェック
			Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $item_data);
			
			var fileResult = getFileData($item_data.kikaku_id, $item_data.kikaku_edaban);
			Logger.getLogger().info(' [init]　fileResult ' + ImJson.toJSONString(fileResult, true));
			$fileList = fileResult.data;

			// カテゴリーの初期値設定
			$categoryList = Content.executeFunction("lo/common_libs/lo_common_fnction", 
				"selectedList",$categoryList,$item_data.shohin_category);

			$category_nm = $categoryList[$item_data.shohin_category].label;
			

			//チェックボックスの初期値設定
			$chkbox_chk = checkedBox($item_data);		
		}
	} else {
		// ライセンシー以外は表示させない
		if ($production_flg) {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
			
		$kikaku_data.kikaku_id = request.kikaku_id;
		
		//DBから枝番最大値+1を取得
		$kikaku_data.kikaku_edaban = "" + getEdaban(request.kikaku_id);
	}
	
	// 企画情報の更新日は排他制御に使用する
	$kikaku_data.koushin_bi = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKoushinBi", $kikaku_data.kikaku_id).toString();
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

	// カテゴリー取得
    $categoryList = [];
    $categoryList.push({label:"",value:""});
    $categoryList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $categoryList, Constant.LO_CDCLS_SHOHIN_CATEGORY);
    
    $chiikiList = [];
    $chiikiList.push({label:"",value:""});
    $chiikiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $chiikiList, Constant.LO_CDCLS_CHIIKI);
    
    $shoshiList = [];
    $shoshiList.push({label:"",value:""});
    $shoshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoshiList, Constant.LO_CDCLS_SHOSHI);
    
    $tradingList = [];
    $tradingList.push({label:"",value:""});
    $tradingList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $tradingList, Constant.LO_CDCLS_TRADING);
    
    $kakioroshiList = [];
    $kakioroshiList.push({label:"",value:""});
    $kakioroshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $kakioroshiList, Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU);
    
    $asobistoreList = [];
    $asobistoreList.push({label:"",value:""});
    $asobistoreList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $asobistoreList, Constant.LO_CDCLS_ASOBISTORE);
    
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
    $extstr = MessageManager.getMessage('KK03I003', $extstr);
    
    $localizeShohinUmuList = [];
    $localizeShohinUmuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $localizeShohinUmuList, Constant.LO_CDCLS_LOCALIZE_SHOHIN_UMU);
}

/**
 * 企画情報(商品)検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getShohinDate(kikakuId,edaban) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT " ;
	sql += "  g.* " ;
	sql += " FROM lo_t_kikaku_shohin g " ; 
	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.kikaku_id =? " ; 
	sql += "   AND g.kikaku_edaban =? " ; 

	
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
 * 企画情報(商品)完成イメージ検索
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
	
/**
* 商品情報登録
* @param {object} 検索条件
* @returns {object} 検索結果
*/

function create(formParams) {
	Logger.getLogger().info(' [create]　formParams ' + ImJson.toJSONString(formParams, true));
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
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
		Logger.getLogger().info(' [create]　fileDataSet ' + ImJson.toJSONString(fileDataSet, true));

		var result = checkEdaban(kikaku_id, kikaku_edaban);
		// 枝番がなければ新規登録
		if(result.countRow == 0){
			ret.msg = MessageManager.getMessage('KK03E032');
			ret.altmsg = MessageManager.getMessage('KK03I001');
			
			//DBから枝番最大値+1を取得
			kikaku_edaban = "" + getEdaban(kikaku_id);
			
			//検索キーと登録者も設定
			dataSet.kikaku_id = kikaku_id;
			dataSet.kikaku_edaban = chgNum(kikaku_edaban);
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, true);
			Debug.console(dataSet);
			// insert
			Logger.getLogger().info(' [create]　dataSet ' + ImJson.toJSONString(dataSet, true));
			var result = db.insert('lo_t_kikaku_shohin', dataSet);
			
		}else{
			ret.msg = MessageManager.getMessage('KK03E033');
			ret.altmsg = MessageManager.getMessage('KK03I002');

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
			result = db.update('lo_t_kikaku_shohin', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
		
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
		ret.kikaku_id = formParams.kikaku_id;
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
			shohin_category : (formParams.shohin_category === undefined)?null:Number(formParams.shohin_category),
			shohin_nm : (formParams.shohin_nm === null)?null:formParams.shohin_nm,
			zeinuki_jodai : (formParams.zeinuki_jodai === null)?null:Number(formParams.zeinuki_jodai),
			mokuhyo_hambai_su : (formParams.mokuhyo_hambai_su === null)?null:Number(formParams.mokuhyo_hambai_su),
			shokai_seisanyotei_su : (formParams.shokai_seisanyotei_su === null)?null:Number(formParams.shokai_seisanyotei_su),
			sku : (formParams.sku === null)?null:Number(formParams.sku),
			chiiki : formParams.chiiki,
			hanbaiyoteikosu_nihon : (formParams.shanbaiyoteikosu_nihonku === null)?null:Number(formParams.hanbaiyoteikosu_nihon),
			hanbaiyoteikosu_chugoku : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_chugoku),
			hanbaiyoteikosu_asia : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_asia),
			hanbaiyoteikosu_chunanbei : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_chunanbei),
			hanbaiyoteikosu_europe : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_europe),
			hanbaikoku_shosai : (formParams.chiiki == '1')?null:formParams.hanbaikoku_shosai,
			hanbai_jiki : (formParams.hanbai_jiki === null)?null:formParams.hanbai_jiki,
			localize_shohin_umu : (formParams.chiiki == '1')?null:formParams.localize_shohin_umu,
			localize_shohin_nm : (formParams.chiiki == '1' || formParams.localize_shohin_umu == '0')?null:formParams.localize_shohin_nm,
			jyouhou_syosyutu_jiki :(formParams.jyouhou_syosyutu_jiki === null)?null:formParams.jyouhou_syosyutu_jiki,
			uriba_tempo : (formParams.uriba_tempo=="1")?"1":"0",
			uriba_event : (formParams.uriba_event=="1")?"1":"0",
			uriba_ecsite : (formParams.uriba_ecsite=="1")?"1":"0",
			urikata_ippanryutsu : (formParams.urikata_ippanryutsu=="1")?"1":"0",
			urikata_juchuhambai : (formParams.urikata_juchuhambai=="1")?"1":"0",
			urikata_senkohambai : (formParams.urikata_senkohambai=="1")?"1":"0",
			urikata_tempo_kaijogenteihambai : (formParams.urikata_tempo_kaijogenteihambai=="1")?"1":"0",
			hanro : (formParams.hanro === null)?null:formParams.hanro,
			shoshi : (formParams.shoshi === undefined)?null:formParams.shoshi,
			trading : (formParams.trading === undefined)?null:formParams.trading,
			kakiorosi_kibou_umu : (formParams.kakiorosi_kibou_umu === undefined)?null:formParams.kakiorosi_kibou_umu,
			asobistore : (formParams.asobistore === undefined)?null:formParams.asobistore,
			sendenhansoku_keikaku : (formParams.sendenhansoku_keikaku === null)?null:formParams.sendenhansoku_keikaku,
			shohin_setsumei : (formParams.shohin_setsumei === null)?null:formParams.shohin_setsumei,
			sozai : (formParams.sozai === null)?null:formParams.sozai,
			size : (formParams.size === null)?null:formParams.size,
			bikou : (formParams.bikou === null)?null:formParams.bikou,
			// ライセンスプロダクション専用項目
			sozai_mitsumori : (formParams.sozai_mitsumori === null)?null:chgNum(formParams.sozai_mitsumori),
			ryouritu : (formParams.ryouritu === null)?null:chgNum(formParams.ryouritu),
			sample : (formParams.sample === null)?null:chgNum(formParams.sample),		
			riyu_joken : (formParams.riyu_joken === undefined)?null:formParams.riyu_joken,
			ok_ng : formParams.ok_ng,
			royalty_kingaku : (formParams.royalty_kingaku === null)?null:chgNum(formParams.royalty_kingaku)
		};
	} else {
		// 通常登録
		dataSet = {
			shohin_category : (formParams.shohin_category === undefined)?null:Number(formParams.shohin_category),
			shohin_nm : (formParams.shohin_nm === null)?null:formParams.shohin_nm,
			zeinuki_jodai : (formParams.zeinuki_jodai === null)?null:Number(formParams.zeinuki_jodai),
			mokuhyo_hambai_su : (formParams.mokuhyo_hambai_su === null)?null:Number(formParams.mokuhyo_hambai_su),
			shokai_seisanyotei_su : (formParams.shokai_seisanyotei_su === null)?null:Number(formParams.shokai_seisanyotei_su),
			sku : (formParams.sku === null)?null:Number(formParams.sku),
			chiiki : formParams.chiiki,
			hanbaiyoteikosu_nihon : (formParams.shanbaiyoteikosu_nihonku === null)?null:Number(formParams.hanbaiyoteikosu_nihon),
			hanbaiyoteikosu_chugoku : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_chugoku),
			hanbaiyoteikosu_asia : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_asia),
			hanbaiyoteikosu_chunanbei : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_chunanbei),
			hanbaiyoteikosu_europe : (formParams.chiiki == '1')?null:Number(formParams.hanbaiyoteikosu_europe),
			hanbaikoku_shosai : (formParams.chiiki == '1')?null:formParams.hanbaikoku_shosai,
			localize_shohin_umu : (formParams.chiiki == '1')?null:formParams.localize_shohin_umu,
			localize_shohin_nm : (formParams.chiiki == '1' || formParams.localize_shohin_umu == '0')?null:formParams.localize_shohin_nm,
			hanbai_jiki : (formParams.hanbai_jiki === null)?null:formParams.hanbai_jiki,
			jyouhou_syosyutu_jiki :(formParams.jyouhou_syosyutu_jiki === null)?null:formParams.jyouhou_syosyutu_jiki,
			uriba_tempo : (formParams.uriba_tempo=="1")?"1":"0",
			uriba_event : (formParams.uriba_event=="1")?"1":"0",
			uriba_ecsite : (formParams.uriba_ecsite=="1")?"1":"0",
			urikata_ippanryutsu : (formParams.urikata_ippanryutsu=="1")?"1":"0",
			urikata_juchuhambai : (formParams.urikata_juchuhambai=="1")?"1":"0",
			urikata_senkohambai : (formParams.urikata_senkohambai=="1")?"1":"0",
			urikata_tempo_kaijogenteihambai : (formParams.urikata_tempo_kaijogenteihambai=="1")?"1":"0",
			hanro : (formParams.hanro === null)?null:formParams.hanro,
			shoshi : (formParams.shoshi === undefined)?null:formParams.shoshi,
			trading : (formParams.trading === undefined)?null:formParams.trading,
			kakiorosi_kibou_umu : (formParams.kakiorosi_kibou_umu === undefined)?null:formParams.kakiorosi_kibou_umu,
			asobistore : (formParams.asobistore === undefined)?null:formParams.asobistore,
			sendenhansoku_keikaku : (formParams.sendenhansoku_keikaku === null)?null:formParams.sendenhansoku_keikaku,
			shohin_setsumei : (formParams.shohin_setsumei === null)?null:formParams.shohin_setsumei,
			sozai : (formParams.sozai === null)?null:formParams.sozai,
			size : (formParams.size === null)?null:formParams.size,
			bikou : (formParams.bikou === null)?null:formParams.bikou,
			ok_ng : formParams.ok_ng
		};
	}
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	return dataSet;
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

// 枝番取得
function getEdaban(kikaku_id){
    // sql実行
    var db = new TenantDatabase();
    var sql = "select COALESCE(max(kikaku_edaban),0)+1 as edaban from lo_t_kikaku_shohin where kikaku_id = ? and sakujo_flg = '0'";
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
    var sql = "select * from lo_t_kikaku_shohin where kikaku_id = ? AND kikaku_edaban =? ";
    var result = db.select(sql, strParam);

	return result;
}

// チェックボックスの初期値設定
function checkedBox(data){
	var col_name =[
		"uriba_tempo",
		"uriba_event",
		"uriba_ecsite",
		"urikata_ippanryutsu",
		"urikata_juchuhambai",
		"urikata_senkohambai",
		"urikata_tempo_kaijogenteihambai"
	];
	var map = {};
	for (var i = 0; i < col_name.length; i++) {
		var key = col_name[i];
		var val = data[key];
		if (typeof val === "undefined"){
    		continue;
		}
		// 1ならcheckedで登録
		if (val == "1"){
			map[key] = true;
		}else{
			map[key] = false;
		}
	}
	return map;
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
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KK03E";
	var message_last_num = 52;
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

	var categoryList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_SHOHIN_CATEGORY);
	var chiikiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_CHIIKI);
	var shoshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_SHOSHI);
	var tradingList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_TRADING);
	var kakioroshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU);
	var asobistoreList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_ASOBISTORE);
	var localizeShohinUmuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_LOCALIZE_SHOHIN_UMU);

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

	// カテゴリ
	if (inputData.shohin_category != recordData.shohin_category) {
		tempComment = tempComment + shuseiKomokuChar + "カテゴリ" + lineBreakChar + lineBreakChar;
		for (var idxShohinCate = 0; idxShohinCate < categoryList.length; idxShohinCate++) {
			if (categoryList[idxShohinCate].value == recordData.shohin_category) {
				tempComment = tempComment + shuseiMaeChar + categoryList[idxShohinCate].label + lineBreakChar;
			}
		}
		for (var idxShohinCate = 0; idxShohinCate < categoryList.length; idxShohinCate++) {
			if (categoryList[idxShohinCate].value == inputData.shohin_category) {
				tempComment = tempComment + shuseiGoChar + categoryList[idxShohinCate].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 商品名
	if (inputData.shohin_nm != recordData.shohin_nm) {
		tempComment = tempComment + shuseiKomokuChar + "商品名" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.shohin_nm);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.shohin_nm);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 税抜上代
	if (inputData.zeinuki_jodai != recordData.zeinuki_jodai) {
		tempComment = tempComment + shuseiKomokuChar + "税抜上代" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.zeinuki_jodai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.zeinuki_jodai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 目標販売数
	if (inputData.mokuhyo_hambai_su != recordData.mokuhyo_hambai_su) {
		tempComment = tempComment + shuseiKomokuChar + "目標販売数" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.mokuhyo_hambai_su);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.mokuhyo_hambai_su);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数
	if (inputData.shokai_seisanyotei_su != recordData.shokai_seisanyotei_su) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.shokai_seisanyotei_su);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.shokai_seisanyotei_su);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// SKU
	if (inputData.sku != recordData.sku) {
		tempComment = tempComment + shuseiKomokuChar + "SKU" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.sku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.sku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 地域
	if (inputData.chiiki != recordData.chiiki) {
		tempComment = tempComment + shuseiKomokuChar + "地域" + lineBreakChar + lineBreakChar;
		for (var idxChiiki = 0; idxChiiki < chiikiList.length; idxChiiki++) {
			if (chiikiList[idxChiiki].value == recordData.chiiki) {
				tempComment = tempComment + shuseiMaeChar + chiikiList[idxChiiki].label + lineBreakChar;
			}
		}
		for (var idxChiiki = 0; idxChiiki < chiikiList.length; idxChiiki++) {
			if (chiikiList[idxChiiki].value == inputData.chiiki) {
				tempComment = tempComment + shuseiGoChar + chiikiList[idxChiiki].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数(内訳)　日本
	if (changeNullToZero(inputData.hanbaiyoteikosu_nihon) != changeNullToZero(recordData.hanbaiyoteikosu_nihon)) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数(内訳)　日本" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_nihon);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_nihon);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数(内訳)　中国本土
	if (changeNullToZero(inputData.hanbaiyoteikosu_chugoku) != changeNullToZero(recordData.hanbaiyoteikosu_chugoku)) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数(内訳)　中国本土" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_chugoku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_chugoku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数(内訳)　アジア（中国本土除く）
	if (changeNullToZero(inputData.hanbaiyoteikosu_asia) != changeNullToZero(recordData.hanbaiyoteikosu_asia)) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数(内訳)　アジア（中国本土除く）" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_asia);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_asia);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数(内訳)　北米・中南米
	if (changeNullToZero(inputData.hanbaiyoteikosu_chunanbei) != changeNullToZero(recordData.hanbaiyoteikosu_chunanbei)) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数(内訳)　北米・中南米" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_chunanbei);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_chunanbei);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回生産予定数(内訳)　ヨーロッパ
	if (changeNullToZero(inputData.hanbaiyoteikosu_europe) != changeNullToZero(recordData.hanbaiyoteikosu_europe)) {
		tempComment = tempComment + shuseiKomokuChar + "初回生産予定数(内訳)　ヨーロッパ" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_europe);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_europe);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 販売国詳細
	if (changeNullToEmptyStrring(inputData.hanbaikoku_shosai) != changeNullToEmptyStrring(recordData.hanbaikoku_shosai)) {
		tempComment = tempComment + shuseiKomokuChar + "販売国詳細" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaikoku_shosai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaikoku_shosai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// ローカライズ商品名の有無
	if (inputData.localize_shohin_umu != recordData.localize_shohin_umu) {
		tempComment = tempComment + shuseiKomokuChar + "ローカライズ商品名の有無" + lineBreakChar + lineBreakChar;
		var isMatch = false;
		for (var idxlocalizeShohinUmu = 0; idxlocalizeShohinUmu < localizeShohinUmuList.length; idxlocalizeShohinUmu++) {
			if (localizeShohinUmuList[idxlocalizeShohinUmu].value == recordData.localize_shohin_umu) {
				isMatch = true;
				tempComment = tempComment + shuseiMaeChar + localizeShohinUmuList[idxlocalizeShohinUmu].label + lineBreakChar;
			}
		}
		if (!isMatch) {
			tempComment = tempComment + shuseiMaeChar + lineBreakChar;
		}
		isMatch = false;
		for (var idxlocalizeShohinUmu = 0; idxlocalizeShohinUmu < localizeShohinUmuList.length; idxlocalizeShohinUmu++) {
			if (localizeShohinUmuList[idxlocalizeShohinUmu].value == inputData.localize_shohin_umu) {
				isMatch = true;
				tempComment = tempComment + shuseiGoChar + localizeShohinUmuList[idxlocalizeShohinUmu].label + lineBreakChar;
			}
		}
		if (!isMatch) {
			tempComment = tempComment + shuseiGoChar + lineBreakChar;
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// ローカライズ商品名
	if (changeNullToEmptyStrring(inputData.localize_shohin_nm) != changeNullToEmptyStrring(recordData.localize_shohin_nm)) {
		tempComment = tempComment + shuseiKomokuChar + "ローカライズ商品名" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.localize_shohin_nm);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.localize_shohin_nm);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 発売時期
	if (inputData.hanbai_jiki != recordData.hanbai_jiki) {
		tempComment = tempComment + shuseiKomokuChar + "発売時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbai_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbai_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 情報初出時期
	if (inputData.jyouhou_syosyutu_jiki != recordData.jyouhou_syosyutu_jiki) {
		tempComment = tempComment + shuseiKomokuChar + "情報初出時期" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.jyouhou_syosyutu_jiki);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.jyouhou_syosyutu_jiki);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 売り場
	if (inputData.uriba_tempo != recordData.uriba_tempo ||
			inputData.uriba_event != recordData.uriba_event ||
			inputData.uriba_ecsite != recordData.uriba_ecsite) {
		tempComment = tempComment + shuseiKomokuChar + "売り場" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + shuseiMaeChar;
		var aryRecordDataUriba = [];
		if (recordData.uriba_tempo == 1) {
			aryRecordDataUriba.push("店舗");
		}
		if (recordData.uriba_ecsite == 1) {
			aryRecordDataUriba.push("ECサイト販売");
		}
		if (recordData.uriba_event == 1) {
			aryRecordDataUriba.push("イベント");
		}
		var loopFirst = true;
		for (var idx = 0; idx < aryRecordDataUriba.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryRecordDataUriba[idx];
			} else {
				tempComment = tempComment + aryRecordDataUriba[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment+ lineBreakChar;
		tempComment = tempComment + shuseiGoChar;
		var aryInputDataUriba = [];
		if (inputData.uriba_tempo == 1) {
			aryInputDataUriba.push("店舗");
		}
		if (inputData.uriba_ecsite == 1) {
			aryInputDataUriba.push("ECサイト販売");
		}
		if (inputData.uriba_event == 1) {
			aryInputDataUriba.push("イベント");
		}
		loopFirst = true;
		for (var idx = 0; idx < aryInputDataUriba.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryInputDataUriba[idx];
			} else {
				tempComment = tempComment + aryInputDataUriba[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment + lineBreakChar;
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 売り方
	if (inputData.urikata_ippanryutsu != recordData.urikata_ippanryutsu ||
			inputData.urikata_juchuhambai != recordData.urikata_juchuhambai ||
			inputData.urikata_senkohambai != recordData.urikata_senkohambai ||
			inputData.urikata_tempo_kaijogenteihambai != recordData.urikata_tempo_kaijogenteihambai) {
		tempComment = tempComment + shuseiKomokuChar + "売り方" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + shuseiMaeChar;
		var aryRecordDataUrikata = [];
		if (recordData.urikata_ippanryutsu == 1) {
			aryRecordDataUrikata.push("一般流通");
		}
		if (recordData.urikata_juchuhambai == 1) {
			aryRecordDataUrikata.push("受注販売");
		}
		if (recordData.urikata_senkohambai == 1) {
			aryRecordDataUrikata.push("先行販売");
		}
		if (recordData.urikata_tempo_kaijogenteihambai == 1) {
			aryRecordDataUrikata.push("店舗・会場限定販売");
		}
		var loopFirst = true;
		for (var idx = 0; idx < aryRecordDataUrikata.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryRecordDataUrikata[idx];
			} else {
				tempComment = tempComment + aryRecordDataUrikata[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment + lineBreakChar;
		tempComment = tempComment + shuseiGoChar;
		var aryInputDataUrikata = [];
		if (inputData.urikata_ippanryutsu == 1) {
			aryInputDataUrikata.push("一般流通");
		}
		if (inputData.urikata_juchuhambai == 1) {
			aryInputDataUrikata.push("受注販売");
		}
		if (inputData.urikata_senkohambai == 1) {
			aryInputDataUrikata.push("先行販売");
		}
		if (inputData.urikata_tempo_kaijogenteihambai == 1) {
			aryInputDataUrikata.push("店舗・会場限定販売");
		}
		loopFirst = true;
		for (var idx = 0; idx < aryInputDataUrikata.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryInputDataUrikata[idx];
			} else {
				tempComment = tempComment + aryInputDataUrikata[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment + lineBreakChar;
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 証紙
	if (inputData.shoshi != recordData.shoshi) {
		tempComment = tempComment + shuseiKomokuChar + "証紙" + lineBreakChar + lineBreakChar;
		for (var idxShoshi = 0; idxShoshi < shoshiList.length; idxShoshi++) {
			if (shoshiList[idxShoshi].value == recordData.shoshi) {
				tempComment = tempComment + shuseiMaeChar + shoshiList[idxShoshi].label + lineBreakChar;
			}
		}
		for (var idxShoshi = 0; idxShoshi < shoshiList.length; idxShoshi++) {
			if (shoshiList[idxShoshi].value == inputData.shoshi) {
				tempComment = tempComment + shuseiGoChar + shoshiList[idxShoshi].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 主な販路
	if (inputData.hanro != recordData.hanro) {
		tempComment = tempComment + shuseiKomokuChar + "主な販路" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanro);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanro);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// トレーディング仕様
	if (inputData.trading != recordData.trading) {
		tempComment = tempComment + shuseiKomokuChar + "トレーディング仕様" + lineBreakChar + lineBreakChar;
		for (var idxTrading = 0; idxTrading < tradingList.length; idxTrading++) {
			if (tradingList[idxTrading].value == recordData.trading) {
				tempComment = tempComment + shuseiMaeChar + tradingList[idxTrading].label + lineBreakChar;
			}
		}
		for (var idxTrading = 0; idxTrading < tradingList.length; idxTrading++) {
			if (tradingList[idxTrading].value == inputData.trading) {
				tempComment = tempComment + shuseiGoChar + tradingList[idxTrading].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 描き下ろし希望有無
	if (inputData.kakiorosi_kibou_umu != recordData.kakiorosi_kibou_umu) {
		tempComment = tempComment + shuseiKomokuChar + "描き下ろし希望有無" + lineBreakChar + lineBreakChar;
		for (var idxKakioroshi = 0; idxKakioroshi < kakioroshiList.length; idxKakioroshi++) {
			if (kakioroshiList[idxKakioroshi].value == recordData.kakiorosi_kibou_umu) {
				tempComment = tempComment + shuseiMaeChar + kakioroshiList[idxKakioroshi].label + lineBreakChar;
			}
		}
		for (var idxKakioroshi = 0; idxKakioroshi < kakioroshiList.length; idxKakioroshi++) {
			if (kakioroshiList[idxKakioroshi].value == inputData.kakiorosi_kibou_umu) {
				tempComment = tempComment + shuseiGoChar + kakioroshiList[idxKakioroshi].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// アソビストアでの取り扱い希望
	if (inputData.asobistore != recordData.asobistore) {
		tempComment = tempComment + shuseiKomokuChar + "アソビストアでの取り扱い希望" + lineBreakChar + lineBreakChar;
		for (var idxAsobi = 0; idxAsobi < asobistoreList.length; idxAsobi++) {
			if (asobistoreList[idxAsobi].value == recordData.asobistore) {
				tempComment = tempComment + shuseiMaeChar + asobistoreList[idxAsobi].label + lineBreakChar;
			}
		}
		for (var idxAsobi = 0; idxAsobi < asobistoreList.length; idxAsobi++) {
			if (asobistoreList[idxAsobi].value == inputData.asobistore) {
				tempComment = tempComment + shuseiGoChar + asobistoreList[idxAsobi].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 宣伝販促計画
	if (inputData.sendenhansoku_keikaku != recordData.sendenhansoku_keikaku) {
		tempComment = tempComment + shuseiKomokuChar + "宣伝販促計画" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.sendenhansoku_keikaku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.sendenhansoku_keikaku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 商品説明
	if (inputData.shohin_setsumei != recordData.shohin_setsumei) {
		tempComment = tempComment + shuseiKomokuChar + "商品説明" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.shohin_setsumei);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.shohin_setsumei);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 材質
	if (inputData.sozai != recordData.sozai) {
		tempComment = tempComment + shuseiKomokuChar + "材質" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.sozai);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.sozai);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// サイズ
	if (inputData.size != recordData.size) {
		tempComment = tempComment + shuseiKomokuChar + "サイズ" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.size);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.size);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 備考
	if (inputData.bikou != recordData.bikou) {
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
