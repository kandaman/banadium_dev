Constant.load("lo/common_libs/lo_const");
var $oUserParams={};
var $label_comment = ""; //コメント欄文言

var $nodeUserslist ={};
var $proFlg = false; //ライセンスプロダクションflg
var $approveMode = false;
var $showFlg = true; //経路表示
var $routeFlg = false; //経路設定ノード
var $annotation_comment = "";	// コメント注釈
var $approveSettingFlg = false;
var $kianSettingFlg = false;
var $sameInputPersonFlg = false;
var $kianKengenFlg = false;

// デフォルトユーザ
var $nodeDefUsers ={
kian:[],
appr_1:[],
appr_2:[],
appr_3:[],
appr_4:[],
appr_5:[],
last_confirm:[]
};
// デフォルトメールユーザ
var $mailDefUsers ={};

var $comment_template_list = [];

function init(request) {
	//Logger.getLogger().info('[init] request　' + ImJson.toJSONString(request, true));
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// 代わり承認WF入力グループに所属しているか確認する
	var kawariInputGroupFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_KAWARI_INPUT);
	
	if (!kawariInputGroupFlg) {
		// ライセンスプロダクションか判断
		$proFlg = Content.executeFunction(
			"lo/common_libs/lo_common_fnction", "chkUsergroup",
			Constant.LO_GROUP_CD_PRODUCTION);
		if ($proFlg) {
			$kianKengenFlg = true;
		}
		
	}

	// 画面からの値を取得
	$oUserParams = request.oUserParams;

	var sairiyoFlg = false;
	if ($oUserParams.sairiyoFlg.match(/true/i)) {
		sairiyoFlg = true;
	}

	// 処理名がなけばデフォルト名を設定
	if ($oUserParams.item_proc_name == "" || typeof $oUserParams.item_proc_name === 'undefined'){
		$oUserParams.item_proc_name = "登録";
	}
	
	// コメント入力欄の文言
	$label_comment = MessageManager.getMessage('IN01I006');
	
	var templateResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "retrieveCommentTemplateList");
	$comment_template_list = [{}].concat(templateResult.data);
    Content.executeFunction("lo/common_libs/lo_common_fnction", "toSelectList", $comment_template_list, "comment_template_nm", "comment_template_id");
    

	// セッション情報
	var sessionInfo = Contexts.getAccountContext();
	var localeId = sessionInfo.locale;
	// システムマターid、ノードid
	var imwSystemMatterId= $oUserParams.imwSystemMatterId;
	var imwNodeId = $oUserParams.imwNodeId;

	// 起案者ノードか
	if ($oUserParams.imwNodeId == Constant.LO_NODE_KIAN){
		Logger.getLogger().info('[init] 起案');
		// 起案時に承認者の設定を可能にする
		$approveSettingFlg = true;
		$approveMode = true;
		//承認でなけれ経路非表示 
		if($oUserParams.item_proc_status != Constant.LO_WF_STATUS_SHONIN){
			$showFlg = false;
			return;
		}

		// 経路設定表示
		$routeFlg = true; 

		// ノード情報に既にユーザが設定されていれば取得
		var oProcParams = request.oProcParams;
		
		if (typeof oProcParams !== "undefined"){
			var dcNode = oProcParams.DCNodeConfigModels;
			for (var i = 0; i < dcNode.length; i++) {
				var nodeid = dcNode[i].nodeId;
				var target = dcNode[i].processTargetConfigs;
				if(target.length > 0){
					var users = [];
					for (var n = 0; n < target.length; n++) {
						users.push(target[n].parameter);
					}
					// 以前に設定したユーザをセット
					setProcessTargetUsers(nodeid,users);
				}
			}
		}

		if (sairiyoFlg) {
			chkNodeUsers();
		}

		// 申請者(名称のみ)
		var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
		var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);
		$nodeUserslist.apply = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHINSEI);

		var userContext = Contexts.getUserContext();
		var userCd = userContext.userProfile.userCd;
		var userName = userContext.userProfile.userName;

		// 起案者は、氏名のみ反映
		$nodeDefUsers.kian.push({user_cd : userCd,user_name : userName});
		// 完了確認者は、氏名とコードが申請者と同じ
		//$nodeDefUsers.last_confirm.push({user_cd : userCd,user_name : userName});
		//pushだと差し戻し時に重複するので、洗い替え
		$nodeDefUsers.last_confirm = [{user_cd : userCd,user_name : userName}];

		getTsuchisaki($oUserParams.item_matterName);

		// 商標zacro連携にデフォルトセット
		$mailDefUsers["mail_2"] = [];
		
	// 申請ノードか
	}else if ($oUserParams.item_proc_name == "起案" || $oUserParams.item_proc_name == "送付"){
		//Logger.getLogger().info('[init] 申請');
		
		if($proFlg) {
			$approveSettingFlg = true;
			$approveMode = true;
			$sameInputPersonFlg = true;
		}
		
		// 経路設定表示
		$routeFlg = true; 

		// ノード情報に既にユーザが設定されていれば取得
		var oUserParams = request.oUserParams;
		if (typeof oUserParams !== "undefined" ){
			getDefaultExecUsers(oUserParams);
		}

		if (sairiyoFlg) {
			chkNodeUsers();
		}

		if (kawariInputGroupFlg) {
			$kianSettingFlg = true;
		} else {
			// プロダクショングループに所属している場合
			var userContext = Contexts.getUserContext();
			var userCd = userContext.userProfile.userCd;
			var userName = userContext.userProfile.userName;

			// 起案者は、氏名のみ反映
			$nodeDefUsers.kian.push({user_cd : '',user_name : userName});
			// 完了確認者は、氏名とコードが申請者と同じ
			//$nodeDefUsers.last_confirm.push({user_cd : userCd,user_name : userName});
			$nodeDefUsers.last_confirm = [{user_cd : userCd,user_name : userName}];
		}
		getTsuchisaki($oUserParams.item_matterName);
		
		// 商標zacro連携にデフォルトセット
		$mailDefUsers["mail_2"] = [];

		var userContext = Contexts.getUserContext();
		$nodeUserslist.apply = userContext.userProfile.userName;

	}else {
		//Logger.getLogger().info('[init] 承認');
		$routeFlg = false;
		
		if ($oUserParams.imwNodeId != '' && $oUserParams.imwNodeId != Constant.LO_NODE_APPLY){
			var actvMatterObj = new ActvMatter('ja', $oUserParams.imwSystemMatterId);
			var flowInfo = actvMatterObj.getExecFlow().data;
			var nodeInfoList = flowInfo.nodes;

			// ノード情報取得
			var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
			for (var idx = 0; idx < nodeInfoList.length; idx++) {
				if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPLY) {
					// 申請ノードの最後の処理者を取得
					var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);
					$nodeUserslist.apply = getProcessLatestUser(result, Constant.LO_WF_STATUS_SHINSEI);
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_KIAN) {
					// 起案ノードの最後の処理者を取得
					var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_KIAN);
					$nodeUserslist.kian = getProcessLatestUser(result, Constant.LO_WF_STATUS_SHONIN);
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_1) {
					// 承認１ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_1);
					$nodeUserslist.appr_1 = getProcessTargetName(result );
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_2) {
					// 承認2ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_2);
					$nodeUserslist.appr_2 = getProcessTargetName(result );
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_3) {
					// 承認3ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_3);
					$nodeUserslist.appr_3 = getProcessTargetName(result );
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_4) {
					// 承認4ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_4);
					$nodeUserslist.appr_4 = getProcessTargetName(result );
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_APPR_5) {
					// 承認5ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_5);
					$nodeUserslist.appr_5 = getProcessTargetName(result );
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_LAST_CONFIRM) {
					// 完了確認ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_LAST_CONFIRM);
					$nodeUserslist.last_confirm = getProcessTargetName(result );
				}
			}
			
			// 通知設定取得
			getSettingMailUsers($oUserParams);
		}
		if (!$nodeUserslist.kian || $nodeUserslist.kian == '') {
			$nodeUserslist.kian = $nodeUserslist.apply;
		}
		if (!$nodeUserslist.appr_1 || $nodeUserslist.appr_1 == '') {
			$nodeUserslist.appr_1 = '---';
		}
		if (!$nodeUserslist.appr_2 || $nodeUserslist.appr_2 == '') {
			$nodeUserslist.appr_2 = '---';
		}
		if (!$nodeUserslist.appr_3 || $nodeUserslist.appr_3 == '') {
			$nodeUserslist.appr_3 = '---';
		}
		if (!$nodeUserslist.appr_4 || $nodeUserslist.appr_4 == '') {
			$nodeUserslist.appr_4 = '---';
		}
		if (!$nodeUserslist.appr_5 || $nodeUserslist.appr_5 == '') {
			$nodeUserslist.appr_5 = '---';
		}
		
	}
}

// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessTargetName(result) {
	var names=[];
	if (result.data){
		for (var i=0;i < result.data.length;i++){
			if (result.data[i].authUserName) {
				names.push(result.data[i].authUserName);
			} else {
				names.push(result.data[i].processTargetName);
			}
		}
		return names.join('、');
	}else{
		return '';
	}
}

// actvMatter.getProcessHistoryListから最後の処理ユーザ取り出し
function getProcessLatestUser(result,status) {
	if (result.data){
		var len =result.data.length;
		for (var i=len-1; 0 <= i;i--){ //処理の逆順に取得()
			if(result.data[i].status == status){ //特定処理を対象
				return result.data[i].executeUserName;
			}
		}
	}
	return '';
}

/**
 * 画面側の処理から受け渡されたノード設定取得
 * 
 * @param {object} oUserParams
 */
function getDefaultExecUsers(oUserParams) {
	var nodeUserObj = {};
	var searchUserList = [];
	var targetIdList = [];
	targetIdList.push("lo_node_kian");
	targetIdList.push("lo_node_appr_1");
	targetIdList.push("lo_node_appr_2");
	targetIdList.push("lo_node_appr_3");
	targetIdList.push("lo_node_appr_4");
	targetIdList.push("lo_node_appr_5");
	targetIdList.push("lo_node_last_confirm");
	
	var nodeSetting = oUserParams.imwNodeSetting;
	if (!nodeSetting) {
		return;
	}
	var nodeSettingObj = ImJson.parseJSON(nodeSetting);
	var dcNodeSetting = nodeSettingObj.DCNodeSetting;
	for (var idx = 0; idx < targetIdList.length; idx++) {
		if(dcNodeSetting[targetIdList[idx]] && dcNodeSetting[targetIdList[idx]].processTargetConfigs) {
			var targetConfigList = dcNodeSetting[targetIdList[idx]].processTargetConfigs;
			var userList = [];
			for (var confIdx = 0; confIdx < targetConfigList.length; confIdx++) {
				if (userList.indexOf(targetConfigList[confIdx].parameter) < 0) {
					// ノードごとに取得する(重複は除く)
					userList.push(targetConfigList[confIdx].parameter);
				}
				
				if (searchUserList.indexOf(targetConfigList[confIdx].parameter) < 0) {
					// IMMユーザマスタ検索用に取得する(重複は除く)
					searchUserList.push(targetConfigList[confIdx].parameter);
				}
			}
			nodeUserObj[targetIdList[idx]] = userList;
		}
	}
	
	var db = new TenantDatabase();
	var sql ="";
	var strParam = [];

	// ユーザ名取得
	sql ="";
	sql+=" SELECT DISTINCT ";
	sql+="     user_cd ";
	sql+="    ,user_name ";
	sql+=" FROM imm_user ";
	sql+="   WHERE locale_id = 'ja' "; 
	sql+="    AND delete_flag = '0' ";
	sql+="    AND start_date <= CURRENT_DATE ";
	sql+="    AND end_date > CURRENT_DATE ";
	sql+=" ";
	// in句を作成
	sql+= " AND user_cd IN (";
	
	var strParam = [];
	searchUserList.forEach(function(v, i) {
		if (v === null || v === ""){
			return;
		}
		if (strParam.length > 0) {
			sql+= ", ";
		}
		sql+= "?";
		strParam.push(DbParameter.string(v));
	});
	sql+= ") ";

	// ユーザ名取得
	var result = db.select(sql,strParam);
	if (result.countRow > 0){
		// ノードの種類分繰り返す
		for (var idx = 0; idx < targetIdList.length; idx++) {
			// ノードにユーザが設定されていたか確認する
			if (nodeUserObj[targetIdList[idx]]) {
				var nodeUserList = nodeUserObj[targetIdList[idx]];
				var settingUserList = [];
				// ノードに設定されていたユーザ分繰り返す
				for (var uIdx = 0; uIdx < nodeUserList.length; uIdx++) {
					// レコードからユーザコードとユーザ名を取得する
					for (var i = 0; i < result.data.length; i++) {
						if (result.data[i].user_cd == nodeUserList[uIdx]) {
							settingUserList.push({user_cd : result.data[i].user_cd, user_name : result.data[i].user_name});
						}
					}
				}
				// 各ノードごとに設定
				if ("lo_node_kian" == targetIdList[idx]) {
					$nodeDefUsers.kian = settingUserList;
				} else if ("lo_node_appr_1" == targetIdList[idx]) {
					$nodeDefUsers.appr_1 = settingUserList;
				} else if ("lo_node_appr_2" == targetIdList[idx]) {
					$nodeDefUsers.appr_2 = settingUserList;
				} else if ("lo_node_appr_3" == targetIdList[idx]) {
					$nodeDefUsers.appr_3 = settingUserList;
				} else if ("lo_node_appr_4" == targetIdList[idx]) {
					$nodeDefUsers.appr_4 = settingUserList;
				} else if ("lo_node_appr_5" == targetIdList[idx]) {
					$nodeDefUsers.appr_5 = settingUserList;
				} else if ("lo_node_last_confirm" == targetIdList[idx]) {
					$nodeDefUsers.last_confirm = settingUserList;
				}
			}
			
		}
	}

}


/**
 * デフォルトの通知先ユーザを設定
 * 
 * @param {strign} ログインユーザコード
 * @param {object} 画面情報
 */
function getDefaultMailUsers(userCode,oUserParams) {

	//　元パラメータ取得
	var imwOrgParam = {};
	if ('imwCallOriginalParams' in oUserParams){
		imwOrgParam = ImJson.parseJSON(oUserParams.imwCallOriginalParams);
	}
	
	// 完了通知----------------
	// BNE担当ノードの対象者を取得し完了通知に設定する
	var actvMatterNode = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
	var cond = new ListSearchConditionNoMatterProperty();
	var userlist = actvMatterNode.getExecutableUserList(cond);
	var enduserlist = [];
	for(var i = 0; i < userlist.data.length; i++) {
		// 自分自身は含まない
		if(userlist.data[i].authUserCode != userCode){
			enduserlist.push({user_cd:userlist.data[i].authUserCode,user_name:userlist.data[i].authUserName});
		}
	}
	
//	// 承認3ユーザを取得して設定
//	var list_3 = getGroupUsers(Constant.LO_GROUP_APPR_3);
	
	// タイトルに紐づく担当係コードを取得
	var kakariCd =[];
	if ('kikaku_id' in imwOrgParam) {
		// 企画の場合
		kakariCd = getTantouKakariCd(imwOrgParam.kikaku_id,'KY');
	}else if('kyodaku_id' in imwOrgParam){
		// 許諾の場合
		kakariCd = getTantouKakariCd(imwOrgParam.kyodaku_id,'KD');
	}
	// 担当係コードによって特定グループのユーザをセット
	/*if (kakariCd.indexOf('1') != -1){
		var specific_list_1 = getGroupUsers(Constant.LO_GROUP_CD_SPECIFIC_1);
		list_3 = list_3.concat(specific_list_1);
	}
	if (kakariCd.indexOf('2') != -1){
		var specific_list_2 = getGroupUsers(Constant.LO_GROUP_CD_SPECIFIC_2);
		list_3 = list_3.concat(specific_list_2);
	}
	if (kakariCd.indexOf('3') != -1){
		var specific_list_3 = getGroupUsers(Constant.LO_GROUP_CD_SPECIFIC_3);
		list_3 = list_3.concat(specific_list_3);
	}
	*/
//	for(var i = 0; i < kakariCd.length; i++) {
//		// 担当係コードを末尾に付けた特定グループを取得
//		var group_cd= Constant.LO_GROUP_CD_SPECIFIC + '_' + kakariCd[0];
//		var specific_list = getGroupUsers(group_cd);
//		list_3 = list_3.concat(specific_list);
//	}
//	
//	var list = enduserlist.concat(list_3);
//
//	// 重複を削除
//	var groupList = list.filter(function (x, i, self) {
//		if (self.indexOf(x.user_cd) === -1){
//			self.push(x.user_cd);
//			return x;
//		}
//	});
//	
//	//結合してセット
//	$mailDefUsers["mail_3"] = groupList;

	
	// 契約通知------------
	// 企画種別:楽曲orイベント 又は許諾種別:新規の場合契約担当通知先グループ設定
	var flg = false;
	// 企画の場合
	if ('kikaku_id' in imwOrgParam) {
		// 契約種別:楽曲orイベント
		if (imwOrgParam.kikaku_shubetsu_cd == 2 || imwOrgParam.kikaku_shubetsu_cd == 3){
			flg = true;
		}
	// 許諾の場合
	}else if('kyodaku_id' in imwOrgParam){
		 //	許諾種別:新規
		if (imwOrgParam.kyodaku_cls == '1'){
			flg = true;
		}
	}
//	if (flg){
//		// 契約通知先グループ設定
//		var list = getGroupUsers(Constant.LO_GROUP_CD_CONTRACT_NOTICE);
//		$mailDefUsers["mail_4"] = list;
//	}
	
	// 計上担当通知---------
	// 許諾の場合は計上担当取得
//	if('kyodaku_id' in imwOrgParam){
//		var account_list = getGroupUsers(Constant.LO_GROUP_CD_ACCOUNT);
//		$mailDefUsers["mail_5"] = account_list;
//	}
	
	
}

/**
 * グループコードから所属のユーザ情報を取得
 * 
 * @param {strign} グループコード
 */
function getGroupUsers(group_cd) {

	var locale_id = 'ja';
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	 ,u.user_name ";
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
	sql+="   AND g.public_group_cd = ? ";
	
	var db = new TenantDatabase();
	var strParam = [];
	strParam.push(DbParameter.string(group_cd));
	var result = db.select(sql,strParam);
	
	var list = [];
	for (var i=0;i < result.countRow;i++){
		list.push({user_cd : result.data[i].user_cd ,user_name : result.data[i].user_name});
	}
	return list;
}


/**
 * テーブルから設定済みのメールユーザ取得
 * 
 * @param {object} 申請情報
 */
function getSettingMailUsers(oUserParams) {
	
	//　チケットid取得
	var ticket_id = "";
	if ('imwCallOriginalParams' in oUserParams){
		var imwOrgParam = ImJson.parseJSON(oUserParams.imwCallOriginalParams);
		// 企画の場合
		if ('bunsho_id' in imwOrgParam) {
			ticket_id = imwOrgParam.bunsho_id;
		// 許諾の場合
		}
	}
	if (ticket_id==""){
		return;
	}
	
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';
	mail_group_list[Constant.LO_MAIL_GROUP_SHOHYO]='mail_2';
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIYAKU]='mail_4';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIJOU]='mail_5';
	
	// todo 多言語対応
	var locale_id = 'ja';

	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+="    m.mail_group ";
	sql+="   ,u.user_cd ";
	sql+="   ,u.user_name ";
	sql+=" FROM lo_t_sendmail m ";
	sql+=" INNER JOIN imm_user u ";
	sql+="    ON m.user_cd = u.user_cd ";
	sql+="   AND u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+=" WHERE m.sakujo_flg = '0' ";
	sql+="   AND m.ticket_id = ? ";
	
	var strParam = [];
	strParam.push(DbParameter.string(ticket_id));

	// ユーザ名取得
	var db = new TenantDatabase();
	var result = db.select(sql,strParam);
	
	if (result.countRow > 0){
		var data = result.data;
		for (var i = 0;i < data.length;i++){
			// グループコーを画面表示用のキーに変換
			var mailkey = mail_group_list[data[i].mail_group];
			if (typeof mailkey === "undefined"){
				continue;
			}
			// デフォルトメールユーザを格納
			var obj = {user_cd:data[i].user_cd,user_name:data[i].user_name};
			if (mailkey in $mailDefUsers){
				$mailDefUsers[mailkey].push(obj);
			}else{
				$mailDefUsers[mailkey] = [obj];
			}
		}
	}

}


// プラグインで指定されているユーザをセット
function setProcessTargetUsers(nodeid,userlist) {

	var targetId = {};
	targetId[Constant.LO_NODE_KIAN] = 'kian';
	targetId[Constant.LO_NODE_APPR_1] = 'appr_1';
	targetId[Constant.LO_NODE_APPR_2] = 'appr_2';
	targetId[Constant.LO_NODE_APPR_3] = 'appr_3';
	targetId[Constant.LO_NODE_APPR_4] = 'appr_4';
	targetId[Constant.LO_NODE_APPR_5] = 'appr_5';
	targetId[Constant.LO_NODE_LAST_CONFIRM] = 'last_confirm';
	
	var key="";
	if (nodeid in targetId){
		key = targetId[nodeid];
		
		var db = new TenantDatabase();
		// ユーザ名取得
		var sql ="";
		sql+=" SELECT DISTINCT ";
		sql+="     user_cd ";
		sql+="    ,user_name ";
		sql+=" FROM imm_user ";
		sql+="   WHERE locale_id = 'ja' "; 
		sql+="    AND delete_flag = '0' ";
		sql+="    AND start_date <= CURRENT_DATE ";
		sql+="    AND end_date > CURRENT_DATE ";
		sql+=" ";
		// in句を作成
		sql+= " AND user_cd IN (";
		var strParam = [];
		userlist.forEach(function(v, i) {
			if (v === null || v === ""){
				return;
			}
			if (strParam.length > 0) {
				sql+= ", ";
			}
			sql+= "?";
			strParam.push(DbParameter.string(v));
		});
		sql+= ") ";
		
		// ユーザ名取得
		var obj = [];
		var result = db.select(sql,strParam);
		if (result.countRow > 0){
			for (var i = 0;i < result.data.length;i++){
				// デフォルトユーザを格納
				obj.push({user_cd:result.data[i].user_cd,user_name:result.data[i].user_name});
			}
			$nodeDefUsers[key]=obj;
		}		
	}
	
	ImJson.parseJSON($oUserParams.imwCallOriginalParams);
	
}


// ノードの処理対象者を取得
/*function getGroupUsers(public_group_set_cd,public_group_cd) {

	var sql ="";
	sql+=" SELECT distinct ";
	sql+="      g.public_group_cd ";
	sql+="     ,g.user_cd ";
	sql+="     ,u.user_name ";
	sql+=" FROM imm_public_grp_ath g ";
	sql+=" INNER JOIN imm_user u ";
	sql+="    ON g.user_cd = u.user_cd ";
	sql+="   AND u.locale_id = 'ja' "; // todo ログインユーザのロケール使う。対象のロケールが登録されてない場合どうするか
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+=" WHERE ";
	sql+="       g.public_group_set_cd = ? ";
	sql+="   AND g.public_group_cd = ? ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
	
    var db = new TenantDatabase();
    var strParam = [];
    strParam.push(DbParameter.string(public_group_set_cd));
    strParam.push(DbParameter.string(public_group_cd));
    var result = db.select(sql,strParam);
    
    var list = [];
    for (var i=0;i < result.countRow;i++){
    	list[i] = {label : result.data[i].user_name ,value : result.data[i].user_cd};
    }
    return list;
}*/

/**
 * マスタからユーザ名取得
 * 
 * @param {array} ユーザコードリスト
 * @return {object}取得結果
 */
function getUserNames(userlist) {

	// todo 多言語対応
	var locale_id = 'ja';
	
	// ユーザ名取得
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+="     user_cd ";
	sql+="    ,user_name ";
	sql+=" FROM imm_user ";
	sql+="   WHERE locale_id = '"+ locale_id +"' "; 
	sql+="    AND delete_flag = '0' ";
	sql+="    AND start_date <= CURRENT_DATE ";
	sql+="    AND end_date > CURRENT_DATE ";
	sql+=" ";
	// in句を作成
	sql+= " AND user_cd IN (";
	
	var strParam = [];
	userlist.forEach(function(v, i) {
		if (v === null || v === ""){
			return;
		}
		if (strParam.length > 0) {
			sql+= ", ";
		}
		sql+= "?";
		strParam.push(DbParameter.string(v));
	});
	sql+= ") ";
	
	var db = new TenantDatabase();
	var result = db.select(sql,strParam);	
	return result;
}


/**
 * チケットidからタイトルに紐づく担当係コードを取得
 * 
 * @param {string} チケットid
 * @param {string} チケットタイプ(KY:企画 KD:許諾)
 * @return {object}取得結果
 */
function getTantouKakariCd(ticket_id,ticket_Type) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "";
	sql+=" SELECT DISTINCT "; 
	sql+="   t.tantou_kakari_cd ";
	sql+=" FROM lo_t_kikaku ki ";
	if (ticket_Type == 'KD'){
		sql+=" INNER JOIN lo_t_kyodaku_kikaku_himozuke ky ";
		sql+="    ON ki.kikaku_id = ky.kikaku_id  ";
		sql+="   AND ky.sakujo_flg = '0' ";
	}
	sql+=" INNER JOIN lo_m_title t ";
	sql+="    ON ki.title_cd = t.title_cd  ";
	sql+="   AND t.sakujo_flg = '0' ";
	sql+= " WHERE ki.sakujo_flg = '0'";
	if (ticket_Type == 'KD'){
		sql+= "   AND ky.kyodaku_id = ? ";
	}else{
		sql+= "   AND ki.kikaku_id = ? ";
	}
	
	var db = new TenantDatabase();
	var result = db.select(sql,[DbParameter.string(ticket_id)]);
	
	var list = [];
	if (result.countRow > 0){
		for (var i=0;i < result.data.length;i++){
			list.push(result.data[i].tantou_kakari_cd);
		}
	}
	
	return list;
}

function getTsuchisaki(bunshoId) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sairiyoFlg = false;
	var result;
	var sql = "";
	var db = new TenantDatabase();

	// 対象文書の設定を確認する
	sql += "SELECT ";
	sql += "  lts.mail_group, ";
	sql += "  u.user_cd, ";
	sql += "  u.user_name ";
	sql += "FROM ";
	sql += "  lo_t_sendmail lts ";
	sql += "  INNER JOIN lo_t_kawari ltk ";
	sql += "    ON lts.ticket_id = ltk.bunsho_id ";
	sql += "    AND ltk.bunsho_id = ? ";
	sql += "    AND ltk.sakujo_flg = '0' ";
	sql += "  INNER JOIN imm_user u ";
	sql += "   ON lts.user_cd = u.user_cd ";
	sql += "   AND u.locale_id = 'ja' ";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.start_date <= CURRENT_DATE ";
	sql += "   AND u.end_date > CURRENT_DATE ";
	sql += "WHERE ";
	sql += "  lts.sakujo_flg = '0' ";
	
	result = db.select(sql,[DbParameter.string(bunshoId)]);

	if (result.countRow == 0) {
		sairiyoFlg = true;
		// 対象文書の再利用元の設定を確認する
		sql = "";
		sql += "SELECT ";
		sql += "  lts.mail_group, ";
		sql += "  u.user_cd, ";
		sql += "  u.user_name ";
		sql += "FROM ";
		sql += "  lo_t_sendmail lts ";
		sql += "  INNER JOIN lo_t_kawari ltk ";
		sql += "    ON lts.ticket_id = ltk.sairiyou_bunsho_id ";
		sql += "    AND ltk.bunsho_id = ? ";
		sql += "    AND ltk.sakujo_flg = '0' ";
		sql += "  INNER JOIN imm_user u ";
		sql += "   ON lts.user_cd = u.user_cd ";
		sql += "   AND u.locale_id = 'ja' ";
		sql += "   AND u.delete_flag = '0' ";
		sql += "   AND u.start_date <= CURRENT_DATE ";
		sql += "   AND u.end_date > CURRENT_DATE ";
		sql += "WHERE ";
		sql += "  lts.sakujo_flg = '0' ";
		
		result = db.select(sql,[DbParameter.string(bunshoId)]);
	}
	
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';
	mail_group_list[Constant.LO_MAIL_GROUP_SHOHYO]='mail_2';
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIYAKU]='mail_4';
	mail_group_list[Constant.LO_MAIL_GROUP_KEIJOU]='mail_5';
	
	if (result.countRow > 0){
		var data = result.data;
		for (var i = 0;i < data.length;i++){
			// グループコーを画面表示用のキーに変換
			var mailkey = mail_group_list[data[i].mail_group];
			if (typeof mailkey === "undefined"){
				continue;
			}
			// デフォルトメールユーザを格納
			var obj = {user_cd:data[i].user_cd,user_name:data[i].user_name};
			if (sairiyoFlg) {
				var pubGrpSetCd = Constant.LO_GROUP_SET_CD;
				var pubGrpCd = "";
				if (mailkey == 'mail_1') {
					// 起案時通知先はBNE(パブリックグループ)以下のに所属
					pubGrpCd = Constant.LO_GROUP_CD_BNE;
					if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
						pubGrpSetCd, pubGrpCd, data[i].user_cd)) {
						continue;
					}
				} else if (mailkey == 'mail_2') {
					// 商標ZACROへの通知はチェックしない
				} else if (mailkey == 'mail_3') {
					// 完了通知先はBNE(パブリックグループ)以下のに所属
					pubGrpCd = Constant.LO_GROUP_CD_BNE;
					if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
						pubGrpSetCd, pubGrpCd, data[i].user_cd)) {
						continue;
					}
				} else if (mailkey == 'mail_4') {
					// 契約担当通知先はBNE(パブリックグループ)以下のに所属
					pubGrpCd = Constant.LO_GROUP_CD_BNE;
					if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
						pubGrpSetCd, pubGrpCd, data[i].user_cd)) {
						continue;
					}
				} else if (mailkey == 'mail_5') {
					// 計上担当通知先はBNE(パブリックグループ)以下のに所属
					pubGrpCd = Constant.LO_GROUP_CD_BNE;
					if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
						pubGrpSetCd, pubGrpCd, data[i].user_cd)) {
						continue;
					}
				}
			}
			
			if (mailkey in $mailDefUsers){
				$mailDefUsers[mailkey].push(obj);
			}else{
				$mailDefUsers[mailkey] = [obj];
			}
		}
	}
}

function filterFuncChkUserObj(userObj, objs) {
	for (var i = 0; i < objs.length; i++) {
		if (userObj.user_cd == objs[i]) {
			return true;
		}
	}
	return false;
}

function chkNodeUsers() {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	Debug.print("chkNodeUsers $nodeDefUsers");
	Debug.console($nodeDefUsers);
	var pubGrpSetCd = Constant.LO_GROUP_SET_CD;
	var pubGrpCd = Constant.LO_GROUP_CD_BNE;
	var delKianUsers = [];
	var delAppr_1Users = [];
	var delAppr_2Users = [];
	var delAppr_3Users = [];
	var delAppr_4Users = [];
	var delAppr_5Users = [];
	var delLastConfirmUers = [];
	var sameInputUserKianUserFlg = false;
	// 起案者
	if ($nodeDefUsers.kian.length > 0) {
		var tempUserObjs = $nodeDefUsers.kian;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if (tempUserObjs[i].user_cd.length > 0) {
				// 起案者のコードがない場合は、入力者が起案者となるため、完了確認者と同じになる
				sameInputUserKianUserFlg = true;
				break;
			}
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delKianUsers.push(tempUserObjs[i].user_cd);
			}
		}
		if (delKianUsers.length > 0) {
			$nodeDefUsers.kian = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delKianUsers);});
		}
	}
	// 承認1
	if ($nodeDefUsers.appr_1.length > 0) {
		var tempUserObjs = $nodeDefUsers.appr_1;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delAppr_1Users.push(tempUserObjs[i].user_cd);
			}
		}
		if (delAppr_1Users.length > 0) {
			$nodeDefUsers.appr_1 = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delAppr_1Users);});
		}
	}
	// 承認2
	if ($nodeDefUsers.appr_2.length > 0) {
		var tempUserObjs = $nodeDefUsers.appr_2;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delAppr_2Users.push(tempUserObjs[i].user_cd);
			}
		}
		if (delAppr_2Users.length > 0) {
			$nodeDefUsers.appr_2 = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delAppr_2Users);});
		}
	}
	// 承認3
	if ($nodeDefUsers.appr_3.length > 0) {
		var tempUserObjs = $nodeDefUsers.appr_3;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delAppr_3Users.push(tempUserObjs[i].user_cd);
			}
		}
		if (delAppr_3Users.length > 0) {
			$nodeDefUsers.appr_3 = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delAppr_3Users);});
		}
	}
	// 承認4
	if ($nodeDefUsers.appr_4.length > 0) {
		var tempUserObjs = $nodeDefUsers.appr_4;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delAppr_4Users.push(tempUserObjs[i].user_cd);
			}
		}
		if (delAppr_4Users.length > 0) {
			$nodeDefUsers.appr_4 = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delAppr_4Users);});
		}
	}
	// 承認5
	if ($nodeDefUsers.appr_5.length > 0) {
		var tempUserObjs = $nodeDefUsers.appr_5;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delAppr_5Users.push(tempUserObjs[i].user_cd);
			}
		}
		if (delAppr_5Users.length > 0) {
			$nodeDefUsers.appr_5 = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delAppr_5Users);});
		}
	}
	// 完了確認者
	if ($nodeDefUsers.last_confirm.length > 0) {
		var tempUserObjs = $nodeDefUsers.last_confirm;
		for (var i = 0; i < tempUserObjs.length; i++) {
			if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
					pubGrpSetCd, pubGrpCd, tempUserObjs[i].user_cd)) {
				delLastConfirmUers.push(tempUserObjs[i].user_cd);
			}
		}
		if (delLastConfirmUers.length > 0) {
			$nodeDefUsers.last_confirm = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delLastConfirmUers);});
			if (sameInputUserKianUserFlg) {
				$nodeDefUsers.kian = tempUserObjs.filter(function(tempUserObj){return !filterFuncChkUserObj(tempUserObj, delLastConfirmUers);});
			}
		}
	}
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
	
	var templateResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "retrieveCommentTemplateContent", Number(request.comment_template_id));
	if (templateResult.countRow == 0) {
		return functionResult;
	}
	functionResult.data = templateResult.data[0].comment_template_content;
	return functionResult;
}


