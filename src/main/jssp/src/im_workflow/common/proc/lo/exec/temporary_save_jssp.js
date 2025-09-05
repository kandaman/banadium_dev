//=============================================================================
// 一時保存　処理関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】ワークフローの一時保存処理を実行します。
//=============================================================================
function temporarySave(request){

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
    if (tempSaveParams.applyExecuteUserCode != tempSaveParams.applyAuthUserCode) {
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
    }

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
    }

    // 正常終了
    resultInfo.resultFlag = true;
    return resultInfo;
}
