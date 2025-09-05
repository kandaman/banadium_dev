Constant.load("lo/common_libs/lo_const");
var $production_flg = false; // true=ライセンスプロダクション    false=ライセンシー
// コンボボックス
var $cdList = [];
var $chiikiList = [];
var $jakettoList = [];
var $releaseList = [];
var $asobistoreList = [];
var $dramaList= [];
var $hunyuList = [];
var $tenpoList = [];
var $shoninList = [];
var $fileList = []; // 完成イメージ
var $validationErrorMessages = [];
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト

 //楽曲情報
var $gakkyoku_data = {
	kikaku_id:"",
	kikaku_edaban: "",
	koushin_bi: ""	// 企画情報の排他制御用
};
var $chkbox_chk = {};//チェックボックスボタンの初期値チェック
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
	
	// 削除チェック(親企画)
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
		var result = getGakkyokuDate(request.kikaku_id,request.kikaku_edaban);
		
		if (result.countRow > 0){
			$gakkyoku_data = result.data[0]; //一行だけ取得
			
			// 削除チェック
			Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $gakkyoku_data);
			
			var fileResult = getFileData($gakkyoku_data.kikaku_id, $gakkyoku_data.kikaku_edaban);
			Logger.getLogger().info(' [init]　fileResult ' + ImJson.toJSONString(fileResult, true));
			$fileList = fileResult.data;
			
			//チェックボックスの初期値設定
			$chkbox_chk = checkedBox($gakkyoku_data);
		}
	}else{
		// ライセンシー以外は表示させない
		if ($production_flg) {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		// 新規
		$gakkyoku_data.kikaku_id = request.kikaku_id;
		//DBから枝番最大値+1を取得
		$gakkyoku_data.kikaku_edaban = "" + getEdaban(request.kikaku_id);
	}
	
	// 企画情報の更新日は排他制御に使用する
	$gakkyoku_data.koushin_bi = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKoushinBi", $gakkyoku_data.kikaku_id).toString();
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

	$cdList = [];
	$cdList.push({label:"",value:""});
	$cdList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $cdList, Constant.LO_CDCLS_SINGLE_ALBAM);

	$chiikiList = [];
	$chiikiList.push({label:"",value:""});
	$chiikiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $chiikiList, Constant.LO_CDCLS_CHIIKI);
	
	$jakettoList = [];
	$jakettoList.push({label:"",value:""});
	$jakettoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $jakettoList, Constant.LO_CDCLS_JAKETTO_VISUAL);

	$releaseList = [];
	$releaseList.push({label:"",value:""});
	$releaseList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $releaseList, Constant.LO_CDCLS_RELEASE_EVENT);

	$asobistoreList = [];
	$asobistoreList.push({label:"",value:""});
	$asobistoreList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $asobistoreList, Constant.LO_CDCLS_ASOBISTORE);

	$dramaList = [];
	$dramaList.push({label:"",value:""});
	$dramaList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $dramaList, Constant.LO_CDCLS_DRAMAPART);

	$hunyuList = [];
	$hunyuList.push({label:"",value:""});
	$hunyuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hunyuList, Constant.LO_CDCLS_HUNYU_TOKUTEN);

	$tenpoList = [];
	$tenpoList.push({label:"",value:""});
	$tenpoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $tenpoList, Constant.LO_CDCLS_TENPO_TOKUTEN);

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
    $extstr = MessageManager.getMessage('KK04I003', $extstr);
    
}

/**
 * 企画情報(楽曲)検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getGakkyokuDate(kikakuId,edaban) {
	
	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT " ;
	sql += "  g.* " ;
	sql += " FROM lo_t_kikaku_gakkyoku g " ; 
	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.kikaku_id =? " ; 
	sql += "   AND g.kikaku_edaban = ? " ; 

	
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
 * 楽曲情報登録
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
			ret.msg = MessageManager.getMessage('KK04E039');
			ret.altmsg = MessageManager.getMessage('KK04I001');
			
			//DBから枝番最大値+1を取得
			kikaku_edaban = "" + getEdaban(kikaku_id);
			
			//検索キーと登録者も設定
			dataSet.kikaku_id = kikaku_id;
			dataSet.kikaku_edaban = chgNum(kikaku_edaban);
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, true);
			
			// insert
			var result = db.insert('lo_t_kikaku_gakkyoku', dataSet);
			
		}else{
			ret.msg = MessageManager.getMessage('KK04E040');
			ret.altmsg = MessageManager.getMessage('KK04I002');

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
			result = db.update('lo_t_kikaku_gakkyoku', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
		
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
			gakkyoku_nm  : formParams.gakkyoku_nm,
			single_albam  : formParams.single_albam,
			hanbai_keitai_cd  : chkVal(formParams.hanbai_keitai_cd),
			hanbai_keitai_digital : chkVal(formParams.hanbai_keitai_digital),
			hanbai_keitai_sonota  : chkVal(formParams.hanbai_keitai_sonota),
			digital_haishin_kobetsuhaishin  : chkVal(formParams.digital_haishin_kobetsuhaishin),
			digital_haishin_cdtani  : chkVal(formParams.digital_haishin_cdtani),
			digital_haishin_subscription : chkVal(formParams.digital_haishin_subscription),
			kakaku_cd  : chgNum(formParams.kakaku_cd),
			kakaku_digital  : chgNum(formParams.kakaku_digital),
			shokaisyukka_mikomi  : chgNum(formParams.shokaisyukka_mikomi),
			mokuhyo_hambai_su  : chgNum(formParams.mokuhyo_hambai_su),
			mokuhyou_haishin_su  : chgNum(formParams.mokuhyou_haishin_su),
			chiiki  : formParams.chiiki,
			hanbaiyoteikosu_nihon  : chgNum(formParams.hanbaiyoteikosu_nihon),
			hanbaiyoteikosu_chugoku  : chgNum(formParams.hanbaiyoteikosu_chugoku),
			hanbaiyoteikosu_asia  : chgNum(formParams.hanbaiyoteikosu_asia),
			hanbaiyoteikosu_chunanbei  : chgNum(formParams.hanbaiyoteikosu_chunanbei),
			hanbaiyoteikosu_europe  : chgNum(formParams.hanbaiyoteikosu_europe),
			hanbaikoku_shosai  : formParams.hanbaikoku_shosai,
			hanbai_jiki  : formParams.hanbai_jiki,
			jyouhou_syosyutu_jiki  : formParams.jyouhou_syosyutu_jiki,
			uriba_tempo  : chkVal(formParams.uriba_tempo),
			uriba_event  : chkVal(formParams.uriba_event),
			uriba_ecsite : chkVal(formParams.uriba_ecsite),
			urikata_ippanryutsu  : chkVal(formParams.urikata_ippanryutsu),
			urikata_juchuhambai  : chkVal(formParams.urikata_juchuhambai),
			urikata_senkohambai  : chkVal(formParams.urikata_senkohambai),
			urikata_tempo_kaijogenteihambai  : chkVal(formParams.urikata_tempo_kaijogenteihambai),
			hanro  : formParams.hanro,
			jaketto_visual  : formParams.jaketto_visual,
			release_event  : formParams.release_event,
			asobistore  : formParams.asobistore,
			gakkyoku_setsumei  : formParams.gakkyoku_setsumei,
			syuroku_naiyo  : formParams.syuroku_naiyo,
			kyokusu  : chgNum(formParams.kyokusu),
			dramapart  : formParams.dramapart,
			hunyu_tokuten  : formParams.hunyu_tokuten,
			tenpo_tokuten  : formParams.tenpo_tokuten,
			tokutei_naiyo  : formParams.tokutei_naiyo,
			bikou  : formParams.bikou, 
			// ライセンスプロダクション用
			character_shiyoryo_mikomi  : chgNum(formParams.character_shiyoryo_mikomi),
			riyu_joken  : formParams.riyu_joken,
			ok_ng : formParams.ok_ng,
			royalty_kingaku : (formParams.royalty_kingaku === null)?null:chgNum(formParams.royalty_kingaku)
		};
	} else {
		// 通常登録
		dataSet = {
			gakkyoku_category  : chgNum(formParams.gakkyoku_category),
			gakkyoku_nm  : formParams.gakkyoku_nm, 
			single_albam  : formParams.single_albam,
			hanbai_keitai_cd  : chkVal(formParams.hanbai_keitai_cd),
			hanbai_keitai_digital : chkVal(formParams.hanbai_keitai_digital),
			hanbai_keitai_sonota  : chkVal(formParams.hanbai_keitai_sonota),
			digital_haishin_kobetsuhaishin  : chkVal(formParams.digital_haishin_kobetsuhaishin),
			digital_haishin_cdtani  : chkVal(formParams.digital_haishin_cdtani),
			digital_haishin_subscription : chkVal(formParams.digital_haishin_subscription),
			kakaku_cd  : chgNum(formParams.kakaku_cd), 
			kakaku_digital  : chgNum(formParams.kakaku_digital),
			shokaisyukka_mikomi  : chgNum(formParams.shokaisyukka_mikomi), 
			mokuhyo_hambai_su  : chgNum(formParams.mokuhyo_hambai_su), 
			mokuhyou_haishin_su  : chgNum(formParams.mokuhyou_haishin_su), 
			chiiki  : formParams.chiiki,
			hanbaiyoteikosu_nihon  : chgNum(formParams.hanbaiyoteikosu_nihon), 
			hanbaiyoteikosu_chugoku  : chgNum(formParams.hanbaiyoteikosu_chugoku), 
			hanbaiyoteikosu_asia  : chgNum(formParams.hanbaiyoteikosu_asia), 
			hanbaiyoteikosu_chunanbei  : chgNum(formParams.hanbaiyoteikosu_chunanbei), 
			hanbaiyoteikosu_europe  : chgNum(formParams.hanbaiyoteikosu_europe), 
			hanbaikoku_shosai  : formParams.hanbaikoku_shosai, 
			hanbai_jiki  : formParams.hanbai_jiki, 
			jyouhou_syosyutu_jiki  : formParams.jyouhou_syosyutu_jiki, 
			uriba_tempo  : chkVal(formParams.uriba_tempo), 
			uriba_event  : chkVal(formParams.uriba_event), 
			uriba_ecsite : chkVal(formParams.uriba_ecsite), 
			urikata_ippanryutsu  : chkVal(formParams.urikata_ippanryutsu), 
			urikata_juchuhambai  : chkVal(formParams.urikata_juchuhambai), 
			urikata_senkohambai  : chkVal(formParams.urikata_senkohambai), 
			urikata_tempo_kaijogenteihambai  : chkVal(formParams.urikata_tempo_kaijogenteihambai), 
			hanro  : formParams.hanro, 
			jaketto_visual  : formParams.jaketto_visual, 
			release_event  : formParams.release_event, 
			asobistore  : formParams.asobistore,  
			gakkyoku_setsumei  : formParams.gakkyoku_setsumei, 
			syuroku_naiyo  : formParams.syuroku_naiyo, 
			kyokusu  : chgNum(formParams.kyokusu), 
			dramapart  : formParams.dramapart, 
			hunyu_tokuten  : formParams.hunyu_tokuten, 
			tenpo_tokuten  : formParams.tenpo_tokuten,  
			tokutei_naiyo  : formParams.tokutei_naiyo,  
			cdimage  : null,
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
    var sql = "select COALESCE(max(kikaku_edaban),0)+1 as edaban from lo_t_kikaku_gakkyoku where kikaku_id = ? and sakujo_flg = '0'";
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
    var sql = "select * from lo_t_kikaku_gakkyoku where kikaku_id = ? AND kikaku_edaban =? ";
    var result = db.select(sql, strParam);

	return result;
}

// チェックボックスの初期値設定
function checkedBox(data){
	var col_name =[
		"hanbai_keitai_cd",
		"hanbai_keitai_digital",
		"hanbai_keitai_sonota",
		"digital_haishin_kobetsuhaishin",
		"digital_haishin_cdtani",
		"digital_haishin_subscription",
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


// 1ならそのまま,それ以外なら0を返す
function chkVal(val){
	return (val=="1")?"1":"0";
}

// 数値型に変換
function chgNum(val){
	if (isNaN(val) || val == ""){
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

	var message_id_header = "KK04E";
	var message_last_num = 60;
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

	var cdList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_SINGLE_ALBAM);
	var chiikiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_CHIIKI);
	var jakettoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_JAKETTO_VISUAL);
	var releaseList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_RELEASE_EVENT);
	var asobistoreList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_ASOBISTORE);
	var dramaList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_DRAMAPART);
	var hunyuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_HUNYU_TOKUTEN);
	var tenpoList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", [], Constant.LO_CDCLS_TENPO_TOKUTEN);

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

	// シングル/アルバム名
	if (inputData.gakkyoku_nm != recordData.gakkyoku_nm) {
		tempComment = tempComment + shuseiKomokuChar + "シングル/アルバム名" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.gakkyoku_nm);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.gakkyoku_nm);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// シングル or アルバム
	if (inputData.single_albam != recordData.single_albam) {
		tempComment = tempComment + shuseiKomokuChar + "シングル or アルバム" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < cdList.length; idx++) {
			if (cdList[idx].value == recordData.single_albam) {
				tempComment = tempComment + shuseiMaeChar + cdList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < cdList.length; idx++) {
			if (cdList[idx].value == inputData.single_albam) {
				tempComment = tempComment + shuseiGoChar + cdList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 販売形態
	if (inputData.hanbai_keitai_cd != recordData.hanbai_keitai_cd ||
			inputData.hanbai_keitai_digital != recordData.hanbai_keitai_digital ||
			inputData.hanbai_keitai_sonota !== recordData.hanbai_keitai_sonota) {
		tempComment = tempComment + shuseiKomokuChar + "販売形態" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + shuseiMaeChar;
		var aryRecordDataHanbaiKeitai = [];
		if (recordData.hanbai_keitai_cd == 1) {
			aryRecordDataHanbaiKeitai.push("CD");
		}
		if (recordData.hanbai_keitai_digital == 1) {
			aryRecordDataHanbaiKeitai.push("デジタル配信");
		}
		if (recordData.hanbai_keitai_sonota == 1) {
			aryRecordDataHanbaiKeitai.push("その他");
		}
		var loopFirst = true;
		for (var idx = 0; idx < aryRecordDataHanbaiKeitai.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryRecordDataHanbaiKeitai[idx];
			} else {
				tempComment = tempComment + aryRecordDataHanbaiKeitai[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment+ lineBreakChar;
		tempComment = tempComment + shuseiGoChar;
		var aryInputDataHanbaiKeitai = [];
		if (inputData.hanbai_keitai_cd == 1) {
			aryInputDataHanbaiKeitai.push("CD");
		}
		if (inputData.hanbai_keitai_digital == 1) {
			aryInputDataHanbaiKeitai.push("デジタル配信");
		}
		if (inputData.hanbai_keitai_sonota == 1) {
			aryInputDataHanbaiKeitai.push("その他");
		}
		loopFirst = true;
		for (var idx = 0; idx < aryInputDataHanbaiKeitai.length; idx++) {
			if (!loopFirst) {
				tempComment = tempComment + ", " + aryInputDataHanbaiKeitai[idx];
			} else {
				tempComment = tempComment + aryInputDataHanbaiKeitai[idx];
				loopFirst = false;
			}
		}
		tempComment = tempComment + lineBreakChar;
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// デジタル配信詳細
	if (inputData.digital_haishin_kobetsuhaishin != recordData.digital_haishin_kobetsuhaishin ||
			inputData.digital_haishin_cdtani != recordData.digital_haishin_cdtani ||
			inputData.digital_haishin_subscription != recordData.digital_haishin_subscription) {
		tempComment = tempComment + shuseiKomokuChar + "デジタル配信詳細" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + shuseiMaeChar;
		var aryRecordDataUriba = [];
		if (recordData.digital_haishin_kobetsuhaishin == 1) {
			aryRecordDataUriba.push("個別配信");
		}
		if (recordData.digital_haishin_subscription == 1) {
			aryRecordDataUriba.push("サブスクリプション");
		}
		if (recordData.digital_haishin_cdtani == 1) {
			aryRecordDataUriba.push("CD単位で配信");
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
		if (inputData.digital_haishin_kobetsuhaishin == 1) {
			aryInputDataUriba.push("個別配信");
		}
		if (inputData.digital_haishin_subscription == 1) {
			aryInputDataUriba.push("サブスクリプション");
		}
		if (inputData.digital_haishin_cdtani == 1) {
			aryInputDataUriba.push("CD単位で配信");
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
	// 価格　CD
	if (inputData.kakaku_cd != recordData.kakaku_cd) {
		tempComment = tempComment + shuseiKomokuChar + "価格　CD" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.kakaku_cd);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.kakaku_cd);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 価格　デジタル配信
	if (inputData.kakaku_digital != recordData.kakaku_digital) {
		tempComment = tempComment + shuseiKomokuChar + "価格　デジタル配信" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.kakaku_digital);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.kakaku_digital);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数見込み
	if (inputData.shokaisyukka_mikomi != recordData.shokaisyukka_mikomi) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数見込み" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.shokaisyukka_mikomi);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.shokaisyukka_mikomi);
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
	// 目標配信数
	if (inputData.mokuhyou_haishin_su != recordData.mokuhyou_haishin_su) {
		tempComment = tempComment + shuseiKomokuChar + "目標配信数" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.mokuhyou_haishin_su);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.mokuhyou_haishin_su);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 地域
	if (inputData.chiiki != recordData.chiiki) {
		tempComment = tempComment + shuseiKomokuChar + "地域" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < chiikiList.length; idx++) {
			if (chiikiList[idx].value == recordData.chiiki) {
				tempComment = tempComment + shuseiMaeChar + chiikiList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < chiikiList.length; idx++) {
			if (chiikiList[idx].value == inputData.chiiki) {
				tempComment = tempComment + shuseiGoChar + chiikiList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数(内訳)　日本
	if (changeNullToZero(inputData.hanbaiyoteikosu_nihon) != changeNullToZero(recordData.hanbaiyoteikosu_nihon)) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数(内訳)　日本" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_nihon);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_nihon);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数(内訳)　中国本土
	if (changeNullToZero(inputData.hanbaiyoteikosu_chugoku) != changeNullToZero(recordData.hanbaiyoteikosu_chugoku)) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数(内訳)　中国本土" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_chugoku);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_chugoku);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数(内訳)　アジア（中国本土除く）
	if (changeNullToZero(inputData.hanbaiyoteikosu_asia) != changeNullToZero(recordData.hanbaiyoteikosu_asia)) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数(内訳)　アジア（中国本土除く）" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_asia);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_asia);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数(内訳)　北米・中南米
	if (changeNullToZero(inputData.hanbaiyoteikosu_chunanbei) != changeNullToZero(recordData.hanbaiyoteikosu_chunanbei)) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数(内訳)　北米・中南米" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanbaiyoteikosu_chunanbei);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanbaiyoteikosu_chunanbei);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 初回出荷数(内訳)　ヨーロッパ
	if (changeNullToZero(inputData.hanbaiyoteikosu_europe) != changeNullToZero(recordData.hanbaiyoteikosu_europe)) {
		tempComment = tempComment + shuseiKomokuChar + "初回出荷数(内訳)　ヨーロッパ" + lineBreakChar + lineBreakChar;
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
	// 主な販路
	if (inputData.hanro != recordData.hanro) {
		tempComment = tempComment + shuseiKomokuChar + "主な販路" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.hanro);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.hanro);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// ジャケットヴィジュアル
	if (inputData.jaketto_visual != recordData.jaketto_visual) {
		tempComment = tempComment + shuseiKomokuChar + "ジャケットヴィジュアル" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < jakettoList.length; idx++) {
			if (jakettoList[idx].value == recordData.jaketto_visual) {
				tempComment = tempComment + shuseiMaeChar + jakettoList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < jakettoList.length; idx++) {
			if (jakettoList[idx].value == inputData.jaketto_visual) {
				tempComment = tempComment + shuseiGoChar + jakettoList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// リリースイベント
	if (inputData.release_event != recordData.release_event) {
		tempComment = tempComment + shuseiKomokuChar + "リリースイベント" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < releaseList.length; idx++) {
			if (releaseList[idx].value == recordData.release_event) {
				tempComment = tempComment + shuseiMaeChar + releaseList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < releaseList.length; idx++) {
			if (releaseList[idx].value == inputData.release_event) {
				tempComment = tempComment + shuseiGoChar + releaseList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// アソビストアでの取り扱い希望
	if (inputData.asobistore != recordData.asobistore) {
		tempComment = tempComment + shuseiKomokuChar + "アソビストアでの取り扱い希望" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < asobistoreList.length; idx++) {
			if (asobistoreList[idx].value == recordData.asobistore) {
				tempComment = tempComment + shuseiMaeChar + asobistoreList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < asobistoreList.length; idx++) {
			if (asobistoreList[idx].value == inputData.asobistore) {
				tempComment = tempComment + shuseiGoChar + asobistoreList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 宣伝販促計画
	if (inputData.syuroku_naiyo != recordData.syuroku_naiyo) {
		tempComment = tempComment + shuseiKomokuChar + "宣伝販促計画" + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.syuroku_naiyo);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.syuroku_naiyo);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 楽曲説明 
	if (inputData.gakkyoku_setsumei != recordData.gakkyoku_setsumei) {
		tempComment = tempComment + shuseiKomokuChar + "楽曲説明 " + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.gakkyoku_setsumei);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.gakkyoku_setsumei);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 曲数
	if (inputData.kyokusu != recordData.kyokusu) {
		tempComment = tempComment + shuseiKomokuChar + "曲数 " + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.kyokusu);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.kyokusu);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// ドラマパート
	if (inputData.dramapart != recordData.dramapart) {
		tempComment = tempComment + shuseiKomokuChar + "ドラマパート" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < dramaList.length; idx++) {
			if (dramaList[idx].value == recordData.dramapart) {
				tempComment = tempComment + shuseiMaeChar + dramaList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < dramaList.length; idx++) {
			if (dramaList[idx].value == inputData.dramapart) {
				tempComment = tempComment + shuseiGoChar + dramaList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 封入特典
	if (inputData.hunyu_tokuten != recordData.hunyu_tokuten) {
		tempComment = tempComment + shuseiKomokuChar + "封入特典" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < hunyuList.length; idx++) {
			if (hunyuList[idx].value == recordData.hunyu_tokuten) {
				tempComment = tempComment + shuseiMaeChar + hunyuList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < hunyuList.length; idx++) {
			if (hunyuList[idx].value == inputData.hunyu_tokuten) {
				tempComment = tempComment + shuseiGoChar + hunyuList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 店舗特典
	if (inputData.tenpo_tokuten != recordData.tenpo_tokuten) {
		tempComment = tempComment + shuseiKomokuChar + "店舗特典" + lineBreakChar + lineBreakChar;
		for (var idx = 0; idx < tenpoList.length; idx++) {
			if (tenpoList[idx].value == recordData.tenpo_tokuten) {
				tempComment = tempComment + shuseiMaeChar + tenpoList[idx].label + lineBreakChar;
			}
		}
		for (var idx = 0; idx < tenpoList.length; idx++) {
			if (tenpoList[idx].value == inputData.tenpo_tokuten) {
				tempComment = tempComment + shuseiGoChar + tenpoList[idx].label + lineBreakChar;
			}
		}
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 特典内容
	if (inputData.tokutei_naiyo != recordData.tokutei_naiyo) {
		tempComment = tempComment + shuseiKomokuChar + "特典内容 " + lineBreakChar + lineBreakChar;
		tempComment = tempComment + getCommentText(shuseiMaeChar, recordData.tokutei_naiyo);
		tempComment = tempComment + getCommentText(shuseiGoChar, inputData.tokutei_naiyo);
		autoSabunCommentList.push(new String(tempComment + lineBreakChar));
		tempComment = "";
	}
	// 備考
	if (inputData.bikou != recordData.bikou) {
		tempComment = tempComment + shuseiKomokuChar + "備考 " + lineBreakChar + lineBreakChar;
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
