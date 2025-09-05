Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , licenseeFlg : "0" // ライセンシーフラグ
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , contractFlg : "0" // 契約担当フラグ
    , accountFlg : "0" // 計上担当フラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};

var $label_comment;
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $parentParams = "{}";
var $isEnchoExtend = false;

var $keiyakuNaiyoId = "";
var $koushinBi = "";
var $taskId = "";
var $taskKoushinBi = "";
var $mailDefUsers = {
	mail_to :[]
	, mail_cc :[]
};
var $comment_template_list = [];
var $preset_list = [];

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	
	Logger.getLogger().info('[init]　画面初期表示 $request = ' + ImJson.toJSONString(request, true));

	loadUserInfo();

	$label_comment = "コメント";
	$keiyakuNaiyoId = request.keiyakuNaiyoId;
	$koushinBi = request.koushinBi;
	$taskId = request.taskId;
	$taskKoushinBi = request.taskKoushinBi;
	if (request.params) {
		$parentParams = request.params;
	}

	//添付ファイルメッセージ及び拡張子リスト取得
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_KEIYAKU_EXT);
    $extstr = "";
    for ( var i = 0; i < $extList.length; i++) {
    	if ($extstr == "") {
    		$extstr = $extList[i];
    	} else {
    		$extstr = $extstr + "/" + $extList[i];
    	}
    }
    $extListstr = $extstr.replace(/\./g, "");
    $extstr = MessageManager.getMessage('KE02I018', $extstr);
    
    var parentParams = ImJson.parseJSON($parentParams);
    if ($userInfo.licenseeFlg == '1') {
        
    	if (parentParams.keiyaku_encho && (parentParams.keiyaku_encho.initial_keiyaku_encho_cls != parentParams.keiyaku_encho.keiyaku_encho_cls || parentParams.keiyaku_encho.initial_tsuika_seisan_cls != parentParams.keiyaku_encho.tsuika_seisan_cls)) {
        	$label_comment = "契約延長コメント";
        	$isEnchoExtend = true;
        	var keiyakuEnchoTantoUsers =  Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuEnchoTantoUsers", $keiyakuNaiyoId);
        	$mailDefUsers.mail_to = keiyakuEnchoTantoUsers;
        } else {        
    		var taskResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuTaskData", $keiyakuNaiyoId, $taskId);
    		if (taskResult.countRow > 0) {
	        	$mailDefUsers.mail_to.push({
	        		user_cd : taskResult.data[0].irai_sha_user_cd
	        		, user_nm : taskResult.data[0].irai_sha_user_nm
	        	});
	        	// 自分自身とTO宛先はCCから除外する
	        	var excludeUsers = [$userInfo.userCd];
	        	for (var toKey in $mailDefUsers.mail_to) {
	        		excludeUsers.push($mailDefUsers.mail_to[toKey].user_cd);
	        	}
	        	Logger.getLogger().info('[init]　画面初期表示 excludeUsers = ' + ImJson.toJSONString(excludeUsers, false));

	        	var targetUsers =  Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "retrieveKeiyakuTaskTargetUserDatas", $keiyakuNaiyoId, $taskId
	        		, [Constant.LO_RECIPIENT_TYPE_TO, Constant.LO_RECIPIENT_TYPE_CC]);
	        	
	        	Logger.getLogger().info('[init]　画面初期表示 targetUsers = ' + ImJson.toJSONString(targetUsers, false));

	        	for (var userKey in targetUsers) {
	        		var targetUser = targetUsers[userKey];
	        		if (excludeUsers.indexOf(targetUser.user_cd) >= 0) {
	        			continue;
	        		}
		        	$mailDefUsers.mail_cc.push({
		        		user_cd : targetUser.user_cd
		        		, user_nm : targetUser.user_nm
		        	});
	        	}

    		} else {
    			// ボールを持っていない場合
    			// TODO 契約内容ステータスをみて、主のボール持ち主を判定する？一旦IP担当者とする
	        	var keiyakuEnchoTantoUsers =  Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuEnchoTantoUsers", $keiyakuNaiyoId);
	        	$mailDefUsers.mail_to = keiyakuEnchoTantoUsers;
    		}
        }
    }
	var templateResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentTemplateList");
	$comment_template_list = [{}].concat(templateResult.data);
    Content.executeFunction("lo/common_libs/lo_common_fnction", "toSelectList", $comment_template_list, "comment_template_nm", "comment_template_id");
    
    var presetResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentDestinationPresetList", false);
    $preset_list = [{}].concat(presetResult.data);
    Content.executeFunction("lo/common_libs/lo_common_fnction", "toSelectList", $preset_list, "preset_nm", "preset_id");

}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo"); 
	
}

/**
 * コメントテンプレート本文を取得します。
 * 
 */
function retrieveCommentTemplateContent(request) {

	var functionResult = {
	    error: false,
	    message: "",
	    data: ""
	};
	
	if (!request.comment_template_id) {
		return functionResult;
	}
	
	var templateResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentTemplateContent", Number(request.comment_template_id));
	if (templateResult.countRow == 0) {
		return functionResult;
	}
	functionResult.data = templateResult.data[0].comment_template_content;
	return functionResult;
}


function sendMail(request) {

	var functionResult = {
	    error: false,
		taskId: "",
		message: MessageManager.getMessage('KY02I012')
	};

	loadUserInfo();

	// ここで受け取る宛先は、個人を指す宛先ではない可能性があるため
	// タスク対象レコード作成後に個人宛先を特定する
	var recipients = [];
	for (var key in request.mail_user_list.mail_to) {
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_TO
			, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			, userCd : request.mail_user_list.mail_to[key]
		});
	}

	for (var key in request.mail_user_list.mail_cc) {
		recipients.push({
			recipientType : Constant.LO_RECIPIENT_TYPE_CC
			, targetType : Constant.LO_TASK_TARGET_TYPE_USER
			, userCd : request.mail_user_list.mail_cc[key]
		});
	}

	var sendAddress= {
		to : []
		, cc : []
	}

	var db = TenantDatabase();
	Transaction.begin(function() {
		
		if ('keiyaku_encho_cls' in request) {
			Logger.getLogger().info('[sendMail]　コメント登録およびメール送信 request.keiyaku_encho_cls  ' + request.keiyaku_encho_cls);
			var upObject =  {
				keiyaku_encho_cls : request.keiyaku_encho_cls
				, tsuika_seisan_cls : request.tsuika_seisan_cls
            };
			// 更新
			upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
         	var upResult = db.update('lo_t_keiyaku_naiyo', upObject, "keiyaku_naiyo_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(request.keiyakuNaiyoId), DbParameter.string(request.koushinBi)]);
			if (upResult.countRow == 0) {
				// 排他エラー処理
				Logger.getLogger().error(' [updateKeiyakuNaiyo] 排他エラー　updateKeiyakuNaiyoData key ' + request.keiyakuNaiyoId + ', ' + request.koushinBi);
				Transaction.rollback();
				functionResult.error = true;
				functionResult.message = MessageManager.getMessage('ER01E004');
				return functionResult;
			}
		}

		var result = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor", "nextTask", request.keiyakuNaiyoId, request.taskId, request.taskKoushinBi, recipients);
		if (result.error) {
			Transaction.rollback();
			functionResult.error = true;
			functionResult.message = result.message;
			return functionResult;
		}
		functionResult.taskId = result.taskId;
		
		// 契約内容タスク対象ユーザ情報取得
		var koukaiHani = $userInfo.bneFlg != '1' ? Constant.LO_GROUP_SET_CD : Constant.LO_GROUP_CD_BNE; // 全対象ユーザがBNE所属社員であるか(From or To or CC にライセンシーが含まれるか？）
		var targetUsers = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_task_processor"
			, "retrieveKeiyakuTaskTargetUserDatas", request.keiyakuNaiyoId, functionResult.taskId, [Constant.LO_RECIPIENT_TYPE_TO, Constant.LO_RECIPIENT_TYPE_CC]);
		for (var key in targetUsers) {
			var targetUser = targetUsers[key];
			if (targetUser.recipient_type == Constant.LO_RECIPIENT_TYPE_TO) {
				Logger.getLogger().info('[sendMail]　コメント登録およびメール送信 typeof sendAddressTo  ' + (typeof sendAddress.to));
				sendAddress.to.push(targetUser.email_address1);
			}
			if (targetUser.recipient_type == Constant.LO_RECIPIENT_TYPE_CC) {
				sendAddress.cc.push(targetUser.email_address1);
			}
			if (targetUser.is_bne != '1') {
				koukaiHani = Constant.LO_GROUP_SET_CD;
			}
		}
		
		// ライセンシーからの送信時、つねに契約担当をccに含める
		if($userInfo.bneFlg != '1'){
			var keiyakuTantoUsers = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever","retrievePublicGroupUsers",[Constant.LO_GROUP_CD_CONTRACT]);
			for(var i in keiyakuTantoUsers){
				// すでにTo,Ccに存在する場合は追加しない
				if(sendAddress.to.indexOf(keiyakuTantoUsers[i].email_address1) == -1 && sendAddress.cc.indexOf(keiyakuTantoUsers[i].email_address1) == -1){
					sendAddress.cc.push(keiyakuTantoUsers[i].email_address1);
				
				}else{
					
				}			
				
			}
				
		}
		

		// 重複と空白を削除
		sendAddress.to = sendAddress.to.filter(function (x, i, self) {
			return x && self.indexOf(x) === i;
	    });
	    sendAddress.cc = sendAddress.cc.filter(function (x, i, self) {
			return x && self.indexOf(x) === i;
	    });
	
		var comment = {
			keiyaku_naiyo_id : request.keiyakuNaiyoId
			, task_id : functionResult.taskId
			, koukai_hani : koukaiHani
			, naiyo : request.comment
		};
		comment = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", comment, true);
		db.insert('lo_t_keiyaku_naiyo_comment', comment);
		
		var paramFilePaths = [];
		var fileNo = 1;
		for (var key in request.tempu_file_list) {
			var data = request.tempu_file_list[key];
			var fileName = data.fileName.split("/").reverse()[0];
			paramFilePaths.push(data.uniquefileName);
			Logger.getLogger().info('[sendMail]　コメント登録およびメール送信 typeof request.keiyakuNaiyoId  ' + (typeof request.keiyakuNaiyoId));
			var file = {
				keiyaku_naiyo_id : request.keiyakuNaiyoId
				, task_id : functionResult.taskId
				, file_no : fileNo
				, file_name : fileName
				, file_path : request.keiyakuNaiyoId + "/" + data.uniquefileName
		    };
		    file = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", file, true);
			db.insert('lo_t_keiyaku_naiyo_tempu_file', file);
			fileNo++;
		}
		for (var key in paramFilePaths) {
			var newFilePath = paramFilePaths[key];
			var sessionFile = Constant.LO_PATH_SESSION_STORAGE + newFilePath;
			var sessionStorage = new SessionScopeStorage(sessionFile);

			// セッションストレージにファイルが無ければエラー
			if (sessionStorage.isFile()) {
				// パブリックストレージ取得
				var dir = Constant.LO_PATH_PUBLIC_STORAGE;
				var subDir = request.keiyakuNaiyoId + "/";
				var publicDir = new PublicStorage(dir + subDir);
				if (!publicDir.isDirectory()) {
					// ディレクトリが存在しなければ作成
					publicDir.makeDirectories();
				}

				// パブリックストレージにコピー
				var publicStrageFile = dir + subDir + newFilePath;
				var publicStorage = new PublicStorage(publicStrageFile);
				sessionStorage.copy(publicStorage, true);
			}
		}
	});

	// メール送信
	var param = {
		ticket_id : request.keiyakuNaiyoId
		, execUserCd : $userInfo.userCd
		, comment : request.comment
		, mail_id : Constant.LO_MAIL_ID_KEIYAKU_UPDATE
		, to_address : sendAddress.to
		, cc_address : sendAddress.cc
	};

	Content.executeFunction("/lo/common_libs/lo_send_mail", "sedMailExce", param);

	return functionResult;
}

function retrieveCommentDestinationPresetTargetUserData(request) {
	
	var functionResult = {
	    error: false,
		data: {},
		message: MessageManager.getMessage('KY02I012')  // TODO メッセージ
	};

	var destMap = {};
	destMap[Constant.LO_RECIPIENT_TYPE_TO] = [];
	destMap[Constant.LO_RECIPIENT_TYPE_CC] = [];
	
	var targetTypeLicenseeList = [];
	
	if (('preset_id' in request) && ('keiyaku_naiyo_id' in request)) {
		
	
		var keiyakuNaiyoResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKeiyakuNaiyoData", request.keiyaku_naiyo_id);
		if (keiyakuNaiyoResult.countRow == 0) {
			functionResult.error = true;
			functionResult.message = ""; // TODO メッセージ
			return functionResult;
		}
		var keiyakuNaiyoData = keiyakuNaiyoResult.data[0];

		var targetUsersResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveCommentDestinationPresetTargetUserData", request.preset_id);


		if (targetUsersResult.countRow > 0) {

			for(var key in targetUsersResult.data) {
				
				var targetData = targetUsersResult.data[key];

				if (targetData.target_type == Constant.LO_PRESET_TARGET_TYPE_LICENSEE) {
					targetTypeLicenseeList.push(targetData);
					continue;
				}
				

				if (targetData.target_type != Constant.LO_PRESET_TARGET_TYPE_MATTER) {
					if (targetData.user_cd) {
						var user = {user_cd : targetData.user_cd, user_name : targetData.user_nm};
						destMap[targetData.recipient_type].push(user);
					}
					continue;
				}

				if (targetData.matter_attr_cd == "licensee_user") {
					if (keiyakuNaiyoData.licensee_keiyaku_tanto_id) {
						var user = {user_cd : keiyakuNaiyoData.licensee_keiyaku_tanto_id, user_name : keiyakuNaiyoData.licensee_keiyaku_tanto_nm};
						destMap[targetData.recipient_type].push(user);
					}
					continue;
				}
				if (targetData.matter_attr_cd == "licensee_company") {
					var userListResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveUserList", keiyakuNaiyoData.kaisha_id);
					for (var userKey in userListResult) {
						var user = {user_cd : userListResult[userKey].user_cd, user_name : userListResult[userKey].user_nm};
						destMap[targetData.recipient_type].push(user);
					}
					continue;
				}

				var ticketMap = {};
				ticketMap[Constant.LO_TICKET_ID_HEAD_KYODAKU] = [];
				ticketMap[Constant.LO_TICKET_ID_HEAD_KIKAKU] = [];
				ticketMap[Constant.LO_TICKET_ID_HEAD_KAWARI] = [];
				
				var kyodakuListResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKyodakuList", request.keiyaku_naiyo_id);
				if (kyodakuListResult.countRow > 0) {
					for (var kyodakuKey in kyodakuListResult.data) {
						ticketMap[Constant.LO_TICKET_ID_HEAD_KYODAKU].push(kyodakuListResult.data[kyodakuKey].kyodaku_id);
					}
				}

				var kikakuListResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKikakuList", request.keiyaku_naiyo_id);
				if (kikakuListResult.countRow > 0) {
					for (var kikakuKey in kikakuListResult.data) {
						ticketMap[Constant.LO_TICKET_ID_HEAD_KIKAKU].push(kikakuListResult.data[kikakuKey].kikaku_id);
					}
				}
				
				var kawariListResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveKawariList", request.keiyaku_naiyo_id);
				if (kawariListResult.countRow > 0) {
					for (var kawariKey in kawariListResult.data) {
						ticketMap[Constant.LO_TICKET_ID_HEAD_KAWARI].push(kawariListResult.data[kawariKey].bunsho_id);
					}
				}

				if (targetData.matter_attr_cd == "ip_in_charge_group") {
					var allPublicGroupList = [];
					for (var ticketType in ticketMap) {
						var ticketIds = ticketMap[ticketType];
						for (var ticketKey in ticketIds) {
							var ticketId = ticketIds[ticketKey];
							var publicGroupList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getIpGroupList", ticketId, ticketType);
							allPublicGroupList = allPublicGroupList.concat(publicGroupList);
						}
					}
					for (var groupKey in allPublicGroupList) {
						var userList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getPublicGroupUserList", Constant.LO_GROUP_SET_CD, allPublicGroupList[groupKey]);
						for (var userKey in userList) {
							var user = {user_cd : userList[userKey].user_cd, user_name : userList[userKey].user_name};
							destMap[targetData.recipient_type].push(user);
						}
					}
					continue;
				}
				
				var allTicketIds = [];
				for (var ticketType in ticketMap) {
					var ticketIds = ticketMap[ticketType];
					allTicketIds = allTicketIds.concat(ticketIds);
				}
				var taskHistories = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveWorkflowTaskHistory", allTicketIds);

				var getUserList = function(nodeId) {
					var userList = [];
					for (var historyKey in taskHistories.data) {
						var taskHistory = taskHistories.data[historyKey];
						if (taskHistory.node_id == nodeId) {
							var user = {user_cd : taskHistory.execute_user_code, user_name : taskHistory.execute_user_name};
							userList.push(user);
						}
					}
					return userList;
				};

				if (targetData.matter_attr_cd == "ip_in_charge_user") {
					var userList = getUserList(Constant.LO_NODE_APPR_0);
					destMap[targetData.recipient_type] = destMap[targetData.recipient_type].concat(userList);
					
					if(userList.length < 1){
						userList = getUserList(Constant.LO_NODE_KIAN);					
					}
					
					if(userList.length < 1){
						userList = getUserList(Constant.LO_NODE_APPLY);
					}					

					destMap[targetData.recipient_type] = destMap[targetData.recipient_type].concat(userList);
					
					continue;
				}
				if (targetData.matter_attr_cd == "primary_approver") {
					var userList = getUserList(Constant.LO_NODE_APPR_1);
					destMap[targetData.recipient_type] = destMap[targetData.recipient_type].concat(userList);
					continue;
				}
				if (targetData.matter_attr_cd == "secondary_approver") {
					var userList = getUserList(Constant.LO_NODE_APPR_2);
					destMap[targetData.recipient_type] = destMap[targetData.recipient_type].concat(userList);
					continue;
				}
			}

		}
	}

	var destMapKeyList = [Constant.LO_RECIPIENT_TYPE_TO, Constant.LO_RECIPIENT_TYPE_CC];
	
	var userCds = [];
	for (var destMapKeyListIndex in destMapKeyList) {
		var destMapKey = destMapKeyList[destMapKeyListIndex];
		var dests = destMap[destMapKey];
		userCds = userCds.concat(dests.map(function(user){
			return user.user_cd;
		}));  
	};
	var companyMap = {};
	var userCompanies = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveBelongCompany", userCds);
	if (userCompanies.countRow > 0) {
		for (var key in userCompanies.data) {
			var userCompany = userCompanies.data[key];
			if (!(userCompany.company_cd in companyMap)) {
				companyMap[userCompany.company_cd] = [];
			}
			companyMap[userCompany.company_cd].push(userCompany.user_cd);
		}
	}
	
	for (var companyCd in companyMap) {
		var matchTargetDatas = targetTypeLicenseeList.filter(function(targetData){
			return targetData.company_cd == companyCd;
		});
		for (var key in matchTargetDatas) {
			var targetData = matchTargetDatas[key];
			if (targetData.user_cd) {
				var user = {user_cd : targetData.user_cd, user_name : targetData.user_nm};
				destMap[targetData.recipient_type].push(user);
			}
		}
		
	}

	var resultKeyMap = {};
	resultKeyMap[Constant.LO_RECIPIENT_TYPE_TO] = "mail_to";
	resultKeyMap[Constant.LO_RECIPIENT_TYPE_CC] = "mail_cc";

	// TO,CCそれぞれから重複ユーザ情報を削除し、かつ、TOに含まれるユーザ情報をCCから除外する
	var result = {
		mail_to : []
		, mail_cc : []
	};
	var userCdTemp = [];
	
	for (var destMapKeyListIndex in destMapKeyList) {
		var destMapKey = destMapKeyList[destMapKeyListIndex];
		var dests = destMap[destMapKey];
		for (var destKey in dests) {
			var user = dests[destKey];
			if (userCdTemp.indexOf(user.user_cd) == -1) {
				var resultKey = resultKeyMap[destMapKey];
				result[resultKey].push(user);
				userCdTemp.push(user.user_cd);
			}
		}
	}

	functionResult.data = result;
	return functionResult;
}
