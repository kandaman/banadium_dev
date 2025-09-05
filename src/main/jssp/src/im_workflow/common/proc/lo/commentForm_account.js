Constant.load("lo/common_libs/lo_const");
var $oUserParams={};
var $label_comment = ""; //コメント欄文言
var $flowId;
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
var $nodeDefUsers ={};

// デフォルトメールユーザ
var $mailDefUsers ={};

var $nodeList

function init(request) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");	

	// ライセンスプロダクションか判断
	$proFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",	Constant.LO_GROUP_CD_PRODUCTION);
	
	if ($proFlg) {
		//起案可フラグをtrueにする
		$kianKengenFlg = true;
	}	

	// 画面からの値を取得
	$oUserParams = request.oUserParams;
	
	$flowId = $oUserParams.imwFlowId;
	//ノード一覧を取得
	$nodeList = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "getNodeInfo",	$flowId);	
	Logger.getLogger().info('$nodeList1' + ImJson.toJSONString($nodeList, true));
	/*　TODO:未設定でも問題ないか確認必要かも
	if($flowId == "lo_flow_account"){
		// デフォルトユーザ
		$nodeDefUsers ={
			kian:[],
			appr_1:[],
			appr_2:[],		
			sys:[]
		};
	}else{
		$nodeDefUsers ={
			appr_1:[],
			appr_2:[],
			sys:[]			
		};
	}
	*/

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

	// セッション情報
	var sessionInfo = Contexts.getAccountContext();
	var localeId = sessionInfo.locale;
	// システムマターid、ノードid
	var imwSystemMatterId= $oUserParams.imwSystemMatterId;
	var imwNodeId = $oUserParams.imwNodeId;

	// 起案者ノードか
	if ($oUserParams.imwNodeId == Constant.LO_NODE_KIAN){
		Logger.getLogger().info('[init] 起案');
		
		// 起案ノードの動的承認オフ
		$nodeList.kian.dc_setting = false;
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

		if ($oUserParams.imwNodeId != ''){
			var actvMatterObj = new ActvMatter('ja', $oUserParams.imwSystemMatterId);
			var flowInfo = actvMatterObj.getExecFlow().data;
			var nodeInfoList = flowInfo.nodes;

			// ノード情報取得
			var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
			//TODO:実フローの方法（nodeInfoList）と突き合わせしたほうがよいかも
			for (var i in $nodeList){
			//for (var idx = 0; idx < nodeInfoList.length; idx++) {
				//if (nodeInfoList[idx].nodeId == Constant.LO_NODE_SYS) {
					// システム担当者ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList($nodeList[i].node_id);
					$nodeUserslist[i] = getProcessTargetName(result);
				//}
			}			
			// 通知設定取得
			getSettingMailUsers($oUserParams);
		}
		
		// 申請者(名称のみ)
		var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
		var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);
		$nodeUserslist.apply = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHINSEI);

		var userContext = Contexts.getUserContext();
		var userCd = userContext.userProfile.userCd;
		var userName = userContext.userProfile.userName;
		
		//　起案ノードにログイン者をセット
		$nodeUserslist.kian = userName;

		getTsuchisaki($oUserParams.item_matterName);

		
	// 申請ノードか
	}else if ($oUserParams.item_proc_name == "申請"){
		Logger.getLogger().info('[init] item_proc_name = 申請');
		
		if($proFlg) {			
			$approveSettingFlg = true; // 承認ノード設定可能フラグをセット
			$approveMode = true;// 承認モードをセット
			//$sameInputPersonFlg = true;
		}
		
		// 経路設定表示
		if($flowId == "lo_flow_account"){
			$routeFlg = false;			
			$showFlg = false;			
			$kianSettingFlg = true;
		}else{
			$routeFlg = true;			
			$showFlg = true;			
			$approveSettingFlg = true; // 承認ノード設定可能フラグをセット			
			$kianKengenFlg = false;			
			$kianSettingFlg = false;
		}

		// ノード情報に既にユーザが設定されていれば取得
		var oUserParams = request.oUserParams;
		Logger.getLogger().info(' [init]　oUserParams' + ImJson.toJSONString(oUserParams,true));
		if (typeof oUserParams !== "undefined" ){
			getDefaultExecUsers(oUserParams);
		}
		Logger.getLogger().info(' [init]　getDefaultExecUsers fin');

		if (sairiyoFlg) {
			chkNodeUsers();
		}
		
		var userContext = Contexts.getUserContext();
		var userCd = userContext.userProfile.userCd;
		var userName = userContext.userProfile.userName;

		$nodeUserslist.apply = userContext.userProfile.userName;		
		
		if($oUserParams.imwNodeSetting || $oUserParams.imwNodeSetting !=""){
			var nodeSetting = ImJson.parseJSON($oUserParams.imwNodeSetting);			
		}else{
			var nodeSetting = {};
		}
		
		//$nodeUserslist.kian= nodeSetting.kian;		
	
		getTsuchisaki($oUserParams.item_matterName);		
	

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
				} else if (nodeInfoList[idx].nodeId == Constant.LO_NODE_SYS) {
					// システム担当者ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_SYS);
					$nodeUserslist.sys = getProcessTargetName(result );
				}
			}			
			// 通知設定取得
			getSettingMailUsers($oUserParams);
		}
		if (!$nodeUserslist.kian || $nodeUserslist.kian == '') {
			$nodeUserslist.kian = '---';
		}
		if (!$nodeUserslist.appr_1 || $nodeUserslist.appr_1 == '') {
			$nodeUserslist.appr_1 = '---';
		}
		if (!$nodeUserslist.appr_2 || $nodeUserslist.appr_2 == '') {
			$nodeUserslist.appr_2 = '---';
		}
		if (!$nodeUserslist.sys || $nodeUserslist.sys == '') {
			$nodeUserslist.sys = '---';
		}
	}
	
	Logger.getLogger().info(' [init]$nodeUserslist　'+ ImJson.toJSONString($nodeUserslist, true));
	Logger.getLogger().info(' [init]$nodeDefUsers　'+ ImJson.toJSONString($nodeDefUsers, true));
	Logger.getLogger().info('$nodeList2' + ImJson.toJSONString($nodeList, true));
	// $nodeListの中に$nodeUserslistの情報を梱包する
	for(var i in $nodeList){
		if($nodeUserslist[i]){
			$nodeList[i].user =[{user_name:$nodeUserslist[i]}];
		}		
		
		if($nodeDefUsers[i]){
			$nodeList[i].user = $nodeDefUsers[i];
		}
	
	}
	Logger.getLogger().info('$nodeList3' + ImJson.toJSONString($nodeList, true));
	

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
	
	//if(oUserParams.imwFlowId == "lo_flow_account"){
		targetIdList.push("lo_node_kian");
	//}
		
	targetIdList.push("lo_node_appr_1");
	targetIdList.push("lo_node_appr_2");	
	targetIdList.push("lo_node_sys");
	var nodeSetting = oUserParams.imwNodeSetting;

	if (!nodeSetting || nodeSetting==""){
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
	Logger.getLogger().info('[init] ' + sql);
	// ユーザ名取得
	var result = db.select(sql,strParam);
	Logger.getLogger().info(' [init]　searchUserList' + ImJson.toJSONString(searchUserList,true))
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
				} else if ("lo_node_sys" == targetIdList[idx]) {
					$nodeDefUsers.sys = settingUserList;
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
		if ('shinsei_id' in imwOrgParam) {
			ticket_id = imwOrgParam.shinsei_id;
		}
	}
	if (ticket_id==""){
		return;
	}
	
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';	
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
	
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
	targetId[Constant.LO_NODE_SYS] = 'sys';
	
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

function getTsuchisaki(shinseiId) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	$mailDefUsers.mail_1 = [];
	$mailDefUsers.mail_3 = [];
	
	//メールグループ変換用オブジェクト
	var mail_group_list={};
	mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';	
	mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
	
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
	sql += "  INNER JOIN lo_t_account_shinsei ltk ";
	sql += "    ON lts.ticket_id = ltk.shinsei_id ";
	sql += "    AND ltk.shinsei_id = ? ";
	sql += "    AND ltk.sakujo_flg = '0' ";
	sql += "  INNER JOIN imm_user u ";
	sql += "   ON lts.user_cd = u.user_cd ";
	sql += "   AND u.locale_id = 'ja' ";
	sql += "   AND u.delete_flag = '0' ";
	sql += "   AND u.start_date <= CURRENT_DATE ";
	sql += "   AND u.end_date > CURRENT_DATE ";
	sql += "WHERE ";
	sql += "  lts.sakujo_flg = '0' ";
	
	result = db.select(sql,[DbParameter.string(shinseiId)]);
	
	
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
				//通知先ユーザが適切なパブリックグループに所属しているかを確認（異動した場合など）
				if (mailkey == 'mail_1') {
					// 起案時通知先はBNE(パブリックグループ)以下のに所属
					pubGrpCd = Constant.LO_GROUP_CD_BNE;
					if(!Content.executeFunction("im_workflow/common/proc/lo/lo_common", "isPubGrpUnderShozoku",
						pubGrpSetCd, pubGrpCd, data[i].user_cd)) {
						continue;
					}
				} else if (mailkey == 'mail_3') {
					// 完了通知先はBNE(パブリックグループ)以下のに所属
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
	
	if (result.countRow == 0) {
		// 固定値マスタから通知先を取得
		var list =[];

		var db = new TenantDatabase();
		var result;
		var sql = "select ";
		sql +=	"ko.cd_id,";	
		sql +=	"u.user_cd,";
		sql +=	"u.user_name,";
		sql +=	"u.email_address1 from lo_m_koteichi ko ";	
		sql += " left join imm_user u ";
		sql += " on ko.cd_naiyo = u.user_cd ";	
		sql += "   AND u.locale_id = 'ja' ";
		sql += "   AND u.delete_flag = '0' ";
		sql += "   AND u.start_date <= CURRENT_DATE ";
		sql += "   AND u.end_date > CURRENT_DATE ";
		sql += " where ko.cd_cls_id = ? AND ko.sakujo_flg='0' order by ko.sort_no";
		
		var result = db.select(sql, [ DbParameter.string("0093") ]);
		
		//Logger.getLogger().info(' [init]　'+sql+ ImJson.toJSONString(result.data));
		var mailKey ="";
		for ( var i = 0; i < result.countRow; i++) {		
			var row = result.data[i];
					
			switch(row.cd_id){
			case "1":
				mailKey = "mail_1";		
				break;
			case "2":
				mailKey = "mail_3";		
				break;		
			}
			
			$mailDefUsers[mailKey].push(row);
		
			list[i] = result.data[i].cd_naiyo;
		}
		//Logger.getLogger().info(' [init]　'+ ImJson.toJSONString($mailDefUsers));
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
	
}

