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

	Constant.load("lo/common_libs/lo_const");

	var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : null
                 };
    

    var oResult = WorkflowNumberingManager.getNumber();
    if (!oResult.resultFlag) {
    	result.resultFlag = false;
        return result;
    }
    // 代わりWFのステータスを更新(受付待ち)
	var param = {
		bunsho_id : userParameter.item_matterName,
		kawari_status: userParameter.item_status_cd
	};

	// 動的承認ノードの選択状態によって、社内承認OK：11に変更する
	// 起案者の設定を確認
	var itemApprUser = userParameter.item_appr_user;
	var userList = itemApprUser["kian"];
	var kianSettingFlg = false;
	if (userList && userList.length > 0) {
		for (var uIdx = 0; uIdx < userList.length; uIdx++) {
			if (userList[uIdx] && userList[uIdx] != '') {
				kianSettingFlg = true;
				break;
			}
		}
	}
	// 承認者の設定を確認
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
	if (kianSettingFlg) {
		param.kawari_status = Constant.LO_STATUS_TEISHUTSU;
	} else if (!kianSettingFlg && !apprSettingedFlg) {
		param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
	} else if(!kianSettingFlg && apprSettingedFlg) {
		param.kawari_status = Constant.LO_STATUS_SHINSEI;
	}
	
	
	var ret = statusUpdate(param);
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
	
    // 起案者が設定されていない場合は、起案権限を持つユーザが入力者のため、起案時のメールを送信
    if (!kianSettingFlg) {
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
        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_PRE; //メールid 事前通知依頼
        
        // 送信
        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
        
    }
    

    result.data = oResult.data;
    return result;
}

// 再申請
function reapply(parameter,userParameter) {
	Constant.load("lo/common_libs/lo_const");

	var result = {
	              "resultFlag" : true,
	              "message"    : "",
	              "data"       : null
	             };
	
	
	var oResult = WorkflowNumberingManager.getNumber();
	if (!oResult.resultFlag) {
		result.resultFlag = false;
	    return result;
	}
	// 代わりWFのステータスを更新(受付待ち)
	var param = {
		bunsho_id : userParameter.item_matterName,
		kawari_status: userParameter.item_status_cd
	};
	
	// 動的承認ノードの選択状態によって、社内承認OK：11に変更する
	// 起案者の設定を確認
	var itemApprUser = userParameter.item_appr_user;
	var userList = itemApprUser["kian"];
	var kianSettingFlg = false;
	if (userList && userList.length > 0) {
		for (var uIdx = 0; uIdx < userList.length; uIdx++) {
			if (userList[uIdx] && userList[uIdx] != '') {
				kianSettingFlg = true;
				break;
			}
		}
	}
	// 承認者の設定を確認
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
	if (kianSettingFlg) {
		param.kawari_status = Constant.LO_STATUS_TEISHUTSU;
	} else if (!kianSettingFlg && !apprSettingedFlg) {
		param.kawari_status = Constant.LO_STATUS_SHONIN_OK;
	} else if(!kianSettingFlg && apprSettingedFlg) {
		param.kawari_status = Constant.LO_STATUS_SHINSEI;
	}
	
	
	var ret = statusUpdate(param);
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
	
	// 起案者が設定されていない場合は、起案権限を持つユーザが入力者のため、起案時のメールを送信
	if (!kianSettingFlg) {
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
	    mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_PRE; //メールid 事前通知依頼
	    
	    // 送信
	    var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);	
	    
	}
	
	
	result.data = oResult.data;
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
                 };
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
                 };
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
     // 代わりWFのステータスを更新(辞退)
  	var param = {
  		bunsho_id : userParameter.item_matterName,
  		kawari_status: userParameter.item_status_cd
  	};
     var ret = statusUpdate(param);
     if (ret.error){
         result.resultFlag = false;
         return result;
     }
     //コメント登録
     ret = setComment(parameter,userParameter)
     if (ret.error){
     	result.resultFlag = false;
         return result;
     }
     
     
    //　起案者へメール送信--------------------------------------------
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
    	// 文書idとノードidから起案ユーザのメールアドレス取得
    	var address = Content.executeFunction("lo/common_libs/lo_send_mail",
    			"getNodeUserAddress",userParameter.item_matterName,Constant.LO_NODE_APPR_0);
        mailParam.to_address = address; //送信先アドレス設定
        mailParam.mail_id = Constant.LO_KAWARI_MAIL_ID_CONFFIRM; //メールid 確認依頼
        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
    }



    return result;
}

// 引戻し
function pullBack(parameter,userParameter) {
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
	
	var ret = statusUpdate(param);
	
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
	
	var ret = statusUpdate(param);
	
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
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
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
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
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
 * 代わりWFステータス更新
 * @param {object} 更新値
 * @returns {object} 結果
 */
function statusUpdate(param) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	// 戻り値
	var ret = {
		error : false,
		message : ""
	};
	
	// DB接続
	var db = new TenantDatabase();
	//画面の入力値をDB用オブジェクトに格納
	var dataSet = {
			kawari_status : param.kawari_status,
			shinsei_bi : new Date()
	};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false, dataSet.shinsei_bi);
	// update条件の値を配列で持つ
	var whereObject = [DbParameter.string(param.bunsho_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_kawari', dataSet,'bunsho_id = ?',whereObject);
	if (result.error) {
			ret.error = true;
			ret.message="登録失敗";
			return ret;
	}
	return ret;
}


/**
 * コメントテーブル更新
 * @param {object} ワークフローパラメータ
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
