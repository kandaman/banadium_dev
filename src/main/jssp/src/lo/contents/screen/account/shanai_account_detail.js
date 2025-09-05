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

var $flow_id = "";

var $approve_flg = false; //承認ノードか(承認１～５のときtrue)
var $before_apply = false;	//申請前か
var $validationErrorMessages = [];
var $shinsei_data = {};


var $fileList =[];
var $filelistOnlyDisplay =[];

var $kyodakuShinseiMax = 0; //許諾申請上限
var $shanaiShuseiFlg = false; // 社内修正フラグ

var $nodeUserslist = {}; //ノード一覧
var $nodeInfolist = {}; //ノード一覧
var $mailDefUsers = {}; //ノード一覧

var $viewCtrl = {}; //表示制御用オブジェクト

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
	
	// 固定値マスタより詳細上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KAWARI_DETAIL_MAX);
	$kyodakuShinseiMax = $tmpList[0];
	
	$flow_id = Constant.LO_FLOW_ACCOUNT_SHANAI;
	
	//ノード一覧取得
	$nodeInfolist = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "getNodeInfo");  

	if ('shinsei_id' in request){
		var shinseiResult = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiData", request.shinsei_id);

		$shinsei_data = shinseiResult.data[0]; // 一行だけ取得
		Logger.getLogger().info(' [init]　$shinsei_data' + ImJson.toJSONString($shinsei_data,true));	

		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $shinsei_data);		
		
		if($shinsei_data.shinsei_status != "1"){
			$before_apply = false;
			Client.remove('before_apply_id');
		}
		
		// 編集可能チェック
		if(!chkEditable($shinsei_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		
		
		$shinsei_data.registration_flg = false;		
	
		
		// 案件情報の取得		
		if (!setMatterInfo($shinsei_data)){
			Logger.getLogger().info(' [init]　setMatterInfo = false');
			// ない場合は新規でセット
			setWorkflowOpenPage($shinsei_data);	
			
			//起案ノードにタイトルに紐づくBNEグループをセットする
			// 文書idからタイトルに紐づくグループを取得
			var ticket_type = Constant.LO_TICKET_ID_HEAD_ACCOUNT_SHINSEI;
		    var target_group = Content.executeFunction("lo/common_libs/lo_common_fnction",
		    	"getIpGroupList", $shinsei_data.shinsei_id,ticket_type);
		    Logger.getLogger().info(' [init]　$nodeUserslist' + ImJson.toJSONString($nodeUserslist,true));
			// パブリックグループは[セットコード＋＾+グループコード]にする
			var groupSet = [];
		    for (var key in target_group){
		    	$nodeUserslist.kian = {userCd:Constant.LO_GROUP_SET_CD+"^"+target_group[key]};
		    }    
	
		    //$nodeUserslist.kian = groupSet;
		    
		    Logger.getLogger().info(' [init]　$nodeUserslist' + ImJson.toJSONString($nodeUserslist,true));
		    
		    $wf_data.imwNodeSetting = nodeSetting($nodeUserslist);
			
			if($shinsei_data.sairiyou_bunsho_id != null){				
				setSairiyouNodeInfo($shinsei_data.sairiyou_bunsho_id);				
				Logger.getLogger().info(' [init]　代わり承認WF登録画面 再利用ルート情報取得）' + ImJson.toJSONString($wf_data,true));
				$sairiyoFlg = true;
			}
			
			$shinsei_data.registration_flg = true;
		}else if($shinsei_data.shinsei_status == "1" ||$shinsei_data.shinsei_status == "3" ||$shinsei_data.shinsei_status == "5"){
			Logger.getLogger().info(' [init]　setMatterInfo = true');
			
			$wf_data.imwNodeSetting = nodeSetting($nodeUserslist);
		}
		

	} else {
		//bunsho_idがない場合は、エラー画面を表示
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");

	}
	
	// 申請前か
	if(request.shinsei_id == Client.get('before_apply_id')) {
		$before_apply = true;
	}

	//申請ボタンの名称をセット
	$action_name = "申請";
	
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
	$viewCtrl.isSairiyou = false;    
    
    /*
    //再利用ボタンの表示制御
    if($kawari_data.kawari_status ==  Constant.LO_STATUS_KANRYO || $kawari_data.kawari_status ==  Constant.LO_STATUS_IKO){
    	$viewCtrl.isSairiyou = true;    
    }
    */
    
    getSettingMailUsers($shinsei_data.shinsei_id);
    
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
	
	if($userInfo.licenseeFlg =="1"){ // ライセンシーは経路非表示
		$viewCtrl.routeFlg = false;
	}else if(!$before_apply || $sairiyoFlg || !$shinsei_data.registration_flg){
		$viewCtrl.routeFlg = true;	
	}else{
		$viewCtrl.routeFlg = false;
	}

	Logger.getLogger().info(' [init]account_detail_last　$wf_data.imwNodeSetting:' + $wf_data.imwNodeSetting);
}

/**
 * 社内修正であるかチェック
 */
function chkShanaiShusei(kyodakuStatus) {
	// BNE担当グループに所属しているかを確認
	var bneTantoShozokuFlg = Content.executeFunction( "lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_KIAN);
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

	if (data.shinsei_status == Constant.LO_STATUS_ICHIJI_HOZON && data.koushin_sha != $userInfo.userCd) {
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
 * 申請ユーザ情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiList(request) {

	if ('shinsei_id' in request){
		return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountUserList", request.shinsei_id);
	}

}

/**
 * ユーザ一覧取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiUserList(shinseiId) {

	if (shinseiId != ""){
		return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiUserList", shinseiId);
	}

}

/**
 * imアカウントリスト取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKaishaAccountList(kaishaId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveKaishaAccountList", kaishaId);

}

/**
 * 契約書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiKeiyakushoSofusakiList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiKeiyakushoSofusakiList", shinseiId);

}

/**
 * 請求書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiSeikyushoSofusakiList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiSeikyushoSofusakiList", shinseiId);

}

/**
 * 契約書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountKeiyakushoSofusakiList(kaishaId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountKeiyakushoSofusakiList", kaishaId);

}

/**
 * 申請IP担当者リスト取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiIpTantoList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiIpTantoList", shinseiId);

}

/**
 * 完了通知先リスト取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiTantoKakariList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiTantoKakariList", shinseiId);

}

function getSelectableValue(request) {
	
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
	var ticket_type = Constant.LO_TICKET_ID_HEAD_ACCOUNT;
    var target_group = Content.executeFunction("lo/common_libs/lo_common_fnction",
    	"getIpGroupList", ticket_id,ticket_type);

	// パブリックグループは[セットコード＋＾+グループコード]にする
	var groupSet = [];
    for (var key in target_group){
    	groupSet.push(Constant.LO_GROUP_SET_CD+"^"+target_group[key]);
    }
    
	// BNE担当ノードに処理対処ユーザを設定
	var node={};
	node[Constant.LO_NODE_KIAN] = groupSet;
	/*var node = {
		"lo_node_appr_0":["license_out^"+target_group] 
	};*/
	Logger.getLogger().info(' [nodeSetteing]　node）' + ImJson.toJSONString(node,true));
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
function setWorkflowOpenPage(shinseiData) {

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
        imwFlowId               : $flow_id,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/kawari/kawari_list',	//呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString({"shinsei_id":shinseiData.shinsei_id}),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };

}
/**
 * 案件情報の設定
 * @param {String} 文書id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(shinseiData) {
	
	var wfResult = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "setMatterInfo", shinseiData, $userInfo);

	$wf_data = wfResult.wf_data;
	
	var systemMatterId = wfResult.systemMatterId;
	Logger.getLogger().info(' [init]　wfResult' + ImJson.toJSONString(wfResult,true));
	
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
		    
	    //$approve_flgの設定：承認ノードか否かを設定　※承認ボタンの表示制御。
	    switch(nodeId){
		    case Constant.LO_NODE_APPR_1:
		    case Constant.LO_NODE_APPR_2:
				$approve_flg = true;
				break;
			default:
				$approve_flg = false;
				break;
		}   
    }
    
    $nodeUserslist = wfResult.nodeUserslist;
    
    // 申請時はログイン者の名前を出力する
    if(nodeId == "lo_node_apply" && $proc_user_flg){
    	$nodeUserslist.apply.userName = $userInfo.userName;
    }

    return true;
}

/**
 * テーブルから設定済みのメールユーザ取得
 * 
 * @param {object} 申請情報
 */
function getSettingMailUsers(shinsei_id) {
	
	//　チケットid取得
	var ticket_id = "";
		
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';	
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';	
	
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
    strParam.push(DbParameter.string(shinsei_id));

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
    
    Logger.getLogger().info(' [getSettingMailUsers]　 $mailDefUsers '+ ImJson.toJSONString($mailDefUsers, true));
    

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
    var nodeObj = getNodeInfo();
    
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
			$nodeUserslist.kian = getProcessLatestUser(result);
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
		} 
	}
	
	/*
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
	*/
		
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
	Logger.getLogger().info(' [init]　userObj' + ImJson.toJSONString(userObj,true));
	var processTargetConfigs = []; //処理対象プラグイン情報
	// ノードごとにユーザを設定	
	var nodeId="";
	var userconf ={};
	for(var i in userObj){
		switch(i){
		case "kian":
			nodeId = Constant.LO_NODE_KIAN;
			userconf = {
				"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
			    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.public_group",
			    "parameter" : userObj[i].userCd
			};
		break;
		case "appr_1":
			nodeId = Constant.LO_NODE_APPR_1;
			userconf = {
				"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
			    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.user",
			    "parameter" : userObj[i].userCd
			};
			break;
		case "appr_2":
			nodeId = Constant.LO_NODE_APPR_2;
			userconf = {
				"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
			    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.user",
			    "parameter" : userObj[i].userCd
			};
			break;
		}
		
		processTargetConfigs = [];		

		processTargetConfigs.push(userconf);
		
		// ノード名と処理対象プラグイン情報を設定
		nodeSetting.DCNodeSetting[nodeId] = {"displayFlag" : true, "processTargetConfigs":processTargetConfigs};

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
function getNodeInfo(){
	
	var nodeObj ={
		"apply":{"node_id":Constant.LO_NODE_APPLY,"node_name":"申請者"},
		"kian":{"node_id":Constant.LO_NODE_KIAN,"node_name":"BNE担当者"},
		"appr_1":{"node_id":Constant.LO_NODE_APPR_1,"node_name":"承認者１"},
		"appr_2":{"node_id":Constant.LO_NODE_APPR_2,"node_name":"承認者２"},
		"sys":{"node_id":Constant.LO_NODE_SYS,"node_name":"システム担当者"}
	};

	return nodeObj;
}