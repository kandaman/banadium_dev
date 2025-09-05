var oRequest            = new Object();     // リクエスト情報オブジェクト
var oRequestJSON        = "";               // リクエスト情報オブジェクト(JSON文字列)
var oDisplayInfo        = new Object();     // 画面表示情報オブジェクト
var oDisplayInfoJSON    = "";               // 画面表示情報オブジェクト(JSON文字列)
var oNegoMailInfo       = new Object();     // 根回し用画面表示情報オブジェクト
var oNegoMailInfoJSON   = "";               // 根回し用画面表示情報オブジェクト(JSON文字列)
var oNotEscapeDispInfo  = new Object();    // HTMLエスケープをしない画面表示情報オブジェクト
var oProcParams         = null;             // 処理情報オブジェクト
var oProcParamsJSON     = "";               // 処理情報オブジェクト(JSON文字列)
var oCaption            = new Object();     // 画面表示文言オブジェクト
var oMessageJSON        = "";               // 画面表示メッセージオブジェクト(JSON文字列)
var oDefine             = new Object();     // 定義情報オブジェクト
var oDefineJSON         = "";               // 定義情報オブジェクト(JSON文字列)
var oValidationJSON     = "";               // 入力チェック用オブジェクト(JSON文字列)
var oWorkflowParamsJSON = "";               // ワークフローパラメータ(JSON文字列)
var oNodesJSON          = "";               // ノード情報(JSON文字列)
var dialog = new Object();

var fileUploadURL   = "im_workflow/common/unit/file/file_upload";
var fileDownloadURL = "im_workflow/common/unit/file/file_download_proc";

var separator = "^";
var nodeSeparator = "~";

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

var oUserParams       = new Object();    // ユーザ入力確認情報オブジェクト add lo_system
var oUserParamsJSON       = "";    // ユーザ入力確認情報(JSON文字列) add lo_system
var oDisplayInfoJSON2    = "";               // 画面表示情報オブジェクト(JSON文字列) add lo_system
var oProcParamsJSON2     = "";               // 処理情報オブジェクト(JSON文字列) add lo_system


//=============================================================================
// 処理画面　初期化関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】処理画面を表示します。
//=============================================================================
function init ( request ) {
    //Debug.console('approve init');
    //Debug.console(request);

	// add lo_system ユーザー入力パラメータ取得
	oUserParamsJSON   = request.imwUserParamsJSON;
	oUserParams       = ImJson.parseJSON(request.imwUserParamsJSON);

    // クライアントタイプの一時切り替えを実行（スマートフォン端末でPC画面に/PCでスマートフォン画面にアクセスした場合の対処）
    ClientTypeSwitcher.oneTimeSwitchTo(IMW_CLIENT_TYPE);

    var CALLBACK_FUNCTION = "parent.GB_closeWithImwCallBack";
    var NODE_STATUS_RESERVEWAIT = "reservewait";

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

    // 汎用ローカル変数
    var result;
    var cnt;
    var index;
    var objDispTemp;

    // リクエストパラメータ取得
    oRequest.imwGroupId             = groupId;
    oRequest.imwUserCode            = userCode;
    oRequest.imwAuthUserCode        = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");
    oRequest.imwPageType            = Procedure.imw_utils.getValue(request.imwPageType, "");
    oRequest.imwSystemMatterId      = Procedure.imw_utils.getValue(request.imwSystemMatterId, "");
    oRequest.imwNodeId              = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwSerialProcParams    = Procedure.imw_utils.getValue(request.imwSerialProcParams, "");
    oRequest.imwCallType            = Procedure.imw_utils.getValue(request.imwCallType, "");

    // 次のパラメータは画面遷移して戻ってきたときに取得すべき値
    oRequest.imwFlowId              = Procedure.imw_utils.getValue(request.imwFlowId, "");
    oRequest.imwWorkflowParams      = Procedure.imw_utils.getValue(request.imwWorkflowParams, "");

    // 印影
    if(!isUndefined(request.imwStampId)) {
        oRequest.imwStampId = Procedure.imw_utils.getValue(request.imwStampId, "");
    }
    if(!isUndefined(request.imwStampTag)) {
        oRequest.imwStampTag = Procedure.imw_utils.getValue(request.imwStampTag, "");
    }

    // imwCallOriginalParamsについて
    // imwCallOriginalParamsはPC版の遷移ではリクエストパラメータに含まれないが、
    // スマートフォン版の遷移では含まれ、一覧へ戻る際のパラメータとして必要となる。
    var imwCallOriginalParams = Procedure.imw_utils.getValue(
            request.imwCallOriginalParams, URL.encode(ImJson.toJSONString(new Object())));
    oRequest.imwCallOriginalParams = imwCallOriginalParams;

    // imwSpIntegrateListFlagについて
    // imwSpIntegrateListFlagはPC版の遷移ではリクエストパラメータに含まれないが、
    // スマートフォン版の遷移では含まれ、一覧へ戻る際のパラメータとして必要となる。
    oRequest.imwSpIntegrateListFlag = Procedure.imw_utils.getValue(
            request.imwSpIntegrateListFlag, codeUtil.getEnumCodeFlagStatus("Disable"));

    // imwSpDirectTransitionFlagについて
    // ユーザコンテンツ画面が設定されていない場合に"1"となる、スマートフォン用のパラメータ。
    oRequest.imwSpDirectTransitionFlag = Procedure.imw_utils.getValue(
            request.imwSpDirectTransitionFlag, codeUtil.getEnumCodeFlagStatus("Disable"));

    // スマートフォン版遷移時必須パラメータ
    oRequest.imwCallOriginalPagePath = Procedure.imw_utils.getValue(request.imwCallOriginalPagePath, "");

    // 添付ファイルマネージャの生成
    var attachFileManager = new WorkflowTemporaryAttachFileManager();
    // 処理マネージャの生成
    var processManager = new ProcessManager(localeId,
            oRequest.imwSystemMatterId, oRequest.imwNodeId);

    // 特定のユーザが特定のノードに対する処理を行うことができるかを判定します。
    result = processManager.isPossibleToProcess(oRequest.imwUserCode);
    if(!result.resultFlag) {
        // 判定エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    if(!result.data) {
        // 処理不可
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580",
                MessageManager.getMessage("IMW.CLI.WRN.3507"), CALLBACK_FUNCTION);
    }

    // 案件(未完了)マネージャの生成
    var actvMatter = new ActvMatter(localeId, oRequest.imwSystemMatterId);
    // 案件情報を取得する
    result = actvMatter.getMatter();
    if(!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    if(isBlank(result.data)) {
        // 案件情報が存在しない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580",
                MessageManager.getMessage("IMW.CLI.WRN.3513", oRequest.imwSystemMatterId),
                CALLBACK_FUNCTION);
    }
    var actvMatterData = result.data;

    // スマートフォン処理画面用（詳細表示用）にユーザデータIDをセット
    oRequest.imwUserDataId = actvMatterData.userDataId;

    // 案件情報(マスタフロー)を取得する
    result = actvMatter.getMasterFlow();
    if(!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    var masterFlow = result.data;

    var configSetToProcess;
    var stampData = null;

    if (oRequest.imwCallType == "1" || !isBlank(oRequest.imwWorkflowParams)) {
        // 【再表示】
        // oRequest.imwCallTypeのみで判定しない理由：
        //  ユーザコンテンツ内での画面遷移でimwWorkflowParamsを引き回したケースに対応するため
        do {
            // リクエストパラメータから処理用情報を取得
            var wfParams = ImJson.parseJSON(URL.decode(oRequest.imwWorkflowParams));
            if (!isObject(wfParams)) {
                // ワークフローパラメータパラメータがない：初回表示へ
                break;
            }
            stampData = wfParams.stampData;
            wfParams = wfParams[oRequest.imwPageType];
            if (!isObject(wfParams) ||
                    wfParams.systemMatterId != oRequest.imwSystemMatterId ||
                    wfParams.nodeId != oRequest.imwNodeId) {
                // 次の条件を満たす場合、初回表示処理へ
                // ・処理パラメータがない
                // ・キーとなるシステム案件ID・ノードIDのいずれかが
                // リクエストパラメータと入力済み情報とで食い違っている
                break;
            }
            // 画面種別が処理画面のパラメータあり＝パラメータの引き継ぎ実施
            oProcParams = wfParams;
            oRequest.imwCallType = "1";

            if(!isBlank(oProcParams.attachFile)) {
                // 添付ファイルサイズのカンマ付加
                for(cnt=0; cnt<oProcParams.attachFile.length; cnt++) {
                    oProcParams.attachFile[cnt].fileSize =
                            Format.toMoney(parseInt(oProcParams.attachFile[cnt].fileSize.replace(/,/g, "")));
                }
            }
            // 設定情報も引き継ぎ
            configSetToProcess = oProcParams.configSet;
        } while (false);
    }
    if (isBlank(oProcParams)) {
        // 【初回表示】
        oRequest.imwCallType = "0";
        oRequest.imwFlowId = Procedure.imw_utils.getValue(actvMatterData.flowId, "");   // フローID

        // 承認処理オブジェクトの初期化
        oProcParams = new Object();
        oProcParams.systemMatterId       = oRequest.imwSystemMatterId;  // システム案件ID
        oProcParams.nodeId               = oRequest.imwNodeId;          // ノードID
        oProcParams.processType          = "";                          // 処理種別

        oProcParams.matterName           = actvMatterData.matterName;   // 案件名
        oProcParams.matterNumber         = actvMatterData.matterNumber; // 案件番号

        oProcParams.executeUserCode      = oRequest.imwUserCode;// 実行者コード
        // 初回表示時は一時的に権限者=実行者とする。
        // 理由は初期表示時の処理者選択としてログインユーザ自身を指定するため。
        oProcParams.authUserCode         = oRequest.imwUserCode;// 権限者コード

        oProcParams.authOrgz             = "";
        oProcParams.authCompanyCode      = "";                  // 権限者会社コード
        oProcParams.authOrgzSetCode      = "";                  // 権限者組織セットコード
        oProcParams.authOrgzCode         = "";                  // 権限者組織コード

        oProcParams.priorityLevel        = actvMatterData.priorityLevel;// 優先度(通常)
        oProcParams.processComment       = "";                  // 処理コメント

        oProcParams.systemFileNameForDelete = new Array();      // 削除対象システムファイル名配列
        oProcParams.DCNodeConfigModels   = new Array();         // 動的・確認ノード設定配列
        oProcParams.HVNodeConfigModels   = new Array();         // 横配置・縦配置ノード設定配列
        oProcParams.branchSelectModels   = new Array();         // ルート選択情報配列

        oProcParams.negoMail             = new Object();        // 根回しメール情報
        oProcParams.negoMail.to          = new Object();        // 宛先
        oProcParams.negoMail.cc          = new Object();        // Cc
        oProcParams.negoMail.bcc         = new Object();        // Bcc
        oProcParams.negoMail.subject     = "";                  // 件名
        oProcParams.negoMail.text        = "";                  // 本文

        oProcParams.sendBackNodeId       = new Array();         // 差戻し先ノードID配列（差戻し用）

        oProcParams.attachFile           = new Array();         // 添付ファイル

        // 新たな添付ファイル一時領域ディレクトリを作成
        result = attachFileManager.createTempDirKey();
        if(!result.resultFlag) {
            // 作成失敗
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
        }
        oProcParams.tempDirKey = result.data;   // 添付ファイル一時領域ディレクトリキー

        // 処理対象ノードでの設定情報を取得（処理対象者情報必要）
        result = processManager.getConfigSetToProcessWithProcessTarget();
        if (!result.resultFlag) {
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
        }
        configSetToProcess = result.data;
        oProcParams.configSet = configSetToProcess;
    }

    // ユーザコンテンツから受け渡された初期表示情報の設定
    // コメント
    oProcParams.processComment = isUndefined(request.imwComment) ?
            oProcParams.processComment : request.imwComment;

    // 画面表示情報オブジェクトの初期化
    oDisplayInfo.applyBaseDate = Procedure.imw_datetime_utils.getDateTimeToString(
            Procedure.imw_datetime_utils.formatBaseDate(actvMatterData.applyBaseDate));            // 申請基準日
    oDisplayInfo.applyDate =
        Procedure.imw_datetime_utils.getDateTimeToStringByUserTimeZone(actvMatterData.applyDate); // 申請日
    oDisplayInfo.applyAuthUserName   = actvMatterData.applyAuthUserName ;       // 申請権限者名

    oDisplayInfo.dispAttachFileFlag    = false;     // 添付ファイル表示フラグ
    oDisplayInfo.dispSendBackFlag      = false;     // 差戻し先表示フラグ
    oDisplayInfo.dispFlowSettingFlag   = false;     // フロー設定表示フラグ
    oDisplayInfo.dispRouteSelectFlag   = false;     // ルート選択表示フラグ
    // 根回し用画面表示情報オブジェクトの初期化
    oNegoMailInfo.dispNegoMailFlag      = false;     // 根回しメール表示フラグ
    oNegoMailInfo.dispNegoOnlyImboxFlag = false;     // 通知にIMBoxのみを使用するフラグ
    oNegoMailInfo.negoMailList4Select   = {to:[],cc:[],bcc:[]};// 根回しメール宛先リスト

    // 登録済みの添付ファイル一覧を取得する
    result = actvMatter.getAttachFileList();
    if(!result.resultFlag) {
        // 添付ファイル情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    // 画面表示用にオブジェクトの生成
    var tmpFileObj;
    oDisplayInfo.attachFile = new Array();
    if (result.data.length > 0) {

        // 添付ファイルのパスを取得する
        var procResult = Procedure.imw_proc_utils.getActvMatterTranFileDirPath(oProcParams.systemMatterId);
        if (procResult.error || procResult.countRow == 0) {
            // 案件情報取得エラー
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
        }
        var fileDirPath = procResult.data;

        for(cnt=0; cnt<result.data.length; cnt++) {
            // 登録済みの添付ファイル数分繰り返し

            if(Procedure.imw_proc_utils.indexOf4Array(
                    result.data[cnt].systemFileName, oProcParams.systemFileNameForDelete) == -1) {
                // 削除対象のファイルではないので画面表示を行う
                tmpFileObj = {
                        "systemFileName" : result.data[cnt].systemFileName,
                        "realFileName"   : result.data[cnt].realFileName,
                        "fileSize"       : Format.toMoney(parseInt(result.data[cnt].fileSize)),
                        "authUserName"   : result.data[cnt].authUserName,
                        "createDateTime" : Procedure.imw_datetime_utils.getProcessEndDate(
                                              Procedure.imw_datetime_utils.formatBaseDateTime(result.data[cnt].createDateTime)),
                        "filePath"       : fileDirPath + result.data[cnt].systemFileName
                };
                oDisplayInfo.attachFile.push(tmpFileObj);
            }
        }
    }

    // 対象ノードの設定による画面表示オブジェクトの設定(添付ファイル)
    oDisplayInfo.addFileFlag = false;
    oDisplayInfo.delFileFlag = false;

    switch (configSetToProcess.attachmentFileConfig) {

        // 追加・削除可
        case oDefine.atmCnf_AddDel:
            oDisplayInfo.delFileFlag = true;
            oDisplayInfo.addFileFlag = true;
            break;
        // 追加のみ
        case oDefine.atmCnf_Add:
            oDisplayInfo.addFileFlag = true;
            break;
        // 追加・削除不可
        case oDefine.atmCnf_NotAddDel:
            break;

        // 設定なし：追加削除可
        default:
            oDisplayInfo.delFileFlag = true;
            oDisplayInfo.addFileFlag = true;
            break;
    }

    // 添付ファイルを許可している、もしくは既存添付ファイルが一つ以上ある＝添付ファイル欄を表示
    if (oDisplayInfo.addFileFlag || oDisplayInfo.attachFile.length > 0) {
        oDisplayInfo.dispAttachFileFlag = true;
    }

    // 画面表示情報オブジェクトの設定（コメント・添付ファイルトグル）
    oDisplayInfo.commentOpenedFlag   = !isBlank(oProcParams.processComment);    // コメントトグルOPENフラグ
    oDisplayInfo.attachFileOpenedFlag=
            (oProcParams.attachFile.length>0 || oDisplayInfo.attachFile.length>0);// 添付ファイルトグルOPENフラグ

    // 対象ノードで実施可能な処理種別を取得します。
    var nodeProcessList = configSetToProcess.nodeProcessTypes;
    if (isBlank(nodeProcessList) || nodeProcessList.length == 0) {
        // 実行可能な処理種別がない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3632", "", CALLBACK_FUNCTION);
    }

    // 処理対象案件ノード情報の取得
    var unprocListManager = new UnprocessActvMatterNodeList(
            oRequest.imwUserCode, localeId);
    var searchCondition = new ListSearchCondition();
    // AND結合
    searchCondition.setAndCombination(true);
    // システム案件ID
    searchCondition.addCondition(
            UnprocessActvMatterNodeList.SYSTEM_MATTER_ID,
            oProcParams.systemMatterId,
            ListSearchCondition.OP_EQ);
    // ノードID
    searchCondition.addCondition(
            UnprocessActvMatterNodeList.NODE_ID,
            oProcParams.nodeId,
            ListSearchCondition.OP_EQ);
    // 処理権限条件
    var procAuthCond = new Object();
    procAuthCond.applyActFlg = oDefine.Disable;
    procAuthCond.applyFlg = oDefine.Disable;
    procAuthCond.approveActFlg = oDefine.Enable;
    procAuthCond.approveFlg = oDefine.Enable;
    // 検索
    result = unprocListManager.getProcessList(procAuthCond, searchCondition);
    if (!result.resultFlag) {
        // 検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    } else if (result.data.length == 0) {
        // 処理済み or 削除済み or 非同期処理中
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3507", "", CALLBACK_FUNCTION);
    }
    var nodeStatus = result.data[0].status;

    // 画面表示オブジェクトに処理種別を設定
    oDisplayInfo.processTypeList = new Object();
    for(cnt=0; cnt<nodeProcessList.length; cnt++) {

        // 処理種別で判定
        switch (nodeProcessList[cnt].nodeProcess) {

            // 処理種別：承認
            case oDefine.procTyp_apr:
            // 処理種別：承認終了
            case oDefine.procTyp_apre:
            // 処理種別：差戻し
            case oDefine.procTyp_sbk:
            // 処理種別：否認
            case oDefine.procTyp_deny:
                // 画面表示用に処理種別を設定
                oDisplayInfo.processTypeList[nodeProcessList[cnt].nodeProcess] =
                        nodeProcessList[cnt].nodeProcessName;
                break;

            // 処理種別：保留
            case oDefine.procTyp_rsv:
                // 対象ノードの状態が保留待ちではない場合
                if(nodeStatus != NODE_STATUS_RESERVEWAIT) {
                    // 画面表示用に処理種別を設定
                    oDisplayInfo.processTypeList[nodeProcessList[cnt].nodeProcess] =
                            nodeProcessList[cnt].nodeProcessName;
                }
                break;

            // 処理種別：保留解除
            case oDefine.procTyp_rsvc:
                // 対象ノードの状態として、最後処理が保留の場合
                if(nodeStatus == NODE_STATUS_RESERVEWAIT) {
                    // 画面表示用に処理種別を設定
                    oDisplayInfo.processTypeList[nodeProcessList[cnt].nodeProcess] =
                            nodeProcessList[cnt].nodeProcessName;
                }
                break;

            default :
                // 上記以外の処理種別の場合：画面に表示しないため割愛
                break;
        }
    }
    if (!Procedure.imw_utils.isBlankObject(oDisplayInfo.processTypeList)) {
        // 実行可能な処理種別がない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3632", "", CALLBACK_FUNCTION);
    }

    // 実行中フロー情報の取得
    result = actvMatter.getExecFlow();
    if (!result.resultFlag || result.data == null) {
        // 検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    var execFlow = result.data;


    // 画面上からのフロー再設定用にパラメータを保持 add lo_system
    oProcParamsJSON2  = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oProcParams));
    oDisplayInfoJSON2 = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDisplayInfo));
    

    // 動的処理対象自動設定情報
    var imwNodeSetting = null;
    if (!isBlank(request.imwNodeSetting)) {
        var logger = Logger.getLogger();
        try {
            if (logger.isDebugEnabled()) {
                logger.debug("imwNodeSetting : {}", request.imwNodeSetting);
            }
            imwNodeSetting = ImJson.parseJSON(request.imwNodeSetting);
        } catch (e) {
            if (logger.isWarnEnabled ()) {
                logger.warn(MessageManager.getLocaleMessage(
                    localeId, "IMW.CLI.WRN.3673") + " : {}", request.imwNodeSetting);
            }
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3673", "", CALLBACK_FUNCTION);
        }
    }
    if (!isBlank(imwNodeSetting) && (imwNodeSetting !== {})) {
        // 対象ノードで処理対象者設定対象となっているノード情報を取得します。
        // 対象ノードでルート選択対象となっている分岐開始ノード情報を取得します。
        result = Procedure.imw_proc_utils.getNodeDispAndProcInfoNodeSetting(
                oDisplayInfo, oProcParams, configSetToProcess,
                oRequest.imwCallType, masterFlow, execFlow, imwNodeSetting);
    } else {
        // 対象ノードで処理対象者設定対象となっているノード情報を取得します。
        // 対象ノードでルート選択対象となっている分岐開始ノード情報を取得します。
        result = Procedure.imw_proc_utils.getNodeDispAndProcInfo(
                oDisplayInfo, oProcParams, configSetToProcess,
                oRequest.imwCallType, masterFlow, execFlow);
    }

    if (!result.resultFlag) {
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }

    // 処理者リスト・担当組織リストの取得
    result = Procedure.imw_proc_utils.getUserAndOrgzList4Display(
                                processManager, oRequest.imwUserCode, separator);
    if (!result.resultFlag) {
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    getAuthUserOrgzInfoAuthAct(result, oRequest.imwUserCode, localeId)

    // 担当組織コンボ初期値設定
    setDefaultDepartmentInCharge(result, oRequest.imwUserCode, oRequest.imwCallType);

    oDisplayInfo.dispAuthUserInfos = result.dispAuthUserInfos;
    oDisplayInfo.dispAuthOrgzInfos = result.dispAuthOrgzInfos;
    oDisplayInfo.strAuthUserBlank = result.strAuthUserBlank;

    // 保留解除の設定
    if (!isBlank(oDisplayInfo.processTypeList[oDefine.procTyp_rsvc])) {
        // 保留解除が可能な場合（実行可能な処理種別によって判定）
        for (var prop in oDisplayInfo.dispAuthUserInfos) {
            // 保留解除実施の権限者名を設定
            // ※保留解除が実施可能=保留状態、つまり権限者は一人しかいないため、
            //   無条件に処理者プルダウンに表示する権限者名をセットする
            oDisplayInfo.reserveAuthUserName = oDisplayInfo.dispAuthUserInfos[prop];
            break;
        }
    }
    // 差戻しの設定
    if (!isBlank(oDisplayInfo.processTypeList[oDefine.procTyp_sbk])) {
        // 差戻しが可能な場合（実行可能な処理種別によって判定）
        oDisplayInfo.dispSendBackFlag = true;

        // 特定のノードから差戻し可能なノード情報を取得します。
        result = processManager.getNodesToSendBack();
        if (!result.resultFlag) {
            // 差戻し可能ノード検索エラー
            Procedure.imw_error_utils.showErrorGreyboxClose(
                        "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
        }
        var nodesToSendBack = result.data;

        // 画面表示用処理履歴取得
        result = getDisplayHistoryMap(actvMatter);
        if (!result.resultFlag) {
            Procedure.imw_error_utils.showErrorGreyboxClose(
                        result.messageId, result.subMessage, CALLBACK_FUNCTION);
        }
        var objProcessHistoryLatest = result.data;

        // 案件(未完了)ノードマネージャの生成
        var actvMatterNode = new ActvMatterNode(localeId, oProcParams.systemMatterId);

        // add lo_system 差し戻し変更-------------------------------------------------------------------------------------------        
	    var imwCustomParam = null;
	    var mynodeid = null;
	    var backnodeid = null;
	    
        // 差し戻し用プロパティ取得
    	if (!isBlank(request.imwCustomParam)) {
        	try {
        		// imwCustomParamにBackNodeSettingがあったら差戻先を固定する
            	imwCustomParam = ImJson.parseJSON(request.imwCustomParam);
            	if (!isBlank(imwCustomParam.BackNodeSetting)) {
            	
            		// 親ノードIDがある場合そちらを取得
            		var nodeinfo = actvMatterNode.getMatterNode(oRequest.imwNodeId);
            		if (nodeinfo.data.parentNodeId){
            			mynodeid = nodeinfo.data.parentNodeId;
            		}else{
            			mynodeid = oRequest.imwNodeId;
            		}
            		var nodeSetting = imwCustomParam.BackNodeSetting;
            		// 対象ノードのプロパティと一致していれば表示ノードIDを取得
            		if (nodeSetting[mynodeid]){
            			if (nodeSetting[mynodeid].displayID){
            				backnodeid = nodeSetting[mynodeid].displayID;
            			}
            		}
            	}
            	
        	} catch (e) {
            	Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3673", "", CALLBACK_FUNCTION);
        	}
   		}
        // add lo_system 差し戻し変更-------------------------------------------------------------------------------------------        


        // 画面表示オブジェクトに設定
        oDisplayInfo.sendBackTargets = new Array();
        var targetHistory;
        for (cnt = 0; cnt < nodesToSendBack.length; cnt++) {
            // 差戻し先ノード数分繰り返し
            objDispTemp = new Object();
            objDispTemp.nodeId   = nodesToSendBack[cnt].nodeId;
            objDispTemp.nodeName = nodesToSendBack[cnt].nodeName;

            // 処理履歴から、表示対象となる処理履歴をピンポイントで取得
            targetHistory = objProcessHistoryLatest[objDispTemp.nodeId];
            if (isBlank(targetHistory)) {
                // ノードは未処理状態
                continue;
            }

        	// add lo_system 差し戻し変更-------------------------------------------------------------------------------------------
            if (!isBlank(backnodeid)) {
            	// 設定されたIDでなければ未処理
            	if (backnodeid.indexOf(objDispTemp.nodeId) == -1){
	           		continue;
            	}
            }
        	// add lo_system 差し戻し変更-------------------------------------------------------------------------------------------
            
            // 実施した処理種別名
            result = actvMatterNode.getAvailableProcessTypeList(objDispTemp.nodeId);
            if (!result.resultFlag) {
                // 検索エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                                    "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
            }
            index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                    targetHistory.processType, result.data, "nodeProcess" );
            if (index > -1) {
                objDispTemp.processTypeName = result.data[index].nodeProcessName;
            }

            // 処理権限者名
            objDispTemp.authUserName = targetHistory.authUserName;

            // チェック済みフラグ(処理用パラメータの設定値より判定)
            objDispTemp.checkFlag = (Procedure.imw_proc_utils.indexOf4Array(
                    objDispTemp.nodeId, oProcParams.sendBackNodeId) > -1);

            oDisplayInfo.sendBackTargets.push(objDispTemp);
        }

        // 差戻し先チェック用情報の生成
        var nodesWork = execFlow.nodes;
        var nodesList = new Array();
        var nodeWork;
        for (cnt = 0; cnt < nodesWork.length; cnt++) {
            nodeWork = {
                "nodeId" : nodesWork[cnt].nodeId,
                "forwardNodeIds" : nodesWork[cnt].forwardNodeIds,
                "backwardNodeIds" : nodesWork[cnt].backwardNodeIds
            };
            nodesList.push(nodeWork);
        }
        oNodesJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(nodesList));
    }

    // 根回しメール可否判定
    var paramManager = new WorkflowParameterManager();
    oNegoMailInfo.dispNegoMailFlag      = paramManager.getIntegerParameter("notice-type") != 0 && paramManager.getBooleanParameter("negotiate-type");
    oNegoMailInfo.dispNegoOnlyImboxFlag = paramManager.getIntegerParameter("notice-type") == 3 && oNegoMailInfo.dispNegoMailFlag;

    if (oNegoMailInfo.dispNegoMailFlag) {
        // 根回しメール画面表示情報オブジェクトの初期化
        oNegoMailInfo.negoMailOpenedFlag        = false;                                     // 根回しメールトグルOPENフラグ
        oNegoMailInfo.negoMailCcOpenedFlag      = (oProcParams.negoMail.cc.length > 0);        // 根回しメールCcトグルOPENフラグ
        oNegoMailInfo.negoMailBccOpenedFlag     = (oProcParams.negoMail.bcc.length > 0);       // 根回しメールBccトグルOPENフラグ

        if (oProcParams.negoMail.to.length > 0 ||
                oNegoMailInfo.negoMailCcOpenedFlag || oNegoMailInfo.negoMailBccOpenedFlag ||
                !isBlank(oProcParams.negoMail.subject) || !isBlank(oProcParams.negoMail.text)) {
            // 情報が一つでも入力済み：根回しメールトグルをOPEN状態で表示
            oNegoMailInfo.negoMailOpenedFlag = true;

            // 宛先画面表示用処理（プラグイン情報から表示名を取得）
            result = Procedure.imw_proc_utils.getNegoMailList4Select(
                    groupId, localeId,
                    Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone(), oProcParams.negoMail);
            if (!result.resultFlag) {
                // 名称の取得エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                        "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
            }
            oNegoMailInfo.negoMailList4Select = result.data;
        }
    }

    // タイトル設定（ノード名含む）
    oCaption.titleWithNodeName = 
            oCaption.title + "&nbsp;&nbsp;" + Procedure.imw_utils.toBrowse(
            MessageManager.getMessage("IMW.CAP.0381", configSetToProcess.nodeName));

    // 印影処理
    var stampEnable = paramManager.getBooleanParameter("stamp-enabled");
    oDisplayInfo.dispStampFlag = false;
    if(stampEnable) {
        var messageInfo = {
                noStampMessageId      : "IMW.CLI.WRN.3580",
                noStampSubMessageId   : "IMW.STAMP.WRN.0008",
                noDefaultMessageId    : "IMW.CLI.WRN.3580",
                noDefaultSubMessageId : "IMW.STAMP.WRN.0009"
        }
        var stampInfo = Procedure.imw_stamp_utils.getStampInfo(
                oRequest, stampData, messageInfo, sessionInfo.clientType, false);
        if(stampInfo != null && !isBlank(stampInfo.displayInfo.dispStampFlag)) {
            oDisplayInfo.dispStampFlag = true;
            oDisplayInfo.stampId       = Procedure.imw_utils.getValue(stampInfo.displayInfo.stampId, "");
            oDisplayInfo.stampTag      = Procedure.imw_utils.getValue(stampInfo.displayInfo.stampTag, "");
            
            oDisplayInfo.dispStampTags = new Array();
            
            oDisplayInfo.dispStampTags.push({
                value : "",
                label : "　"
            });
            
            for (var key in stampInfo.displayInfo.dispStampTags) {
                oDisplayInfo.dispStampTags.push({
                    value : key,
                    label : stampInfo.displayInfo.dispStampTags[key],
                    selected : (oDisplayInfo.stampTag == key)
                });
            }
        }
    }

    // nodeIdとimui部品用idのマッピングを生成する
    oDisplayInfo.uiPartsIdMap = new Object();
    for (var i = 0; i < oDisplayInfo.dispRouteSelectInfo.length; i++) {
        var replacedNodeId = Procedure.imw_proc_utils.convertId4UiParts(oDisplayInfo.dispRouteSelectInfo[i].nodeId);
        oDisplayInfo.dispRouteSelectInfo[i].uiPartsId = replacedNodeId;
        oDisplayInfo.uiPartsIdMap[oDisplayInfo.dispRouteSelectInfo[i].nodeId] = replacedNodeId;
    }

    // 同期的な処理／非同期的な処理
    oDisplayInfo.standardExecJsspAsyncFlag = Procedure.imw_utils.getValue(paramManager.getBooleanParameter("standard-exec-jssp-async"), false);
    if (oDisplayInfo.standardExecJsspAsyncFlag) {
        if (codeUtil.getEnumCodeFlagStatus("Enable") != masterFlow.asyncProcessFlag) {
            oDisplayInfo.standardExecJsspAsyncFlag = false;
        }
    }

    // システム日で対象者を展開する／申請基準日で対象者を展開する
    oRequest.imwSysDateTargetExpandFlag = Procedure.imw_utils.getValue(execFlow.sysDateTargetExpandFlag, codeUtil.getEnumCodeFlagStatus("Disable"));

    // リクエストパラメータをJSON文字列に変換
    oRequestJSON     = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oRequest));
    // 処理パラメータをJSON文字列に変換
    oProcParamsJSON  = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oProcParams));
    // 画面表示情報オブジェクトをJSON文字列に変換
    oDisplayInfoJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDisplayInfo));
    // 根回し用画面表示情報オブジェクトをJSON文字列に変換
    oNegoMailInfoJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oNegoMailInfo));
    // 定義オブジェクトをJSON文字列に変換
    oDefineJSON      = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDefine));

    // 画面表示メッセージ取得
    var oMessage = getMessage(oDisplayInfo.processTypeList);
    
    var tmpProcessTypeList = new Array();
    for (var key in oDisplayInfo.processTypeList) {
        tmpProcessTypeList.push({
            value : key,
            label : oDisplayInfo.processTypeList[key],
            selected : (oProcParams.processType == key)
        });
    }
    oDisplayInfo.processTypeList = tmpProcessTypeList;
    
    var tmpDispAuthUserInfos = new Array();
    for (var key in oDisplayInfo.dispAuthUserInfos) {
        tmpDispAuthUserInfos.push({
            value : key,
            label : oDisplayInfo.dispAuthUserInfos[key],
            selected : (oProcParams.authUserCode == key)
        });
    }
    oDisplayInfo.dispAuthUserInfos = tmpDispAuthUserInfos;

    dialog = {
            confirmDialogMsg : oMessage.applyConfirm,
            deleteAttachFileConfirmDialogMsg : oMessage.deleteFileConfirm
    };
    
    // 画面表示メッセージオブジェクトをJSON文字列に変換
    oMessageJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oMessage));

    // ワークフローパラメータをJSON文字列に変換
    oWorkflowParamsJSON = Procedure.imw_utils.escapeHTML(URL.decode(oRequest.imwWorkflowParams));

    // 入力チェック用オブジェクトの生成
    oValidationJSON = Procedure.imw_utils.escapeHTML(getValidation(sessionInfo));

    oNotEscapeDispInfo = oDisplayInfo;

    // HTML特殊文字を変換する
    oRequest     = Procedure.imw_utils.toBrowse(oRequest);
    oProcParams  = Procedure.imw_utils.toBrowse(oProcParams);
    oDisplayInfo = Procedure.imw_utils.toBrowse(oDisplayInfo);
    
    

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

    objDef.nodeTyp_Apply        = codeUtil.getEnumCodeNodeType("nodeTyp_Apply");                // ノード種別：申請ノード
    objDef.nodeTyp_Approve      = codeUtil.getEnumCodeNodeType("nodeTyp_Approve");              // ノード種別：承認ノード
    objDef.nodeTyp_Dynamic      = codeUtil.getEnumCodeNodeType("nodeTyp_Dynamic");              // ノード種別：動的処理ノード
    objDef.nodeTyp_Confirm      = codeUtil.getEnumCodeNodeType("nodeTyp_Confirm");              // ノード種別：確認ノード
    objDef.nodeTyp_Horizontal   = codeUtil.getEnumCodeNodeType("nodeTyp_Horizontal");           // ノード種別：横配置ノード
    objDef.nodeTyp_Vertical     = codeUtil.getEnumCodeNodeType("nodeTyp_Vertical");             // ノード種別：縦配置ノード
    objDef.nodeTyp_Branch_Start = codeUtil.getEnumCodeNodeType("nodeTyp_Branch_Start");         // ノード種別：分岐開始ノード

    objDef.atmCnf_NotAddDel = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_NotAddDel");     // 添付ファイル：追加・削除不可
    objDef.atmCnf_Add       = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_Add");           // 添付ファイル：追加のみ
    objDef.atmCnf_AddDel    = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_AddDel");        // 添付ファイル：追加・削除可

    objDef.procTyp_apr      = codeUtil.getEnumCodeProcessType("procTyp_apr");                   // 処理種別：承認
    objDef.procTyp_apre     = codeUtil.getEnumCodeProcessType("procTyp_apre");                  // 処理種別：承認終了
    objDef.procTyp_sbk      = codeUtil.getEnumCodeProcessType("procTyp_sbk");                   // 処理種別：差戻し
    objDef.procTyp_deny     = codeUtil.getEnumCodeProcessType("procTyp_deny");                  // 処理種別：否認
    objDef.procTyp_rsv      = codeUtil.getEnumCodeProcessType("procTyp_rsv");                   // 処理種別：保留
    objDef.procTyp_rsvc     = codeUtil.getEnumCodeProcessType("procTyp_rsvc");                  // 処理種別：保留解除

    objDef.pageTyp_Procdetail= codeUtil.getEnumCodePageType("pageTyp_Procdetail");              // 画面種別：処理詳細

    objDef.Enable  = codeUtil.getEnumCodeFlagStatus("Enable");                                  // フラグ状態：有効
    objDef.Disable = codeUtil.getEnumCodeFlagStatus("Disable");                                 // フラグ状態：無効

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

    objCap.title             = MessageManager.getMessage("IMW.CAP.0300"); // 処理
    objCap.detail            = MessageManager.getMessage("IMW.CAP.0221"); // 詳細
    objCap.flow              = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    objCap.history           = MessageManager.getMessage("IMW.CAP.1032"); // 履歴
    objCap.processType       = MessageManager.getMessage("IMW.CAP.0165"); // 処理種別
    objCap.require           = MessageManager.getMessage("IMW.CAP.0017"); // 必須
    objCap.matterNumber      = MessageManager.getMessage("IMW.CAP.1029"); // 案件番号
    objCap.matterName        = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    objCap.applyUser         = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    objCap.applyBaseDate     = MessageManager.getMessage("IMW.CAP.0391"); // 申請基準日
    objCap.applyDate         = MessageManager.getMessage("IMW.CAP.1035"); // 申請日
    objCap.processUser       = MessageManager.getMessage("IMW.CAP.1037"); // 処理者
    objCap.authOrgz          = MessageManager.getMessage("IMW.CAP.1000"); // 担当組織
    objCap.priorityLevel     = MessageManager.getMessage("IMW.CAP.0388"); // 優先度
    objCap.comment           = MessageManager.getMessage("IMW.CAP.0318"); // コメント
    objCap.attachFile        = MessageManager.getMessage("IMW.CAP.0202"); // 添付ファイル
    objCap.fileName          = MessageManager.getMessage("IMW.CAP.1001"); // ファイル名
    objCap.size              = MessageManager.getMessage("IMW.CAP.0322"); // サイズ
    objCap.createUser        = MessageManager.getMessage("IMW.CAP.1002"); // 登録者
    objCap.createDate        = MessageManager.getMessage("IMW.CAP.1003"); // 登録日時
    objCap.cancel            = MessageManager.getMessage("IMW.CAP.0062"); // 解除
    objCap.close             = MessageManager.getMessage("IMW.CAP.0039"); // 閉じる
    objCap.flow              = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    objCap.flowSetting       = MessageManager.getMessage("IMW.CAP.1004"); // フロー設定
    objCap.edit              = MessageManager.getMessage("IMW.CAP.0006"); // 編集
    objCap.nodeName          = MessageManager.getMessage("IMW.CAP.0250"); // ノード名
    objCap.settingGuide      = MessageManager.getMessage("IMW.CAP.1005"); // 必要な設定内容
    objCap.settingStatus     = MessageManager.getMessage("IMW.CAP.1006"); // 設定状況
    objCap.routeSelect       = MessageManager.getMessage("IMW.CAP.1007"); // ルート選択
    objCap.branchNodeName    = MessageManager.getMessage("IMW.CAP.1008"); // 分岐開始ノード名
    objCap.sendBackTarget    = MessageManager.getMessage("IMW.CAP.1010"); // 差戻し先
    objCap.select            = MessageManager.getMessage("IMW.CAP.0092"); // 選択
    objCap.nodeName          = MessageManager.getMessage("IMW.CAP.0250"); // ノード名
    objCap.process           = MessageManager.getMessage("IMW.CAP.0300"); // 処理
    objCap.negoMail          = MessageManager.getMessage("IMW.CAP.1009"); // 根回し
    objCap.to                = MessageManager.getMessage("IMW.CAP.0032"); // 宛先
    objCap.cc                = MessageManager.getMessage("IMW.CAP.0033"); // CC
    objCap.bcc               = MessageManager.getMessage("IMW.CAP.0034"); // BCC
    objCap.search            = MessageManager.getMessage("IMW.CAP.0359"); // 検索
    objCap.subject           = MessageManager.getMessage("IMW.CAP.0036"); // 件名
    objCap.body              = MessageManager.getMessage("IMW.CAP.0037"); // 本文
    objCap.setAlready        = MessageManager.getMessage("IMW.CAP.1011"); // 設定済み
    objCap.msgNodeDynamic    = MessageManager.getMessage("IMW.CAP.1018"); // 処理対象者を設定してください
    objCap.msgNodeCnfm       = MessageManager.getMessage("IMW.CAP.1019"); // 確認対象者を設定してください
    objCap.msgNodeHorizontal = MessageManager.getMessage("IMW.CAP.1020"); // 複数処理を設定してください
    objCap.msgNodeVertical   = MessageManager.getMessage("IMW.CAP.1021"); // 同期処理を設定してください
    objCap.noAttach          = MessageManager.getMessage("IMW.CAP.1155"); // 所属なし
    objCap.applyInfo         = MessageManager.getMessage("IMW.CAP.1158"); // 申請情報
    objCap.stamp             = MessageManager.getMessage("IMW.STAMP.CAP.0001"); // 印影
    objCap.tag               = MessageManager.getMessage("IMW.STAMP.CAP.0006"); // 絞込みキーワード
    objCap.deleteDialogTitle = MessageManager.getMessage("IMW.CAP.1194");
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
function getMessage(processTypeList) {
    var objMsg = new Object();

    objMsg.flowSettingError    = MessageManager.getMessage("IMW.CLI.INF.3501");
    objMsg.routeSelectError    = MessageManager.getMessage("IMW.CLI.INF.3502");
    objMsg.sendBackSelectError = MessageManager.getMessage("IMW.CLI.INF.3514");
    objMsg.close               = MessageManager.getMessage("IMW.CLI.WRN.3501");
    objMsg.deleteFileConfirm   = MessageManager.getMessage("IMW.CLI.WRN.3500");
    objMsg.flowAndRouteError   = MessageManager.getMessage("IMW.CLI.INF.3528");
    objMsg.selectedStampId     = MessageManager.getMessage("IMW.STAMP.WRN.0005");


    // 処理種別に対応した確認メッセージの取得
    objMsg.processConfirm = new Object();
    for(var prop in processTypeList) {
        // 処理種別数分繰り返し
        objMsg.processConfirm[prop] = MessageManager.getMessage("IMW.CLI.INF.3000", processTypeList[prop]);
    }

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

    // 処理者
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4SelectRequireAuthUser("authUserCode", "IMW.CAP.1037");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // 担当組織
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4SelectRequireOrgz("authOrgz", "IMW.CAP.1000");
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
// ワークフロー処理画面パラメータ　エンコード処理
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】次画面へ遷移する前の処理。
//             ワークフロー処理画面パラメータはhtmlで生成したJSON文字列。
//             このパラメータをURLエンコードして次処理へ進む。
//=============================================================================
function encodeImwWorkflowParams(request) {
    request.imwWorkflowParams = URL.encode(request.imwWorkflowParams);
}

//=============================================================================
// 画面表示用処理履歴取得処理
//   【 入力 】actvMatter: 未完了案件マネージャ
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示用の処理履歴を取得して返却します。
//=============================================================================
function getDisplayHistoryMap(actvMatter) {
    var resultInfo = {
        "resultFlag": false,
        "messageId": "",
        "subMessage": "",
        "data": {}
    };
    var result;

    // 処理履歴を取得する（画面上に表示する権限者名、処理名を取得するため）
    result = actvMatter.getProcessHistoryList();
    if(!result.resultFlag) {
        // 処理履歴検索エラー
        resultInfo.messageId = "IMW.CLI.WRN.3580";
        return resultInfo;
    }
    var allProcessHistoryList = result.data;

    // 最新の処理履歴を取得する（画面上に表示する権限者名、処理名を取得するため）
    result = actvMatter.getProcessHistoryLatestList();
    if(!result.resultFlag) {
        resultInfo.messageId = "IMW.CLI.WRN.3580";
        return resultInfo;
    }
    var latestProcessHistoryList = result.data;

    // アクティブノード一覧を取得する
    result = actvMatter.getActvNodeList();
    if(!result.resultFlag) {
        resultInfo.messageId = "IMW.CLI.WRN.3580";
        return resultInfo;
    }
    var actvNodeList = result.data;

    // 画面表示用処理履歴取得
    var flowUtil = new WorkflowFlowResultUtil();
    result = flowUtil.getProcessHistoryForDisplay(
            latestProcessHistoryList, allProcessHistoryList, actvNodeList);
    if(!result.resultFlag) {
        // 表示情報取得エラー
        resultInfo.messageId = "IMW.CLI.WRN.3617";
        resultInfo.subMessage = MessageManager.getMessage("IMW.CLI.WRN.3516");
        return resultInfo;
    }
    // 表示履歴情報整形
    var objProcessHistoryLatest = new Object();
    for (var cnt=0; cnt<result.data.length; cnt++) {
        objProcessHistoryLatest[result.data[cnt].nodeId] = result.data[cnt];
    }

    resultInfo.resultFlag = true;
    resultInfo.data = objProcessHistoryLatest;
    return resultInfo;
}

//=============================================================================
// 権限代理用の担当組織取得処理
//   【 入力 】orgzInfo: 画面表示用の担当組織オブジェクト
//             executeUserCode: 処理者
//             localeId: ロケールID
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示用の処理履歴を取得して返却します。
//=============================================================================
function getAuthUserOrgzInfoAuthAct(orgzInfo, executeUserCode, localeId) {

    // 権限代理情報
    var systemDatetime = Procedure.imw_datetime_utils.getSystemDateTime();
    var originalActList = new OriginalActList(executeUserCode, localeId);
    var prop;
    var len;
    var i;
    var j;
    var result;
    var codeUtil = new WorkflowCodeUtil();
    var enableStatus = codeUtil.getEnumCodeFlagStatus("Enable")

    // 処理者は複数存在
    for (prop in orgzInfo.dispAuthUserInfos) {

        // 本人の場合は変更しない
        if (prop == executeUserCode) {
            continue;
        }

        // 権限代理先設定情報の取得処理
        var searchCondition = new ListSearchConditionNoMatterProperty();
        searchCondition.addCondition(OriginalActList.ORIGINAL_ACT_USER_CODE, prop, ListSearchCondition.OP_EQ);
        searchCondition.addCondition(OriginalActList.APPROVE_AUTH, enableStatus, ListSearchCondition.OP_EQ);
        searchCondition.addCondition(OriginalActList.START_DATE, systemDatetime, ListSearchCondition.OP_LE);
        searchCondition.addCondition(OriginalActList.LIMIT_DATE, systemDatetime, ListSearchCondition.OP_GE);
        result = originalActList.getAuthList(searchCondition);
        if (!result.resultFlag || result.data.length == 0) {
            return;
        }
        var authList = result.data;
        var tmpAuthList = [];
        for (i=0; i<authList.length; i++) {
            var originalActTargetType = authList[i].originalActTargetType;
            var originalActTargetCode = authList[i].originalActTargetCode;
            var tmp = null;
            if (originalActTargetType == "department") {
                tmp = originalActTargetCode.split("^");
            } else if (originalActTargetType == "department_and_post") {
                tmp = originalActTargetCode.split("|")[0].split("^");
            }
            if (tmp != null) {
                var hasEqualData = false;
                for (j=0; j<tmpAuthList.length; j++) {
                    if (tmpAuthList[j].companyCode == tmp[0] && tmpAuthList[j].orgzSetCode == tmp[1] && tmpAuthList[j].orgzCode == tmp[2] ) {
                        hasEqualData = true;
                        break;
                    }
                }
                if (!hasEqualData) {
                    tmpAuthList[tmpAuthList.length] = {
                            companyCode : tmp[0],
                            orgzSetCode : tmp[1],
                            orgzCode : tmp[2]
                    };
                }
            }
        }
        if (tmpAuthList.length == 0) {
            continue;
        }

        // 権限代理先設定に組織が存在する場合、担当組織を絞り込む
        var dispAuthOrgzInfos = orgzInfo.dispAuthOrgzInfos[prop];
        var actAuthFlag = false;
        for (i=0; i<dispAuthOrgzInfos.length; i++) {
            for (j=0; j<tmpAuthList.length; j++) {
                if (dispAuthOrgzInfos[i].companyCode == tmpAuthList[j].companyCode &&
                        dispAuthOrgzInfos[i].orgzSetCode == tmpAuthList[j].orgzSetCode &&
                        dispAuthOrgzInfos[i].orgzCode == tmpAuthList[j].orgzCode) {
                    dispAuthOrgzInfos[i].actAuth = true;
                    actAuthFlag = true;
                }
            }
        }
        if (actAuthFlag == false) {
            continue;
        }
        len = dispAuthOrgzInfos.length;
        for (i = len -1; i>=0; i--) {
            if (dispAuthOrgzInfos[i].actAuth === true) {
                delete dispAuthOrgzInfos[i].actAuth;
            } else {
                dispAuthOrgzInfos.splice(i, 1);
            }
        }
    }
}

//=============================================================================
// 右上組織に対する担当組織の初期値設定処理
//   【 入力 】orgzInfo: 画面表示用の担当組織オブジェクト
//             executeUserCode: 処理者
//             callType: 呼び出しフラグ(0:初期表示)
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】右上組織で選択された組織を担当組織の初期値として設定します。
//             処理権限者の場合のみ初期値を設定します。
//=============================================================================
function setDefaultDepartmentInCharge(orgzInfo, executeUserCode, callType) {

    // 初期表示以外の場合は何もしない
    if (callType != "0") {
        return;
    }

    for (var userCd in orgzInfo.dispAuthOrgzInfos) {
        if (userCd != executeUserCode) {
            continue;
        }
        var dispAuthOrgzInfos = orgzInfo.dispAuthOrgzInfos[userCd];
        if (dispAuthOrgzInfos.length == 1) {
            break;
        }

        var currentDepartmentKeys = null;
        var _d = Contexts.getUserContext().currentDepartment;
        if (_d != null) {
            currentDepartmentKeys = _d.companyCd + separator + _d.departmentSetCd + separator + _d.departmentCd;
        }
        var i;
        var currentDepartmentContain = false;
        for (i = 0; i < dispAuthOrgzInfos.length; i++) {
            if (currentDepartmentKeys == dispAuthOrgzInfos[i].comboKey) {
                oProcParams.authOrgz = currentDepartmentKeys;
                oProcParams.authCompanyCode = _d.companyCd;
                oProcParams.authOrgzSetCode = _d.departmentSetCd;
                oProcParams.authOrgzCode = _d.departmentCd;
                break;
            }
        }
    }
}


//=============================================================================
// パラメータよりノードを設定
//=============================================================================
function setNodeRoute(param,displayInfo,procParams,reqParam) {	
    
	// セッション情報
    var sessionInfo = Contexts.getAccountContext();
    //var groupId = sessionInfo.loginGroupId;
    //var userCode = sessionInfo.userCd;
    var localeId = sessionInfo.locale;

	
	var imwSystemMatterId= procParams.systemMatterId;
	var imwNodeId = procParams.nodeId;
	//var localeId= 'ja';
	//var imwCallType = '0';
	var imwCallType = reqParam.imwCallType;
	
	
    // 処理マネージャの生成
    var processManager = new ProcessManager(localeId,
            imwSystemMatterId,imwNodeId);

    //var result = processManager.getConfigSetToProcessWithProcessTarget(); //ノード情報取得(設定値引き継ぎ)
    var result = processManager.getConfigSetToProcess(); //ノード情報取得
    
        if (!result.resultFlag) {
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
        }
     var configSetToProcess = result.data;
     
    // 再申請等で過去に設定されていたらノードを初期化するーーーー
    //var confignode = configSetToProcess.configVerticalNodes;
    //var confignode = configSetToProcess.configDynamicNodes; //動的承認ノードの取得
    //confignode[0].expandedNodes = new Array();

    //Debug.console("!------configSetToProcess------------------");
    //Debug.console(param);
    //Debug.console(displayInfo);
    //Debug.console(procParams);
    //Debug.console("!------configSetToProcess------------------");
    


    // 案件(未完了)マネージャの生成
    var actvMatter = new ActvMatter(localeId, imwSystemMatterId);


    // 実行中フロー情報の取得
    result = actvMatter.getExecFlow();
    if (!result.resultFlag || result.data == null) {
        // 検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    var execFlow = result.data;
    
    
    // 案件情報(マスタフロー)を取得する
    result = actvMatter.getMasterFlow();
    if(!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3580", "", CALLBACK_FUNCTION);
    }
    var masterFlow = result.data;
    
    
    // 動的処理対象自動設定情報
    var imwNodeSetting = null;
    if (!isBlank(param)) {
        var logger = Logger.getLogger();
        try {
            if (logger.isDebugEnabled()) {
                logger.debug("imwNodeSetting : {}", param);
            }
            imwNodeSetting = ImJson.parseJSON(param);
        } catch (e) {
            if (logger.isWarnEnabled ()) {
                logger.warn(MessageManager.getLocaleMessage(
                    localeId, "IMW.CLI.WRN.3673") + " : {}", param);
            }
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3673", "", CALLBACK_FUNCTION);
        }
    }
    
    if (!isBlank(imwNodeSetting) && (imwNodeSetting !== {})) {
        // 対象ノードで処理対象者設定対象となっているノード情報を取得します。
        // 対象ノードでルート選択対象となっている分岐開始ノード情報を取得します。
        result = Procedure.imw_proc_utils.getNodeDispAndProcInfoNodeSetting(
                displayInfo, procParams, configSetToProcess,
                imwCallType, masterFlow, execFlow, imwNodeSetting);

    } else {
        // 対象ノードで処理対象者設定対象となっているノード情報を取得します。
        // 対象ノードでルート選択対象となっている分岐開始ノード情報を取得します。
        result = Procedure.imw_proc_utils.getNodeDispAndProcInfo(
                displayInfo, procParams, configSetToProcess,
                imwCallType, masterFlow, execFlow);
    }
    //Debug.console("!------ノード設定終了------------------");
       	 
    return procParams;

}
