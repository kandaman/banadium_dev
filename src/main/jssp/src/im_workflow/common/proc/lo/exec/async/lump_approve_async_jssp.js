// 標準処理のjsspをロード
load('im_workflow/common/proc/exec/lump_approve_jssp');

function lumpApproveAsync(request){
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
  let asyncProcessStatusDataList = [];
  let i;
  let procType = codeUtil.getEnumCodeAsyncProcessType('asyncProcTyp_lumpApr');
  let asyncProcStatus = codeUtil.getEnumCodeAsyncProcessStatus('asyncProcSts_Running');
  let sysDatetime = DateTimeFormatter.format('yyyy/MM/dd HH:mm:ss.SSS', new DateTime(new Date(), SystemTimeZone.getDefaultTimeZone().data));
  let processComment = request.processComment;
  for (i=0; i<params.length; i++) {
    let acceptId = Identifier.get();
    let asyncProcessStatusData = {
      systemMatterId : params[i].systemMatterId,
      nodeId : params[i].nodeId,
      acceptId : acceptId,
      procType : procType,
      procDate : sysDatetime,
      authUserCode : request.imwAuthUserCode,
      executeUserCode : request.imwUserCode,
      matterNumber : '',
      matterName : '',
      procComment : processComment,
      queueId : '',
      asyncProcStatus : asyncProcStatus,
      message : '',
      subMessage : ''
    };
    asyncProcessStatusDataList[asyncProcessStatusDataList.length] = asyncProcessStatusData;
  }

  // 非同期処理状況情報の存在確認
  for (i=0; i<asyncProcessStatusDataList.length; i++) {
    let asyncProcessStatusData = asyncProcessStatusDataList[i];
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
  }
  // 非同期処理状況情報登録
  let result = asyncProcessWorkflow.createAsyncProcessStatusData(asyncProcessStatusDataList);
  if (!result.resultFlag) {
    // 処理に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3546');
    return resultInfo;
  }

  let jsPathString = 'im_workflow/common/proc/exec/async/lump_approve_async_jssp';
  let parameter = {
    param : ImJson.toJSONString(request),
    asyncProcessStatusDataList : ImJson.toJSONString(asyncProcessStatusDataList)
  };

  // 非同期処理実行
  result = asyncProcessWorkflow.execute(jsPathString, parameter, asyncProcessStatusDataList);

  // 非同期処理実行の判定
  if (!result.resultFlag) {
    // 処理に失敗しました。
    resultInfo.errorMessage = MessageManager.getMessage('IMW.CLI.WRN.3546');
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusDataList);
    return resultInfo;
  }
  resultInfo.resultFlag = true;
  return resultInfo;
}

// ここから非同期

let _param;
let _storedHttpContextId;
let _asyncProcessStatusDataList;

function setParameter(parameter) {
  _param = parameter.param;
  _storedHttpContextId = parameter.storedHttpContextId;
  _asyncProcessStatusDataList = parameter.asyncProcessStatusDataList;
}

function run(){
  let logger = Logger.getLogger();
  logger.info('Start JS[lump_approve_async_jssp.js] run.');

  let asyncProcessWorkflow = new AsyncProcessWorkflow();
  let storedHttpContextId = _storedHttpContextId;
  let asyncProcessStatusDataList = ImJson.parseJSON(_asyncProcessStatusDataList);

  // Contextをロード
  asyncProcessWorkflow.loadHTTPContext(storedHttpContextId);

  // 一括処理実行
  let requestObject = ImJson.parseJSON(_param);
  let resultInfo = lumpApprove(requestObject);
  if (!resultInfo.resultFlag) {
    let codeUtil = new WorkflowCodeUtil();
    let searchCondition = new ListSearchConditionNoMatterProperty();
    searchCondition.setCount('0');
    searchCondition.setOffset('0');
    searchCondition.addCondition(AsyncProcessWorkflow.ACCEPT_ID, asyncProcessStatusDataList[0].acceptId, ListSearchCondition.OP_EQ);
    searchCondition.addCondition(AsyncProcessWorkflow.ASYNC_PROC_STATUS, codeUtil.getEnumCodeAsyncProcessStatus("asyncProcSts_Running"), ListSearchCondition.OP_EQ);

    let result = asyncProcessWorkflow.getAsyncProcessStatusDataList(searchCondition);
    if (!result.resultFlag) {
      return;
    }
    if (result.data.length!=1) {
      return;
    }
    let queueId = result.data.queueId;
    let errParam = resultInfo.errorLumpProcParam;
    let errorPoint = false;
    let errorCode = codeUtil.getEnumCodeAsyncProcessStatus('asyncProcSts_Error');
    for (var i=0; i<asyncProcessStatusDataList.length; i++) {
      var asyncProcessStatusData = asyncProcessStatusDataList[i];
      if (errorPoint) {
        asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
        continue;
      }
      if (asyncProcessStatusData.systemMatterId === errParam.systemMatterId && asyncProcessStatusData.nodeId === errParam.nodeId) {
        asyncProcessStatusData.asyncProcStatus = errorCode;
        asyncProcessStatusData.message = resultInfo.errorMessage;
        asyncProcessStatusData.queueId = queueId;
        asyncProcessWorkflow.updateAsyncProcessStatusData(asyncProcessStatusData);
        errorPoint = true;
        continue;
      }
      asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusData);
    }
  } else {
    // IM-Workflowの標準処理成功
    // 非同期処理状況情報削除
    asyncProcessWorkflow.deleteAsyncProcessStatusData(asyncProcessStatusDataList);
  }

  // Contextを削除
  asyncProcessWorkflow.removeHTTPContext(storedHttpContextId);

  logger.info('Finish JS[lump_approve_async_jssp.js] run.');
}
