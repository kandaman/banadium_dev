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
		shinsei_id : parameter.matterName,
		shinsei_status: item_status_cd
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
		shinsei_id : parameter.matterName,
		shinsei_status: item_status_cd
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
		shinsei_id : userParameter.item_matterName,
		shinsei_status: userParameter.item_status_cd
	};
	// 社内審査中に設定する
	param.shinsei_status = Constant.LO_STATUS_SHINSEI;
	// 動的承認ノードの選択状態によって、社内承認OK：11に変更する
	var nodeList = [];
	
	if(parameter.nodeId == Constant.LO_NODE_KIAN) {
		// 起案時は承認者の設定が取得できないためパラメータから確認する
		var itemApprUser = userParameter.item_appr_user;
		var nodeList = [];
		nodeList.push("appr_1");
		nodeList.push("appr_2");
		
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
			param.shinsei_status = Constant.LO_STATUS_SHONIN_OK;
		}
		
		//param.kian_sha_id = parameter.execUserCd;
		//param.kian_sha_nm = 
		
		Logger.getLogger().info('parameter '+ ImJson.toJSONString(parameter, true));    
		
		
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_1) {
		nodeList.push(Constant.LO_NODE_APPR_2);		
		if (hasNodeSetting(parameter.systemMatterId, nodeList)) {
			param.shinsei_status = Constant.LO_STATUS_SHONIN_OK;
		}
	} else if(parameter.nodeId == Constant.LO_NODE_APPR_2) {

		param.shinsei_status = Constant.LO_STATUS_SHONIN_OK;

	} else if(parameter.nodeId == Constant.LO_NODE_SYS) {		
	
		param.shinsei_status = Constant.LO_STATUS_KANRYO;
	
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

	        }
	
	        //　起案通知メール送信------------------
	        //送信先アドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_KIAN);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_ACCOUNT_MAIL_ID_PRE; //メールid 事前通知依頼
	        
	        // 送信
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);	
	        
	    }// 起案(BNE担当)の場合、ここまで
	    
	    
	    // 完了(システム担当)の場合
	    if (userParameter.imwNodeId == 'lo_node_sys'){
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
	        mailParam.mail_id = Constant.LO_ACCOUNT_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
			
	    	//　完了通知先メール送信--------------------------------------------
	    	//　完了通知グループのアドレス取得
	        var address = Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_END);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_ACCOUNT_MAIL_ID_END; //メールid 完了通知
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	        
	        // 対象ユーザへのメール通知
	        
	        // 対象ユーザを取得
	        res = Content.executeFunction("lo/contents/screen/account/account_data_retriever","retrieveShinseiUserList", userParameter.item_matterName);
	        var usersList = res.data;	        
	        
	        mailParam = {};
	        mailParam.mail_id = Constant.LO_ACCOUNT_MAIL_ID_USER;
	        	
	        for(var i in usersList){
	        	if(usersList[i].shinsei_cls == "1"){
		        	var userCd = usersList[i].user_cd;
		        	// imm_userからユーザ情報を取得
		        	res = Content.executeFunction("lo/contents/screen/account/account_data_retriever","retrieveAccountUserInfo", userCd);
		        	
		        	if(res.data.length == 1){
		        		var userInfo = res.data[0];
		        		mailParam.to_address = userInfo.mail_address;	        		
		        		res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
		        		
		        		Logger.getLogger().info('[送信対象]' + userInfo.user_nm+":"+userInfo.user_nm);
	
		        	}else{
		        		// TODO:アカウント未作成の場合に管理者にメールを送る機能が必要か
		        		Logger.getLogger().info('[送信対象(アカウント未作成）]');
		        	}
	        	}
	        }
	        
	        
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
		shinsei_id : parameter.matterName,
		shinsei_status: item_status_cd
	};

	//差し戻し先によってステータスを変える
	switch(parameter.nextNodeIds[0]){
	case Constant.LO_NODE_APPLY:
		//戻し先が入力ノードの場合は、戻し元のノードに応じてステータスを変更
		if(parameter.nodeId == Constant.LO_NODE_KIAN){
			param.shinsei_status = Constant.LO_STATUS_SHUSEI_IRAI;//修正依頼
		}else{
			param.shinsei_status = Constant.LO_STATUS_SASHIMODOSHI;//差し戻し
		}		
		
		break;
	case Constant.LO_NODE_KIAN:
		//戻し先が起案ノードの場合は、差し戻しに更新
		param.shinsei_status = Constant.LO_STATUS_SASHIMODOSHI;//差し戻し
		param.tantou_sha_id = null;
		param.tantou_sha_nm = null;
		break;	
	default:
		//今回の仕様上不要だが、今後のために実装しておく
		param.shinsei_status = Constant.LO_STATUS_SHINSEI;//社内審査中
		break;		
	}
	
	// ステータスを更新(受付待ち)
	var param = {
		shinsei_id : parameter.matterName,
		shinsei_status: item_status_cd
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
 * アカウント申請ステータス更新
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
		shinsei_status : param.shinsei_status
	};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	
	// 修正依頼のパラメータセット
	if (param.shinsei_status == '3') {
		
	}
	
	// 起案者をテーブルに登録
	if (args.nodeId == 'lo_node_kian'){
		// ユーザ情報取得
		dataSet.tantou_sha_id = userCd;
		dataSet.tantou_sha_nm = userName;
	}
	
	// update条件の値を配列で持つ
	var whereObject = [DbParameter.string(param.shinsei_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_account_shinsei', dataSet,'shinsei_id = ?',whereObject);
	if (result.error) {
			ret.error = true;
			ret.message="登録失敗";
			return ret;
	}
	
	// 完了以外の場合、契約内容確認への登録を実施しない
	if (param.shinsei_status != Constant.LO_STATUS_KANRYO) {
		return ret;
	}

	// 完了時の後処理がある場合はここへ


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

/**
 * 申請ユーザ情報取得
 * @param {string} bunshoId 文書ID
 * @returns {DatabaseResult} 検索結果
 */
function getShinseiUserList(shinseiId) {
    var sql = "";
    sql += "SELECT ";
    sql += " au.*";  
    sql += " ,ko.cd_naiyo shinsei_cls_nm";
    sql += " ,dept.department_name busho_nm ";
    //sql += " ,ko2.cd_naiyo riyo_group_nm";
    sql += " ,sk.keiro_nm shonin_keiro_nm ";
	sql += " FROM ";
	sql += "  lo_t_account_user AS au ";
	sql += "  left join ";
	sql += "  imm_department dept ";
	sql += "  ON au.busho_cd = dept.department_cd ";
	sql += "  left join ";
	sql += "  lo_m_koteichi ko ";// 申請区分
	sql += "  ON ko.cd_cls_id = '" +  Constant.LO_CDCLS_SHINSEI_CLS + "' ";
	sql += "  AND ko.cd_id = au.shinsei_cls ";
	sql += "  AND ko.sakujo_flg = '0' ";
	sql += "  left join ";
	sql += "  lo_m_shonin_keiro sk ";// 承認経路	
	sql += "  ON sk.keiro_id = au.shonin_keiro ";
	sql += "  AND sk.sakujo_flg = '0' ";
	sql += "WHERE ";
	sql += "  au.sakujo_flg = '0' ";	
	sql += "  AND au.shinsei_id = ? ";
	sql += "ORDER BY ";
	sql += "  au.shinsei_id,au.shinsei_edaban ";

    var params = [];
    params.push(DbParameter.string(shinseiId));

    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql, params, 0);

    if(shinseiId.substr(0,2) == "SS"){ // 社内アカウント申請のみ利用グループの情報を取得
	    // 利用グループを固定値マスタから取得
	    params = [];
	    sql = "SELECT ";
	    sql += " ko2.cd_id riyo_group_cd";  
	    sql += " ,ko2.cd_naiyo riyo_group_nm";    
		sql += " FROM ";
		sql += "  lo_m_koteichi ko2 ";
		sql += "  WHERE ko2.cd_cls_id = '"+Constant.LO_CDCLS_RIYO_GROUP+"' ";	
		sql += "  AND ko2.sakujo_flg = '0' ";
		
		var result2 = db.select(sql, params, 0);
	
		var riyoGroupList = {};
		for(var i in result2.data){
			riyoGroupList[result2.data[i].riyo_group_cd] = result2.data[i].riyo_group_nm;
		}
	
	    var ip_tanto_list = retrieveShinseiIpTantoList(shinseiId);
	    var tanto_kakari_list = retrieveShinseiTantoKakariList(shinseiId);    
	
	    for(var i in result.data){
	    	var edaban = result.data[i].shinsei_edaban;
	    	
	    	if(edaban in ip_tanto_list){
	    		result.data[i].ip_tanto = ip_tanto_list[edaban].group_list;    		
	    	}else{
	    		result.data[i].ip_tanto = [];
	    	}
	    	
	    	if(edaban in tanto_kakari_list){
	    		result.data[i].tanto_kakari = tanto_kakari_list[edaban].tanto_kakari_list;    		
	    	}else{
	    		result.data[i].tanto_kakari = [];
	    	}
	    	
	    	var selectedRiyoGroup = result.data[i].riyo_group.split(",");
	    	
	    	result.data[i].riyo_group_nm = [];
	    	for(var s in selectedRiyoGroup){
	    		result.data[i].riyo_group_nm.push(riyoGroupList[selectedRiyoGroup[s]]);
	    	}   	
	    }    
    }    
	
    Logger.getLogger().info('[retrieveShinseiUserList]' + ImJson.toJSONString(result.data, true));

    return result.data;
}

