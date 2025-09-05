//=============================================================================
// 確認関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】ワークフロー処理を実行します。
//=============================================================================
function confirm(request){

    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var groupId = sessionInfo.loginGroupId;
    var userCode = sessionInfo.userCd;
    var localeId = sessionInfo.locale;

    // 処理結果オブジェクトの生成
    var resultInfo = {
        "resultFlag"    : false,
        "errorMessage" : ""
    };

    // システム案件ID
    var imwSystemMatterId = request.imwSystemMatterId;
    // ノードID
    var imwNodeId = request.imwNodeId;

    // ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();

    // 各種定義情報取得
    var oDefine = getDefineValues(codeUtil);

    var result;

    // 確認用パラメータ
    var confirmParams = request.confirmParams;
    // セッションから権限者コードをセット
    confirmParams.authUserCode = userCode;

    // 案件状態による確認マネージャの決定
    var confirmManager;
    if(confirmParams.matterStatus == oDefine.matSts_Active) {
        // 未完了案件
        confirmManager = new CnfmActvMatterManager(
                localeId, imwSystemMatterId, imwNodeId); 

    } else {
        // 完了案件
        confirmManager = new CnfmCplMatterManager(
                localeId, imwSystemMatterId, imwNodeId); 
    }

    // 確認可否チェック
    result = confirmManager.isPossibleToConfirm(confirmParams.authUserCode);
    if(!result.resultFlag) {
        // 判定エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3612", result);
        return resultInfo;
    }
    if(!result.data) {
        // 処理不可
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3507", result);
        return resultInfo;
    }

    // 確認処理の実行
    result = confirmManager.confirm(confirmParams);
    if(!result.resultFlag) {
        // 処理でエラー発生
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                "IMW.CLI.WRN.3612", result);
        return resultInfo;
    }

    // 正常終了
    resultInfo.resultFlag = true;
    return resultInfo;
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

    objDef.matSts_Active    = codeUtil.getEnumCodeMatterStatus("matSts_Active");    // 案件状態:未完了
    objDef.matSts_Complete  = codeUtil.getEnumCodeMatterStatus("matSts_Complete");  // 案件状態:完了

    return objDef;
}


