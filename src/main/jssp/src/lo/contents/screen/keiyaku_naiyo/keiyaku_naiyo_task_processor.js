// 定数読み込み
Constant.load("lo/common_libs/lo_const");

/**
 * 契約内容に対するタスクを新規に作成します。
 * 
 * @param {object} keiyaku 契約内容
 * @param {array} recipients 宛先
 * @returns {string} 新規に作成したタスクID
 * 
 */
function newTask(keiyaku, recipients) {

	// ログインユーザ情報取得
	var userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo");

	var newTaskId = "TASK-" + Identifier.get();
	// DB接続
	var db = new TenantDatabase();
	var newTask = {
		keiyaku_naiyo_id : keiyaku.keiyaku_naiyo_id
		, task_id : newTaskId
		, keiyaku_status : keiyaku.keiyaku_status
		, irai_sha_kaisha_cd : userInfo.userCompanyDepartment.companyCd
		, irai_sha_kaisha_nm : userInfo.userCompanyDepartment.companyName
		, irai_sha_busho_cd : userInfo.userCompanyDepartment.departmentCd
		, irai_sha_busho_nm : userInfo.userCompanyDepartment.departmentName
		, irai_sha_user_cd : userInfo.userCd
		, irai_sha_user_nm : userInfo.userName
		, shori_cls : Constant.LO_TASK_SHORI_CLS_MISHORI
	};
	newTask = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", newTask, true);
	db.insert('lo_t_keiyaku_naiyo_task', newTask);

	var pgm = new IMMPublicGroupManager(userInfo.userCd, 'ja');
	var um = new IMMUserManager(userInfo.userCd, 'ja');
	var cm = new IMMCompanyManager(userInfo.userCd, 'ja');

	var systemDate = new Date();

	var targetNo = 1;
	for (var key in recipients) {
		var recipient = recipients[key];
		var newTaskTarget = {
			keiyaku_naiyo_id : keiyaku.keiyaku_naiyo_id
			, task_id : newTaskId
			, target_no : targetNo
			, recipient_type : recipient.recipientType
			, target_type : recipient.targetType
		};
		
		if (recipient.targetType == Constant.LO_TASK_TARGET_TYPE_USER) {
			var uKey = {
			    userCd : recipient.userCd // ユーザコード
			};
			var ur = um.getUser(uKey, systemDate, 'ja');
			newTaskTarget.user_cd = recipient.userCd;
			newTaskTarget.user_nm = ur.data.locales.ja.userName;
		}
		
		if (recipient.targetType == Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP) {
			var pgKey =  {
			    publicGroupCd : recipient.publicGroupCd, // パブリックグループコード
			    publicGroupSetCd : recipient.publicGroupSetCd // パブリックグループセットコード
			};
			var pgr = pgm.getPublicGroup(pgKey, systemDate, 'ja');
			newTaskTarget.public_group_set_cd = recipient.publicGroupSetCd;
			newTaskTarget.public_group_cd = recipient.publicGroupCd;
			newTaskTarget.public_group_nm = pgr.data.locales.ja.publicGroupName;
		}
		
		if (recipient.targetType == Constant.LO_TASK_TARGET_TYPE_COMPANY) {
			var dKey = {
			    companyCd : recipient.companyCd, // 会社コード
			    departmentCd : recipient.companyCd, // 組織コード
			    departmentSetCd : recipient.companyCd // 組織セットコード
			};
			var dr = cm.getDepartment(dKey, systemDate, 'ja');
			newTaskTarget.user_cd = recipient.companyCd;
			newTaskTarget.user_nm = dr.data.locales.ja.departmentName;
		}

		newTaskTarget = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", newTaskTarget, true);
		db.insert('lo_t_keiyaku_naiyo_task_target', newTaskTarget);
		
		targetNo++;
	}

	return newTaskId;
}

/**
 * 契約内容に対する指定タスクをログインユーザーのタスクとして再作成します。
 * 
 * @param {string} keiyakuNaiyoId 契約内容
 * @param {string} taskId 対象のタスクID
 * @param {string} taskKoushinBi 対象のタスクの更新日時
 * @returns {object} 実行結果
 */
function toMyTask(keiyakuNaiyoId, taskId, taskKoushinBi) {

	// ログインユーザ情報取得
	var userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo");

	var recipients = [];
	recipients.push({
		recipientType : Constant.LO_RECIPIENT_TYPE_TO
		, targetType : Constant.LO_TASK_TARGET_TYPE_USER
		, userCd : userInfo.userCd
	});
	return executeTask(keiyakuNaiyoId, taskId, taskKoushinBi, recipients, false);
}

/**
 * 契約内容に対する指定タスクを指定対象者へ進めます。
 * 
 * @param {string} keiyakuNaiyoId 契約内容
 * @param {string} taskId 対象のタスクID
 * @param {string} taskKoushinBi 対象のタスクの更新日時
 * @param {array} recipients 次の対象者
 * @returns {object} 実行結果
 */
function nextTask(keiyakuNaiyoId, taskId, taskKoushinBi, recipients) {

	return executeTask(keiyakuNaiyoId, taskId, taskKoushinBi, recipients, true);
}

/**
 * 契約内容に対する指定タスクを実行します。
 * 
 * @param {string} keiyakuNaiyoId 契約内容
 * @param {string} taskId 対象のタスクID
 * @param {string} taskKoushinBi 対象のタスクの更新日時
 * @param {array} recipients 次の対象者
 * @param {boolean} isForce true:強制的にタスクを次に進める場合 / false:現在のタスクがログインユーザ本人のみに仕掛かっている場合はタスクを進めない場合
 * @returns {object} 実行結果
 */
function executeTask(keiyakuNaiyoId, taskId, taskKoushinBi, recipients, isForce) {

	Logger.getLogger().info(' [executeTask]　指定タスクを実行 keiyakuNaiyoId ' + keiyakuNaiyoId);
	Logger.getLogger().info(' [executeTask]　指定タスクを実行 taskId ' + taskId);
	Logger.getLogger().info(' [executeTask]　指定タスクを実行 taskKoushinBi ' + taskKoushinBi);
	Logger.getLogger().info(' [executeTask]　指定タスクを実行 recipients ' + ImJson.toJSONString(recipients, true));
	Logger.getLogger().info(' [executeTask]　指定タスクを実行 isForce ' + isForce);
	var functionResult = {
	    error: false,
	    taskId: taskId,
		message: ""
	};

	// ログインユーザ情報取得
	var userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo");

	// 契約内容情報取得
	var keiyakuResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever"
		, "retrieveKeiyakuNaiyoData", keiyakuNaiyoId);
	var keiyaku = keiyakuResult.data[0]; // 一行だけ取得
	Logger.getLogger().info(' [executeTask]　契約内容情報 keiyaku ' + ImJson.toJSONString(keiyaku, true));

	// 契約内容未処理タスク情報取得
	var taskResult = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever"
		, "retrieveKeiyakuUntreatedTaskData", keiyakuNaiyoId);

	// 契約内容未処理タスク情報が取得出来ない場合
	if (taskResult.countRow == 0) {
		// 新規タスクを作成する
		functionResult.taskId = newTask(keiyaku, recipients);
		return functionResult;
	}

	var task = taskResult.data[0]; // 一行だけ取得
	Logger.getLogger().info(' [executeTask]　契約内容未処理タスク情報 task ' + ImJson.toJSONString(task, true));
	
	// 契約内容タスク対象ユーザ情報取得
	var targetUsers = retrieveKeiyakuTaskTargetUserDatas(keiyakuNaiyoId, task.task_id, [Constant.LO_RECIPIENT_TYPE_TO]);
	Logger.getLogger().info(' [executeTask]　契約内容タスク対象ユーザ情報 targetUsers ' + ImJson.toJSONString(targetUsers, true));

	if (isForce == false) {
		// TODO タスクIDが同一であるという条件を付与するか考慮する？
		if (keiyaku.keiyaku_status == task.keiyaku_status
			&& task.task_id == taskId
			&& targetUsers.length == 1) {
			for (var key in targetUsers) {
				var targetUser = targetUsers[key];
				if (targetUser.recipient_type == Constant.LO_RECIPIENT_TYPE_TO
					&& targetUser.target_type == Constant.LO_TASK_TARGET_TYPE_USER
					&& targetUser.user_cd == userInfo.userCd) {
					
					// 自分自身「だけ」がタスク対象ユーザである、かつ、契約内容のステータスも変更ないため、未実行タスクを進めない。
					return functionResult;
				}
			}
		}
	}
	
	// 現未処理タスクの処理区分判定
	// 現未処理タスクの処理区分はキャンセルとする
	var shoriCls = Constant.LO_TASK_SHORI_CLS_CANCEL;
	// TODO タスクIDが同一であるという条件を付与するか考慮する？
	if (task.task_id == taskId) {
		for (var key in targetUsers) {
			var targetUser = targetUsers[key];
			if (targetUser.user_cd == userInfo.userCd) {
				// 自分自身がタスク対象ユーザに含まれていたら、現未処理タスクの処理区分は処理済みとする
				shoriCls = Constant.LO_TASK_SHORI_CLS_SHORIZUMI;
				break;
			}
		}
	}
	Logger.getLogger().info(' [executeTask]　現未処理タスクの処理区分判定 shoriCls ' + shoriCls);

	// DB接続
	var db = new TenantDatabase();
	// 現未処理タスクの後始末
	var updateTask = {
		shori_cls : shoriCls
		, shori_sha_kaisha_cd : userInfo.userCompanyDepartment.companyCd
		, shori_sha_kaisha_nm : userInfo.userCompanyDepartment.companyName
		, shori_sha_busho_cd : userInfo.userCompanyDepartment.departmentCd
		, shori_sha_busho_nm : userInfo.userCompanyDepartment.departmentName
		, shori_sha_user_cd : userInfo.userCd
		, shori_sha_user_nm : userInfo.userName
	};
	updateTask = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", updateTask, false);

 	var updateResult = db.update('lo_t_keiyaku_naiyo_task', updateTask
 		, "keiyaku_naiyo_id = ? AND task_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?"
 		, [DbParameter.string(keiyakuNaiyoId), DbParameter.string(taskId), DbParameter.string(taskKoushinBi)]);
	if (updateResult.countRow == 0) {
		// 排他エラー処理
		Logger.getLogger().error(' [toMyTask] 排他エラー　lo_t_keiyaku_naiyo_task. key ' + keiyakuNaiyoId + ', ' + taskId + ', ' + taskKoushinBi);
		Transaction.rollback();
		functionResult.error = true;
		functionResult.message = MessageManager.getMessage('ER01E004');
		return functionResult;
	}
	
	// 新規タスクを作成する
	functionResult.taskId = newTask(keiyaku, recipients);
	return functionResult;
}

/**
 * 契約内容タスク対象ユーザ情報取得
 * 
 * @param {string} keiyakuNaiyoId 契約内容ID
 * @param {string} taskId タスクID
 * @param {array} recipientTypes 受信タイプ
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKeiyakuTaskTargetUserDatas(keiyakuNaiyoId, taskId, recipientTypes) {
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetUserData]　契約内容タスク対象ユーザ情報検索');

	// ログインユーザ情報取得
	var userInfo = Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "getUserInfo");

    var sql = ""; 
    
	sql += "WITH valid_user(user_cd, user_name, email_address1, is_bne) AS ( ";
	sql += "  SELECT ";
	sql += "    u.user_cd ";
	sql += "    , u.user_name ";
	sql += "    , u.email_address1 ";
	sql += "    , CASE WHEN EXISTS ";
	sql += "      (SELECT ";
	sql += "        * ";
	sql += "      FROM ";
	sql += "        imm_department_ath AS da ";
	sql += "      WHERE ";
	sql += "        da.company_cd IN (SELECT cd_naiyo FROM lo_m_koteichi WHERE cd_cls_id = '" + Constant.LO_CDCLS_BNE_COMPANY_CD + "' AND sakujo_flg = '0') ";
	sql += "        AND da.user_cd = u.user_cd ";
	sql += "        AND da.start_date <= CURRENT_DATE ";
	sql += "        AND da.end_date > CURRENT_DATE ";
	sql += "        AND da.delete_flag = '0') ";
	sql += "      THEN '1' ";
	sql += "      ELSE '0' ";
	sql += "    END AS is_bne ";
	sql += "  FROM ";
	sql += "    imm_user AS u ";
	sql += "  WHERE ";
	sql += "    u.locale_id = 'ja' ";
	sql += "    AND u.start_date <= CURRENT_DATE ";
	sql += "    AND u.end_date > CURRENT_DATE ";
	sql += "    AND u.delete_flag = '0' ";
	sql += ") ";
	sql += "SELECT ";
	sql += "  t.keiyaku_naiyo_id ";
	sql += "  , t.task_id ";
	sql += "  , t.keiyaku_status ";
	sql += "  , k.cd_naiyo AS keiyaku_status_nm ";
	sql += "  , t.touroku_bi AS irai_bi ";
	sql += "  , t.irai_sha_kaisha_cd ";
	sql += "  , t.irai_sha_kaisha_nm ";
	sql += "  , t.irai_sha_busho_cd ";
	sql += "  , t.irai_sha_busho_nm ";
	sql += "  , t.irai_sha_user_cd ";
	sql += "  , t.irai_sha_user_nm ";
	sql += "  , t.shori_cls ";
	sql += "  , t.koushin_bi AS shori_bi ";
	sql += "  , t.shori_sha_kaisha_cd ";
	sql += "  , t.shori_sha_kaisha_nm ";
	sql += "  , t.shori_sha_busho_cd ";
	sql += "  , t.shori_sha_busho_nm ";
	sql += "  , t.shori_sha_user_cd ";
	sql += "  , t.shori_sha_user_nm ";
	sql += "  , tt.target_no ";
	sql += "  , tt.recipient_type ";
	sql += "  , tt.target_type ";
	sql += "  , tt.public_group_set_cd ";
	sql += "  , tt.public_group_cd ";
	sql += "  , tt.public_group_nm ";
	sql += "  , tt.company_cd ";
	sql += "  , tt.company_nm ";
	sql += "  , CASE ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP + "' THEN pga.user_cd ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_COMPANY + "' THEN da.user_cd ";
	sql += "    ELSE tt.user_cd ";
	sql += "  END AS user_cd ";
	sql += "  , CASE ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.user_name ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_COMPANY + "' THEN dau.user_name ";
	sql += "    ELSE u.user_name ";
	sql += "  END AS user_nm ";
	sql += "  , CASE ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.email_address1 ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_COMPANY + "' THEN dau.email_address1 ";
	sql += "    ELSE u.email_address1 ";
	sql += "  END AS email_address1 ";
	sql += "  , CASE ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP + "' THEN pgau.is_bne ";
	sql += "    WHEN tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_COMPANY + "' THEN dau.is_bne ";
	sql += "    ELSE u.is_bne ";
	sql += "  END AS is_bne ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo_task AS t ";
	sql += "  LEFT JOIN lo_m_koteichi AS k ";
	sql += "    ON (k.cd_cls_id = '" + (userInfo.bneFlg == "1" ? Constant.LO_CDCLS_KEIYAKU_STATUS_PR : Constant.LO_CDCLS_KEIYAKU_STATUS_LI) + "' ";
	sql += "    AND k.cd_id = t.keiyaku_status ";
	sql += "    AND k.sakujo_flg = '0') ";
	sql += "  INNER JOIN lo_t_keiyaku_naiyo_task_target AS tt ";
	sql += "    ON (tt.keiyaku_naiyo_id = t.keiyaku_naiyo_id ";
	sql += "    AND tt.task_id = t.task_id ";
	sql += "    AND tt.sakujo_flg = '0')";
	sql += "  LEFT JOIN imm_public_grp_ath AS pga ";
	sql += "    ON (pga.public_group_set_cd = tt.public_group_set_cd ";
	sql += "    AND pga.public_group_cd = tt.public_group_cd ";
	sql += "    AND pga.start_date <= CURRENT_DATE ";
	sql += "    AND pga.end_date > CURRENT_DATE ";
	sql += "    AND pga.delete_flag = '0') ";
	sql += "  LEFT JOIN valid_user AS pgau ";
	sql += "    ON (pgau.user_cd = pga.user_cd) ";
	sql += "  LEFT JOIN imm_department_ath AS da ";
	sql += "    ON (da.company_cd = tt.company_cd ";
	sql += "    AND da.start_date <= CURRENT_DATE ";
	sql += "    AND da.end_date > CURRENT_DATE ";
	sql += "    AND da.delete_flag = '0') ";
	sql += "  LEFT JOIN valid_user AS dau ";
	sql += "    ON (dau.user_cd = da.user_cd) ";
	sql += "  LEFT JOIN valid_user AS u ";
	sql += "    ON (u.user_cd = tt.user_cd) ";
	sql += "WHERE ";
	sql += "  t.sakujo_flg = '0' ";
	//ユーザ名を取得できなかったユーザを除外する
	sql += "  AND ((tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_PUBLIC_GROUP + "' AND pgau.user_name is not null)";//　パブリックグループで登録されているデータで、マスタにいない人
	sql += "   OR (tt.target_type = '" + Constant.LO_TASK_TARGET_TYPE_COMPANY + "' AND dau.user_name is not null)";//　ユーザで登録されているデータで、マスタにいない人
	sql += "   OR (tt.target_type = 'user' AND u.user_name is not null) )";//　会社で登録されているデータで、マスタにいない人

	var param = {};
    param.keiyakuNaiyoId = keiyakuNaiyoId;
    param.taskId = taskId;
    if (recipientTypes) {
        param.recipientTypes = recipientTypes;
    }

	// 画面入力項目とDB項目のマッピング　todo 画面入力項目に合わせて追加
    var columnNameMap = {};
    columnNameMap["keiyakuNaiyoId"] = {col:"t.keiyaku_naiyo_id",comp:"eq"};
    columnNameMap["taskId"] = {col:"t.task_id",comp:"eq"};
    columnNameMap["recipientTypes"] = {col:"tt.recipient_type",comp:"in"};

    var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    
    var allBindParams = [];
	allBindParams = allBindParams.concat(condition.bindParams);

    sql += condition.sql;

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetUserData]　契約内容タスク対象ユーザ情報検索 SQL ' + sql + " params " + ImJson.toJSONString(allBindParams, true));
    var result = db.select(sql, allBindParams, 0);
	Logger.getLogger().info('[retrieveKeiyakuTaskTargetUserData]　契約内容タスク対象ユーザ情報検索 result ' + ImJson.toJSONString(result, true));
    return result.data;
	
}
