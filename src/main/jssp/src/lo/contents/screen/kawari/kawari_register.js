Constant.load("lo/common_libs/lo_const");
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
var $form = {
	registration_flg : true
}; // 画面表示用変数
var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $validationErrorMessages = [];
var $kawari_data = {};
var $kyodaku_cls_list = []; //許諾種別コンボボックス
var $shohin_hansokubutsu_list = [];
var $shoshi_list = [];
var $hanbai_chiiki_list = [];
var $fileList =[];
var $filelistOnlyDisplay =[];
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $tmpFileStr = ""; //添付ファイルメッセージ
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $kyodakuShinseiMax = 0; //許諾申請上限
var $kawariDetailMax = 0; //許諾申請上限
var $kanrenBunshoMax = 0; //関連文書上限
var $shanaiShuseiFlg = false; // 社内修正フラグ

var $bunshoCls = "";

var $viewCtrl = {}; //表示制御用オブジェクト

var $koukai_hani_list = []; //公開範囲コンボボックス

var	$nodeUserslist = {};
var $mailDefUsers = {}; //ノード一覧

var $category_list = [];//カテゴリプルダウン	

var $kikaku_shubetsu_shohin = Constant.LO_KIKAKU_SHUBETSU_ITEM;//企画種別コード：商品
var $shohin_category_sonota = Constant.LO_KIKAKU_SHOHIN_CATEGORY_OTHER;//商品カテゴリーその他

var $new_window_flg = false; // 新規ウィンドウフラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　代わりWF編集画面表示 start');

	// ユーザー情報読み込み
	loadUserInfo();
	
	// ライセンシーの場合は表示させない	
	if($userInfo.licenseeFlg == '1'){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}

	// マスタから初期表示用情報を取得
	getSelectableValue(request);

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	//文書種別と文書番号の両方がない場合は、エラー画面へ遷移
	if(!("bunsho_cls" in request || 'bunsho_id' in request)){
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}
	
	
	if("bunsho_cls" in request){
		//リクエストパラメータから、申請区分を取得(4:新商品企画、5:商品化権使用許諾、6:LicenseProposal)
		$bunshoCls = request.bunsho_cls;
		
		var bunshoClsKawari = [Constant.LO_DOC_CLS_KAWARI_KIKAKU,
		                       Constant.LO_DOC_CLS_KAWARI_KYODAKU,
		                       Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL];		
		
		if(bunshoClsKawari.indexOf($bunshoCls) ==-1){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
	}		
	
	// 固定値マスタより詳細上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KAWARI_DETAIL_MAX);
	$kawariDetailMax = $tmpList[0];
	
	// 固定値マスタより関連文書上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KAWARI_KANREN_MAX);
	$kanrenBunshoMax = $tmpList[0];
	
	//添付ファイルメッセージ及び拡張子リスト取得
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_KAWARI_EXT);
    $extstr = "";
    for ( var i = 0; i < $extList.length; i++) {
    	if ($extstr == "") {
    		$extstr = $extList[i];
    	} else {
    		$extstr = $extstr + "/" + $extList[i];
    	}
    }
    $extListstr = $extstr.replace(/\./g, "");
    $extstr = MessageManager.getMessage('KY02I013', $extstr);
    $tmpFileStr = MessageManager.getMessage('KY02I014');
	
	// セッション削除
	Client.remove('before_apply_id');		

	if ('bunsho_id' in request){
		Logger.getLogger().info(' [init]　文書番号：'+request.bunsho_id);
		var kawariResult = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKawariData", request.bunsho_id);

		$kawari_data = kawariResult.data[0]; // 一行だけ取得		
		//Logger.getLogger().info(' [init]　'+ ImJson.toJSONString($kawari_data));		
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kawari_data);		
		
		//そのままimuiTextboxに渡すと桁あふれが発生することがあるので、文字列に変換
		$kawari_data.royalty_kingaku_genchi = $kawari_data.royalty_kingaku_genchi == null?null:$kawari_data.royalty_kingaku_genchi.toString();
		$kawari_data.kawase_rate = $kawari_data.kawase_rate == null?null:$kawari_data.kawase_rate.toString();
		$kawari_data.royalty_kingaku = $kawari_data.royalty_kingaku == null?null:$kawari_data.royalty_kingaku.toString();
		$kawari_data.saiteihosho_su_shinseisu = $kawari_data.saiteihosho_su_shinseisu == null?null:$kawari_data.saiteihosho_su_shinseisu.toString();
		$kawari_data.saiteihosho_ryo_kyodakuryo = $kawari_data.saiteihosho_ryo_kyodakuryo == null?null:$kawari_data.saiteihosho_ryo_kyodakuryo.toString();
		$kawari_data.sozai_hi = $kawari_data.sozai_hi == null?null:$kawari_data.sozai_hi.toString();
		
		var tempuFileResult = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveTempuFileList", request.bunsho_id);
		$fileList = tempuFileResult.data; // 全行取得

		//すでに文書番号が存在する場合は、フラグをfalseにする
		$kawari_data.registration_flg = false;
		
		$bunshoCls = $kawari_data.bunsho_cls;			
		
		// 修正依頼で差し戻された場合は案件情報の取得、それ以外（一時保存）の場合は、新規でセット
		//if ($kawari_data.kawari_status == Constant.LO_STATUS_SHUSEI_IRAI && $proc_user_flg) {
		if ($kawari_data.kawari_status == Constant.LO_STATUS_SHUSEI_IRAI || $kawari_data.kawari_status == Constant.LO_STATUS_SASHIMODOSHI
				|| $kawari_data.kawari_status == Constant.LO_STATUS_TEISHUTSU){
			if (!setMatterInfo($kawari_data)){				
				// ワークフローパラメータの設定
				Logger.getLogger().info(' [init]　!setMatterInfo($kawari_data) is false');
				setWorkflowOpenPage($kawari_data);						
			}else{
				Logger.getLogger().info(' [init]　!setMatterInfo($kawari_data) is true');
				//Logger.getLogger().info(' [init]　'+ ImJson.toJSONString($nodeUserslist));	
				if($nodeUserslist.kian && $nodeUserslist.kian.userCd =="---"){
					$nodeUserslist.kian = $nodeUserslist.apply;
				}
			}
			
		
		}else{
			Logger.getLogger().info(' [init]　代わり承認WF登録画面 新規申請');
			setWorkflowOpenPage($kawari_data);
			
			if($kawari_data.sairiyou_bunsho_id != null){
				//再利用元IDのノード情報を取得する
				setSairiyouNodeInfo($kawari_data.sairiyou_bunsho_id);
				//Logger.getLogger().info(' [init]再利用あり　'+ ImJson.toJSONString($nodeUserslist));	
			}else{
				$nodeUserslist.apply = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.kian = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_1 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_2 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_3 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_4 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_5 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.last_confirm = {"userName":"---","userCd":"---","execFlg":false};
			}
			
		}
	} else {

		$kawari_data.bunsho_id = '';
		$kawari_data.registration_flg = true;

		setWorkflowOpenPage($kawari_data);
	}
	
	// 新規登録時以外は、編集可能チェック
	if(!$kawari_data.registration_flg){
		// 編集可能チェック
		if(!chkEditable($kawari_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		//起案ノードかつステータスが受付中、差し戻しで、処理対象者の場合は、フラグをtrueにする
		if ($wf_data.imwNodeId == Constant.LO_NODE_KIAN
				&& ($kawari_data.kawari_status == Constant.LO_STATUS_TEISHUTSU || $kawari_data.kawari_status == Constant.LO_STATUS_SASHIMODOSHI) 
				&& $proc_user_flg
			) {
			$shanaiShuseiFlg = true;
		}
	}

	// 申請日に値がない場合は、システム日付を設定
	if ($kawari_data.shinsei_bi == null) {
		var dt = new Date();
		$kawari_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', dt);		
	}
	
	var filterKikakuStatusList = [
	    Constant.LO_STATUS_TEISHUTSU,
	    Constant.LO_STATUS_SHUSEI_IRAI,
	    Constant.LO_STATUS_SHINSEI,
	    Constant.LO_STATUS_SASHIMODOSHI,
	    Constant.LO_STATUS_SHONIN,
        Constant.LO_STATUS_SHONIN_OK,
	    Constant.LO_STATUS_KANRYO
	];
	$form.kikaku_restraint_values = ImJson.toJSONString({kikaku_status : filterKikakuStatusList}, false);
	
	
	// 企画種別リスト取得
    var kikakuClsList = [];
    kikakuClsList.push({label:"",value:"",selected:true});    	
    kikakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kikakuClsList, Constant.LO_CDCLS_KAWARI_KIKAKU_CLS);
    $form.kikaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", kikakuClsList, $kawari_data.kikaku_shubetsu_cd, Constant.LO_CDCLS_KAWARI_KIKAKU_CLS);
    
    var kyodakuClsList = [];
    kyodakuClsList.push({label:"",value:"",selected:true});
    kyodakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kyodakuClsList, Constant.LO_CDCLS_KYODAKU_CLS);
    $form.kyodaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", kyodakuClsList, $kawari_data.kyodaku_cls, Constant.LO_CDCLS_KYODAKU_CLS);
    
    var keiyakuClsList = [];
    keiyakuClsList.push({label:"",value:"",selected:true});
    keiyakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyakuClsList, Constant.LO_CDCLS_KEIYAKU_CLS);
    $form.keiyaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", keiyakuClsList, $kawari_data.keiyaku_cls, Constant.LO_CDCLS_KEIYAKU_CLS);
    
    $shohin_hansokubutsu_list = [];
	$shohin_hansokubutsu_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shohin_hansokubutsu_list, Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU);
	
	//地域・販売地域のプルダウン取得
	if($bunshoCls == Constant.LO_DOC_CLS_KAWARI_KIKAKU){
		$hanbai_chiiki_list = [];
	    $hanbai_chiiki_list.push({label:"",value:""});
	    $hanbai_chiiki_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hanbai_chiiki_list, Constant.LO_CDCLS_CHIIKI);
    
    }else if($bunshoCls == Constant.LO_DOC_CLS_KAWARI_KYODAKU){
    	$hanbai_chiiki_list = [];
        $hanbai_chiiki_list.push({label:"",value:""});
        $hanbai_chiiki_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hanbai_chiiki_list, Constant.LO_CDCLS_HANBAI_CHIIKI);
    }    
    
    $shoshi_list = [];
    $shoshi_list.push({label:"",value:"",selected:true});
    $shoshi_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoshi_list, Constant.LO_CDCLS_SHOSHI);

    $category_list = [];
    $category_list.push({label:"",value:"",selected:true});
    $category_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $category_list, Constant.LO_CDCLS_SHOHIN_CATEGORY);

    // 海外販社リスト取得
    var kaigaiHanshaList = [];
    //空欄なし
    //kaigaiHanshaList.push({label:"",value:"",selected:true});    	
    kaigaiHanshaList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kaigaiHanshaList, Constant.LO_CDCLS_KAIGAI_HANSHA);  
    $form.kaigaiHanshaList = Content.executeFunction("lo/common_libs/lo_common_fnction","selectedList",kaigaiHanshaList, $kawari_data.kaigai_hansha_cd, Constant.LO_CDCLS_KAIGAI_HANSHA);
    
    // 通貨リスト取得
    var currencyList = [];
    //空欄なし
    //currencyList.push({label:"",value:"",selected:true});    	
    currencyList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", currencyList, Constant.LO_CDCLS_CURRENCY);
    
    if($kawari_data.currency_cd == null){
    	$kawari_data.currency_cd = Constant.LO_CURRENCY_CD_DEFAULT;
    }
    
    $form.currencyList = Content.executeFunction("lo/common_libs/lo_common_fnction","selectedList",currencyList, $kawari_data.currency_cd, Constant.LO_CDCLS_CURRENCY);
    
    //表示制御に使用するフラグなどを設定する
    $viewCtrl.isKikaku = false;
	$viewCtrl.isKyodaku = false;
	$viewCtrl.isLicenseProposal = false;
	
    switch($bunshoCls){
    case Constant.LO_DOC_CLS_KAWARI_KIKAKU:
    	$viewCtrl.isKikaku = true;    	
    	break;
	case Constant.LO_DOC_CLS_KAWARI_KYODAKU:
		$viewCtrl.isKyodaku = true;
		break;
	case Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL:
		$viewCtrl.isLicenseProposal = true;
    	break;
    default:
    	break;
    }
    
    $koukai_hani_list.push({label:"全社公開",value:"0",selected:false});
    if($kawari_data.gokuhi_flg == "1"){
    	$koukai_hani_list.push({label:"経路上公開",value:"1",selected:true});
    }else{
    	$koukai_hani_list.push({label:"経路上公開",value:"1",selected:false});
    }
    
    getSettingMailUsers($kawari_data.bunsho_id);

	//Logger.getLogger().info(' [init]代わり承認編集画面表示 end　 $kawari_data ' + ImJson.toJSONString($kawari_data, true));
	Logger.getLogger().info(' [init]代わり承認編集画面表示　 end');
}

/**
 * 社内修正であるかチェック
 */
function chkShanaiShusei(kyodakuStatus) {
	// BNE担当グループに所属しているかを確認
	var bneTantoShozokuFlg = Content.executeFunction( "lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_APPR_0);
	if (bneTantoShozokuFlg) {
		if (kyodakuStatus == Constant.LO_STATUS_TEISHUTSU || kyodakuStatus == Constant.LO_STATUS_SASHIMODOSHI) {
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
	if (data.kawari_status != Constant.LO_STATUS_ICHIJI_HOZON &&
			data.kawari_status != Constant.LO_STATUS_SHUSEI_IRAI &&
			data.kawari_status != Constant.LO_STATUS_SASHIMODOSHI &&
			data.kawari_status != Constant.LO_STATUS_TEISHUTSU) {
		// 一時保存,修正依頼,差し戻し,受付中OK
		return false;
	}

	if (data.kawari_status == Constant.LO_STATUS_ICHIJI_HOZON && data.koushin_sha != $userInfo.userCd) {
		// 一時保存か修正依頼のみOK
		return false;
	}
	
	if (data.kawari_status == Constant.LO_STATUS_SHUSEI_IRAI && data.nyuryoku_sha_id != $userInfo.userCd) {
		// 一時保存か修正依頼のみOK
		return false;
	}	
	
	if ((data.kawari_status == Constant.LO_STATUS_TEISHUTSU || data.kawari_status == Constant.LO_STATUS_SASHIMODOSHI) && !$proc_user_flg) {
		// 起案者のみOK
		return false;
	}
	
	return true;
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "getUserInfo"); 
}

function getSelectableValue(request) {

	var keiyakuClsList = [];
    keiyakuClsList.push({label:"",value:"",selected:true});
    keiyakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyakuClsList, Constant.LO_CDCLS_KEIYAKU_CLS);
	//$form.keiyaku_cls_list = keiyakuClsList;

    var kyodakuClsList = [];
    kyodakuClsList.push({label:"",value:"",selected:true});
    kyodakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", kyodakuClsList, Constant.LO_CDCLS_KYODAKU_CLS);
	//$form.kyodaku_cls_list = kyodakuClsList;
    
	
}


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

function updateKawari(request, shinseiFlg) {
	Logger.getLogger().info(' [updateKawari]　updateKawari start');
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ユーザー情報読み込み
	loadUserInfo();
	var sysDate = new Date();
	
	var logicalDeleteArg = {sakujo_flg : "1"};
	logicalDeleteArg = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", logicalDeleteArg, false);

	var isShanaiShusei = chkShanaiShusei(request.kyodaku_status);
	var shuseiKomokuChar = "修正項目：";
	var shuseiMaeChar = "[ 修正前 ]：\r\n";
	var shuseiGoChar =  "[ 修正後 ]：\r\n";
	var lineBreakChar = "\r\n";
	var autoSabunCommentObj = {kyodakuInfo : [], shohinInfo : []};

	var bunshoId;
	var functionResult = {
	    error: false,
		bunsho_id: "",
		message: MessageManager.getMessage('KY02I012')
	};
	
	//Logger.getLogger().info(' [updateKawari]　updateKawariData ' + ImJson.toJSONString(request, true));
	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('kawari_data' in request){
			var data = request.kawari_data;
			var kawari_status = request.kawari_status;
			var upObject = {};
				
			upObject.bunsho_cls = data.bunsho_cls;
			upObject.gokuhi_flg = data.gokuhi_flg == null ? '0':data.gokuhi_flg;
			upObject.ip_cd = data.ip_cd;
			upObject.ip_nm = data.ip_nm;
			upObject.title_cd = data.title_cd;
			upObject.title_nm = data.title_nm;
			upObject.kaisha_id = data.kaisha_id;
			upObject.kaisha_nm = data.kaisha_nm;
			
			switch(data.bunsho_cls){
			case Constant.LO_DOC_CLS_KAWARI_KIKAKU:
				if(data.kikaku_shubetsu_cd !=""){
					upObject.kikaku_shubetsu_cd = data.kikaku_shubetsu_cd;				
				}
				
				upObject.hatsubai_jiki = data.hatsubai_jiki != null ?new Date(data.hatsubai_jiki):null;
				
				upObject.royalty_kingaku = data.royalty_kingaku !== "" ?chgNum(data.royalty_kingaku):null;
				break;
			case Constant.LO_DOC_CLS_KAWARI_KYODAKU:
				upObject.kyodaku_cls = data.kyodaku_cls;
				upObject.keiyaku_cls = data.keiyaku_cls;
				upObject.kyodaku_kikan_from = data.kyodaku_kikan_from;
				upObject.kyodaku_kikan_to = data.kyodaku_kikan_to;
				upObject.sozai_hi = chgNum(data.sozai_hi);
				upObject.saiteihosho_su_shinseisu = chgNum(data.saiteihosho_su);
				upObject.saiteihosho_ryo_kyodakuryo = chgNum(data.saiteihosho_ryo);
				
				upObject.hatsubai_bi = data.hatsubai_bi != null ?new Date(data.hatsubai_bi):null;
				break;
			case Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL:
				
				if(data.kikaku_shubetsu_cd !=""){
					upObject.kikaku_shubetsu_cd = data.kikaku_shubetsu_cd;				
				}
				
				upObject.kaigai_hansha_cd = data.kaigai_hansha_cd;
				
				upObject.royalty_kingaku_genchi = chgNum(data.royalty_kingaku_genchi);				
				upObject.currency_cd = chgNum(data.currency_cd);
				upObject.kawase_rate = chgNum(data.kawase_rate);
				upObject.haibun_rate = chgNum(data.haibun_rate);
				upObject.royalty_kingaku = data.royalty_kingaku !== "" ?chgNum(data.royalty_kingaku):null;
				upObject.royalty_kingaku_biko = data.royalty_kingaku_biko;
				
				upObject.kyodaku_kikan_from = data.kyodaku_kikan_from;
				upObject.kyodaku_kikan_to = data.kyodaku_kikan_to;
				
				upObject.hatsubai_jiki = data.hatsubai_jiki != null ?new Date(data.hatsubai_jiki):null;
			break;	

			}		
			
			
			upObject.shinsei_bi = new Date(data.shinsei_bi);
			upObject.bunsho_nm = data.bunsho_nm;
			upObject.naiyo = data.naiyo;
			upObject.biko = data.biko;
			
			upObject.kawari_status = kawari_status;		
			
			
            bunshoId = data.bunsho_id;
			Logger.getLogger().info(' [updateKawari]　文書番号： ' + bunshoId);
			if (!bunshoId) {
				// 登録
				var header = '';
				
				switch(data.bunsho_cls){
					case Constant.LO_DOC_CLS_KAWARI_KIKAKU:
						header = Constant.LO_TICKET_ID_HEAD_KAWARI_KIKAKU;
						break;
					case Constant.LO_DOC_CLS_KAWARI_KYODAKU:
						header = Constant.LO_TICKET_ID_HEAD_KAWARI_KYODAKU;
						break;
					case Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL:
						header = Constant.LO_TICKET_ID_HEAD_KAWARI_LICENSE_PROPOSAL;
						break;
					default:
						break;					
				
				}
				
				//insert時のみ、入力者、起案者を登録
				upObject.nyuryoku_sha_id = $userInfo.userCd;
				upObject.nyuryoku_sha_nm = $userInfo.userName;
				
				//入力者ではない場合は、起案者にもログインユーザの情報セットする
				if($userInfo.kawariInputFlg =="0"){
					upObject.kian_sha_id = $userInfo.userCd;
					upObject.kian_sha_nm = $userInfo.userName;				
				}else{
					upObject.kian_sha_id = null;
					upObject.kian_sha_nm = null;		
				}

				bunshoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", header);
				upObject.bunsho_id = bunshoId;				

				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
				
				//代わり承認テーブルにinsert
				db.insert('lo_t_kawari', upObject);
				functionResult.bunsho_id = bunshoId;
				Logger.getLogger().info(' [updateKawari] insert kawari 文書番号：'+bunshoId);				
				
			} else {				
				Logger.getLogger().info(' [updateKawari] update kawari 文書番号：'+bunshoId);
				// 更新
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				functionResult.bunsho_id = bunshoId;
				
	         	var result = db.update('lo_t_kawari', upObject, "bunsho_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(bunshoId), DbParameter.string(data.koushin_bi)]);
	         	
				if (result.countRow == 0) {
					// 排他エラー処理
					Logger.getLogger().error(' [updateKawari] 排他エラー　updateKawariData key ' + bunshoId + ', ' + data.koushin_bi);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E004');
					return;
				}			

			}
			
			
			if ('kyodaku_shohin_list' in request) {	
				updateKawariDetail(db,request.kyodaku_shohin_list,bunshoId,data.bunsho_cls);						
			}
			
			if ('kikaku_shohin_list' in request) {	
				updateKawariDetail(db,request.kikaku_shohin_list,bunshoId,data.bunsho_cls);						
			}
			
			if ('kanren_list' in request) {	

				var list = request.kanren_list;
				db.remove("lo_t_kawari_kanren_bunsho", "bunsho_id ='"+bunshoId+"'");
				var idx = 1;
				for (var key in list) {
					var kanrenData = list[key];
					
					var kanrenBunshoId = kanrenData.kanren_bunsho_id;					

					var upObject =  {
						kanren_bunsho_id : kanrenBunshoId
						, bunsho_id : bunshoId
						, bunsho_edaban : idx
						, bunsho_cls : kanrenData.bunsho_cls
						, sakujo_flg : '0'	
				    };				
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					
				    var result = db.insert ('lo_t_kawari_kanren_bunsho', upObject);
				    
				    idx++;
				}					
			}
			
			if ('tempu_file_list' in request) {
				updateKawariTemp(db,request.tempu_file_list,bunshoId,data.bunsho_cls);
			}
	}
		
	});
	
	
	//if (!chkShanaiShusei(request.kyodaku_status)) {
		if(shinseiFlg) {
			Client.set('before_apply_id',bunshoId);
			Logger.getLogger().info(" Client.set('before_apply_id',bunshoId); " + bunshoId);
		}
	//}

	return functionResult;
}

/**
 * 代わり承認削除（論理削除）
 */
function deleteKawari (param) {
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		bunsho_id : param
	};
	
	// DB更新内容
	var dataSet = {
		sakujo_flg  : '1',
		kawari_status  : Constant.LO_STATUS_SAKUJO
	}
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	//検索条件設定
	//var whereObject = [DbParameter.string(param.bunsho_id), DbParameter.string(param.koushin_bi)];
	var whereObject = [DbParameter.string(param.bunsho_id),DbParameter.string(param.koushin_bi)];
	var result = {};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		// 論理削除
		Logger.getLogger().info(' [deleteKawari] 文書番号：'+param.bunsho_id);
		result = db.update('lo_t_kawari', dataSet,"bunsho_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",whereObject);
		//result = db.update('lo_t_kawari', dataSet,"bunsho_id = ?",whereObject);
		if (result.countRow == 0) {
			// 排他エラー処理
			ret.error = true;
			ret.message = MessageManager.getMessage('ER01E004');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		ret.altmsg = MessageManager.getMessage('KS02I001');
		ret.flag = 2;
	});
    return ret;
}

/**
 * 登録可能企画データチェック
 * @param {String} 企画id
 * @param {boolean} 社内修正フラグ
 */
function chkKikakuData(kikakuId, isShanaiShuseiFlg) {
	var param = {kikaku_id: kikakuId};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  ki.kikaku_id ";
	sql += "FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "WHERE " ;
	sql += "  ki.sakujo_flg ='0' ";
	sql += "  AND ki.kikaku_status NOT IN ";
	sql += " ('" + Constant.LO_STATUS_ICHIJI_HOZON + "'";
	sql += " , '" + Constant.LO_STATUS_JITAI + "'";
	sql += " , '" + Constant.LO_STATUS_HIKETSU + "'";
	sql += " , '" + Constant.LO_STATUS_IKO + "'";
	sql += " ) ";
	
	columnNameMap["kikaku_id"] = {col:"ki.kikaku_id",comp:"eq"};
	
	// 社内修正時は会社コードを指定しない
	if (!isShanaiShuseiFlg) {
		// 会社チェック（登録はライセンシーのみのため所属グループチェックは省略）
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		columnNameMap["kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"};
	}
	
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
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KS02E";
	var message_last_num = 94;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {String} 企画id
 */
function setWorkflowOpenPage(kawariData) {

	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定
	
	var orgParams = {"bunsho_id":kawariData.bunsho_id,	                 
	                 "registration_flg":kawariData.registration_flg
	                 };
	
	//Logger.getLogger().info(' [setWorkflowOpenPage]　kawariData ' + ImJson.toJSONString(kawariData, true));

    // ワークフローに関するパラメータを保持します
    $wf_data = {
        imwGroupId              : '',		//グループ ID 
        imwUserCode             : '',		//処理者CD
        imwPageType             : '0',		//画面種別
        imwUserDataId           : '',		//ユーザデータ ID
        imwSystemMatterId       : '',		//システム案件ID
        imwNodeId               : Constant.LO_NODE_ID,	//ノード ID 
        imwArriveType           : '',		//到達種別
        imwAuthUserCode         : user_cd,	//権限者CD 
        imwApplyBaseDate        : Content.executeFunction("lo/common_libs/lo_common_fnction","getTodayAsString"),	//申請基準日
        imwContentsId           : '',		//コンテンツ ID
        imwContentsVersionId    : '',		//コンテンツバージョン ID 
        imwRouteId              : '',		//ルート ID
        imwRouteVersionId       : '',		//ルートバージョン ID
        imwFlowId               : Constant.LO_FLOW_KAWARI,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/kawari/kawari_list',	//呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString(orgParams),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };    	

}


/**
 * 新規申請時、ワークフローのノード処理対象者を設定
 * @returns {String} ノード設定値
 */
function nodeSetting(userObj){
	
	// imartパラメータ生成
	var nodeSetting = {"DCNodeSetting" : {}}; //動的承認ノード設定

	var processTargetConfigs = []; //処理対象プラグイン情報
	// ノードごとにユーザを設定	
	var nodeId="";
	
	for(var i in userObj){
		switch(i){
		case "kian":
			nodeId = Constant.LO_NODE_KIAN;
			break;
		case "appr_1":
			nodeId = Constant.LO_NODE_APPR_1;
			break;
		case "appr_2":
			nodeId = Constant.LO_NODE_APPR_2;
			break;
		case "appr_3":
			nodeId = Constant.LO_NODE_APPR_3;
			break;
		case "appr_4":
			nodeId = Constant.LO_NODE_APPR_4;
			break;
		case "appr_5":
			nodeId = Constant.LO_NODE_APPR_5;
			break;
		case "last_confirm":
			nodeId = Constant.LO_NODE_LAST_CONFIRM;
			break;
		default:
			nodeId = "";
			break;
		}
		
		processTargetConfigs = [];
		
		//申請ノードは動的承認ノードではないのでセット不要
		if(nodeId !=""){
			var userconf = {
					"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
				    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.user",
				    "parameter" : userObj[i].userCd
			};
		}
		
		processTargetConfigs.push(userconf);
		
		// ノード名と処理対象プラグイン情報を設定
		nodeSetting.DCNodeSetting[nodeId] = {"displayFlag" : true, "processTargetConfigs":processTargetConfigs};
	}

    // JSON側でパラメータに渡す
	return ImJson.toJSONString(nodeSetting);

}
	 
/**
 * 案件情報の設定
 * @param {String} 文書id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(kawariData) {
	Logger.getLogger().info(' [setMatterInfo]　start');
	var wfResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "setMatterInfo", kawariData, $userInfo);
	
	$wf_data = wfResult.wf_data;
	
	var systemMatterId = wfResult.systemMatterId;
    var type = wfResult.type;
    var nodeId = wfResult.wf_data.imwNodeId;   
    
    $nodeUserslist = wfResult.nodeUserslist;
    
    $proc_user_flg = wfResult.proc_user_flg;
    Logger.getLogger().info(' $proc_user_flg'+ $proc_user_flg);
    Logger.getLogger().info(' [setMatterInfo]　end');
    return true;
}

/**
 * 承認ノードの差戻先を固定
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function backNodeSetteing(nodeid){
	// 現在のノードIDから戻し先を判断
	var node = {};
	node[Constant.LO_NODE_APPR_0] = Constant.LO_NODE_APPLY;		// BNE担当→申請
	node[Constant.LO_NODE_APPR_1] = Constant.LO_NODE_APPR_0;	// 承認1→BNE担当
	node[Constant.LO_NODE_APPR_2] = Constant.LO_NODE_APPR_0;	// 承認2→BNE担当
	node[Constant.LO_NODE_APPR_3] = Constant.LO_NODE_APPR_0;	// 承認3→BNE担当
	node[Constant.LO_NODE_KEIYAKU] = Constant.LO_NODE_APPR_0;	// 契約担当→BNE担当
	node[Constant.LO_NODE_KEIJOU] = Constant.LO_NODE_APPR_0;	// 計上担当→BNE担当
	node[Constant.LO_NODE_APPR_LAST] = Constant.LO_NODE_APPLY;	// 最終承認→申請
	
	var backnode =node[nodeid];

	return backnode;
}

/**
 * 再利用するノード情報を取得
 * @param {String} 再利用元文書ID
 * @returns {String} 戻り先ノードid
 */
function setSairiyouNodeInfo(bunshoId) {
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(bunshoId));    
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam,0);
    
    //Logger.getLogger().info(' [setSairiyouNodeInfo]　再利用情報取得SQL '+ sql + ImJson.toJSONString(strParam, true));
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	Logger.getLogger().info(' [setSairiyouNodeInfo]　再利用元node情報が存在しません ');
    	return false;
    }    
    
    var systemMatterId = result.data[0].system_matter_id;
    
	//完了案件はワークフローの設定の必要なし
	var cplMatterObj = new CplMatter('ja', systemMatterId);
	var flowInfo = cplMatterObj.getExecFlow().data;
	var nodeInfoList = flowInfo.nodes;
	//Logger.getLogger().info(' [setSairiyouNodeInfo]　nodeInfoList '+ ImJson.toJSONString(nodeInfoList, true) );
	// ノード情報取得
    var cplMatter = new CplMatterNode('ja', systemMatterId);
	for (var idx = 0; idx < nodeInfoList.length; idx++) {
		if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPLY) {
			//Logger.getLogger().info('入力あり');
		    // 申請ノードには、ログイン者の情報を入れる				
		    //$nodeUserslist.apply = {"userCd":$userInfo.userCd,"userName":$userInfo.userName};
		    // 申請ノードの最後の処理者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);			
		    $nodeUserslist.apply = getProcessTargetName(result);
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_KIAN) {
			//Logger.getLogger().info('起案あり');
		    // 起案ノードの最後の処理者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_KIAN);			
		    $nodeUserslist.kian = getProcessTargetName(result);
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_1) {
			//Logger.getLogger().info('承認1あり');
		    // 承認１ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPR_1);
			$nodeUserslist.appr_1 = getProcessTargetName(result);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_2) {
			//Logger.getLogger().info('承認2あり');
		    // 承認2ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPR_2);			
			$nodeUserslist.appr_2 = getProcessTargetName(result );
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_3) {
			//Logger.getLogger().info('承認3あり');
			// 承認3ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPR_3);			
			$nodeUserslist.appr_3 = getProcessTargetName(result );
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_4) {
			// 承認4ノードの処理対象者を取得
			//Logger.getLogger().info('承認4あり');
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPR_4);			
			$nodeUserslist.appr_4 = getProcessTargetName(result );
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_5) {
			//Logger.getLogger().info('承認5あり');
			// 承認5ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_APPR_5);
			$nodeUserslist.appr_5 = getProcessTargetName(result );			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_LAST_CONFIRM) {
			//Logger.getLogger().info('最終確認あり');
			//最終確認は再利用不要
		    var result = cplMatter.getProcessHistoryList(Constant.LO_NODE_LAST_CONFIRM);			
			$nodeUserslist.last_confirm = getProcessTargetName(result );
		}
	}
	
	//起案者の場合は、入力ノードの情報をコピーする
	//再利用元の情報をそのまま表示するため、コメントアウト

	if(!$nodeUserslist.kian){
		$nodeUserslist.kian = $nodeUserslist.apply;
	}

	
	//ワークフローパラメータをセット
	$wf_data.imwNodeSetting = nodeSetting($nodeUserslist);
	
    return true;
}

// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessTargetName(result) {
	var names={};
	if (result.data){
    	for (var i=0;i < result.data.length;i++){
    		if (result.data[i].authUserName) {
          		 names = {"userName":result.data[i].authUserName,"userCd":result.data[i].executeUserCode};
    		} else {
       		 	names = {"userName":result.data[i].processTargetName,"userCd":result.data[i].executeUserCode};
    		}
    	}
    	//return names.join('、');
    	return names;
    }else{
    	return '';
    }
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
 * 関連文書情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKanrenbunshoList(request) {

	if ('bunsho_id' in request){
		return Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKanrenbunshoList", request.bunsho_id);
	}

}

/**
 * テーブルから設定済みのメールユーザ取得
 * 
 * @param {object} 申請情報
 */
function getSettingMailUsers(bunsho_id) {
	
	//　チケットid取得
	var ticket_id = "";
		
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';
	mail_group_list[Constant.LO_MAIL_GROUP_SHOHYO]='mail_2';
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIYAKU]='mail_4';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIJOU]='mail_5';
	
	// todo 多言語対応
	var locale_id = 'ja';

	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+="    m.mail_group ";
	sql+="   ,u.user_cd ";
	sql+="   ,u.user_name ";
	sql+=" FROM lo_t_sendmail m ";
	sql+=" INNER JOIN imm_user u ";
	sql+="    ON m.user_cd = u.user_cd ";
	sql+="   AND u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+=" WHERE m.sakujo_flg = '0' ";
	sql+="   AND m.ticket_id = ? ";
	
    var strParam = [];
    strParam.push(DbParameter.string(bunsho_id));

    // ユーザ名取得
	var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    if (result.countRow > 0){
    	var data = result.data;
    	for (var i = 0;i < data.length;i++){
    		// グループコーを画面表示用のキーに変換
    		var mailkey = mail_group_list[data[i].mail_group];
    		if (typeof mailkey === "undefined"){
    			continue;
    		}
    		// デフォルトメールユーザを格納
    		var obj = {user_cd:data[i].user_cd,user_name:data[i].user_name};
    		if (mailkey in $mailDefUsers){
        		$mailDefUsers[mailkey].push(obj);
    		}else{
        		$mailDefUsers[mailkey] = [obj];
    		}
    	}
    }
    
    //設定されていない通知先は---で埋める
    for(var t in mail_group_list){
	    if(!(mail_group_list[t] in $mailDefUsers)){
	    	$mailDefUsers[mail_group_list[t]] = [{user_cd:"---",user_name:"---"}];
	    }
    }
    
    //Logger.getLogger().info('$mailDefUsers '+ ImJson.toJSONString($mailDefUsers, true));    

}

/**
 * 商品情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuShohinList(request) {

	if ('bunsho_id' in request){
		return Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKyodakuShohinList", request.bunsho_id);
	}

}

/**
 * 商品情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuShohinList(request) {

	if ('bunsho_id' in request){
		return Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKikakuShohinList", request.bunsho_id);
	}

}

/**
 * 代わり承認詳細情報更新
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function updateKawariDetail(db,list,bunshoId,bunsho_cls) {
	
	//delete→insert
	db.remove("lo_t_kawari_detail", "bunsho_id ='"+bunshoId+"'");
	
	var idx = 1;
	for (var key in list) {

		var upObject = list[key];						
		
	    upObject.bunsho_id = bunshoId;
	    upObject.bunsho_edaban = idx;
	    upObject.sakujo_flg = '0';
	    upObject.bunsho_cls = bunsho_cls;
	    //dateに変換
	    upObject.hatsubai_bi = upObject.hatsubai_bi != null ?new Date(upObject.hatsubai_bi):null;
	    
	    var shokai_seisanyotei_su = upObject.shokai_seisanyotei_su != null ? Math.ceil(upObject.shokai_seisanyotei_su) :null;
	    upObject.shokai_seisanyotei_su = upObject.shokai_seisanyotei_su == shokai_seisanyotei_su ?shokai_seisanyotei_su:null;
	    
	    var mokuhyo_hanbai_su = upObject.mokuhyo_hanbai_su != null ? Math.ceil(upObject.mokuhyo_hanbai_su) :null;
	    upObject.mokuhyo_hanbai_su = upObject.mokuhyo_hanbai_su == mokuhyo_hanbai_su ?mokuhyo_hanbai_su:null;
	    
	    var mihon_suryo = upObject.mihon_suryo != null ? Math.ceil(upObject.mihon_suryo) :null;
	    upObject.mihon_suryo = upObject.mihon_suryo == mihon_suryo ?mihon_suryo:null;
	    
		upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
		
	    var result = db.insert ('lo_t_kawari_detail', upObject);
	    
	    idx++;
	}
	
	return result;
}


/**
 * 代わり承認添付情報更新
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function updateKawariTemp(db,list,bunshoId,bunsho_cls) {

	var tempuFileResult = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveTempuFileList", bunshoId);
	var publicFilePaths = [];
	for (var idx = 0; idx < tempuFileResult.data.length; idx++) {
		publicFilePaths.push(tempuFileResult.data[idx].file_path);
	}
	
	var paramFilePaths = [];
	var maxFileNo = 0;
	for (var key in list) {
		var data = list[key];
		var fileName = data.file_path.split("/").reverse()[0];
		paramFilePaths.push(data.file_path);
		var upObject =  {
			file_name : data.file_name
			, file_path : bunshoId + "/" + fileName
			, sakujo_flg : "0"
	    };
	    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
		
		var result = db.update('lo_t_kawari_tempu_file', upObject, "bunsho_id = ? AND file_no = ?",[DbParameter.string(bunshoId), DbParameter.number(data.file_no)]);
		if (result.countRow == 0) {
			upObject.bunsho_id = bunshoId;
			upObject.file_no = data.file_no;
			upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);

			db.insert('lo_t_kawari_tempu_file', upObject);
		}
		if (data.file_no > maxFileNo) {
			maxFileNo = data.file_no;
		}
	}
	
	var logicalDeleteArg = {sakujo_flg : "1"};
	logicalDeleteArg = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", logicalDeleteArg, false);
	var result = db.update ('lo_t_kawari_tempu_file', logicalDeleteArg, "bunsho_id = ? AND file_no > ?" ,[DbParameter.string(bunshoId), DbParameter.number(maxFileNo)]);

	// 新規にアップロードされたファイルをセッションストレージからパブリックストレージへ
	var newFilePaths = paramFilePaths.filter(function(paramFilePath) {
		return publicFilePaths.indexOf(paramFilePath) == -1;
	});
	for (var key in newFilePaths) {
		var newFilePath = newFilePaths[key];
		var sessionFile = Constant.LO_PATH_SESSION_STORAGE + newFilePath;
		var sessionStorage = new SessionScopeStorage(sessionFile);

		// セッションストレージにファイルが無ければエラー
		if (sessionStorage.isFile()) {
			// パブリックストレージ取得
			var dir = Constant.LO_PATH_PUBLIC_STORAGE;
			var subDir = bunshoId + "/";
			var publicDir = new PublicStorage(dir + subDir);
			if (!publicDir.isDirectory()) {
				// ディレクトリが存在しなければ作成
				publicDir.makeDirectories();
			}

			// パブリックストレージにコピー
			var publicStrageFile = dir + subDir + newFilePath;
			var publicStorage = new PublicStorage(publicStrageFile);
			sessionStorage.copy(publicStorage, true);
		}
	}
	var deleteFilePaths = publicFilePaths.filter(function(paramFilePath) {
		return paramFilePaths.indexOf(paramFilePath) == -1;
	});
		
}