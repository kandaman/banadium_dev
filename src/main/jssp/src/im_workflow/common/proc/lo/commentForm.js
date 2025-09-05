Constant.load("lo/common_libs/lo_const");
var $oUserParams={};
//var $internalLicenseProductionComment = false;
//var $externalLicenseProductionComment = false;
var $label_comment = ""; //コメント欄文言

var $nodeUserslist ={};
var $proFlg = false; //ライセンスプロダクションflg
var $showFlg = true; //経路表示
var $showAppr2Flg = true; //承認２(M)表示
var $showKeiyakuFlg = false; //契約ノード表示
var $routeFlg = false; //経路設定ノード
var $approveMode = false;	// 画面表示制御用・承認モード(TODO: フラグ制御未実装)
var $annotation_comment = "";	// コメント注釈
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数

// デフォルトユーザ
var $nodeDefUsers ={
appr_1:[],
appr_2:[],
appr_3:[],
appr_4:[],
appr_5:[],
keiyaku:[]
};
// デフォルトメールユーザ
var $mailDefUsers ={};

var $comment_template_list = [];

function init(request) {
	//Logger.getLogger().info('[init] request　' + ImJson.toJSONString(request, true));
	
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ライセンスプロダクションか判断
	$proFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_PRODUCTION);
	
	//添付ファイルメッセージ及び拡張子リスト取得
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_KIKAKU_KYODAKU_EXT);
    $extstr = "";
    for ( var i = 0; i < $extList.length; i++) {
    	if ($extstr == "") {
    		$extstr = $extList[i];
    	} else {
    		$extstr = $extstr + "/" + $extList[i];
    	}
    }
    $extListstr = $extstr.replace(/\./g, "");
    $extstr = MessageManager.getMessage('KK02I018', $extstr);

	// 画面からの値を取得
	$oUserParams = request.oUserParams;
	
	Logger.getLogger().info('[init] request　' + ImJson.toJSONString(request.oUserParams, true));

	// 処理名がなけばデフォルト名を設定
	if ($oUserParams.item_proc_name == "" || typeof $oUserParams.item_proc_name === 'undefined'){
		$oUserParams.item_proc_name = "登録";
	}
	
	// コメント入力欄の文言
	switch ($oUserParams.item_status_cd) {
		case Constant.LO_STATUS_SHINSEI:		// 起案(申請)
		case Constant.LO_STATUS_SASHIMODOSHI:	// 差戻し
		case Constant.LO_STATUS_SHONIN:			// 承認(一次承認)
		case Constant.LO_STATUS_SHONIN_OK:	// 承認OK
			$label_comment = MessageManager.getMessage('IN01I004');
			break;
		case Constant.LO_STATUS_SHUSEI_IRAI:	// 修正依頼
		case Constant.LO_STATUS_HIKETSU:		// 否決
		case Constant.LO_STATUS_KANRYO:			// 完了
			$label_comment = MessageManager.getMessage('IN01I005');
			break;
		default:
			$label_comment = MessageManager.getMessage('IN01I006');
	}

	// コメント注釈設定
	if ($oUserParams.item_status_cd == Constant.LO_STATUS_SHUSEI_IRAI) {
		$annotation_comment = MessageManager.getMessage('IN01I002');
	}
	
	var templateResult = Content.executeFunction("lo/common_libs/lo_common_fnction", "retrieveCommentTemplateList");
	$comment_template_list = [{}].concat(templateResult.data);
    Content.executeFunction("lo/common_libs/lo_common_fnction", "toSelectList", $comment_template_list, "comment_template_nm", "comment_template_id");
    
 

	// セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var localeId = sessionInfo.locale;
    // システムマターid、ノードid
	var imwSystemMatterId= $oUserParams.imwSystemMatterId;
	var imwNodeId = $oUserParams.imwNodeId;

	// 経路表示有無
	if (!$proFlg){
		$showFlg = false; //ライセンシーは非表示
		return;
	}
	
	if($oUserParams.keiyaku_node === "1"){
		$showKeiyakuFlg = true;
	}
	
	
	// BNE担当ノードか
	if ($oUserParams.imwNodeId == Constant.LO_NODE_APPR_0){
		//承認でなけれ経路非表示 
		if($oUserParams.item_proc_status != Constant.LO_WF_STATUS_SHONIN){
			$showFlg = false;
			return;
		}

		// 経路設定表示
		$routeFlg = true; 
		setNodeAuthUsers();

		var setFlg = false;
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
					  //setProcessTargetUsers(nodeid,users)
					  setFlg = true;
				  }
			}		
			
		}
		
		
		if (setFlg){
			//　以前に設定した通知設定取得
			getSettingMailUsers($oUserParams)			
			
		}else{
			// デフォルト通知設定
			getDefaultMailUsers(userCode,$oUserParams);
		}		
		
		// ノードにユーザ情報がなければDBから初期値設定		
	    var userCode = sessionInfo.userCd;
		//selectedNodeUser(Constant.LO_NODE_APPR_LAST,userCode); //自分自身
	    
		//上司マスタからデフォルトユーザ指定
		getDefaultExecUsers(userCode,$oUserParams);
		
		if($showKeiyakuFlg){
			// 契約担当ノードをパブリックグループから取得
			$nodeDefUsers.keiyaku = getGroupUsers(Constant.LO_GROUP_CD_CONTRACT);
		}			
		
		// 商標zacro連携にデフォルトセット
    	$mailDefUsers["mail_2"] = [];
		
	}else {
		$routeFlg = false;
		
		if ($oUserParams.imwNodeId != '' && $oUserParams.imwNodeId != Constant.LO_NODE_APPLY){
			
		    // ノード情報取得
		    var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
		    
		    // 申請ノードの最後の処理者を取得
		    var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);
		    $nodeUserslist.apply = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHINSEI);
		    
		    // BNE担当ノードの最後の処理者を取得
		    var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPR_0);
		    $nodeUserslist.appr_0 = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHONIN);
		    
		    // 承認１ノードの処理対象者を取得
		    var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_1);
			$nodeUserslist.appr_1 = getProcessTargetName(result );
			
			if($showKeiyakuFlg){
				if($oUserParams.imwNodeId == Constant.LO_NODE_APPR_0
						|| $oUserParams.imwNodeId == Constant.LO_NODE_APPR_1 ){
					// 契約担当ノードの処理対象者を取得
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_KEIYAKU);
					$nodeUserslist.keiyaku = getProcessTargetName(result );
					//Logger.getLogger().info(' [init]　許諾編集画面表示 $kyodaku_data ' + ImJson.toJSONString($kyodaku_data, true));
					
				}else if($oUserParams.imwNodeId == Constant.LO_NODE_KEIYAKU){
					// 契約担当ノードの処理対象者を取得
					var userContext = Contexts.getUserContext();
				    var userCd = userContext.userProfile.userCd;
				    var userName = userContext.userProfile.userName;
					var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_KEIYAKU);
					
					$nodeUserslist.keiyaku = userName;
					
				}else{			
					var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_KEIYAKU);
			    	$nodeUserslist.keiyaku = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHONIN);
			    	
				}
			}
			
		    
			
		    // 承認2ノードの処理対象者を取得
		    var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_2);
			$nodeUserslist.appr_2 = getProcessTargetName(result );
			
		    // 最終確認ノードの処理対象者を取得
		    var result = actvMatter.getExecProcessTargetList(Constant.LO_NODE_APPR_LAST);
			$nodeUserslist.appr_last = getProcessTargetName(result );
			
			// 通知設定取得
			getSettingMailUsers($oUserParams);
		}
	}
}



// actvMatter.getExecProcessTargetListから処理対象ユーザ取り出し
function getProcessTargetName(result) {
	var names=[];
	if (result.data){
    	for (var i=0;i < result.data.length;i++){
    		 names.push(result.data[i].processTargetName);
    	}
    	return names.join('<br>');
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



// ノードの処理対象者を設定
function setNodeAuthUsers() {

    var userContext = Contexts.getUserContext();
    var userCd = userContext.userProfile.userCd;
    var userName = userContext.userProfile.userName;

	// 申請者(名称のみ)
	var actvMatter = new ActvMatterNode('ja', $oUserParams.imwSystemMatterId);
	var result = actvMatter.getProcessHistoryList(Constant.LO_NODE_APPLY);
	$nodeUserslist.apply = getProcessLatestUser(result,Constant.LO_WF_STATUS_SHINSEI);

	// BNE担当(名称のみ)
	$nodeUserslist.appr_0 = userName;


	// BNE担当(最終)
	//var list= [];
	//var ret = getGroupUsers('license_out',Constant.LO_GROUP_APPR_0); // todo BNE担当と最終担当を別にするかで処理変える
    $nodeUserslist.appr_last = {user_cd : userCd,user_name : userName}; // 最終担当はBNE担当処理ユーザ固定
	
}

/**
 * 上司マスタからデフォルトの承認ユーザ取得
 * 
 * @param {strign} ログインユーザコード
 */
function getDefaultExecUsers(user_cd,oUserParams) {
	
    var db = new TenantDatabase();
    // 上司マスタ取得
	var sql ="";
	sql+=" SELECT * FROM lo_m_jocho ";
	sql+=" WHERE sakujo_flg = '0' ";
	sql+="   AND shinsei_sha = ? ";
    var strParam = [];
    strParam.push(DbParameter.string(user_cd));
    var result = db.select(sql,strParam);
    var userlist = [];
    if (result.countRow > 0){
    	// 配列に格納
    	userlist.push(result.data[0].ichiji_shonin);
    	userlist.push(result.data[0].niji_shonin);
    	userlist.push(result.data[0].sanji_shonin);
    	userlist.push(result.data[0].yoji_shonin);
    	userlist.push(result.data[0].goji_shonin);
    }
    
    if (userlist.length < 1){
    	return;
    }

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
    strParam = [];
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
    var result = db.select(sql,strParam);
    if (result.countRow > 0){
    	for (var i = 0;i < result.data.length;i++){
    		// ユーザコード配列のインデックスから経路設定場所
    		var idx = userlist.indexOf(result.data[i].user_cd);
    		if (idx > -1 ){
    			// appr_ + index+1 を名前としてオブジェクトを格納
    			var key = "appr_" + (idx+1);
    			// デフォルトユーザを格納
    			$nodeDefUsers[key] = [{user_cd:result.data[i].user_cd,user_name:result.data[i].user_name}];
    		}
    	}
    }
    
	// 許諾種別:追加の場合承認2ノード設定は指定なし
	if ('imwCallOriginalParams' in $oUserParams){
		var imwOrgParam = ImJson.parseJSON($oUserParams.imwCallOriginalParams);
		if('kyodaku_cls' in imwOrgParam){
			//	許諾種別:追加
			if (imwOrgParam.kyodaku_cls == '2'){
				$nodeDefUsers['appr_2'] = [];
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
	
	// 承認3ユーザを取得して設定
	var list_3 = getGroupUsers(Constant.LO_GROUP_APPR_3);
	
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
	for(var i = 0; i < kakariCd.length; i++) {
		// 担当係コードを末尾に付けた特定グループを取得
		var group_cd= Constant.LO_GROUP_CD_SPECIFIC + '_' + kakariCd[0];
		var specific_list = getGroupUsers(group_cd);
		list_3 = list_3.concat(specific_list);
	}
	
	var list = enduserlist.concat(list_3);

	// 重複を削除
	var groupList = list.filter(function (x, i, self) {
		if (self.indexOf(x.user_cd) === -1){
			self.push(x.user_cd);
			return x;
		}
    });
    
	//結合してセット
	$mailDefUsers["mail_3"] = groupList;

	
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
	if (flg){
		// 契約通知先グループ設定
		var list = getGroupUsers(Constant.LO_GROUP_CD_CONTRACT_NOTICE);
		$mailDefUsers["mail_4"] = list;
	}
	
	// 計上担当通知---------
	// 許諾の場合は計上担当取得
	if('kyodaku_id' in imwOrgParam){
		var account_list = getGroupUsers(Constant.LO_GROUP_CD_ACCOUNT);
		$mailDefUsers["mail_5"] = account_list;
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
		// 企画の場合
		if ('kikaku_id' in imwOrgParam) {
			ticket_id = imwOrgParam.kikaku_id;
		// 許諾の場合
		}else if('kyodaku_id' in imwOrgParam){
			ticket_id = imwOrgParam.kyodaku_id;
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
	targetId[Constant.LO_NODE_APPR_1] = 'appr_1';
	targetId[Constant.LO_NODE_APPR_2] = 'appr_2';
	targetId[Constant.LO_NODE_APPR_3] = 'appr_3';
	
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
        sql+= "   AND ky.kyodaku_id = ? "
    }else{
        sql+= "   AND ki.kikaku_id = ? "
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
