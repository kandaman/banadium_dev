
/**
 * @fileoverview 新企画詳細画面.
 *
 * IM-Workflow用の新企画詳細画面です。
 *
 * @version $Revision$
 * @since 1.0
 */
/**
 * ワークフローパラメータオブジェクト。
 * @type Object
 */
var $data = {};
var oUserParams       = new Object();    // ユーザ入力確認情報オブジェクト add suzuki
var $from = {
	pullback_param:"",
	pullback_btn_flg:false
};

var oCaption = new Object();
var dialog = new Object();
var oValidationMsg = new Object();
function init(request) {


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
        imwCallOriginalParams   : request.imwCallOriginalParams    //呼出元ページパス
    };
    
    // 権限者コードを設定します.
    // 起票または再申請(案件操作で処理対象者の再展開を行う)の場合は、
    // リクエストパラメータの権限者コードが複数渡される場合があります.
    // その際はimwAuthUserCodeに適切な権限者コードを設定する必要があります.
    var imwAuthUserCodeList = request.getParameterValues('imwAuthUserCode');
    if(isArray(imwAuthUserCodeList) && imwAuthUserCodeList.length == 1) {
        $data.imwAuthUserCode = imwAuthUserCodeList[0];
    }

	// add suzuki ユーザー入力パラメータ取得
	oUserParams       = ImJson.toJSONString($data);
	
	// 取戻し対象か判定
	var res = Content.executeFunction("cactus/common_libs/common_fnction","getApplyTskInfo",request.imwSystemMatterId,request.imwUserCode);
	if (res != null){
		$from.pullback_param = ImJson.toJSONString(res[0]);
		//from.pullback_param = res[0];
		$from.pullback_btn_flg = true;
	}
	
	
    // 画面項目名称設定
    /*oCaption.title = MessageManager.getMessage("IMW.CAP.0394"); // 引戻し
    oCaption.detail = MessageManager.getMessage("IMW.CAP.0221"); // 詳細
    oCaption.flow = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    oCaption.resent = MessageManager.getMessage("IMW.CAP.1032"); // 履歴
    oCaption.close = MessageManager.getMessage("IMW.CAP.0039"); // 閉じる
    oCaption.systemMatterId = MessageManager.getMessage("IMW.CAP.1029"); // 案件番号
    oCaption.matterName = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    oCaption.applyExecuteUserName = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    oCaption.nodesToPullBack = MessageManager.getMessage("IMW.CAP.1053"); // 引戻し先
    oCaption.require = MessageManager.getMessage("IMW.CAP.0017"); // （必須）
    oCaption.choice = MessageManager.getMessage("IMW.CAP.0092"); // 選択
    oCaption.procDate = MessageManager.getMessage("IMW.CAP.1054"); // 処理日時
    oCaption.nodeName = MessageManager.getMessage("IMW.CAP.0250"); // ノード名
    oCaption.process = MessageManager.getMessage("IMW.CAP.0300"); // 処理
    oCaption.processUser = MessageManager.getMessage("IMW.CAP.1037"); // 処理者
    oCaption.targetAct = MessageManager.getMessage("IMW.CAP.1063"); // 代理先
    oCaption.orz = MessageManager.getMessage("IMW.CAP.1000"); // 担当組織
    oCaption.comment = MessageManager.getMessage("IMW.CAP.0318"); // コメント
    oCaption.mailTypNego = MessageManager.getMessage("IMW.CAP.1009"); // 根回し
    oCaption.search = MessageManager.getMessage("IMW.CAP.0359"); // 検索
    oCaption.remove = MessageManager.getMessage("IMW.CAP.0062"); // 解除
    oCaption.to = MessageManager.getMessage("IMW.CAP.0032"); // 宛先
    oCaption.cc = MessageManager.getMessage("IMW.CAP.0033"); // CC
    oCaption.bcc = MessageManager.getMessage("IMW.CAP.0034"); // BCC
    oCaption.subject = MessageManager.getMessage("IMW.CAP.0036"); // 件名
    oCaption.body = MessageManager.getMessage("IMW.CAP.0037"); // 本文
    oCaption.pullback = MessageManager.getMessage("IMW.CAP.0394"); // 引戻し
    oCaption.confirmTitle = MessageManager.getMessage("IMW.CAP.1196");
    */
    oCaption.pullBackTitle = MessageManager.getMessage("IMW.CAP.1205");

    oValidationMsg.confirmPullback = MessageManager.getMessage("IMW.CLI.INF.3000", MessageManager.getMessage("IMW.CAP.0394"));
    oValidationMsg.confirmClose = MessageManager.getMessage("IMW.CLI.WRN.3501");

    dialog = {
    	closeDialogMsg    : oValidationMsg.confirmClose,
    	pullbackDialogMsg : oValidationMsg.confirmPullback
    };


    //Debug.console(request);
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
    
    //result.resultFlag = false;
    //return result
    
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

    // 引戻し権限者の確定
    databaseResult = getPullbackList(pullBackManager, actvMatterManager, userId, procTyp_sbk);
    if (!databaseResult.resultFlag) {
        // 引戻し先リストの取得に失敗
        result.resultFlag = false;
        result.resultStatus.message =
                Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3507", null);
        return result;
    }
    var pullbackListWork = databaseResult.data;
    for (cnt = 0, leng = pullbackListWork.length; cnt < leng; cnt++) {
        if (pullbackListWork[cnt].nodeId == pullbackRecord.pullBackTargetNodeId) {
            pullbackRecord.authUserCode = pullbackListWork[cnt].authUserCode;
            break;
        }
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

    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック開始
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // 根回しメール権限チェック
    var paramManager = new WorkflowParameterManager();
    var negoMailFlag = paramManager.getIntegerParameter("notice-type") != 0 && paramManager.getBooleanParameter("negotiate-type");
/*    if (!negoMailFlag && (
            (!isBlank(request.toList) && request.toList.length > 0) ||
            (!isBlank(request.ccList) && request.ccList.length > 0) ||
            (!isBlank(request.bccList) && request.bccList.length > 0))) {
        // 根回しメール禁止設定だが根回しメール情報がパラメータにセットされている
        result.resultFlag = false;
        result.resultStatus.message = MessageManager.getMessage("IMW.CLI.WRN.3655");
        return result;
    }
*/
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
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック終了
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊

    // 引戻しデータの作成
    // 根回しメールの使用可否
/*    if (request.negoFlag) {
        // Procedure関数への引数生成(根回しメール情報)
        var negoMailData = {
            "to": request.toList,
            "cc": request.ccList,
            "bcc": request.bccList,
            "subject": request.subject,
            "text": request.body
        };

        // 案件情報の作成
        databaseResult = Procedure.imw_matter_utils.getMatterInfo(
                loginGroupId, localeId, request.imwSystemMatterId,
                request.nodeId[request.selectnode]);
        if (!databaseResult.resultFlag) {
            Procedure.imw_error_utils.showErrorAlert("IMW.CLI.WRN.3606", databaseResult);
        }
        var matterInfo = databaseResult.data;

        // 根回しメール設定
        var resultInfo = Procedure.imw_proc_utils.getNegoMailInfo4Param(
                loginGroupId, localeId, sysDateStr, negoMailData, matterInfo);
        if (!resultInfo.resultFlag) {
            result.resultFlag = false;
            result.resultStatus.message = resultInfo.errorMessage;
            return result;
        }
        pullbackRecord.negoModel = resultInfo.data;
    }
*/
    // 引戻し実行
    databaseResult = pullBackManager.pullBack(pullbackRecord, new Object());
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