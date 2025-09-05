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
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 差戻し後引戻し
function sendBackToPullBack(parameter,userParameter) {
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}

// 承認
function approve(parameter,userParameter) {
    //Debug.print( "----- ActionProcess.js - approve -----" );
    //Debug.console(parameter);
    //Debug.console(userParameter);
    //Debug.print( "----- ActionProcess.js - approve -----" );
    
    Constant.load("lo/common_libs/lo_const");
    
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
                 
    // 企画のステータスを更新(受付待ち)
	var param = {
		kikaku_id : userParameter.item_matterName,
		kikaku_status: userParameter.item_status_cd
	};
	
	// 承認1の時かつ次の処理に承認2がない場合--------------------
	// または承認２の場合はステータスを社内承認OK：11変更する
	if (parameter.nodeId == Constant.LO_NODE_APPR_1){
	    // ノード情報取得
	    var actvMatter = new ActvMatterNode('ja', parameter.systemMatterId);
	    // 承認2ノードの処理対象者を取得
	    var targetList = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_2);
		if (targetList.data){
			if (targetList.data.length < 1){
		    	param.kikaku_status = Constant.LO_STATUS_SHONIN_OK;
			}
	    }else{
	    	param.kikaku_status = Constant.LO_STATUS_SHONIN_OK;
	    }
	}else if(parameter.nodeId == Constant.LO_NODE_APPR_2) {
    	param.kikaku_status = Constant.LO_STATUS_SHONIN_OK;
	}
	// --------------------
	

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
	    if (userParameter.imwNodeId == 'lo_node_appr_0'){
	        // メール通知先設定
	        setMailuser(userParameter);
	        
	        // メール送信用パラメータ作成
	        var mailParam = {
	        	ticket_id : userParameter.item_matterName, // 文書番号
	        	comment : userParameter.item_comment,      //コメント
	        	execUserCd : parameter.execUserCd,          //実行者コード
	        	mail_id : "",     //メールid 確認依頼
	        	to_address : []   //送信先アドレス
	        }
	
	        //　起案通知メール送信------------------
	        //送信先アドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KIAN);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_PRE; //メールid 事前通知依頼
	        
	        // 送信
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	    }
	    
	    
	    // 完了(BNE最終担当)の場合
	    if (userParameter.imwNodeId == 'lo_node_appr_last'){
	        // メール送信用パラメータ作成
	        var mailParam = {
	        	ticket_id : userParameter.item_matterName, // 文書番号
	        	comment : userParameter.item_comment,      //コメント
	        	execUserCd : parameter.execUserCd,          //実行者コード
	        	mail_id : "",     //メールid 確認依頼
	        	to_address : []   //送信先アドレス
	        }
	
	    	//　ライセンシーへ完了通知先メール送信--------------------------------------------
			// 文書idとノードidから申請者のメールアドレス取得
			var address = Content.executeFunction("lo/common_libs/lo_send_mail",
					"getNodeUserAddress",userParameter.item_matterName,Constant.LO_NODE_APPLY);
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_END_LICENSEE; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	        
	
	    	//　完了通知先メール送信--------------------------------------------
	    	//　完了通知グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_END);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	
	    	//　契約確認メール送信--------------------------------------------
	    	// 契約担当グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KEIYAKU);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_KEIYAKU; //メールid 契約確認
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	        
	    	//　計上担当メール送信--------------------------------------------
	    	// 計上担当グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KEIJOU);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_END; //メールid 完了通知
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
    
    // 企画のステータスを更新
	var param = {
		kikaku_id : userParameter.item_matterName,
		kikaku_status: userParameter.item_status_cd
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
    
    //　ライセンシーへ確認メール送信--------------------------------------------
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
        mailParam.mail_id = Constant.LO_MAIL_ID_END_LICENSEE; //メールid 完了通知(ライセンシー用)
        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
    }
                 
    return result;
}

// 差戻し
function sendBack(parameter,userParameter) {
    //Debug.print( "----- sendBack -----" );

	var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
     //Debug.console(parameter);
     //Debug.console(userParameter);
    
    // 企画のステータスを更新
	var param = {
		kikaku_id : userParameter.item_matterName,
		kikaku_status: userParameter.item_status_cd
	};
    var ret = statusUpdate(parameter,param);
    
    //Debug.console(ret);

    if (ret.error){
    	result.resultFlag = false;
        return result;
    }
    //コメント登録
    ret = setComment(parameter,userParameter);

    //Debug.console(ret);
    if (ret.error){
    	result.resultFlag = false;
        return result;
    }

    //Debug.console(result);
    //Debug.console('-----end');
    //Debug.print( "----- ActionProcess.js - approve -----" );


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
 * 企画ステータス更新
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
			 kikaku_status : param.kikaku_status
	};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	
	// 修正依頼にBNE担当者と確認日をリセット
	if (param.kikaku_status == '3') {
		dataSet.kakunin_bi = null;
		dataSet.bne_tantou_sha = null;
	}
	// todo 暫定対応 BNE担当者設定
	if (param.kikaku_status == '4' && args.nodeId == 'lo_node_appr_0'){
		// ユーザ情報取得
		dataSet.bne_tantou_sha = userName;
		dataSet.kakunin_bi = dataSet.koushin_bi;
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
	var whereObject = [DbParameter.string(param.kikaku_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_kikaku', dataSet,'kikaku_id = ?',whereObject);
	if (result.error) {
			ret.error = true;
			ret.message="登録失敗";
			return ret;
	}
	
	// 完了以外の場合、契約内容確認への登録を実施しない
	if (param.kikaku_status != Constant.LO_STATUS_KANRYO) {
		return ret;
	}

	var kikakuRet = db.select("SELECT * FROM lo_t_kikaku WHERE kikaku_id = ?", whereObject, 0);
	var kikakuData = kikakuRet.data[0];
	var keiyakuCls = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeiyakuCls", kikakuData.kaisha_id);

//	// 個別契約以外の場合、契約内容確認への登録を実施しない
//	if (keiyakuCls != Constant.LO_KEIYAKU_SHUBETSU_KOBETSU) {
//		return ret;
//	}
	// 契約チケット発行処理を行う契約種別と企画種別を判定し、発行不要の場合はこの判定で処理を終える
	if (keiyakuCls == Constant.LO_KEIYAKU_SHUBETSU_KOBETSU) {
		// 契約種別が個別の場合
		if (kikakuData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_MUSIC &&
				kikakuData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_EVENT &&
				kikakuData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_EIZO) {
			return ret;
		}
		
	} else if (keiyakuCls == Constant.LO_KEIYAKU_SHUBETSU_HOUKATSU) {
		// 契約種別が包括の場合
		if (kikakuData.kikaku_shubetsu_cd != Constant.LO_KIKAKU_SHUBETSU_EVENT) {
			return ret;
		}
	} else {
		return ret;
	}
	
	var recipients = [];
	var keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	// 企画種別=楽曲
	if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
		// 契約内容のボールを最初に持つ人は、契約担当G
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP
		    , publicGroupSetCd : Constant.LO_GROUP_SET_CD // パブリックグループセットコード
		    , publicGroupCd : Constant.LO_GROUP_CD_CONTRACT // パブリックグループコード
		});
		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	}else if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT
			|| kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO) {// 企画種別=イベント
		// 契約内容のボールを最初に持つ人は、IP担当者
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			, userCd : userCd // IP担当者(bne_tantou_sha は名称で登録されてしまっているので、実質完了をできるのはIP担当者なので、ログインユーザCDを利用する）
		});

		// CCとしてIP担当G
		var ipGroupList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getIpGroupList", param.kikaku_id, Constant.LO_TICKET_ID_HEAD_KIKAKU);
		for (var key in ipGroupList) {
			recipients.push({
				recipientType : Constant.LO_RECIPIENT_TYPE_CC
				, targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP
			    , publicGroupSetCd : Constant.LO_GROUP_SET_CD // パブリックグループセットコード
			    , publicGroupCd : ipGroupList[key] // パブリックグループコード
			});
		}

		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	}

	// 契約内容を最初に受信する人（ボールを持つ人）がいない場合は、契約内容を作成しない。
	if (recipients.length == 0) {
		return ret;
	}

	var eventRoyaltyKingaku;
	var eventSozaihi;
	if (kikakuData.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT) {
		// イベント企画の場合
		var eventKikkuSummary = getEventSummary(param.kikaku_id);
		eventRoyaltyKingaku = eventKikkuSummary[0].royalty_kingaku;
		eventSozaihi = eventKikkuSummary[0].sozaihi;
	}

	var keiyakuNaiyoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KEIYAKU);
	var keiyakuNaiyoData = {
		keiyaku_naiyo_id : keiyakuNaiyoId
		, keiyaku_cls : keiyakuCls
 		, keiyaku_naiyo_nm : kikakuData.kikaku_nm
 		, keiyaku_status : keiyakuStatus
 		, kaisha_id : kikakuData.kaisha_id
 		, kaisha_nm : kikakuData.kaisha_nm
 		, busyo_id : kikakuData.busyo_id
 		, busyo_nm : kikakuData.busyo_nm
 		, seikyusho_sofusaki_eda : kikakuData.seikyusho_sofusaki_id
 		, saiteihosho_ryo : eventRoyaltyKingaku
 		, sozai_seisaku_hi : eventSozaihi
	};
	var taskHistories = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveWorkflowTaskHistory", [param.kikaku_id]);
	for (var historyKey in taskHistories.data) {
		var taskHistory = taskHistories.data[historyKey];
		if (taskHistory.node_id == Constant.LO_NODE_APPLY) {
			keiyakuNaiyoData.kaisha_id = taskHistory.auth_company_code;
			keiyakuNaiyoData.kaisha_nm = taskHistory.auth_company_name;
			keiyakuNaiyoData.busyo_id = taskHistory.auth_orgz_code;
			keiyakuNaiyoData.busyo_nm = taskHistory.auth_orgz_name;
			keiyakuNaiyoData.licensee_keiyaku_tanto_id = taskHistory.execute_user_code;
			keiyakuNaiyoData.licensee_keiyaku_tanto_nm = taskHistory.execute_user_name;
			break;
		}
	}

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
		, kikaku_id : param.kikaku_id
	};
	himozukeData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", himozukeData, true);
	db.insert('lo_t_keiyaku_naiyo_kikaku_himozuke', himozukeData);

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
		, mail_id : Constant.LO_MAIL_ID_KEIYAKU_NEW
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
 * イベントの詳細を集計した値を取得
 * @param {string} kikaku_id 企画ID
 * @returns {DatabaseResult} 集計結果
 */
function getEventSummary(kikakuId) {
	var sql ="";
	sql+=" SELECT ";
	sql+="   SUM(ke.royalty_kingaku) AS royalty_kingaku, ";
	sql+=" 	 SUM(ke.sozaihi) AS sozaihi ";
	sql+=" FROM lo_t_kikaku_event ke ";
	sql+=" WHERE ke.kikaku_id = ? ";
	sql+="   AND ke.sakujo_flg = '0' ";
	sql+=" GROUP BY ke.kikaku_id ";

	var pra = [];
	pra.push(DbParameter.string(kikakuId));

	var db = new TenantDatabase();
	var res = db.select(sql, pra, 0);
	
	return res.data;
}


