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
	,shinsei_cls_list:[]
	,shinsei_cls_list_add:[]
}; // 画面表示用変数
var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $validationErrorMessages = [];

var $shinsei_data = {};

var $keiyakusho_data = {}; //契約書送付先マスタデータ
var $seikyusho_data = {}; //請求書送付先マスタデータ
var $flow_id; //フローID

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
var $tsuchisakiObj = {}; // 通知先

var $new_window_flg = false; // 新規ウィンドウフラグ


/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　代わりWF編集画面表示 start');

	// ユーザー情報読み込み
	loadUserInfo();	

	//フロー設定
	$flow_id = Constant.LO_FLOW_ACCOUNT_SHANAI;
	$viewCtrl.bneFlow = false;
	
	//バリデーション実行フラグ TODO:開発時いったんfalse
	$viewCtrl.validation = true;
	
	//ログイン情報から取得した会社情報をセットする
	$shinsei_data.kaisha_id = $userInfo.userCompanyDepartment.companyCd;
	$shinsei_data.kaisha_nm = $userInfo.userCompanyDepartment.companyName;	
	
	var dt = new Date();
	$shinsei_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', dt);

	// ライセンシーの場合は表示させない	
	if($userInfo.licenseeFlg == '1'){
		Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}

	// マスタから初期表示用情報を取得
	getSelectableValue(request);

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();		
	
	// 固定値マスタより詳細上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KAWARI_DETAIL_MAX);
	$kawariDetailMax = $tmpList[0];
	
	$kawariDetailMax = "500";
	
	// セッション削除
	Client.remove('before_apply_id');		

	if ('shinsei_id' in request){
		Logger.getLogger().info(' [init]　文書番号：'+request.shinsei_id);
		var shinseiResult = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiData", request.shinsei_id);

		$shinsei_data = shinseiResult.data[0]; // 一行だけ取得		
		//Logger.getLogger().info(' [init]　'+ ImJson.toJSONString($kawari_data));		
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $shinsei_data);

		//すでに文書番号が存在する場合は、フラグをfalseにする
		$shinsei_data.registration_flg = false;
		
		// 修正依頼で差し戻された場合は案件情報の取得、それ以外（一時保存）の場合は、新規でセット
		//if ($kawari_data.kawari_status == Constant.LO_STATUS_SHUSEI_IRAI && $proc_user_flg) {
		if ($shinsei_data.shinsei_status == Constant.LO_STATUS_SHUSEI_IRAI || $shinsei_data.shinsei_status == Constant.LO_STATUS_SASHIMODOSHI
				|| $shinsei_data.kawari_status == Constant.LO_STATUS_TEISHUTSU){
			if (!setMatterInfo($shinsei_data)){				
				// ワークフローパラメータの設定				
				setWorkflowOpenPage($shinsei_data);						
			}else{
				if($nodeUserslist.kian && $nodeUserslist.kian.userCd =="---"){
					$nodeUserslist.kian = $nodeUserslist.apply;
				}
			}
			
		
		}else{
			Logger.getLogger().info(' [init]　社内アカウント申請WF登録画面 新規申請');
			setWorkflowOpenPage($shinsei_data);
			
			if($shinsei_data.sairiyou_shinsei_id != null){
				//再利用元IDのノード情報を取得する
				setSairiyouNodeInfo($shinsei_data.sairiyou_shinsei_id);
				//Logger.getLogger().info(' [init]再利用あり　'+ ImJson.toJSONString($nodeUserslist));	
			}else{
				$nodeUserslist.apply = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.kian = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_1 = {"userName":"---","userCd":"---","execFlg":false};
				$nodeUserslist.appr_2 = {"userName":"---","userCd":"---","execFlg":false};				
				$nodeUserslist.sys = {"userName":"---","userCd":"---","execFlg":false};
			}
			
		}
	} else {

		$shinsei_data.shinsei_id = '';
		$shinsei_data.registration_flg = true;

		setWorkflowOpenPage($shinsei_data);
	}
    
	// 新規登録時以外は、編集可能チェック
	if(!$shinsei_data.registration_flg){
		// 編集可能チェック
		if(!chkEditable($shinsei_data)){
			//Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		//起案ノードかつステータスが受付中、差し戻しで、処理対象者の場合は、フラグをtrueにする
		if ($wf_data.imwNodeId == Constant.LO_NODE_KIAN
				&& ($shinsei_data.kawari_status == Constant.LO_STATUS_TEISHUTSU || $shinsei_data.kawari_status == Constant.LO_STATUS_SASHIMODOSHI) 
				&& $proc_user_flg
			) {
			$shanaiShuseiFlg = true;
		}
	}

	// 申請日に値がない場合は、システム日付を設定
	if ($shinsei_data.shinsei_bi == null) {
		var dt = new Date();
		$shinsei_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', dt);		
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
	
	$form.shinsei_cls_list = [{value:"1",label:"追加"},{value:"2",label:"変更"},{value:"3",label:"削除"}];
	
	//IP担当者の申請区分
	$form.shinsei_cls_list2 = [{value:"1",label:"追加"},{value:"3",label:"削除"}];
	
	var shoninKeiroList = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShoninKeiroList"); 
	//承認経路のリストデータ(JSON)
	$form.shonin_keiro_list_json = "";
	
	for(var i in shoninKeiroList.data){
		$form.shonin_keiro_list_json+= "["+shoninKeiroList.data[i].keiro_nm+"] ";
		$form.shonin_keiro_list_json+= shoninKeiroList.data[i].ichiji_shonin_nm;
		$form.shonin_keiro_list_json+=shoninKeiroList.data[i].niji_shonin_nm != undefined ? " → "+shoninKeiroList.data[i].niji_shonin_nm:"";
		$form.shonin_keiro_list_json+=shoninKeiroList.data[i].sanji_shonin_nm != undefined ? " → "+shoninKeiroList.data[i].sanji_shonin_nm:"";
		$form.shonin_keiro_list_json+=shoninKeiroList.data[i].yoji_shonin_nm != undefined ? " → "+shoninKeiroList.data[i].yoji_shonin_nm:"";
		
		$form.shonin_keiro_list_json+= "<br>";
	}	
	
	//承認経路のリストデータ（セレクトボックス用）
	$form.shonin_keiro_list = [{}];
	$form.shonin_keiro_list = $form.shonin_keiro_list.concat(shoninKeiroList.data);
	Content.executeFunction("lo/common_libs/lo_common_fnction", "toSelectList",$form.shonin_keiro_list,"keiro_nm","keiro_id");
	
	// 利用グループのセレクトボックス
	$form.riyo_group_list = [];
	Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList",$form.riyo_group_list,"0085");
	
	
	
	
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
	if (data.shinsei_status != Constant.LO_STATUS_ICHIJI_HOZON &&
			data.shinsei_status != Constant.LO_STATUS_SASHIMODOSHI) {
		// 一時保存,差し戻しのみOK
		return false;
	}

	//　下記の場合、フロー情報から
	if (data.shinsei_status == Constant.LO_STATUS_ICHIJI_HOZON && data.koushin_sha != $userInfo.userCd) {
		// 一時保存か修正依頼のみOK
		return false;
	}
	
	if (data.shinsei_status == Constant.LO_STATUS_SASHIMODOSHI && data.nyuryoku_sha_id != $userInfo.userCd) {
		// 一時保存か修正依頼のみOK
		return false;
	}	
	
	return true;
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "getUserInfo"); 
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

function updateAccount(request, shinseiFlg) {
	Logger.getLogger().info(' [updateAccount]　updateAccount start');
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	Logger.getLogger().info(' [updateAccount]request　'+ ImJson.toJSONString(request));	

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

	var shinseiId;
	var functionResult = {
	    error: false,
		shinsei_id: "",
		message: MessageManager.getMessage('KY02I012')
	};
	
	Logger.getLogger().info(' [updateShinsei]　updateShinseiData ' + ImJson.toJSONString(request, true));
	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('shinsei_data' in request){
			var data = request.shinsei_data;
			var shinsei_status = request.shinsei_status;
			var upObject = {};				
			upObject.flow_id = data.flow_id;
			upObject.kaisha_id = data.kaisha_id;
			upObject.kaisha_nm = data.kaisha_nm;
			
			//upObject.natsuin_change_flg = data.natsuin_change_flg;
			upObject.shinsei_title_cd = data.shinsei_title_cd;
			
			upObject.shinsei_bi = new Date(data.shinsei_bi);			
			upObject.biko = data.biko;
			
			upObject.shinsei_status = shinsei_status;
			
			upObject.shinsei_sha_id = $userInfo.userCd;
			upObject.shinsei_sha_nm = $userInfo.userName;			
			
            shinseiId = data.shinsei_id;
			Logger.getLogger().info(' [updateShinsei]　申請番号： ' + shinseiId);
			if (!shinseiId) {
				// 登録
				var header = Constant.LO_TICKET_ID_HEAD_SHANAI_ACCOUNT_SHINSEI;//社内アカウント申請
				Logger.getLogger().info(' [header]' + header);
				
				shinseiId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", header);
				upObject.shinsei_id = shinseiId;				

				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
				
				//申請テーブルにinsert
				db.insert('lo_t_account_shinsei', upObject);
				functionResult.shinsei_id = shinseiId;
				Logger.getLogger().info(' [updateShinsei] insert 文書番号：'+shinseiId);				
				
			} else {				
				Logger.getLogger().info(' [updateShinsei] update 文書番号：'+shinseiId);
				// 更新
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				functionResult.shinsei_id = shinseiId;
				
	         	var result = db.update('lo_t_account_shinsei', upObject, "shinsei_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(shinseiId), DbParameter.string(data.koushin_bi)]);
	         	
				if (result.countRow == 0) {
					// 排他エラー処理
					Logger.getLogger().error(' [updateKawari] 排他エラー key ' + shinseiId + ', ' + data.koushin_bi);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E004');
					return;
				}			

			}
			
			
			if ('shinsei_list' in request) {	
				updateAccountUser(db,request.shinsei_list,shinseiId);						
			}			
			
			if ('ip_tanto_list' in request) {	
				updateIpTanto(db,request.ip_tanto_list,shinseiId);						
			}
			
	}
		
	});
	
	
	//if (!chkShanaiShusei(request.kyodaku_status)) {
		//if(shinseiFlg) {
			Client.set('before_apply_id',shinseiId);
			Logger.getLogger().info(" Client.set('before_apply_id',shinseiId); " + shinseiId);
		//}
	//}

	return functionResult;
}

/**
 * アカウント申請削除（論理削除）
 */
function deleteShinsei (param) {
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		shinsei_id : param
	};
	
	// DB更新内容
	var dataSet = {
		sakujo_flg  : '1',
		shinsei_status  : Constant.LO_STATUS_SAKUJO
	}
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	//検索条件設定
	var whereObject = [DbParameter.string(param.shinsei_id),DbParameter.string(param.koushin_bi)];
	var result = {};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		// 論理削除
		Logger.getLogger().info(' [deleteShinsei] 申請番号：'+param.shinsei_id);
		result = db.update('lo_t_account_shinsei', dataSet,"shinsei_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",whereObject);
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

	var message_id_header = "AS02E";
	var message_last_num = 10;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	//汎用メッセージ追加
	message_ids.push("ER02E001");
	
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {String} 企画id
 */
function setWorkflowOpenPage(shinseiData) {

	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定
	
	var orgParams = {"shinsei_id":shinseiData.shinsei_id,	                 
	                 "registration_flg":shinseiData.registration_flg
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
        imwFlowId               : $flow_id,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/account/account_list',	//呼出元ページパス
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
		case "sys":
			nodeId = Constant.LO_NODE_SYS;
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
function setMatterInfo(shinseiData) {
	Logger.getLogger().info(' [setMatterInfo]　start');
	var wfResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "setMatterInfo", shinseiData, $userInfo);
	
	$wf_data = wfResult.wf_data;
	//Logger.getLogger().info(' [setSairiyouNodeInfo]　wfResult ' + ImJson.toJSONString(wfResult, true));
	
	if(wfResult === false){
		return false;
	}
	
	var systemMatterId = wfResult.systemMatterId;
    var type = wfResult.type;
    var nodeId = wfResult.wf_data.imwNodeId;   
    
    $nodeUserslist = wfResult.nodeUserslist;
    
    $proc_user_flg = wfResult.proc_user_flg;
    
    return true;
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
 * ユーザ一覧取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountUserInfo(userCd) {
	var result = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountUserInfo", userCd);
	
	var userInfo = result.data[0];
	
	var riyoGroup = getUserRiyoGroupList(userCd);	
	userInfo.riyo_group = riyoGroup;
	
	return userInfo;
}

/**
 * ユーザ一覧取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountUserList(kaishaId) {
	
		return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountUserList", kaishaId);
}

/**
 * ユーザ一覧取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiUserList(shinseiId) {
	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiUserList", shinseiId);
}

/**
 * IP担当者グループ取得
 * @param userCd ユーザID
 * @returns {DatabaseResult} 検索結果
 */
function getUserIpGroupList(userCd) {
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserIpGroupList", userCd);
}

/**
 * IP担当者グループ取得
 * @param userCd ユーザID
 * @returns {DatabaseResult} 検索結果
 */
function getUserTantoKakariList(userCd) {
	
	// 特定**　パブリックグループを取得
	var searchStr = 'lo_specific_group';
	
	var db = new TenantDatabase();
	var sql = " SELECT * ";
	sql += " FROM imm_public_grp_ath ath  ";
	sql += " inner join imm_public_grp grp";
	sql += " ON ath.public_group_cd = grp.public_group_cd ";
	sql += " WHERE ath.delete_flag = '0' ";
	sql += "   AND ath.start_date <= CURRENT_DATE ";
	sql += "   AND ath.end_date > CURRENT_DATE ";
	sql += "   AND ath.public_group_cd like ? ";
	sql += "   AND ath.user_cd like ? ";

	var param = [];
	
	param.push(DbParameter.string(searchStr+'%'));
	param.push(DbParameter.string(userCd));
	
	var result = db.select(sql,param);
	var list = result.data;
	
	Logger.getLogger().info('list' + ImJson.toJSONString(list,true));

	return list;

}

/**
 * 利用グループ取得
 * @param userCd ユーザID
 * @returns {DatabaseResult} 検索結果
 */
function getUserRiyoGroupList(userCd) {
	// ユーザが所属しているすべてのパブリックグループを取得
	var userGroupList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUsergroupByUserCd", userCd);

	// 複数所属を考慮
	var riyoGroup = [];
	
	for(var i in userGroupList){
		if(riyoGroup.indexOf("1") < 0 && userGroupList[i].public_group_cd.indexOf("lo_approva_group_0_") > -1){
			riyoGroup.push(Constant.LO_RIYO_GROUP_IP_TANTO);			
		}		
		switch(userGroupList[i].public_group_cd){
			case Constant.LO_GROUP_CD_CONTRACT :// 契約	
				riyoGroup.push(Constant.LO_RIYO_GROUP_KEIYAKU_TANTO);
				break;
			case Constant.LO_GROUP_CD_ACCOUNT :// 計上	
				riyoGroup.push(Constant.LO_RIYO_GROUP_KEIJO_TANTO);
				break;
			case Constant.LO_GROUP_CD_SHOHYO :// 商標	
				riyoGroup.push(Constant.LO_RIYO_GROUP_SHOHYO_TANTO);
				break;			
			case Constant.LO_GROUP_CD_KAWARI_INPUT ://代わりWF入力グループ 	
				riyoGroup.push(Constant.LO_RIYO_GROUP_KAWARI_INPUT);
				break;
			case Constant.LO_GROUP_CD_PRODUCTION ://ライセンスプロダクショングループ 	
				riyoGroup.push(Constant.LO_RIYO_GROUP_OTHER);
				break;				
			default :
				
				break;
		}
	
	}
	
	Logger.getLogger().info("riyoGroup" + ImJson.toJSONString(riyoGroup, true));	
	
	return riyoGroup;
	
}


/**
 * 契約書送付先申請データ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiKeiyakushoSofusakiList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiKeiyakushoSofusakiList", shinseiId);

}

/**
 * 契約書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountKaisha(kaishaId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountKaisha", kaishaId);

}

/**
 * 契約書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiKaisha(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiKaisha", shinseiId);

}

/**
 * 請求書送付先マスタデータ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveAccountSeikyushoSofusakiList(kaishaId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveAccountSeikyushoSofusakiList", kaishaId);

}

/**
 * 請求書送付先申請データ取得
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShinseiSeikyushoSofusakiList(shinseiId) {

	return Content.executeFunction("lo/contents/screen/account/account_data_retriever", "retrieveShinseiSeikyushoSofusakiList", shinseiId);

}

	/**
 * メールアドレスの存在チェック
 * @param kaishaId 会社ID
 * @returns {DatabaseResult} 検索結果
 */
function mailExistsCheck(mailAddress) {
	
	var param = {mail_address: mailAddress};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  u.email_address1 ";
	sql += "FROM ";
	sql += "  imm_user AS u ";
	sql += "WHERE " ;
	sql += "  u.delete_flag ='0' ";	
	
	columnNameMap["mail_address"] = {col:"u.email_address1",comp:"eq"};	
	
	// 条件設定
	var strParam=[];
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);

	// メールアドレスがすでに存在する場合はtrue,存在しない場合はfalse
	if (result.countRow == 0) {
		return false;
	} else {
		return true;
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
 * 申請ユーザ情報更新
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function updateAccountUser(db,list,shinseiId) {
	
	//delete→insert
	db.remove("lo_t_account_user", "shinsei_id ='"+shinseiId+"'");	

	var upObject ={};
	for (var key in list) {

		var dataObj = list[key];
		
	    upObject.shinsei_id = shinseiId;
	    upObject.shinsei_edaban = parseInt(dataObj.shinsei_edaban);
	    upObject.shinsei_cls = dataObj.shinsei_cls;
	    upObject.user_cd = dataObj.user_cd;
	    upObject.user_nm = dataObj.user_nm;
	    upObject.user_kana = dataObj.user_kana;
	    upObject.busho_cd = dataObj.busho_cd;
	    upObject.mail_address = dataObj.mail_address;
	    upObject.shonin_keiro = dataObj.shonin_keiro;
	    upObject.riyo_group = dataObj.riyo_group;
	    upObject.sakujo_flg = '0';	    
	    
		upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
		Logger.getLogger().info('upObject '+ ImJson.toJSONString(upObject, true));    
	    var result = db.insert ('lo_t_account_user', upObject);

	}
	
	return result;
}

/**
 * 申請ユーザ情報更新
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function updateIpTanto(db,list,shinseiId,kaishaId) {
	Logger.getLogger().info('updateIpTanto start');  
	//delete→insert
	db.remove("lo_t_account_ip_tanto", "shinsei_id ='"+shinseiId+"'");
	
	db.remove("lo_t_account_tanto_kakari", "shinsei_id ='"+shinseiId+"'");
	
	var idx = 1;
	var idx2 = 1;
	for (var key in list) {
		Logger.getLogger().info('upObject '+ ImJson.toJSONString(list[key], true)); 
		// IP担当グループ
		var upObject = {};						
		upObject.shinsei_edaban = parseInt(list[key].shinsei_edaban);
	    upObject.shinsei_id = shinseiId;	    
	    upObject.user_cd = list[key].user_cd;
	    upObject.sakujo_flg = '0';
	    
	    var list2 = list[key].group_list;
	    
	    for(var key2 in list2) {
	    	upObject.group_edaban = idx;
	    	upObject.group_cd = list2[key2];
			upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
			Logger.getLogger().info('upObject '+ ImJson.toJSONString(upObject, true));    
		    var result = db.insert ('lo_t_account_ip_tanto', upObject);
		    
		    idx++;
	    }    
	    
	    
	    // 完了通知先
	    var upObject2 = {};						
		upObject2.shinsei_edaban = parseInt(list[key].shinsei_edaban);
	    upObject2.shinsei_id = shinseiId;
	    upObject2.sakujo_flg = '0';
	    
	    var list3 = list[key].tanto_kakari_list;
	    
	    for(var key3 in list3) {
	    	upObject2.tanto_kakari_edaban = idx2;
	    	upObject2.tanto_kakari_cd = list3[key3];
			upObject2 = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject2, true);
			Logger.getLogger().info('upObject '+ ImJson.toJSONString(upObject2, true));    
		    var result = db.insert ('lo_t_account_tanto_kakari', upObject2);
		    
		    idx2++;
	    }
	    
	    
	    
	    //loopを抜けたらカウンタをリセット
	    idx = 1;
	    idx2 = 1;
	}
	
	return result;
}

function getTsuchisaki(ticketId) {
	Constant.load('lo/common_libs/lo_const');
	var mailKey1 = 'mail_1';
	var mailKey3 = 'mail_3';
	
	var mailGroupList = {};
	mailGroupList[Constant.LO_MAIL_GROUP_KIAN] = mailKey1;
	mailGroupList[Constant.LO_MAIL_GROUP_END] = mailKey3;
	
	$tsuchisakiObj = Content.executeFunction('lo/common_libs/lo_send_mail', 'getMailSettingUsers', ticketId, mailGroupList);
	
	var noUserObj = {user_cd : "", user_name : "---"};
	if (!$tsuchisakiObj[mailKey1] || $tsuchisakiObj[mailKey1].length == 0) {
		$tsuchisakiObj[mailKey1] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey3] || $tsuchisakiObj[mailKey3].length == 0) {
		$tsuchisakiObj[mailKey3] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey4] || $tsuchisakiObj[mailKey4].length == 0) {
		$tsuchisakiObj[mailKey4] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey5] || $tsuchisakiObj[mailKey5].length == 0) {
		$tsuchisakiObj[mailKey5] = [noUserObj];
	}
	
}

