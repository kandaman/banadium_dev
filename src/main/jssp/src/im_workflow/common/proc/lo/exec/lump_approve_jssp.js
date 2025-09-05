//=============================================================================
// 一括承認　処理関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】一括承認処理を実行します。
//=============================================================================
function lumpApprove(request) {

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

    // システム日付
    var sysDate = Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone();
    // コードUtil
    var codeUtil = new WorkflowCodeUtil();
    var targetProcType = codeUtil.getEnumCodeProcessType("procTyp_apr");

    // 一括処理パラメータチェック
    var wfpManager = new WorkflowParameterManager();
    var lumpFlag = wfpManager.getBooleanParameter("lump-processing");
    if (!lumpFlag) {
        // 一括処理禁止
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3624", new Object());
        return resultInfo;
    }

    // 汎用ローカル変数
    var result;
    var cnt;
    var leng;

    // 処理用パラメータの生成
    var oProcParam = new Object();
    oProcParam.executeUserCode  = userCode;    // 実行者コード
    oProcParam.authUserCode     = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");    // 権限者コード
    oProcParam.authCompanyCode  = Procedure.imw_utils.getValue(request.imwAuthCompanyCode, "");// 権限者会社コード
    oProcParam.authOrgzCode     = Procedure.imw_utils.getValue(request.imwAuthOrgzCode, "");   // 権限者組織コード
    oProcParam.authOrgzSetCode  = Procedure.imw_utils.getValue(request.imwAuthOrgzSetCode, "");// 権限者組織セットコード
    oProcParam.processComment   = Procedure.imw_utils.getValue(request.processComment, ""); // 処理コメント

    // ユーザパラメータ(空オブジェクト)の生成
    var oUserParam = new Object();

    // 処理対象の案件情報
    var imwLumpProcParams = request.lumpProcParams;

    // 一括確認開始
    var personalActCond = wfpManager.getBooleanParameter("personal-act");
    var applicationalActCond = wfpManager.getBooleanParameter("applicational-act");
    var authoritativeActCond = wfpManager.getBooleanParameter("authoritative-act");
    var actvMatter;
    var processManager;
    for (cnt=0; cnt<imwLumpProcParams.length; cnt++) {

        // 未完了案件マネージャの生成
        actvMatter = new ActvMatter(
                localeId, imwLumpProcParams[cnt].systemMatterId );
        // 案件情報の取得
        result = actvMatter.getMatter();
        if (!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3624", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }
        if (isBlank(result.data)) {
            // 案件が存在しない：処理なし
            continue;
        }
        var actvMatterData = result.data;
        var flowId = actvMatterData.flowId;

        // 処理用パラメータに案件情報セット
        oProcParam.matterNumber = actvMatterData.matterNumber;  // 案件番号
        oProcParam.matterName   = actvMatterData.matterName;    // 案件名
        oProcParam.priorityLevel= actvMatterData.priorityLevel; // 優先度

        // 処理マネージャの生成
        processManager = new ProcessManager(
                localeId, imwLumpProcParams[cnt].systemMatterId,
                imwLumpProcParams[cnt].nodeId);
        // 実行可能チェック
        result = processManager.isPossibleToProcess(oProcParam.executeUserCode);
        if (!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3624", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }
        if (!result.data) {
            // 処理不可：処理なし
            continue;
        }

        // 組織処理権限チェック
        result = processManager.getAuthUserOrgz(oProcParam.authUserCode);
        
        if (!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3624", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
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
                        "IMW.CLI.WRN.3671", result);
                resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
                return resultInfo;
            }
        } else {
            if (!isBlank(oProcParam.authCompanyCode) 
                && !isBlank(oProcParam.authOrgzSetCode)
                && !isBlank(oProcParam.authOrgzCode)) {
                // 処理エラー
                resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                        "IMW.CLI.WRN.3671", result);
                resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
                return resultInfo;
            }
        }

        // 代理の場合 (ログインユーザと承認者が異なる場合)
        if (oProcParam.executeUserCode != oProcParam.authUserCode) {
            // 代理権限 (承認) のチェック
            result = Procedure.imw_proc_utils.checkActUser(
                    groupId, localeId, sysDate, OriginalActList.APPROVE_AUTH,
                    oProcParam.executeUserCode, oProcParam.authUserCode, flowId,
                    personalActCond, applicationalActCond, authoritativeActCond);

            // 代理権限の取得に失敗した場合
            if (!result.resultFlag) {
                resultInfo.errorMessage =
                        Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3624", result);
                resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
                return resultInfo;
            }

            // 代理権限がない場合
            if (!result.actFlag) {
                resultInfo.errorMessage =
                        Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3532", result);
                resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
                return resultInfo;
            }
        }

        // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
        // ＊フロー設定に関する各種チェック開始
        // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
        // 処理種別実行権限
        // 承認対象ノード情報を取得する
        var actvMatterNode = new ActvMatterNode(localeId, imwLumpProcParams[cnt].systemMatterId);
        result = actvMatterNode.getExecNodeConfig(imwLumpProcParams[cnt].nodeId);
        if (!result.resultFlag || isBlank(result.data)) {
            // ノード情報の取得に失敗した場合
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3624", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }
        var executableProcessTypeList = result.data.executableProcessType;
        var procTypeAllowedFlag = false;
        for (var cnt2 = 0, leng = executableProcessTypeList.length; cnt2 < leng; cnt2++) {
            // 対象ノードで実施可能な処理種別分だけ繰り返し
            if (executableProcessTypeList[cnt2].nodeProcess == targetProcType) {
                // 承認実行可能
                procTypeAllowedFlag = true;
                break;
            }
        }
        if (!procTypeAllowedFlag) {
            // 指定した処理種別が許可されていない
            resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3656");
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }
        // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
        // ＊フロー設定に関する各種チェック終了
        // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊

        // 権限者存在チェック
        if (!Procedure.imw_proc_utils.checkProcessAuthUser(
                processManager, oProcParam.executeUserCode, oProcParam.authUserCode)) {
            // 処理権限者取得に失敗
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                    "IMW.CLI.WRN.3658", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }

        // 承認実行
        oProcParam.lumpProcessFlag = "1";
        result = processManager.approve(oProcParam, oUserParam);
        if (!result.resultFlag) {
            // 処理エラー
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                    "IMW.CLI.WRN.3624", result);
            resultInfo.errorLumpProcParam = imwLumpProcParams[cnt];
            return resultInfo;
        }

        // マネージャ解放
        actvMatter     = null;
        processManager = null;
    }

    // 正常終了
    resultInfo.resultFlag = true;
    return resultInfo;
}
