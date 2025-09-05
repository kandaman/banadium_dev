
/**
 * @fileoverview 新企画申請画面.
 *
 * IM-Workflow用の新企画申請画面です。
 *
 * @version $Revision$
 * @author 83002381
 * @since 1.0
 */

/**
 * ワークフローパラメータオブジェクト。
 * @type Object
 */
var $data = {};

/**
 * フォーム値格納オブジェクト。
 * @type Object
 */
var $form = {
             
 matter_number:"" // 申請番号
,item_characterlistDataJSON:"" //キャラクタ申請
,item_dlc_0:true
,item_dlc_1:false
};

//var $constant = {}


/**
 * 入力チェック定義オブジェクト。
 * @type Object
 */
//
var validateRule = {
	 item_division:{caption : '事業部', required: true}
	,item_relation_applyData:{caption : '新商品企画申請書・申請番号', required: true}
	,item_itemNameJap:{caption : 'タイトル名', required: true}
};
var validateRuleTempsave = {
	item_itemNameJap:{caption : 'タイトル名', required: true}
};


function init(request) {
	Logger.getLogger().info(' [init] 申請画面表示');

	//Debug.console(Client.get('key'));
    var accountContext = Contexts.getAccountContext();
    
    // ワークフローに関するパラメータを保持します
    $data = {
        imwGroupId              : request.imwGroupId,           //グループ ID 
        imwUserCode             : request.imwUserCode,          //処理者CD
        imwPageType             : request.imwPageType,          //画面種別
        imwUserDataId           : request.imwUserDataId,        //ユーザデータ ID
        imwSystemMatterId       : request.imwSystemMatterId,    //システム案件ID
        imwNodeId               : request.imwNodeId,            //ノード ID 
        imwArriveType           : request.imwArriveType,        //到達種別
        imwAuthUserCode         : '',                           //権限者CD 
        imwApplyBaseDate        : request.imwApplyBaseDate,     //申請基準日
        imwContentsId           : request.imwContentsId,        //コンテンツ ID
        imwContentsVersionId    : request.imwContentsVersionId, //コンテンツバージョン ID 
        imwRouteId              : request.imwRouteId,           //ルート ID
        imwRouteVersionId       : request.imwRouteVersionId,    //ルートバージョン ID
        imwFlowId               : request.imwFlowId,            //フローID 
        imwFlowVersionId        : request.imwFlowVersionId,     //フローバージョンID
        imwCallOriginalPagePath : request.imwCallOriginalPagePath, //呼出元パラメータ
        imwCallOriginalParams   : request.imwCallOriginalParams,    //呼出元ページパス
        imwAuthUserCodeList     : request.getParameterValues('imwAuthUserCode')
    };
    
	if($data.imwUserCode){
		Client.set('key', $data);
	} else {
		$data = Client.get('key');
	}
	
    // 権限者コードを設定します.
    // 起票または再申請(案件操作で処理対象者の再展開を行う)の場合は、
    // リクエストパラメータの権限者コードが複数渡される場合があります.
    // その際はimwAuthUserCodeに適切な権限者コードを設定する必要があります.
    var imwAuthUserCodeList = $data.imwAuthUserCodeList;
    if(isArray(imwAuthUserCodeList) && imwAuthUserCodeList.length == 1) {
        $data.imwAuthUserCode = imwAuthUserCodeList[0];
    }

    // 定数読み込み
    Constant.load("cactus/common_libs/const");
    //Constant.load("cactus/common_libs/const");
    //Constant.define("product_name", 'moe-i');
      
    // ファイルアップロード先フォルダ設定（一時保存フォルダ）
    $form.fileuploadPath = Constant.PATH_SESSION_STORAGE;

    //マスタ情報を取得
    getMstData();

    // 画面種別毎の分岐処理を設定します。
    switch($data.imwPageType) {
        // 申請
        case '0':
        case '10':
            // 呼び出し元パラメータ取得
        	var OriginalParams = ImJson.parseJSON(URL.decode($data.imwCallOriginalParams));
        	var reAppryFlg = false;

        	// 再利用の場合値をセット
            if ('imwUserDataId' in OriginalParams){
                getTempSaveData(OriginalParams.imwUserDataId);
        		// 申請書番号をクリア
        		$form.matter_number = "";
        		// 添付ファイルをクリア
        		$form.item_tmpfileDataJSON = "";
        		// 経路設定をクリア
        		$form.item_flowDataJSON = "";
        		// メール通知者をクリア
        		$form.item_mailUserDataJSON = "";
        		// 社内共有事項クリア
        		$form.shanaimuke_kyoyujiko="";
        		
        		// 再利用フラグ
        		reAppryFlg = true;
            }
            
            // ユーザデータIDを採番します
            $data.imwUserDataId = Identifier.get();
            // 処理完了時の遷移先
            $data.imwCallOriginalPagePath ="cactus/contents/screen/fin";
 
            // ログインユーザの取得
            var ret = Procedure.getUserInfo({"user_cd":$data.imwUserCode});
            if (ret.countRow > 0){
            	var userData = ret.data;
            	//$form.login_user = userData[0].user_name + ' ' +userData[0].user_name_eng +'<br>' +userData[0].user_no;
            	$form.login_user = userData[0].user_name +'<br>' +userData[0].shain_no;
            	$form.login_user_busyo = userData[0].department_inc_name;
            	
            	// jsonで全データを持っておく
            	$form.login_userData = ImJson.toJSONString(userData[0]);
            	
            	if (!reAppryFlg){
            		// 担当者の初期値にログインユーザを指定
            		$form.tantou_user = $form.login_user;
            		$form.tantou_busyo = $form.login_user_busyo;
            		$form.tantou_user_data = $form.login_userData;
            	}
            }
            
            
            if (!reAppryFlg){
                // 申請種類
                if ('sheetType' in OriginalParams){
                	$form.item_sheetType = OriginalParams.sheetType
                }else{
                	$form.item_sheetType = '1'
                }
                $form.sheetType_name = $form.codeName_shinsei_typ[$form.item_sheetType];
           }
            

            
            break;
        // 起票
        case '2':
        case '12':
            //FIXME 必要に応じて処理を実装してください。
            break;
        // 一時保存
        case '1':
        case '11':
            // 処理完了時の遷移先
        	$data.imwCallOriginalPagePath ="cactus/contents/screen/fin";
        	// 一時保存データ取得
        	getTempSaveData($data.imwUserDataId);

            break;
        // 再申請
        case '3':
        case '13':
            // 処理完了時の遷移先
        	$data.imwCallOriginalPagePath ="cactus/contents/screen/fin";

        	// 一時保存データ取得
        	getTempSaveData($data.imwUserDataId);
            break;
        // 例外
        default:
            //エラー画面へ遷移します。
            Transfer.toErrorPage({
                title: 'エラー',
                message: 'パラメータが不正です。',
                detail: ['画面を表示するためのパラメータが不正です。'],
                returnUrl: Web.current(), // 戻り先 URL
                returnUrlLabel: '戻る',
                parameter: request
              });
            break;
    }
    
}
	
/**
 * 一時保存情報を取得します。
 * @param {Array}  申請のユーザデータID
 * @returns {boolean} 検査結果
 */
function getTempSaveData(imwUserDataId) {

		Logger.getLogger().info(' [getTempSaveData] 一時保存情報取得');
		
		// 申請情報　取得
		var result = Content.executeFunction("cactus/common_libs/common_fnction","getMyApplyUserData",imwUserDataId);
		
		var login_user = Procedure.getUserInfo({"user_cd":result.kiansha});
		var tantou_user = Procedure.getUserInfo({"user_cd":result.tantosha});
		
		$form.login_user = login_user.data[0].user_name +'<br>' + login_user.data[0].shain_no;
		$form.login_user_busyo = login_user.data[0].department_inc_name;
		$form.tantou_user = tantou_user.data[0].user_name +'<br>' + tantou_user.data[0].shain_no;
		$form.tantou_busyo = tantou_user.data[0].department_inc_name;
		// jsonで全データを持っておく
    	$form.login_userData = ImJson.toJSONString(login_user.data[0]);
    	$form.tantou_user_data = ImJson.toJSONString(tantou_user.data[0]);
		
    	// 申請種類、事業部、タイトル
		$form.item_sheetType = result.shinsei_typ_cd;
        $form.sheetType_name = $form.codeName_shinsei_typ[$form.item_sheetType];
		
		$form.item_division = result.jigyobu_cd;
		$form.item_itemNameJap = result.title_nm;
		$form.item_itemNameEng = result.title_nm_kaigai;

		// ダウンロード有無
		if (result.dlc_flg=="1"){
			$form.item_dlc_0 = false;
			$form.item_dlc_1 = true;
		}
		// ジャンル、備考
		$form.item_genre = result.genre;
		$form.item_apply_note = result.biko;
		
		// 申請書番号
		$form.matter_number = result.shinsei_no;
		
		// 社内共有事項（申請時のもの）
		$form.shanaimuke_kyoyujiko = result.shanaimuke_kyoyujiko;

		// キャラクタ情報取得
		var charaData = Content.executeFunction("cactus/common_libs/common_fnction","getMyCharacterList",$form.matter_number);
		if (charaData != null){
			$form.item_characterlistDataJSON = ImJson.toJSONString(charaData);//クライアントサイドのjavascriptで使用するのでjson変換
		}

		// 関連情報取得
		var relationApply = Content.executeFunction("cactus/common_libs/common_fnction","getRelationList",$form.matter_number,"1");
		if (relationApply != null){
			$form.item_relation_applyDataJSON = ImJson.toJSONString(relationApply);//クライアントサイドのjavascriptで使用するのでjson変換
		}
		var relationDoc = Content.executeFunction("cactus/common_libs/common_fnction","getRelationList",$form.matter_number,"2");
		if (relationDoc != null){
			$form.item_relation_docDataJSON = ImJson.toJSONString(relationDoc);//クライアントサイドのjavascriptで使用するのでjson変換
		}
		
		// 申請内容取得
		var contentData = Content.executeFunction("cactus/common_libs/common_fnction","getContentList",$form.matter_number);
		if (contentData != null){
			$form.item_contentDataJSON = ImJson.toJSONString(contentData);//クライアントサイドのjavascriptで使用するのでjson変換
		}
		
		// 添付ファイル取得
		var tmpfileData = Content.executeFunction("cactus/common_libs/common_fnction","getTmpfileList",$form.matter_number);
		if (tmpfileData != null){
			//$form.item_tmpfileDataJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(tmpfileData));//クライアントサイドのjavascriptで使用するのでjson変換
			$form.item_tmpfileDataJSON = ImJson.toJSONString(tmpfileData);//クライアントサイドのjavascriptで使用するのでjson変換
		}
		
		// 経路取得
		var flowData = Content.executeFunction("cactus/common_libs/common_fnction","getFlowList",$form.matter_number);
		if (flowData != null){
			$form.item_flowDataJSON = ImJson.toJSONString(flowData);//クライアントサイドのjavascriptで使用するのでjson変換
		}
		
		// メール通知者取得
		var mailUserData = Content.executeFunction("cactus/common_libs/common_fnction","getMailUserList",$form.matter_number);
		if (mailUserData != null){
			$form.item_mailUserDataJSON = ImJson.toJSONString(mailUserData);//クライアントサイドのjavascriptで使用するのでjson変換
		}


}

	
	
	
/**
 * マスタから各種情報を取得しfrom変数に格納します。
 * @param {Array}  検査する配列
 * @param {Object} 検査対象値
 * @returns {boolean} 検査結果
 */
function getMstData() {

	//Debug.console(Constant.PATH_SESSION_STORAGE);

    var db = new TenantDatabase();

    // 申請書
    var result = db.select("select * from m_shinsei_typ where sakujo_flg='0' order by sort_no");
    var list= {};
    for (var i=0;i < result.countRow;i++){
    	list[result.data[i].shinsei_typ_cd] = result.data[i].shinsei_typ_nm;
    }
    //codeNameList["shinsei_typ"] = list;
    $form.codeName_shinsei_typ = list;
    
    /*var list= [{label : "" ,value : ""}];
    for (var i=0;i < result.countRow;i++){
    	list[i+1] = {label : result.data[i].shinsei_typ_nm ,value : result.data[i].shinsei_typ_cd};
    }
    $form.list_m_shinsei_typ = list;
    */
    

    // 通貨
    result = db.select("select * from m_tuka where sakujo_flg='0' order by sort_no");
    var list= [{label : "" ,value : ""}];
    for (var i=0;i < result.countRow;i++){
    	list[i+1] = {label : result.data[i].tuka_nm ,value : result.data[i].tuka_cd};
    }
    $form.list_m_tuka = list;


    // 事業部
    result = db.select("select * from m_jigyobu where sakujo_flg='0' order by sort_no");
    var list= [{label : "" ,value : ""}];
    for (var i=0;i < result.countRow;i++){
    	list[i+1] = {label : result.data[i].jigyobu_nm ,value : result.data[i].jigyobu_cd};
    }
    $form.list_m_jigyobu = list;

    // 価格帯
    result = db.select("select * from m_cd where sakujo_flg='0' and cd_id='0001' order by sort_no desc");
    list = [];
    var list= [{label : "" ,value : ""}];
    for (var i=0;i < result.countRow;i++){
    	list[i+1] = {label : result.data[i].cd_naiyo ,value : result.data[i].cd_chi};
    }
    $form.list_price_type = list;


    // プラットフォーム
    result = db.select("select * from m_platform_jigyobu_himoduke j inner join m_platform p on j.platform_cd = p.platform_cd where j.sakujo_flg='0' and p.sakujo_flg='0' order by j.jigyobu_cd,p.sort_no ");
    //list= [];
    var listObj= {};
    for (var i=0;i < result.countRow;i++){
    	var data = result.data[i];
    	// 事業部コードが存在してなければ配列として追加
    	if (!(data.jigyobu_cd in listObj)) {
    		listObj[data.jigyobu_cd] = [{label : "" ,value : ""}];
    	}
    	listObj[data.jigyobu_cd].push({label : data.platform_nm ,value : data.platform_cd});
    }
    $form.list_m_platformJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(listObj));//クライアントサイドのjavascriptで使用するのでjson変換してhiddenに格納
    
    


}
	
/**
 * 配列に指定値が含まれているか検査します。
 * @param {Array}  検査する配列
 * @param {Object} 検査対象値
 * @returns {boolean} 検査結果
 */
function _contains(array, value) {
    
    if (isBlank(array)) {
        return false;
    }
    
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

/**
* ファイルダウンロード
**/
function downloadfile(request) {
	Logger.getLogger().info(' [downloadfile]　ファイルダウンロード[ファイル名：' + request.fileName +"]");
	
	// 定数読み込み
    Constant.load("cactus/common_libs/const");
    
    var fileName = request.fileName
    var filePath = request.filePath
    var sinsei_no = request.sinsei_no

	//var filname = "/imart/upload/test/"+name;
    //var PATH_PUBLIC_STORAGE = '/imart/upload/'; //ファイル保存フォルダ
    //var Constant.PATH_SESSION_STORAGE = '/imart/upload/'; //ファイル一時保存フォルダ
	
	var storagePath = Constant.PATH_SESSION_STORAGE + filePath;
	// 一時保存ファイルからファイル取得
	var storage = new SessionScopeStorage(storagePath);
    if(storage.isFile()) {
    	Module.download.send(storage, fileName); //名前を変換してダウンロード
    	return;
    }
    
	
	var storagePath2 = Constant.PATH_PUBLIC_STORAGE + sinsei_no + '/' + filePath;
	var storage2 = new PublicStorage(storagePath2);
	
    if(!storage2.isFile()) {
        // ファイルが存在しない場合は例外処理を行います。
    	//Debug.print(storage2.getPath());
    } else {
    	//Debug.print(fileName);
    	// ファイルをダウンロード
    	//Module.download.send(storage, storage.getName(), "text/plain"); //名前を変換してダウンロード
    	Module.download.send(storage2, fileName); //名前を変換してダウンロード
    }
}


//=============================================================================
//一時保存　処理関数
//  【 入力 】request: ＵＲＬ引数取得オブジェクト
//  【 返却 】なし
//  【作成者】NTT DATA INTRAMART
//  【 概要 】ワークフローの一時保存処理を実行します。
//=============================================================================
function temporarySave(request){
	Logger.getLogger().info(' [temporarySave] 一時保存');

   // セッション情報
   var sessionInfo = Contexts.getAccountContext();
   var groupId = sessionInfo.loginGroupId;
   var userCode = sessionInfo.userCd;
   var localeId = sessionInfo.locale;

   // 処理結果オブジェクトの生成
   var resultInfo = {
           "resultFlag" : false,
           "errorMessage" : ""
   };

   // ユーザデータID
   var imwUserDataId = request.imwUserDataId;
   // システム日付
   var sysDate = Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone();

   var result;

   // 一時保存用パラメータ
   var tempSaveParams = request.tempSaveParams;
   // セッションから実行者コードをセット
   tempSaveParams.applyExecuteUserCode = userCode;

   // ユーザパラメータ
   var userParam = request.userParams;

   // 代理の場合 (ログインユーザと申請者が異なる場合)
   /*if (tempSaveParams.applyExecuteUserCode != tempSaveParams.applyAuthUserCode) {
       // 代理権限 (申請) のチェック
       result = Procedure.imw_proc_utils.checkActUser(
               groupId, localeId, sysDate, OriginalActList.APPLY_AUTH,
               tempSaveParams.applyExecuteUserCode, tempSaveParams.applyAuthUserCode,
               tempSaveParams.flowId);

       // 代理権限の取得に失敗した場合
       if (!result.resultFlag) {
           resultInfo.errorMessage =
                   Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3622", result);
           return resultInfo;
       }

       // 代理権限がない場合
       if (!result.actFlag) {
           resultInfo.errorMessage =
                   Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3531", result);
           return resultInfo;
       }
   }*/

   // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
   // ＊フロー設定に関する各種チェック開始
   // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
   // フローの有効チェック
   var codeUtil = new WorkflowCodeUtil();
   var versionStatus_UserEnabled = codeUtil.getEnumCodeVersionStatus("versionStatus_UserEnabled");
   var flowDataManager  = new FlowDataManager();
   result = flowDataManager.getTargetFlowDataWithLocale(
           tempSaveParams.flowId, tempSaveParams.applyBaseDate, localeId);
   if(result.error) {
       // 検索エラー
       resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3622", result);
       return resultInfo;
   }
   if(isNull(result.data) || result.data.versionStatus != versionStatus_UserEnabled) {
       // 有効なバージョンが存在しない
       resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3521", result);
       return resultInfo;
   }
   var targetFlowDetail = result.data.targetFlowDetails[0].flowDetail;

   // 一時保存実行権限
   var paramManager = new WorkflowParameterManager();
   var tempSaveFlag = paramManager.getBooleanParameter("temporary-save");
   if (!tempSaveFlag) {
       // 一時保存機能が無効に設定されている
       resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.INF.3531");
       return resultInfo;
   }
   // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
   // ＊フロー設定に関する各種チェック終了
   // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊

   // 案件情報の作成 (案件未作成のため手動で取得)
   var matterInfo = new Object();
   matterInfo.systemMatterId = ""; // システム案件IDは未採番
   matterInfo.userDataId = imwUserDataId;
   matterInfo.contentsId = targetFlowDetail.contentsId;
   matterInfo.contentsVersionId = targetFlowDetail.contentsVersionId;
   matterInfo.routeId = targetFlowDetail.routeId;
   matterInfo.routeVersionId = targetFlowDetail.routeVersionId;
   matterInfo.flowId = targetFlowDetail.flowId;
   matterInfo.flowVersionId = targetFlowDetail.flowVersionId;
   matterInfo.nodeId = tempSaveParams.applyNodeId;
   // 権限者が申請実行可能かチェック
   var routeDataManager = new RouteDataManager(groupId);
   result = routeDataManager.getRoutePluginDataWithNode(
           matterInfo.routeId, matterInfo.routeVersionId, matterInfo.nodeId);
   if (!result.resultFlag || isBlank(result.data) || result.data.length == 0) {
       // ルートユーザ設定情報検索エラー
       resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
               "IMW.CLI.WRN.3521", result);
       return resultInfo;
   }
   var plugins = result.data;  // プラグイン情報配列

   result = Procedure.imw_proc_utils.getApplyAuthUserName(
           groupId, localeId, plugins, tempSaveParams.applyBaseDate,
           tempSaveParams.applyAuthUserCode, matterInfo);
   if (!result.resultFlag) {
       // 申請者名の取得エラー
       resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
               "IMW.CLI.WRN.3622", result);
       return resultInfo;
   } else if (isNull(result.data)) {
       // 申請権限者が対象者に存在しない
       resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
               "IMW.CLI.WRN.3634", result);
       return resultInfo;
   }

   // マネージャ生成
   var tempSaveMatter  = new TempSaveMatter(localeId);
   var tempSaveManager = new TempSaveManager(localeId);

   // 一時保存情報の取得
   result = tempSaveMatter.getTempSaveMatter(imwUserDataId);
   if (!result.resultFlag) {
       // 検索エラー
       resultInfo.errorMessage =
               Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3622", result);
       return resultInfo;
   }

   // 一時保存処理実行
   if (isBlank(result.data)) {
       // 一時保存が存在しない: 一時保存(create)
       result = tempSaveManager.createTempSaveMatter(tempSaveParams, userParam);
   } else {
       // 一時保存が存在: 一時保存(update)
       result = tempSaveManager.updateTempSaveMatter(tempSaveParams, userParam);
   }

   

   if (!result.resultFlag) {
       resultInfo.errorMessage =
               Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
               "IMW.CLI.WRN.3622", result);
       return resultInfo;
   }else{
	   // 一時保存で作成された申請番号を取得  
		var ret = Content.executeFunction("cactus/common_libs/common_fnction","getMyApplyUserData",imwUserDataId);
		resultInfo.shinsei_no = ret.shinsei_no;
   }
   

   // 正常終了
   resultInfo.resultFlag = true;
   return resultInfo;
}