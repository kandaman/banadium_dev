Constant.load("lo/common_libs/lo_const");
/**
 * @file 共通関数群
 */

/**
 * ログインユーザの所属パブリックグループを取得
 * 
 * @return {array} パブリックグループコード
 */
function getUsergroup() {
	Logger.getLogger().debug('[getUsergroup] start');

	var userContext = Contexts.getUserContext();
	var usergroup = userContext.publicGroupList;
	var groupAry = [];
	var groupSet = [];
	for ( var i in usergroup) {
		var obj ={};
		// パブリックグループセットコードとパブリックグループコードをすべて取得
		obj.setCd = usergroup[i].publicGroupSetCd;
		obj.groupCd = usergroup[i].publicGroupCd;
		groupSet.push(obj); 
	}
	
	if (groupSet.length > 0){
		// DBから親のグループも取得
		groupAry = getParentgroup(groupSet);
	}
	Logger.getLogger().debug('[getUsergroup] end');
	return groupAry;
};

/**
 * 指定ユーザの所属パブリックグループを取得
 * @param {object} userCd ユーザID
 * @return {array} パブリックグループ一覧
 */
function getUsergroupByUserCd(userCd) {
	
	var db = new TenantDatabase();
	var sql = " SELECT * ";
	sql += " FROM imm_public_grp_ath ath  ";
	sql += " inner join imm_public_grp grp";
	sql += " ON ath.public_group_cd = grp.public_group_cd ";
	sql += " WHERE ath.delete_flag = '0' ";
	sql += "   AND ath.start_date <= CURRENT_DATE ";
	sql += "   AND ath.end_date > CURRENT_DATE ";
	sql += "   AND ath.user_cd like ? ";

	var param = [];

	param.push(DbParameter.string(userCd));
	
	var result = db.select(sql,param);
	var list = result.data;
	
	Logger.getLogger().info('list' + ImJson.toJSONString(list,true));

	return list;
};


/**
 * 所属パブリックグループの親グループも取得
 * 
 * @return {object} 検索情報
 */
function getParentgroup(groupSet) {
	
	var db = new TenantDatabase();
	var sql = " SELECT DISTINCT  ";
	sql += "   parent_public_group_cd ";
	sql += " FROM imm_public_grp_inc_ath ";
	sql += " WHERE delete_flag = '0' ";
	sql += "   AND start_date <= CURRENT_DATE ";
	sql += "   AND end_date > CURRENT_DATE ";
	sql += "   AND ( ";

	var pram = [];
	for (var i = 0; i < groupSet.length;i++){
		if (i > 0 ){
			sql += " OR ";
		}
		sql += "   (public_group_set_cd = ? AND public_group_cd = ? ) ";
		pram.push(DbParameter.string(groupSet[i].setCd));
		pram.push(DbParameter.string(groupSet[i].groupCd));
	}
	sql += "   ) ";
	
	var result = db.select(sql,pram);
	var list = [];
	for ( var i = 0; i < result.countRow; i++) {
		list.push(result.data[i].parent_public_group_cd);
	}
	return list;
}


/**
 * ログインユーザの権限チェック
 * 
 * @param {object} groupCd 判定するグループコード（複数の場合は配列で渡す）
 * @return {boolean}チェック結果
 */
function chkUsergroup(groupCd) {
	Logger.getLogger().debug('[chkUsergroup] start :' + groupCd);

	var groupList = getUsergroup();
	if (groupCd instanceof Array) {
		for ( var i in groupCd) {
			if (groupList.indexOf(groupCd[i]) > -1) {
				Logger.getLogger().debug('[chkUsergroup] end :' + groupCd + ' (true)');
				return true;
			}
		}
	} else {
		if (groupList.indexOf(groupCd) > -1) {
			Logger.getLogger().debug('[chkUsergroup] end :' + groupCd + ' (true)');
			return true;
		}
	}
	Logger.getLogger().debug('[chkUsergroup] end :' + groupCd + ' (false)');
	return false;
}

/**
 * 本日日付取得YYYY/MM/DD
 * 
 * @return {string} yyyy/mm/dd 形式の本日日付文字列
 */
function getTodayAsString() {
	var dateAttr = new Date();
	var year = dateAttr.getFullYear();
	var month = dateAttr.getMonth() + 1;
	var date = dateAttr.getDate();
	var baseData = year + '/' + month + '/' + date;
	return baseData;
}

/**
 * // ステータス名取得
 * @param {object} 検索データ
 * @param {string} 文書種別(ページ種別）
 * @param {string} 文書種別
 * @returns {object} 変換後データ
 */
function getStatusName(data, bunshoCls) {	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	// ライセンスプロダクションか判断
	var proFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE) ? false : true;

	// コード識別番号判定、CSS共通設定、カラム名設定
	// TODO 契約ドラフト個別のCSSあれば設定
	var cdClsId = "";
	var cssHead = "";
	var clmNameOfStatus = "";
	var clmNameOfStatusName = "";
	var clmNameOfStatusStyle = "";
	var statusNameChangeFlg = true;// ステータス名上書きフラグ

	if (proFlg) {
		// ライセンスプロダクション
		if (bunshoCls == "1") {	// 企画
			cdClsId = Constant.LO_CDCLS_KIKAKU_STATUS_PR;
			cssHead = "kikaku-status pr";
			clmNameOfStatus = "kikaku_status";
			clmNameOfStatusName = "kikaku_status_name";
			clmNameOfStatusStyle = "kikaku_status_style";
		} else if(bunshoCls == "2") {	// 許諾
			cdClsId = Constant.LO_CDCLS_KYODAKU_STATUS_PR;
			cssHead = "kyodaku-status pr";
			clmNameOfStatus = "kyodaku_status";
			clmNameOfStatusName = "kyodaku_status_name";
			clmNameOfStatusStyle = "kyodaku_status_style";
		} else if(bunshoCls == "3") {	// 契約ドラフト
			cdClsId = Constant.LO_CDCLS_KEIYAKU_STATUS_PR;
			cssHead = "kikaku-status pr";
			clmNameOfStatus = "keiyaku_status";
			clmNameOfStatusName = "keiyaku_status_name";
			clmNameOfStatusStyle = "keiyaku_status_style";
		} else if(bunshoCls == "4" || bunshoCls == "5" ||bunshoCls == "6") {	// 契約ドラフト
			cdClsId = Constant.LO_CDCLS_KAWARI_STATUS;
			cssHead = "kawari-status pr";
			clmNameOfStatus = "kawari_status";
			clmNameOfStatusName = "kawari_status_name";
			clmNameOfStatusStyle = "kawari_status_style";
		} else if(bunshoCls == "7" || bunshoCls == "8") {	// アカウント申請
			cdClsId = Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS;
			cssHead = "kawari-status pr";
			clmNameOfStatus = "shinsei_status";
			clmNameOfStatusName = "shinsei_status_name";
			clmNameOfStatusStyle = "shinsei_status_style";
		} else{	// MY文書
			cdClsId = Constant.LO_CDCLS_KIKAKU_STATUS_PR;
			cssHead = "mydoc-status pr";
			clmNameOfStatus = "status_cd";
			clmNameOfStatusName = "status_name";
			clmNameOfStatusStyle = "mydoc_status_style";
			
			statusNameChangeFlg = false;
		}
	} else {
		// ライセンシー
		if (bunshoCls == "1") {	// 企画
			cdClsId = Constant.LO_CDCLS_KIKAKU_STATUS_LI;
			cssHead = "kikaku-status li";
			clmNameOfStatus = "kikaku_status";
			clmNameOfStatusName = "kikaku_status_name";
			clmNameOfStatusStyle = "kikaku_status_style";
		} else if(bunshoCls == "2") {	// 許諾
			cdClsId = Constant.LO_CDCLS_KYODAKU_STATUS_LI;
			cssHead = "kyodaku-status li";
			clmNameOfStatus = "kyodaku_status";
			clmNameOfStatusName = "kyodaku_status_name";
			clmNameOfStatusStyle = "kyodaku_status_style";
		} else if(bunshoCls == "3") {	// 契約ドラフト
			cdClsId = Constant.LO_CDCLS_KEIYAKU_STATUS_LI;
			cssHead = "kikaku-status li";
			clmNameOfStatus = "keiyaku_status";
			clmNameOfStatusName = "keiyaku_status_name";
			clmNameOfStatusStyle = "keiyaku_status_style";
		} else if(bunshoCls == "7") {	// アカウント申請
			cdClsId = Constant.LO_CDCLS_ACCOUNT_SHINSEI_STATUS;
			cssHead = "kawari-status pr";
			clmNameOfStatus = "shinsei_status";
			clmNameOfStatusName = "shinsei_status_name";
			clmNameOfStatusStyle = "shinsei_status_style";
		} else {	// MY文書
			cdClsId = Constant.LO_CDCLS_KIKAKU_STATUS_LI;
			cssHead = "mydoc-status li";
			clmNameOfStatus = "status_cd";
			clmNameOfStatusName = "status_name";
			clmNameOfStatusStyle = "mydoc_status_style";
		}
	}
	
	var db = new TenantDatabase();
	var result;
	var sts = {};
	var sql = "select cd_id,cd_naiyo from lo_m_koteichi where cd_cls_id = ? and sakujo_flg='0' order by sort_no";
	var result = db.select(sql, [ DbParameter.string(cdClsId) ]);
	for (var i=0; i<result.countRow; i++) {
		sts[result.data[i].cd_id] = result.data[i].cd_naiyo;
	}

	var ret = "";
	var cssClasses = "";
	for (var i = 0;i < data.length;i++){
		if(statusNameChangeFlg){
			data[i][clmNameOfStatusName] = sts[data[i][clmNameOfStatus]];
		}
		
		data[i][clmNameOfStatusStyle] = cssHead + data[i][clmNameOfStatus];
	}
	return data;
}

/**
 * ユーザコンテキストから所属情報を取得する
 */
function getUserDepartmentInfo() {
	var userDepartmentObject = null;
	// カレント所属
	if (Contexts.getUserContext().currentDepartment != null) {
		userDepartmentObject = {
			"companyCd" : Contexts.getUserContext().currentDepartment.companyCd,
			"departmentCd" : Contexts.getUserContext().currentDepartment.departmentCd,
			"departmentName" : Contexts.getUserContext().currentDepartment.departmentName,
			"departmentFullName" : Contexts.getUserContext().currentDepartment.departmentFullName
		};
		return userDepartmentObject;
	}
	// 主所属
	if (Contexts.getUserContext().mainDepartment != null) {
		userDepartmentObject = {
			"companyCd" : Contexts.getUserContext().mainDepartment.companyCd,
			"departmentCd" : Contexts.getUserContext().mainDepartment.departmentCd,
			"departmentName" : Contexts.getUserContext().mainDepartment.departmentName,
			"departmentFullName" : Contexts.getUserContext().mainDepartment.departmentFullName
		};
		return userDepartmentObject;
	}
	// 所属している組織全てから、先頭の所属
	if (Contexts.getUserContext().allDepartments != null
			&& Contexts.getUserContext().allDepartments.length > 0) {
		userDepartmentObject = {
			"companyCd" : Contexts.getUserContext().allDepartments[0].companyCd,
			"departmentCd" : Contexts.getUserContext().allDepartments[0].departmentCd,
			"departmentName" : Contexts.getUserContext().allDepartments[0].departmentName,
			"departmentFullName" : Contexts.getUserContext().allDepartments[0].departmentFullName
		};
		return userDepartmentObject;
	}
	
	// 所属なし
	userDepartmentObject = {
		"companyCd" : null,
		"departmentCd" : null,
		"departmentName" : null,
		"departmentFullName" : null
	};
	return userDepartmentObject;
}

/**
 * ユーザの会社と組織の情報を取得する
 */
function getUserCompanyDepartmentInfo() {
	var userCompanyDepartmentObj = null;
	var deptInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserDepartmentInfo");
	if (deptInfo.companyCd != null ) {
		var companyList = Contexts.getUserContext().companyList;
		for (var listIndex = 0; listIndex < companyList.length; listIndex) {
			// 会社コードの一致する会社情報をセット
			if (deptInfo.companyCd == companyList[listIndex].companyCd) {
				userCompanyDepartmentObj = {
					"companyCd" : companyList[listIndex].companyCd,
					"companyName" : companyList[listIndex].companyName,
					"companyShortName" : companyList[listIndex].companyShortName,
					"departmentCd" : deptInfo.departmentCd,
					"departmentName" : deptInfo.departmentName,
					"departmentFullName" : deptInfo.departmentFullName
				};
				return userCompanyDepartmentObj;
			}
		}
		
		// 会社コードが一致しない場合は会社情報はセットしない
		userCompanyDepartmentObj = {
			"companyCd" : deptInfo.companyCd,
			"companyName" : null,
			"companyShortName" : null,
			"departmentCd" : deptInfo.departmentCd,
			"departmentName" : deptInfo.departmentName,
			"departmentFullName" : deptInfo.departmentFullName
		};
		return userCompanyDepartmentObj;
	}
	
	// 組織に所属していない場合
	userCompanyDepartmentObj = {
		"companyCd" : null,
		"companyName" : null,
		"companyShortName" : null,
		"departmentCd" : null,
		"departmentName" : null,
		"departmentFullName" : null
	};
	return userCompanyDepartmentObj;
	
}

/**
 * 共通項目に値をセットする
 * 
 * @param {object} セット対象のオブジェクト
 * @param {boolean} 新規登録の場合はtrue、更新の場合はfalse
 * @param {date} 現在日時を設定しない場合の日時
 * @return {object} セット後のオブジェクト
 */
function setCommonField(obj, create, dt) {
	var userCd = Contexts.getUserContext().userProfile.userCd;
	var now = dt ? dt : new Date();
	
	if (create) {
		obj.touroku_sha = userCd;
		obj.touroku_bi = now;
		obj.sakujo_flg = "0";
	}
	obj.koushin_sha = userCd;
	obj.koushin_bi = now;
	
	return obj;
}

/**
 * パブリックグループに所属するユーザ情報を取得します。
 * 
 * @param {String} publicGroupSetCd パブリックグループセットCD
 * @param {String} publicGroupCd パブリックグループCD
 * @return {Array} ユーザ一覧
 */
function getPublicGroupUserList(publicGroupSetCd, publicGroupCd) {

	var sql = "";
	sql += "SELECT ";
	sql += "  pga.public_group_set_cd AS public_group_set_cd ";
	sql += "  , pga.public_group_cd AS public_group_cd ";
	sql += "  , pg.public_group_name AS public_group_name ";
	sql += "  , pga.user_cd AS user_cd ";
	sql += "  , u.user_name AS user_name ";
	sql += "  , u.email_address1 AS email_address1 ";
	sql += "FROM ";
	sql += "  imm_public_grp_ath AS pga ";
	sql += "  INNER JOIN imm_public_grp AS pg ";
	sql += "    ON (pg.public_group_set_cd = pga.public_group_set_cd ";
	sql += "    AND pg.public_group_cd = pga.public_group_cd ";
	sql += "    AND pg.locale_id = 'ja' ";
	sql += "    AND pg.start_date <= CURRENT_DATE ";
	sql += "    AND pg.end_date > CURRENT_DATE) ";
	sql += "  INNER JOIN imm_user AS u ";
	sql += "    ON (u.user_cd = pga.user_cd ";
	sql += "    AND u.locale_id = 'ja' ";
	sql += "    AND u.start_date <= CURRENT_DATE ";
	sql += "    AND u.end_date > CURRENT_DATE) ";
	sql += "WHERE ";
	sql += "  pga.public_group_set_cd = ? ";
	sql += "  AND pga.public_group_cd = ? ";
	sql += "  AND pga.delete_flag = '0' ";
	sql += "  AND pga.start_date <= CURRENT_DATE ";
	sql += "  AND pga.end_date > CURRENT_DATE ";
	sql += "ORDER BY ";
	sql += "  pg.sort_key ";
	sql += "  , pg.public_group_set_cd ";
	sql += "  , pg.public_group_cd ";
	sql += "  , pga.sort_key ";
	sql += "  , u.user_cd ";

	var db = new TenantDatabase();
	var result = db.select(sql, [ DbParameter.string(publicGroupSetCd), DbParameter.string(publicGroupCd) ], 0);
	return result.data;
}

/**
 * 指定会社に所属するユーザ情報を取得します。
 * 
 * @param {String} companyCd 会社ID
 * @return {Array} ユーザ一覧
 */
function getCompanyUserList(companyCd) {

    var sql = ""; 
    sql += "SELECT ";
    sql += "  da.company_cd AS kaisha_id ";
    sql += "  , c.department_name AS kaisha_nm ";
    sql += "  , da.department_cd AS busyo_id ";
    sql += "  , d.department_name AS busyo_nm ";
    sql += "  , da.user_cd AS user_cd ";
    sql += "  , u.user_name AS user_nm ";
    sql += "  , u.email_address1 AS email_address1 ";
    sql += "FROM ";
    sql += "  imm_department_ath AS da ";
    sql += "  INNER JOIN imm_department AS c ";
    sql += "    ON (c.company_cd = da.company_cd ";
    sql += "    AND c.department_cd = da.company_cd ";
    sql += "    AND c.locale_id = 'ja' ";
    sql += "    AND c.start_date <= CURRENT_TIMESTAMP ";
    sql += "    AND c.end_date > CURRENT_TIMESTAMP ";
    sql += "    AND c.delete_flag = '0') ";
    sql += "  INNER JOIN imm_department AS d ";
    sql += "    ON (d.company_cd = da.company_cd ";
    sql += "    AND d.department_cd = da.department_cd ";
    sql += "    AND d.locale_id = 'ja' ";
    sql += "    AND d.start_date <= CURRENT_TIMESTAMP ";
    sql += "    AND d.end_date > CURRENT_TIMESTAMP ";
    sql += "    AND d.delete_flag = '0') ";
    sql += "  INNER JOIN imm_user AS u ";
    sql += "    ON (u.user_cd = da.user_cd ";
    sql += "    AND u.locale_id = 'ja' ";
    sql += "    AND u.start_date <= CURRENT_TIMESTAMP ";
    sql += "    AND u.end_date > CURRENT_TIMESTAMP ";
    sql += "    AND u.delete_flag = '0') ";
    sql += "WHERE ";
    sql += "  da.company_cd = ? ";
    sql += "  AND da.start_date <= CURRENT_TIMESTAMP ";
    sql += "  AND da.end_date > CURRENT_TIMESTAMP ";
    sql += "  AND da.delete_flag = '0' ";

    var params = [];
    params.push(DbParameter.string(companyCd))
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql, params, 0);
    return result.data;
}

/**
 * ユーザ情報を取得します。
 * 
 * @param {String} userCd ユーザCD
 * @return {Object} ユーザ情報（取得出来なかった場合は、null）
 */
function getUserInfo(userCd) {
	var locale_id = 'ja';
	var sql ="";
	sql+=" SELECT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	 , u.user_name ";
	sql+=" 	 , u.email_address1 ";
	sql+=" 	 , u.email_address2 ";
	sql+=" FROM imm_user u ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND u.user_cd = ? ";

	var pra = [];
	pra.push(DbParameter.string(userCd));

	var db = new TenantDatabase();
	var result = db.select(sql, pra, 0);
	
	if (result.countRow > 0) {
		return result.data[0];
	}
	
	return null;

}

/**
 * 固定値マスタからimuiSelect用listを作成
 * 
 * @param {Array}  list 初期list
 * @param {String} cdid 種別コード
 * @return {Array} imuiSelect用list
 */
function getSelectList(list,cdid) {
	var db = new TenantDatabase();
	var result;
	var sql = "select cd_id,cd_naiyo from lo_m_koteichi where cd_cls_id = ? and sakujo_flg='0' order by sort_no";
	var result = db.select(sql, [ DbParameter.string(cdid) ]);
	for ( var i = 0; i < result.countRow; i++) {
		list.push({
			label : result.data[i].cd_naiyo,
			value : result.data[i].cd_id
		});
	}
	if (list.length == 0) {
		list = [ {
			label : "",
			value : ""
		} ];
	}
	return list;
}

/**
 * オブジェクトプロパティからimuiSelect用に必要なプロパティを追加する
 * 
 * @param {Array}  list 変換対象オブジェクトの配列
 * @param {String} labelPropName ラベルとして利用する変換対象オブジェクトのプロパティ名
 * @param {String} valuePropName 値として利用する変換対象オブジェクトのプロパティ名
 */
function toSelectList(list, labelPropName, valuePropName) {
	for(var key in list) {
		var elem = list[key];
		elem.label = elem[labelPropName] ? elem[labelPropName] : "";
		elem.value = elem[valuePropName] ? elem[valuePropName] : "";
	}
}


/**
 * imuiSelect用listに初期値を設定
 * 
 * @param {Object} list imuiSelect用list
 * @param {String} val 選択値
 * @return 初期値設定済み list
 */
function selectedList(list, val) {
	var len = list.length;
	for ( var i = 0; i < len; i++) {
		if (list[i].value == val) {
			list[i].selected = true;
		} else {
			list[i].selected = false;
		}
	}
	return list;
}

/**
 * 固定値マスタからlistを作成
 * 
 * @param {Array}  list 初期list
 * @param {String} cdid 種別コード
 * @return {Array} list
 */
function getList(list,cdid) {
	var db = new TenantDatabase();
	var result;
	var sql = "select cd_id,cd_naiyo from lo_m_koteichi where cd_cls_id = ? and sakujo_flg='0' order by sort_no";
	var result = db.select(sql, [ DbParameter.string(cdid) ]);
	for ( var i = 0; i < result.countRow; i++) {
		list[i] = result.data[i].cd_naiyo;
	}
	if (list.length == 0) {
		list = [];
	}
	return list;
}

/**
 * 固定値マスタからKey:Value形式でlistを作成
 * 
 * @param {Array}  list 初期list
 * @param {String} cdid 種別コード
 * @return {Array} list
 */
function getKeyValue(list,cdid) {
	var db = new TenantDatabase();
	var result;
	var sql = "select cd_id,cd_naiyo from lo_m_koteichi where cd_cls_id = ? and sakujo_flg='0' order by sort_no";
	var result = db.select(sql, [ DbParameter.string(cdid) ]);
	for ( var i = 0; i < result.countRow; i++) {
		list[result.data[i].cd_id] = result.data[i].cd_naiyo;
	}
	if (list.length == 0) {
		list = [];
	}
	return list;
}

/**
 * ラベルが同一のオブジェクトを１つにまとめる
 * 
 * @param {Array}  list マージ対象リスト
 * @param {string} delim 値結合区切り文字
 * @return {Array} マージ後のリスト
 */
function mergeLabelList(list, delim) {

	var labels = [];
	var values = [];
	var len = list.length;
	for ( var i = 0; i < len; i++) {
		var row = list[i];
		var labelIndex = labels.indexOf(row.label);
		if (labelIndex < 0) {
			labels.push(row.label);
			values.push([]);
			labelIndex = labels.length - 1;
		}
		values[labelIndex].push(row.value);
	}

	var resultList = [];
	var labelsLength = labels.length;
	for ( var i = 0; i < labelsLength; i++) {
		resultList.push({
			label : labels[i]
			, value : values[i].join(delim)
		});
	}
	return resultList;
}

/**
 * 指定の値を持つ要素のリストへフィルターを実施
 * 
 * @param {Array}  list フィルタ対象リスト
 * @param {Array} values フィルタ値
 * @return {Array} フィルタ後のリスト
 */
function filterValueList(list, values) {
	var filterList = [];
	var listLength = list.length;
	var valuesLength = values.length;
	for ( var i = 0; i < listLength; i++) {
		var elem = list[i];
		for ( var j = 0; j < valuesLength; j++) {
			var value = values[j];
			if (elem.value == value) {
				filterList.push(elem);
			}
		}
	}
	return filterList;
}


/**
 * メッセージ ID でフィルタリングしたリストを取得する
 * 
 * @param {array} message_ids メッセージ ID リスト
 * @return {object} メッセージデータ
 */
function getFilteredMessageList(message_ids) {
	var filtered_messages = message_ids.reduce(function(acc, cur, idx, src) {
		acc[cur] = MessageManager.getMessage(cur);
		return acc;
	}, {});
	Logger.getLogger().debug(
			"[getFilteredMessageList]　" + ImJson.toJSONString(filtered_messages, true));
	return filtered_messages;
}

/**
 * 許諾用フロー分岐条件取得
 * 
 * @param {String} ユーザデータID
 * @return {object} 検索結果
 */
function getKyodakuBranch(user_data_id) {

	// ユーザデータIDを元に許諾種別と契約種別を取得
	var sql ="";
	sql +=" select kyodaku_cls, keiyaku_cls from lo_t_kyodaku k ";
	sql +=" inner join ";
	sql +=" (select matter_name from imw_t_actv_matter where user_data_id = ? ";
	sql +="   union all ";
	sql +="  select matter_name from imw_t_cpl_matter where user_data_id = ?) imw ";
	sql +=" on k.kyodaku_id = imw.matter_name ";
	sql +=" where k.sakujo_flg ='0' ";
	
	var pra = [];
	pra.push(DbParameter.string(user_data_id));
	pra.push(DbParameter.string(user_data_id));
	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	if (res.error) {
		Transfer.toErrorPage({
		    title: MessageManager.getMessage("SAMPLE.IMW.ERR.004"),
		    message: MessageManager.getMessage("SAMPLE.IMW.ERR.004"),
		    detail: [res.errorMessage]
		});
		return null;
	} else if (res.countRow == 0) {
	    Transfer.toErrorPage({
	        title: MessageManager.getMessage("SAMPLE.IMW.ERR.004"),
	        message: MessageManager.getMessage("SAMPLE.IMW.ERR.004"),
	        detail: [MessageManager.getMessage("SAMPLE.IMW.ERR.005")]
	    });
	    return null;
	}
	return res.data[0];
}

/**
 * コメントの登録
 * 
 * @param {String} ユーザデータID
 * @return {object} 検索結果
 */
function insertComment(ticketId, comment, status, tempFiles, yobi001, yobi002, yobi003, yakuwari, sosa) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var userCd = Contexts.getUserContext().userProfile.userCd;
	var userName = Contexts.getUserContext().userProfile.userName;
	var userCompanyDepartmentInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var publicGroupCd = "";
	if (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_HOMU)) {
		publicGroupCd = Constant.LO_GROUP_CD_HOMU;
	} else if (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION)) {
		publicGroupCd = Constant.LO_GROUP_CD_PRODUCTION;
	} else if (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE)) {
		publicGroupCd = Constant.LO_GROUP_CD_LICENSEE;
	}

	// 戻り値
	var ret = {
		error : false,
		message : ""
	};
	
	Transaction.begin(function() {
		// DB接続
		var db = new TenantDatabase();

		// コメントの登録
		if (comment.length > 0 || tempFiles.length > 0) {
			var uniqueCommentId = "COM_" + Identifier.get();
			var commentObj = {
				ticket_id : ticketId,
				comment_id : uniqueCommentId,
				naiyo : comment,
				yobi001 : yobi001,
				yobi002 : yobi002,
				yobi003 : yobi003,
				public_group : publicGroupCd,
				status : status,
				sosa_nm : sosa,
				yakuwari_nm : yakuwari,
				touroku_kaisha_cd : userCompanyDepartmentInfo.companyCd,
				touroku_kaisha_nm : userCompanyDepartmentInfo.companyName,
				touroku_busho_cd : userCompanyDepartmentInfo.departmentCd,
				touroku_busho_nm : userCompanyDepartmentInfo.departmentName,
				touroku_sha_cd : userCd,
				touroku_sha_nm : userName
			};
			commentObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentObj, true);
			
			var result = db.insert("lo_t_comment", commentObj);
			if (result.error) {
				Logger.getLogger().error('コメントの登録に失敗しました');
				ret.error = true;
				ret.message="コメント登録失敗";
				return;
			}
			
			// コメントのファイル登録
			for (var idx = 0; idx < tempFiles.length; idx++) {
				var commentFileObj = {
					comment_id : uniqueCommentId,
					file_name : tempFiles[idx].fileName,
					file_path : ticketId + "/wf/" + tempFiles[idx].uniquefileName
				};
				commentFileObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentFileObj, true, commentObj.koushin_bi);
			
				result = db.insert("lo_t_comment_tempu_file", commentFileObj);
				if (result.error) {
					ret.error = true;
					ret.message="ファイル登録失敗";
					return;
				}

			}
			
			// ファイル移動に失敗した場合に、テーブルをロールバックするため、ファイルは最後に移動
			for (var idx = 0; idx < tempFiles.length; idx++) {
				var sessionFile = Constant.LO_PATH_SESSION_STORAGE + tempFiles[idx].uniquefileName;
				var sessionStorage = new SessionScopeStorage(sessionFile);

				// セッションストレージにファイルが無ければエラー
				if (sessionStorage.isFile()) {
					// パブリックストレージ取得
					var dir = Constant.LO_PATH_PUBLIC_STORAGE;
					var subDir = ticketId + "/wf/";
					var publicDir = new PublicStorage(dir + subDir);
					if (!publicDir.isDirectory()) {
						// ディレクトリが存在しなければ作成
						publicDir.makeDirectories();
					}
	
					// パブリックストレージにコピー
					var publicStrageFile = dir + fileData.file_path;
					var publicStorage = new PublicStorage(publicStrageFile);
					sessionStorage.copy(publicStorage, true);
				} else {
					Logger.getLogger().error('セッションストレージからパブリックストレージへのファイル移動に失敗しました');
				}
			}
		}
	});
	
	return ret;
}


/**
 * WFコメントテーブル更新
 * @param {object} ワークフローパラメータ
 * @param {object} ユーザパラメータ
 * @returns {object} 結果
 */
function setWfComment(args,userParameter) {
	
    // 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	var userCd = Contexts.getUserContext().userProfile.userCd;
	var userName = Contexts.getUserContext().userProfile.userName;
	var userCompanyDepartmentInfo = getUserCompanyDepartmentInfo();
	var publicGroupCd = "";
	if (chkUsergroup(Constant.LO_GROUP_CD_HOMU)) {
		publicGroupCd = Constant.LO_GROUP_CD_HOMU;
	} else if (chkUsergroup(Constant.LO_GROUP_CD_PRODUCTION)) {
		publicGroupCd = Constant.LO_GROUP_CD_PRODUCTION;
	} else if (chkUsergroup(Constant.LO_GROUP_CD_LICENSEE)) {
		publicGroupCd = Constant.LO_GROUP_CD_LICENSEE;
	}
	
	// 戻り値
	var ret = {
		error : false,
		message : ""
	};
	
	// DB接続
	var db = new TenantDatabase();

		// コメントの登録
		var uniqueCommentId = "COM_" + Identifier.get();
		var nextNodeId = args.nextNodeIds === undefined?null:args.nextNodeIds[0];
		
		var commentObj = {
			ticket_id : userParameter.item_matterName,
			comment_id : uniqueCommentId,
			naiyo : userParameter.item_comment,
			public_group : publicGroupCd,
			node_id : args.nodeId,
			next_node_id : nextNodeId,
			status : args.resultStatus,
			sosa_nm : userParameter.item_proc_name,
			yakuwari_nm : getYakuwari(args.nodeId, nextNodeId, args.resultStatus, userParameter.item_matterName, userCd),
			touroku_kaisha_cd : userCompanyDepartmentInfo.companyCd,
			touroku_kaisha_nm : userCompanyDepartmentInfo.companyName,
			touroku_busho_cd : userCompanyDepartmentInfo.departmentCd,
			touroku_busho_nm : userCompanyDepartmentInfo.departmentName,
			touroku_sha_cd : userCd,
			touroku_sha_nm : userName
		}
		commentObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentObj, true);
		
		var result = db.insert("lo_t_comment", commentObj);
		if (result.error) {
			ret.error = true;
			ret.message="コメント登録失敗";
			return ret;
		}
		
		// コメントのファイル登録
		var commentFiles = userParameter.item_tempu_files;
		for (var idx = 0; idx < commentFiles.length; idx++) {
			var commentFileObj = {
				comment_id : uniqueCommentId,
				file_name : commentFiles[idx].fileName,
				file_path : userParameter.item_matterName + "/wf/" + commentFiles[idx].uniquefileName
			}
			commentFileObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentFileObj, true, commentObj.koushin_bi);
		
			// TODO：エラーをハンドリングする
			db.insert("lo_t_comment_tempu_file", commentFileObj);
			
			if (result.error) {
				ret.error = true;
				ret.message="ファイル登録失敗";
				return ret;
			}
			
			
		    // ファイルをセッションストレージからパブリックストレージへ移動
		    // セッションストレージ取得
		    var filname = Constant.LO_PATH_SESSION_STORAGE + commentFiles[idx].uniquefileName;
		    var sessionStorage = new SessionScopeStorage(filname);
		    if (sessionStorage.isFile()) {
				// パブリックストレージ取得
				var dir = Constant.LO_PATH_PUBLIC_STORAGE;
				var subDir = userParameter.item_matterName + "/wf/";
				var publicDir = new PublicStorage(dir + subDir);
				if (!publicDir.isDirectory()) {
					// ディレクトリが存在しなければ作成
					publicDir.makeDirectories();
				}

				// パブリックストレージにコピー
				var publicStrageFile = dir + commentFileObj.file_path;
				var publicStorage = new PublicStorage(publicStrageFile);
				sessionStorage.copy(publicStorage, true);
			} else {
      	        //Debug.console('ファイルが存在しません------------------------------');
      	    	Logger.getLogger().error('セッションストレージからパブリックストレージへのファイル移動に失敗しました');
		    }
		}

	return ret;
}

/**
 * 営業時間外画面(リダイレクト)
 */
function redirectToOutsideHours(params) {
	
	if(params.outside_cls =="1"){//営業時間外
		params.detail_message = params.detail_message.replace(/{start_time}/g,params.start_hour);
		params.detail_message = params.detail_message.replace(/{end_time}/g,params.end_hour);
		
		var msg = params.detail_message.split("<br>");
		
		Transfer.toInformationPage({
					title : MessageManager.getMessage('LO.CAP.SYSTEMNAME'),					
					message : MessageManager.getMessage('ER01E014'),
					detail : msg,
					returnUrl : '/login',
					returnUrlLabel : 'TOPに戻る',
					parameter : {
						key : 'value',
						list : [ '1', '2', '3' ]
					}
				});
	}else{//昼休み
		params.detail_message = params.detail_message.replace(/{start_time}/g,params.start_hour);
		params.detail_message = params.detail_message.replace(/{end_time}/g,params.end_hour);
		
		var msg = params.detail_message.split("<br>");
		Transfer.toInformationPage({
					title : MessageManager.getMessage('LO.CAP.SYSTEMNAME'),
					message : 'システムメンテナンス中です',					
					detail : msg,
					returnUrl : '/login',
					returnUrlLabel : 'TOPに戻る',
					parameter : {
						key : 'value',
						list : [ '1', '2', '3' ]
					}
				});
	
	}
	
}

/**
 * 営業時間確認
 */
function checkOutsideHours() {
	Constant.load("lo/common_libs/lo_const");
	var db = new TenantDatabase();
	var result;
	var sql = "select ";
	sql += "    to_char(now(), 'hh24mi') as now ";
	sql += "    , m1.cd_id as outside_cls ";
	sql += "    , m1.cd_naiyo as kaishi ";
	sql += "    , m2.cd_naiyo as shuryo ";
	sql += "    , concat(left(m1.cd_naiyo,2),':',right(m1.cd_naiyo,2)) as end_hour ";
	sql += "    , concat(left(m2.cd_naiyo,2),':',right(m2.cd_naiyo,2)) as start_hour ";
	sql += "    , case when extract(dow from now()) in (0,6) then '1' else '0' end as weekend_flg "
	sql += "    , m0.cd_naiyo as unblock_flg "
	sql += "    , m3.cd_naiyo as detail_message"
	sql += "  from ";
	sql += "    lo_m_koteichi m0, lo_m_koteichi m1, lo_m_koteichi m2, lo_m_koteichi m3  ";
	sql += "  where ";
	sql += "    m0.cd_cls_id = '"+ Constant.LO_CDCLS_SERVICE_UNBLOCK_FLG +"'";
	sql += "    and m0.cd_id = '1' and m0.sakujo_flg = '0' ";
	sql += "    and m1.cd_cls_id = '"+ Constant.LO_CDCLS_SERVICE_STOP +"'";
	sql += "    and m1.sakujo_flg = '0' ";
	sql += "    and m2.cd_cls_id = '"+ Constant.LO_CDCLS_SERVICE_START +"'";
	sql += "    and m2.sakujo_flg = '0' ";
	sql += "    and m3.cd_cls_id = '"+Constant.LO_CDCLS_OUT_OF_TIME_MESSAGE+"'";
	sql += "    and m1.cd_id = m2.cd_id ";
	sql += "    and m1.cd_id = m3.cd_id ";
	var result = db.select(sql);
	Logger.getLogger().info(sql);
	//phase3.0より、複数回のシステム停止を設定可能とする
	return result.data;
}

/**
 * SQL WHERE 条件を作成します。
 * 
 * @param {object} パラメータ名とパラメータ値のオブジェクト
 * @param {object} パラメータ名のカラム名、比較演算子のオブジェクト
 * @returns {object} 結果
 */
function createWhereCondition(param, columnNameMap) {

	var toDbParameter = function(val) {
		if (typeof val === "number") {
			return DbParameter.number(val);
		}
		return DbParameter.string(val);
	}
	

	var sql = "";
	var bindParams = [];

    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val = param[key];
    	if (val == ""){
    		continue;
    	}

    	if (isArray(val) && val.length == 0) {
    		continue;
    	}
    	

    	// パラメータの名前に紐づけられたカラムを取得
    	var map = columnNameMap[key];
    	if (typeof map === "undefined"){
    		continue;
    	}

    	//sqlに条件の追加
    	if (['in','ni'].indexOf(map.comp) > -1) {
    			var comp = map.comp == 'in' ? "IN" : "NOT IN";
    			
        		sql+= " AND " + map.col + " " + comp + " (";
        		val.forEach(function(v, i) {
                    // 入力値をセット
        			if (i > 0) {
            			sql+= ", ";
        			}
        			sql+= "?";
        			bindParams.push(toDbParameter(v));
        		});
        		sql+= ") ";

    	} else {
        	if (map.comp == 'like') {
        		//sql+= " AND func_conv_half2full(" + map.col + ") ilike '%'||func_conv_half2full(?)||'%' ";
        		sql+= " AND " + map.col + " ilike '%'||?||'%' "; // todo フリーワードの仕様によって色々加工する
            } else if (map.comp == 'ge') {
        		sql+= " AND " + map.col + " >= ? ";
            } else if (map.comp == 'le') {
        		sql+= " AND " + map.col + " <= ? ";
            } else if (map.comp == 'ne') {
        		sql+= " AND " + map.col + " != ? ";
            } else {
        		sql+= " AND " + map.col + " = ? ";
            }
        	
            // 入力値をセット
        	bindParams.push(toDbParameter(val));
    	}

    }
    
    return {sql: sql, bindParams: bindParams};
}


/**
 * SQL WHERE 条件を作成します。取得した条件をOrでつなぎます。
 * 
 * @param {object} パラメータ名とパラメータ値のオブジェクト
 * @param {object} パラメータ名のカラム名、比較演算子のオブジェクト
 * @returns {object} 結果
 */
function createWhereConditionOr(param, columnNameMap) {

	var toDbParameter = function(val) {
		if (typeof val === "number") {
			return DbParameter.number(val);
		}
		return DbParameter.string(val);
	}
	var sql = "";
	var bindParams = [];
	for(var key in param){
		var val = param[key];
		if (val == ""){
			continue;
		}
		if (isArray(val) && val.length == 0) {
			continue;
		}
		var map = columnNameMap[key];
		if (typeof map === "undefined"){
			continue;
		}
		if (sql != ""){
			sql += " OR ";
		}
		if (['in','ni'].indexOf(map.comp) > -1) {
			var comp = map.comp == 'in' ? "IN" : "NOT IN";
			sql += map.col + " " + comp + " (";
			val.forEach(function(v, i) {
				if (i > 0) {
					sql+= ", ";
				}
				sql += "?";
				bindParams.push(toDbParameter(v));
			});
			sql+= ") ";
		} else {
			if (map.comp == 'like') {
				sql += map.col + " ilike '%'||?||'%' ";
			} else if (map.comp == 'ge') {
				sql += map.col + " >= ? ";
			} else if (map.comp == 'le') {
				sql += map.col + " <= ? ";
			} else if (map.comp == 'ne') {
				sql += map.col + " != ? ";
			} else {
				sql += map.col + " = ? ";
			}
			bindParams.push(toDbParameter(val));
		}
	}
	if (sql != ""){
		sql = " AND (" + sql + ") ";
	}
	return {sql: sql, bindParams: bindParams};
}

function chkDeleted(param) {
	var errorFlg = false;
	if(!param) {
		// データなし
		errorFlg = true;
	} else if('sakujo_flg' in param) {
		if (param.sakujo_flg != "0") {
			// 削除フラグON
			errorFlg = true;
		}
	}
	
	if(errorFlg) {
		Transfer.toErrorPage({
			title: MessageManager.getMessage('ER01E001'),
			message: MessageManager.getMessage('ER01E006'),
			detail: [MessageManager.getMessage('ER01E009')],
			returnUrl: 'lo/contents/screen/user/myProcess_list',
			returnUrlLabel: MessageManager.getMessage('LO.TITLE.USER.MY_PROCESS_LIST') + 'へ'
		});
	}
}

/**
 * 権限エラーページにジャンプ
 * @param {boolean} 参照権限の場合はtrueにする
 */
function toNoAuthorityPage(readOnly) {
	var detailMsgNo = readOnly ? 'ER01E008' : 'ER01E003';
	Transfer.toErrorPage({
	    title: MessageManager.getMessage('ER01E001'),
	    message: MessageManager.getMessage('ER01E002'),
	    detail: [MessageManager.getMessage(detailMsgNo)],
		returnUrl: 'lo/contents/screen/user/myProcess_list',
		returnUrlLabel: MessageManager.getMessage('LO.TITLE.USER.MY_PROCESS_LIST') + 'へ'
	  });
}

/**
 * チケットID採番
 * @param {string} ID接頭辞
 * @returns {string} 結果
 */
function getNextId(header) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	var db = new TenantDatabase();
	var result;
	var seqName;
	if(header == Constant.LO_TICKET_ID_HEAD_KIKAKU) {
		seqName = "seq_lo_kikaku_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_KYODAKU) {
		seqName = "seq_lo_kyodaku_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_KEIYAKU) {
		seqName = "seq_lo_keiyaku_naiyo_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_KAWARI_KIKAKU) {
		seqName = "seq_lo_kawari_kikaku_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_KAWARI_KYODAKU) {
		seqName = "seq_lo_kawari_kyodaku_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_KAWARI_LICENSE_PROPOSAL) {
		seqName = "seq_lo_kawari_license_proposal_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_ACCOUNT_SHINSEI) {
		seqName = "seq_lo_account_shinsei_id";
	} else if(header == Constant.LO_TICKET_ID_HEAD_SHANAI_ACCOUNT_SHINSEI) {
		seqName = "seq_lo_account_shinsei_id_shanai";
	} else {
		return null; 
	}
	Logger.getLogger().info(' [seqName]' + seqName);
	var sql = "select '" + header + "' || LPAD(nextval('" + seqName + "')::varchar(8),8,'0') as ticket_id";
	var result = db.select(sql);
	return result.data[0].ticket_id;
}

/**
 * ip担当グループ取得
 * @param {string} 文書id
 * @returns {array} 結果
 */
function getIpGroupCd(ticket_id) {

	var type="";
	
    // 企画か許諾か判断
	var sql = "";
	sql += "select 'KK' as type from lo_t_kikaku where sakujo_flg = '0' and kikaku_id = ? ";
	sql += "union all ";
	sql += "select 'KD' as type from lo_t_kyodaku where sakujo_flg = '0' and kyodaku_id= ?  ";
	sql += "union all ";
	sql += "select 'KW' as type from lo_t_kawari where sakujo_flg = '0' and bunsho_id= ?  ";
	sql += "union all ";
	sql += "select 'AC' as type from lo_t_account_shinsei where sakujo_flg = '0' and shinsei_id= ?  ";
	var strParam=[];
    strParam.push(DbParameter.string(ticket_id));
    strParam.push(DbParameter.string(ticket_id));
    strParam.push(DbParameter.string(ticket_id));
    strParam.push(DbParameter.string(ticket_id));
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    if (result.countRow < 1){
    	return [];
    }
    
    // 担当グループのリストを取得
    return getIpGroupList(ticket_id,result.data[0].type);
}
/**
 * ip担当グループ取得
 * @param {string} 文書id
 * @param {string} 文書種別(KK:企画 KD:許諾)
 * @returns {array} 結果
 */
function getIpGroupList(ticket_id,ticket_Type) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	Logger.getLogger().info(' [seqName]' + ticket_Type);
	var locale_id = 'ja';
    var sql = "";
    if (ticket_Type == 'KD'){
        sql+=" SELECT "; 
        sql+=" CASE WHEN t.tantou_kakari_cd ='3' THEN m.proom_tantou_group_cd ELSE t.tantou_group_cd END as tantou_group_cd "; //タイトルマスタの担当係が'3'の場合、登録会社に紐づくグループを取得
    	sql+=" FROM lo_t_kikaku ki ";
    	sql+=" INNER JOIN lo_t_kyodaku_kikaku_himozuke ky ";
    	sql+="    ON ki.kikaku_id = ky.kikaku_id  ";
    	sql+="   AND ky.sakujo_flg = '0' ";
        sql+=" INNER JOIN lo_m_kaisha m ";
        sql+="   ON ki.kaisha_id = m.kaisha_id ";
        sql+="   AND m.sakujo_flg = '0' ";
    }else if(ticket_Type == 'KK'){
        sql+=" SELECT "; 
        sql+=" CASE WHEN t.tantou_kakari_cd ='3' THEN m.proom_tantou_group_cd ELSE t.tantou_group_cd END as tantou_group_cd "; //タイトルマスタの担当係が'3'の場合、登録会社に紐づくグループを取得
        sql+=" FROM lo_t_kikaku ki ";
        sql+=" INNER JOIN lo_m_kaisha m ";
        sql+="   ON ki.kaisha_id = m.kaisha_id ";
        sql+="   AND m.sakujo_flg = '0' ";
    }else if(ticket_Type == 'KW'){
    	sql+=" SELECT "; 
        sql+=" CASE WHEN t.tantou_kakari_cd ='3' THEN m.proom_tantou_group_cd ELSE t.tantou_group_cd END as tantou_group_cd "; //タイトルマスタの担当係が'3'の場合、登録会社に紐づくグループを取得
        sql+=" FROM lo_t_kawari ki ";
        sql+=" INNER JOIN lo_m_kaisha m ";
        sql+="   ON ki.kaisha_id = m.kaisha_id ";
        sql+="   AND m.sakujo_flg = '0' ";    
    }else if(ticket_Type == 'AS'){
    	sql+=" SELECT "; 
        sql+=" CASE WHEN t.tantou_kakari_cd ='3' THEN m.proom_tantou_group_cd ELSE t.tantou_group_cd END as tantou_group_cd "; //タイトルマスタの担当係が'3'の場合、登録会社に紐づくグループを取得
        sql+=" FROM (select shinsei_id,kaisha_id,shinsei_title_cd as title_cd,sakujo_flg  from lo_t_account_shinsei) ki ";
        sql+=" INNER JOIN lo_m_kaisha m ";
        sql+="   ON ki.kaisha_id = m.kaisha_id ";
        sql+="   AND m.sakujo_flg = '0' ";
    }else{
    	return [];
    }
    
    sql+=" INNER JOIN lo_m_title t ";
    sql+="    ON ki.title_cd = t.title_cd  ";
	sql+="   AND t.sakujo_flg = '0' ";
    sql+=" INNER JOIN imm_public_grp g ";
    sql+="    ON t.tantou_group_cd = g.public_group_cd  ";
	sql+="   AND g.public_group_set_cd = '"+Constant.LO_GROUP_SET_CD+"' ";
	sql+="   AND g.locale_id = '"+locale_id+"' ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
    sql+= " WHERE ki.sakujo_flg = '0'";
    
    if (ticket_Type == 'KD'){
        sql+= "   AND ky.kyodaku_id = ? ";
    }else if (ticket_Type == 'KK'){
        sql+= "   AND ki.kikaku_id = ? ";
   }else if (ticket_Type == 'KW'){
    	sql+= "   AND ki.bunsho_id = ? ";
   }else if(ticket_Type == 'AS'){
	   sql+= "   AND ki.shinsei_id = ? ";
   }     
    
    var db = new TenantDatabase();
    var result = db.select(sql,[DbParameter.string(ticket_id)]);
    Logger.getLogger().info('[sql]　' + sql);
    var list = [];
    if (result.countRow > 0){
    	for (var i=0;i < result.data.length;i++){
    		list.push(result.data[i].tantou_group_cd);
    	}
    }else{
    	list.push(Constant.LO_GROUP_APPR_0); // 取れなかった場合のデフォルトグループ
    }
    
    // 重複を削除
	var groupList = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });
	
    return groupList;
}
/*
function getIpGroupList(ticket_id,ticket_Type) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var locale_id = 'ja';
    var sql = "";
    sql+=" SELECT t.tantou_group_cd ";
    sql+=" FROM lo_t_kikaku ki ";
    if (ticket_Type == 'KD'){
    	sql+=" INNER JOIN lo_t_kyodaku_kikaku_himozuke ky ";
    	sql+="    ON ki.kikaku_id = ky.kikaku_id  ";
    	sql+="   AND ky.sakujo_flg = '0' ";
    }
    sql+=" INNER JOIN lo_m_title t ";
    sql+="    ON ki.title_cd = t.title_cd  ";
	sql+="   AND t.sakujo_flg = '0' ";
    sql+=" INNER JOIN imm_public_grp g ";
    sql+="    ON t.tantou_group_cd = g.public_group_cd  ";
	sql+="   AND g.public_group_set_cd = '"+Constant.LO_GROUP_SET_CD+"' ";
	sql+="   AND g.locale_id = '"+locale_id+"' ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
    sql+= " WHERE ki.sakujo_flg = '0'";
    
    if (ticket_Type == 'KD'){
        sql+= "   AND ky.kyodaku_id = ? "
    }else{
        sql+= "   AND ki.kikaku_id = ? "
    }
    
    var db = new TenantDatabase();
    var result = db.select(sql,[DbParameter.string(ticket_id)]);
    
    var list = [];
    if (result.countRow > 0){
    	for (var i=0;i < result.data.length;i++){
    		list.push(result.data[i].tantou_group_cd);
    	}
    }else{
    	list.push(Constant.LO_GROUP_APPR_0); // 取れなかった場合のデフォルトグループ
    }
    
    // 重複を削除
	var groupList = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });
	
    return groupList;
}
*/

/**
 * 新規申請時、ワークフローのノード処理対象者を設定
 * @param {string} 文書id
 * @param {string} 文書種別
 * @returns {String} ノード設定値
 */
function nodeSetteing(ticket_id, ticket_type){
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	// 文書idからタイトルに紐づくグループを取得
    var target_group = getIpGroupCd(ticket_id, ticket_type);
    
	// パブリックグループは[セットコード＋＾+グループコード]にする
	var groupSet = [];
    for (var key in target_group){
    	groupSet.push(Constant.LO_GROUP_SET_CD+"^"+target_group[key]);
    }

	// BNE担当ノードに処理対処ユーザを設定
	var node={};
	node[Constant.LO_NODE_APPR_0] = groupSet;
	
	// imartパラメータ生成
    // 企画承認者のノード設定
	var nodeSetting = {"DCNodeSetting" : {}}; //動的承認ノード設定
	for(var key in node) {
		var processTargetConfigs = []; //処理対象プラグイン情報
		// ノードごとにユーザを設定
		var users = node[key];
		for(var i in users) {
			var userconf = {
					"extensionPointId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic",
				    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.public_group",
				    "parameter" : users[i]
			}
			processTargetConfigs.push(userconf);
		}
		nodeSetting.DCNodeSetting[key] = {"displayFlag" : false, "processTargetConfigs":processTargetConfigs}
	}
	
    // JSON側でパラメータに渡す
	return ImJson.toJSONString(nodeSetting);
}

/**
 * パブリックストレージ内ファイル複製
 * @param {string} コピー元ファイルパス
 * @param {string} コピー先サブディレクトリ名
 * @return {string} コピー先ファイルパス
 */
function copyPublicStorage(fileName, subDir){
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	subDir = subDir ? subDir + "/" : "";
	var dir = Constant.LO_PATH_PUBLIC_STORAGE;
	var filePath = dir + fileName;
	var publicStorage = new PublicStorage(filePath);

	// パブリックストレージにファイルが無ければエラー
	if (publicStorage.isFile()) {
		// コピー先ディレクトリ
		var newDirPath = dir + subDir;
		var newDir = new PublicStorage(newDirPath);
		if (!newDir.isDirectory()) {
			// ディレクトリが存在しなければ作成
			newDir.makeDirectories();
		}
		
		// パブリックストレージにコピー
		var newFileName = Identifier.get();
		var newFilePath = newDirPath + newFileName;
		var newPublicStorage = new PublicStorage(newFilePath);
		
		publicStorage.copy(newPublicStorage, true);
		
		return subDir + newFileName;
	} else {
		Transfer.toErrorPage({
			title: '',
			message: 'エラーが発生しました',
			detail: ['複製元ファイルが存在しません。'],
			returnUrl: 'lo/contents/screen/user/myProcess_list',
			returnUrlLabel: MessageManager.getMessage('LO.TITLE.USER.MY_PROCESS_LIST') + 'へ'
		});
	}
}

/**
 * 会社の契約種別を取得します。
 * 
 * @param {string} kaishaId 会社CD
 * @returns {string} 契約種別
 */
function getKeiyakuCls(kaishaId) {
	
	var sql = "";
	sql += "SELECT ";
	sql += "  keiyaku_cls ";
	sql += "FROM ";
	sql += "  lo_m_kaisha ";
	sql += "WHERE ";
	sql += "  kaisha_id = ? ";
	sql += "  AND sakujo_flg = '0' ";

    var db = new TenantDatabase();
    var result = db.select(sql,[DbParameter.string(kaishaId)], 0);
    if (result.countRow == 0) {
    	return Constant.LO_KEIYAKU_SHUBETSU_KOBETSU; // TODO 定義が見つからなかった場合、一旦個別契約？
    }
    
    return result.data[0].keiyaku_cls;
    
}

/**
* DBから取戻しのためのフロー情報を取得
* imw_t_cpl_taskから最新の承認者の情報を取得
*/
function getApplyTskInfo(imwSystemMatterId,user_cd) {
	var db = new TenantDatabase();
    var sql ="";
    sql +="  select  ";
    sql +="  	  a.system_matter_id ";
    sql +="  	 ,a.flow_id ";
    sql +="  	 ,t.status ";
    sql +="  	 ,t.update_user_code as userId ";
    sql +="  	 ,t.node_id ";
    sql +="  	 ,t.node_type  ";
    sql +="  from imw_t_actv_matter a ";
    sql +="  inner join imw_t_before_task as b ";
    sql +="  on a.system_matter_id = b.system_matter_id ";
    sql +="  inner join imw_t_cpl_task as t ";
    sql +="  on a.system_matter_id = t.system_matter_id ";
    sql +="  and b.before_task_id = t.task_id ";
    sql +="  where a.system_matter_id = ?  ";
    sql +="  	and t.update_user_code = ?  ";
    //差し戻しの引き戻しも可能にするため、cancelを追加 ※絞らなくても問題ないような気もするが
    sql +="  	and (t.status in ('apply', 'reapply', 'cancel', 'sendback', 'approve'))";
    
    var pra = [DbParameter.string(imwSystemMatterId),DbParameter.string(user_cd)];
    var result = db.select(sql,pra);
    
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};

/**
 * 日付文字列からDate型に変換する
 * 注意：DateTimeFormatter.parseToDateを使用するとロケールの日付により、想定している日付にならない場合があるため、こちらを推奨。
 */
function getDateObj(strDate, delim) {
	try {
		var aryDateString = strDate.split(delim);
		if (aryDateString && aryDateString.length == 3) {
			var tempDate = new Date(aryDateString[0], aryDateString[1] -1, aryDateString[2]);
			return tempDate;
		}
	} catch (error) {
		return null;
	}
	
	return null;
}

/**
 * ノードに設定されているユーザを取得する
 * ノードにユーザが設定されていない場合は、履歴から取得する
 */
function getNodeUser(systemMatterId, targetNodeId, isCpl) {
	if (isCpl) {
		// 案件情報を取得する
		var cplMatterObj = new CplMatter('ja', systemMatterId);
		var flowInfo = cplMatterObj.getExecFlow().data;
		var nodeInfoList = flowInfo.nodes;
		var existenceFlg = false;
		// 案件情報に対象のノードがあるかチェックする
		for (var idx = 0; idx < nodeInfoList.length; idx++) {
			if (nodeInfoList[idx].nodeId == targetNodeId) {
				existenceFlg = true;
				break;
			}
		}
		if (!existenceFlg) {
			// 対象のノードが存在しない場合
			return null;
		}

		var codeUtil = new WorkflowCodeUtil();

		// ノード情報を取得する
		var cplMatterNodeObj = new CplMatterNode('ja',systemMatterId);
		var nodeListObj = cplMatterNodeObj.getProcessHistoryList(targetNodeId);
		if (nodeListObj.resultFlag && nodeListObj.data != null) {
			var nodeDataList = nodeListObj.data;
			if (nodeDataList.length > 0) {
				// 処理順に格納されているため、逆順で取得していく
				var firstIdx = nodeDataList.length - 1;
				for (var idx = firstIdx; idx >= 0; idx--) {
					if (nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('APPLY') ||
							nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('REAPPLY') ||
							nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('APPROVE')) {
						// 申請、再申請、承認の場合は実行ユーザの情報を返却
						return {user_cd : nodeDataList[idx].executeUserCode, user_name : nodeDataList[idx].executeUserName};
					}
				}
				
			}
		}
	} else {
		// 案件情報を取得する
		var actvMatterObj = new ActvMatter('ja', systemMatterId);
		var flowInfo = actvMatterObj.getExecFlow().data;
		var nodeInfoList = flowInfo.nodes;
		var existenceFlg = false;
		// 案件情報に対象のノードがあるかチェックする
		for (var idx = 0; idx < nodeInfoList.length; idx++) {
			if (nodeInfoList[idx].nodeId == targetNodeId) {
				existenceFlg = true;
				break;
			}
		}
		if (!existenceFlg) {
			// 対象のノードが存在しない場合
			return null;
		}

		// コードを取得するためのオブジェクト
		var codeUtil = new WorkflowCodeUtil();

		// ノード情報を取得する
		var actvMatterNodeObj = new ActvMatterNode('ja',systemMatterId);

		// ノードの処理対象者の情報を取得する
		var targetListObj = actvMatterNodeObj.getExecProcessTargetList(targetNodeId);
		if (targetListObj.resultFlag && targetListObj.data != null) {
			var targetList = targetListObj.data;
			if (targetList.length > 0) {
				if (targetList.length == 1) {
					if (targetList[0].processTargetClassifyName == 'ユーザ') {
						// 処理対象者がユーザであれば、この情報を返却
						return {user_cd : targetList[0].parameter, user_name : targetList[0].processTargetName};
					}
				}
			}
		}

		// ノードの履歴を取得する
		var nodeListObj = actvMatterNodeObj.getProcessHistoryList(targetNodeId);
		if (nodeListObj.resultFlag && nodeListObj.data != null) {
			var nodeDataList = nodeListObj.data;
			if (nodeDataList.length > 0) {
				// 処理順に格納されているため、逆順で取得していく
				var firstIdx = nodeDataList.length - 1;
				for (var idx = firstIdx; idx >= 0; idx--) {
					if (nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('APPLY') ||
							nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('REAPPLY') ||
							nodeDataList[idx].status == codeUtil.getEnumCodeTaskStatus('APPROVE')) {
						// 申請、再申請、承認の場合は実行ユーザの情報を返却
						return {user_cd : nodeDataList[idx].executeUserCode, user_name : nodeDataList[idx].executeUserName};
					}
				}
				
			}
		}
	}
	
	return null;
}

/**
 * リストのカラム一覧を取得します。
 * 
 * @param {string} 固定値マスタのコード
 * @returns JSON カラム一覧
 */
function getListShowColumnDefs(defCd) {

	var showColumnDefs = [];
	var showColumnDefMap = {};

	var sql = "";

	sql += "SELECT * FROM lo_m_koteichi WHERE cd_cls_id = ? AND sakujo_flg = '0' ORDER BY sort_no";

    // sql実行
    var db = new TenantDatabase();
    var columnsResult = db.select(sql, [DbParameter.string(defCd)], 0);    

	var showColumnList = [];

	for (var columnKey in columnsResult.data) {
    	var column = columnsResult.data[columnKey];
    	var columnName = column.cd_naiyo;
    	showColumnList.push(columnName);
	}

	showColumnDefMap = showColumnList;

	return ImJson.toJSONString(showColumnDefMap, false);
}

/**
 * 役割を取得する
 * @param routeId ノードID
 * @param nextRouteId 次ノードID
 * @param status ステータス
 * @param ticketId チケットID
 * @param userCd ユーザコード
 * @return 役割
 */
function getYakuwari(routeId, nextRouteId, status, ticketId, userCd) {
	Constant.load("lo/common_libs/lo_const");
	var routeObj = {};
	routeObj[Constant.LO_NODE_APPLY] = Constant.LO_NAME_NODE_APPLY;
	routeObj[Constant.LO_NODE_APPR_0] = Constant.LO_NAME_NODE_APPR_0;
	routeObj[Constant.LO_NODE_APPR_1] = "承認者1";
	routeObj[Constant.LO_NODE_APPR_2] = "承認者2";
	routeObj[Constant.LO_NODE_APPR_3] = "承認者3";
	routeObj[Constant.LO_NODE_APPR_4] = "承認者4";
	routeObj[Constant.LO_NODE_APPR_5] = "承認者5";
	routeObj[Constant.LO_NODE_APPR_LAST] = "最終確認者";
	routeObj[Constant.LO_NODE_KIAN] = Constant.LO_NAME_NODE_KIAN + "者";
	routeObj[Constant.LO_NODE_LAST_CONFIRM] = "最終確認者";
	
	routeObj[Constant.LO_NODE_SYS] = "システム担当者";
	routeObj[Constant.LO_NODE_KEIYAKU] = "契約担当者";

	if (routeObj[routeId]) {
		if (status == Constant.LO_WF_STATUS_SENDBACK_TO_PULLBACK || status == Constant.LO_WF_STATUS_PULLBACK) {
			// 取戻の場合は次のルートが操作した担当者となる
			if (nextRouteId && routeObj[nextRouteId]) {
				if (nextRouteId == Constant.LO_NODE_APPLY) {
					if (isKawariWf(ticketId)) {
						if (isKawariInputGroup(userCd)) {
							return "入力者";
						} else {
							return "入力・起案";
						}
					}
				}
				return routeObj[nextRouteId];
			}
			return "";
		}
		
		if (routeId == Constant.LO_NODE_APPLY) {
			if (isKawariWf(ticketId)) {
				if (isKawariInputGroup(userCd)) {
					return "入力者";
				} else {
					return "入力・起案";
				}
			}
		}
		return routeObj[routeId];
	}
	return "";
}

/**
 * 通常の企画、許諾、契約か判定する
 * @param ticketId チケットID
 * @return 判定結果
 */
function isNormalWf(ticketId) {
	Constant.load("lo/common_libs/lo_const");
	var regText = Constant.LO_TICKET_ID_HEAD_KIKAKU + "[0-9]{8}";
	var reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	regText = Constant.LO_TICKET_ID_HEAD_KYODAKU + "[0-9]{8}";
	reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	regText = Constant.LO_TICKET_ID_HEAD_KEIYAKU + "[0-9]{8}";
	reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	return false;
}

/**
 * 代わり承認の企画、許諾、LPか判定する
 * @param ticketId チケットID
 * @return 判定結果
 */
function isKawariWf(ticketId) {
	Constant.load("lo/common_libs/lo_const");
	var regText = Constant.LO_TICKET_ID_HEAD_KAWARI_KIKAKU + "[0-9]{8}";
	var reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	regText = Constant.LO_TICKET_ID_HEAD_KAWARI_KYODAKU + "[0-9]{8}";
	reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	regText = Constant.LO_TICKET_ID_HEAD_KAWARI_LICENSE_PROPOSAL + "[0-9]{8}";
	reg = new RegExp(regText);
	if (reg.test(ticketId)) {
		return true;
	}
	return false;
}

/**
 * 代わり承認WFの入力グループが判定する
 * @param user_cd ユーザコード
 * @return 判定結果
 */
function isKawariInputGroup(user_cd) {
	Constant.load("lo/common_libs/lo_const");
	return Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpShozoku", Constant.LO_GROUP_SET_CD, Constant.LO_GROUP_CD_KAWARI_INPUT, user_cd);
}

/**
 * 案件情報の設定
 * @param {String} 文書id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(kawariData,userInfo) {
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(kawariData.bunsho_id));
    strParam.push(DbParameter.string(kawariData.bunsho_id));
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam,0);
    
    var wfResult = {};
    
    //Logger.getLogger().info(' [setMatterInfo]　'+ sql + ImJson.toJSONString(strParam, true) + ImJson.toJSONString(result, true));
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	//Logger.getLogger().info(' [setMatterInfo]　return false ');
    	return false;
    }  
    
    
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;
    
    wfResult.systemMatterId = systemMatterId;
    wfResult.type = type;
    
    //ノード情報取得
    var nodeArray = {
    		"apply":Constant.LO_NODE_APPLY,
		    "kian":Constant.LO_NODE_KIAN,
		    "appr_1":Constant.LO_NODE_APPR_1,
		    "appr_2":Constant.LO_NODE_APPR_2,
		    "appr_3":Constant.LO_NODE_APPR_3,
		    "appr_4":Constant.LO_NODE_APPR_4,
		    "appr_5":Constant.LO_NODE_APPR_5,
		    "last_confirm":Constant.LO_NODE_LAST_CONFIRM
    };
    
    if (type =='cpl'){
    	// 未完了案件情報取得
		var cplMatter = new CplMatter(systemMatterId);
	    var matter = cplMatter.getMatter();
	    
	    // ワークフローに関するパラメータを保持します
	    wfResult.wf_data = {
	        imwGroupId              : '',           //グループ ID 
	        imwUserCode             : '',          //処理者CD
	        imwPageType             : '',          //画面種別
	        imwUserDataId           : matter.data.userDataId,        //ユーザデータ ID
	        imwSystemMatterId       : matter.data.systemMatterId,    //システム案件ID
	        imwNodeId               : ''            //ノード ID       
	    };
	    
	    var cplMatterObj = new CplMatter('ja', systemMatterId);
        var flowInfo = cplMatterObj.getExecFlow().data;
        var nodeInfoList = flowInfo.nodes;

        var nodeList = [];
        //配列つめかえ
        for (var idx = 0; idx < nodeInfoList.length; idx++) {
            nodeList.push(nodeInfoList[idx].nodeId);
        }    
        
        // ノード情報取得
        var cplMatter = new CplMatterNode('ja', systemMatterId);
        
        wfResult.nodeUserslist = {};
        for (var idx in nodeArray) {
            if (nodeList.indexOf(nodeArray[idx]) > -1) {
                var result = cplMatter.getProcessHistoryList(nodeArray[idx]);
                
                for(var i in result.data){
	                if(result.data[i].executeUserCode == userInfo.userCd){
	                	wfResult.route_user_flg = true;
	                	break;
	                }
                }
                

                wfResult.nodeUserslist[idx] = getProcessLatestUser(result);               
                
                
            }else{
            	wfResult.nodeUserslist[idx] =  {"userName":"---","userCd":"---","execFlg":false};
            }            
        }
	    
    	return wfResult;
    }else{    
	    // 未完了案件情報取得
		var actvMatter = new ActvMatter(systemMatterId);
	    var matter = actvMatter.getMatter();
	    
    	var orgParams = {"bunsho_id":kawariData.bunsho_id,	                 
                 "kawari_status":kawariData.kawari_status
                 };
		
	    // ワークフローに関するパラメータを保持します
	    wfResult.wf_data = {
	        imwGroupId              : '',           //グループ ID 
	        imwUserCode             : '',          //処理者CD
	        imwPageType             : '',          //画面種別
	        imwUserDataId           : matter.data.userDataId,        //ユーザデータ ID
	        imwSystemMatterId       : matter.data.systemMatterId,    //システム案件ID
	        imwNodeId               : '',            //ノード ID 
	        imwArriveType           : '',        //到達種別
	        imwAuthUserCode         : matter.data.applyAuthUserCode,                           //権限者CD 
	        imwApplyBaseDate        : matter.data.applyBaseDate,     //申請基準日
	        imwContentsId           : '',        //コンテンツ ID
	        imwContentsVersionId    : '', //コンテンツバージョン ID 
	        imwRouteId              : '',           //ルート ID
	        imwRouteVersionId       : '',    //ルートバージョン ID
	        imwFlowId               : matter.data.flowId,            //フローID 
	        imwFlowVersionId        : matter.data.flowVersionId,     //フローバージョンID
	        imwCallOriginalPagePath : 'lo/contents/screen/kyodaku/permission_list', //呼出元ページパス
	        imwCallOriginalParams   : ImJson.toJSONString(orgParams),    //呼出元パラメータ
	        imwAuthUserCodeList     : '',
	        imwNodeSetting			: ''	
	    };

	    //現在のノードid取得    todo 分岐ルートの場合一覧からノードIDを渡す必要があるのでは？
	    var actvNodeList = actvMatter.getActvNodeList();
	    var nodeId = actvNodeList.data[0].nodeId;	    
	
	    wfResult.wf_data.imwNodeId = nodeId;
	    
	    // 戻し先ノードの設定
	    wfResult.wf_data.imwBackNodeSetting = backNodeSetteing(nodeId);
	}
    
    // ノード処理対象者か判定
  	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定

  	var actvMatterNode = new ActvMatterNode('ja',systemMatterId);
    var cond = new ListSearchConditionNoMatterProperty();
    var userlist = actvMatterNode.getExecutableUserList(cond); //ノードの対象者を取得
    
    // 対象者に含まれていればok
    var authUserList = [];
    wfResult.proc_user_flg = false;
    for(var i = 0; i < userlist.data.length; i++) {
	   if (user_cd == userlist.data[i].authUserCode ){
		   wfResult.proc_user_flg = true;
		   break;
	   }
    	authUserList.push(userlist.data[i].authUserCode);
    } 
    
    
    if (nodeId != ''){	    	
		var actvMatterObj = new ActvMatter('ja', systemMatterId);
		var flowInfo = actvMatterObj.getExecFlow().data;
		var nodeInfoList = flowInfo.nodes;
		
		var nodeList = [];
		//配列つめかえ
		for (var idx = 0; idx < nodeInfoList.length; idx++) {
			nodeList.push(nodeInfoList[idx].nodeId);
		}			

		// ノード情報取得
	    var actvMatter = new ActvMatterNode('ja', systemMatterId);
	    wfResult.nodeUserslist = {};
		for (var idx in nodeArray) {
			//Logger.getLogger().info("nodeUserslist:" + idx);
			if (nodeList.indexOf(nodeArray[idx]) > -1) {
				wfResult.nodeUserslist[idx] ={};
				
				//フローの履歴情報を取得
				var result = actvMatter.getProcessHistoryList(nodeArray[idx]);					
				
				if(result.data.length > 0){
					//最後に実行した処理者を取得
					var userObj = getProcessLatestUser(result);
					
					//ログインユーザが処理済みユーザの一覧に存在する場合は、フラグをtrueにする
					if(userObj.userCd == userInfo.userCd){
						wfResult.route_user_flg = true;
					}				
										
					if(userObj.userCd !=undefined){
						wfResult.nodeUserslist[idx] = userObj;
					}
				}
				
				if(wfResult.nodeUserslist[idx].userCd == undefined){
					//処理対象者一覧を取得
					var cond = new ListSearchConditionNoMatterProperty();
					result = actvMatter.getExecutableUserList(cond);
					
					if(result.data[0].nodeId == nodeArray[idx]){					
						wfResult.nodeUserslist[idx] = {"userCd":result.data[0].authUserCode,
												"userName":result.data[0].authUserName,
												"execFlg":false
												};
					}
				}
				
				if(wfResult.nodeUserslist[idx].userCd == undefined){
					//処理対象者一覧を取得					
					result = actvMatter.getExecProcessTargetList(nodeArray[idx]);						
					wfResult.nodeUserslist[idx] = getProcessLatestUser(result);						
				}							
									
	    
			}else{
				wfResult.nodeUserslist[idx] =  {"userName":"---","userCd":"---","execFlg":false};
			}
			
		}		
		// 通知設定取得
		//getSettingMailUsers($oUserParams);
	}
	
	for(var i in wfResult.nodeUserslist){
		if (!wfResult.nodeUserslist[i] || wfResult.nodeUserslist[i].userCd== '') {
			wfResult.nodeUserslist[i] = {"userName":"---","userCd":"---","execFlg":false};
		}
	
	}
	
	if(nodeId == Constant.LO_NODE_APPLY && wfResult.proc_user_flg){
    	//入力ノードかつ、実行者がログインしている場合は、入力者にログイン者の情報を表示する
    	//wfResult.nodeUserslist.apply = {"userName":userInfo.userName,"userCd":userInfo.userCd,"execFlg":false};
	}

    //起案ノードがない場合は、申請者が起案可能なケースなので、入力ノードの情報をコピーする	
	//if (!wfResult.nodeUserslist.kian || wfResult.nodeUserslist.kian.userCd == '') {
		//wfResult.nodeUserslist.kian = wfResult.nodeUserslist.apply;
	//}
	
    // 代理設定の確認
    if (!wfResult.proc_user_flg){
    	// 代理設定を取得
        var oriAct = new OriginalActList(user_cd);
        var systemDatetime = Procedure.imw_datetime_utils.getSystemDateTime();
        var cond = new ListSearchConditionNoMatterProperty();
        cond.addCondition(OriginalActList.START_DATE, systemDatetime, ListSearchCondition.OP_LE);
        cond.addCondition(OriginalActList.LIMIT_DATE, systemDatetime, ListSearchCondition.OP_GE);
        var oriUserlist = oriAct.getPersList (cond);
        
        // 処理対象者が代理元と一致すればok
        for(var i = 0; i < oriUserlist.data.length; i++) {
            if (authUserList.indexOf(oriUserlist.data[i].originalActUserCode) > -1){
            	wfResult.proc_user_flg = true;
            	break;
            }
        }
    }

    return wfResult;
}


// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessLatestUser(result) {
	// ワークフローコードUtil
    var codeUtil = new WorkflowCodeUtil();
	var names={};
	
	if (result.data){
    	for (var i=result.data.length-1;0 <= i;i--){    		
    		//処理済み、かつ、処理タイプ申請or承認(=差し戻しや引き戻しは除く）
    		if (result.data[i].authUserName
    				&& (result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apy") //申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_rapy") //再申請
    					|| result.data[i].processType == codeUtil.getEnumCodeProcessType("procTyp_apr") //承認
    						)
    					) {
          		 names = {"userName":result.data[i].authUserName,"userCd":result.data[i].executeUserCode,"execFlg":true};
          		 //Logger.getLogger().info('対象者：authUserName' + ImJson.toJSONString(names,true));
          		return names;
    		} else if(result.data[i].processTargetName) {
       		 	names = {"userName":result.data[i].processTargetName,"userCd":result.data[i].parameter,"execFlg":false};
       		 	//Logger.getLogger().info('対象者：processTargetName' + ImJson.toJSONString(names,true));
       		 	return names;
    		}else{    			
    			//空のオブジェクトを返す
    			return names;
    		}    		
    	}    	
    }else{
    	return '';
    }
}
	
/**
 * 承認ノードの差戻先を固定
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function backNodeSetteing(nodeid){
	// 現在のノードIDから戻し先を判断
	var node = {};
	node[Constant.LO_NODE_KIAN] = Constant.LO_NODE_APPLY;	// BNE担当→申請
	node[Constant.LO_NODE_APPR_1] = Constant.LO_NODE_KIAN;	// 承認1→BNE担当
	node[Constant.LO_NODE_APPR_2] = Constant.LO_NODE_KIAN;	// 承認2→BNE担当
	node[Constant.LO_NODE_APPR_3] = Constant.LO_NODE_KIAN;	// 承認3→BNE担当
	node[Constant.LO_NODE_APPR_4] = Constant.LO_NODE_KIAN;	// 承認3→BNE担当
	node[Constant.LO_NODE_APPR_5] = Constant.LO_NODE_KIAN;	// 承認3→BNE担当
	node[Constant.LO_NODE_KEIYAKU] = Constant.LO_NODE_KIAN;	// 契約担当→BNE担当
	node[Constant.LO_NODE_KEIJOU] = Constant.LO_NODE_KIAN;	// 計上担当→BNE担当
	//node[Constant.LO_NODE_LAST_CONFIRM] = Constant.LO_NODE_KIAN;	// 最終承認→申請
	
	var backnode =node[nodeid];

	return backnode;
}

/**
 * IP担当グループ一覧を取得
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function getUserIpGroupList(userCd){
	// 現在のノードIDから戻し先を判断
	var searchStr = 'lo_approva_group_0_';
	
	var db = new TenantDatabase();
	var sql = " SELECT * ";
	sql += " FROM imm_public_grp_ath ath  ";
	sql += " inner join imm_public_grp grp";
	sql += " ON ath.public_group_cd = grp.public_group_cd ";
	sql += " WHERE ath.delete_flag = '0' ";
	sql += "   AND ath.start_date <= CURRENT_DATE ";
	sql += "   AND ath.end_date > CURRENT_DATE ";
	sql += "   AND ath.public_group_cd like ? ";
	sql += "   AND ath.user_cd like ? ";

	var param = [];
	
	param.push(DbParameter.string(searchStr+'%'));
	param.push(DbParameter.string(userCd));
	
	var result = db.select(sql,param);
	var list = result.data;
	
	Logger.getLogger().info('list' + ImJson.toJSONString(list,true));

	return list;
}

/**
 * ファイルダウンロード用のリンクを作成する
 * @param {String} file_id
 * @returns {String} link
 */
function getDownloadFileInfo(fileId){
	var db = new TenantDatabase();
	var result;
	var sql = "select * from lo_m_file where file_id = ? and sakujo_flg='0' order by sort_no";
	var result = db.select(sql, [ DbParameter.string(fileId) ]);
	
	if(result.countRow === 0){
		return {};
	}
	
	return result.data[0];
}

/**
 * ファイルダウンロード用のリンクを作成する
 * @param {String} file_id
 * @returns {String} link
 */
function getDownloadLink(fileName,filePath){
	var url = 'lo/contents/screen/tmp_file_dl?';		
	
	url+= 'fileName='+fileName+'&filePath='+filePath;
	
	return url;
}

/**
 * ファイルダウンロード用のリンクを作成する
 * @param {String} file_id
 * @returns {String} link
 */
function makeLinkTag(url,label){
	var link = '<a href="'+url+'">'+label+'</a>';
	return link;
}

/**
 * コメントテンプレート一覧取得
 * 
 * @returns {DatabaseResult} 検索結果
 */
function retrieveCommentTemplateList() {
	Logger.getLogger().info('[retrieveCommentTemplateList]　コメントテンプレート一覧検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ct.comment_template_id ";
	sql += "  , ct.comment_template_nm ";
	sql += "FROM ";
	sql += "  lo_m_flow_comment_template AS ct ";
	sql += "WHERE ";
	sql += "  ct.sakujo_flg = '0' ";
	sql += "ORDER BY ";
	sql += "  ct.sort_no ";

    var params = [];

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveCommentTemplateList]　コメントテンプレート一覧検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}

/**
 * コメントテンプレートコンテンツ取得
 * 
 * @param {number} commentTemplateId コメントテンプレートID
 * @returns {DatabaseResult} 検索結果
 */
function retrieveCommentTemplateContent(commentTemplateId) {
	Logger.getLogger().info('[retrieveCommentTemplateContent]　コメントテンプレートコンテンツ検索');

    var sql = ""; 
	sql += "SELECT ";
	sql += "  ct.comment_template_content ";
	sql += "FROM ";
	sql += "  lo_m_flow_comment_template AS ct ";
	sql += "WHERE ";
	sql += "  ct.sakujo_flg = '0' ";
	sql += "  AND ct.comment_template_id = ? ";
	sql += "ORDER BY ";
	sql += "  ct.sort_no ";

    var params = [];
    params.push(DbParameter.number(commentTemplateId));

    // sql実行
    var db = new TenantDatabase();
	Logger.getLogger().info('[retrieveCommentTemplateContent]　コメントテンプレートコンテンツ検索 SQL ' + sql + " params " + ImJson.toJSONString(params, true));
    var result = db.select(sql, params, 0);
    return result;
}



