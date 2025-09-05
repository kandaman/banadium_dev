var oRequest            = new Object();     // リクエスト情報オブジェクト
var oRequestJSON        = "";               // リクエスト情報オブジェクト(JSON文字列)
var oDisplayInfo        = new Object();     // 画面表示情報オブジェクト
var oProcParams         = null;             // 処理情報オブジェクト
var oProcParamsJSON     = "";               // 処理情報オブジェクト(JSON文字列)
var oNotEscapeDispInfo  = new Object();     // HTMLエスケープをしない画面表示情報オブジェクト
var oCaption            = new Object();     // 画面表示文言オブジェクト
var oDefine             = new Object();     // 定義情報オブジェクト
var oValidationJSON     = "";               // 入力チェック用オブジェクト(JSON文字列)
var oWorkflowParamsJSON = "";               // ワークフローパラメータ(JSON文字列)

var separator = "^";

var dialog = new Object();

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

//=============================================================================
// 確認画面　初期化関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】確認画面を表示します。
//=============================================================================
function init ( request ) {

    // クライアントタイプの一時切り替えを実行（スマートフォン端末でPC画面に/PCでスマートフォン画面にアクセスした場合の対処）
    ClientTypeSwitcher.oneTimeSwitchTo(IMW_CLIENT_TYPE);

    var CALLBACK_FUNCTION = "parent.GB_closeWithImwCallBack";

    // URLチェック
    if (!Procedure.imw_proc_utils.checkUrl(request)) {
        Procedure.imw_error_utils.showErrorGreyboxClose("IMW.CLI.WRN.3675", "", CALLBACK_FUNCTION);
    }

    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var groupId = sessionInfo.loginGroupId;
    var userCode = sessionInfo.userCd;
    var localeId = sessionInfo.locale;

    // ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();

    // 各種定義情報取得
    oDefine = getDefineValues(codeUtil);

    // 画面表示キャプション取得
    oCaption = getCaption();

    // 入力チェック用オブジェクトの生成
    oValidationJSON = Procedure.imw_utils.escapeHTML(getValidation(sessionInfo));

    // 汎用ローカル変数
    var result;
    var cnt;

    oRequest.imwGroupId            = groupId;
    oRequest.imwUserCode           = userCode;
    oRequest.imwSystemMatterId     = Procedure.imw_utils.getValue(request.imwSystemMatterId, "");
    oRequest.imwNodeId             = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwPageType           = Procedure.imw_utils.getValue(request.imwPageType, "");
    oRequest.imwCallType           = Procedure.imw_utils.getValue(request.imwCallType, "");

    // 次のパラメータは画面遷移して戻ってきたときに取得すべき値
    oRequest.imwWorkflowParams     = Procedure.imw_utils.getValue(request.imwWorkflowParams, "");

    // imwCallOriginalParamsについて
    // imwCallOriginalParamsはPC版の遷移ではリクエストパラメータに含まれないが、
    // スマートフォン版の遷移では含まれ、一覧へ戻る際のパラメータとして必要となる。
    var imwCallOriginalParams = Procedure.imw_utils.getValue(
            request.imwCallOriginalParams, URL.encode(ImJson.toJSONString(new Object())));
    oRequest.imwCallOriginalParams = imwCallOriginalParams;

    // imwSpDirectTransitionFlagについて
    // ユーザコンテンツ画面が設定されていない場合に"1"となる、スマートフォン用のパラメータ。
    oRequest.imwSpDirectTransitionFlag = Procedure.imw_utils.getValue(
            request.imwSpDirectTransitionFlag, codeUtil.getEnumCodeFlagStatus("Disable"));

    // スマートフォン版遷移時必須パラメータ
    oRequest.imwCallOriginalPagePath = Procedure.imw_utils.getValue(request.imwCallOriginalPagePath, "");

    // 処理パラメータの初期化
    if (oRequest.imwCallType == "1" || !isBlank(oRequest.imwWorkflowParams)) {
        // 【再表示】
        // oRequest.imwCallTypeのみで判定しない理由：
        //  ユーザコンテンツ内での画面遷移でimwWorkflowParamsを引き回したケースに対応するため
        do {
            // リクエストパラメータから確認用情報を取得
            var wfParams = ImJson.parseJSON(URL.decode(oRequest.imwWorkflowParams));
            if (!isObject(wfParams)) {
                // ワークフローパラメータパラメータがない：初回表示へ
                break;
            }
            wfParams = wfParams[oRequest.imwPageType];
            if (!isObject(wfParams) ||
                    wfParams.systemMatterId != oRequest.imwSystemMatterId ||
                    wfParams.nodeId != oRequest.imwNodeId) {
                // 次の条件を満たす場合、初回表示処理へ
                // ・確認パラメータがない
                // ・キーとなるシステム案件ID・ノードIDのいずれかが
                // リクエストパラメータと入力済み情報とで食い違っている
                break;
            }
            // 画面種別が確認画面のパラメータあり＝パラメータの引き継ぎ実施
            oProcParams = wfParams;
            oRequest.imwCallType = "1";
        } while (false);
    }
    if (isBlank(oProcParams)) {
        // 【初回表示】
        oRequest.imwCallType = "0";
        // 確認処理オブジェクトの初期化
        oProcParams = new Object();
        oProcParams.systemMatterId  = oRequest.imwSystemMatterId; // システム案件ID
        oProcParams.nodeId          = oRequest.imwNodeId;   // ノードID
        oProcParams.authUserCode    = oRequest.imwUserCode; // 権限者コード
        oProcParams.authOrgz        = "";                   // 権限者組織情報値
        oProcParams.authCompanyCode = "";                   // 権限者会社コード
        oProcParams.authOrgzSetCode = "";                   // 権限者組織セットコード
        oProcParams.authOrgzCode    = "";                   // 権限者組織コード
        oProcParams.confirmComment  = "";                   // 確認コメント
        // 案件状態は呼出元のproc_frameより取得
        oProcParams.matterStatus    = Procedure.imw_utils.getValue(request.imwMatterStatus, "");// 案件状態
    }

    // ユーザコンテンツから受け渡された初期表示情報の設定
    // コメント
    oProcParams.confirmComment = isUndefined(request.imwComment) ?
            oProcParams.confirmComment : request.imwComment;

    // 案件の状態を取得する
    if (isBlank(oProcParams.matterStatus)) {

        var matterStatusManager = new UserMatterStatus(localeId, "1" );
        result = matterStatusManager.getMatterStatus(oProcParams.systemMatterId);
        if(!result.resultFlag) {
            // 案件状態検索エラー
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
        }
        if(isBlank(result.data)) {
            // 案件が存在しない
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3581",
                    MessageManager.getMessage("IMW.CLI.WRN.3507"),
                    CALLBACK_FUNCTION);
        }
        oProcParams.matterStatus = result.data.matterStatusCode;
    }

    // 案件状態の判定→各種マネージャの決定
    var matterManager;
    var nodeManager;
    var confirmManager;
    if (oProcParams.matterStatus == oDefine.matSts_Active) {
        // 未完了案件
        matterManager  = new ActvMatter(localeId, oProcParams.systemMatterId);
        nodeManager    = new ActvMatterNode(localeId, oProcParams.systemMatterId);
        confirmManager = new CnfmActvMatterManager(localeId,
                oProcParams.systemMatterId, oProcParams.nodeId);
    } else {
        // 完了案件
        matterManager  = new CplMatter(localeId, oProcParams.systemMatterId);
        nodeManager    = new CplMatterNode(localeId, oProcParams.systemMatterId);
        confirmManager = new CnfmCplMatterManager(localeId,
                oProcParams.systemMatterId, oProcParams.nodeId );
    }

    // 特定のユーザが特定のノードに対する確認を行うことができるかを判定します。
    result = confirmManager.isPossibleToConfirm(oRequest.imwUserCode);
    if (!result.resultFlag) {
        // 判定エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
    }
    if (!result.data) {
        // 処理不可
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581",
                MessageManager.getMessage("IMW.CLI.WRN.3507"),
                CALLBACK_FUNCTION);
    }

    // 案件情報の取得
    result = matterManager.getMatter();
    if (!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
    }
    // 取得した案件情報を画面表示オブジェクトにセット
    oDisplayInfo.matterNumber      = Procedure.imw_utils.getValue(result.data.matterNumber, "");
    oDisplayInfo.matterName        = result.data.matterName;
    oDisplayInfo.applyAuthUserName = result.data.applyAuthUserName;
    oDisplayInfo.applyBaseDate     = Procedure.imw_datetime_utils.getDateTimeToString(
    		Procedure.imw_datetime_utils.formatBaseDate(result.data.applyBaseDate));
    oDisplayInfo.applyDate         = Procedure.imw_datetime_utils.getDateTimeToStringByUserTimeZone(result.data.applyDate);

    // 案件の確認履歴の取得
    result = matterManager.getCnfmHistoryList();
    if(!result.resultFlag) {
        // 確認履歴情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
    }
    if(result.data.length == 0) {
        // 確認履歴なし：画面表示しない
        oDisplayInfo.dispConfirmHistoryFlag = false;

    } else {
        // 確認履歴あり：画面表示する
        oDisplayInfo.dispConfirmHistoryFlag = true;

        oDisplayInfo.dispConfirmHistoryInfos = new Array();
        var confirmHistoryInfo;
        for(cnt=0; cnt<result.data.length; cnt++) {
            // 確認履歴数分繰り返し

            confirmHistoryInfo = {
                "confirmDate"    : Procedure.imw_datetime_utils.getProcessEndDate(
                		              Procedure.imw_datetime_utils.formatBaseDateTime(result.data[cnt].confirmDate)),
                "userName"       : result.data[cnt].userName,
                "orgzName"       : result.data[cnt].orgzName,
                "confirmComment" : result.data[cnt].confirmComment
            };

            oDisplayInfo.dispConfirmHistoryInfos.push(confirmHistoryInfo);
        }
    }

    // 処理種別名の取得
    result = nodeManager.getExecNodeConfig(oProcParams.nodeId);
    if(!result.resultFlag) {
        // ノード情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
    }
    oNotEscapeDispInfo.confirmName = result.data.executableProcessType[0].nodeProcessName;

    // 担当組織の取得
    result = confirmManager.getAuthUserOrgz(oProcParams.authUserCode);
    if(!result.resultFlag) {
        // 組織検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
    }
    oNotEscapeDispInfo.dispAuthOrgzInfos = new Array();
    oNotEscapeDispInfo.dispAuthOrgzInfos[0] = {value:'', label:''};

    if(result.data.length > 0) {
    	var authOrgzInfo = new Object();
    	for (cnt = 0; cnt < result.data.length; cnt++) {
    		authOrgzInfo[result.data[cnt].companyCode + separator + result.data[cnt].orgzSetCode + separator + result.data[cnt].orgzCode] = result.data[cnt].orgzName;
    	}
    	
    	for (var key in authOrgzInfo) {
    	
    		oNotEscapeDispInfo.dispAuthOrgzInfos[oNotEscapeDispInfo.dispAuthOrgzInfos.length] = {
    			value : key,
    			label : authOrgzInfo[key]
    		};
    	}
    	if (result.data.length == 1 && oRequest.imwCallType != "1") {
    		// 担当組織の選択肢が一つ、かつ初期表示の場合はデフォルトで選択状態とする
    		oNotEscapeDispInfo.dispAuthOrgzInfos[1].selected = true;
    		oProcParams.authOrgz = result.data[0].companyCode + separator + result.data[0].orgzSetCode + separator + result.data[0].orgzCode;
    	} else if (oRequest.imwCallType == "1") {
    		// 初期表示出ない場合
    		for(cnt==0; cnt<oNotEscapeDispInfo.dispAuthOrgzInfos.length; cnt++) {
    			if (oNotEscapeDispInfo.dispAuthOrgzInfos[cnt].value == oProcParams.authOrgz) {
    				oNotEscapeDispInfo.dispAuthOrgzInfos[cnt].selected = true;
    				break;
    			}
    		}
    	}
    } else {
    	oNotEscapeDispInfo.dispAuthOrgzInfos[oNotEscapeDispInfo.dispAuthOrgzInfos.length] = {
			value : separator + separator,
			label : oCaption.noAttach
		};
    	// 所属が一つもない場合：選択可能な所属組織なし
    	if (oRequest.imwCallType !== "1") {
    		oNotEscapeDispInfo.dispAuthOrgzInfos[1].selected = true;
    		oProcParams.authOrgz = separator + separator;
        } else {
    		for(cnt==0; cnt<oNotEscapeDispInfo.dispAuthOrgzInfos.length; cnt++) {
    			if (oNotEscapeDispInfo.dispAuthOrgzInfos[cnt].value == oProcParams.authOrgz) {
    				oNotEscapeDispInfo.dispAuthOrgzInfos[cnt].selected = true;
    				break;
    			}
    		}
        }
    }
    // 担当組織コンボ初期値設定
    setDefaultDepartmentInCharge(oNotEscapeDispInfo, oRequest.imwUserCode, oRequest.imwCallType);

    // 同期的な処理／非同期的な処理
    var paramManager = new WorkflowParameterManager(groupId);
    oDisplayInfo.standardExecJsspAsyncFlag = Procedure.imw_utils.getValue(paramManager.getBooleanParameter("standard-exec-jssp-async"), false);
    if (oDisplayInfo.standardExecJsspAsyncFlag) {
        result = matterManager.getExecFlow();
        if (!result.resultFlag) {
            // 案件情報検索エラー
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3581", "", CALLBACK_FUNCTION);
        }
        if (isNull(result.data)) {
            // 案件情報が存在しない
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3580",
                    MessageManager.getMessage("IMW.CLI.WRN.3513", oRequest.imwSystemMatterId),
                    CALLBACK_FUNCTION);
        }
        if (codeUtil.getEnumCodeFlagStatus("Enable") != result.data.asyncProcessFlag) {
            oDisplayInfo.standardExecJsspAsyncFlag = false;
        }
    }

    // リクエストパラメータをJSON文字列に変換
    oRequestJSON     = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oRequest));
    // 処理パラメータをJSON文字列に変換
    oProcParamsJSON  = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oProcParams));

    // ワークフローパラメータをJSON文字列に変換
    oWorkflowParamsJSON = Procedure.imw_utils.escapeHTML(URL.decode(oRequest.imwWorkflowParams));

    // HTML特殊文字を変換する
    oRequest     = Procedure.imw_utils.toBrowse(oRequest);
    oProcParams  = Procedure.imw_utils.toBrowse(oProcParams);
    oDisplayInfo = Procedure.imw_utils.toBrowse(oDisplayInfo, true);
    
    // 画面表示メッセージ取得
    var oMessage = getMessage(oNotEscapeDispInfo.confirmName);
    dialog = {
    	confirmDialogMsg : oMessage.processConfirm
    };
}

//=============================================================================
// 定義情報　取得関数
//   【 入力 】codeUtil: ワークフローコードUtil
//   【 返却 】定義オブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示キャプション取得処理を実行します。
//=============================================================================
function getDefineValues(codeUtil) {
    var objDef = new Object();

    objDef.matSts_Active    = codeUtil.getEnumCodeMatterStatus("matSts_Active");    // 案件状態:未完了
    objDef.matSts_Complete  = codeUtil.getEnumCodeMatterStatus("matSts_Complete");  // 案件状態:完了

    objDef.pageTyp_Cnfmdetail= codeUtil.getEnumCodePageType("pageTyp_Cnfmdetail");  // 画面種別：確認詳細

    return objDef;
}

//=============================================================================
// 画面表示キャプション　取得関数
//   【 入力 】なし
//   【 返却 】キャプションオブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示キャプション取得処理を実行します。
//=============================================================================
function getCaption() {
    var objCap = new Object();

    objCap.title             = MessageManager.getMessage("IMW.CAP.0308"); // 確認
    objCap.detail            = MessageManager.getMessage("IMW.CAP.0221"); // 詳細
    objCap.flow              = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    objCap.history           = MessageManager.getMessage("IMW.CAP.1032"); // 履歴
    objCap.require           = MessageManager.getMessage("IMW.CAP.0017"); // 必須
    objCap.matterNumber      = MessageManager.getMessage("IMW.CAP.1029"); // 案件番号
    objCap.matterName        = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    objCap.applyUser         = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    objCap.applyBaseDate     = MessageManager.getMessage("IMW.CAP.0391"); // 申請基準日
    objCap.applyDate         = MessageManager.getMessage("IMW.CAP.1035"); // 申請日
    objCap.confirmHistory    = MessageManager.getMessage("IMW.CAP.1070"); // 確認履歴
    objCap.confirmDate       = MessageManager.getMessage("IMW.CAP.1054"); // 処理日時
    objCap.confirmUser       = MessageManager.getMessage("IMW.CAP.1071"); // 確認者
    objCap.authOrgz          = MessageManager.getMessage("IMW.CAP.1000"); // 担当組織
    objCap.confirmComment    = MessageManager.getMessage("IMW.CAP.1069"); // 確認コメント
    objCap.close             = MessageManager.getMessage("IMW.CAP.0039"); // 閉じる
    objCap.noAttach          = MessageManager.getMessage("IMW.CAP.1155"); // 所属なし
    objCap.confirmProcTitle  = MessageManager.getMessage("IMW.CAP.1195");

    return objCap;
}

//=============================================================================
// 画面表示メッセージ　取得関数
//   【 入力 】processTypeList : 処理種別情報配列
//   【 返却 】キャプションオブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示メッセージ取得処理を実行します。
//=============================================================================
function getMessage(processTypeName) {
    var objMsg = new Object();

    objMsg.close          = MessageManager.getMessage("IMW.CLI.WRN.3501");
    objMsg.processConfirm = MessageManager.getMessage("IMW.CLI.INF.3000", processTypeName);

    return objMsg;
}

//=============================================================================
// 入力チェック用オブジェクト　生成関数
//   【 入力 】sessionInfo : セッション情報オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】指定可能なプロパティについては下記ソースのコメントを参照
//             workflow/common/init.js#makeValidateMessage
//=============================================================================
function getValidation(sessionInfo) {

    // ロケールオブジェクトの生成(共通関数への引き渡し情報として利用)
    var localeId = sessionInfo.locale;
    var localeObj = {
        "localeId" : localeId,
        "locales"  : SystemLocale.getLocaleInfos().data
    };

    var loginGroupId = sessionInfo.loginGroupId;
    var objValidateParameter;
    var objValidation = new Object();

    // 各入力項目のチェック用情報を設定

    // 担当組織
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4SelectRequireOrgz("authOrgz", "IMW.CAP.1000");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // コメント
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4Comment("confirmComment", "IMW.CAP.0318");
    Procedure.imw_validate_utils.setParameterFromSettings(loginGroupId, objValidateParameter, "confirm-comment");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // 入力チェックcsjsの引数として有効な形式に変換
    var objValidateMsg = new Object();
    for(var cnt=0; cnt<objValidation.messageList.length; cnt++) {
        objValidateMsg[ Procedure.imw_utils.toBrowse(objValidation.messageList[cnt].key) ] = 
            Procedure.imw_utils.toBrowse(objValidation.messageList[cnt].msg);
    }

    // JSON文字列に変換
    return ImJson.toJSONString(objValidateMsg);

}

//=============================================================================
// 右上組織に対する担当組織の初期値設定処理
//   【 入力 】orgzInfo: 画面表示用の担当組織オブジェクト
//             authUserCode: 処理権限者
//             callType: 呼び出しフラグ(0:初期表示)
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】右上組織で選択された組織を担当組織の初期値として設定します。
//=============================================================================
function setDefaultDepartmentInCharge(orgzInfo, authUserCode, callType) {

    // 初期表示以外の場合は何もしない
    if (callType != "0") {
        return;
    }

    var orgzLength = orgzInfo.dispAuthOrgzInfos.length;

    // ブランクと組織１つ（所属なし）の場合は何もしない
    if (orgzLength == 2) {
        return;
    }

    var currentDepartmentKeys = null;
    var _d = Contexts.getUserContext().currentDepartment;
    if (_d != null) {
        currentDepartmentKeys = _d.companyCd + separator + _d.departmentSetCd + separator + _d.departmentCd;
    }

    var i;
    var currentDepartmentContain = false;
    for (i = 0; i < orgzLength; i++) {
        if (currentDepartmentKeys == orgzInfo.dispAuthOrgzInfos[i].value) {
            currentDepartmentContain = true;
        }
    }
    if (false == currentDepartmentContain) {
        return;
    }

    for (i = 0; i < orgzLength; i++) {
        if (currentDepartmentKeys == orgzInfo.dispAuthOrgzInfos[i].value) {
            orgzInfo.dispAuthOrgzInfos[i].selected = true;
            oProcParams.authOrgz = currentDepartmentKeys;
        }
        if ("" == orgzInfo.dispAuthOrgzInfos[i].value) {
            orgzInfo.dispAuthOrgzInfos[i].selected = false;
        }
    }
}
