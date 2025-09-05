var oRequest           = new Object();    // リクエスト情報オブジェクト
var oDisplayInfo       = new Object();    // 画面表示情報オブジェクト
var oDisplayInfoJSON   = "";              // 画面表示情報オブジェクト(JSON文字列)
var oNegoMailInfo      = new Object();    // 根回し用画面表示情報オブジェクト
var oNegoMailInfoJSON  = "";              // 根回し用画面表示情報オブジェクト(JSON文字列)
var oNotEscapeDispInfo = new Object();    // HTMLエスケープをしない画面表示情報オブジェクト
var oApplyParams       = null;            // 申請情報オブジェクト
var oApplyParamsJSON   = "";              // 申請情報オブジェクト(JSON文字列)
var oCaption           = new Object();    // 画面表示文言オブジェクト
var oMessageJSON       = "";              // 画面表示メッセージオブジェクト(JSON文字列)
var oDefine            = new Object();    // 定義情報オブジェクト
var oDefineJSON        = "";              // 定義情報オブジェクト(JSON文字列)
var oValidationJSON    = "";              // 入力チェック用オブジェクト(JSON文字列)
var oWorkflowParamsJSON= "";              // ワークフローパラメータ(JSON文字列)

var fileUploadURL   = "im_workflow/common/unit/file/file_upload";
var fileDownloadURL = "im_workflow/common/unit/file/file_download_proc";

var separator = "^";
var nodeSeparator = "~";

//当画面を表示する前提となるクライアントタイプ
var IMW_CLIENT_TYPE = "pc";

var oUserParams       = new Object();    // ユーザ入力確認情報オブジェクト add lo_system
var oUserParamsJSON       = "";    // ユーザ入力確認情報(JSON文字列) add lo_system

//=============================================================================
// 申請画面　初期化関数
//   【 入力 】request: ＵＲＬ引数取得オブジェクト
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】申請画面を表示します。
//=============================================================================
function init(request) {
	//Logger.getLogger().info(' [init]　start' + ImJson.toJSONString($pullBackObj,true));
	// add lo_system ユーザー入力パラメータ取得
	oUserParamsJSON   = request.imwUserParamsJSON;
	Logger.getLogger().info(' [init]　start' + request.imwUserParamsJSON);
	oUserParams       = ImJson.parseJSON(request.imwUserParamsJSON);

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
    oDefine = getDefineValues(codeUtil);

    // 画面表示キャプション取得
    oCaption = getCaption();

    // 入力チェック用オブジェクトの生成
    oValidationJSON = Procedure.imw_utils.escapeHTML(getValidation(sessionInfo));

    // 汎用ローカル変数
    var result;
    var cnt;
    var index;
    var leng;

    // リクエストパラメータ取得
    oRequest.imwGroupId              = groupId;
    oRequest.imwUserCode             = userCode;
    oRequest.imwAuthUserCode         = Procedure.imw_utils.getValue(request.imwAuthUserCode, "");
    oRequest.imwUserDataId           = Procedure.imw_utils.getValue(request.imwUserDataId, "");
    oRequest.imwNodeId               = Procedure.imw_utils.getValue(request.imwNodeId, "");
    oRequest.imwApplyBaseDate        = Procedure.imw_utils.getValue(request.imwApplyBaseDate, "");
    oRequest.imwFlowId               = Procedure.imw_utils.getValue(request.imwFlowId, "");
    oRequest.imwPageType             = Procedure.imw_utils.getValue(request.imwPageType, "");
    oRequest.imwCallType             = Procedure.imw_utils.getValue(request.imwCallType, "0");
    oRequest.imwWorkflowParams       = Procedure.imw_utils.getValue(request.imwWorkflowParams, "");

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

    // 申請マネージャ生成
    var applyManager = new ApplyManager(groupId, localeId);
    var configSetToApply;
    var stampData = null;
    if (oRequest.imwCallType == "1" || !isBlank(oRequest.imwWorkflowParams)) {
        // 【再表示】
        // oRequest.imwCallTypeのみで判定しない理由：
        //  ユーザコンテンツ内での画面遷移でimwWorkflowParamsを引き回したケースに対応するため
        do {
            // リクエストパラメータから申請用情報を取得
            var wfParams = ImJson.parseJSON(URL.decode(oRequest.imwWorkflowParams));
            if (!isObject(wfParams)) {
                // ワークフローパラメータパラメータがない：初回表示へ
                break;
            }
            stampData = wfParams.stampData;
            wfParams = wfParams[oRequest.imwPageType];
            if (!isObject(wfParams) ||
                    wfParams.flowId != oRequest.imwFlowId ||
                    wfParams.applyNodeId != oRequest.imwNodeId ||
                    wfParams.applyBaseDate != oRequest.imwApplyBaseDate ||
                    wfParams.userDataId != oRequest.imwUserDataId) {
                // 次の条件を満たす場合、初回表示処理へ
                // ・申請パラメータがない
                // ・キーとなるフローID・ノードID・申請基準日・ユーザデータIDのいずれかが
                // リクエストパラメータと入力済み情報とで食い違っている
                break;
            }
            // 画面種別が申請画面のパラメータあり＝パラメータの引き継ぎ実施
            oApplyParams = wfParams;
            oRequest.imwCallType = "1";
            // ただし、権限者はリクエストパラメータから引き継ぎ(存在する場合)
            if (!isBlank(oRequest.imwAuthUserCode)) {
                oApplyParams.applyAuthUserCode = oRequest.imwAuthUserCode; // 申請権限者コード
            }

            if(!isBlank(oApplyParams.attachFile)) {
                // 添付ファイルサイズのカンマ付加
                for(cnt=0; cnt<oApplyParams.attachFile.length; cnt++) {
                    oApplyParams.attachFile[cnt].fileSize = 
                            Format.toMoney(parseInt(oApplyParams.attachFile[cnt].fileSize.replace(/,/g, "")));
                }
            }
            // 設定情報も引き継ぎ
            configSetToApply = oApplyParams.configSet;

            // ユーザコンテンツから受け渡された初期表示情報の設定
            var tempSavedFlag = false;  // 一時保存済フラグ
            if (!isBlank(oApplyParams.userDataId)) {
                // 一時保存情報の読み込み
                var tempSave = new TempSaveMatter(groupId, localeId);
                result = tempSave.getTempSaveMatter(oApplyParams.userDataId);
                if (!result.resultFlag) {
                    // 一時保存情報検索エラー
                    Procedure.imw_error_utils.showErrorGreyboxClose(
                            "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
                }
                tempSavedFlag = !isBlank(result.data);
            }
            if (!tempSavedFlag || request.imwForcedParamFlag == oDefine.Enable) {
                // 新規申請、または強制パラメータフラグがONの場合
                // 案件名
                oApplyParams.matterName = isUndefined(request.imwMatterName) ?
                        oApplyParams.matterName : request.imwMatterName;
                // コメント
                oApplyParams.processComment = isUndefined(request.imwComment) ?
                        oApplyParams.processComment : request.imwComment;
            }

        } while (false);
    }

    if (isBlank(oApplyParams)) {
        // 【初回表示】
        // oRequest.imwCallTypeで判定しない理由：
        //  一時保存でエラー→ユーザコンテンツ→申請画面の遷移の場合も
        //  oRequest.imwCallType=1で到達するため、oApplyParamsの有無で判定する。

        oApplyParams = new Object();
        oRequest.imwCallType = "0";

        // 画面種別を申請用情報に設定
        oApplyParams.pageType = oDefine.pageTyp_App;

        // 申請情報オブジェクトの初期化
        oApplyParams.flowId               = oRequest.imwFlowId;         // フローID
        oApplyParams.applyBaseDate        = oRequest.imwApplyBaseDate;  // 申請基準日
        oApplyParams.applyExecuteUserCode = oRequest.imwUserCode;       // 申請実行者コード
        oApplyParams.applyAuthUserCode    = oRequest.imwAuthUserCode;   // 申請権限者コード
        oApplyParams.userDataId           = oRequest.imwUserDataId;     // ユーザデータID

        oApplyParams.matterName           = ""; // 案件名
        oApplyParams.applyAuthOrgz        = ""; // 権限者組織情報値
        oApplyParams.applyAuthCompanyCode = ""; // 権限者会社コード
        oApplyParams.applyAuthOrgzSetCode = ""; // 権限者組織セットコード
        oApplyParams.applyAuthOrgzCode    = ""; // 権限者組織コード
        oApplyParams.priorityLevel        = oDefine.priorityLevel_Normal; // 優先度(通常)
        oApplyParams.processComment       = ""; // 処理コメント

        oApplyParams.attachFile           = new Array();    // 添付ファイル
        oApplyParams.DCNodeConfigModels   = new Array();    // 動的・確認ノード設定配列
        oApplyParams.HVNodeConfigModels   = new Array();    // 横配置・縦配置ノード設定配列
        oApplyParams.branchSelectModels   = new Array();    // ルート選択情報配列

        oApplyParams.negoMail             = new Object();   // 根回しメール情報
        oApplyParams.negoMail.to          = new Array();    // 宛先
        oApplyParams.negoMail.cc          = new Array();    // Cc
        oApplyParams.negoMail.bcc         = new Array();    // Bcc
        oApplyParams.negoMail.subject     = "";             // 件名
        oApplyParams.negoMail.text        = "";             // 本文

        // 申請権限者コードのチェック
        if(isBlank(oApplyParams.applyAuthUserCode)) {
            // 実行者＝権限者
            oApplyParams.applyAuthUserCode = oRequest.imwUserCode;
        }

        // 新たな添付ファイル一時領域ディレクトリを作成
        var attachFileManager = new WorkflowTemporaryAttachFileManager();
        result = attachFileManager.createTempDirKey();
        if(!result.resultFlag) {
            // 作成失敗
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
        }
        oApplyParams.tempDirKey = result.data;   // 添付ファイル一時領域ディレクトリキー

        var tempSavedFlag = false;  // 一時保存済フラグ
        if(!isBlank(oApplyParams.userDataId)) {
            // 一時保存情報の読み込み

            var tempSave = new TempSaveMatter(groupId, localeId);
            result = tempSave.getTempSaveMatter(oApplyParams.userDataId);
            if(!result.resultFlag) {
                // 一時保存情報検索エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                        "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
            }

            if(!isBlank(result.data)) {
                // 取得した情報をセット
                tempSavedFlag = true;
                oApplyParams.matterName     = result.data.matterName;
                oApplyParams.processComment = result.data.processComment;
            }
        }

        // ユーザコンテンツから受け渡された初期表示情報の設定
        if (!tempSavedFlag || request.imwForcedParamFlag == oDefine.Enable) {
            // 新規申請、または強制パラメータフラグがONの場合
            // 案件名
            oApplyParams.matterName = isUndefined(request.imwMatterName) ?
                    oApplyParams.matterName : request.imwMatterName;
            // コメント
            oApplyParams.processComment = isUndefined(request.imwComment) ?
                    oApplyParams.processComment : request.imwComment;
        }

        // 申請ノードでの設定情報を取得（処理対象者情報必要）
        result = applyManager.getConfigSetToApplyWithProcessTarget(
                oApplyParams.flowId, oApplyParams.applyBaseDate);
        if (!result.resultFlag || isNull(result.data)) {
            Procedure.imw_error_utils.showErrorGreyboxClose(
                    "IMW.CLI.WRN.3521", "", CALLBACK_FUNCTION);
        }
        configSetToApply = result.data;
        oApplyParams.configSet = configSetToApply;
    }
    // 申請ノードIDを設定
    oApplyParams.applyNodeId = configSetToApply.nodeId;
    // 申請用パラメータに有効フロー詳細情報を設定
    oApplyParams.validFlowInfo = {
        "flowId" : configSetToApply.flowId,
        "flowVersionId" : configSetToApply.flowVersionId,
        "contentsId" : configSetToApply.contentsId,
        "contentsVersionId" : configSetToApply.contentsVersionId,
        "routeId" : configSetToApply.routeId,
        "routeVersionId" : configSetToApply.routeVersionId
    };

    oDisplayInfo.applyBaseDate = Procedure.imw_datetime_utils.getDateTimeToString(oApplyParams.applyBaseDate);

    // 申請ノードに設定された処理種別名の取得
    oDisplayInfo.applyName = configSetToApply.nodeProcessTypes[0].nodeProcessName;
    oDisplayInfo.applyButtonCaption = configSetToApply.nodeProcessTypes[0].nodeProcessName;

    // 画面表示情報オブジェクトの初期化
    oDisplayInfo.dispAttachFileFlag    = false;     // 添付ファイル表示フラグ
    oDisplayInfo.dispFlowSettingFlag   = false;     // フロー設定表示フラグ
    oDisplayInfo.dispRouteSelectFlag   = false;     // ルート選択表示フラグ
    // 根回し用画面表示情報オブジェクトの初期化
    oNegoMailInfo.dispNegoMailFlag      = false;     // 根回しメール表示フラグ
    oNegoMailInfo.dispNegoOnlyImboxFlag = false;     // 通知にIMBoxのみを使用するフラグ
    oNegoMailInfo.negoMailList4Select   = {to:[],cc:[],bcc:[]};// 根回しメール宛先リスト


    // 画面表示情報オブジェクトの設定（コメント・添付ファイルトグル）
    oDisplayInfo.commentOpenedFlag   = !isBlank(oApplyParams.processComment);    // コメントトグルOPENフラグ

    // フロー、申請ノードの設定による画面表示オブジェクトの設定(添付ファイル)
    if (configSetToApply.attachmentFileConfig==oDefine.atmCnf_Add ||
            configSetToApply.attachmentFileConfig==oDefine.atmCnf_AddDel) {
        // 添付ファイル：追加可能/追加削除可能
        oDisplayInfo.dispAttachFileFlag = true;
        oDisplayInfo.attachFileOpenedFlag= (oApplyParams.attachFile.length>0);  // 添付ファイルトグルOPENフラグ
    }

    // フロー、申請ノードの設定による画面表示オブジェクトの設定(フロー設定・ルート選択)
    oDisplayInfo.dispFlowSettingInfo = new Array(); // フロー設定表示情報
    oDisplayInfo.dispRouteSelectInfo = new Array(); // ルート選択表示情報
    oDisplayInfo.uiPartsIdMap = new Object();       // ルート選択表示のIDとのマッピング

    // 動的処理対象自動設定情報
    var imwNodeSetting = {};
    //Logger.getLogger().info(' [init]　$nodeUserslist' + ImJson.toJSONString($nodeUserslist,true));
    Logger.getLogger().info(' [init]　$nodeUserslist' + request.imwNodeSetting);
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
    
    // 動的承認ノード・確認ノード
    if(!isBlank(imwNodeSetting.DCNodeSetting)) {
        // 動的承認設定にて上書き
        setDCNodeConfigToDisplayInfoAndParamNodeSetting(imwNodeSetting.DCNodeSetting, configSetToApply, oDisplayInfo, oApplyParams);
    } else {
        // 設定対象動的承認ノード
        for (cnt = 0, leng = configSetToApply.configDynamicNodes.length; cnt < leng; cnt++) {
            var dynamicNode = configSetToApply.configDynamicNodes[cnt];
            setDCNodeConfigToDisplayInfoAndParam(
                    dynamicNode, dynamicNode.defaultProcessTargets, oDisplayInfo, oApplyParams);
        }
        // 設定対象確認ノード
        for (cnt = 0, leng = configSetToApply.configConfirmNodes.length; cnt < leng; cnt++) {
            var confirmNode = configSetToApply.configConfirmNodes[cnt];
            setDCNodeConfigToDisplayInfoAndParam(
                    confirmNode, confirmNode.defaultConfirmTargets, oDisplayInfo, oApplyParams);
        }
    }
    // 設定対象横配置ノード・縦配置ノード
    if(!isBlank(imwNodeSetting.HVNodeSetting)) {
        setHVNodeConfigToDisplayInfoAndParamNodeSetting(imwNodeSetting.HVNodeSetting, configSetToApply, oDisplayInfo, oApplyParams);
     } else {
        // 設定対象横配置ノード
        for (cnt = 0, leng = configSetToApply.configHorizontalNodes.length; cnt < leng; cnt++) {
            setHVNodeConfigToDisplayInfoAndParam(
                    configSetToApply.configHorizontalNodes[cnt], oDisplayInfo, oApplyParams);
        }
        // 設定対象縦配置ノード
        for (cnt = 0, leng = configSetToApply.configVerticalNodes.length; cnt < leng; cnt++) {
            setHVNodeConfigToDisplayInfoAndParam(
                    configSetToApply.configVerticalNodes[cnt], oDisplayInfo, oApplyParams);
        }
    }
    // 設定対象分岐開始ノード
    for (cnt = 0, leng = configSetToApply.configBranchStartNodes.length; cnt < leng; cnt++) {
        setBSNodeConfigToDisplayInfoAndParam(
                configSetToApply.configBranchStartNodes[cnt], oDisplayInfo, oApplyParams);
    }

    // 設定対象のノード群を実際のルート上ノード順に並べ替え start
    // 申請対象のフロー詳細情報を取得
    var flowDataManager  = new FlowDataManager();
    result = flowDataManager.getFlowDetailData(
            oApplyParams.flowId, configSetToApply.flowVersionId);
    if(!result.resultFlag) {
        // フロー詳細情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
    } else if (isNull(result.data) || result.data.length == 0) {
        // 有効なフロー情報がない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3521", "", CALLBACK_FUNCTION);
    }

    // 同期的な処理／非同期的な処理
    var paramManager = new WorkflowParameterManager(groupId);
    oDisplayInfo.standardExecJsspAsyncFlag = Procedure.imw_utils.getValue(paramManager.getBooleanParameter("standard-exec-jssp-async"), false);
    if (oDisplayInfo.standardExecJsspAsyncFlag) {
        if (codeUtil.getEnumCodeFlagStatus("Enable") != result.data[0].asyncProcessFlag) {
            oDisplayInfo.standardExecJsspAsyncFlag = false;
        }
    }

    // システム日で対象者を展開する／申請基準日で対象者を展開する
    oRequest.imwSysDateTargetExpandFlag = Procedure.imw_utils.getValue(result.data[0].sysDateTargetExpandFlag, codeUtil.getEnumCodeFlagStatus("Disable"));
    
    // 続けて、ノード連携情報を取得
    result.data[0].routeVersionId = configSetToApply.routeVersionId;
    result = flowDataManager.getRouteNodeData(result.data[0]);
    if(!result.resultFlag) {
        // ノード連携情報検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
    } else if (isNull(result.data)) {
        // 有効なフロー情報がない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3521", "", CALLBACK_FUNCTION);
    }
    var tempFlowSettingInfos = new Array();
    for (cnt = 0, leng = result.data.length; cnt < leng; cnt++) {
        index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                result.data[cnt].nodeId, oDisplayInfo.dispFlowSettingInfo, "nodeId");
        if (index == -1) {
            continue;
        }
        tempFlowSettingInfos.push(oDisplayInfo.dispFlowSettingInfo[index]);
    }
    oDisplayInfo.dispFlowSettingInfo = tempFlowSettingInfos;
    // 設定対象のノード群を実際のルート上ノード順に並べ替え end

    // 表示フラグの設定
    oDisplayInfo.dispFlowSettingFlag = (oDisplayInfo.dispFlowSettingInfo.length>0); // フロー設定表示フラグ
    oDisplayInfo.dispRouteSelectFlag = (oDisplayInfo.dispRouteSelectInfo.length>0); // ルート選択表示フラグ



    // 申請者名の取得
    var routeDataManager = new RouteDataManager(groupId);
    result = getDefaultProcessTarget(routeDataManager, configSetToApply, oApplyParams.applyNodeId);
    if(!result.resultFlag) {
        // デフォルト処理対象取得エラー
        return result;
    }
    var plugins = result.data;  // プラグイン情報配列

    // 案件情報の作成 (案件未作成のため手動で取得)
    var matterInfo = new Object();
    matterInfo.systemMatterId = ""; // システム案件IDは未採番
    matterInfo.userDataId = oApplyParams.userDataId;
    matterInfo.contentsId = configSetToApply.contentsId;
    matterInfo.contentsVersionId = configSetToApply.contentsVersionId;
    matterInfo.routeId = configSetToApply.routeId;
    matterInfo.routeVersionId = configSetToApply.routeVersionId;
    matterInfo.flowId = oApplyParams.flowId;
    matterInfo.flowVersionId = configSetToApply.flowVersionId;
    matterInfo.nodeId = oApplyParams.applyNodeId;

    result = Procedure.imw_proc_utils.getApplyAuthUserName(
            groupId, localeId, plugins,
            oApplyParams.applyBaseDate,
            oApplyParams.applyAuthUserCode, matterInfo);
    if (!result.resultFlag) {
        // 申請者名の取得エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
    } else if (isNull(result.data)) {
        // 申請者が対象者に存在しない
        Procedure.imw_error_utils.showErrorGreyboxClose(
                "IMW.CLI.WRN.3634", "", CALLBACK_FUNCTION);
    }
    oDisplayInfo.applyAuthUserName = result.data;

    // 優先度コンボの生成
    result = codeUtil.getPriorityLevel();
    if(result.resultFlag) {
        // 優先度定義取得成功
        var priorityCombo = new Array();
        for(cnt=0; cnt<result.data.length; cnt++) {
            
            priorityCombo.push({
                value : result.data[cnt].code,
                label : MessageManager.getMessage(result.data[cnt].messageId),
                selected : (oApplyParams.priorityLevel == result.data[cnt].code)
            });
        }
        oDisplayInfo.priorityCombo = priorityCombo;
    }


    // 根回しメール可否判定
    oNegoMailInfo.dispNegoMailFlag      = paramManager.getIntegerParameter("notice-type") != 0 && paramManager.getBooleanParameter("negotiate-type");
    oNegoMailInfo.dispNegoOnlyImboxFlag = paramManager.getIntegerParameter("notice-type") == 3 && oNegoMailInfo.dispNegoMailFlag;

    if(oNegoMailInfo.dispNegoMailFlag) {
        // 根回しメール画面表示情報オブジェクトの初期化
        oNegoMailInfo.negoMailOpenedFlag        = false;                                      // 根回しメールトグルOPENフラグ
        oNegoMailInfo.negoMailCcOpenedFlag      = (oApplyParams.negoMail.cc.length>0);        // 根回しメールCcトグルOPENフラグ
        oNegoMailInfo.negoMailBccOpenedFlag     = (oApplyParams.negoMail.bcc.length>0);       // 根回しメールBccトグルOPENフラグ

        if(oApplyParams.negoMail.to.length > 0 ||
                oNegoMailInfo.negoMailCcOpenedFlag || oNegoMailInfo.negoMailBccOpenedFlag ||
                !isBlank(oApplyParams.negoMail.subject) || !isBlank(oApplyParams.negoMail.text)) {
            // 情報が一つでも入力済み：根回しメールトグルをOPEN状態で表示
            oNegoMailInfo.negoMailOpenedFlag = true;

            // 宛先画面表示用処理（プラグイン情報から表示名を取得）
            result = Procedure.imw_proc_utils.getNegoMailList4Select(
                    groupId, localeId, Procedure.imw_datetime_utils.getSystemDateTimeByUserTimeZone(),
                    oApplyParams.negoMail );
            if(!result.resultFlag) {
                // 名称の取得エラー
                Procedure.imw_error_utils.showErrorGreyboxClose(
                        "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
            }
            oNegoMailInfo.negoMailList4Select = result.data;
        }
    }


    // 担当組織コンボ生成
    result = applyManager.getAuthUserOrgz(oApplyParams.flowId,
            oApplyParams.applyBaseDate, oApplyParams.applyAuthUserCode );
    if(!result.resultFlag) {
        // 組織検索エラー
        Procedure.imw_error_utils.showErrorGreyboxClose(
                            "IMW.CLI.WRN.3579", "", CALLBACK_FUNCTION);
    }
    getAuthUserOrgzInfoAuthAct(result, oApplyParams.applyAuthUserCode, oApplyParams.applyExecuteUserCode, localeId, configSetToApply);
    oDisplayInfo.dispApplyAuthOrgzInfos = new Array();

    var tmpOrgzCodeInfo;
    var tmpAryCodes4Sort = new Array();
    var tmpAryAuthOrgzInfo = new Object();
    var orgzLeng = result.data.length;
    if(orgzLeng > 0) {
        for(cnt=0; cnt<orgzLeng; cnt++) {
            // 取得された所属組織数分繰り返し
            tmpOrgzCodeInfo = new Array();
            tmpOrgzCodeInfo.push( Procedure.imw_utils.getValue(result.data[cnt].companyCode, "") );
            tmpOrgzCodeInfo.push( Procedure.imw_utils.getValue(result.data[cnt].orgzSetCode, "") );
            tmpOrgzCodeInfo.push( Procedure.imw_utils.getValue(result.data[cnt].orgzCode, "") );
            tmpAryAuthOrgzInfo[tmpOrgzCodeInfo.join(separator)] = result.data[cnt].orgzName;
            tmpAryCodes4Sort.push(tmpOrgzCodeInfo.join(separator));
        }
        if (orgzLeng == 1 && oRequest.imwCallType == "0") {
            // 担当組織の選択肢が一つかつ初回表示の場合は
            // デフォルトで選択状態とする
            oApplyParams.applyAuthOrgz = result.data[0].companyCode + separator +
                    result.data[0].orgzSetCode + separator + result.data[0].orgzCode;
        }
        // 組織順のソート(会社コード、組織セットコード、組織コードの昇順)
        tmpAryCodes4Sort = Module.array.sort(tmpAryCodes4Sort);
        oDisplayInfo.dispApplyAuthOrgzInfos.push({
            value : "",
            label : "　",
            selected : (oApplyParams.applyAuthOrgz == "")
        });
        
        for (cnt = 0; cnt < orgzLeng; cnt++) {
            oDisplayInfo.dispApplyAuthOrgzInfos.push({
                value : Procedure.imw_utils.escapeHTML(tmpAryCodes4Sort[cnt]),
                label : tmpAryAuthOrgzInfo[tmpAryCodes4Sort[cnt]],
                selected : (oApplyParams.applyAuthOrgz == tmpAryCodes4Sort[cnt])
            });
        }
    } else {

        if (oRequest.imwCallType == "0") {
            // 初回表示の場合はデフォルトで選択状態とする
            oApplyParams.applyAuthOrgz = separator+separator;
        }

        oDisplayInfo.dispApplyAuthOrgzInfos.push({
            value : "",
            label : "　",
            selected : (oApplyParams.applyAuthOrgz == "")
        });
        
        // 所属が一つもない場合：選択可能な所属組織なし
        oDisplayInfo.dispApplyAuthOrgzInfos.push({
            value : separator+separator,
            label : oCaption.noAttach,
            selected : (oApplyParams.applyAuthOrgz == separator+separator)
        });
        

    }
    // 担当組織コンボ初期値設定
    setDefaultDepartmentInCharge(oDisplayInfo, oApplyParams.applyAuthUserCode, oApplyParams.applyExecuteUserCode, oRequest.imwCallType);

    // タイトル設定（ノード名含む）
    oCaption.titleWithNodeName = 
            oCaption.title + "&nbsp;&nbsp;" + Procedure.imw_utils.toBrowse(
            MessageManager.getMessage("IMW.CAP.0381", configSetToApply.nodeName));

    // 印影処理
    var stampEnable = paramManager.getBooleanParameter("stamp-enabled");
    oDisplayInfo.dispStampFlag = false;
    if(stampEnable) {
        var messageInfo = {
                noStampMessageId      : "IMW.CLI.WRN.3579",
                noStampSubMessageId   : "IMW.STAMP.WRN.0008",
                noDefaultMessageId    : "IMW.CLI.WRN.3579",
                noDefaultSubMessageId : "IMW.STAMP.WRN.0009"
        }
        var stampInfo = Procedure.imw_stamp_utils.getStampInfo(
                oRequest, stampData, messageInfo, sessionInfo.clientType, true);
        if(stampInfo != null && !isBlank(stampInfo.displayInfo.dispStampFlag)) {
            oDisplayInfo.dispStampFlag = true;
            oDisplayInfo.stampId       = stampInfo.displayInfo.stampId;
            oDisplayInfo.stampTag      = stampInfo.displayInfo.stampTag;
            oDisplayInfo.dispStampTags = new Array();
            oDisplayInfo.dispStampTags.push({
                value : "",
                label : "　"
            });
            
            for (var stampKey in stampInfo.displayInfo.dispStampTags) {
                
                oDisplayInfo.dispStampTags.push({
                    
                    value : stampKey,
                    label : stampInfo.displayInfo.dispStampTags[stampKey],
                    selected : (oDisplayInfo.stampTag == stampKey)
                });
            }
         
        }
    }

    // 申請パラメータをJSON文字列に変換
    oApplyParamsJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oApplyParams));
    // 画面表示情報オブジェクトをJSON文字列に変換
    oDisplayInfoJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDisplayInfo));
    // 根回し用画面表示情報オブジェクトをJSON文字列に変換
    oNegoMailInfoJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oNegoMailInfo));
    // 画面表示情報オブジェクトをJSON文字列に変換
    oDefineJSON      = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oDefine));
    // ワークフローパラメータをJSON文字列に変換
    oWorkflowParamsJSON = Procedure.imw_utils.escapeHTML(URL.decode(oRequest.imwWorkflowParams));

    // 画面表示メッセージ取得
    var oMessage = getMessage(oDisplayInfo.applyName);
    // 画面表示メッセージオブジェクトをJSON文字列に変換
    oMessageJSON = Procedure.imw_utils.escapeHTML(ImJson.toJSONString(oMessage));

    oNotEscapeDispInfo = oDisplayInfo;
    oNotEscapeDispInfo.matterName = oApplyParams.matterName;
    
    // HTML特殊文字を変換する
    oRequest     = Procedure.imw_utils.toBrowse(oRequest);
    oApplyParams = Procedure.imw_utils.toBrowse(oApplyParams);
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

    objDef.nodeTyp_Apply        = codeUtil.getEnumCodeNodeType("nodeTyp_Apply");           // ノード種別：申請ノード
    objDef.nodeTyp_Dynamic      = codeUtil.getEnumCodeNodeType("nodeTyp_Dynamic");         // ノード種別：動的処理ノード
    objDef.nodeTyp_Confirm      = codeUtil.getEnumCodeNodeType("nodeTyp_Confirm");         // ノード種別：確認ノード
    objDef.nodeTyp_Horizontal   = codeUtil.getEnumCodeNodeType("nodeTyp_Horizontal");      // ノード種別：横配置ノード
    objDef.nodeTyp_Vertical     = codeUtil.getEnumCodeNodeType("nodeTyp_Vertical");        // ノード種別：縦配置ノード
    objDef.nodeTyp_Branch_Start = codeUtil.getEnumCodeNodeType("nodeTyp_Branch_Start");    // ノード種別：分岐開始ノード

    objDef.atmCnf_NotAddDel     = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_NotAddDel");    // 添付ファイル：追加・削除不可
    objDef.atmCnf_Add           = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_Add");          // 添付ファイル：追加のみ
    objDef.atmCnf_AddDel        = codeUtil.getEnumCodeAttachmentFileConfig("atmCnf_AddDel");       // 添付ファイル：追加・削除可

    objDef.attrTyp_procTypName                = codeUtil.getEnumCodeAttributeType("attrTyp_procTypName");              // 属性種別：処理種別名
    objDef.attrTyp_dispatchNodeMin            = codeUtil.getEnumCodeAttributeType("attrTyp_dispatchNodeMin");          // 属性種別：割当可能ノード数（最小）
    objDef.attrTyp_dispatchNodeMax            = codeUtil.getEnumCodeAttributeType("attrTyp_dispatchNodeMax");          // 属性種別：割当可能ノード数（最大）
    objDef.attrTyp_execUserSetNode            = codeUtil.getEnumCodeAttributeType("attrTyp_execUserSetNode");          // 属性種別：処理対象者設定可能ノード
    objDef.attrTyp_cnfmUserSetNode            = codeUtil.getEnumCodeAttributeType("attrTyp_cnfmUserSetNode");          // 属性種別：確認対象者設定可能ノード
    objDef.attrTyp_branchCondition            = codeUtil.getEnumCodeAttributeType("attrTyp_branchCondition");          // 属性種別：分岐条件
    objDef.attrTyp_branchSettableNodeSingular = codeUtil.getEnumCodeAttributeType("attrTyp_branchSettableNodeSingular");  // 属性種別：分岐先設定可能ノード（単数）
    objDef.attrTyp_branchSettableNodePlural   = codeUtil.getEnumCodeAttributeType("attrTyp_branchSettableNodePlural"); // 属性種別：分岐先設定可能ノード（複数）

    objDef.branchUnionCondSet_ChoiceOnRuntime = codeUtil.getEnumCodeBranchUnionConditionSetting("branchUnionCondSet_ChoiceOnRuntime"); // 分岐結合条件設定:処理時に分岐先を選択

    objDef.pageTyp_App      = codeUtil.getEnumCodePageType("pageTyp_App");      // 画面種別：申請画面
    objDef.pageTyp_TempSave = codeUtil.getEnumCodePageType("pageTyp_TempSave"); // 画面種別：一時保存画面

    objDef.priorityLevel_Normal = codeUtil.getEnumCodePriorityLevel("pryLevel_N"); // 優先度：通常

    objDef.Enable  = codeUtil.getEnumCodeFlagStatus("Enable");     // フラグ状態：有効
    objDef.Disable = codeUtil.getEnumCodeFlagStatus("Disable");    // フラグ状態：無効

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

    objCap.title             = MessageManager.getMessage("IMW.CAP.0010"); // 申請
    objCap.require           = MessageManager.getMessage("IMW.CAP.0017"); // 必須
    objCap.matterName        = MessageManager.getMessage("IMW.CAP.0389"); // 案件名
    objCap.applyUser         = MessageManager.getMessage("IMW.CAP.0390"); // 申請者
    objCap.applyBaseDate     = MessageManager.getMessage("IMW.CAP.0391"); // 申請基準日
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
//   【 入力 】applyName : 処理種別「申請」の名称
//   【 返却 】キャプションオブジェクト
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示メッセージ取得処理を実行します。
//=============================================================================
function getMessage(applyName) {
    var objMsg = new Object();

    objMsg.flowSettingError = MessageManager.getMessage("IMW.CLI.INF.3501");
    objMsg.routeSelectError = MessageManager.getMessage("IMW.CLI.INF.3502");
    objMsg.close            = MessageManager.getMessage("IMW.CLI.WRN.3501");
    objMsg.applyConfirm     = MessageManager.getMessage("IMW.CLI.INF.3000", applyName);
    objMsg.deleteFileConfirm= MessageManager.getMessage("IMW.CLI.WRN.3500");
    objMsg.flowAndRouteError   = MessageManager.getMessage("IMW.CLI.INF.3528");
    objMsg.selectedStampId     = MessageManager.getMessage("IMW.STAMP.WRN.0005");

    return objMsg;
}

//=============================================================================
// 動的処理・確認ノード設定状況判定　返却関数
//   【 入力 】targetNodeId      : 対象動的処理・確認ノードID
//             DCNodeConfigModels: 入力済み動的処理・確認ノード情報配列
//   【 返却 】ルート選択チェック可否
//   【作成者】NTT DATA INTRAMART
//   【 概要 】
//=============================================================================
function isSetProcessTarget(targetNodeId, DCNodeConfigModels) {

    var isSet = false;
    for(var cnt=0; cnt<DCNodeConfigModels.length; cnt++) {

        if(DCNodeConfigModels[cnt].nodeId == targetNodeId && 
                !isBlank(DCNodeConfigModels[cnt].processTargetConfigs) ) {

            isSet = (DCNodeConfigModels[cnt].processTargetConfigs.length>0);
            break;
        }
    }

    return isSet;
}


//=============================================================================
// ルート選択チェック判定　返却関数
//   【 入力 】branchStartNodeId : 分岐開始ノードID
//             targetNodeId      : 分岐先ノードID
//             branchSelectModels: 入力済み分岐先選択情報配列
//   【 返却 】ルート選択チェック可否
//   【作成者】NTT DATA INTRAMART
//   【 概要 】
//=============================================================================
function isContainBranchSelect(branchStartNodeId, targetNodeId, branchSelectModels) {

    var isSelect = false;
    for(var cnt=0; cnt<branchSelectModels.length; cnt++) {

        if(branchSelectModels[cnt].branchStartNodeId == branchStartNodeId &&
                !isBlank(branchSelectModels[cnt].forwardNodeIds) ) {

            for(var cnt2=0; cnt2<branchSelectModels[cnt].forwardNodeIds.length; cnt2++) {

                if(branchSelectModels[cnt].forwardNodeIds[cnt2] == targetNodeId) {
                    isSelect = true;
                    break;
                }
            }
            break;
        }
    }

    return isSelect;
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
    for(var cnt=0; cnt<objValidation.messageList.length; cnt++) {
        objValidateMsg[ Procedure.imw_utils.toBrowse(objValidation.messageList[cnt].key) ] = 
            Procedure.imw_utils.toBrowse(objValidation.messageList[cnt].msg);
    }

    // JSON文字列に変換
    return ImJson.toJSONString(objValidateMsg);
}

//=============================================================================
// デフォルト処理対象取得関数
//   【 入力 】routeDataManager : ルート情報マネージャ
//             configSetToApply: 有効フロー情報
//             targetNodeId : 対象ノードID
//             templateNodeRouteMap : テンプレート置換ノードルートマップ
//   【 返却 】プラグイン情報配列
//   【作成者】NTT DATA INTRAMART
//   【 概要 】
//=============================================================================
function getDefaultProcessTarget(routeDataManager,
        configSetToApply, targetNodeId, templateNodeRouteMap) {

    var resultInfo = {
            "resultFlag": true,
            "data": new Array()
    };

    if (isBlank(targetNodeId)) {
        return resultInfo;
    }
    var tempNodeInfo = targetNodeId.split(separator);
    var nodeId;
    var routeId;
    var routeVersionId;
    if (1 < tempNodeInfo.length) {
        // ノードIDがハット^つなぎ：テンプレート置換ルート内のノード
        nodeId = tempNodeInfo[1];
        routeId = templateNodeRouteMap[tempNodeInfo[0]].routeId;
        routeVersionId = templateNodeRouteMap[tempNodeInfo[0]].routeVersionId;
    } else {
        // 本流ルート内のノード
        nodeId = targetNodeId;
        routeId = configSetToApply.routeId;
        routeVersionId = configSetToApply.routeVersionId;
    }

    // 設定対象のルートユーザ設定情報を取得
    var result = routeDataManager.getRoutePluginDataWithNode(
            routeId, routeVersionId, nodeId);
    if (!result.resultFlag) {
        // ルートユーザ設定情報検索エラー
        return result;
    }

    for (var cnt = 0; cnt < result.data.length; cnt++) {
        resultInfo.data.push({
                "extensionPointId"  : result.data[cnt].extensionPointId,
                "pluginId"          : result.data[cnt].pluginId,
                "parameter"         : result.data[cnt].parameter
        });
    }

    return resultInfo;
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
// 動的承認・確認ノード　設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】nodeConfig: 動的承認・確認ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により
//             取得した設定対象情報をもとに、動的承認・確認ノードに関する
//             画面表示情報ならびに申請用パラメータへの情報設定を行います。
//=============================================================================
function setDCNodeConfigToDisplayInfoAndParam(nodeConfig, defaultTargets, oDisplayInfo, oApplyParams) {
    var dynamicNodeFlag = (nodeConfig.nodeType == oDefine.nodeTyp_Dynamic);
    var objDispTemp = new Object();
    objDispTemp.nodeId = nodeConfig.nodeId;
    objDispTemp.nodeType = nodeConfig.nodeType;
    objDispTemp.nodeName = nodeConfig.nodeName;
    objDispTemp.isRequired = dynamicNodeFlag;
    // 申請用パラメータに設定が存在するか判定
    var tempProcessTargetConfigs = new Array();
    var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
            nodeConfig.nodeId,
            oApplyParams.DCNodeConfigModels, "nodeId" );
    if(index == -1) {
        // 初回表示の場合:デフォルトの処理対象者を設定
        if(oRequest.imwCallType == "0") {
            tempProcessTargetConfigs = defaultTargets;
        }
        var tempNode = { "nodeId"               : nodeConfig.nodeId,
                         "processTargetConfigs" : tempProcessTargetConfigs,
                         "setFlag"              : (dynamicNodeFlag ? (tempProcessTargetConfigs.length > 0) : true),
                         "dynamicNodeFlag"      : dynamicNodeFlag,
                         "displayFlag"          : !isFalse(nodeConfig.displayFlag)
                       };

        // 申請時のチェック処理を無効化
        if (nodeConfig.displayFlag === false) {
            tempNode.nodeSettingCheck = false;
            tempNode.setFlag = true;
        }
        if (isBoolean(nodeConfig.setFlag)) {
            tempNode.setFlag = nodeConfig.setFlag;
        }
        // ノード無効化制御
        if (dynamicNodeFlag && isBoolean(nodeConfig.enableFlag) && nodeConfig.enableFlag === false) {
            tempNode.defaultProcessTargets = tempProcessTargetConfigs;
            tempNode.processTargetConfigs  = [];
            tempNode.nodeSettingCheck      = false;
        } else if (nodeConfig.displayEnableCheckboxFlag === false) {
            // ノード設定画面での削除可否チェックボックスの表示制御用パラメータ
            tempNode.displayEnableCheckboxFlag = false;
        }
        // ユーザ保存機能無効化
        if (nodeConfig.nodeSettingFlag === true) {
            tempNode.nodeSettingFlag = true;
        }
        // 絞込み条件
        if (!isBlank(nodeConfig.searchCondition) &&
                Procedure.imw_utils.isBlankObject(nodeConfig.searchCondition)) {
            tempNode.searchCondition = nodeConfig.searchCondition;
            tempNode.nodeSettingSearchConditionFlag = true;
        }
        // 申請用パラメータに設定
        oApplyParams.DCNodeConfigModels.push(tempNode);

        // フロー設定表示制御
        if (!isFalse(nodeConfig.displayFlag)) {
            // 設定状況アイコン表示制御
            if (dynamicNodeFlag) {
                // 動的承認ノードの場合
                objDispTemp.setFlag = tempNode.setFlag;
            } else {
                // 確認ノードの場合
                objDispTemp.setFlag = (tempProcessTargetConfigs.length > 0);
            }
            oDisplayInfo.dispFlowSettingInfo.push(objDispTemp);
        }
    } else {
        // フロー設定表示制御
        if (!isFalse(oApplyParams.DCNodeConfigModels[index].displayFlag)) {
            // 設定状況アイコン表示制御
            if (dynamicNodeFlag) {
                // 動的承認ノードの場合
                objDispTemp.setFlag = oApplyParams.DCNodeConfigModels[index].setFlag;
            } else {
                // 確認ノードの場合
                objDispTemp.setFlag = (oApplyParams.DCNodeConfigModels[index].processTargetConfigs.length > 0);
            }
            oDisplayInfo.dispFlowSettingInfo.push(objDispTemp);
        }
    }
}

//=============================================================================
// 横配置・縦配置ノード　設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】nodeConfig: 横配置・縦配置ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により
//             取得した設定対象情報をもとに、横配置・縦配置ノードに関する
//             画面表示情報ならびに申請用パラメータへの情報設定を行います。
//=============================================================================
function setHVNodeConfigToDisplayInfoAndParam(nodeConfig, oDisplayInfo, oApplyParams) {
    var objDispTemp = new Object();
    objDispTemp.nodeId = nodeConfig.nodeId;
    objDispTemp.nodeType = nodeConfig.nodeType;
    objDispTemp.nodeName = nodeConfig.nodeName;
    objDispTemp.min = nodeConfig.dispachNodeMin;
    objDispTemp.max = nodeConfig.dispachNodeMax;
    // 申請用パラメータに設定が存在するか判定
    var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
            nodeConfig.nodeId, oApplyParams.HVNodeConfigModels, "nodeId" );
    if(index == -1) {
        // 初回表示の場合:デフォルトの処理対象者を設定
        var tempMatterNodeExpansions= new Array();
        var tempProcessTargetConfigs    = new Array();
        if (oRequest.imwCallType == "0") {
            tempProcessTargetConfigs = nodeConfig.defaultProcessTargets;
            // デフォルト対象者が存在し、展開最小数>0の場合:設定済み
            objDispTemp.setFlag =
                    tempProcessTargetConfigs.length > 0 && objDispTemp.min > 0;
            // 最大展開数分の展開情報を作成する
            for (var cntExp = 0; cntExp < objDispTemp.max; cntExp++) {
                tempMatterNodeExpansions.push(
                    {   "nodeName"                  :   objDispTemp.nodeName,
                        "processTargetConfigModel"  :   tempProcessTargetConfigs,
                        "setFlag"                   :   cntExp < objDispTemp.min
                    }
                );
            }
        }
        // 申請用パラメータに設定
        oApplyParams.HVNodeConfigModels.push(
            { "nodeId"                  : nodeConfig.nodeId,
                "matterNodeExpansions"  : tempMatterNodeExpansions,
                "setFlag"               : tempProcessTargetConfigs.length > 0 && objDispTemp.min > 0}
        );
    } else {
        // 対象の横配置・縦配置ノードについて、すでに設定を行っている場合
        objDispTemp.setFlag = oApplyParams.HVNodeConfigModels[index].setFlag;
        // フロー設定表示制御
        if (isFalse(oApplyParams.HVNodeConfigModels[index].displayFlag)) {
            return;
        }
        // 動的処理対象者設定機能利用の場合
        if(oApplyParams.HVNodeConfigModels[index].nodeSettingCheck === false) {
            // 割り当て可能ノード数の最小の値を再設定
            if(isNumber(oApplyParams.HVNodeConfigModels[index].dispachNodeMin)) {
                objDispTemp.min = oApplyParams.HVNodeConfigModels[index].dispachNodeMin;
            }
            // 割り当て可能ノード数の最大の値を再設定
            if(isNumber(oApplyParams.HVNodeConfigModels[index].dispachNodeMin)) {
                objDispTemp.max = oApplyParams.HVNodeConfigModels[index].dispachNodeMax;
            }
        }
    }
    // 最小設定数が1以上の場合：必須入力
    objDispTemp.isRequired = (objDispTemp.min > 0);

    oDisplayInfo.dispFlowSettingInfo.push(objDispTemp);
}

//=============================================================================
// 分岐開始ノード　設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】nodeConfig: 分岐開始ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により
//             取得した設定対象情報をもとに、分岐開始ノードに関する
//             画面表示情報ならびに申請用パラメータへの情報設定を行います。
//=============================================================================
function setBSNodeConfigToDisplayInfoAndParam(nodeConfig, oDisplayInfo, oApplyParams) {
    var objDispTemp = new Object();
    var replacedNodeId = Procedure.imw_proc_utils.convertId4UiParts(nodeConfig.nodeId);
    objDispTemp.nodeId          = nodeConfig.nodeId;
    objDispTemp.nodeType        = nodeConfig.nodeType;
    objDispTemp.nodeName        = nodeConfig.nodeName;
    objDispTemp.multipleFlag    = (nodeConfig.multipleBranchFlag == oDefine.Enable);
    var nextNodes = new Array();
    for(var cntNextNode = 0, leng = nodeConfig.forwardNodes.length;
            cntNextNode < leng; cntNextNode++) {
        var tmpNodeObj = new Object();
        var forwardNode = nodeConfig.forwardNodes[cntNextNode];
        var forwardNodeId = forwardNode.nodeId;
        tmpNodeObj.nodeId = forwardNodeId + nodeSeparator +  forwardNodeId;
        tmpNodeObj.nodeName = forwardNode.nodeName;
        tmpNodeObj.checkFlag = isContainBranchSelect(
                nodeConfig.nodeId, forwardNodeId, oApplyParams.branchSelectModels);
        tmpNodeObj.nodeIdForLabel = "label:" + tmpNodeObj.nodeId;
        nextNodes.push(tmpNodeObj);
    }
    objDispTemp.selectableNodes = nextNodes;
    objDispTemp.uiPartsId = replacedNodeId;
    oDisplayInfo.dispRouteSelectInfo.push(objDispTemp);
    oDisplayInfo.uiPartsIdMap[nodeConfig.nodeId] = replacedNodeId;
}

//=============================================================================
// 権限代理用の担当組織取得処理
//   【 入力 】orgzInfo: 画面表示用の担当組織オブジェクト
//             authUserCode: 処理権限者
//             executeUserCode: 処理者
//             localeId: ロケールID
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】画面表示用の処理履歴を取得して返却します。
//=============================================================================
function getAuthUserOrgzInfoAuthAct(orgzInfo, authUserCode, executeUserCode, localeId) {

    // 本人の場合は何もしない
    if (authUserCode == executeUserCode) {
        return;
    }

    var systemDatetime = Procedure.imw_datetime_utils.getSystemDateTime();
    var originalActList = new OriginalActList(executeUserCode, localeId);
    var len;
    var i;
    var j;

    // 権限代理先設定情報の取得処理
    var searchCondition = new ListSearchConditionNoMatterProperty();
    var codeUtil = new WorkflowCodeUtil();
    searchCondition.addCondition(OriginalActList.ORIGINAL_ACT_USER_CODE, authUserCode, ListSearchCondition.OP_EQ);
    searchCondition.addCondition(OriginalActList.APPLY_AUTH, codeUtil.getEnumCodeFlagStatus("Enable"), ListSearchCondition.OP_EQ);
    searchCondition.addCondition(OriginalActList.START_DATE, systemDatetime, ListSearchCondition.OP_LE);
    searchCondition.addCondition(OriginalActList.LIMIT_DATE, systemDatetime, ListSearchCondition.OP_GE);
    var resultAct = originalActList.getAuthList(searchCondition);
    if (!resultAct.resultFlag || resultAct.data.length == 0) {
        return;
    }
    var originalAuthActModels = resultAct.data;
    var hasDepartment = false;
    len = originalAuthActModels.length;
    for (i=len-1; i>=0; i--) {
        if (originalAuthActModels[i].originalActTargetType == "department" || originalAuthActModels[i].originalActTargetType == "department_and_post") {
            hasDepartment = true;
        } else {
            originalAuthActModels.splice(i, 1);
        }
    }
    if (hasDepartment == false) {
        return;
    }

    // 権限代理先設定に組織が存在する場合、担当組織を絞り込む
    var models = orgzInfo.data;
    var actAuthFlag = false;
    for (i=0; i<models.length; i++) {
        var tantou = models[i].companyCode + "^" + models[i].orgzSetCode + "^" + models[i].orgzCode;
        for (j=0; j<originalAuthActModels.length; j++) {
            var tmpTarget = "";
            if (originalAuthActModels[j].originalActTargetType == "department") {
                tmpTarget = originalAuthActModels[j].originalActTargetCode;
            } else if (originalAuthActModels[j].originalActTargetType == "department_and_post") {
                tmpTarget = originalAuthActModels[j].originalActTargetCode.split("|")[0];
            }
            if (tantou == tmpTarget) {
                models[i].actAuth = true;
                actAuthFlag = true;
                break;
            }
        }
    }
    if (actAuthFlag == false) {
        return;
    }
    len = models.length;
    for (i = len -1; i>=0; i--) {
        if (models[i].actAuth === true) {
            delete models[i].actAuth;
        } else {
            models.splice(i, 1);
        }
    }
}


//=============================================================================
// 右上組織に対する担当組織の初期値設定処理
//   【 入力 】orgzInfo: 画面表示用の担当組織オブジェクト
//             authUserCode: 処理権限者
//             executeUserCode: 処理者
//             callType: 呼び出しフラグ(0:初期表示)
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】右上組織で選択された組織を担当組織の初期値として設定します。
//             処理権限者の場合のみ初期値を設定します。
//=============================================================================
function setDefaultDepartmentInCharge(orgzInfo, authUserCode, executeUserCode, callType) {

    // 代理先の場合は何もしない
    if (authUserCode != executeUserCode) {
        return;
    }

    // 初期表示以外の場合は何もしない
    if (callType != "0") {
        return;
    }

    var orgzLength = orgzInfo.dispApplyAuthOrgzInfos.length;

    // ブランクと組織１つ（所属なし）の場合は何もしない
    if (orgzLength == 2) {
        return;
    }

    var currentDepartmentKeys = null;
    var _d = Contexts.getUserContext().currentDepartment;
    if (_d != null) {
        currentDepartmentKeys = _d.companyCd + separator + _d.departmentSetCd + separator + _d.departmentCd;
    }

    var i;
    var currentDepartmentContain = false;
    for (i = 0; i < orgzLength; i++) {
        if (currentDepartmentKeys == orgzInfo.dispApplyAuthOrgzInfos[i].value) {
            currentDepartmentContain = true;
        }
    }
    if (false == currentDepartmentContain) {
        return;
    }

    for (i = 0; i < orgzLength; i++) {
        if (currentDepartmentKeys == orgzInfo.dispApplyAuthOrgzInfos[i].value) {
            orgzInfo.dispApplyAuthOrgzInfos[i].selected = true;
        }
        if ("" == orgzInfo.dispApplyAuthOrgzInfos[i].value) {
            orgzInfo.dispApplyAuthOrgzInfos[i].selected = false;
        }
    }
}

//=============================================================================
// 動的処理対象者設定機能利用 動的承認・確認ノード 設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】nodeSetting: 動的処理対象者設定 動的承認・確認ノード情報オブジェクト
//             configSetToApply: 横配置・縦配置ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により取得した設定対象情報と
//             動的処理対象者設定パラメータの動的承認・確認ノード情報をもとに、
//             動的承認・確認ノードに関する画面表示情報ならびに申請用パラメータへの情報設定を行います。
//=============================================================================
function setDCNodeConfigToDisplayInfoAndParamNodeSetting(nodeSetting, configSetToApply, oDisplayInfo, oApplyParams) {
    var cnt = 0;
    var leng = 0;
    if(oRequest.imwCallType != "0") {
        // 再表示
        // 動的承認ノード
        for (cnt = 0, leng = configSetToApply.configDynamicNodes.length; cnt < leng; cnt++) {
            var dynamicNode = configSetToApply.configDynamicNodes[cnt];
            var defaultConfig = dynamicNode.defaultProcessTargets;
            if(!isBlank(nodeSetting[dynamicNode.nodeId])) {
                var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                        dynamicNode.nodeId, oApplyParams.DCNodeConfigModels, "nodeId" );
                var dynamicNodeSetting = {
                        "nodeId"           : dynamicNode.nodeId,
                        "dynamicNodeFlag"  : true,
                        "nodeSettingCheck" : false,
                        "nodeSettingFlag"  : true
                };
                if (isBoolean(oApplyParams.DCNodeConfigModels[index].nodeSettingCheck)) {
                    dynamicNodeSetting.nodeSettingCheck = oApplyParams.DCNodeConfigModels[index].nodeSettingCheck;
                }
                if (isArray(nodeSetting[dynamicNode.nodeId].processTargetConfigs)) {
                    defaultConfig = nodeSetting[dynamicNode.nodeId].processTargetConfigs;
                }
                if (isBoolean(nodeSetting[dynamicNode.nodeId].enableFlag) &&
                        nodeSetting[dynamicNode.nodeId].enableFlag === false) {
                    dynamicNodeSetting.defaultProcessTargets = defaultConfig;
                    dynamicNodeSetting.processTargetConfigs = [];
                } else {
                    dynamicNodeSetting.processTargetConfigs = defaultConfig;
                    // ノード設定画面での削除可否チェックボックスの表示制御用パラメータ
                    if (nodeSetting[dynamicNode.nodeId].displayEnableCheckboxFlag === false) {
                        dynamicNodeSetting.displayEnableCheckboxFlag = false;
                    }
                }
                // フロー設定表示・設定済み制御
                if (nodeSetting[dynamicNode.nodeId].displayFlag === false) {
                    dynamicNodeSetting.displayFlag = false;
                    // 非表示の場合は設定済みとする
                    dynamicNodeSetting.setFlag = true;
                } else {
                    dynamicNodeSetting.displayFlag = true;
                    dynamicNodeSetting.setFlag = (defaultConfig.length > 0);
                }
                if (isBoolean(nodeSetting[dynamicNode.nodeId].setFlag)) {
                    dynamicNodeSetting.setFlag = !isFalse(nodeSetting[dynamicNode.nodeId].setFlag);
                }
                if (!isBlank(nodeSetting[dynamicNode.nodeId].searchCondition) &&
                        Procedure.imw_utils.isBlankObject(nodeSetting[dynamicNode.nodeId].searchCondition)) {
                    dynamicNodeSetting.searchCondition = nodeSetting[dynamicNode.nodeId].searchCondition;
                    dynamicNodeSetting.nodeSettingSearchConditionFlag = true;
                }
                oApplyParams.DCNodeConfigModels[index] = dynamicNodeSetting;
                var dynamicNodeConfig = {
                        "nodeId"       : dynamicNode.nodeId,
                        "nodeType"     : dynamicNode.nodeType,
                        "nodeName"     : dynamicNode.nodeName,
                        "displayFlag"  : dynamicNodeSetting.displayFlag
                };
                setDCNodeConfigToDisplayInfoAndParam(
                        dynamicNodeConfig, dynamicNodeSetting.processTargetConfigs, oDisplayInfo, oApplyParams);
            } else {
                setDCNodeConfigToDisplayInfoAndParam(
                        dynamicNode, defaultConfig, oDisplayInfo, oApplyParams);
            }
        }
        // 確認ノード
        for (cnt = 0, leng = configSetToApply.configConfirmNodes.length; cnt < leng; cnt++) {
            var confirmNode = configSetToApply.configConfirmNodes[cnt];
            var defaultConfig = confirmNode.defaultConfirmTargets;
            if(!isBlank(nodeSetting[confirmNode.nodeId])) {
                var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                        confirmNode.nodeId, oApplyParams.DCNodeConfigModels, "nodeId" );
                var confirmNodeSetting = {
                        "nodeId"          : confirmNode.nodeId,
                        "dynamicNodeFlag" : false,
                        "nodeSettingFlag" : true,
                        "setFlag"         : true
                };
                confirmNodeSetting.displayFlag = nodeSetting[confirmNode.nodeId].displayFlag;
                // 確認対象設定
                if (isArray(nodeSetting[confirmNode.nodeId].processTargetConfigs)) {
                    defaultConfig = nodeSetting[confirmNode.nodeId].processTargetConfigs;
                } else {
                    defaultConfig = confirmNode.defaultConfirmTargets;
                }
                confirmNodeSetting.processTargetConfigs = defaultConfig;
                // 絞込み条件の設定
                if (!isBlank(nodeSetting[confirmNode.nodeId].searchCondition) &&
                        Procedure.imw_utils.isBlankObject(nodeSetting[confirmNode.nodeId].searchCondition)) {
                    confirmNodeSetting.searchCondition = nodeSetting[confirmNode.nodeId].searchCondition;
                    confirmNodeSetting.nodeSettingSearchConditionFlag = true;
                }
                // 設定済みアイコン制御
                if (isBoolean(nodeSetting[confirmNode.nodeId].setFlag)) {
                    confirmNodeSetting.setFlag = !isFalse(nodeSetting[confirmNode.nodeId].setFlag);
                }

                oApplyParams.DCNodeConfigModels[index] = confirmNodeSetting;
                
                var confirmNodeConfig = {
                        "nodeId"       : confirmNode.nodeId,
                        "nodeType"     : confirmNode.nodeType,
                        "nodeName"     : confirmNode.nodeName,
                        "displayFlag"  : confirmNodeSetting.displayFlag
                };
                setDCNodeConfigToDisplayInfoAndParam(
                        confirmNodeConfig, confirmNodeSetting.processTargetConfigs, oDisplayInfo, oApplyParams);
            } else {
                setDCNodeConfigToDisplayInfoAndParam(
                        confirmNode, defaultConfig, oDisplayInfo, oApplyParams);
            }
        }
    } else {
        // 動的承認ノード
        for (cnt = 0, leng = configSetToApply.configDynamicNodes.length; cnt < leng; cnt++) {
            var dynamicNode = configSetToApply.configDynamicNodes[cnt];
            var defaultConfig = dynamicNode.defaultProcessTargets; 
            if(!isBlank(nodeSetting[dynamicNode.nodeId])) {
                var dynamicNodeSetting = {
                        "nodeId"           : dynamicNode.nodeId,
                        "nodeType"         : dynamicNode.nodeType,
                        "nodeName"         : dynamicNode.nodeName,
                        "nodeSettingCheck" : false,
                        "nodeSettingFlag"  : true
                };
                // 処理対象設定
                if (isArray(nodeSetting[dynamicNode.nodeId].processTargetConfigs)) {
                    defaultConfig = nodeSetting[dynamicNode.nodeId].processTargetConfigs;
                }
                // 表示制御
                dynamicNodeSetting.displayFlag = nodeSetting[dynamicNode.nodeId].displayFlag;
                // 削除制御
                if (isBoolean(nodeSetting[dynamicNode.nodeId].enableFlag)) {
                    dynamicNodeSetting.enableFlag = nodeSetting[dynamicNode.nodeId].enableFlag;
                }
                if (!isBlank(nodeSetting[dynamicNode.nodeId].searchCondition) &&
                        Procedure.imw_utils.isBlankObject(nodeSetting[dynamicNode.nodeId].searchCondition)) {
                    dynamicNodeSetting.searchCondition = nodeSetting[dynamicNode.nodeId].searchCondition;
                }
                if (isBoolean(nodeSetting[dynamicNode.nodeId].setFlag)) {
                    dynamicNodeSetting.setFlag = !isFalse(nodeSetting[dynamicNode.nodeId].setFlag);
                }
                // ノード設定画面での削除可否チェックボックスの表示制御用パラメータ
                if (nodeSetting[dynamicNode.nodeId].displayEnableCheckboxFlag === false) {
                    dynamicNodeSetting.displayEnableCheckboxFlag = false;
                }
                setDCNodeConfigToDisplayInfoAndParam(
                        dynamicNodeSetting, defaultConfig, oDisplayInfo, oApplyParams);
            } else {
                setDCNodeConfigToDisplayInfoAndParam(
                        dynamicNode, defaultConfig, oDisplayInfo, oApplyParams);
            }
        }
        // 確認ノード
        for (cnt = 0, leng = configSetToApply.configConfirmNodes.length; cnt < leng; cnt++) {
            var confirmNode = configSetToApply.configConfirmNodes[cnt];
            var defaultConfig = confirmNode.defaultConfirmTargets;
            if(!isBlank(nodeSetting[confirmNode.nodeId])) {
                var confirmNodeSetting = {
                        "nodeId"          : confirmNode.nodeId,
                        "nodeType"        : confirmNode.nodeType,
                        "nodeName"        : confirmNode.nodeName,
                        "nodeSettingFlag" : true
                };
                // 処理対象設定
                if (isArray(nodeSetting[confirmNode.nodeId].processTargetConfigs)) {
                    defaultConfig = nodeSetting[confirmNode.nodeId].processTargetConfigs;
                }
                // 表示制御
                confirmNodeSetting.displayFlag = nodeSetting[confirmNode.nodeId].displayFlag;
                if (!isBlank(nodeSetting[confirmNode.nodeId].searchCondition) &&
                        Procedure.imw_utils.isBlankObject(nodeSetting[confirmNode.nodeId].searchCondition)) {
                    confirmNodeSetting.searchCondition = nodeSetting[confirmNode.nodeId].searchCondition;
                }
                if (isBoolean(nodeSetting[confirmNode.nodeId].setFlag)) {
                    confirmNodeSetting.setFlag = !isFalse(nodeSetting[confirmNode.nodeId].setFlag);
                }
                setDCNodeConfigToDisplayInfoAndParam(
                        confirmNodeSetting, defaultConfig, oDisplayInfo, oApplyParams);
            } else {
                setDCNodeConfigToDisplayInfoAndParam(
                        confirmNode, defaultConfig, oDisplayInfo, oApplyParams);
            }
        }
    }
}

//=============================================================================
// 横配置・縦配置ノード　設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】dynamicNodeConfig: 動的処理対象者設定パラメータの横配置・縦配置ノード設定情報オブジェクト
//             configSetToApply: 横配置・縦配置ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により
//             取得した設定対象情報をもとに、横配置・縦配置ノードに関する
//             画面表示情報ならびに申請用パラメータへの情報設定を行います。
//=============================================================================
function setHVNodeConfigToDisplayInfoAndParamNodeSetting(dynamicNodeConfig, configSetToApply, oDisplayInfo, oApplyParams) {

    var cnt = 0;
    var leng = 0;
    if(oRequest.imwCallType != "0") {
        // 設定対象横配置ノード
        for (cnt = 0, leng = configSetToApply.configHorizontalNodes.length; cnt < leng; cnt++) {
            var horizontalNode = configSetToApply.configHorizontalNodes[cnt];
            if(!isBlank(dynamicNodeConfig[horizontalNode.nodeId])) {
                var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                        horizontalNode.nodeId, oApplyParams.HVNodeConfigModels, "nodeId" );
                oApplyParams.HVNodeConfigModels[index] = getHVNodeConfig(horizontalNode, dynamicNodeConfig);
                setHVNodeConfigToDisplayInfoAndParamNodeSettingDetail(
                        oApplyParams.HVNodeConfigModels[index], oDisplayInfo, oApplyParams);
            } else {
                setHVNodeConfigToDisplayInfoAndParam(
                        horizontalNode, oDisplayInfo, oApplyParams);
            }
        }

        // 設定対象縦配置ノード
        for (cnt = 0, leng = configSetToApply.configVerticalNodes.length; cnt < leng; cnt++) {
            var verticalNode = configSetToApply.configVerticalNodes[cnt];
            if(!isBlank(dynamicNodeConfig[verticalNode.nodeId])) {
                var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
                        verticalNode.nodeId, oApplyParams.HVNodeConfigModels, "nodeId" );
                oApplyParams.HVNodeConfigModels[index] = getHVNodeConfig(verticalNode, dynamicNodeConfig);
                setHVNodeConfigToDisplayInfoAndParamNodeSettingDetail(
                        oApplyParams.HVNodeConfigModels[index], oDisplayInfo, oApplyParams);
            } else {
                setHVNodeConfigToDisplayInfoAndParam(
                        verticalNode, oDisplayInfo, oApplyParams);
            }
        }
    } else {
        // 設定対象横配置ノード
        for (cnt = 0, leng = configSetToApply.configHorizontalNodes.length; cnt < leng; cnt++) {
            var horizontalNode = configSetToApply.configHorizontalNodes[cnt];
            if(!isBlank(dynamicNodeConfig[horizontalNode.nodeId])) {
                horizontalNode = getHVNodeConfig(horizontalNode, dynamicNodeConfig);
                setHVNodeConfigToDisplayInfoAndParamNodeSettingDetail(
                        horizontalNode, oDisplayInfo, oApplyParams);
            } else {
                setHVNodeConfigToDisplayInfoAndParam(
                        horizontalNode, oDisplayInfo, oApplyParams);
            }
        }
        // 設定対象縦配置ノード
        for (cnt = 0, leng = configSetToApply.configVerticalNodes.length; cnt < leng; cnt++) {
            var verticalNode = configSetToApply.configVerticalNodes[cnt];
            if(!isBlank(dynamicNodeConfig[verticalNode.nodeId])) {
                verticalNode = getHVNodeConfig(verticalNode, dynamicNodeConfig);

                setHVNodeConfigToDisplayInfoAndParamNodeSettingDetail(
                        verticalNode, oDisplayInfo, oApplyParams);
            } else {
                setHVNodeConfigToDisplayInfoAndParam(
                        verticalNode, oDisplayInfo, oApplyParams);
            }
        }
    }
}

//=============================================================================
// 横配置・縦配置ノード 設定対象画面初期表示・再表示共通申請用ベース情報生成関数
//   【 入力 】nodeConfig: 横配置・縦配置ノード設定情報オブジェクト
//             dynamicNodeConfigObj: 動的処理対象者設定パラメータJSONオブジェクト
//   【 返却 】なし
//   【 概要 】API：ApplyManager.getConfigSetToApply(WithProcessTarget)により
//             取得した設定対象情報と、動的処理対象者設定パラメータをもとに、
//             横配置・縦配置ノードに関する初期表示・再表示共通のベース情報を生成します。
//=============================================================================
function getHVNodeConfig(nodeConfig, dynamicNodeConfigObj) {
    if(!isBlank(dynamicNodeConfigObj[nodeConfig.nodeId])) {
        var tempNode = dynamicNodeConfigObj[nodeConfig.nodeId];
        var max = isNumber(tempNode.dispatchNodeMax)?tempNode.dispatchNodeMax:nodeConfig.dispachNodeMax;
        var min = isNumber(tempNode.dispatchNodeMin)?tempNode.dispatchNodeMin:nodeConfig.dispachNodeMin;
        var defaultFlag = false;
        var leng = max;
        var tempMatterNodeExpansions = new Array();
        var setFlag = true;
        var cnt = 0;
        if(isArray(tempNode.matterNodeExpansions)) {
            tempMatterNodeExpansions = tempNode.matterNodeExpansions;
            leng = tempMatterNodeExpansions.length;
        } else {
            defaultFlag = true;
            // デフォルト対象者が存在し、展開最小数>0の場合:設定済み
            // 最大展開数分の展開情報を作成する
            for (cnt = 0; cnt < max; cnt++) {
                tempMatterNodeExpansions.push(
                    {   "nodeName"                 : nodeConfig.nodeName,
                        "processTargetConfigModel" : nodeConfig.defaultProcessTargets,
                        "setFlag"                  : cnt < min
                    }
                );
            }
            setFlag = (nodeConfig.defaultProcessTargets.length > 0);
        }

        if(tempNode.displayFlag === false) {
            // 非表示の場合は、渡されたノード数で処理する
            max = leng;
            min = leng;
            tempNode.displayFlag = false;
        } else {
            if( max < leng) {
                max = leng;
            }
            tempNode.displayFlag = true;
        }

        var dynamicNodeSetting = {
                           "nodeId"               : nodeConfig.nodeId,
                           "nodeType"             : nodeConfig.nodeType,
                           "nodeName"             : nodeConfig.nodeName,
                           "dispachNodeMax"       : max,
                           "dispachNodeMin"       : min,
                           "matterNodeExpansions" : new Array(),
                           "displayFlag"          : tempNode.displayFlag,
                           "nodeSettingCheck"     : false,
                           "nodeSettingFlag"      : true
                      };

        var nodeSettingSearchConditionFlag = false;
        var nodeSettingCondition = null;
        if (!isBlank(tempNode.searchCondition) &&
                Procedure.imw_utils.isBlankObject(tempNode.searchCondition)) {
            dynamicNodeSetting.searchCondition = tempNode.searchCondition;
            nodeSettingCondition = tempNode.searchCondition;
            nodeSettingSearchConditionFlag = true;
        }

        var nodeSetting = {};
        if (!defaultFlag) {
            // 展開数が0の場合や割り当て可能ノード数の最小の値より小さい場合は未設定とする
            setFlag = ((leng > 0) && (leng >= min));
            var defaultProcessTargetsFlag = false;
            if (isArray(nodeConfig.defaultProcessTargets) && nodeConfig.defaultProcessTargets.length > 0) {
                defaultProcessTargetsFlag = true;
            }
            for (cnt = 0; cnt < leng ; cnt++) {
                tempMatterNodeExpansions[cnt].setFlag = true;
                if (isBlank(tempMatterNodeExpansions[cnt].nodeName)) {
                    tempMatterNodeExpansions[cnt].nodeName = nodeConfig.nodeName;
                }
                if (!isArray(tempMatterNodeExpansions[cnt].processTargetConfigModel)) {
                    tempMatterNodeExpansions[cnt].processTargetConfigModel = nodeConfig.defaultProcessTargets;
                    if (setFlag) {
                        setFlag = defaultProcessTargetsFlag;
                    }
                } else if (setFlag && tempMatterNodeExpansions[cnt].processTargetConfigModel.length < 1) {
                    setFlag = false;
                }
                // ノード個別の絞り込み条件設定
                if (!isBlank(tempMatterNodeExpansions[cnt].searchCondition) &&
                        Procedure.imw_utils.isBlankObject(tempMatterNodeExpansions[cnt].searchCondition)) {
                    nodeSetting["node_setting_" + (cnt+1)] = ImJson.toJSONString(tempMatterNodeExpansions[cnt].searchCondition);
                    nodeSettingSearchConditionFlag = true;
                }
            }
            // 設定済みアイコン表示制御
            if (setFlag && (leng < min)) {
                setFlag = defaultProcessTargetsFlag;
            }
            // 未設定ノード分の設定情報による補完
            for (cnt = leng; cnt < max ; cnt++) {
                tempMatterNodeExpansions.push(
                    {   "nodeName"                 : nodeConfig.nodeName,
                        "processTargetConfigModel" : nodeConfig.defaultProcessTargets,
                        "setFlag"                  : cnt < min,
                        "detailNodeId"             : null
                    }
                );
            }
        }

        dynamicNodeSetting.matterNodeExpansions = tempMatterNodeExpansions;
        dynamicNodeSetting.setFlag = setFlag;
        dynamicNodeSetting.nodeSetting = nodeSetting;
        dynamicNodeSetting.nodeSettingSearchConditionFlag = nodeSettingSearchConditionFlag;
        dynamicNodeSetting.defaultNodeSetting = nodeSettingCondition;
    }
    return dynamicNodeSetting;
}

//=============================================================================
// 動的処理対象者設定機能利用時の横配置・縦配置ノード 設定対象画面表示・申請用パラメータ設定関数
//   【 入力 】nodeConfig: 横配置・縦配置ノード設定情報オブジェクト
//             oDisplayInfo: 画面表示情報オブジェクト
//             oApplyParams: 申請用パラメータ
//   【 返却 】なし
//   【作成者】NTT DATA INTRAMART
//   【 概要 】動的処理対象者設定機能利用時の横配置・縦配置ノード 設定対象画面表示・申請用パラメータ情報をもとに、
//         横配置・縦配置ノードに関する画面表示情報設定を行います。
//=============================================================================
function setHVNodeConfigToDisplayInfoAndParamNodeSettingDetail(nodeConfig, oDisplayInfo, oApplyParams) {
    var objDispTemp = new Object();
    objDispTemp.nodeId       = nodeConfig.nodeId;
    objDispTemp.nodeType     = nodeConfig.nodeType;
    objDispTemp.nodeName     = nodeConfig.nodeName;
    objDispTemp.min          = nodeConfig.dispachNodeMin;
    objDispTemp.max          = nodeConfig.dispachNodeMax;
    // 最小設定数が1以上の場合：必須入力
    objDispTemp.isRequired   = (objDispTemp.min > 0);

    // 申請用パラメータに設定が存在するか判定
    var index = Procedure.imw_proc_utils.indexOf4ArrayWithProp(
            nodeConfig.nodeId, oApplyParams.HVNodeConfigModels, "nodeId" );
    if(index == -1) {
        // 申請用パラメータに設定
        oApplyParams.HVNodeConfigModels.push(nodeConfig);
        objDispTemp.setFlag = nodeConfig.setFlag;
    } else {
        // 対象の横配置・縦配置ノードについて、すでに設定を行っている場合
        objDispTemp.setFlag = oApplyParams.HVNodeConfigModels[index].setFlag;
    }
    if (!isFalse(nodeConfig.displayFlag)) {
        oDisplayInfo.dispFlowSettingInfo.push(objDispTemp);
    }
}
