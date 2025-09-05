Constant.load("lo/common_libs/lo_const");
var oRequest            = new Object();     // リクエスト情報オブジェクト
var oRequestJSON        = "";               // リクエスト情報オブジェクト(JSON文字列)
var oDisplayInfo        = new Object();     // 画面表示情報オブジェクト
var oDisplayInfoJSON    = "";               // 画面表示情報オブジェクト(JSON文字列)
var oNegoMailInfo       = new Object();     // 根回し用画面表示情報オブジェクト
var oNegoMailInfoJSON   = "";               // 根回し用画面表示情報オブジェクト(JSON文字列)
var oNotEscapeDispInfo  = new Object();     // HTMLエスケープをしない画面表示情報オブジェクト
var oProcParams         = null;             // 処理情報オブジェクト
var oProcParamsJSON     = "";               // 処理情報オブジェクト(JSON文字列)
var oCaption            = new Object();     // 画面表示文言オブジェクト
var oMessageJSON        = "";               // 画面表示メッセージオブジェクト(JSON文字列)
var oDefine             = new Object();     // 定義情報オブジェクト
var oDefineJSON         = "";               // 定義情報オブジェクト(JSON文字列)
var oValidationJSON     = "";               // 入力チェック用オブジェクト(JSON文字列)
var oWorkflowParamsJSON = "";               // ワークフローパラメータ(JSON文字列)
var dialog = new Object();

var fileUploadURL   = "im_workflow/common/unit/file/file_upload";
var fileDownloadURL = "im_workflow/common/unit/file/file_download_proc";

var separator = "^";
var nodeSeparator = "~";

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

var oUserParams       = new Object();    // ユーザ入力確認情報オブジェクト add lo_system
var oUserParamsJSON       = "";    // ユーザ入力確認情報(JSON文字列) add lo_system

//=============================================================================
// 再申請画面　初期化関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】再申請画面を表示します。
//=============================================================================
function init(request){
	
	// add lo_system ユーザー入力パラメータ取得
	oUserParamsJSON   = request.imwUserParamsJSON;
	oUserParams       = ImJson.parseJSON(request.imwUserParamsJSON);


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

    // 汎用ローカル変数
    var result;
    var cnt;

    // リクエストパラメータ取得
    oRequest.imwGroupId             = groupId;
    oRequest.imwUserCode            = userCode;
    oRequest.imwAuthUserCode        = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");
    oRequest.imwSystemMatterId      = Procedure.imw_utils.getValue(request.imwSystemMatterId, "");
    oRequest.imwNodeId              = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwPageType            = Procedure.imw_utils.getValue(request.imwPageType, "");
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
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    if(!result.data) {
        // 処理不可
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584", MessageManager.getMessage("IMW.CLI.WRN.3507"),
                CALLBACK_FUNCTION);
    }

    // 案件(未完了)マネージャの生成
    var actvMatter = new ActvMatter(localeId, oRequest.imwSystemMatterId);
    // 案件情報を取得する
    result = actvMatter.getMatter();
    if(!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    if(isBlank(result.data)) {
        // 案件情報が存在しない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584",
                MessageManager.getMessage("IMW.CLI.WRN.3513", oRequest.imwSystemMatterId),
                CALLBACK_FUNCTION);
    }
    var actvMatterData = result.data;

    // 案件情報(マスタフロー)を取得する
    result = actvMatter.getMasterFlow();
    if(!result.resultFlag) {
        // 案件情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    var masterFlow = result.data;

    // 案件(未完了)ノードマネージャの生成
    var actvMatterNode = new ActvMatterNode(localeId, oRequest.imwSystemMatterId);
    var stampData = null;

    var configSetToProcess;
    if (oRequest.imwCallType == "1" || !isBlank(oRequest.imwWorkflowParams)) {
        // 【再表示】
        // oRequest.imwCallTypeのみで判定しない理由：
        //  ユーザコンテンツ内での画面遷移でimwWorkflowParamsを引き回したケースに対応するため
        do {
            // リクエストパラメータから再申請用情報を取得
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
                // ・再申請パラメータがない
                // ・キーとなるシステム案件ID・ノードIDのいずれかが
                // リクエストパラメータと入力済み情報とで食い違っている
                break;
            }
            // 画面種別が再申請画面のパラメータあり＝パラメータの引き継ぎ実施
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
            // ユーザコンテンツから受け渡された初期表示情報の設定
            if (request.imwForcedParamFlag == oDefine.Enable) {
                // 強制パラメータフラグがONの場合
                // 案件名
                oProcParams.matterName = isUndefined(request.imwMatterName) ?
                        oProcParams.matterName : request.imwMatterName;
                // コメント
                oProcParams.processComment = isUndefined(request.imwComment) ?
                        oProcParams.processComment : request.imwComment;
            }
        } while (false);
    }
    if (isBlank(oProcParams)) {
        // 【初回表示】
        oRequest.imwCallType = "0";
        oRequest.imwFlowId = Procedure.imw_utils.getValue(actvMatterData.flowId, "");   // フローID

        // 再申請処理オブジェクトの初期化
        oProcParams = new Object();
        oProcParams.systemMatterId       = oRequest.imwSystemMatterId;      // システム案件ID
        oProcParams.nodeId               = oRequest.imwNodeId;              // ノードID
        oProcParams.processType          = "";                              // 処理種別

        oProcParams.matterName           = actvMatterData.matterName;       // 案件名
        oProcParams.matterNameOriginal   = actvMatterData.matterName;       // 案件名（変更前：処理種別"取止め"時の案件名表示用）
        oProcParams.matterNumber         = actvMatterData.matterNumber;     // 案件番号

        oProcParams.applyExecuteUserCode = oRequest.imwUserCode;            // 実行者コード
        oProcParams.applyAuthUserCode    = oRequest.imwAuthUserCode;        // 権限者コード
        oProcParams.applyAuthOrgz        = "";                              // 権限者組織情報値
        oProcParams.applyAuthCompanyCode = "";                              // 権限者会社コード
        oProcParams.applyAuthOrgzSetCode = "";                              // 権限者組織セットコード
        oProcParams.applyAuthOrgzCode    = "";                              // 権限者組織コード
        oProcParams.priorityLevel        = actvMatterData.priorityLevel;    // 優先度(通常)
        oProcParams.processComment       = "";                              // 処理コメント

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

        // 申請権限者コードのチェック
        if(isBlank(oProcParams.applyAuthUserCode)) {
            // 実行者＝権限者
            oProcParams.applyAuthUserCode = oRequest.imwUserCode;
        }

        oProcParams.attachFile           = new Array();         // 添付ファイル

        // 新たな添付ファイル一時領域ディレクトリを作成
        result = attachFileManager.createTempDirKey();
        if(!result.resultFlag) {
            // 作成失敗
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
        }
        oProcParams.tempDirKey = result.data;   // 添付ファイル一時領域ディレクトリキー

        // 対象申請ノードの履歴情報を取得(担当組織を初期表示するため)
        result = actvMatterNode.getProcessHistoryList(oProcParams.nodeId);
        if(!result.resultFlag) {
            // 検索失敗
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
        }
        var tmpHist;
        for (cnt = result.data.length - 1; cnt >= 0; cnt--) {
            tmpHist = result.data[cnt];
            if (tmpHist.processType == oDefine.procTyp_apy ||
                    tmpHist.processType == oDefine.procTyp_rapy) {
                // 履歴の新しい方から比較し、処理が[申請][再申請]のいずれかの場合
                oProcParams.applyAuthOrgz =
                        (isBlank(tmpHist.authCompanyCode) ? "" : tmpHist.authCompanyCode) +
                        separator +
                        (isBlank(tmpHist.authOrgzSetCode) ? "" : tmpHist.authOrgzSetCode) +
                        separator +
                        (isBlank(tmpHist.authOrgzCode) ? "" : tmpHist.authOrgzCode);
                break;
            }
        }

        // 処理対象ノードでの設定情報を取得（処理対象者情報必要）
        result = processManager.getConfigSetToProcessWithProcessTarget();
        if (!result.resultFlag) {
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
        }
        configSetToProcess = result.data;
        oProcParams.configSet = configSetToProcess;
    }

    // add lo_system start
    // デフォルトの処理種別の設定
    if (oUserParams.item_status_cd == Constant.LO_STATUS_JITAI) {
    	oProcParams.processType = oDefine.procTyp_dct;
    }
    // add lo_system end

    // ユーザコンテンツから受け渡された初期表示情報の設定
    if (request.imwForcedParamFlag == oDefine.Enable) {
        // 強制パラメータフラグがONの場合
        // 案件名
        oProcParams.matterName = isUndefined(request.imwMatterName) ?
                oProcParams.matterName : request.imwMatterName;
        // コメント
        oProcParams.processComment = isUndefined(request.imwComment) ?
                oProcParams.processComment : request.imwComment;
    }

    // 画面表示情報オブジェクトの初期化
    oDisplayInfo.dispAttachFileFlag    = false;     // 添付ファイル表示フラグ
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
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    // 画面表示用にオブジェクトの生成
    var tmpFileObj;
    oDisplayInfo.attachFile = new Array();
    if (result.data.length > 0) {

        // 添付ファイルのパスを取得する
        var procResult = Procedure.imw_proc_utils.getActvMatterTranFileDirPath(
                oProcParams.systemMatterId);
        if (procResult.error || procResult.countRow == 0) {
            // 案件情報取得エラー
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3584",
                    MessageManager.getMessage("IMW.CLI.WRN.3513", oProcParams.systemMatterId),
                    CALLBACK_FUNCTION);
        }
        var fileDirPath = procResult.data;

        for (cnt = 0; cnt < result.data.length; cnt++) {
            // 登録済みの添付ファイル数分繰り返し

            if (Procedure.imw_proc_utils.indexOf4Array(
                    result.data[cnt].systemFileName,
                    oProcParams.systemFileNameForDelete) == -1) {
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
    oDisplayInfo.attachFileOpenedFlag = (oProcParams.attachFile.length > 0 ||
            oDisplayInfo.attachFile.length > 0);// 添付ファイルトグルOPENフラグ

    // 対象ノードで実施可能な処理種別を取得します。
    var nodeProcessList = configSetToProcess.nodeProcessTypes;
    if (isBlank(nodeProcessList) || nodeProcessList.length == 0) {
        // 実行可能な処理種別がない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3632", "", CALLBACK_FUNCTION);
    }

    // 画面表示オブジェクトに設定
    oDisplayInfo.processTypeList = new Array();
    for(cnt=0; cnt<nodeProcessList.length; cnt++) {

        // 処理種別で判定
        switch (nodeProcessList[cnt].nodeProcess) {

            // 処理種別：再申請
            case oDefine.procTyp_rapy:
            // 処理種別：取止め
            case oDefine.procTyp_dct:

                // 画面表示用に処理種別を設定
                oDisplayInfo.processTypeList.push({
                       value : nodeProcessList[cnt].nodeProcess,
                       label :  nodeProcessList[cnt].nodeProcessName,
                       selected : (oProcParams.processType == nodeProcessList[cnt].nodeProcess)
                });
                break;

            default :
                // 上記以外の処理種別の場合：画面に表示しないため割愛
                break;
        }
    }
    oDisplayInfo.processTypeList = oDisplayInfo.processTypeList;
    
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
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    var execFlow = result.data;

    // 動的処理対象設定情報
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
    if(!result.resultFlag) {
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }

    // 案件情報の作成 (案件情報を取得済みのため共通処理ではなく手動で取得)
    var matterInfo = new Object();
    matterInfo.systemMatterId = oProcParams.systemMatterId;
    matterInfo.userDataId = actvMatterData.userDataId;
    matterInfo.contentsId = configSetToProcess.contentsId;
    matterInfo.contentsVersionId = configSetToProcess.contentsVersionId;
    matterInfo.routeId = configSetToProcess.routeId;
    matterInfo.routeVersionId = configSetToProcess.routeVersionId;
    matterInfo.flowId = configSetToProcess.flowId;
    matterInfo.flowVersionId = configSetToProcess.flowVersionId;
    matterInfo.nodeId = oProcParams.nodeId;

    // 処理者リスト・担当組織リストの取得
    result = Procedure.imw_proc_utils.getUserAndOrgzList4Display(
            processManager, oRequest.imwUserCode, separator);
    if (!result.resultFlag) {
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
    }
    oDisplayInfo.dispAuthUserInfos = new Array();
    
    for (var key in result.dispAuthUserInfos) {
        oDisplayInfo.dispAuthUserInfos.push({
            value : key,
            label : result.dispAuthUserInfos[key]
        });
    }
    // 担当組織コンボ初期値設定
    setDefaultDepartmentInCharge(result, oRequest.imwUserCode, oRequest.imwCallType);

    oDisplayInfo.dispAuthOrgzInfos = result.dispAuthOrgzInfos;
    oDisplayInfo.strAuthUserBlank = result.strAuthUserBlank;

    // 優先度コンボの生成
    result = codeUtil.getPriorityLevel();
    if (result.resultFlag) {
        // 優先度定義取得成功
        var priorityCombo = new Array();
        for(cnt=0; cnt<result.data.length; cnt++) {
            priorityCombo.push({
                value : result.data[cnt].code,
                label : MessageManager.getMessage(result.data[cnt].messageId),
                selected : (oProcParams.priorityLevel == result.data[cnt].code)
            });
        }
        oDisplayInfo.priorityCombo = priorityCombo;
    }


    // 根回しメール可否判定
    var paramManager = new WorkflowParameterManager();
    oNegoMailInfo.dispNegoMailFlag      = paramManager.getIntegerParameter("notice-type") != 0 && paramManager.getBooleanParameter("negotiate-type");
    oNegoMailInfo.dispNegoOnlyImboxFlag = paramManager.getIntegerParameter("notice-type") == 3 && oNegoMailInfo.dispNegoMailFlag;

    if (oNegoMailInfo.dispNegoMailFlag) {
        // 根回しメール画面表示情報オブジェクトの初期化
        oNegoMailInfo.negoMailOpenedFlag        = false;                                     // 根回しメールトグルOPENフラグ
        oNegoMailInfo.negoMailCcOpenedFlag      = (oProcParams.negoMail.cc.length>0);        // 根回しメールCcトグルOPENフラグ
        oNegoMailInfo.negoMailBccOpenedFlag     = (oProcParams.negoMail.bcc.length>0);       // 根回しメールBccトグルOPENフラグ

        if(oProcParams.negoMail.to.length > 0 ||
                oNegoMailInfo.negoMailCcOpenedFlag || oNegoMailInfo.negoMailBccOpenedFlag ||
                !isBlank(oProcParams.negoMail.subject) || !isBlank(oProcParams.negoMail.text)) {
            // 情報が一つでも入力済み：根回しメールトグルをOPEN状態で表示
            oNegoMailInfo.negoMailOpenedFlag = true;

            // 宛先画面表示用処理（プラグイン情報から表示名を取得）
            result = Procedure.imw_proc_utils.getNegoMailList4Select(
                    groupId, localeId,
                    Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone(), oProcParams.negoMail );
            if(!result.resultFlag) {
                // 名称の取得エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                        "IMW.CLI.WRN.3584", "", CALLBACK_FUNCTION);
            }
            oNegoMailInfo.negoMailList4Select = result.data;
        }
    }

    // 印影処理
    var stampEnable = paramManager.getBooleanParameter("stamp-enabled");
    oDisplayInfo.dispStampFlag = false;
    if(stampEnable) {
        var messageInfo = {
                noStampMessageId      : "IMW.CLI.WRN.3584",
                noStampSubMessageId   : "IMW.STAMP.WRN.0008",
                noDefaultMessageId    : "IMW.CLI.WRN.3584",
                noDefaultSubMessageId : "IMW.STAMP.WRN.0009"
        }
        var stampInfo = Procedure.imw_stamp_utils.getStampInfo(
                oRequest, stampData, messageInfo, sessionInfo.clientType, false);
        if(stampInfo != null && !isBlank(stampInfo.displayInfo.dispStampFlag)) {
            oDisplayInfo.dispStampFlag = true;
            oDisplayInfo.stampId       = stampInfo.displayInfo.stampId;
            oDisplayInfo.stampTag      = stampInfo.displayInfo.stampTag;
            
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
    
    // タイトル設定（ノード名含む）
    oCaption.titleWithNodeName = 
            oCaption.title + "&nbsp;&nbsp;" + Procedure.imw_utils.toBrowse(
            MessageManager.getMessage("IMW.CAP.0381", configSetToProcess.nodeName));

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
    // 画面表示メッセージオブジェクトをJSON文字列に変換
    oMessageJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oMessage));

    dialog = {
            confirmDialogMsg : oMessage.applyConfirm,
            deleteAttachFileConfirmDialogMsg : oMessage.deleteFileConfirm
    };
    
    // ワークフローパラメータをJSON文字列に変換
    oWorkflowParamsJSON = Procedure.imw_utils.escapeHTML(URL.decode(oRequest.imwWorkflowParams));

    // 入力チェック用オブジェクトの生成
    oValidationJSON = Procedure.imw_utils.escapeHTML(getValidation(sessionInfo));

    oNotEscapeDispInfo = oDisplayInfo;
    oNotEscapeDispInfo.matterName = oProcParams.matterName;

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

    objDef.procTyp_apy      = codeUtil.getEnumCodeProcessType("procTyp_apy");                   // 処理種別：申請
    objDef.procTyp_rapy     = codeUtil.getEnumCodeProcessType("procTyp_rapy");                  // 処理種別：再申請
    objDef.procTyp_dct      = codeUtil.getEnumCodeProcessType("procTyp_dct");                   // 処理種別：取止め

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

    objCap.detail            = MessageManager.getMessage("IMW.CAP.0221"); // 詳細
    objCap.flow              = MessageManager.getMessage("IMW.CAP.0079"); // フロー
    objCap.history           = MessageManager.getMessage("IMW.CAP.1032"); // 履歴
    objCap.processType       = MessageManager.getMessage("IMW.CAP.0165"); // 処理種別
    objCap.title             = MessageManager.getMessage("IMW.CAP.0455"); // 再申請
    objCap.require           = MessageManager.getMessage("IMW.CAP.0017"); // 必須
    objCap.matterNumber      = MessageManager.getMessage("IMW.CAP.1029"); // 案件番号
    objCap.matterName        = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    objCap.applyUser         = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    objCap.applyAuthOrgz     = MessageManager.getMessage("IMW.CAP.1000"); // 担当組織
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
    objMsg.close               = MessageManager.getMessage("IMW.CLI.WRN.3501");
    objMsg.deleteFileConfirm   = MessageManager.getMessage("IMW.CLI.WRN.3500");
    objMsg.flowAndRouteError   = MessageManager.getMessage("IMW.CLI.INF.3528");
    objMsg.selectedStampId     = MessageManager.getMessage("IMW.STAMP.WRN.0005");

    // 処理種別に対応した確認メッセージの取得
    objMsg.processConfirm = new Object();
    
    for (var idx = 0; idx < processTypeList.length; idx++) {
        objMsg.processConfirm[processTypeList[idx].value] = MessageManager.getMessage("IMW.CLI.INF.3000", processTypeList[idx].label);
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

    // 案件名
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4InputRequireMatterName("matterName", "IMW.CAP.0389");
    Procedure.imw_validate_utils.setParameterFromSettings(loginGroupId, objValidateParameter, "matter-name");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // 担当組織
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4SelectRequireOrgz("applyAuthOrgz", "IMW.CAP.1000");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // コメント
    objValidateParameter = Procedure.imw_validate_utils.makeParameter4Comment("processComment", "IMW.CAP.0318");
    Procedure.imw_validate_utils.setParameterFromSettings(loginGroupId, objValidateParameter, "proc-comment");
    Procedure.imw_validate_utils.makeValidateMessage(objValidation, localeObj, objValidateParameter);

    // 入力チェックcsjsの引数として有効な形式に変換
    var objValidateMsg = new Object();
    for(var cnt = 0; cnt < objValidation.messageList.length; cnt++) {
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

    var cnt=0;
    for (var userCd in orgzInfo.dispAuthOrgzInfos) {
        cnt++;
    }
    if (cnt <= 1) {
        return;
    }

    oProcParams.applyAuthOrgz = "";
    oProcParams.applyAuthCompanyCode = "";
    oProcParams.applyAuthOrgzSetCode = "";
    oProcParams.applyAuthOrgzCode = "";
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
                oProcParams.applyAuthOrgz = currentDepartmentKeys;
                oProcParams.applyAuthCompanyCode = _d.companyCd;
                oProcParams.applyAuthOrgzSetCode = _d.departmentSetCd;
                oProcParams.applyAuthOrgzCode = _d.departmentCd;
                break;
            }
        }
    }
}
