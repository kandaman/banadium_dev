var oRequest = {};
var oDisplay = {};

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

//=============================================================================
// ワークフロー処理画面振分処理
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】ワークフロー処理画面を決定し、画面遷移します。
//=============================================================================
function init(request) {

    // クライアントタイプの一時切り替えを実行（スマートフォン端末でPC画面に/PCでスマートフォン画面にアクセスした場合の対処）
    ClientTypeSwitcher.oneTimeSwitchTo(IMW_CLIENT_TYPE);

    var result;

    // ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();

    // リクエスト情報取得
    oRequest.imwOpenPageFormName    = Procedure.imw_utils.getValue(request.imwOpenPageFormName, "");
    oRequest.imwOpenPageFormTarget  = Procedure.imw_utils.getValue(request.imwOpenPageFormTarget, "");
    oRequest.imwAuthUserCode        = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");
    oRequest.imwSystemMatterId      = Procedure.imw_utils.getValue(request.imwSystemMatterId, "");
    oRequest.imwUserDataId          = Procedure.imw_utils.getValue(request.imwUserDataId, "");
    oRequest.imwNodeId              = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwApplyBaseDate       = Procedure.imw_utils.getValue(request.imwApplyBaseDate, "");
    oRequest.imwFlowId              = Procedure.imw_utils.getValue(request.imwFlowId, "");
    oRequest.imwCallOriginalParams  = Procedure.imw_utils.getValue(request.imwCallOriginalParams, "");
    oRequest.imwNextScriptPath      = Procedure.imw_utils.getValue(request.imwNextScriptPath, "");
    oRequest.imwNextApplicationId   = Procedure.imw_utils.getValue(request.imwNextApplicationId, "");
    oRequest.imwNextServiceId       = Procedure.imw_utils.getValue(request.imwNextServiceId, "");
    oRequest.imwNextPagePath        = Procedure.imw_utils.getValue(request.imwNextPagePath, "");
    oRequest.imwPageType            = Procedure.imw_utils.getValue(request.imwPageType, "");
    oRequest.imwMatterStatus        = Procedure.imw_utils.getValue(request.imwMatterStatus, "");
    oRequest.imwNodeSetting         = Procedure.imw_utils.getValue(request.imwNodeSetting, "");
    oRequest.imwCustomParam     	= Procedure.imw_utils.getValue(request.imwCustomParam, ""); // suzuki add カスタムパラメータ

    // lo system add 初期ノードID(再利用で使用)
    // 定数読み込み
    //Constant.load("cactus/common_libs/const");
    //oRequest.reApply_FlowId = Constant.APPLY_FROW_ID;
    //oRequest.reApply_NodeId = Constant.APPLY_NODE_ID;
    
    //Debug.console("proc_frame");
    //Debug.console(request);

    // URLチェック
    if (!Procedure.imw_proc_utils.checkUrl(oRequest)) {
        Procedure.imw_error_utils.showErrorGreyboxClose("IMW.CLI.WRN.3675", "", "");
    }

    // リクエスト情報取得（閉じる後の再表示用）
    oRequest.imwCallType            = Procedure.imw_utils.getValue(request.imwCallType, "0");
    oRequest.imwWorkflowParams      = Procedure.imw_utils.getValue(request.imwWorkflowParams, "");

    // ワークフローパラメータ初期設定
    if (isBlank(oRequest.imwWorkflowParams)) {
        // ワークフローパラメータ未定義のときは枠を用意
        oRequest.imwWorkflowParams = URL.encode(ImJson.toJSONString(new Object()));
    }

    // ユーザコンテンツから受け渡された初期表示情報の取得
    // 強制パラメータフラグ
    oRequest.imwForcedParamFlag = Procedure.imw_utils.getValue(
            request.imwForcedParamFlag, codeUtil.getEnumCodeFlagStatus("Disable"));
    if (!isUndefined(request.imwMatterName)) {
        // 案件名
        oRequest.imwMatterName = request.imwMatterName;
        oDisplay.imwMatterNameHiddenFlag = true;
    }
    if (!isUndefined(request.imwComment)) {
        // コメント
        oRequest.imwComment = request.imwComment;
        oDisplay.imwCommentHiddenFlag = true;
    }

    // 表示画面パスの決定
    if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_App")) {
        // 申請画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/apply/apply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckApply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_TempSave")) {
        // 一時保存画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/temporary_save/temporary_save";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckTemporarySave(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_UnApp")) {
        // 未申請画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/unapply/unapply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckUnapply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_ReApp")) {
        // 再申請画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/reapply/reapply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckReapply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_Proc")) {
        // 処理画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/approve/approve";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckApprove(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_Cnfm")) {
        // 確認画面
        oDisplay.procMainPagePath = "im_workflow/common/proc/confirm/confirm";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckConfirm(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_App_Sp")) {
        // 申請画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/apply/apply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckApply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_TempSave_Sp")) {
        // 一時保存画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/temporary_save/temporary_save";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckTemporarySave(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_UnApp_Sp")) {
        // 未申請画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/unapply/unapply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckUnapply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_ReApp_Sp")) {
        // 再申請画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/reapply/reapply";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckReapply(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_Proc_Sp")) {
        // 処理画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/approve/approve";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckApprove(request);

    } else if (oRequest.imwPageType == codeUtil.getEnumCodePageType("pageTyp_Cnfm_Sp")) {
        // 確認画面（スマートフォン）
        oDisplay.procMainPagePath = "im_workflow_smartphone/common/proc/confirm/confirm";
        // タグパラメータチェック
        Procedure.imw_tag_param_utils.tagParamCheckConfirm(request);
    }

	// add suzuki カスタムパラメータに処理画面のパスが指定されていた場合そちらを使う ----
    //Debug.print("imwCustomParam.procPage ----------------");
    if (!isBlank(oRequest.imwCustomParam)) {
    	try {
        	var imwCustomParam = ImJson.parseJSON(oRequest.imwCustomParam);
        	if (!isBlank(imwCustomParam.procPage)) {
        		oDisplay.procMainPagePath = imwCustomParam.procPage;
        	}
    	} catch (e) {
    			//Debug.print("ERORRR");
    			Logger.getLogger().error('imwCustomParam 取得失敗');
    	}
   	}
	// -----------------------------------------------------------------------------
	

    if (isBlank(oDisplay.procMainPagePath)) {
        // 表示画面の特定が不可能
        Procedure.imw_error_utils.showErrorGreyboxClose("IMW.CLI.WRN.3631", "", "");
    }

    // リクエスト情報からIMパラメータを取り除いたパラメータの設定
    var oUserParams = Procedure.imw_proc_utils.getUserParam(request);
    // ユーザパラメータをJSON文字列に変換
    oRequest.imwUserParamsJSON = ImJson.toJSONString(oUserParams);

    // 初期表示：案件名
    if (!isBlank(oUserParams.imwInitParamMatterName)) {
        oRequest.imwInitParamMatterName = oUserParams.imwInitParamMatterName;
    }
    // 初期表示：コメント
    if (!isBlank(oUserParams.imwInitParamProcessComment)) {
        oRequest.imwInitParamProcessComment = oUserParams.imwInitParamProcessComment;
    }

    // 処理正常終了時の次画面遷移用のFORM/action属性の取得
    result = Procedure.imw_proc_utils.getWorkflowFormAction(oRequest);
    if (result.resultFlag) {
        oDisplay.nextAction = result.formAction;
        oDisplay.noNextFlag = "0";
    } else {
        oDisplay.noNextFlag = "1";
    }

    // next指定時、処理完了後に遷移先画面に引き渡す呼出元パスを取得
    // また、連続処理の場合、処理正常終了後にsessionに処理案件情報を格納する。実施是非の制御フラグを設定する。
    oDisplay.isSetImwCallOriginalPagePath = false;
    oRequest.imwCallOriginalPagePath = null;
    oDisplay.isSetSessionAfterExec = false;
    if (!isBlank(oRequest.imwCallOriginalParams)) {
        var tempOriginalParamsJSONString = URL.decode(oRequest.imwCallOriginalParams);
        if (ImJson.checkJSONString(tempOriginalParamsJSONString)) {
            var tempOriginalParams = ImJson.parseJSON(tempOriginalParamsJSONString);
            // 呼出元パス取得・設定
            if (!isBlank(tempOriginalParams.imwCallOriginalPagePath)) {
                oDisplay.isSetImwCallOriginalPagePath = true;
                oRequest.imwCallOriginalPagePath = tempOriginalParams.imwCallOriginalPagePath;
            }
            // 連続処理パラメータチェック
            var tempSerialProcParams = Procedure.imw_utils.getValue(tempOriginalParams.imwSerialProcParams, "");
            if (Procedure.imw_proc_utils.checkSerialParamsObject(tempSerialProcParams)) {
                // 連続処理によって当画面が表示されたと判断し、制御フラグをONに設定する
                oDisplay.isSetSessionAfterExec = true;
            }
        }
    }

    // HTML特殊文字を変換する
    oRequest = Procedure.imw_utils.toBrowse(oRequest);
}

//=============================================================================
// ワークフロー処理画面パラメータ　エンコード処理(非同期処理)
//   【 入力 】imwWorkflowParams: ワークフロー処理画面パラメータ
//   【 返却 】URLエンコードされたワークフロー処理画面パラメータ
//   【作成者】NTT DATA INTRAMART
//   【 概要 】指定されたワークフロー処理画面パラメータ（htmlで生成したJSON文字列）
//             をURLエンコードして返却します。
//=============================================================================
function encodeImwWorkflowParams(imwWorkflowParams) {
    return URL.encode(imwWorkflowParams);
}

//=============================================================================
// sessionに、連続処理/連続確認によって最後に処理された案件情報を設定
// 【 入力 】systemMatterId: システム案件ID
//           nodeId: ノードID
// 【 返却 】なし
// 【作成者】NTT DATA INTRAMART
// 【 概要 】連続処理、連続確認の一環で案件処理を行った場合、sessionに最終処理案件情報を格納します。
//           この情報をもとに、次にどの案件を処理するかを判断、決定します。
//=============================================================================
function setLastProcessedMatterInfoInSerial(systemMatterId, nodeId) {
    Procedure.imw_proc_utils.setSession4lastProcessedMatterInfoInSerial(systemMatterId, nodeId);
}
