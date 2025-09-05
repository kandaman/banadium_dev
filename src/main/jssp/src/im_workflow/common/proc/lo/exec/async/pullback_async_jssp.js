// 標準処理のjsspをロード
load('im_workflow/user/cpl_proc/pullback');

function pullbackAsync(request){
  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let codeUtil = new WorkflowCodeUtil();
  let params = request;
  let resultInfo = {
    resultFlag : false,
//    errorMessage : '',
    resultStatus : {
      message : ''
    },
    data : {
      systemMatterId : params.systemMatterId,
      userDataId : ''
    }
  };
  let acceptId = Identifier.get();
  let asyncProcessStatusData = {
    acceptId : acceptId,
    authUserCode : params.authUserCode[params.selectnode],
    executeUserCode : Contexts.getAccountContext().userCd,
    procType : codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_pbk'),
    procDate : DateTimeFormatter.format('yyyy/MM/dd HH:mm:ss.SSS', new DateTime(new Date(), SystemTimeZone.getDefaultTimeZone().data)),
    flowId : '',
    systemMatterId : params.imwSystemMatterId,
    nodeId : params.nodeId[params.selectnode],
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
    // 引戻しで失敗しました。
    resultInfo.resultStatus.message = MessageManager.getMessage('IMW.SRV.ERR.2755');
    return resultInfo;
  }
  if (result.data.length>0) {
    // 対象の案件が既に処理されたか、削除された、もしくは他ノードの非同期処理が実行中の可能性があるため、処理ができません。
    resultInfo.resultStatus.message = MessageManager.getMessage('IMW.ASYNC.CLI.WRN.3501');
    return resultInfo;
  }

  // 非同期処理状況情報登録
  result = asyncProcessWorkflow.createAsyncProcessStatusData(asyncProcessStatusData);
  if (!result.resultFlag) {
    // 引戻しで失敗しました。
    resultInfo.resultStatus.message = MessageManager.getMessage('IMW.SRV.ERR.2755');
    return resultInfo;
  }

  let jsPathString = 'im_workflow/common/proc/exec/async/pullback_async_jssp';
  let parameter = {
    param : ImJson.toJSONString(request),
    asyncProcessStatusData : ImJson.toJSONString(asyncProcessStatusData)
  };

  // 非同期処理実行
  result = asyncProcessWorkflow.execute(jsPathString, parameter, asyncProcessStatusData);

  // 非同期処理実行の判定
  if (!result.resultFlag) {
    // 引戻しで失敗しました。
    resultInfo.resultStatus.message = MessageManager.getMessage('IMW.SRV.ERR.2755');
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
    return resultInfo;
  }
  resultInfo.resultFlag = true;
  return resultInfo;
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
  logger.info('Start JS[pullback_async_jssp.js] run.');

  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let storedHttpContextId = _storedHttpContextId;
  let asyncProcessStatusData = ImJson.parseJSON(_asyncProcessStatusData);

  // Contextをロード
  asyncProcessWorkflow.loadHTTPContext(storedHttpContextId);

  // 引戻し処理実行
  let requestObject = ImJson.parseJSON(_param);
  let resultInfo = actionPullback(requestObject);
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
    asyncProcessStatusData.message = resultInfo.resultStatus.message;
    asyncProcessWorkflow.updateAsyncProcessStatusData(asyncProcessStatusData);
  } else {
    // IM-Workflowの標準処理成功
    // 非同期処理状況情報削除
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
  }

  // Contextを削除
  asyncProcessWorkflow.removeHTTPContext(storedHttpContextId);

  logger.info('Finish JS[pullback_async_jssp.js] run.');
}
