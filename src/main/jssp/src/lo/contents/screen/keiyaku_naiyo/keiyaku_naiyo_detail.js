Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , licenseeFlg : "0" // ライセンシーフラグ
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , contractFlg : "0" // 契約担当フラグ
    , accountFlg : "0" // 計上担当フラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};
var $form = {}; 
var $validationErrorMessages = [];
var $keiyaku_naiyo_data = {};
var $hasMaeKeiyakuFlg = false;
var $gempon_keiyaku_naiyo_data = {};
var $hasTsugiKeiyakuFlg = false;
var $tsugi_keiyaku_naiyo_data = {};
var $keiyakusho_hyodai_list = [];
var $keiyaku_cls_list = [];
var $keiyakusho_baitai_list = [];
var $keiyaku_status_list = [];
var $licensee_tanto_list = [];
var $keiyaku_encho_cls_list = [];
var $keiyakuEnchoClsDisableFlg = false;
var $tsuika_seisan_cls_list = [];
var $commentList = [];
var $hasComment = false;
var $isReminding = false;
var $bneCompanyCd = '';
var $kaisha_fix_flg = false;

var $kikakuMaxCount = 0; //契約内容企画上限
var $kyodakuMaxCount = 0; //契約内容許諾上限
var $kawariMaxCount = 0; //契約内容代わり承認申請上限
var $ringiURL = ''; // 稟議申請WF URL
var $zacroURL = ''; // ZACRO URL

var filterKikakuStatusList = [
    Constant.LO_STATUS_KANRYO
];
var filterKyodakuStatusList = [
    Constant.LO_STATUS_KANRYO
];
var filterKawariStatusList = [
	Constant.LO_STATUS_KANRYO
];

var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $tmpFileStr = ""; //添付ファイルメッセージ
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数

var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か

var $new_window_flg = false; // 新規ウィンドウフラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　契約内容確認画面表示');
	// 新規ウィンドウで開かれた場合
	if (request.new_window_flg) {
		$new_window_flg = true;
	}

	// ユーザー情報読み込み
	loadUserInfo();

	// マスタから初期表示用情報を取得
	getSelectableValue(request);

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	// 固定値マスタより企画上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KEIYAKU_KIKAKU_MAX);
	$kikakuMaxCount = $tmpList[0];
	// 固定値マスタより許諾上限取得
	$tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KEIYAKU_KYODAKU_MAX);
	$kyodakuMaxCount = $tmpList[0];
	// 代わり承認申請上限取得
	$kawariMaxCount = $kikakuMaxCount;
	
	// 稟議申請WF URL
	$tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_RINGI_URL);
	$ringiURL = $tmpList[0];
	
	// ZACRO URL
	$tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_ZACRO_URL);
	$zacroURL = $tmpList[0];

	// BNE Company Cd
	$tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_BNE_COMPANY_CD);
	$bneCompanyCd = $tmpList[0];

	//添付ファイルメッセージ及び拡張子リスト取得 // TODO 拡張子の確定
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_KEIYAKU_EXT);
    $extstr = "";
    for ( var i = 0; i < $extList.length; i++) {
    	if ($extstr == "") {
    		$extstr = $extList[i];
    	} else {
    		$extstr = $extstr + "/" + $extList[i];
    	}
    }
    $extListstr = $extstr.replace(/\./g, "");
    $extstr = MessageManager.getMessage('KE02I013', $extstr);
    $tmpFileStr = MessageManager.getMessage('KE02I014');
	
	// セッション削除
	Client.remove('before_apply_id');

	if ('keiyaku_naiyo_id' in request){

		var keiyakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoData", request.keiyaku_naiyo_id);
		$keiyaku_naiyo_data = keiyakuResult.data[0]; // 一行だけ取得
		$keiyaku_naiyo_data.tanto_data = ImJson.toJSONString({user_cd: $keiyaku_naiyo_data.licensee_keiyaku_tanto_id}, false);

		var gemponResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoGemponHimozukeData", request.keiyaku_naiyo_id);
		$gempon_keiyaku_naiyo_data = gemponResult.data[0];
		if ($gempon_keiyaku_naiyo_data.gempon_keiyaku_naiyo_id != request.keiyaku_naiyo_id) {
			$hasMaeKeiyakuFlg = true;
		}
		var tsugiResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoTsugiHimozukeData", request.keiyaku_naiyo_id);
		if (tsugiResult.countRow > 0) {
			$tsugi_keiyaku_naiyo_data = tsugiResult.data[0];
			$hasTsugiKeiyakuFlg = true;
		}
		// 元許諾の契約ステータスを取得
		var motoKeiyakuStatusData = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoMotoKeiyakuStatus", request.keiyaku_naiyo_id);

		$keiyaku_naiyo_data.moto_keiyaku_exists = false;
		if(motoKeiyakuStatusData.countRow >0){
			$keiyaku_naiyo_data.moto_keiyaku_list = motoKeiyakuStatusData.data;			
			$keiyaku_naiyo_data.moto_keiyaku_exists = true;
		}
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $keiyaku_naiyo_data);
		
		// 編集可能チェック // TODO 権限の確認
		if(!chkEditable($keiyaku_naiyo_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		var taskResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuUntreatedTaskData", request.keiyaku_naiyo_id);
		$keiyaku_naiyo_data.untreatedTask = taskResult.data[0];


		var commentResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentList", request.keiyaku_naiyo_id);
		$commentList = commentResult.data;
		if ($commentList.length > 0) {
			$hasComment = true;
		}
		
		
		var tempuFileResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveTempuFileList", request.keiyaku_naiyo_id);
		var fileList = tempuFileResult.data; // 全行取得

		var fileMap = {};
		for (var fileKey in fileList) {
			var file = fileList[fileKey];
			if ((file.task_id in fileMap) == false) {
				fileMap[file.task_id] = [];
			}
			fileMap[file.task_id].push(file);
		}
		
		for (var commentKey in $commentList) {
			var comment = $commentList[commentKey];
			if (comment.task_id in fileMap) {
				comment.fileList = fileMap[comment.task_id];
			} else {
				comment.fileList = [];
			}
		}
 
		$keiyaku_naiyo_data.registration_flg = false;
		
	} else {
		
		// BNE以外は表示させない
		if ($userInfo.bneFlg == '0') {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		$keiyaku_naiyo_data.keiyaku_naiyo_id = '';
		$keiyaku_naiyo_data.keiyaku_status = Constant.LO_KEIYAKU_STATUS_DRAFT; // '033':BNE作成中
		$keiyaku_naiyo_data.keiyaku_cls = Constant.LO_KEIYAKU_SHUBETSU_KOBETSU; // '1':個別
		$keiyaku_naiyo_data.tanto_data = ImJson.toJSONString({user_cd: ""}, false);
		$keiyaku_naiyo_data.keiyakusho_sofusaki_tanto_id = '';
		$keiyaku_naiyo_data.seikyusho_sofusaki_eda = '';
		$keiyaku_naiyo_data.untreatedTask = {task_id : ""};
		$keiyaku_naiyo_data.registration_flg = true;

	}
	
	if (!$keiyaku_naiyo_data.keiyaku_cls) {
		$keiyaku_naiyo_data.keiyaku_cls = Constant.LO_KEIYAKU_SHUBETSU_KOBETSU; // '1':個別
	}
	
	
	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $keiyakusho_hyodai_list, $keiyaku_naiyo_data.keiyakusho_hyodai);
	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $keiyakusho_baitai_list, $keiyaku_naiyo_data.keiyakusho_baitai);
	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $keiyaku_status_list, $keiyaku_naiyo_data.keiyaku_status);
	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $keiyaku_encho_cls_list, $keiyaku_naiyo_data.keiyaku_encho_cls);

    var keiyaku_encho_cls_ctl_list = [];
    keiyaku_encho_cls_ctl_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyaku_encho_cls_ctl_list, Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_CTL);
    
    var removeClsCds = [];
    for (var clsKey in $keiyaku_encho_cls_list) {
    	var cls = $keiyaku_encho_cls_list[clsKey];
	    for (var ctlKey in keiyaku_encho_cls_ctl_list) {
	    	var ctl = keiyaku_encho_cls_ctl_list[ctlKey];
	    	if (cls.value != ctl.value) {
	    		continue;
	    	}
	    	var isAuth = false;
			var ctlConfig = ImJson.parseJSON(ctl.label);
			for (var authKey in ctlConfig.authorizations) {
				var authPublicGroupCd = ctlConfig.authorizations[authKey];
				if (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", authPublicGroupCd)) {
					isAuth = true;
					break;
				}
			}
			if (!isAuth) {
				removeClsCds.push(cls.value);
			}
	    }
    }
    
	$keiyaku_encho_cls_list = $keiyaku_encho_cls_list.filter(function(element, index, self){
		var leave = removeClsCds.indexOf(element.value) == -1;
		if (leave == false && element.selected) {
			$keiyakuEnchoClsDisableFlg = true;
			return true;
		}
		return leave;
	});

	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $tsuika_seisan_cls_list, $keiyaku_naiyo_data.tsuika_seisan_cls);

	if ($keiyaku_naiyo_data.keiyaku_encho_cls) {
		$isReminding = true;
	}

	var kikakuRestraintValues = {
		kikaku_status : filterKikakuStatusList
		, kikaku_shubetsu_cd : [Number(Constant.LO_KIKAKU_SHUBETSU_MUSIC), Number(Constant.LO_KIKAKU_SHUBETSU_EVENT)]
	};
	var kyodakuRestraintValues = {
		kyodaku_status : filterKyodakuStatusList
	};
	var kawariRestraintValues = {
		kawari_status : filterKawariStatusList
	};
	
	if ($keiyaku_naiyo_data.kaisha_id) {
		kikakuRestraintValues.kaisha_id = $keiyaku_naiyo_data.kaisha_id
		kyodakuRestraintValues.kaisha_id = $keiyaku_naiyo_data.kaisha_id
		kawariRestraintValues.kaisha_id = $keiyaku_naiyo_data.kaisha_id
	}

	if ($keiyaku_naiyo_data.cnt_ky_ki > 0) {
		$kaisha_fix_flg = true;
	} else {
		$kaisha_fix_flg = false;
	}
	
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyaku_naiyo_data.cnt_ky_ki ' + $keiyaku_naiyo_data.cnt_ky_ki);

	$form.kikaku_restraint_values = ImJson.toJSONString(kikakuRestraintValues, false);
	$form.kyodaku_restraint_values = ImJson.toJSONString(kyodakuRestraintValues, false);
	$form.kawari_restraint_values = ImJson.toJSONString(kawariRestraintValues, false);

	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyaku_naiyo_data ' + ImJson.toJSONString($keiyaku_naiyo_data, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyakusho_hyodai_list ' + ImJson.toJSONString($keiyakusho_hyodai_list, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyaku_cls_list ' + ImJson.toJSONString($keiyaku_cls_list, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyakusho_baitai_list ' + ImJson.toJSONString($keiyakusho_baitai_list, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyaku_status_list ' + ImJson.toJSONString($keiyaku_status_list, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $licensee_tanto_list ' + ImJson.toJSONString($licensee_tanto_list, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $keiyaku_encho_cls_list ' + ImJson.toJSONString($keiyaku_encho_cls_list, true));
	
	Logger.getLogger().info(' [init]　契約内容確認表示 $commentList ' + ImJson.toJSONString($commentList, true));
	Logger.getLogger().info(' [init]　契約内容確認表示 $hasComment ' + $hasComment);
}

/**
 * 編集可能かチェック
 */
function chkEditable(data) {
	
	// ステータスチェック（編集可能なステータスかどうか）
/*
	if (data.kyodaku_status != Constant.LO_STATUS_ICHIJI_HOZON && data.kyodaku_status != Constant.LO_STATUS_SHUSEI_IRAI) {
		// 一時保存か修正依頼のみOK
		return false;
	}
*/

	// ライセンシー会社チェック（編集可能な所属グループかどうか）
	var userCompanyDepartment = $userInfo.userCompanyDepartment;
	var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
	if ($userInfo.licenseeFlg == '1' && data.kaisha_id == kaisha_id) {
		return true;
	}
	// 権限チェック（編集可能な所属グループかどうか：契約担当）
	if ($userInfo.bneFlg == '1') {
		return true;
	}
	// 権限チェック（編集可能な所属グループかどうか：IP担当者） // TODO IP担当者の判断方法
	
	return false;
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo"); 
	
}

/**
 * 企画情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuList(request) {

	if ('keiyaku_naiyo_id' in request){
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKikakuList", request.keiyaku_naiyo_id);
	}

}

/**
 * 許諾情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuList(request) {

	if ('keiyaku_naiyo_id' in request){
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKyodakuList", request.keiyaku_naiyo_id);
	}

}

/**
 * 代わり承認申請情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKawariList(request) {
	if ('keiyaku_naiyo_id' in request){
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKawariList", request.keiyaku_naiyo_id);
	}
}

/**
 * 稟議情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveRingiList(request) {
	if ('keiyaku_naiyo_id' in request){
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveRingiList", request.keiyaku_naiyo_id);
	}
}

/**
 * 会社属性情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKaishaData(request) {
	if ('kaisha_id' in request){
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKaishaData", request.kaisha_id);
	}

}

/**
 * ライセンシー担当情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveUserList(request) {
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveUserList", request.kaisha_id);
	}
}

/**
 * 契約書送付先情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakushoSofusakiList(request) {
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakushoSofusakiList", request.kaisha_id);
	}
}

/**
 * 請求書送付先情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveSeikyushoSofusakiList(request) {
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveSeikyushoSofusakiList", request.kaisha_id);
	}
}


function getSelectableValue(request) {

	$keiyakusho_hyodai_list = [];
	$keiyakusho_hyodai_list.push({label:"",value:"",selected:true});
	$keiyakusho_hyodai_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyakusho_hyodai_list, Constant.LO_CDCLS_KEIYAKUSHO_HYODAI);

	$keiyaku_cls_list = [];
    $keiyaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyaku_cls_list, Constant.LO_CDCLS_KEIYAKU_CLS);

	$keiyakusho_baitai_list = [];
	$keiyakusho_baitai_list.push({label:"",value:"",selected:true});
	$keiyakusho_baitai_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyakusho_baitai_list, Constant.LO_CDCLS_KEIYAKUSHO_BAITAI);

    $keiyaku_status_list = [];
    $keiyaku_status_list.push({label:"",value:"",selected:true});
    $keiyaku_status_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyaku_status_list, ($userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_STATUS_PR : Constant.LO_CDCLS_KEIYAKU_STATUS_LI));

    $licensee_tanto_list = [];

    $keiyaku_encho_cls_list = [];
    $keiyaku_encho_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyaku_encho_cls_list, ($userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_PR : Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_LI));

    var keiyaku_encho_cls_ctl_list = [];
    keiyaku_encho_cls_ctl_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyaku_encho_cls_ctl_list, Constant.LO_CDCLS_KEIYAKU_ENCHO_CLS_CTL);

    $tsuika_seisan_cls_list = [];
    $tsuika_seisan_cls_list.push({label:"",value:"",selected:true});
    $tsuika_seisan_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $tsuika_seisan_cls_list, Constant.LO_CDCLS_TSUIKA_SEISAN_CLS);
}

/*
function getKaishaKeiyakuCls(companyCd) {

	Logger.getLogger().info(' [getKaishaKeiyakuCls]　companyCd ' + companyCd);

	var sql = "" ;
	sql += "SELECT ";
	sql += "  ka.keiyaku_cls ";
	sql += "FROM ";
	sql += "  lo_m_kaisha AS ka ";
	sql += "WHERE " ; 
	sql += "  ka.sakujo_flg ='0' ";
	sql += "  AND ka.kaisha_id = ? ";
	
	
    var db = new TenantDatabase();
    var result = db.select(sql, [DbParameter.string(companyCd)], 0);
    if (result.countRow == 0) {
		return "";
	}

	return result.data[0].keiyaku_cls;
}
*/

function updateKeiyakuNaiyo(request, shinseiFlg) {

	//Logger.getLogger().info(' [updateKeiyakuNaiyo]　request ' + ImJson.toJSONString(request, true));

	var functionResult = persistKeiyakuNaiyo(request);
	
	if(shinseiFlg) {
		Client.set('before_apply_id',keiyakuNaiyoId);
	}
	
	return functionResult;
}

function persistKeiyakuNaiyo(request, gempon) {

	Logger.getLogger().info(' [persistKeiyakuNaiyo]　request ' + ImJson.toJSONString(request, true));
	//Logger.getLogger().info(' [persistKeiyakuNaiyo]　gempon ' + ImJson.toJSONString(gempon, true));

	// ユーザー情報読み込み
	loadUserInfo();
	var sysDate = new Date();
	
	var logicalDeleteArg = {sakujo_flg : "1"};
	logicalDeleteArg = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", logicalDeleteArg, false);

	var keiyakuNaiyoId;
	var functionResult = {
	    error: false,
	    keiyaku_naiyo_id: "",
		message: MessageManager.getMessage('KE02I012')
	};
	
	var toDate = function(value) {
		if (value == null) {
			return null;
		}
		if (value == "") {
			return null;
		}
		return new Date(value);
	}
	
	var keiyakuStatusBefore = "";
	var keiyakuStatusAfter = "";

	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('keiyaku_naiyo_data' in request){
			var data = request.keiyaku_naiyo_data;
			var upObject =  {
				keiyakusho_hyodai : data.keiyakusho_hyodai
				, keiyaku_cls : data.keiyaku_cls
				, keiyaku_naiyo_nm : data.keiyaku_naiyo_nm
				, ringi_sinsei_no : data.ringi_sinsei_no
				, ringi_sinsei_nm : data.ringi_sinsei_nm
				, homu_soudan_no : data.homu_soudan_no
				, keiyaku_hokan_no : data.keiyaku_hokan_no
				, saiteihosho_ryo : data.saiteihosho_ryo
				, sozai_seisaku_hi : data.sozai_seisaku_hi
				, keiyakusho_baitai : data.keiyakusho_baitai
				, ryoritsu : data.ryoritsu
				, keiyaku_status : data.keiyaku_status
				, keiyaku_biko : data.keiyaku_biko
				, kaisha_id : data.kaisha_id
				, kaisha_nm : data.kaisha_nm
				, busyo_id : data.busyo_id
				, busyo_nm : data.busyo_nm
				, licensee_keiyaku_tanto_id : data.licensee_keiyaku_tanto_id
				, licensee_keiyaku_tanto_nm : data.licensee_keiyaku_tanto_nm
				, keiyaku_teiketu_bi : toDate(data.keiyaku_teiketu_bi)
				, keiyaku_kaishi_bi : toDate(data.keiyaku_kaishi_bi)
				, keiyaku_manryo_bi : data.keiyaku_manryo_bi
				, kyodaku_chiiki : data.kyodaku_chiiki
				, biko : data.biko
				, keiyakusho_sofusaki_tanto_id: data.keiyakusho_sofusaki_tanto_id
				, seikyusho_sofusaki_eda: data.seikyusho_sofusaki_eda
			};

			if ($userInfo.bneFlg == '1') {
				var strSysDate = Content.executeFunction("lo/common_libs/lo_common_fnction", "getTodayAsString");
				upObject.saisyu_kakunin_bi = new Date(strSysDate);
			}

			if (!(typeof data.keiyaku_encho_cls === "undefined")) {
				upObject.keiyaku_encho_cls = data.keiyaku_encho_cls;
			}
			if (!(typeof data.tsuika_seisan_cls === "undefined")) {
				upObject.tsuika_seisan_cls = data.tsuika_seisan_cls;
			}

			keiyakuNaiyoId = data.keiyaku_naiyo_id;
			
			keiyakuStatusAfter = data.keiyaku_status;
			
			Logger.getLogger().info(' [persistKeiyakuNaiyo]　keiyakuNaiyoId ' + keiyakuNaiyoId);
			if (!keiyakuNaiyoId) {
				// 登録
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　!keiyakuNaiyoId ');
				keiyakuNaiyoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KEIYAKU);
				upObject.keiyaku_naiyo_id = keiyakuNaiyoId;
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　insertKeiyakuNaiyoData ' + ImJson.toJSONString(upObject, true));
				db.insert('lo_t_keiyaku_naiyo', upObject);

				var gemponData = {
					keiyaku_naiyo_id : keiyakuNaiyoId
					, gempon_keiyaku_naiyo_id : keiyakuNaiyoId
				};
				if (gempon) {
					gemponData.gempon_keiyaku_naiyo_id = gempon.gempon_keiyaku_naiyo_id;
					gemponData.mae_keiyaku_naiyo_id = gempon.mae_keiyaku_naiyo_id;
				}
				gemponData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", gemponData, true);
				//Logger.getLogger().info('[persistKeiyakuNaiyo] gemponData　' + ImJson.toJSONString(gemponData, true));

				db.insert('lo_t_keiyaku_naiyo_gempon_himozuke', gemponData);

				functionResult.keiyaku_naiyo_id = keiyakuNaiyoId;
				
			} else {
				// 更新前の契約ステータスを取得する
				var keiyakuDataBefore = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoData", keiyakuNaiyoId);
				keiyakuStatusBefore = keiyakuDataBefore.data[0]["keiyaku_status"];
				
				// 更新
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				functionResult.keiyaku_naiyo_id = keiyakuNaiyoId;
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateKeiyakuNaiyoData ' + ImJson.toJSONString(upObject, true));
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateKeiyakuNaiyoData key ' + keiyakuNaiyoId + ', ' + data.koushin_bi);
				var result = db.update('lo_t_keiyaku_naiyo', upObject, "keiyaku_naiyo_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(keiyakuNaiyoId), DbParameter.string(data.koushin_bi)]);
				if (result.countRow == 0) {
					// 排他エラー処理
					Logger.getLogger().error(' [persistKeiyakuNaiyo] 排他エラー　updateKeiyakuNaiyoData key ' + keiyakuNaiyoId + ', ' + data.koushin_bi);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E004');
					return functionResult;
				}
			}
		}

		if ('kikaku_list' in request) {
			var list = request.kikaku_list;
			var existsKikakuIds = [];
			for (var key in list) {
				var data = list[key];
				// 登録可能チェック
				if(!chkKikakuData(data.kikaku_id)) {
					Logger.getLogger().error(' [persistKeiyakuNaiyo] 企画登録不可エラー　updateKeiyakuNaiyoData key ' + keiyakuNaiyoId + ', kikaku_id:' + data.kikaku_id);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('KY02E042');
					return functionResult;
				}
				
				var upObject = {sakujo_flg : "0"};
			    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateKikakuData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_keiyaku_naiyo_kikaku_himozuke', upObject, "keiyaku_naiyo_id = ? AND kikaku_id = ?",[DbParameter.string(keiyakuNaiyoId), DbParameter.string(data.kikaku_id)]);
				if (result.countRow == 0) {
					upObject.keiyaku_naiyo_id = keiyakuNaiyoId;
					upObject.kikaku_id = data.kikaku_id;
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					//Logger.getLogger().info(' [persistKeiyakuNaiyo]　insertKikakuData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_keiyaku_naiyo_kikaku_himozuke', upObject);
				}
				existsKikakuIds.push(data.kikaku_id);
			}
			var deleteCondition = "keiyaku_naiyo_id = ? ";
			var deleteParams = [];
			deleteParams.push(DbParameter.string(keiyakuNaiyoId));
			if (existsKikakuIds.length > 0) {
				deleteCondition = deleteCondition + "AND kikaku_id NOT IN (";
				for (var key in existsKikakuIds) {
					if (key > 0) {
						deleteCondition = deleteCondition + ", ";
					}
					deleteCondition = deleteCondition + "?";
					deleteParams.push(DbParameter.string(existsKikakuIds[key]));
				}
				deleteCondition = deleteCondition + ")";
			}
			var result = db.update ('lo_t_keiyaku_naiyo_kikaku_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
		}

		if ('kyodaku_list' in request) {
			var list = request.kyodaku_list;
			var existsKyodakuIds = [];
			for (var key in list) {
				var data = list[key];
				// 登録可能チェック
				if(!chkKyodakuData(data.kyodaku_id)) {
					//Logger.getLogger().error(' [persistKeiyakuNaiyo] 許諾登録不可エラー　updateKeiyakuNaiyoData key ' + keiyakuNaiyoId + ', kyodaku_id:' + data.kyodaku_id);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('KY02E042');
					return functionResult;
				}
				
				var upObject = {sakujo_flg : "0"};
			    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateKyodakuData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_keiyaku_naiyo_kyodaku_himozuke', upObject, "keiyaku_naiyo_id = ? AND kyodaku_id = ?",[DbParameter.string(keiyakuNaiyoId), DbParameter.string(data.kyodaku_id)]);
				if (result.countRow == 0) {
					upObject.keiyaku_naiyo_id = keiyakuNaiyoId;
					upObject.kyodaku_id = data.kyodaku_id;
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					//Logger.getLogger().info(' [persistKeiyakuNaiyo]　insertKyodakuData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_keiyaku_naiyo_kyodaku_himozuke', upObject);
				}
				existsKyodakuIds.push(data.kyodaku_id);
			}
			var deleteCondition = "keiyaku_naiyo_id = ? ";
			var deleteParams = [];
			deleteParams.push(DbParameter.string(keiyakuNaiyoId));
			if (existsKyodakuIds.length > 0) {
				deleteCondition = deleteCondition + "AND kyodaku_id NOT IN (";
				for (var key in existsKyodakuIds) {
					if (key > 0) {
						deleteCondition = deleteCondition + ", ";
					}
					deleteCondition = deleteCondition + "?";
					deleteParams.push(DbParameter.string(existsKyodakuIds[key]));
				}
				deleteCondition = deleteCondition + ")";
			}
			var result = db.update ('lo_t_keiyaku_naiyo_kyodaku_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
		}

		if ('kawari_list' in request) {
			var list = request.kawari_list;
			var existsBunshoIds = [];
			for (var key in list) {
				var data = list[key];
				// 登録可能チェック
				if(!chkKawariData(data.bunsho_id)) {
					//Logger.getLogger().error(' [persistKeiyakuNaiyo] 代わり承認申請登録不可エラー　updateKeiyakuNaiyoData key ' + keiyakuNaiyoId + ', bunsho_id:' + data.bunsho_id);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('KY02E042');
					return functionResult;
				}
				
				var upObject = {sakujo_flg : "0"};
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateKawariData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_keiyaku_naiyo_kawari_himozuke', upObject, "keiyaku_naiyo_id = ? AND bunsho_id = ?",[DbParameter.string(keiyakuNaiyoId), DbParameter.string(data.bunsho_id)]);
				if (result.countRow == 0) {
					upObject.keiyaku_naiyo_id = keiyakuNaiyoId;
					upObject.bunsho_id = data.bunsho_id;
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					//Logger.getLogger().info(' [persistKeiyakuNaiyo]　insertKawariData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_keiyaku_naiyo_kawari_himozuke', upObject);
				}
				existsBunshoIds.push(data.bunsho_id);
			}
			var deleteCondition = "keiyaku_naiyo_id = ? ";
			var deleteParams = [];
			deleteParams.push(DbParameter.string(keiyakuNaiyoId));
			if ( existsBunshoIds.length > 0) {
				deleteCondition = deleteCondition + "AND bunsho_id NOT IN (";
				for (var key in existsBunshoIds) {
					if (key > 0) {
						deleteCondition = deleteCondition + ", ";
					}
					deleteCondition = deleteCondition + "?";
					deleteParams.push(DbParameter.string(existsBunshoIds[key]));
				}
				deleteCondition = deleteCondition + ")";
			}
			var result = db.update ('lo_t_keiyaku_naiyo_kawari_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
		}

		if (request.keiyaku_naiyo_data.keiyaku_naiyo_id) {
			Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "toMyTask", keiyakuNaiyoId, request.keiyaku_naiyo_data.task_id, request.keiyaku_naiyo_data.task_koushin_bi);
		} else {
			var recipients = [];
			recipients.push({
				recipientType : Constant.LO_RECIPIENT_TYPE_TO
				, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			    , userCd : $userInfo.userCd // ユーザコード
			});
			var keiyakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoData", keiyakuNaiyoId);
			var keiyakuNaiyoData = keiyakuResult.data[0]; // 一行だけ取得
			Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "newTask", keiyakuNaiyoData, recipients);
		}
		
		if ('ringi_sinsei_list' in request) {
			var list = request.ringi_sinsei_list;
			var existsRingiShinseiNoList = [];
			for (var key in list) {
				var data = list[key];
				
				var upObject = {sakujo_flg : "0"};
				upObject.keiyaku_naiyo_id = keiyakuNaiyoId;
				upObject.ringi_sinsei_no = data.ringi_sinsei_no;
				upObject.ringi_sinsei_nm = data.ringi_sinsei_nm;
				upObject.homu_soudan_no = data.homu_soudan_no;
				upObject.keiyaku_hokan_no = data.keiyaku_hokan_no;
				
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				//Logger.getLogger().info(' [persistKeiyakuNaiyo]　updateRingiData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_keiyaku_naiyo_ringi_himozuke', upObject, "keiyaku_naiyo_id = ? AND ringi_sinsei_no = ?",[DbParameter.string(keiyakuNaiyoId), DbParameter.string(data.ringi_sinsei_no)]);
				if (result.countRow == 0) {					
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					//Logger.getLogger().info(' [persistKeiyakuNaiyo]　insertRingiData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_keiyaku_naiyo_ringi_himozuke', upObject);
				}
				existsRingiShinseiNoList.push(data.ringi_sinsei_no);
			}
			var deleteCondition = "keiyaku_naiyo_id = ? ";
			var deleteParams = [];
			deleteParams.push(DbParameter.string(keiyakuNaiyoId));
			if ( existsRingiShinseiNoList.length > 0) {
				deleteCondition = deleteCondition + "AND ringi_sinsei_no NOT IN (";
				for (var key in existsRingiShinseiNoList) {
					if (key > 0) {
						deleteCondition = deleteCondition + ", ";
					}
					deleteCondition = deleteCondition + "?";
					deleteParams.push(DbParameter.string(existsRingiShinseiNoList[key]));
				}
				deleteCondition = deleteCondition + ")";
			}
			var result = db.update ('lo_t_keiyaku_naiyo_ringi_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
		}
		
		// ステータスが計上依頼に変更されたら、計上チームにメールを送信する
		if(keiyakuStatusBefore != Constant.LO_KEIYAKU_STATUS_ACCT_REQUEST && keiyakuStatusAfter == Constant.LO_KEIYAKU_STATUS_ACCT_REQUEST){		
			
			var sendAddress= {
				to : []
				, cc : []
			};
			
			var keijoTantoUsers = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever","retrievePublicGroupUsers",[Constant.LO_GROUP_CD_ACCOUNT]);
			
			for(var i in keijoTantoUsers){				
				sendAddress.to.push(keijoTantoUsers[i].email_address1);
			}
			
			// メール送信
			var param = {
				ticket_id : keiyakuNaiyoId
				, execUserCd : $userInfo.userCd
				, comment : request.comment
				, mail_id : Constant.LO_MAIL_ID_KEIYAKU_STATUS_UPDATE
				, to_address : sendAddress.to
				, cc_address : sendAddress.cc
			};
		
			Content.executeFunction("/lo/common_libs/lo_send_mail", "sedMailExce", param);
		}	
		
	});

	return functionResult;
}


/**
 * 契約内容削除（論理削除）
 */
function deleteKeiyakuNaiyo (param) {
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kyodaku_id : param.keiyaku_naiyo_id
	};
	
	// DB更新内容
	var dataSet = {
		sakujo_flg  : '1'
	}
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	//検索条件設定
	var whereObject = [DbParameter.string(param.keiyaku_naiyo_id), DbParameter.string(param.koushin_bi)];
	var result = {};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		// 許諾削除
		result = db.update('lo_t_keiyaku_naiyo', dataSet,"keiyaku_naiyo_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",whereObject);
		if (result.countRow == 0) {
			// 排他エラー処理
			ret.error = true;
			ret.message = MessageManager.getMessage('ER01E004');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		ret.altmsg = MessageManager.getMessage('KE02I002');
		ret.flag = 2;
	});
    return ret;
}

function createKeiyakuEnchoTicket(request) {
	
	var keiyakuNaiyoId = request.keiyaku_naiyo_id;
	var keiyakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoData", keiyakuNaiyoId);
	var keiyaku_naiyo_data = keiyakuResult.data[0]; // 一行だけ取得
	
	keiyaku_naiyo_data.keiyaku_naiyo_id = null;
	keiyaku_naiyo_data.keiyakusho_hyodai = Constant.LO_KEIYAKUSHO_HYODAI_ENCHO;
	keiyaku_naiyo_data.keiyakusho_baitai = null;
	keiyaku_naiyo_data.keiyaku_status = Constant.LO_KEIYAKU_STATUS_DRAFT;
	keiyaku_naiyo_data.ringi_sinsei_no = null;
	keiyaku_naiyo_data.ringi_sinsei_nm = null;
	keiyaku_naiyo_data.homu_soudan_no = null;
	keiyaku_naiyo_data.keiyaku_hokan_no = null;
	keiyaku_naiyo_data.keiyaku_encho_cls = null;
	keiyaku_naiyo_data.ryoritsu = null;

	var gemponResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoGemponHimozukeData", keiyakuNaiyoId);
	var gempon_data = gemponResult.data[0]; // 一行だけ取得
	var gempon = {
		gempon_keiyaku_naiyo_id : gempon_data.gempon_keiyaku_naiyo_id
		, mae_keiyaku_naiyo_id : keiyakuNaiyoId
	};

	var kikakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKikakuList", keiyakuNaiyoId);
	var kikaku_list = kikakuResult.data;

	var kyodakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKyodakuList", keiyakuNaiyoId);
	var kyodaku_list = kyodakuResult.data;
	
	var kawariResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKawariList", keiyakuNaiyoId);
	var kawari_list = kawariResult.data;
	
	var param = {};
	param.keiyaku_naiyo_data = keiyaku_naiyo_data;
	param.kikaku_list = kikaku_list;
	param.kyodaku_list = kyodaku_list;
	param.kawari_list = kawari_list;
	
	var functionResult = persistKeiyakuNaiyo(param, gempon);
	return functionResult;
}

	
/**
 * 登録可能企画データチェック
 * @param {String} 企画id
 */
function chkKikakuData(kikakuId) {
	var param = {kikaku_id: kikakuId};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  ki.kikaku_id ";
	sql += "FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "WHERE " ;
	sql += "  ki.sakujo_flg ='0' ";

	columnNameMap["kikaku_id"] = {col:"ki.kikaku_id",comp:"eq"};
	
	param.kikaku_status = filterKikakuStatusList;
	columnNameMap["kikaku_status"] = {col:"ki.kikaku_status",comp:"in"};
	
	
	// 会社チェック（登録はライセンシーのみのため所属グループチェックは省略） // TODO 要件等
	/*
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
	columnNameMap["kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"};
	*/
	
	// 条件設定
	var strParam=[];
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);

	// SQLの結果件数が0件の場合登録不可
	if (result.countRow == 0) {
		return false;
	} else {
		return true;
	}
}

/**
 * 登録可能許諾データチェック
 * @param {String} 企画id
 */
function chkKyodakuData(kyodakuId) {
	var param = {kyodaku_id: kyodakuId};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  ki.kyodaku_id ";
	sql += "FROM ";
	sql += "  lo_t_kyodaku AS ki ";
	sql += "WHERE " ;
	sql += "  ki.sakujo_flg ='0' ";

	columnNameMap["kyodaku_id"] = {col:"ki.kyodaku_id",comp:"eq"};
	
	param.kyodaku_status = filterKyodakuStatusList;
	columnNameMap["kyodaku_status"] = {col:"ki.kyodaku_status",comp:"in"};
	
	
	// 会社チェック（登録はライセンシーのみのため所属グループチェックは省略） // TODO 要件等
	/*
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
	columnNameMap["kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"};
	*/
	
	// 条件設定
	var strParam=[];
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);

	// SQLの結果件数が0件の場合登録不可
	if (result.countRow == 0) {
		return false;
	} else {
		return true;
	}
}

/**
 * 登録可能代わり承認申請データチェック
 * @param {String} 文書ID
 */
function chkKawariData(bunshoId) {
	var param = {bunsho_id: bunshoId};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  kw.bunsho_id ";
	sql += "FROM ";
	sql += "  lo_t_kawari AS kw ";
	sql += "WHERE " ;
	sql += "  kw.sakujo_flg ='0' ";

	columnNameMap["bunsho_id"] = {col:"kw.bunsho_id",comp:"eq"};
	
	param.kawari_status = filterKawariStatusList;
	columnNameMap["kawari_status"] = {col:"kw.kawari_status",comp:"in"};

	// 条件設定
	var strParam=[];
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);

	// SQLの結果件数が0件の場合登録不可
	if (result.countRow == 0) {
		return false;
	} else {
		return true;
	}
}

/**
 * 稟議申請番号一意チェック
 * @returns {boolean} true:一意 false:重複
 */
function chkRequiredRingiShinseiNo(ringiChkData) {
	var ret = {
	    error: true,
		message: MessageManager.getMessage('KE02E046')
	};
	var sql = "";
	var strParam=[];
	strParam.push(DbParameter.string(ringiChkData.ringiShinseiNo));
	if (ringiChkData.keiyakuNaiyoId && ringiChkData.keiyakuNaiyoId != null) {
		sql += "SELECT kn.keiyaku_naiyo_id FROM lo_t_keiyaku_naiyo kn WHERE ringi_sinsei_no = ? AND kn.keiyaku_naiyo_id <> ? AND sakujo_flg = '0'";
		strParam.push(DbParameter.string(ringiChkData.keiyakuNaiyoId));
	} else {
		sql += "SELECT kn.keiyaku_naiyo_id FROM lo_t_keiyaku_naiyo kn WHERE ringi_sinsei_no = ? AND sakujo_flg = '0'";
	}
    var db = new TenantDatabase();
    var result = db.select(sql, strParam);
	if (result.countRow != 0) {
		// 重複あり、NG
		ret.error = false;
	}
	return ret;
}

/**
 * ライセンシー変更対応
 * @param {String} kaishaId
 * @param {String} kaishaFixFlg
 */
function changeKaisha(kaishaId, kaishaFixFlg) {
	var kikakuRestraintValues = {
		kikaku_status : filterKikakuStatusList
		, kikaku_shubetsu_cd : [Number(Constant.LO_KIKAKU_SHUBETSU_MUSIC), Number(Constant.LO_KIKAKU_SHUBETSU_EVENT)]
	};
	var kyodakuRestraintValues = {
		kyodaku_status : filterKyodakuStatusList
	};
	$keiyaku_naiyo_data.kaisha_id = kaishaId;
	if ($keiyaku_naiyo_data.kaisha_id) {
		kikakuRestraintValues.kaisha_id = $keiyaku_naiyo_data.kaisha_id;
		kyodakuRestraintValues.kaisha_id = $keiyaku_naiyo_data.kaisha_id;
	}
	if (kaishaFixFlg == '1') {
		$kaisha_fix_flg = true;
	} else {
		$kaisha_fix_flg = false;
	}
	$form.kikaku_restraint_values = ImJson.toJSONString(kikakuRestraintValues, false);
	$form.kyodaku_restraint_values = ImJson.toJSONString(kyodakuRestraintValues, false);
	return;
}

/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KE02E";
	var message_last_num = 9;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}

/**
 * メール送信
 * 
 * @return {object} メッセージリスト
 */
function sendMail(request) {

	var functionResult = {
	    error: false,
		taskId: "",
		message: MessageManager.getMessage('KY02I012')
	};

	loadUserInfo();

	// ここで受け取る宛先は、個人を指す宛先ではない可能性があるため
	// タスク対象レコード作成後に個人宛先を特定する
	var recipients = [];
	for (var key in request.mail_user_list.mail_to) {
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			, userCd : request.mail_user_list.mail_to[key]
		});
	}

	for (var key in request.mail_user_list.mail_cc) {
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_CC
			, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			, userCd : request.mail_user_list.mail_cc[key]
		});
	}

	var sendAddress= {
		to : []
		, cc : []
	}

	
			

	// 重複と空白を削除
	sendAddress.to = sendAddress.to.filter(function (x, i, self) {
		return x && self.indexOf(x) === i;
    });
    sendAddress.cc = sendAddress.cc.filter(function (x, i, self) {
		return x && self.indexOf(x) === i;
    });

	// メール送信
	var param = {
		ticket_id : request.keiyakuNaiyoId
		, execUserCd : $userInfo.userCd
		, comment : request.comment
		, mail_id : Constant.LO_MAIL_ID_KEIYAKU_STATUS_UPDATE
		, to_address : sendAddress.to
		, cc_address : sendAddress.cc
	};

	Content.executeFunction("/lo/common_libs/lo_send_mail", "sedMailExce", param);

	return functionResult;
}
