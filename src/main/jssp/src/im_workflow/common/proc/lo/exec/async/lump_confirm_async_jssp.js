// 標準処理のjsspをロード
load('im_workflow/common/proc/exec/lump_confirm_jssp');

function lumpConfirmAsync(request){
  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let codeUtil = new WorkflowCodeUtil();
  let params = request.lumpProcParams;
  let resultInfo = {
    resultFlag : false,
    errorMessage : '',
    data : {
      systemMatterId : '',
      userDataId : ''
    }
  };
  let acceptId = Identifier.get();
  let asyncProcessStatusData = {
    acceptId : acceptId,
    authUserCode : request.imwUserCode,
    executeUserCode : request.imwUserCode,
    procType : codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_lumpCnfm'),
    procDate : DateTimeFormatter.format('yyyy/MM/dd HH:mm:ss.SSS', new DateTime(new Date(), SystemTimeZone.getDefaultTimeZone().data)),
    flowId : '',
    systemMatterId : '',
    nodeId : '',
    matterNumber : '',
    matterName : '',
    procComment : request.confirmComment,
    queueId : '',
    asyncProcStatus : codeUtil.getEnumCodeAsyncProcessStatus('asyncProcSts_Running'),
    message : '',
    subMessage : ''
  };
  // 非同期処理状況情報登録
  let result = asyncProcessWorkflow.createAsyncProcessStatusData(asyncProcessStatusData);
  if (!result.resultFlag) {
    // 確認に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3612');
    return resultInfo;
  }

  let jsPathString = 'im_workflow/common/proc/exec/async/lump_confirm_async_jssp';
  let parameter = {
    param : ImJson.toJSONString(request),
    asyncProcessStatusData : ImJson.toJSONString(asyncProcessStatusData)
  };

  // 非同期処理実行
  result = asyncProcessWorkflow.execute(jsPathString, parameter, asyncProcessStatusData);

  // 非同期処理実行の判定
  if (!result.resultFlag) {
    // 確認に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3612');
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
  logger.info('Start JS[lump_confirm_async_jssp.js] run.');

  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let storedHttpContextId = _storedHttpContextId;
  let asyncProcessStatusData = ImJson.parseJSON(_asyncProcessStatusData);

  // Contextをロード
  asyncProcessWorkflow.loadHTTPContext(storedHttpContextId);

  // 一括確認処理実行
  let requestObject = ImJson.parseJSON(_param);
  let resultInfo = lumpConfirm(requestObject);
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
    let errParam = resultInfo.errorLumpConfirmParam;
    asyncProcessStatusData.systemMatterId = errParam.systemMatterId;
    asyncProcessStatusData.nodeId = errParam.nodeId;
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
  asyncProcessWorkflow.removeHTTPContext(storedHttpContextId);

  logger.info('Finish JS[lump_confirm_async_jssp.js] run.');
}
