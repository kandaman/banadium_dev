Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};
var $kyodaku_data = {};
var $moto_kyodaku_data = {};
var $file_list = {}; //添付ファイル仕様
var $before_apply = false;	//申請前か

var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $sairiyou_flg = false; // 再利用可能か true:再利用可能

var $new_window_flg = false; // 新規ウィンドウフラグ

var $tsuchisakiObj = {}; // 通知先
var $keiro = {}; // 経路
var $keiroCpl = {
		apply : false,
		appr_0 : false,
		appr_1 : false,
		keiyaku : false,
		appr_2 : false,
		appr_last : false
};
var $flowChangeFlg = false;

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　許諾編集画面表示');
	// 新規ウィンドウで開かれた場合
	if (request.new_window_flg) {
		$new_window_flg = true;
	}

	// ユーザー情報読み込み
	loadUserInfo();
    
	if ('kyodaku_id' in request) {

		var kyodakuResult = retrieveKyodakuData(request);
		$kyodaku_data = kyodakuResult.data[0]; //一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kyodaku_data);
		
		// 参照可能チェック
		if(!chkVisible($kyodaku_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage", true);
		}
		
		// 添付ファイル
		$file_list = retrieveTempuFileList(request).data;
		
		// 再利用チェック
		chkSairiyou($kyodaku_data);
		
		// 案件情報の取得
		if (!setMatterInfo($kyodaku_data)){
			// ない場合は新規でセット
			// ワークフローパラメータの設定
			setWorkflowOpenPage($kyodaku_data);
		}
		
		// 申請日に値がない場合は、システム日付を設定
		if ($kyodaku_data.kyodaku_status == Constant.LO_STATUS_ICHIJI_HOZON && $kyodaku_data.shinsei_bi == null) {
			$kyodaku_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', new Date())
		}

		$kyodaku_data.sozai_biko_large_flg = false;
		if ($kyodaku_data.short_sozai_biko != null && $kyodaku_data.short_sozai_biko.length > 1000) {
			$kyodaku_data.sozai_biko_large_flg = true;
		}
		$kyodaku_data.biko_large_flg = false;
		if ($kyodaku_data.short_biko != null && $kyodaku_data.short_biko.length > 1000) {
			$kyodaku_data.biko_large_flg = true;
		}

		if ($kyodaku_data.kyodaku_cls == "2" && $kyodaku_data.moto_kyodaku_id != null) {
			//元許諾情報取得
			Logger.getLogger().info(' [init]　motoKyodaku ' + $kyodaku_data.moto_kyodaku_id);
			var whereParamMoto = {"kyodaku_id":$kyodaku_data.moto_kyodaku_id};
			var kyodakuResult = retrieveKyodakuData(whereParamMoto);
			$moto_kyodaku_data = kyodakuResult.data[0];
		}
		
		// 通知先を取得
		getTsuchisaki($kyodaku_data.kyodaku_id);		
		
		// フロー変更の過渡期対応としてフロー変更の開始日（リリース日）を固定値マスタから取得する	
		var list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", {},Constant.LO_CDCLS_KYODAKU_FLOW_CHANGE_FROM);
		var ChangeStartDate = list[0];
		
		// 申請日がフロー変更開始日以降ならtrue
		if($kyodaku_data.shinsei_bi >= ChangeStartDate){
			$flowChangeFlg = true;
		}		

	} else {
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted");
	}
	
	// 申請前か
	if(request.kyodaku_id == Client.get('before_apply_id')) {
		$before_apply = true;
	}

	//Logger.getLogger().info('[init] $userInfo　' + ImJson.toJSONString($userInfo, true));
	//Logger.getLogger().info('[init]　許諾編集画面表示 $kyodaku_data ' + ImJson.toJSONString($kyodaku_data, true));

}

/**
 * 参照可能かチェック
 */
function chkVisible(data) {
	
	// ライセンシーフラグ
	var liFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);
	// 会社チェック（編集可能な所属グループかどうか）
	if (liFlg) {
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (data.kaisha_id != kaisha_id) {
			return false;
		}
	}
	
	return true;
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	$userInfo = Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "getUserInfo"); 
	
}

/**
 * 許諾情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKyodakuData(request) {
	if ('kyodaku_id' in request){
		return Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveKyodakuData", request.kyodaku_id);
	}
}


/**
 * 企画情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveKikakuList(request) {
	if ('kyodaku_id' in request){
		return Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveKikakuList", request.kyodaku_id);
	}
}

/**
 * 商品情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveShohinList(request) {
	if ('kyodaku_id' in request){
		return Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveShohinList", request.kyodaku_id);
	}
}

/**
 * 許諾添付ファイル情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveTempuFileList(request) {
	if ('kyodaku_id' in request){
		return Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveTempuFileList", request.kyodaku_id);
	}
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {String} 企画id
 */
function setWorkflowOpenPage(kyodakuData) {

	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定

    // ワークフローに関するパラメータを保持します
    $wf_data = {
        imwGroupId              : '',		//グループ ID 
        imwUserCode             : '',		//処理者CD
        imwPageType             : '0',		//画面種別
        imwUserDataId           : '',		//ユーザデータ ID
        imwSystemMatterId       : '',		//システム案件ID
        imwNodeId               : Constant.LO_NODE_ID,	//ノード ID 
        imwArriveType           : '',		//到達種別
        imwAuthUserCode         : user_cd,	//権限者CD 
        imwApplyBaseDate        : Content.executeFunction("lo/common_libs/lo_common_fnction","getTodayAsString"),	//申請基準日
        imwContentsId           : '',		//コンテンツ ID
        imwContentsVersionId    : '',		//コンテンツバージョン ID 
        imwRouteId              : '',		//ルート ID
        imwRouteVersionId       : '',		//ルートバージョン ID
        imwFlowId               : Constant.LO_FLOW_KYODAKU,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/kyodaku/permission_list',	//呼出元ページパス
        //imwCallOriginalParams   : ImJson.toJSONString(kyodakuData),	//呼出元パラメータ
        imwCallOriginalParams   : ImJson.toJSONString({'kyodaku_id':kyodakuData.kyodaku_id}),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
	// BNE担当処理対象者を設定
	$wf_data.imwNodeSetting = nodeSetteing(kyodakuData.kyodaku_id);

}


/**
 * 新規申請時、ワークフローのノード処理対象者を設定
 * @returns {String} ノード設定値
 */
function nodeSetteing(ticket_id){

	Constant.load("lo/common_libs/lo_const");

	// 文書idからタイトルに紐づくグループを取得
	var ticket_type = Constant.LO_TICKET_ID_HEAD_KYODAKU;
    var target_group = Content.executeFunction("lo/common_libs/lo_common_fnction",
    	"getIpGroupList", ticket_id,ticket_type);

	// パブリックグループは[セットコード＋＾+グループコード]にする
	var groupSet = [];
    for (var key in target_group){
    	groupSet.push(Constant.LO_GROUP_SET_CD+"^"+target_group[key]);
    }

	// BNE担当ノードに処理対処ユーザを設定
	var node={};
	node[Constant.LO_NODE_APPR_0] = groupSet;
	/*var node = {
		"lo_node_appr_0":["license_out^"+target_group] 
	};*/
	
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
 * 案件情報の設定
 * @param {String} 許諾id
 * @returns {boolean} true:案件あり false:案件なし
 */
//function setMatterInfo(kyodakuId) {
function setMatterInfo(kyodakuData) {
	
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    //strParam.push(DbParameter.string(kyodakuId));
    //strParam.push(DbParameter.string(kyodakuId));
    strParam.push(DbParameter.string(kyodakuData.kyodaku_id));
    strParam.push(DbParameter.string(kyodakuData.kyodaku_id));
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam,0);
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	return false;
    }
    
    
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;
    
    if (type =='cpl'){
        // 各ノードの処理対象者を取得する
        getNodeSettings(systemMatterId, true);
    	//完了案件はワークフローの設定の必要なし
    	return true;
    }
    
    // 未完了案件情報取得
	var actvMatter = new ActvMatter(systemMatterId);
    var matter = actvMatter.getMatter();

    // ワークフローに関するパラメータを保持します
    $wf_data = {
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
        //imwCallOriginalParams   : ImJson.toJSONString(kyodakuData),    //呼出元パラメータ
        imwCallOriginalParams   : ImJson.toJSONString({'kyodaku_id':kyodakuData.kyodaku_id,'kyodaku_cls':kyodakuData.kyodaku_cls}),  //呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
	// BNE担当処理対象者を設定
	$wf_data.imwNodeSetting = nodeSetteing(kyodakuData.kyodaku_id);

    //現在のノードid取得    todo 分岐ルートの場合一覧からノードIDを渡す必要があるのでは？
    var actvNodeList = actvMatter.getActvNodeList();
    var nodeId = actvNodeList.data[0].nodeId;
    $wf_data.imwNodeId = nodeId;

    // 戻し先ノードの設定
    $wf_data.imwBackNodeSetting = backNodeSetteing(nodeId);

    // ノード処理対象者か判定
  	var user_cd = Contexts.getAccountContext().userCd;//ログインユーザ設定

  	var actvMatterNode = new ActvMatterNode(systemMatterId);
    var cond = new ListSearchConditionNoMatterProperty();
    var userlist = actvMatterNode.getExecutableUserList(cond); //ノードの対象者を取得
    // 対象者に含まれていればok
    var authUserList = [];
    for(var i = 0; i < userlist.data.length; i++) {
	   /*if (user_cd == userlist.data[i].authUserCode ){
		   $proc_user_flg = true;
		   break;
	   }*/
    	authUserList.push(userlist.data[i].authUserCode);
    }
    if (authUserList.indexOf(user_cd) > -1){
    	$proc_user_flg = true;
    }
    
    // 代理設定の確認
    if (!$proc_user_flg){
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
            	$proc_user_flg = true;
            	break;
            }
        }
    }

    // 各ノードの処理対象者を取得する
    getNodeSettings(systemMatterId, false);

    return true;
}

/**
 * 承認ノードの差戻先を固定
 * @param {String} 現在ノードid
 * @returns {String} 戻り先ノードid
 */
function backNodeSetteing(nodeid){
	// 現在のノードIDから戻し先を判断
	var node = {};
	node[Constant.LO_NODE_APPR_0] = Constant.LO_NODE_APPLY;		// BNE担当→申請
	node[Constant.LO_NODE_APPR_1] = Constant.LO_NODE_APPR_0;	// 承認1→BNE担当
	node[Constant.LO_NODE_APPR_2] = Constant.LO_NODE_APPR_0;	// 承認2→BNE担当
	node[Constant.LO_NODE_APPR_3] = Constant.LO_NODE_APPR_0;	// 承認3→BNE担当
	node[Constant.LO_NODE_KEIYAKU] = Constant.LO_NODE_APPR_0;	// 契約担当→BNE担当
	node[Constant.LO_NODE_KEIJOU] = Constant.LO_NODE_APPR_0;	// 計上担当→BNE担当
	node[Constant.LO_NODE_APPR_LAST] = Constant.LO_NODE_APPLY;	// 最終承認→申請
	
	var backnode =node[nodeid];

	return backnode;
}	

/**
 * 再利用可否判定
 * @param {object} 許諾情報
 */
function chkSairiyou(kyodakuData) {
	
	// 許諾ステータスが「辞退」or「否決」or「完了」であること
	if ([Constant.LO_STATUS_JITAI,
	     Constant.LO_STATUS_HIKETSU,
	     Constant.LO_STATUS_KANRYO].indexOf(kyodakuData.kyodaku_status) == -1) {
		return;
	}
	
	// ユーザーがライセンスプロダクションではないこと
	if ($userInfo.licenseeFlg == '0') {
		return;
	}

	// ユーザーの会社と企画の会社が同一であること
	if (kyodakuData.kaisha_id != $userInfo.userCompanyDepartment.companyCd) {
		return;
	}
	$sairiyou_flg = true;
}

/**
 * 再利用
 */
function sairiyou(inputContents) {
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userCd = userContext.userProfile.userCd;
	var userName = userContext.userProfile.userName;
	// 組織情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var companyCd = userCompanyDepartment.companyCd;
	var companyName = userCompanyDepartment.companyName;
	var companyShortName = userCompanyDepartment.companyShortName;
	var departmentCd = userCompanyDepartment.departmentCd;
	var departmentName = userCompanyDepartment.departmentName;
	var departmentFullName = userCompanyDepartment.departmentFullName;

	var sysDate = new Date();

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		kyodaku_id : ""
	};
	
	var kyodakuId = inputContents.kyodaku_id;
	var kyodakuSql = "" ;
	kyodakuSql += "SELECT ";
	kyodakuSql += "  t.* ";
	kyodakuSql += "FROM ";
	kyodakuSql += "  lo_t_kyodaku AS t ";
	kyodakuSql += "WHERE ";
	kyodakuSql += "  t.sakujo_flg = '0' ";
	kyodakuSql += "  AND t.kyodaku_id = ? ";
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kyodakuId));

    // sql実行
    var db = new TenantDatabase();
    Transaction.begin(function() {
		var kyodakuResult = db.select(kyodakuSql,strParam);
		if (kyodakuResult.countRow === 0) {
			// TODO 再利用対象がなかった場合の対処
		}
		var kyodakuData = kyodakuResult.data[0];
		Logger.getLogger().info(' [sairiyou]　kyodakuData ' + ImJson.toJSONString(kyodakuData, true));
		
		// 許諾ID
		var newKyodakuId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KYODAKU);
		
		// 引き継がないプロパティを削除 
	    // TODO 要確認
	    if ('kyodaku_nm' in kyodakuData) {
		    delete kyodakuData.kyodaku_nm;
    	}
	    if ('shinsei_bi' in kyodakuData) {
		    delete kyodakuData.shinsei_bi;
    	}
	    if ('kakunin_bi' in kyodakuData) {
		    delete kyodakuData.kakunin_bi;
    	}
	    if ('bne_tantou_sha' in kyodakuData) {
		    delete kyodakuData.bne_tantou_sha;
    	}
	    
    	// 再利用データ設定
    	kyodakuData.kyodaku_id = newKyodakuId;
    	kyodakuData.kyodaku_status = Constant.LO_STATUS_ICHIJI_HOZON; //一時保存
    	kyodakuData.kaisha_id = companyCd;
		kyodakuData.kaisha_nm = companyName;
		kyodakuData.busyo_id = departmentCd;
		kyodakuData.busyo_nm = departmentName;
		kyodakuData.tantou_sha_id = userCd;
		kyodakuData.tantou_sha_nm = userName;
		
		// 契約種別を会社マスタから取得しなおす
		kyodakuData.keiyaku_cls = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeiyakuCls", kyodakuData.kaisha_id);

		kyodakuData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kyodakuData, true);
		
		Logger.getLogger().info(' [sairiyou]　lo_t_kyodaku ' + ImJson.toJSONString(kyodakuData, true));
		var kyodakuResult = db.insert('lo_t_kyodaku', kyodakuData);
		if (kyodakuResult.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E011');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		
		// 添付ファイル
		var tpSql = "" ;
		tpSql += "SELECT ";
		tpSql += "  ki.* ";
		tpSql += "FROM ";
		tpSql += "  lo_t_kyodaku_tempu_file AS ki ";
		tpSql += "WHERE ";
		tpSql += "  ki.sakujo_flg = '0' ";
		tpSql += "  AND ki.kyodaku_id = ?  ";
		var tpResult = db.select(tpSql,strParam);
		var kyodakuTempFileDatas = tpResult.data;
		for (var tpIndex in kyodakuTempFileDatas) {
			var kyodakuTempFileData = kyodakuTempFileDatas[tpIndex];
			kyodakuTempFileData.kyodaku_id = newKyodakuId;
			kyodakuTempFileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kyodakuTempFileData, true, kyodakuData.koushin_bi);
			kyodakuTempFileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", kyodakuTempFileData.file_path, newKyodakuId);
			
			var ktResult = db.insert('lo_t_kyodaku_tempu_file', kyodakuTempFileData);
			if (ktResult.error) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E011');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}
		
		// 企画紐付けデータ登録
		var himoSql = "";
		himoSql += "SELECT ";
		himoSql += "  h.* ";
		himoSql += "FROM ";
		himoSql += "  lo_t_kyodaku_kikaku_himozuke AS h ";
		himoSql += "WHERE ";
		himoSql += "  h.sakujo_flg = '0' ";
		himoSql += "  AND h.kyodaku_id = ?  ";
	    var himoResult = db.select(himoSql,strParam);
	    var himoDatas = himoResult.data;
	    for (var index in himoDatas) {
			Logger.getLogger().info(' [sairiyou]　index ' + index);
	    	var himoData = himoDatas[index];
	    	// 再利用データ設定
	    	himoData.kyodaku_id = newKyodakuId;
	    	himoData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", himoData, true, kyodakuData.koushin_bi);

			Logger.getLogger().info(' [sairiyou]　lo_t_kyodaku_kikaku_himozuke ' + ImJson.toJSONString(himoData, true));
			var himoResult = db.insert('lo_t_kyodaku_kikaku_himozuke', himoData);
			if (himoResult.error) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E011');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}
	    
		// 許諾申請データ登録
		var ksSql = "";
		ksSql += "SELECT ";
		ksSql += "  ks.* ";
		ksSql += "FROM ";
		ksSql += "  lo_t_kyodaku_shohin AS ks ";
		ksSql += "WHERE ";
		ksSql += "  ks.sakujo_flg = '0' ";
		ksSql += "  AND ks.kyodaku_id = ?  ";
	    var ksResult = db.select(ksSql,strParam);
	    var ksDatas = ksResult.data;
	    for (var index in ksDatas) {
			Logger.getLogger().info(' [sairiyou]　index ' + index);
	    	var ksData = ksDatas[index];
	    	var newEdaban = (Number(index) + 1);
	    	// 再利用データ設定
	    	ksData.kyodaku_id = newKyodakuId;
	    	ksData.kyodaku_edaban = newEdaban;
	    	ksData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", ksData, true, kyodakuData.koushin_bi);

			Logger.getLogger().info(' [sairiyou]　lo_t_kyodaku_shohin ' + ImJson.toJSONString(ksData, true));
			var ksResult = db.insert('lo_t_kyodaku_shohin', ksData);
			if (ksResult.error) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E011');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}
	    
		ret.kyodaku_id = newKyodakuId;
		ret.msg = MessageManager.getMessage('KY02I011');
	});
    
	return ret;
}

function getTsuchisaki(ticketId) {
	Constant.load('lo/common_libs/lo_const');
	var mailKey1 = 'mail_1';
	var mailKey3 = 'mail_3';
	var mailKey4 = 'mail_4';
	var mailKey5 = 'mail_5';
	var mailGroupList = {};
	mailGroupList[Constant.LO_MAIL_GROUP_KIAN] = mailKey1;
	mailGroupList[Constant.LO_MAIL_GROUP_END] = mailKey3;
	mailGroupList[Constant.LO_MAIL_GROUP_KEIYAKU] = mailKey4;
	mailGroupList[Constant.LO_MAIL_GROUP_KEIJOU] = mailKey5;
	$tsuchisakiObj = Content.executeFunction('lo/common_libs/lo_send_mail', 'getMailSettingUsers', ticketId, mailGroupList);
	
	var noUserObj = {user_cd : "", user_name : "---"};
	if (!$tsuchisakiObj[mailKey1] || $tsuchisakiObj[mailKey1].length == 0) {
		$tsuchisakiObj[mailKey1] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey3] || $tsuchisakiObj[mailKey3].length == 0) {
		$tsuchisakiObj[mailKey3] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey4] || $tsuchisakiObj[mailKey4].length == 0) {
		$tsuchisakiObj[mailKey4] = [noUserObj];
	}
	if (!$tsuchisakiObj[mailKey5] || $tsuchisakiObj[mailKey5].length == 0) {
		$tsuchisakiObj[mailKey5] = [noUserObj];
	}
	
}

function getNodeSettings(systemMatterId, cplFlg) {
	var noUserObj = {user_cd : "", user_name : "---"};
	var applyUser = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPLY, cplFlg);
	if (applyUser == null) {
		$keiro["apply"] = noUserObj;
	} else {
		 $keiro["apply"] = applyUser;
	}
	var app_0User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_0, cplFlg);
	if (app_0User == null) {
		$keiro["appr_0"] = noUserObj;
	} else {
		$keiro["appr_0"] = app_0User;
	}
	var app_1User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_1, cplFlg);
	if (app_1User == null) {
		$keiro["appr_1"] = noUserObj;
	} else {
		$keiro["appr_1"] = app_1User;
	}
	// ph4.2 契約担当ノード追加
	var keiyakuUser = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_KEIYAKU, cplFlg);
	if (keiyakuUser == null) {
		$keiro["keiyaku"] = noUserObj;
	} else {
		$keiro["keiyaku"] = keiyakuUser;
	}
	var app_2User = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_2, cplFlg);
	if (app_2User == null) {
		$keiro["appr_2"] = noUserObj;
	} else {
		$keiro["appr_2"] = app_2User;
	}
	var app_lastUser = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNodeUser",systemMatterId, Constant.LO_NODE_APPR_LAST, cplFlg);
	if (app_lastUser == null) {
		$keiro["appr_last"] = noUserObj;
	} else {
		$keiro["appr_last"] = app_lastUser;
	}
	// 現在実行中
	if (cplFlg) {
		$keiroCpl.apply = true;
		$keiroCpl.appr_0 = true;
		$keiroCpl.appr_1 = true;
		$keiroCpl.keiyaku = true;
		$keiroCpl.appr_2 = true;
		$keiroCpl.appr_last = true;
	} else {
		var condNoMatterProperty = new ListSearchConditionNoMatterProperty();
		var actvMatterNode = new ActvMatterNode("ja", systemMatterId);
		var excutableUserListObj = actvMatterNode.getExecutableUserList(condNoMatterProperty);
		if (excutableUserListObj.resultFlag && excutableUserListObj.data != null) {
			var excutableUserList = excutableUserListObj.data;
			if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_0) {
				$keiroCpl.apply = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_1) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_KEIYAKU) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
				$keiroCpl.appr_1 = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_2) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
				$keiroCpl.appr_1 = true;
				$keiroCpl.keiyaku = true;
			} else if (excutableUserList[0].nodeId == Constant.LO_NODE_APPR_LAST) {
				$keiroCpl.apply = true;
				$keiroCpl.appr_0 = true;
				$keiroCpl.appr_1 = true;
				$keiroCpl.keiyaku = true;
				$keiroCpl.appr_2 = true;
			}
		}
	}
}

