var oRequest           = new Object();    // リクエスト情報オブジェクト
var oRequestJSON       = "";              // リクエスト情報オブジェクト(JSON文字列)
var oDisplayInfo       = new Object();    // 画面表示情報オブジェクト
var oDisplayInfoJSON   = "";              // 画面表示情報オブジェクト
var oNotEscapeDispInfo = new Object();     // HTMLエスケープをしない画面表示情報オブジェクト
var oTempSaveParams    = null;            // 一時保存情報オブジェクト
var oTempSaveParamsJSON= new Object();    // 一時保存情報オブジェクト(JSON文字列)
var oCaption           = new Object();    // 画面表示文言オブジェクト
var oMessage           = new Object();    // 画面表示メッセージオブジェクト
var oValidationJSON    = new Object();    // 入力チェック用オブジェクト(JSON文字列)
var oWorkflowParamsJSON= "";              // ワークフローパラメータ(JSON文字列)
var oDialog            = {};

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

var oUserParams       = new Object();    // ユーザ入力確認情報オブジェクト add suzuki

//=============================================================================
// 一時保存画面　初期化関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】一時保存画面を表示します。
//=============================================================================
function init(request){

    // クライアントタイプの一時切り替えを実行（スマートフォン端末でPC画面に/PCでスマートフォン画面にアクセスした場合の対処）
    ClientTypeSwitcher.oneTimeSwitchTo(IMW_CLIENT_TYPE);

    var CALLBACK_FUNCTION = "parent.GB_closeWithImwCallBack";

    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var groupId = sessionInfo.loginGroupId;
    var userCode = sessionInfo.userCd;
    var localeId = sessionInfo.locale;

    // ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();

    // 各種定義情報取得
    var oDefine = getDefineValues(codeUtil);

    // 入力チェック用オブジェクトの生成
    oValidationJSON = Procedure.imw_utils.escapeHTML(getValidation(sessionInfo));

    // 汎用ローカル変数
    var result;

    // リクエストパラメータ取得
    oRequest.imwGroupId             = groupId;
    oRequest.imwUserCode            = userCode;
    oRequest.imwAuthUserCode        = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");
    oRequest.imwUserDataId          = Procedure.imw_utils.getValue(request.imwUserDataId, "");
    oRequest.imwNodeId              = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwApplyBaseDate       = Procedure.imw_utils.getValue(request.imwApplyBaseDate, "");
    oRequest.imwFlowId              = Procedure.imw_utils.getValue(request.imwFlowId, "");
    oRequest.imwPageType            = Procedure.imw_utils.getValue(request.imwPageType, "");
    oRequest.imwCallType            = Procedure.imw_utils.getValue(request.imwCallType, "0");
    oRequest.imwWorkflowParams      = Procedure.imw_utils.getValue(request.imwWorkflowParams, "");

	// add suzuki ユーザー入力パラメータ取得
	oUserParams       = request.imwUserParamsJSON;
    

    if (oRequest.imwCallType == "1" || !isBlank(oRequest.imwWorkflowParams)) {
        // 【再表示】
        // oRequest.imwCallTypeのみで判定しない理由：
        //  ユーザコンテンツ内での画面遷移でimwWorkflowParamsを引き回したケースに対応するため
        do {
            // リクエストパラメータから一時保存用情報を取得
            var wfParams = ImJson.parseJSON(URL.decode(oRequest.imwWorkflowParams));
            if (!isObject(wfParams)) {
                // ワークフローパラメータパラメータがない：初回表示へ
                break;
            }
            wfParams = wfParams[oRequest.imwPageType];
            if (!isObject(wfParams) ||
                    wfParams.flowId != oRequest.imwFlowId ||
                    wfParams.applyNodeId != oRequest.imwNodeId ||
                    wfParams.applyBaseDate != oRequest.imwApplyBaseDate ||
                    wfParams.userDataId != oRequest.imwUserDataId) {
                // 次の条件を満たす場合、初回表示処理へ
                // ・一時保存パラメータがない
                // ・キーとなるフローID・ノードID・申請基準日・ユーザデータIDのいずれかが
                // リクエストパラメータと入力済み情報とで食い違っている
                break;
            }
            // 画面種別が一時保存画面のパラメータあり＝パラメータの引き継ぎ実施
            oTempSaveParams = wfParams;
            oRequest.imwCallType = "1";
            // ただし、権限者はリクエストパラメータから引き継ぎ(存在する場合)
            if (!isBlank(oRequest.imwAuthUserCode)) {
                oTempSaveParams.applyAuthUserCode = oRequest.imwAuthUserCode; // 申請権限者コード
            }

            // ユーザコンテンツから受け渡された初期表示情報の設定
            var tempSavedFlag = false;  // 一時保存済フラグ
            if (!isBlank(oTempSaveParams.userDataId)) {
                // 一時保存情報の読み込み
                
                var tempSave = new TempSaveMatter(groupId, localeId);
                result = tempSave.getTempSaveMatter(oTempSaveParams.userDataId);
                if (!result.resultFlag) {
                    // 一時保存情報検索エラー
                    Procedure.imw_error_utils.showErrorGreyboxClose(
                                        "IMW.CLI.WRN.3585", "", CALLBACK_FUNCTION);
                }
                tempSavedFlag = !isBlank(result.data);
            }
            if (!tempSavedFlag || request.imwForcedParamFlag == oDefine.Enable) {
                // 新規一時保存、または更新一時保存だが強制パラメータフラグがONの場合
                // 案件名
                oTempSaveParams.matterName = isUndefined(request.imwMatterName) ?
                        oTempSaveParams.matterName : request.imwMatterName;
                // コメント
                oTempSaveParams.processComment = isUndefined(request.imwComment) ?
                        oTempSaveParams.processComment : request.imwComment;
            }

        } while (false);
    }

    if(isBlank(oTempSaveParams)) {
        // 【初回表示】
        oTempSaveParams = new Object();
        oRequest.imwCallType = "0";

        // 画面種別を一時保存用情報に設定
        oTempSaveParams.pageType = oDefine.pageTyp_TempSave;

        // 一時保存情報オブジェクトの初期化
        oTempSaveParams.matterName           = "";    // 案件名
        oTempSaveParams.processComment       = "";    // 処理コメント

        oTempSaveParams.applyBaseDate        = oRequest.imwApplyBaseDate;   // 申請基準日
        oTempSaveParams.applyExecuteUserCode = oRequest.imwUserCode;        // 申請実行者コード
        oTempSaveParams.applyAuthUserCode    = oRequest.imwAuthUserCode;    // 申請権限者コード
        oTempSaveParams.flowId               = oRequest.imwFlowId;          // フローID
        oTempSaveParams.userDataId           = oRequest.imwUserDataId;      // ユーザデータID
        oTempSaveParams.applyNodeId          = oRequest.imwNodeId;          // ノードID

        // 申請権限者コードのチェック
        if(isBlank(oRequest.imwAuthUserCode)) {
            // 実行者＝権限者
            oTempSaveParams.applyAuthUserCode = oRequest.imwUserCode;
        }

        var tempSavedFlag = false;  // 一時保存済フラグ
        if(!isBlank(oTempSaveParams.userDataId)) {
            // 一時保存情報の読み込み

            var tempSave = new TempSaveMatter(localeId);
            result = tempSave.getTempSaveMatter(oTempSaveParams.userDataId);
            if(!result.resultFlag) {
                // 一時保存情報検索エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                                    "IMW.CLI.WRN.3585", "", CALLBACK_FUNCTION);
            }
            if(!isBlank(result.data)) {
                // 該当の一時保存情報が存在する
                // 取得した情報をセット
                tempSavedFlag = true;
                oTempSaveParams.matterName     = result.data.matterName;
                oTempSaveParams.processComment = result.data.processComment;
            }
        }
        // ユーザコンテンツから受け渡された初期表示情報の設定
        if (!tempSavedFlag || request.imwForcedParamFlag == oDefine.Enable) {
            // 新規一時保存、または更新一時保存だが強制パラメータフラグがONの場合
            // 案件名
            oTempSaveParams.matterName = isUndefined(request.imwMatterName) ?
                    oTempSaveParams.matterName : request.imwMatterName;
            // コメント
            oTempSaveParams.processComment = isUndefined(request.imwComment) ?
                    oTempSaveParams.processComment : request.imwComment;
        }
    }

    // 一時保存対象のフロー情報を取得する（存在チェック）

    // 一時保存対象の有効なフロー情報を取得する
    var flowDataManager = new FlowDataManager();
    result = flowDataManager.getTargetFlowDataWithLocale(
            oTempSaveParams.flowId, oTempSaveParams.applyBaseDate, localeId);
    if(result.error) {
        // 検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3585", "", CALLBACK_FUNCTION);
    }
    if(isNull(result.data) || result.data.versionStatus != oDefine.versionStatusUserEnabled) {
        // 有効なバージョンが存在しない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3585",
                MessageManager.getMessage("IMW.CLI.WRN.3521"),
                CALLBACK_FUNCTION);
    }
    var targetFlowDetail = result.data.targetFlowDetails[0].flowDetail;
    var validFlowInfo = {
            "flowId" : targetFlowDetail.flowId,
            "flowVersionId" : targetFlowDetail.flowVersionId,
            "contentsId" : targetFlowDetail.contentsId,
            "contentsVersionId" : targetFlowDetail.contentsVersionId,
            "routeId" : targetFlowDetail.routeId,
            "routeVersionId" : targetFlowDetail.routeVersionId
    };
    
    oDisplayInfo.applyBaseDate = Procedure.imw_datetime_utils.getDateTimeToString(
    		Procedure.imw_datetime_utils.formatBaseDate(oTempSaveParams.applyBaseDate));

    // 処理名称[一時保存]をセット
    // ※「一時保存」は処理種別ではないため、マスタで変更不可.
    //   よって固定的に「一時保存」というキャプションを表示すればOK.
    oDisplayInfo.tempSaveName          = MessageManager.getMessage("IMW.CAP.0474");
    oDisplayInfo.tempSaveButtonCaption = MessageManager.getMessage("IMW.CAP.0474");

    // 同期的な処理／非同期的な処理
    var paramManager = new WorkflowParameterManager(groupId);
    oDisplayInfo.standardExecJsspAsyncFlag = Procedure.imw_utils.getValue(paramManager.getBooleanParameter("standard-exec-jssp-async"), false);
    if (oDisplayInfo.standardExecJsspAsyncFlag) {
        if (codeUtil.getEnumCodeFlagStatus("Enable") != result.data.targetFlowDetails[0].flowDetail.asyncProcessFlag) {
            oDisplayInfo.standardExecJsspAsyncFlag = false;
        }
    }

    // 申請者名の取得
    result = getDefaultProcessTarget(groupId, validFlowInfo, oTempSaveParams.applyNodeId);
    if(!result.resultFlag) {
        // デフォルト処理対象取得エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3585", "", CALLBACK_FUNCTION);
    }
    var plugins = result.data;  // プラグイン情報配列

    // 案件情報の作成 (案件未作成のため手動で取得)
    var matterInfo = new Object();
    matterInfo.systemMatterId = ""; // システム案件IDは未採番
    matterInfo.userDataId = oTempSaveParams.userDataId;
    matterInfo.contentsId = validFlowInfo.contentsId;
    matterInfo.contentsVersionId = validFlowInfo.contentsVersionId;
    matterInfo.routeId = validFlowInfo.routeId;
    matterInfo.routeVersionId = validFlowInfo.routeVersionId;
    matterInfo.flowId = oTempSaveParams.flowId;
    matterInfo.flowVersionId = validFlowInfo.flowVersionId;
    matterInfo.nodeId = oTempSaveParams.applyNodeId;

    result = Procedure.imw_proc_utils.getApplyAuthUserName(
            groupId, localeId, plugins,
            oTempSaveParams.applyBaseDate,
            oTempSaveParams.applyAuthUserCode, matterInfo);
    if(!result.resultFlag) {
        // 申請者名の取得エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3585", "", CALLBACK_FUNCTION);
    } else if (isNull(result.data)) {
        // 申請者が対象者に存在しない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3634", "", CALLBACK_FUNCTION);
    }
    oDisplayInfo.applyAuthUserName = result.data;

    // 画面表示情報オブジェクトの設定（コメントトグル）
    oDisplayInfo.commentOpenedFlag = !isBlank(oTempSaveParams.processComment);    // コメントトグルOPENフラグ

    // リクエストパラメータをJSON文字列に変換
    oRequestJSON        = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oRequest));
    // 申請パラメータをJSON文字列に変換
    oTempSaveParamsJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oTempSaveParams));
    // 画面表示情報オブジェクトをJSON文字列に変換
    oDisplayInfoJSON    = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDisplayInfo));
    // ワークフローパラメータをJSON文字列に変換
    oWorkflowParamsJSON = Procedure.imw_utils.escapeHTML(URL.decode(oRequest.imwWorkflowParams));

    oNotEscapeDispInfo = oDisplayInfo;
    oNotEscapeDispInfo.matterName = oTempSaveParams.matterName;

    // HTML特殊文字を変換する
    oRequest        = Procedure.imw_utils.toBrowse(oRequest);
    oTempSaveParams = Procedure.imw_utils.toBrowse(oTempSaveParams);
    oDisplayInfo    = Procedure.imw_utils.toBrowse(oDisplayInfo);

    // 画面表示キャプション取得
    oCaption = getCaption();

    // 画面表示メッセージ取得
    oMessage = getMessage(oDisplayInfo.tempSaveName);
    
    oDialog = {
            tempSaveDialogMsg : oMessage.tempSaveConfirm
        };
}


//=============================================================================
// 定義情報　取得関数
//   【 入力 】codeUtil: ワークフローコードUtil
//   【 返却 】定義オブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】定義情報取得処理を実行します。
//=============================================================================
function getDefineValues(codeUtil) {
    var objDef = new Object();

    objDef.pageTyp_App      = codeUtil.getEnumCodePageType("pageTyp_App");      // 画面種別：申請画面
    objDef.pageTyp_TempSave = codeUtil.getEnumCodePageType("pageTyp_TempSave"); // 画面種別：一時保存画面

    objDef.Enable  = codeUtil.getEnumCodeFlagStatus("Enable");                  // フラグ状態：有効
    objDef.Disable = codeUtil.getEnumCodeFlagStatus("Disable");                 // フラグ状態：無効

    objDef.versionStatusUserEnabled =
            codeUtil.getEnumCodeVersionStatus("versionStatus_UserEnabled");     // バージョンステータス：ユーザ有効

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

    objCap.title             = MessageManager.getMessage("IMW.CAP.0474"); // 一時保存
    objCap.require           = MessageManager.getMessage("IMW.CAP.0017"); // 必須
    objCap.matterName        = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    objCap.applyUser         = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    objCap.applyBaseDate     = MessageManager.getMessage("IMW.CAP.0391"); // 申請基準日
    objCap.comment           = MessageManager.getMessage("IMW.CAP.0318"); // コメント
    objCap.close             = MessageManager.getMessage("IMW.CAP.0039"); // 閉じる
    objCap.flow              = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    objCap.confirmProcTitle  = MessageManager.getMessage("IMW.CAP.1195");

    return objCap;
}



//=============================================================================
// 画面表示メッセージ　取得関数
//   【 入力 】tempSaveName : 一時保存処理の名称
//   【 返却 】キャプションオブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示メッセージ取得処理を実行します。
//=============================================================================
function getMessage(tempSaveName) {
    var objMsg = new Object();

    objMsg.tempSaveConfirm  = MessageManager.getMessage("IMW.CLI.INF.3000", tempSaveName);
    objMsg.close            = MessageManager.getMessage("IMW.CLI.WRN.3501");

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

    // 案件名
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4InputRequireMatterName("matterName", "IMW.CAP.0389");
    Procedure.imw_validate_utils.setParameterFromSettings(loginGroupId, objValidateParameter, "matter-name");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // コメント
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4Comment("processComment", "IMW.CAP.0318");
    Procedure.imw_validate_utils.setParameterFromSettings(loginGroupId, objValidateParameter, "proc-comment");
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
// デフォルト処理対象取得関数
//   【 入力 】loginGroupId : ログイングループID
//             validFlowInfo: 有効フロー情報
//             targetNodeId : 対象ノードID
//   【 返却 】プラグイン情報配列
//   【作成者】NTT DATA INTRAMART
//   【 概要 】
//=============================================================================
function getDefaultProcessTarget(loginGroupId, validFlowInfo, targetNodeId) {

    var cnt;
    var result;

    var objReturn = {
            "resultFlag" :   true,
            "data"      :   new Array()
    };

    // 設定対象のルートユーザ設定情報を取得
    var routeDataManager = new RouteDataManager(loginGroupId);
    result = routeDataManager.getRoutePluginDataWithNode(
            validFlowInfo.routeId, validFlowInfo.routeVersionId, targetNodeId);
    if(!result.resultFlag) {
        // ルートユーザ設定情報検索エラー
        return result;
    }

    for(cnt=0; cnt<result.data.length; cnt++) {
        objReturn.data.push(
            {   "extensionPointId"  : result.data[cnt].extensionPointId,
                "pluginId"          : result.data[cnt].pluginId,
                "parameter"         : result.data[cnt].parameter
            }
        );
    }

    return objReturn;
}
