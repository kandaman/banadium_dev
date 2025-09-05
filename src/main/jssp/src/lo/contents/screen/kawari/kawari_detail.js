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
var $route_user_flg = false; //処理済みユーザか

var $approve_flg = false; //承認ノードか(承認１～５のときtrue)
var $before_apply = false;	//申請前か
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
var $shanaiShuseiFlg = false; // 社内修正フラグ
var $shohyo_group_flg = false;

var $bunshoCls = "";
var $nodeUserslist = {}; //ノード一覧
var $mailDefUsers = {}; //ノード一覧

var	$shohyo_kekka_list = [];

var $viewCtrl = {}; //表示制御用オブジェクト
var $koukai_hani_list = []; //公開範囲コンボボックス

var $action_name = "";//アクション名

var $pullbackParam;
var $pullBackObj = {};
var $sairiyoFlg = false;

var $new_window_flg = false; // 新規ウィンドウフラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　代わりWF編集画面表示');
	
	// 新規ウィンドウで開かれた場合
	if (request.new_window_flg) {
		$new_window_flg = true;
	}

	// ユーザー情報読み込み
	loadUserInfo();
	
	// ライセンシーの場合は表示させない
	if ($userInfo.licenseeFlg == '1') {
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}

	// マスタから初期表示用情報を取得
	getSelectableValue(request);

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	//リクエストパラメータから、申請区分を取得(1:新商品企画、2:商品化権使用許諾、3:LicenseProposal)
	$bunshoCls = request.bunsho_cls;
	
	// 商標調査グループか判断
	$shohyo_group_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_SHOHYO);
	
	// 固定値マスタより詳細上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KAWARI_DETAIL_MAX);
	$kyodakuShinseiMax = $tmpList[0];
	
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

	if ('bunsho_id' in request){
		var kawariResult = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKawariData", request.bunsho_id);

		$kawari_data = kawariResult.data[0]; // 一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kawari_data);
		
		$bunshoCls = $kawari_data.bunsho_cls;
		
		if($kawari_data.kawari_status != "1"){
			$before_apply = false;
			Client.remove('before_apply_id');
		}
		
		// 編集可能チェック
		if(!chkEditable($kawari_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		var tempuFileResult = Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveTempuFileList", request.bunsho_id);
		$fileList = tempuFileResult.data; // 全行取得

		if ($shanaiShuseiFlg) {
			// 社内修正の場合は表示のみように別途確保する
			$filelistOnlyDisplay = tempuFileResult.data; // 全行取得
		}

		$kawari_data.registration_flg = false;
		
		//そのまま渡すと桁あふれが発生することがあるので、文字列に変換
		$kawari_data.royalty_kingaku_genchi = $kawari_data.royalty_kingaku_genchi == null?null:$kawari_data.royalty_kingaku_genchi.toString();
		$kawari_data.kawase_rate = $kawari_data.kawase_rate == null?null:$kawari_data.kawase_rate.toString();
		$kawari_data.royalty_kingaku = $kawari_data.royalty_kingaku == null?null:$kawari_data.royalty_kingaku.toString();
		$kawari_data.saiteihosho_su_shinseisu = $kawari_data.saiteihosho_su_shinseisu == null?null:$kawari_data.saiteihosho_su_shinseisu.toString();
		$kawari_data.saiteihosho_ryo_kyodakuryo = $kawari_data.saiteihosho_ryo_kyodakuryo == null?null:$kawari_data.saiteihosho_ryo_kyodakuryo.toString();
		$kawari_data.sozai_hi = $kawari_data.sozai_hi == null?null:$kawari_data.sozai_hi.toString();
		
		// 案件情報の取得		
		if (!setMatterInfo($kawari_data)){
			Logger.getLogger().info(' [init]　setMatterInfo = false');
			// ない場合は新規でセット
			setWorkflowOpenPage($kawari_data);	
			
			if($kawari_data.sairiyou_bunsho_id != null){				
				setSairiyouNodeInfo($kawari_data.sairiyou_bunsho_id);
				
				Logger.getLogger().info(' [init]　代わり承認WF登録画面 再利用ルート情報取得）' + ImJson.toJSONString($wf_data,true));
				$sairiyoFlg = true;
			}
			
			$kawari_data.registration_flg = true;
		}else if($kawari_data.kawari_status == "1" ||$kawari_data.kawari_status == "3" ||$kawari_data.kawari_status == "5"){
			Logger.getLogger().info(' [init]　setMatterInfo = true');
			//修正依頼、差し戻し時の挙動 TODO:特になければ消す
			//Logger.getLogger().info(' [init]　$nodeUserslist = true'+ ImJson.toJSONString($nodeUserslist,true));
			//ワークフローパラメータをセット
			$wf_data.imwNodeSetting = nodeSetting($nodeUserslist);
		}
		
		//Logger.getLogger().info(' [権限確認] '+ "$proc_user_flg:"+$proc_user_flg + ", $route_user_flg:"+$route_user_flg + " ,$kawari_data.koushin_sha == $userInfo.userCd:"+ ($kawari_data.koushin_sha == $userInfo.userCd));
		//経路上のみ公開の場合は、経路上にいないユーザの場合、エラー画面に遷移
		//一時保存の場合は経路情報がないため、最終更新者で判断
		/* 経路上非公開案件は、URL直打ちで遷移できてOKなのでここは不要（NGになったらここを外す）
		if($kawari_data.gokuhi_flg == "1" && !($proc_user_flg || $route_user_flg || $kawari_data.koushin_sha == $userInfo.userCd ) ){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		*/

	} else {
		//bunsho_idがない場合は、エラー画面を表示
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");

	}
	
	// 申請前か
	if(request.bunsho_id == Client.get('before_apply_id')) {
		$before_apply = true;
	}
	
	//申請ボタンの名称をセット
	if($userInfo.kawariInputFlg == "1"){
			$action_name = "送付";
	}else{
		$action_name = "起案";
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
    
    //表示制御に使用するフラグを設定する
    $viewCtrl.isKikaku = false;
	$viewCtrl.isKyodaku = false;
	$viewCtrl.isLicenseProposal = false;
	$viewCtrl.isSairiyou = false; 

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
    
    //再利用ボタンの表示制御
    if($kawari_data.kawari_status ==  Constant.LO_STATUS_KANRYO || $kawari_data.kawari_status ==  Constant.LO_STATUS_IKO){
    	$viewCtrl.isSairiyou = true;    
    }
    
    // 商標調査結果選択肢取得   
    var shohyo_kekka_list = [];
    shohyo_kekka_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", shohyo_kekka_list, Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA);
    $shohyo_kekka_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", shohyo_kekka_list, $kawari_data.shohyo_chosa_kekka, Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA);
    
    getSettingMailUsers($kawari_data.bunsho_id);
    
    // 取戻し対象か判定
	var res = Content.executeFunction("lo/common_libs/lo_common_fnction","getApplyTskInfo",$wf_data.imwSystemMatterId,$userInfo.userCd);
	if (res != null){
		$pullbackParam = ImJson.toJSONString(res[0]);
		//Logger.getLogger().info(' [init]　$pullbackParam = true'+ ImJson.toJSONString($pullbackParam,true));
		
		$viewCtrl.pullback_enable_flg = true;
		//$pullBackObj.pullBackTitle = MessageManager.getMessage("IMW.CAP.1205");
		$pullBackObj.pullBackTitle = "取戻し確認";
		//$pullBackObj.confirmPullback = MessageManager.getMessage("IMW.CLI.INF.3000", MessageManager.getMessage("IMW.CAP.0394"));
		$pullBackObj.confirmPullback = "取戻しを行います。\\r\\nよろしいですか？";
		$pullBackObj.confirmClose = MessageManager.getMessage("IMW.CLI.WRN.3501");
	    
	    //Logger.getLogger().info(' [init]　$pullBackObj' + ImJson.toJSONString($pullBackObj,true));
	}
	
	if(!$before_apply || $sairiyoFlg || !$kawari_data.registration_flg){
		$viewCtrl.routeFlg = true;	
	}else{
		$viewCtrl.routeFlg = false;
	}
	
	//Logger.getLogger().info(' [init]　$nodeUserslist'+ ImJson.toJSONString($nodeUserslist,true));
	
	if($nodeUserslist.apply){
		//起案ノードが空欄の場合は、申請ノードの情報を表示する（表示のみ）
		if($nodeUserslist.apply.execFlg && (!$nodeUserslist.kian || $nodeUserslist.kian.userCd == "---")){
			//申請済みかつ、起案ノード空欄の場合は、申請ノードの情報をコピーする
			$nodeUserslist.kian = $nodeUserslist.apply;
		}else if(!$nodeUserslist.apply.execFlg && $userInfo.kawariInputFlg == "0" && (!$nodeUserslist.kian || $nodeUserslist.kian.userCd == "---")){
			$nodeUserslist.kian = $nodeUserslist.apply;
		}
	}	
	
	//最終確認ノードが空欄の場合は、起案ノードの情報を表示する（表示のみ）
	if(!$nodeUserslist.last_confirm || $nodeUserslist.last_confirm.userCd == "---"){
		//$nodeUserslist.last_confirm = $nodeUserslist.kian;
	}
	
	//Logger.getLogger().info(' [init]　$nodeUserslist.' + ImJson.toJSONString($nodeUserslist,true));
	
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

	if (data.kawari_status == Constant.LO_STATUS_ICHIJI_HOZON && data.koushin_sha != $userInfo.userCd) {
		// 一時保存は最終更新者のみ表示可
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
 * 企画詳細情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuShohinList(request) {

	if ('bunsho_id' in request){
		return Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKikakuShohinList", request.bunsho_id);
	}

}

/**
 * 許諾詳細情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuShohinList(request) {

	if ('bunsho_id' in request){
		return Content.executeFunction("lo/contents/screen/kawari/kawari_data_retriever", "retrieveKyodakuShohinList", request.bunsho_id);
	}

}

function getSelectableValue(request) {

	$shohin_hansokubutsu_list = [];
	$shohin_hansokubutsu_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shohin_hansokubutsu_list, Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU);
	
	$shoshi_list = [];
    $shoshi_list.push({label:"",value:"",selected:true});
    $shoshi_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoshi_list, Constant.LO_CDCLS_SHOSHI);
    
    $hanbai_chiiki_list = [];
    $hanbai_chiiki_list.push({label:"",value:"",selected:true});
    $hanbai_chiiki_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hanbai_chiiki_list, Constant.LO_CDCLS_HANBAI_CHIIKI);

	// 固定値マスタより許諾種別取得
    $kyodaku_cls_list = [];
    $kyodaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $kyodaku_cls_list, Constant.LO_CDCLS_KYODAKU_CLS);
	
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


function nodeSetteing(ticket_id){
	
	// 文書idからタイトルに紐づくグループを取得
	var ticket_type = Constant.LO_TICKET_ID_HEAD_KAWARI;
    var target_group = Content.executeFunction("lo/common_libs/lo_common_fnction",
    	"getIpGroupList", ticket_id,ticket_type);

	// パブリックグループは[セットコード＋＾+グループコード]にする
	var groupSet = [];
    for (var key in target_group){
    	groupSet.push(Constant.LO_GROUP_SET_CD+"^"+target_group[key]);
    }

	// BNE担当ノードに処理対処ユーザを設定
	var node={};
	node[Constant.LO_NODE_APPR_1] = groupSet;
	/*var node = {
		"lo_node_appr_0":["license_out^"+target_group] 
	};*/
	
	// imartパラメータ生成
    // 企画承認者のノード設定
	var nodeSetting = {"DCNodeSetting" : {}}; //動的承認ノード設定
	for(var key in node) {
		var processTargetConfigs = []; //処理対象プラグイン情報
		// ノードごとにユーザを設定
		var users = node[key];
		for(var i in users) {
			var userconf = {
					"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
				    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.public_group",
				    "parameter" : users[i]
			}
			processTargetConfigs.push(userconf);
		}
		nodeSetting.DCNodeSetting[key] = {"displayFlag" : false, "processTargetConfigs":processTargetConfigs}
	}
	
    // JSON側でパラメータに渡す
	return ImJson.toJSONString(nodeSetting);
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {String} 企画id
 */
function setWorkflowOpenPage(kawariData) {

	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定
	
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
        imwCallOriginalParams   : ImJson.toJSONString({"bunsho_id":kawariData.bunsho_id}),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };

}
/**
 * 案件情報の設定
 * @param {String} 文書id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(kawariData) {
	
	var wfResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "setMatterInfo", kawariData, $userInfo);
	
	$wf_data = wfResult.wf_data;
	
	var systemMatterId = wfResult.systemMatterId;
	//Logger.getLogger().info(' [init]　wfResult' + ImJson.toJSONString(wfResult,true));
	
	if(wfResult == false){
		return false;
	}
	
    var type = wfResult.type;
    
    var nodeId = "";
    
    if(type=="cpl"){
    	$route_user_flg = wfResult.route_user_flg;
    }else{    
	    nodeId = wfResult.wf_data.imwNodeId;	    
	    $proc_user_flg = wfResult.proc_user_flg;
	    $route_user_flg = wfResult.route_user_flg;
		    
	    //$approve_flgの設定：承認ノードか否かを設定　※起案ノードは該当しない。
	    switch(nodeId){
		    case Constant.LO_NODE_APPR_1:
		    case Constant.LO_NODE_APPR_2:
			case Constant.LO_NODE_APPR_3:
			case Constant.LO_NODE_APPR_4:
			case Constant.LO_NODE_APPR_5:
				$approve_flg = true;
				break;
			default:
				$approve_flg = false;
				break;
		}   
    }
    
    $nodeUserslist = wfResult.nodeUserslist;
    
    if($userInfo.kawariInputFlg =="0"){
    	//$nodeUserslist.kian = $nodeUserslist.apply;
    }
    

    return true;
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
    
    //Logger.getLogger().info(' [getSettingMailUsers]　 $mailDefUsers '+ ImJson.toJSONString($mailDefUsers, true));
    

}

/**
 * 再利用
 * 
 * 完了した申請情報をコピーして、新規申請情報を作成する
 * 
 */
function sairiyou(inputContents) {
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userCd = userContext.userProfile.userCd;
	var userName = userContext.userProfile.userName;
	// 組織情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var companyCd = userCompanyDepartment.companyCd;
	var companyName = userCompanyDepartment.companyName;
	var companyShortName = userCompanyDepartment.companyShortName;
	var departmentCd = userCompanyDepartment.departmentCd;
	var departmentName = userCompanyDepartment.departmentName;
	var departmentFullName = userCompanyDepartment.departmentFullName;

	var sysDate = new Date();
	
	// ユーザー情報読み込み
	loadUserInfo();

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		kikaku_id : ""
	};
	var bunshoId = inputContents.bunsho_id;//再利用元文書ID
	var kiSql = "" ;
	kiSql += "SELECT ";
	kiSql += "  ki.* ";
	kiSql += "FROM ";
	kiSql += " lo_t_kawari AS ki ";
	kiSql += "WHERE ";
	kiSql += "  ki.sakujo_flg = '0' ";
	kiSql += "  AND ki.bunsho_id = ?  ";
	
	
	Logger.getLogger().info(' [sairiyou]　kiSql ' + kiSql);
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(bunshoId));

    // sql実行
    var db = new TenantDatabase();
	Transaction.begin(function() {

	    var kiResult = db.select(kiSql,strParam);
	    
	    if (kiResult.countRow === 0) {
	    	// TODO 再利用対象がなかった場合の対処
	    }
	    var kawariData = kiResult.data[0];
		//Logger.getLogger().info(' [sairiyou]　kawariData ' + ImJson.toJSONString(kawariData, true));
		
		var header = "";
		
		
		switch(kawariData.bunsho_cls){
		
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

		// 企画ID
		var newBunshoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", header);
	    
	    // 引き継がないプロパティを削除 
	    if ('bunsho_nm' in kawariData) {
		    //delete kawariData.bunsho_nm;
    	}
	    if ('shinsei_bi' in kawariData) {
		    delete kawariData.shinsei_bi;
    	}
	    if ('hatsubai_jiki' in kawariData) {
		    delete kawariData.hatsubai_jiki;
    	}
	    if ('hatsubai_bi' in kawariData) {
		    delete kawariData.hatsubai_bi;
    	}
	    if ('kyodaku_kikan_from' in kawariData) {
		    delete kawariData.kyodaku_kikan_from;
    	}
	    if ('kyodaku_kikan_to' in kawariData) {
		    delete kawariData.kyodaku_kikan_to;
    	}
	    if ('shohyo_chosa_kekka' in kawariData) {
	    	delete kawariData.shohyo_chosa_kekka;
	    }
	    if ('shohyo_chosa_comment' in kawariData) {
	    	delete kawariData.shohyo_chosa_comment;
	    }
	    if ('kanshu_no' in kawariData) {
	    	delete kawariData.kanshu_no;
	    }
	    if ('nyuryoku_sha_id' in kawariData) {
		    delete kawariData.nyuryoku_sha_id;
    	}
	    if ('nyuryoku_sha_nm' in kawariData) {
		    delete kawariData.nyuryoku_sha_nm;
    	}
	    if ('kian_sha_id' in kawariData) {
		    delete kawariData.kian_sha_id;
    	}
	    if ('kian_sha_nm' in kawariData) {
		    delete kawariData.kian_sha_nm;
    	}
	    
    	// タイトルマスタの確認
		var strParamTitle=[];
		strParamTitle.push(DbParameter.string(kawariData.title_cd));
	    var tiSql = "select 1 from lo_m_title where title_cd = ? and sakujo_flg ='0'";
	    	
	    var tiResult = db.select(tiSql,strParamTitle);

	    // タイトルマスタに存在しない場合、IP・タイトルを空欄にする
	    if (tiResult.countRow === 0) {
	    	delete kawariData.title_cd;
	    	delete kawariData.title_nm;
	    	delete kawariData.ip_cd;
	    	delete kawariData.ip_nm;
	    }
	    
	    // ライセンシー名をマスタから再取得----
		var strParamKaisha=[];
		
		var kaishaSql = "" ;
		if (kawariData.bunsho_cls == Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL){ //LICENSE_PROPOSALなら海外ライセンシー取得
			kaishaSql += " SELECT ";
			kaishaSql += "     kaisha_id ";
			kaishaSql += "    ,kaisha_name as kaisha_nm ";
			kaishaSql += " FROM lo_m_kaigai_kaisha ";
			kaishaSql += " WHERE sakujo_flg = '0' ";
			kaishaSql += "   AND kaisha_id = ? ";
			
			strParamKaisha.push(DbParameter.string(kawariData.kaisha_id));
		} else {
			kaishaSql += " SELECT ";
			kaishaSql += "     MIN(d.company_cd) as kaisha_id ";
			kaishaSql += "    ,d.department_name as kaisha_nm ";
			kaishaSql += " FROM imm_department d ";
			kaishaSql += " INNER JOIN imm_company c ";
			kaishaSql += "   ON d.company_cd = c.company_cd ";
			kaishaSql += "   AND d.department_cd = c.company_cd ";
			kaishaSql += " WHERE d.delete_flag = '0' ";
			kaishaSql += "   AND d.company_cd = ? ";
			kaishaSql += "   AND d.locale_id = ? ";
			kaishaSql += "   AND d.start_date <= CURRENT_DATE ";
			kaishaSql += "   AND d.end_date > CURRENT_DATE ";
			kaishaSql += " GROUP BY d.department_name ";
			kaishaSql += " ORDER BY MIN(d.company_cd) ";
			
			strParamKaisha.push(DbParameter.string(kawariData.kaisha_id));
			strParamKaisha.push(DbParameter.string('ja'));
		}

		
	    var kaishaResult = db.select(kaishaSql,strParamKaisha);
	    if (kaishaResult.countRow > 0) {
	    	kawariData.kaisha_nm = kaishaResult.data[0].kaisha_nm;
	    } else {
	    	delete kawariData.kaisha_id;
	    	delete kawariData.kaisha_nm;
	    }
	    // ---------

		kawariData.bunsho_id = newBunshoId;
		kawariData.kawari_status = Constant.LO_STATUS_ICHIJI_HOZON; //一時保存
		kawariData.sairiyou_bunsho_id = bunshoId; //コピー元文書IDを追加
		
		// ユーザ情報取得
		var userContext = Contexts.getUserContext();
		var userCd = userContext.userProfile.userCd;
		var userName = userContext.userProfile.userName;
		
		kawariData.nyuryoku_sha_id = userCd;
		kawariData.nyuryoku_sha_nm = userName;
		
		Logger.getLogger().info(' [sairiyou]　$userInfo ' + ImJson.toJSONString($userInfo, true));
		if($userInfo.kawariInputFlg =="0"){
			kawariData.kian_sha_id = userCd;
			kawariData.kian_sha_nm = userName;
		}		
		
		kawariData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kawariData, true);

		//Logger.getLogger().info(' [sairiyou]　lo_t_kikaku ' + ImJson.toJSONString(kawariData, true));
		
		var kiResult = db.insert('lo_t_kawari', kawariData);
		if (kiResult.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E011');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		
		//kawari_detailテーブルの複製

		var detailSql = "SELECT * FROM lo_t_kawari_detail kd where bunsho_id = ?";
		var detailResult = db.select(detailSql , strParam);
		Logger.getLogger().info(' [sairiyou]　detailResult ' + ImJson.toJSONString(detailResult, true));
		var detailItem={}; 
		for(var i=0;i<detailResult.data.length;i++){
			detailResult.data[i].bunsho_id = newBunshoId;
			
			
			//再利用しない項目を削除
			if ('hanbai_jiki' in detailResult.data[i]) {
				delete detailResult.data[i].hanbai_jiki;
	    	}
		    if ('kokuchi_kaishi_jiki' in detailResult.data[i]) {
			    delete detailResult.data[i].kokuchi_kaishi_jiki;
	    	}
		    if ('hatsubai_bi' in detailResult.data[i]) {
			    delete detailResult.data[i].hatsubai_bi;
	    	}
	    	
		    
			detailItem = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", detailResult.data[i], true);
			Logger.getLogger().info(' [sairiyou]　detailItem ' + ImJson.toJSONString(detailItem, true));
			db.insert("lo_t_kawari_detail", detailItem);
		}			

		//ルートの複製は、再利用した後の申請画面側で取得するので、ここでは不要

		//通知設定の複製(退職者や異動者の除外は、申請時に実行）		
		var mailSql = "SELECT '"+newBunshoId+"' as ticket_id,mail_group,user_cd,0 as sakujo_flg FROM lo_t_sendmail where ticket_id = ?";
		var mailResult = db.select(mailSql , strParam);
		//Logger.getLogger().info(' [sairiyou]　mailResult ' + ImJson.toJSONString(mailResult, true));
		var mailItem={}; 
		for(var i=0;i<mailResult.data.length;i++){
			mailItem = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", mailResult.data[i], true);
			//Logger.getLogger().info(' [sairiyou]　mailItem insert ' + ImJson.toJSONString(mailItem, true));
			db.insert("lo_t_sendmail", mailItem);			
		}			
		
		ret.bunsho_id = newBunshoId;
		ret.msg = MessageManager.getMessage('KK02I017');
		

	});
	Client.set('kikaku_edit_id', ret.bunsho_id);
	return ret;
    
}

/**
 * 簡易商標調査担当入力欄保存ボタン押下時処理
*/	
function shohyoKekkaSave(inputContents) {
	if(inputContents.shohyo_chosa_kekka == "") inputContents.shohyo_chosa_kekka = null;
	return shohyoKekkaUpdate(inputContents);
}

function shohyoKekkaUpdate(inputContents) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	var userCd = userContext.userProfile.userCd;

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : ""
	};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		//画面の入力値をDB用オブジェクトに格納
		// todo 必要な項目を追加する
		var dataSet = {
			shohyo_chosa_kekka : inputContents.shohyo_chosa_kekka,
			shohyo_chosa_comment : inputContents.shohyo_chosa_comment
		};
		dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
		// update条件の値を配列で持つ
		var whereObject = [DbParameter.string(inputContents.bunsho_id)];
		// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
		var result = db.update('lo_t_kawari', dataSet,'bunsho_id = ?',whereObject);
		if (result.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E009');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
	});
	
	// 商標調査完了メール送信-------------------
	Constant.load("lo/common_libs/lo_const");

	// 文書idとノードidから起案者のメールアドレス取得
	var ticket_id = inputContents.bunsho_id;
	var address = Content.executeFunction("lo/common_libs/lo_send_mail",
			"getNodeUserAddress",ticket_id,Constant.LO_NODE_KIAN);
	//起案ノードのメールアドレスが取得できない場合は、申請ノードのメールアドレスを取得
	if(address == ""){
		var address = Content.executeFunction("lo/common_libs/lo_send_mail",
				"getNodeUserAddress",ticket_id,Constant.LO_NODE_APPLY);
	}	

	// 送信用パラメータ作成
	var param = {
			ticket_id :ticket_id, // 文書番号
			//mail_id : Constant.LO_MAIL_ID_SHOHYO_END,    //メールid 処理依頼
			mail_id : Constant.LO_KAWARI_MAIL_ID_ZACRO_END,    //メールid 処理依頼
			to_address : address,                       //送信先アドレス
			comment : inputContents.shohyo_chosa_comment,      				//コメント
			execUserCd : userCd    //実行者コード
	}
	// メール送信
	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",param);
	// end商標調査完了メール送信-------------------


	return ret;
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
    
    //Logger.getLogger().info(' [setSairiyouNodeInfo]　SQL '+ sql + ImJson.toJSONString(strParam, true) + ImJson.toJSONString(result, true));
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	Logger.getLogger().info(' [DEBUG]　return false ');
    	return false;
    }    
    
    var systemMatterId = result.data[0].system_matter_id;
    
	//完了案件はワークフローの設定の必要なし
	var cplMatterObj = new CplMatter('ja', systemMatterId);
	var flowInfo = cplMatterObj.getExecFlow().data;
	var nodeInfoList = flowInfo.nodes;
	Logger.getLogger().info(' [DEBUG]　nodeInfoList '+ ImJson.toJSONString(nodeInfoList, true) );
	// ノード情報取得
    var cplMatter = new CplMatterNode('ja', systemMatterId);
    
    var wfNodeUserslist  = {};
    
    //key:ノード略称,value:ノードIDのオブジェクトを取得
    var nodeObj = getKawariNodeInfo();
    
	for (var idx = 0; idx < nodeInfoList.length; idx++) {
		var nodeId = nodeInfoList[idx].nodeId;
		
		if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPLY) {			
		    // 申請ノードには、ログイン者の情報を入れる				
		    wfNodeUserslist.apply = {"userCd":$userInfo.userCd,"userName":$userInfo.userName};
			// 申請ノードの最後の処理者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);			
		    $nodeUserslist.apply = getProcessLatestUser(result, nodeId);
		    $nodeUserslist.apply.execFlg = false;
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_KIAN) {			
		    // 起案ノードの最後の処理者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);			
		    $nodeUserslist.kian = getProcessLatestUser(result, nodeId);
		    $nodeUserslist.kian.execFlg = false;
		    
		    wfNodeUserslist.kian = getProcessLatestUser(result, nodeId);
		    
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_1) {			
		    // 承認１ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);			
			$nodeUserslist.appr_1 = getProcessLatestUser(result);
			$nodeUserslist.appr_1.execFlg = false;
			
			wfNodeUserslist.appr_1 = getProcessLatestUser(result, nodeId);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_2) {			
		    // 承認2ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);			
			$nodeUserslist.appr_2 = getProcessLatestUser(result);
			$nodeUserslist.appr_2.execFlg = false;
			
			wfNodeUserslist.appr_2 = getProcessLatestUser(result, nodeId);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_3) {			
			// 承認3ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);			
			$nodeUserslist.appr_3 = getProcessLatestUser(result);
			$nodeUserslist.appr_3.execFlg = false;
			
			wfNodeUserslist.appr_3 = getProcessLatestUser(result, nodeId);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_4) {
			// 承認4ノードの処理対象者を取得			
		    var result = cplMatter.getProcessHistoryList(nodeId);			
			$nodeUserslist.appr_4 = getProcessLatestUser(result);
			$nodeUserslist.appr_4.execFlg = false;
			
			wfNodeUserslist.appr_4 = getProcessLatestUser(result, nodeId);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_5) {			
			// 承認5ノードの処理対象者を取得
		    var result = cplMatter.getProcessHistoryList(nodeId);
			$nodeUserslist.appr_5 = getProcessLatestUser(result);
			$nodeUserslist.appr_5.execFlg = false;
			
			wfNodeUserslist.appr_5 = getProcessLatestUser(result, nodeId);
			
		} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_LAST_CONFIRM) {			
			//最終確認は再利用不要
		    var result = cplMatter.getProcessHistoryList(nodeId);			
			$nodeUserslist.last_confirm = getProcessLatestUser(result);	
			$nodeUserslist.last_confirm.execFlg = false;
			
			wfNodeUserslist.last_confirm = getProcessLatestUser(result, nodeId);
		}
	}
	
	
	//WFパラメータ用経路情報の加工
	if($userInfo.kawariInputFlg =="0"){
		//起案権限ありユーザの場合、起案ノードはモーダル側で自動で設定されるため、起案ノードは削除する
		delete wfNodeUserslist.kian;
	}else{
		//入力者の場合、利用元フローに起案ノードがない場合、利用元の申請ノードを起案ノードにコピーする
		if(!$nodeUserslist.kian){
			wfNodeUserslist.kian = $nodeUserslist.apply;
		}
	}
	
	
	//画面表示用経路情報の加工
	if(!$nodeUserslist.kian){
		$nodeUserslist.kian = $nodeUserslist.apply;
	}
	
	//ワークフローパラメータをセット
	$wf_data.imwNodeSetting = nodeSetting(wfNodeUserslist);
	Logger.getLogger().info("再利用$wf_data.imwNodeSetting" +$wf_data.imwNodeSetting);
	
    return true;
}

/**
 * 新規申請時、ワークフローのノード処理対象者を設定
 * @returns {String} ノード設定値
 */
function nodeSetting(userObj){
	Logger.getLogger().info(' [nodeSetting]　start ');
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
		}
		
		processTargetConfigs = [];
		
		//if(nodeId != Constant.LO_NODE_APPLY){
			var userconf = {
					"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
				    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.user",
				    "parameter" : userObj[i].userCd
			};
			processTargetConfigs.push(userconf);
			
			// ノード名と処理対象プラグイン情報を設定
			nodeSetting.DCNodeSetting[nodeId] = {"displayFlag" : true, "processTargetConfigs":processTargetConfigs};
		//}
	}

    // JSON側でパラメータに渡す
	return ImJson.toJSONString(nodeSetting);

}

//=============================================================================
// 引戻し処理
//  【 入力 】request: ＵＲＬ引数取得オブジェクト
//  【 返却 】処理結果
//  【作成者】NTT DATA INTRAMART
//  【 概要 】指定ノードへの引戻し処理を行います。
//=============================================================================
function actionPullback(request) {
	
    request.imwSystemMatterId = request.system_matter_id; //DBから取得した値の入れ替え
    request.imwFlowId = request.flow_id;

    var result = new Object();
    result.resultFlag = true;
    result.resultStatus = new Object();
    
    // ログインユーザ情報の取得
    var oSession = Contexts.getAccountContext();
    var loginGroupId = oSession.loginGroupId;
    var localeId = oSession.locale;
    var userId = oSession.userCd;
    var databaseResult;
    var sysDateStr  = Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone();
    var cnt;
    var leng;
    // コードUtil
    var codeUtil = new WorkflowCodeUtil();
    var targetProcType = codeUtil.getEnumCodeProcessType("procTyp_pbk"); // 処理種別：引戻し
    var procTyp_sbk = codeUtil.getEnumCodeProcessType("procTyp_sbk"); // 処理種別：差戻し

    // 案件(未完了)マネージャの定義
    var actvMatterManager = new ActvMatter(localeId, request.imwSystemMatterId);
    // 引戻しマネージャ生成
    var pullBackManager = new PullBackManager(localeId, request.imwSystemMatterId);
    var pullbackRecord = new Object();

    // 引戻し用パラメータ情報の作成
    pullbackRecord.executeUserCode      = userId;
    pullbackRecord.negoModel            = null;
    //pullbackRecord.processComment       = request.processComment;
    pullbackRecord.processComment       = "";
    //pullbackRecord.pullBackTargetNodeId = request.nodeId[request.selectnode];
    pullbackRecord.pullBackTargetNodeId = request.node_id;
    Logger.getLogger().info('request.node_id' + request.node_id);
    
    // 引戻し権限者の確定
    var databaseResult = pullBackManager.getNodesToPullBack(userId);    

    //databaseResult = getPullbackList(pullBackManager, actvMatterManager, userId, procTyp_sbk);
    Logger.getLogger().info('引戻し権限者' + ImJson.toJSONString(databaseResult,true));
    if (!databaseResult.resultFlag) {
        // 引戻し先リストの取得に失敗
        result.resultFlag = false;
        result.resultStatus.message =
                Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3507", null);
        return result;
    }
    
    var pullbackListWork = databaseResult.data;
    for (cnt = 0, leng = pullbackListWork.length; cnt < leng; cnt++) {
        //if (pullbackListWork[cnt].nodeId == pullbackRecord.pullBackTargetNodeId) {
            pullbackRecord.authUserCode = pullbackRecord.executeUserCode;
            break;
        //}
    }

    if (isBlank(pullbackRecord.authUserCode)) {    	
        // 指定した引戻し先ノードが、引戻し先リストに存在しない
        result.resultFlag = false;
        result.resultStatus.message =
                Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3659", null);
        return result;
    }

    // 代理の場合 (実行者と権限者が異なる場合)
    if (pullbackRecord.executeUserCode != pullbackRecord.authUserCode) {
        // 代理権限のチェック
        //var nodeType = request.nodeType[request.selectnode];
        var nodeType = request.node_type;
        
        var applyPullbackFlag = (nodeType == codeUtil.getEnumCodeNodeType("nodeTyp_Apply"));
        var authColumn = applyPullbackFlag ? OriginalActList.APPLY_AUTH : OriginalActList.APPROVE_AUTH;
        databaseResult = Procedure.imw_proc_utils.checkActUser(
                loginGroupId, localeId, sysDateStr, authColumn,
                pullbackRecord.executeUserCode, pullbackRecord.authUserCode, request.imwFlowId);

        // 代理権限の取得に失敗した場合
        if (!databaseResult.resultFlag) {
            result.resultFlag = false;
            result.resultStatus.message =
                    Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3606", databaseResult);
            return result;
        }

        // 代理権限がない場合
        if (!databaseResult.actFlag) {
            var actErrMessageId = applyPullbackFlag ? "IMW.CLI.WRN.3531" : "IMW.CLI.WRN.3532";
            result.resultFlag = false;
            result.resultStatus.message =
                    Procedure.imw_error_utils.getErrorMessage(actErrMessageId, databaseResult);
            return result;
        }
    }

    // 処理種別実行権限
    // 引戻し先ノード情報を取得する
    var actvMatterNode = new ActvMatterNode(localeId, request.imwSystemMatterId);
    databaseResult = actvMatterNode.getExecNodeConfig(pullbackRecord.pullBackTargetNodeId);
    if (!databaseResult.resultFlag || isBlank(databaseResult.data)) {
        // ノード情報の取得に失敗した場合
        result.resultFlag = false;
        result.resultStatus.message =
                Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3606", databaseResult);
        return result;
    }
    var executableProcessTypeList = databaseResult.data.executableProcessType;
    var procTypeAllowedFlag = false;
    for (cnt = 0, leng = executableProcessTypeList.length; cnt < leng; cnt++) {
        // 対象ノードで実施可能な処理種別分だけ繰り返し
        if (executableProcessTypeList[cnt].nodeProcess == targetProcType) {
            // 引戻し実行可能
            procTypeAllowedFlag = true;
            break;
        }
    }
    if (!procTypeAllowedFlag) {
        // 指定した処理種別が許可されていない
        result.resultFlag = false;
        result.resultStatus.message = MessageManager.getMessage("IMW.CLI.WRN.3656");
        return result;
    }

    var userParam = new Object();

    // 引戻し実行
    databaseResult = pullBackManager.pullBack(pullbackRecord, userParam);
    if (!databaseResult.resultFlag) {
        result.resultFlag = false;
        result.resultStatus.message = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3606", databaseResult);
        // サブメッセージ取得
        var subMessages = Procedure.imw_proc_utils.getSubMessagesWithArgs(databaseResult.resultStatus.subMessages, localeId);
        // 表示するサブメッセージが存在する場合は追加
        if(subMessages.length > 0) {
            result.resultStatus.message = result.resultStatus.message + "\n\n" + subMessages.join("\n");
        }
        return result;
    }

    return result;
}

//=============================================================================
// 引戻し先リスト生成処理
//  【 入力 】pullBackManager: 引戻しマネージャ
//            actvMatterManager: 未完了案件マネージャ
//            userId: 実行者コード（セッションから取得したユーザコード）
//            procTyp_sbk: 処理種別：差戻し
//  【 返却 】処理結果
//  【作成者】NTT DATA INTRAMART
//  【 概要 】引戻し先リストの生成を行います。
//=============================================================================
function getPullbackList(pullBackManager, actvMatterManager, userId, procTyp_sbk) {
    var resultInfo = {
            "resultFlag" : false,
            "subMessage" : "",
            "data" : new Array()
    };

    // 引戻し先一覧の取得
    var result = pullBackManager.getNodesToPullBack(userId);
    if (!result.resultFlag) {
        return resultInfo;
    }
    if (result.data.length == 0) {
        // 引戻し先が見つからない
        resultInfo.subMessage = MessageManager.getMessage("IMW.CLI.WRN.3507");
        return resultInfo;
    }
    var pullbackListData = result.data;

    // 未完了案件の処理履歴を取得
    result = actvMatterManager.getProcessHistoryLatestList();
    if (!result.resultFlag) {
        return resultInfo;
    }
    var matterProcessHistoryInfo = result.data;

    // 最新の処理履歴から引戻し先データをセット
    var pullbackListWork = new Array();
    var i;
    var j;
    var lengPBL = pullbackListData.length;
    var lengMPHI = matterProcessHistoryInfo.length;
    for (i = 0; i < lengPBL; i++) {
        // 引戻し先分繰り返し
        for (j = 0; j < lengMPHI; j++) {
            // 最新履歴分繰り返し
            if (matterProcessHistoryInfo[j].nodeId == pullbackListData[i].nodeId) {
                // 引戻し先として画面表示する対象の履歴情報を確定
                pullbackListWork[i] = matterProcessHistoryInfo[j];
                pullbackListWork[i].nodeType = pullbackListData[i].nodeType;
                if (isBlank(pullbackListWork[i].processType) && pullbackListWork[i].status == "cancel") {
                    // ステータスがキャンセル：差戻しに変更
                    // ※引戻しは通常処理済みのノードに背にするが、差戻し引戻しの
                    //   場合のみステータス＝キャンセルに対して引戻しを実行する
                    pullbackListWork[i].processType = procTyp_sbk;
                    pullbackListWork[i].status = "sendback";
                }
                // 次の引戻し先へ
                break;
            }
        }
    }
    resultInfo.resultFlag = true;
    resultInfo.data = pullbackListWork;
    return resultInfo;
}

// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessLatestUser(result) {
	// ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();
	var names={};
	
	if (result.data){
    	for (var i=result.data.length-1;0 <= i;i--){    		
    		//処理済み、かつ、処理タイプ申請or承認(=差し戻しや引き戻しは除く）
    		if (result.data[i].authUserName
    				&& (result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apy") //申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_rapy") //再申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apr") //承認
    						)
    					) {
          		 names = {"userName":result.data[i].authUserName,"userCd":result.data[i].executeUserCode,"execFlg":true};
          		 //Logger.getLogger().info('対象者：authUserName' + ImJson.toJSONString(names,true));
          		return names;
    		} else if(result.data[i].processTargetName) {
       		 	names = {"userName":result.data[i].processTargetName,"userCd":result.data[i].parameter,"execFlg":false};
       		 	//Logger.getLogger().info('対象者：processTargetName' + ImJson.toJSONString(names,true));
       		 	return names;
    		}else{    			
    			//空のオブジェクトを返す
    			return names;
    		}    		
    	}    	
    }else{
    	return '';
    }
}

/**
 * ノード情報のオブジェクトを取得
 * @returns {String} ノード設定値
 */
function getKawariNodeInfo(){
	
	var nodeObj ={
		"kian":Constant.LO_NODE_KIAN,
		"appr_1":Constant.LO_NODE_APPR_1,
		"appr_2":Constant.LO_NODE_APPR_2,
		"appr_3":Constant.LO_NODE_APPR_3,
		"appr_4":Constant.LO_NODE_APPR_4,
		"appr_5":Constant.LO_NODE_APPR_5,
		"last_confirm":Constant.LO_NODE_LAST_CONFIRM			
	};

	return nodeObj;
}
