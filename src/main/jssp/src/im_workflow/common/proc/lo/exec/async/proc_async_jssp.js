// 標準処理のjsspをロード
load('im_workflow/common/proc/exec/proc_jssp');

function approveAsync(request){
  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let codeUtil = new WorkflowCodeUtil();
  let params = request.procParams;
  let resultInfo = {
    resultFlag : false,
    errorMessage : '',
    data : {
      systemMatterId : params.systemMatterId,
      userDataId : ''
    }
  };
  let acceptId = Identifier.get();
  let asyncProcessStatusData = {
    acceptId : acceptId,
    authUserCode : params.authUserCode,
    executeUserCode : params.executeUserCode,
    procType : getProcessType(params.processType),
    procDate : DateTimeFormatter.format('yyyy/MM/dd HH:mm:ss.SSS', new DateTime(new Date(), SystemTimeZone.getDefaultTimeZone().data)),
    flowId : '',
    systemMatterId : params.systemMatterId,
    nodeId : params.nodeId,
    matterNumber : params.matterNumber,
    matterName : params.matterName,
    procComment : params.processComment,
    queueId : '',
    asyncProcStatus : codeUtil.getEnumCodeAsyncProcessStatus('asyncProcSts_Running'),
    message : '',
    subMessage : ''
  };
  // 非同期処理状況情報の存在確認
  let searchCondition = new ListSearchConditionNoMatterProperty();
  searchCondition.setCount('0');
  searchCondition.setOffset('0');
  searchCondition.addCondition(AsyncProcessWorkflow.SYSTEM_MATTER_ID, asyncProcessStatusData.systemMatterId, ListSearchCondition.OP_EQ);
  searchCondition.addCondition(AsyncProcessWorkflow.ASYNC_PROC_STATUS, codeUtil.getEnumCodeAsyncProcessStatus("asyncProcSts_Running"), ListSearchCondition.OP_EQ);

  let result = asyncProcessWorkflow.getAsyncProcessStatusDataList(searchCondition);
  if (!result.resultFlag) {
    // 処理に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3546');
    return resultInfo;
  }
  if (result.data.length>0) {
    // 対象の案件が既に処理されたか、削除された、もしくは他ノードの非同期処理が実行中の可能性があるため、処理ができません。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.ASYNC.CLI.WRN.3501');
    return resultInfo;
  }

  // 非同期処理状況情報登録
  result = asyncProcessWorkflow.createAsyncProcessStatusData(asyncProcessStatusData);
  if (!result.resultFlag) {
    // 処理に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3546');
    return resultInfo;
  }

  let jsPathString = 'im_workflow/common/proc/exec/async/proc_async_jssp';
  let parameter = {
    param : ImJson.toJSONString(request),
    asyncProcessStatusData : ImJson.toJSONString(asyncProcessStatusData)
  };

  // 非同期処理実行
  result = asyncProcessWorkflow.execute(jsPathString, parameter, asyncProcessStatusData, params.tempDirKey);

  // 非同期処理実行の判定
  if (!result.resultFlag) {
    // 処理に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3546');
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
    return resultInfo;
  }
  resultInfo.resultFlag = true;
  return resultInfo;
}

function getProcessType(paramProcType) {
  let codeUtil = new WorkflowCodeUtil();
  let processType = '';
  // jp.co.intra_mart.foundation.workflow.code.ProcessTypeから
  // jp.co.intra_mart.foundation.workflow.code.AsyncProcessTypeに
  // 変換します。
  if (codeUtil.getEnumCodeProcessType('procTyp_drf')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_drf');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_apy')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_drf');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_rapy')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_rapy');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_dct')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_dct');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_apr')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_apr');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_apre')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_apre');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_deny')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_deny');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_rsv')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_rsv');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_rsvc')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_rsvc');
  } else if (codeUtil.getEnumCodeProcessType('procTyp_sbk')==paramProcType) {
    processType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_sbk');
  }
  return processType;
}

// ここから非同期

let _param;
let _storedHttpContextId;
let _asyncProcessStatusData;

function setParameter(parameter) {
  _param = parameter.param;
  _storedHttpContextId = parameter.storedHttpContextId;
  _asyncProcessStatusData = parameter.asyncProcessStatusData;
}

function run(){
  let logger = Logger.getLogger();
  logger.info('Start JS[proc_async_jssp.js] run.');

  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let storedHttpContextId = _storedHttpContextId;
  let asyncProcessStatusData = ImJson.parseJSON(_asyncProcessStatusData);

  // Contextをロード
  asyncProcessWorkflow.loadHTTPContext(storedHttpContextId);

  // 承認（否認、差戻し、再申請、など）処理実行
  let requestObject = ImJson.parseJSON(_param);
  let resultInfo = approve(requestObject);
  if (!resultInfo.resultFlag) {
    let codeUtil = new WorkflowCodeUtil();
    let searchCondition = new ListSearchConditionNoMatterProperty();
    searchCondition.setCount('0');
    searchCondition.setOffset('0');
    searchCondition.addCondition(AsyncProcessWorkflow.ACCEPT_ID, asyncProcessStatusData.acceptId, ListSearchCondition.OP_EQ);
    searchCondition.addCondition(AsyncProcessWorkflow.ASYNC_PROC_STATUS, codeUtil.getEnumCodeAsyncProcessStatus("asyncProcSts_Running"), ListSearchCondition.OP_EQ);

    let result = asyncProcessWorkflow.getAsyncProcessStatusDataList(searchCondition);
    if (!result.resultFlag) {
      return;
    }
    if (result.data.length!=1) {
      return;
    }
    asyncProcessStatusData.asyncProcStatus = codeUtil.getEnumCodeAsyncProcessStatus('asyncProcSts_Error');
    asyncProcessStatusData.queueId = result.data.queueId;
    asyncProcessStatusData.message = resultInfo.errorMessage;
    asyncProcessWorkflow.updateAsyncProcessStatusData(asyncProcessStatusData);
  } else {
    // IM-Workflowの標準処理成功
    // 非同期処理状況情報削除
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
  }

  // Contextを削除
  asyncProcessWorkflow.removeHTTPContext(storedHttpContextId, requestObject.procParams.tempDirKey);

  logger.info('Finish[proc_async_jssp.js] JS run.');
}
