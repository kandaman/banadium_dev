//==============================================================================
//    アクション処理プログラム テンプレート
//
//        【 入力 】 parameter                   : ワークフローパラメータオブジェクト
//                   parameter.loginGroupId      : ログイングループID
//                   parameter.localeId          : ロケールID
//                   parameter.targetLocales     : ターゲットロケールID
//                   parameter.contentsId        : コンテンツID
//                   parameter.contentsVersionId : コンテンツバージョンID
//                   parameter.routeId           : ルートID
//                   parameter.routeVersionId    : ルートバージョンID
//                   parameter.flowId            : フローID
//                   parameter.flowVersionId     : フローバージョンID
//                   parameter.applyBaseDate     : 申請基準日
//                   parameter.processDate       : 処理日/到達日
//                   parameter.systemMatterId    : システム案件ID
//                   parameter.userDataId        : ユーザデータID
//                   parameter.matterName        : 案件名
//                   parameter.matterNumber      : 案件番号
//                   parameter.priorityLevel     : 優先度
//                   parameter.parameter         : 実行プログラムパス
//                   parameter.actFlag           : 代理フラグ
//                   parameter.nodeId            : ノードID
//                   parameter.nextNodeIds       : 移動先(次ノード)ノードID [差戻し、引戻し、案件操作時に設定されます。]
//                   parameter.authUserCd        : 処理権限者コード
//                   parameter.execUserCd        : 処理実行者コード
//                   parameter.resultStatus      : 処理結果ステータス
//                   parameter.authCompanyCode   : 権限会社コード
//                   parameter.authOrgzSetCode   : 権限組織セットコード
//                   parameter.authOrgzCode      : 権限組織コード
//                   parameter.processComment    : 処理コメント
//                   parameter.lumpProcessFlag   : 一括処理フラグ
//                   parameter.autoProcessFlag   : 自動処理フラグ [到達処理で自動承認やバッチで自動処理される時に設定されます。]
//                   userParameter               : リクエストパラメータオブジェクト
//
//        【返却値】 result.resultFlag           : 結果フラグ     [true:成功/false:失敗]
//                   result.message              : 結果メッセージ [結果フラグが失敗の場合のみ]
//                   result.data                 : 案件番号       [サイズ：20バイト
//                                                                 申請/再申請/申請(一時保存案件)/申請(未申請状態案件)の場合のみ
//                                                                 null以外の場合に案件番号を上書きします。]
//
//        【 詳細 】 このプログラム中ではDBトランザクションを張らないで下さい。
//
//==============================================================================

// 申請
function apply(parameter,userParameter) {
    var oResult = WorkflowNumberingManager.getNumber();
    if (!oResult.resultFlag) {
        result = {
                  "resultFlag" : false,
                  "message"    : "",
                  "data"       : null
                 }
        return result;
    }
    var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : oResult.data
                 };
    return result;
}

// 再申請
function reapply(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : null
                 };
    return result;
}

// 申請(一時保存案件)
function applyFromTempSave(parameter,userParameter) {

    var oResult = WorkflowNumberingManager.getNumber();
    if (!oResult.resultFlag) {
        result = {
                  "resultFlag" : false,
                  "message"    : "",
                  "data"       : null
                 }
        return result;
    }
    var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : oResult.data
                 };
    return result;
}

// 申請(未申請状態案件)
function applyFromUnapply(parameter,userParameter) {
    var oResult = WorkflowNumberingManager.getNumber();
    if (!oResult.resultFlag) {
        result = {
                  "resultFlag" : false,
                  "message"    : "",
                  "data"       : null
                 }
        return result;
    }
    var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : oResult.data
                 };
    return result;
}

// 取止め
function discontinue(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 引戻し
function pullBack(parameter,userParameter) {

	Constant.load("lo/common_libs/lo_const");
    
	var result = {
	              "resultFlag" : true,
	              "message"    : ""
	             };
	
	var item_status_cd = userParameter.item_status_cd;
	
	switch(parameter.nextNodeIds[0]){
	case Constant.LO_NODE_APPLY:
		//戻し先が入力ノードの場合は、一時保存に更新
		item_status_cd = Constant.LO_STATUS_ICHIJI_HOZON;//一時保存
		break;
	case Constant.LO_NODE_KIAN:
		//戻し先が起案ノードの場合は、受付中に更新
		item_status_cd = Constant.LO_STATUS_TEISHUTSU;//受付中
		break;	
	default:
		//戻し先が起案ノードの場合は、受付中に更新
		item_status_cd = Constant.LO_STATUS_SHINSEI;//社内審査中
		break;	

	}	
	             
	// ステータスを更新
	var param = {
		bunsho_id : parameter.matterName,
		kawari_status: item_status_cd
	};
	
	var ret = statusUpdate(parameter,param);
	if (ret.error){
		result.resultFlag = false;
	    return result;
	}
	
	userParameter.item_matterName = parameter.matterName;
	userParameter.item_tempu_files ={};
	userParameter.item_proc_name = "取戻";
	userParameter.item_comment = "取戻しを行いました。";
	
	//コメント登録
    ret = setComment(parameter,userParameter);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }

	
    return result;
}

// 差戻し後引戻し
function sendBackToPullBack(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
    var item_status_cd = userParameter.item_status_cd;
	
	switch(parameter.nextNodeIds[0]){
	case Constant.LO_NODE_APPLY:
		//戻し先が入力ノードの場合は、一時保存に更新
		item_status_cd = Constant.LO_STATUS_ICHIJI_HOZON;//一時保存
		break;
	case Constant.LO_NODE_KIAN:
		//戻し先が起案ノードの場合は、受付中に更新
		item_status_cd = Constant.LO_STATUS_TEISHUTSU;//受付中
		break;	
	default:
		//戻し先が起案ノードの場合は、受付中に更新
		item_status_cd = Constant.LO_STATUS_SHINSEI;//社内審査中
		break;
	}	
	             
	// ステータスを更新
	var param = {
		bunsho_id : parameter.matterName,
		kawari_status: item_status_cd
	};
	
	var ret = statusUpdate(parameter,param);
	if (ret.error){
		result.resultFlag = false;
	    return result;
	}
    
    userParameter.item_matterName = parameter.matterName;
	userParameter.item_tempu_files ={};
	userParameter.item_proc_name = "取戻";
	userParameter.item_comment = "取戻しを行いました。";
	
	//コメント登録
    ret = setComment(parameter,userParameter);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }
    
    return result;
}

// 承認
function approve(parameter,userParameter) {
    Constant.load("lo/common_libs/lo_const");
    
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
                 
    // 企画のステータスを更新(受付待ち)
	var param = {
		bunsho_id : userParameter.item_matterName,
		kawari_status: userParameter.item_status_cd
	};
	// 社内審査中に設定する
	param.kawari_status = Constant.LO_STATUS_SHINSEI;
	// 動的承認ノードの選択状態によって、社内承認OK：11に変更する
	var nodeList = [];
	if(parameter.nodeId == Constant.LO_NODE_KIAN) {
		// 起案時は承認者の設定が取得できないためパラメータから確認する
		var itemApprUser = userParameter.item_appr_user;
		var nodeList = [];
		nodeList.push("appr_1");
		nodeList.push("appr_2");
		nodeList.push("appr_3");
		nodeList.push("appr_4");
		nodeList.push("appr_5");
		var apprSettingedFlg = false;
		for (var idx = 0; idx < nodeList.length; idx++) {
			var userList = itemApprUser[nodeList[idx]];
			if (userList && userList.length > 0) {
				for (var uIdx = 0; uIdx < userList.length; uIdx++) {
					if (userList[uIdx] && userList[uIdx] != '') {
						apprSettingedFlg = true;
						break;
					}
				}
			}
			if (apprSettingedFlg) {
				break;
			}
		}
		if (!apprSettingedFlg) {
			param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
		}
		
		//param.kian_sha_id = parameter.execUserCd;
		//param.kian_sha_nm = 
		
		Logger.getLogger().info('parameter '+ ImJson.toJSONString(parameter, true));    
		
		
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_1) {
		nodeList.push(Constant.LO_NODE_APPR_2);
		nodeList.push(Constant.LO_NODE_APPR_3);
		nodeList.push(Constant.LO_NODE_APPR_4);
		nodeList.push(Constant.LO_NODE_APPR_5);
		if (hasNodeSetting(parameter.systemMatterId, nodeList)) {
			param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
		}
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_2) {
		nodeList.push(Constant.LO_NODE_APPR_3);
		nodeList.push(Constant.LO_NODE_APPR_4);
		nodeList.push(Constant.LO_NODE_APPR_5);
		if (hasNodeSetting(parameter.systemMatterId, nodeList)) {
			param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
		}
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_3) {
		nodeList.push(Constant.LO_NODE_APPR_4);
		nodeList.push(Constant.LO_NODE_APPR_5);
		if (hasNodeSetting(parameter.systemMatterId, nodeList)) {
			param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
		}
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_4) {
		nodeList.push(Constant.LO_NODE_APPR_5);
		if (hasNodeSetting(parameter.systemMatterId, nodeList)) {
			param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
		}
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_5) {
		param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
	} else if(userParameter.imwNodeId == 'lo_node_last_confirm') {
		param.kawari_status = Constant.LO_STATUS_KANRYO;
	}
	
    var ret = statusUpdate(parameter,param);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }
    //コメント登録
    ret = setComment(parameter,userParameter);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }

    //メール送信
    if (result.resultFlag){
	    // 起案(BNE担当)の場合
	    if (userParameter.imwNodeId == 'lo_node_kian'){
	        // メール通知先設定
	        setMailuser(userParameter);

	        // メール送信用パラメータ作成
	        var mailParam = {
	        	ticket_id : userParameter.item_matterName, // 文書番号
	        	comment : userParameter.item_comment,      //コメント
	        	execUserCd : parameter.execUserCd,          //実行者コード
	        	mail_id : "",     //メールid 確認依頼
	        	to_address : []   //送信先アドレス
//	        	to_address : [],   //送信先アドレス
//	        	kawariInfo : kawariObj
	        }
	
	        //　起案通知メール送信------------------
	        //送信先アドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KIAN);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_PRE; //メールid 事前通知依頼
	        
	        // 送信
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	
	        
	    }// 起案(BNE担当)の場合、ここまで
	    
	    
	    // 完了(BNE最終担当)の場合
	    if (userParameter.imwNodeId == 'lo_node_last_confirm'){
	        // メール送信用パラメータ作成
	        var mailParam = {
	        	ticket_id : userParameter.item_matterName, // 文書番号
	        	comment : userParameter.item_comment,      //コメント
	        	execUserCd : parameter.execUserCd,          //実行者コード
	        	mail_id : "",     //メールid 確認依頼
	        	to_address : []   //送信先アドレス
	        }
	
	    	//　入力者へ完了通知先メール送信--------------------------------------------
			// 文書idとノードidから申請者のメールアドレス取得
	    	var address = Content.executeFunction("lo/common_libs/lo_send_mail",
					"getNodeUserAddressAll",userParameter.item_matterName);
	    	
			mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
			
	    	//　完了通知先メール送信--------------------------------------------
	    	//　完了通知グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_END);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	
	    	//　契約確認メール送信--------------------------------------------
	    	// 契約担当グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KEIYAKU);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_KEIYAKU; //メールid 契約確認
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	        
	    	//　計上担当メール送信--------------------------------------------
	    	// 計上担当グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KEIJOU);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);

	    }    	

    }

    return result;
}

// 承認終了
function approveEnd(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 否認
function deny(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
    // 代わりWFのステータスを更新
	var param = {
		bunsho_id : userParameter.item_matterName,
		kawari_status: userParameter.item_status_cd
	};
    var ret = statusUpdate(parameter,param);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }
    //コメント登録
    ret = setComment(parameter,userParameter);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }
    
    //　入力者へ確認メール送信--------------------------------------------
    if (result.resultFlag){
    	// 定義ファイル読み込み
        Constant.load("lo/common_libs/lo_const");

    	// メール送信用パラメータ作成
        var mailParam = {
        	ticket_id : userParameter.item_matterName, // 文書番号
        	comment : userParameter.item_comment,      //コメント
        	execUserCd : parameter.execUserCd,          //実行者コード
        	mail_id : "",     //メールid
        	to_address : []   //送信先アドレス
        }
    	// 文書idとノードidから申請者のメールアドレス取得
    	var address = Content.executeFunction("lo/common_libs/lo_send_mail",
    			"getNodeUserAddress",userParameter.item_matterName,Constant.LO_NODE_APPLY);
        mailParam.to_address = address; //送信先アドレス設定
        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_END_LICENSEE; //メールid 完了通知(ライセンシー用)
        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
    }
                 
    return result;
}

// 差戻し
function sendBack(parameter,userParameter) {

    Constant.load("lo/common_libs/lo_const");
                 
	var result = {
	              "resultFlag" : true,
	              "message"    : ""
	             };
	
	var item_status_cd = userParameter.item_status_cd;
	
	var param = {
		bunsho_id : parameter.matterName,
		kawari_status: item_status_cd
	};

	//差し戻し先によってステータスを変える
	switch(parameter.nextNodeIds[0]){
	case Constant.LO_NODE_APPLY:
		//戻し先が入力ノードの場合は、戻し元のノードに応じてステータスを変更
		if(parameter.nodeId == Constant.LO_NODE_KIAN){
			param.kawari_status = Constant.LO_STATUS_SHUSEI_IRAI;//修正依頼
		}else{
			param.kawari_status = Constant.LO_STATUS_SASHIMODOSHI;//差し戻し
		}		
		
		break;
	case Constant.LO_NODE_KIAN:
		//戻し先が起案ノードの場合は、差し戻しに更新
		param.kawari_status = Constant.LO_STATUS_SASHIMODOSHI;//差し戻し
		param.kian_sha_id = null;
		param.kian_sha_nm = null;
		break;	
	default:
		//今回の仕様上不要だが、今後のために実装しておく
		param.kawari_status = Constant.LO_STATUS_SHINSEI;//社内審査中
		break;		
	}
	
	// 企画のステータスを更新(受付待ち)
	var param = {
		bunsho_id : parameter.matterName,
		kawari_status: item_status_cd
	};
	
	var ret = statusUpdate(parameter,param);
	if (ret.error){
		result.resultFlag = false;
	    return result;
	}
    
    //コメント登録
    ret = setComment(parameter,userParameter);

    if (ret.error){
    	result.resultFlag = false;
        return result;
    }

    return result;
}

// 保留
function reserve(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 保留解除
function reserveCancel(parameter,userParameter) {
    
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 案件操作
function matterHandle(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 一時保存（新規登録）
function tempSaveCreate(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 一時保存（更新）
function tempSaveUpdate(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 一時保存（削除）
function tempSaveDelete(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

	
/**
 * 案件プロパティを登録します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function createMatterProperty(args, userParameter){
    var userProperties = new UserActvMatterPropertyValue();
    var properties = [];

    // FIXME プロパティのキーと値は必要に応じて内容を変更してください
    properties.push({
        matterPropertyKey : 'matterProperty',
        matterPropertyValue : '案件プロパティ1',
        userDataId : args.userDataId
    });

    // 案件プロパティを作成します
    return userProperties.createMatterProperty(properties);
}

/**
 * 案件プロパティを更新します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function updateMatterProperty(args, userParameter){
    var userProperties = new UserActvMatterPropertyValue();
    var properties = [];

    // FIXME プロパティのキーと値は必要に応じて内容を変更してください
    properties.push({
        matterPropertyKey : 'matterProperty',
        matterPropertyValue : '案件プロパティ2',
        userDataId : args.userDataId
    });

    // 案件プロパティを更新します
    return userProperties.updateMatterProperty(properties);
}

/**
 * 案件プロパティを削除します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function deleteMatterProperty(args, userParameter){
    // 案件プロパティを削除します
    return new UserActvMatterPropertyValue().deleteMatterProperty([{
        userDataId : args.userDataId
    }]);
}	
/**
 * IM-Workflow API利用時にメッセージの取得を行います。
 * @type String
 * @param {ResultStatusInfo} resultStatus 
 * @return 処理結果
 */
function getMessage(resultStatus){
    if(resultStatus == null) return '';
    if(resultStatus.messageId == null) return '';
    var tenantInfoManager = new TenantInfoManager();
    var result = tenantInfoManager.getTenantInfo(true);
    if(result.error) {
        return '';
    }
    var tenantInfo = result.data;
    return WorkflowCommonUtil.getMessage(tenantInfo.locale, resultStatus.messageId, resultStatus.messageArgs);
}	

/**
 * 代わりWFステータス更新
 * @param {object} 更新値
 * @returns {object} 結果
 */
function statusUpdate(args,param) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userCd = userContext.userProfile.userCd;
	var userName = userContext.userProfile.userName;

	// 戻り値
	var ret = {
		error : false,
		message : ""
	};
	
	// DB接続
	var db = new TenantDatabase();
	//画面の入力値をDB用オブジェクトに格納
	// todo 必要な項目を追加する
	var dataSet = {
		kawari_status : param.kawari_status
	};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	
	// 修正依頼にBNE担当者と確認日をリセット
	if (param.kawari_status == '3') {
		dataSet.kakunin_bi = null;
	}
	// todo 暫定対応 BNE担当者設定
	if (param.kawari_status == '4' && args.nodeId == 'lo_node_apply'){
		// ユーザ情報取得
		dataSet.kakunin_bi = dataSet.koushin_bi;
	}
	
	// 起案者をテーブルに登録
	if (args.nodeId == 'lo_node_kian'){
		// ユーザ情報取得
		dataSet.kian_sha_id = dataSet.kian_sha_id = userCd;
		dataSet.kian_sha_nm = dataSet.kian_sha_nm = userName;
	}
	
	/* todo 影響が大きいため保留
	// 承認時、承認２が存在する場合はステータスを審査中のままにしておく
	if (param.kikaku_status == '6' && args.nodeId == 'lo_node_appr_1'){
	 	// ノード情報取得
		var actvMatter = new ActvMatterNode('ja', args.systemMatterId);
	    var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_2);
		if (result.data && result.data.length > 0){
			dataSet.kikaku_status = '4';
		}
	}
	*/

	// update条件の値を配列で持つ
	var whereObject = [DbParameter.string(param.bunsho_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_kawari', dataSet,'bunsho_id = ?',whereObject);
	if (result.error) {
			ret.error = true;
			ret.message="登録失敗";
			return ret;
	}
	
	// 完了以外の場合、契約内容確認への登録を実施しない
	if (param.kawari_status != Constant.LO_STATUS_KANRYO) {
		return ret;
	}

	var kawariRet = db.select("SELECT * FROM lo_t_kawari WHERE bunsho_id = ?", whereObject, 0);
	var kawariData = kawariRet.data[0];
	
	// 契約種別の取得
	var keiyakuCls = "";

	// 文書種別および企画種別による契約チケット作成判定
	if (!kawariData.bunsho_cls || kawariData.bunsho_cls == "" || kawariData.bunsho_cls == null) {
		// 文書種別が不明の場合は契約チケットを作成しない
		return ret;
	} else if (kawariData.bunsho_cls == Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL) {
		// ライセンスプロポーサルは契約チケットを作成しない
		return ret;
	} else if (kawariData.bunsho_cls == Constant.LO_DOC_CLS_KAWARI_KIKAKU) {
		// 代わり企画の場合
		if (!kawariData.kikaku_shubetsu_cd || kawariData.kikaku_shubetsu_cd == "" || kawariData.kikaku_shubetsu_cd == null) {
			// 企画種別が不明の場合は契約チケットを作成しない
			return ret;
		} else if (kawariData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_MUSIC &&
				kawariData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_EVENT) {
			// 企画種別が楽曲でもイベントでもない場合は契約チケットを作成しない
			return ret;
		}
		
		// 契約種別を会社マスタから取得する
		keiyakuCls = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeiyakuCls", kawariData.kaisha_id);

	} else if (kawariData.bunsho_cls == Constant.LO_DOC_CLS_KAWARI_KYODAKU) {
		// 代わり許諾の場合
		if (!kawariData.kyodaku_cls || kawariData.kyodaku_cls == "" || kawariData.kyodaku_cls == null ||
				!kawariData.keiyaku_cls || kawariData.keiyaku_cls == "" || kawariData.keiyaku_cls == null) {
			// 文書種別が許諾の場合、許諾種別または契約種別が不明の場合は契約チケットを作成しない
			return ret;
		}
		
		// 契約種別を許諾トランから取得する
		keiyakuCls = kawariData.keiyaku_cls;
	}

	var recipients = [];
	var keiyakuStatus;
	var toKeijoTantoFlg = false;
	
	if (kawariData.bunsho_cls == Constant.LO_DOC_CLS_KAWARI_KYODAKU) {
		if (kawariData.kyodaku_cls == Constant.LO_KYODAKU_SHUBETSU_ADD) {
			// 計上担当グループを担当にする
			toKeijoTantoFlg = true;
		}
	}
	
	if (toKeijoTantoFlg) {
		// 計上担当GがToの場合は、Ccに契約担当グループを設定
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO,
			targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP,
			publicGroupSetCd : Constant.LO_GROUP_SET_CD, // パブリックグループセットコード
			publicGroupCd : Constant.LO_GROUP_CD_ACCOUNT // パブリックグループコード
		});
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_CC,
			targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP,
			publicGroupSetCd : Constant.LO_GROUP_SET_CD, // パブリックグループセットコード
			publicGroupCd : Constant.LO_GROUP_CD_CONTRACT // パブリックグループコード
		});
		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_ACCT_REQUEST;
	} else {
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO,
			targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP,
			publicGroupSetCd : Constant.LO_GROUP_SET_CD, // パブリックグループセットコード
			publicGroupCd : Constant.LO_GROUP_CD_CONTRACT // パブリックグループコード
		});
		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	}
	
	var keiyakuNaiyoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KEIYAKU);

	// 日付を文字列へ変換
	var tempKyodakuKikanFrom;
	var tempKyodakuKikanTo;

	var keiyakuNaiyoData = {
		keiyaku_naiyo_id : keiyakuNaiyoId,
		keiyaku_cls : keiyakuCls,
		keiyaku_naiyo_nm : kawariData.bunsho_nm,
		keiyaku_status : keiyakuStatus,
		keiyaku_kaishi_bi : Content.executeFunction("lo/common_libs/lo_common_fnction", "getDateObj", kawariData.kyodaku_kikan_from, "/"),
		keiyaku_manryo_bi : kawariData.kyodaku_kikan_to,
		saiteihosho_ryo : kawariData.saiteihosho_ryo_kyodakuryo,
		sozai_seisaku_hi : kawariData.sozai_hi,
		kaisha_id : kawariData.kaisha_id,
		kaisha_nm : kawariData.kaisha_nm
	};
// TODO:ライセンシーの情報は会社名しか持っていないため、フローから情報を取得する必要なし
//	var taskHistories = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveWorkflowTaskHistory", [param.bunsho_id]);
//	for (var historyKey in taskHistories.data) {
//		var taskHistory = taskHistories.data[historyKey];
//		if (taskHistory.node_id == Constant.LO_NODE_APPLY) {
//			keiyakuNaiyoData.kaisha_id = taskHistory.auth_company_code;
//			keiyakuNaiyoData.kaisha_nm = taskHistory.auth_company_name;
//			keiyakuNaiyoData.busyo_id = taskHistory.auth_orgz_code;
//			keiyakuNaiyoData.busyo_nm = taskHistory.auth_orgz_name;
//			keiyakuNaiyoData.licensee_keiyaku_tanto_id = taskHistory.execute_user_code;
//			keiyakuNaiyoData.licensee_keiyaku_tanto_nm = taskHistory.execute_user_name;
//			break;
//		}
//	}

	// 契約書送付先件数を確認
	var keiyakushoSofusakiList = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakushoSofusakiList", keiyakuNaiyoData.kaisha_id);
	if (keiyakushoSofusakiList.countRow == 1) {
		// 1件のみの場合、担当を設定
		keiyakuNaiyoData.keiyakusho_sofusaki_tanto_id = keiyakushoSofusakiList.data[0].tanto_id;
	}

	// 請求書送付先件数を確認
	var seikyushoSofusakiList = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveSeikyushoSofusakiList", keiyakuNaiyoData.kaisha_id);
	if (seikyushoSofusakiList.countRow == 1) {
		// 1件のみの場合、担当を設定
		keiyakuNaiyoData.seikyusho_sofusaki_eda = seikyushoSofusakiList.data[0].sofusaki_eda;
	}

	keiyakuNaiyoData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", keiyakuNaiyoData, true);
	Logger.getLogger().info('[statusUpdate] keiyakuNaiyoData　' + ImJson.toJSONString(keiyakuNaiyoData, true));

	db.insert('lo_t_keiyaku_naiyo', keiyakuNaiyoData);

	var gemponData = {
		keiyaku_naiyo_id : keiyakuNaiyoId
		, gempon_keiyaku_naiyo_id : keiyakuNaiyoId
	};
	gemponData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", gemponData, true);
	Logger.getLogger().info('[statusUpdate] gemponData　' + ImJson.toJSONString(gemponData, true));

	db.insert('lo_t_keiyaku_naiyo_gempon_himozuke', gemponData);

	var himozukeData = {
		keiyaku_naiyo_id : keiyakuNaiyoId
		, bunsho_id : param.bunsho_id
	};
	himozukeData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", himozukeData, true);
	db.insert('lo_t_keiyaku_naiyo_kawari_himozuke', himozukeData);

	var taskId = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "newTask", keiyakuNaiyoData, recipients);

	var targetUsers = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "retrieveKeiyakuTaskTargetUserDatas", keiyakuNaiyoId, taskId, [Constant.LO_RECIPIENT_TYPE_TO, Constant.LO_RECIPIENT_TYPE_CC]);
	
    var sendAddress = {to : [], cc : []};
    for (var key in targetUsers) {
    	var targetUser = targetUsers[key];
    	if (targetUser.recipient_type == Constant.LO_RECIPIENT_TYPE_TO) {
    		sendAddress.to.push(targetUser.email_address1);
    	}
    	if (targetUser.recipient_type == Constant.LO_RECIPIENT_TYPE_CC) {
    		sendAddress.cc.push(targetUser.email_address1);
    	}

    }

	// メール送信
	var param = {
		ticket_id : keiyakuNaiyoId
		, execUserCd : userCd
		, comment : "自動作成"
		, mail_id : Constant.LO_KAWARI_MAIL_ID_KEIYAKU_NEW
		, to_address : sendAddress.to
		, cc_address : sendAddress.cc
	};

	Content.executeFunction("/lo/common_libs/lo_send_mail", "sedMailExce", param);

	return ret;
}
	
/**
 * コメントテーブル更新
 * @param {object} ユーザパラメータ
 * @returns {object} 結果
 */
function setComment(args,userParameter) {
	
	//共通のｗｆコメント
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "setWfComment",args,userParameter);
}


/**
 * メール通知ユーザ設定
 * @param {object} userParameter
 * @returns {object} 結果
 */
function setMailuser(userParameter) {
	// DBにメール通知先ユーザ登録
	return Content.executeFunction("lo/common_libs/lo_send_mail","setMailuser",userParameter);
}


/**
 * グループに属するユーザCDを取得
 * @param {array} グループリスト
 * @returns {array} 結果
 */
function getGroupUserlist(grouplist) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	if (grouplist.length == 0){
		return [];
	}
	var locale_id = 'ja';
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" FROM imm_user u ";
	sql+=" INNER JOIN imm_public_grp_ath g ";
	sql+="   ON u.user_cd = g.user_cd ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND g.public_group_set_cd = '"+Constant.LO_GROUP_SET_CD+"' ";
	sql+="   AND g.public_group_cd in ( ";
	var pra = [];
	for (var i = 0; i <  grouplist.length;i++){
		if (i > 0){
			sql+=",";
		}
		sql+="?";
		pra.push(DbParameter.string(grouplist[i]));
	}
	sql+=")";
	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	// アドレス取得
	var list = [];
	for (var i=0; i < res.countRow;i++){
		if (res.data[i].user_cd){
			list.push(res.data[i].user_cd);
		}
	}
	
	// 重複を削除
	var sendlist = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

	return sendlist;
}

/**
 * ノードの処理対象者が存在しないか確認する
 * @param wfSystemMatterId WFのID
 * @param wfNodeIdList 確認するノードのリスト(配列)
 * @return 全てのノードに存在しない場合はTrue、いずれかに存在する場合はFalse
 */
function hasNodeSetting(wfSystemMatterId, wfNodeIdList) {
	// フロー情報取得
	var actvMatterObj = new ActvMatter('ja', wfSystemMatterId);
	var flowInfo = actvMatterObj.getExecFlow().data;
	var nodeInfoList = flowInfo.nodes;

	// ノード情報取得
	var actvMatterNodeObj = new ActvMatterNode('ja', wfSystemMatterId);

	for (var idx = 0; idx < wfNodeIdList.length; idx++) {
		var hasNodeFlg = false;
		for (var flowNodeIdx = 0; flowNodeIdx < nodeInfoList.length; flowNodeIdx++) {
			if (nodeInfoList[flowNodeIdx].nodeId == wfNodeIdList[idx]) {
				hasNodeFlg = true;
				break;
			}
		}
		if (hasNodeFlg) {
			// 承認ノードの処理対象者を取得
			var targetList = actvMatterNodeObj.getExecProcessTargetList(wfNodeIdList[idx]);
			if (targetList.data) {
				if (targetList.data.length > 0) {
					// 処理対象者が存在すれば、Falseを返却
					return false;
				}
			}
		}
	}
	// 処理対象者が存在しなければ、Trueを返却
	return true;
}

