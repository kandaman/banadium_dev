//=============================================================================
// 処理関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】ワークフロー処理を実行します。
//=============================================================================
function approve(request){

    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var groupId = sessionInfo.loginGroupId;
    var userCode = sessionInfo.userCd;

    // 処理結果オブジェクトの生成
    var resultInfo = {
        "resultFlag"    : false,
        "errorMessage" : ""
    };

    // システム案件ID
    var imwSystemMatterId = request.imwSystemMatterId;
    // フローID
    var imwFlowId = request.imwFlowId;
    // ノードID
    var imwNodeId = request.imwNodeId;
    // ログインユーザ情報の取得
    var localeId = Contexts.getAccountContext().locale;

    // 初期化
    var sysDate = Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone(); // システム日付
    var codeUtil = new WorkflowCodeUtil();
    var oDefine = getDefineValues(codeUtil);
    var result;
    var cnt;
    var leng;

    // 処理用パラメータ
    var procParams = request.procParams;
    // 実行者コードをセッションからセット
    procParams.executeUserCode = userCode;

    // ユーザパラメータ
    var userParam = request.userParams;

    // 処理実施前の処理可否判定
    var processManager = new ProcessManager(localeId, imwSystemMatterId, imwNodeId);
    result = processManager.isPossibleToProcess(procParams.executeUserCode);
    if (!result.resultFlag) {
        // 判定エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3546", result);
        return resultInfo;
    }
    if (!result.data) {
        // 処理不可
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3507", result);
        return resultInfo;
    }

    // 代理の場合 (ログインユーザと申請者が異なる場合)
    if (procParams.executeUserCode != procParams.authUserCode) {
        // 代理権限 (承認) のチェック
        var authType;
        var actErrMsgId;
        if (procParams.processType == oDefine.procTyp_rapy ||
            procParams.processType == oDefine.procTyp_dct ||
            procParams.processType == oDefine.procTyp_apy) {
            // 処理対象ノード＝申請ノード：申請権限
            authType = OriginalActList.APPLY_AUTH;
            actErrMsgId = "IMW.CLI.WRN.3531";
        } else {
            // 処理対象ノード＝申請ノード以外：承認権限
            authType = OriginalActList.APPROVE_AUTH;
            actErrMsgId = "IMW.CLI.WRN.3532";
        }
        result = Procedure.imw_proc_utils.checkActUser(
                groupId, localeId, sysDate, authType,
                procParams.executeUserCode, procParams.authUserCode, imwFlowId);

        // 代理権限の取得に失敗した場合
        if (!result.resultFlag) {
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3546", result);
            return resultInfo;
        }

        // 代理権限がない場合
        if (!result.actFlag) {
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    actErrMsgId, result);
            return resultInfo;
        }
    }

    // 横・縦配置ノード設定情報を整形
    procParams.HVNodeConfigModels =
            Procedure.imw_proc_utils.remakeHVNodeConfigModels4Proc(
            procParams.HVNodeConfigModels);

    // 動的処理ノード設定対応
    if (!isBlank(procParams.DCNodeConfigModels)) {
        for (cnt=0; cnt<procParams.DCNodeConfigModels.length; cnt++) {
            if (procParams.DCNodeConfigModels[cnt].dynamicNodeFlag &&
                    procParams.DCNodeConfigModels[cnt].processTargetConfigs.length == 0 &&
                    procParams.DCNodeConfigModels[cnt].setFlag) {
                // 動的ノードを0人で設定＝ノード削除
                procParams.DCNodeConfigModels[cnt].processTargetConfigs = null;
            }
        }
    }

    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック開始
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // フロー有効チェック
    // 処理対象ノードでの設定情報を取得
    result = processManager.getConfigSetToProcessWithProcessTarget();
    if (!result.resultFlag) {
        // 検索エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3546", result);
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
    result = Procedure.imw_proc_utils.checkParamByConfigSet(procParams, configSet, procParams.processType);
    if (!result.resultFlag) {
        // 権限エラー
        resultInfo.errorMessage = result.errorMessage;
        return resultInfo;
    }
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
    // ＊フロー設定に関する各種チェック終了
    // ＊＊＊＊＊＊＊＊＊＊＊＊＊＊

    // 権限者存在チェック
    if (!Procedure.imw_proc_utils.checkProcessAuthUser(
            processManager, procParams.executeUserCode, procParams.authUserCode)) {
        // 処理権限者取得に失敗
        resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3658");
        return resultInfo;
    }

    // 案件情報の作成
    result = Procedure.imw_matter_utils.getMatterInfo(
            groupId, localeId, imwSystemMatterId, imwNodeId);
    if (!result.resultFlag) {
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage("IMW.CLI.WRN.3546", result);
        return resultInfo;
    }
    var matterInfo = result.data;
    // 根回しメール設定
    result = Procedure.imw_proc_utils.getNegoMailInfo4Param(
            groupId, localeId, sysDate, procParams.negoMail, matterInfo);
    if (!result.resultFlag) {
        resultInfo.errorMessage = result.errorMessage;
        return resultInfo;
    }
    procParams.negoModel = result.data;
    procParams.matterNumber = null;

    // 処理種別の判定→各処理メソッドへの振り分けと実行
    switch (procParams.processType) {
        // 承認
        case oDefine.procTyp_apr :
            result = processManager.approve(procParams, userParam);
            break;

        // 承認終了
        case oDefine.procTyp_apre :
            result = processManager.approveEnd(procParams, userParam);
            break;

        // 差戻し
        case oDefine.procTyp_sbk :
            // 差戻し先チェック
            result = processManager.getNodesToSendBack();
            if (!result.resultFlag) {
                // 差戻し先ノードの取得に失敗
                resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3546");
                return resultInfo;
            }
            var nodeToSendbackMap = {};
            var nodeToSendbackList = new Array();
            for (cnt = 0, leng = result.data.length; cnt < leng; cnt++) {
                nodeToSendbackMap[result.data[cnt].nodeId] = true;
                nodeToSendbackList.push(result.data[cnt].nodeId);
            }
            for (cnt = 0, leng = procParams.sendBackNodeId.length; cnt < leng; cnt++) {
                if (!nodeToSendbackMap[procParams.sendBackNodeId[cnt]]) {
                    // パラメータに差戻し先として指定不可なノードが指定されている場合
                    resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3652");
                    return resultInfo;
                }
            }
            // 差戻し先チェック2：同時指定不可なノードを同時指定していないか
            // 案件情報の取得（差戻し先チェック用情報の生成）
            var actvMatter = new ActvMatter(localeId, imwSystemMatterId);
            result = actvMatter.getExecFlow();
            if (!result.resultFlag || result.data == null) {
                // 検索エラー
                resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3546");
                return resultInfo;
            }
            var nodeWork;
            var nodesWork = result.data.nodes;
            var nodesList = new Array();
            for (cnt = 0; cnt < nodesWork.length; cnt++) {
                nodeWork = {
                    "nodeId" : nodesWork[cnt].nodeId,
                    "forwardNodeIds" : nodesWork[cnt].forwardNodeIds,
                    "backwardNodeIds" : nodesWork[cnt].backwardNodeIds
                };
                nodesList.push(nodeWork);
            }
            var nodeMoveMap = Procedure.imw_matter_utils.getCheckResultMoveTo(
                    groupId, localeId, imwSystemMatterId,
                    procParams.sendBackNodeId, nodeToSendbackList, nodesList);
            for (cnt = 0; cnt < procParams.sendBackNodeId.length; cnt++) {
                if (!nodeMoveMap[procParams.sendBackNodeId[cnt]]) {
                    // 差戻し先として同時指定不可なノードが指定されている場合
                    resultInfo.errorMessage = MessageManager.getMessage("IMW.CLI.WRN.3652");
                    return resultInfo;
                }
            }
            // 実行
            result = processManager.sendBack(procParams, userParam);
            break;

        // 否認
        case oDefine.procTyp_deny :
            result = processManager.deny(procParams, userParam);
            break;

        // 保留
        case oDefine.procTyp_rsv :
            result = processManager.reserve(procParams, userParam);
            break;

        // 保留解除
        case oDefine.procTyp_rsvc :
            result = processManager.reserveCancel(procParams, userParam);
            break;

        // 再申請
        case oDefine.procTyp_rapy :
            result = processManager.reapply(procParams, userParam);
            break;

        // 取止め
        case oDefine.procTyp_dct :
            result = processManager.discontinue(procParams, userParam);
            break;

        // 未申請案件の申請
        case oDefine.procTyp_apy :
            result = processManager.applyFromUnapply(procParams, userParam);
            break;

        // その他：処理種別不正
        default :
            resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                    "IMW.CLI.WRN.3524", result, procParams.processType);
            return resultInfo;
    }

    if (!result.resultFlag) {
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                "IMW.CLI.WRN.3546", result);
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

    objDef.atmCnf_NotAddDel = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_NotAddDel");     // 添付ファイル：追加・削除不可
    objDef.atmCnf_Add       = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_Add");           // 添付ファイル：追加のみ
    objDef.atmCnf_AddDel    = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_AddDel");        // 添付ファイル：追加・削除可

    objDef.procTyp_apr      = codeUtil.getEnumCodeProcessType("procTyp_apr");                   // 処理種別：承認
    objDef.procTyp_apre     = codeUtil.getEnumCodeProcessType("procTyp_apre");                  // 処理種別：承認終了
    objDef.procTyp_sbk      = codeUtil.getEnumCodeProcessType("procTyp_sbk");                   // 処理種別：差戻し
    objDef.procTyp_deny     = codeUtil.getEnumCodeProcessType("procTyp_deny");                  // 処理種別：否認
    objDef.procTyp_rsv      = codeUtil.getEnumCodeProcessType("procTyp_rsv");                   // 処理種別：保留
    objDef.procTyp_rsvc     = codeUtil.getEnumCodeProcessType("procTyp_rsvc");                  // 処理種別：保留解除
    objDef.procTyp_rapy     = codeUtil.getEnumCodeProcessType("procTyp_rapy");                  // 処理種別：再申請
    objDef.procTyp_dct      = codeUtil.getEnumCodeProcessType("procTyp_dct");                   // 処理種別：取止め
    objDef.procTyp_apy      = codeUtil.getEnumCodeProcessType("procTyp_apy");                   // 処理種別：申請

    objDef.Enable  = codeUtil.getEnumCodeFlagStatus("Enable");    // フラグ状態：有効
    objDef.Disable = codeUtil.getEnumCodeFlagStatus("Disable");   // フラグ状態：無効

    return objDef;
}

//=============================================================================
// 差戻し可能差戻し先設定関数
//  【 入力 】request: ＵＲＬ引数取得オブジェクト
//  【 返却 】処理結果
//  【作成者】NTT DATA INTRAMART
//  【 概要 】差戻し可能な差戻し先を取得します。
//=============================================================================
function actionGetCheckResultMoveTo(request) {
    var session  = Contexts.getAccountContext();
    var loginGroupId = session.loginGroupId;
    var localeId = session.locale;
    var result = Procedure.imw_matter_utils.getCheckResultMoveTo(
            loginGroupId, localeId, request.systemMatterId,
            request.sendBackTargetNode, request.key, request.matterNodes);
    return result;
}
