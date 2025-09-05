//=============================================================================
// 申請　処理関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】ワークフローの申請処理を実行します。
//=============================================================================
function apply(request){

    // 処理結果オブジェクトの生成
    var resultInfo = {
        "resultFlag"    : false,
        "errorMessage" : ""
    };
    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    // ログイングループID
    var groupId = sessionInfo.loginGroupId;
    // ロケールID
    var localeId = sessionInfo.locale;
    // コードUtil
    var codeUtil = new WorkflowCodeUtil();
    var targetProcType = codeUtil.getEnumCodeProcessType("procTyp_apy");

    // 初期化
    var sysDate = Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone(); // システム日付
    var result;

    // 申請用パラメータ
    var applyParams = request.applyParams;
    // 実行者コードをセッションからセット
    applyParams.applyExecuteUserCode = sessionInfo.userCd;

    // ユーザパラメータ
    var userParam = request.userParams;

    // 申請マネージャ
    var applyManager = new ApplyManager(localeId);

    // 代理権限チェック
    // 代理の場合 (ログインユーザと申請者が異なる場合)
    if (applyParams.applyExecuteUserCode != applyParams.applyAuthUserCode) {
        // 代理権限 (申請) のチェック
        result = Procedure.imw_proc_utils.checkActUser(
                groupId, localeId, sysDate, OriginalActList.APPLY_AUTH,
                applyParams.applyExecuteUserCode, applyParams.applyAuthUserCode,
                applyParams.flowId);

        // 代理権限の取得に失敗した場合
        if (!result.resultFlag) {
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3545", result);
            return resultInfo;
        }

        // 代理権限がない場合
        if (!result.actFlag) {
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3531", result);
            return resultInfo;
        }
    }

    // 横・縦配置ノード設定情報を整形
    applyParams.HVNodeConfigModels =
            Procedure.imw_proc_utils.remakeHVNodeConfigModels4Proc(applyParams.HVNodeConfigModels);

    // 動的処理ノード設定対応
    if (!isBlank(applyParams.DCNodeConfigModels)) {
        var cnt;
        for (cnt=0; cnt<applyParams.DCNodeConfigModels.length; cnt++) {
            if (applyParams.DCNodeConfigModels[cnt].dynamicNodeFlag &&
                applyParams.DCNodeConfigModels[cnt].processTargetConfigs.length == 0 &&
                applyParams.DCNodeConfigModels[cnt].setFlag) {
                // 動的ノードを0人で設定＝ノード削除
                applyParams.DCNodeConfigModels[cnt].processTargetConfigs = null;
            }
        }
    }

    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック開始
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // フロー有効チェック
    // 申請ノードでの設定情報を取得
    result = applyManager.getConfigSetToApplyWithProcessTarget(
            applyParams.flowId, applyParams.applyBaseDate);
    if (!result.resultFlag) {
        // 検索エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3545", result);
        return resultInfo;
    }
    if (isNull(result.data)) {
        // フロー情報の取得に失敗
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3521", result);
        return resultInfo;
    }
    var configSet = result.data;

    // チェック実施
    result = Procedure.imw_proc_utils.checkParamByConfigSet(applyParams, configSet, targetProcType);
    if (!result.resultFlag) {
        // 権限エラー
        resultInfo.errorMessage = result.errorMessage;
        return resultInfo;
    }
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック終了
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊

    // 案件情報の作成 (案件未作成のため手動で取得)
    var matterInfo = new Object();
    matterInfo.systemMatterId = ""; // システム案件IDは未採番
    matterInfo.userDataId = applyParams.userDataId;
    matterInfo.contentsId = applyParams.validFlowInfo.contentsId;
    matterInfo.contentsVersionId = applyParams.validFlowInfo.contentsVersionId;
    matterInfo.routeId = applyParams.validFlowInfo.routeId;
    matterInfo.routeVersionId = applyParams.validFlowInfo.routeVersionId;
    matterInfo.flowId = applyParams.flowId;
    matterInfo.flowVersionId = applyParams.validFlowInfo.flowVersionId;
    matterInfo.nodeId = applyParams.applyNodeId;

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
            groupId, localeId, plugins, applyParams.applyBaseDate,
            applyParams.applyAuthUserCode, matterInfo);
    if (!result.resultFlag) {
        // 申請者名の取得エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3545", result);
        return resultInfo;
    } else if (isNull(result.data)) {
        // 申請権限者が対象者に存在しない
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3634", result);
        return resultInfo;
    }

    // 根回しメール設定
    result = Procedure.imw_proc_utils.getNegoMailInfo4Param(
            groupId, localeId, sysDate, applyParams.negoMail, matterInfo);
    if (!result.resultFlag) {
        resultInfo.errorMessage = result.errorMessage;
        return resultInfo;
    }
    applyParams.negoModel = result.data;
    applyParams.matterNumber = null;

    // 申請（トランザクション制御はAPI内部で実施される。また、一時保存情報も削除される。）
    result = applyManager.apply(applyParams, userParam);
    if (!result.resultFlag) {
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                "IMW.CLI.WRN.3545", result);
        return resultInfo;
    }

    // 正常終了
    resultInfo.resultFlag = true;
    resultInfo.data       = result.data;
    return resultInfo;
}
