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
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
    Constant.load("lo/common_libs/lo_const");
                 
    // 許諾のステータスを更新(受付待ち)
	var param = {
		kyodaku_id : userParameter.item_matterName,
		kyodaku_status: userParameter.item_status_cd
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
		    	param.kyodaku_status = Constant.LO_STATUS_SHONIN_OK;
			}
	    }else{
	    	param.kyodaku_status = Constant.LO_STATUS_SHONIN_OK;
	    }
	}else if(parameter.nodeId == Constant.LO_NODE_APPR_2) {
    	param.kyodaku_status = Constant.LO_STATUS_SHONIN_OK;
	}
	// --------------------	

    var ret = statusUpdate(parameter,param);
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
	        mailParam.mail_id = Constant.LO_MAIL_ID_PRE; //メールid 事前通知
	        
	        // 送信
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	
	        //　商標担当通知メール送信------------------
	        //送信先アドレス取得
	        /*var address =Content.executeFunction("lo/common_libs/lo_send_mail",
	        	"getMailSendList",userParameter.item_matterName,Constant.LO_MAIL_GROUP_SHOHYO);
	        
	        mailParam.to_address = address; //送信先アドレス設定
	        mailParam.mail_id = Constant.LO_MAIL_ID_SHOHYO; //メールid 商標依頼
	        
	        // 送信
	        var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",mailParam);
	        */
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
		kyodaku_id : userParameter.item_matterName,
		kyodaku_status: userParameter.item_status_cd
	};
    var ret = statusUpdate(parameter,param);
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
    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    
                 
    // 許諾のステータスを更新
	var param = {
		kyodaku_id : userParameter.item_matterName,
		kyodaku_status: userParameter.item_status_cd
	};
    var ret = statusUpdate(parameter,param);
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
 * 許諾ステータス更新
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
	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");

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
			 kyodaku_status : param.kyodaku_status
	};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	// 修正依頼にBNE担当者と確認日をリセット
	if (param.kyodaku_status == '3') {
		dataSet.kakunin_bi = null;
		dataSet.bne_tantou_sha = null;
	}
	// 受理時にBNE担当者と確認日をセット
	if (param.kyodaku_status == '4' && args.nodeId == 'lo_node_appr_0') {
		dataSet.kakunin_bi = DateTimeFormatter.format('yyyy/MM/dd', dataSet.koushin_bi);
		dataSet.bne_tantou_sha = userName;
	}
	
	/* todo 影響が大きいため保留
	// 承認時、承認２が存在する場合はステータスを審査中のままにしておく
	if (param.kyodaku_status == '6' && args.nodeId == 'lo_node_appr_1'){
	 	// ノード情報取得
		var actvMatter = new ActvMatterNode('ja', args.systemMatterId);
	    var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_2);
		if (result.data && result.data.length > 0){
			dataSet.kyodaku_status = '4';
		}
	}*/
	
	// update条件の値を配列で持つ
	var whereObject = [DbParameter.string(param.kyodaku_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_kyodaku', dataSet,'kyodaku_id = ?',whereObject);
	if (result.error) {
			ret.error = true;
			ret.message="登録失敗";
			return ret;
	}

	// 完了以外の場合、契約内容確認への登録を実施しない
	if (param.kyodaku_status != Constant.LO_STATUS_KANRYO) {
		return ret;
	}

	var kyodakuRet = db.select("SELECT ky.*, (SELECT SUM(s.saiteihosho_su_kyodakuryo) FROM lo_t_kyodaku_shohin AS s WHERE s.sakujo_flg = '0' AND s.kyodaku_id = ky.kyodaku_id) AS sum_saiteihosho_su_kyodakuryo FROM lo_t_kyodaku AS ky WHERE ky.kyodaku_id = ? AND ky.sakujo_flg = '0' ", whereObject, 0);
	var kyodakuData = kyodakuRet.data[0];
	
	//var keiyakuCls = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeiyakuCls", kyodakuData.kaisha_id);
	// トランの契約種別を参照
	var keiyakuCls = kyodakuData.keiyaku_cls;	

	var recipients = [];
	var keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	// 許諾種別=新規
	if (kyodakuData.kyodaku_cls == Constant.LO_KYODAKU_SHUBETSU_NEW) {
		// 契約内容のボールを最初に持つ人は、契約担当G
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP
		    , publicGroupSetCd : Constant.LO_GROUP_SET_CD // パブリックグループセットコード
		    , publicGroupCd : Constant.LO_GROUP_CD_CONTRACT // パブリックグループコード
		});
		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_DRAFT;
	}
	// 許諾種別=追加
	if (kyodakuData.kyodaku_cls == Constant.LO_KYODAKU_SHUBETSU_ADD) {
		// 契約内容のボールを最初に持つ人は、計上担当G
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP
		    , publicGroupSetCd : Constant.LO_GROUP_SET_CD // パブリックグループセットコード
		    , publicGroupCd : Constant.LO_GROUP_CD_ACCOUNT // パブリックグループコード
		});
		// CCに契約担当G
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_CC
			, targetType : Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP
		    , publicGroupSetCd : Constant.LO_GROUP_SET_CD // パブリックグループセットコード
		    , publicGroupCd : Constant.LO_GROUP_CD_CONTRACT // パブリックグループコード
		});
		keiyakuStatus = Constant.LO_KEIYAKU_STATUS_ACCT_REQUEST;
	}

	// 契約内容を最初に受信する人（ボールを持つ人）がいない場合は、契約内容を作成しない。
	if (recipients.length == 0) {
		return ret;
	}

	Logger.getLogger().info('[statusUpdate] kyodakuData　' + ImJson.toJSONString(kyodakuData, true));

	var keiyakuNaiyoId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KEIYAKU);
	var keiyakuNaiyoData = {
		keiyaku_naiyo_id : keiyakuNaiyoId
 		, keiyaku_cls : keiyakuCls
 		, keiyaku_naiyo_nm : kyodakuData.kyodaku_nm
 		, keiyaku_status : keiyakuStatus
 		, keiyaku_kaishi_bi : Content.executeFunction("lo/common_libs/lo_common_fnction", "getDateObj", kyodakuData.kyodaku_kikan_from, "/")
 		, keiyaku_manryo_bi : kyodakuData.kyodaku_kikan_to
 		, saiteihosho_ryo : kyodakuData.sum_saiteihosho_su_kyodakuryo
 		, sozai_seisaku_hi : kyodakuData.sozai_hi
 		, kaisha_id : kyodakuData.kaisha_id
 		, kaisha_nm : kyodakuData.kaisha_nm
 		, busyo_id : kyodakuData.busyo_id
 		, busyo_nm : kyodakuData.busyo_nm
 		, kyodaku_chiiki : kyodakuData.kyodaku_chiiki
 		, seikyusho_sofusaki_eda : kyodakuData.seikyusho_sofusaki_id
	};
	var taskHistories = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveWorkflowTaskHistory", [param.kyodaku_id]);
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
		, kyodaku_id : param.kyodaku_id
	};
	himozukeData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", himozukeData, true);
	db.insert('lo_t_keiyaku_naiyo_kyodaku_himozuke', himozukeData);
	
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

