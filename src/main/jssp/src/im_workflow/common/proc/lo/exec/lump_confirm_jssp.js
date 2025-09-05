//=============================================================================
// 一括確認　処理関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】一括確認処理を実行します。
//=============================================================================
function lumpConfirm(request) {

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

    // 一括確認パラメータチェック
    var wfpManager = new WorkflowParameterManager();
    var lumpFlag = wfpManager.getBooleanParameter("lump-confirm");
    if (!lumpFlag) {
        // 一括処理禁止
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3623", new Object());
        return resultInfo;
    }

    // 案件状態
    var matterStatus = request.imwMatterStatus;


    // ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();

    // 各種定義情報取得
    var oDefine = getDefineValues(codeUtil);

    // 汎用ローカル変数
    var result;
    var cnt;

    // 処理用パラメータの生成
    var oProcParam = new Object();
    oProcParam.authCompanyCode  = Procedure.imw_utils.getValue(request.imwAuthCompanyCode, ""); // 権限者会社コード
    oProcParam.authOrgzCode     = Procedure.imw_utils.getValue(request.imwAuthOrgzCode, ""); // 権限者組織コード
    oProcParam.authOrgzSetCode  = Procedure.imw_utils.getValue(request.imwAuthOrgzSetCode, ""); // 権限者組織セットコード
    oProcParam.authUserCode     = userCode; // 権限者コード
    oProcParam.confirmComment   = Procedure.imw_utils.getValue(request.confirmComment, ""); // 確認コメント

    // 処理対象の案件情報
    var imwLumpProcParams = request.lumpProcParams;

    // 一括確認開始
    var confirmManager;
    for(cnt=0; cnt<imwLumpProcParams.length; cnt++) {

        // マネージャの決定
        if(matterStatus == oDefine.matSts_Active) {
            // 未完了案件
            confirmManager = new CnfmActvMatterManager(
                    localeId,
                    imwLumpProcParams[cnt].systemMatterId,
                    imwLumpProcParams[cnt].nodeId);

        } else if(matterStatus == oDefine.matSts_Complete) {
            // 完了案件
            confirmManager = new CnfmCplMatterManager(
                    localeId,
                    imwLumpProcParams[cnt].systemMatterId,
                    imwLumpProcParams[cnt].nodeId);
        } else {
            // どちらでもない：処理なし
            continue;
        }

        // 実行可能チェック
        result = confirmManager.isPossibleToConfirm(oProcParam.authUserCode);
        if(!result.resultFlag) {
            // 判定エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3623", result);
            resultInfo.errorLumpConfirmParam = imwLumpProcParams[cnt];
            return resultInfo;
        }
        if(!result.data) {
            // 処理不可：処理なし
            continue;
        }
        
        // 組織処理権限チェック
        result = confirmManager.getAuthUserOrgz(oProcParam.authUserCode);
        
        if (!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3623", result);
            resultInfo.errorLumpConfirmParam = imwLumpProcParams[cnt];
            return resultInfo;
        }

        if (result.data.length) {
            var hasAuthority = false;
            for (var i = 0; i < result.data.length; i++) {
                if (result.data[i].companyCode == oProcParam.authCompanyCode
                    && result.data[i].orgzSetCode == oProcParam.authOrgzSetCode
                    && result.data[i].orgzCode == oProcParam.authOrgzCode) {
                    hasAuthority = true;
                    break;
                }
            };
            if (!hasAuthority) {
                // 処理エラー
                resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                        "IMW.CLI.WRN.3672", result);
                resultInfo.errorLumpConfirmParam = imwLumpProcParams[cnt];
                return resultInfo;
            }
        } else {
            if (!isBlank(oProcParam.authCompanyCode) 
                && !isBlank(oProcParam.authOrgzSetCode)
                && !isBlank(oProcParam.authOrgzCode)) {
                // 処理エラー
                resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                        "IMW.CLI.WRN.3672", result);
                resultInfo.errorLumpConfirmParam = imwLumpProcParams[cnt];
                return resultInfo;
            }
        }

        // 確認実行
        result = confirmManager.confirm(oProcParam);
        if(!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                    "IMW.CLI.WRN.3623", result);
            resultInfo.errorLumpConfirmParam = imwLumpProcParams[cnt];
            return resultInfo;
        }

        // マネージャ解放
        confirmManager = null;
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
