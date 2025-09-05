var $userInfo = {
		companyName : "",
		departmentName : "",
		userName : "",
		bneFlg : "0",
		lisenceProductionFlg : "0",
		loginMode: ""
};
var $fileList = {};
var $msgList = {};
// 【仮】ログイングループ表示
//var $public_group_disp = "";
//var $public_group_disp = "[仮表示中]　ログイン者は【権限のない方】です　※本来、当画面は参照できません";

/**
 * 初期処理
 * 
 * @param {object} request リクエストデータ
 */
function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	// 情シスユーザーか判断
	var johosystemFlg = Content.executeFunction(
			"lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_JOSYS]);
	var isBne = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_BNE]);
	var isProduction = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_PRODUCTION]);
	var isShohyo = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_SHOHYO]);
	var isKeijo = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_ACCOUNT]);
	var isKawariInputGrp = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_KAWARI_INPUT]);

	if (isBne) {
		$userInfo.bneFlg = "1";
	}
	if (isProduction) {
		$userInfo.lisenceProductionFlg = "1";
		$userInfo.loginMode = "BNE管理用";
		
	}else{
		$userInfo.loginMode = "ライセンシー様登録用";
	}
	if (isKawariInputGrp) {
		$userInfo.lisenceProductionFlg = "1";
		$userInfo.loginMode = "BNE管理用";
		
	}
	if (isShohyo) {
		$userInfo.lisenceProductionFlg = "1";
		$userInfo.loginMode = "BNE管理用";
		
	}
	if (isKeijo) {
		$userInfo.lisenceProductionFlg = "1";
		$userInfo.loginMode = "BNE管理用";
		
	}
	
	// 営業時間確認
	var outsideHourFlg = false;

	if(!johosystemFlg) {
		var outsideHoursList = Content.executeFunction("lo/common_libs/lo_common_fnction","checkOutsideHours");
		
		for(var i in outsideHoursList){
			var outsideHours = outsideHoursList[i];
			if (outsideHours.unblock_flg != "1") {
				if(outsideHours.kaishi > outsideHours.shuryo) {
					if((outsideHours.now >= outsideHours.kaishi || outsideHours.now < outsideHours.shuryo) || outsideHours.weekend_flg == "1") {
						outsideHourFlg = true;
						Content.executeFunction("lo/common_libs/lo_common_fnction","redirectToOutsideHours", outsideHours);
					}
				}else{
					if((outsideHours.now >= outsideHours.kaishi && outsideHours.now < outsideHours.shuryo) || outsideHours.weekend_flg == "1") {
						outsideHourFlg = true;
						Content.executeFunction("lo/common_libs/lo_common_fnction","redirectToOutsideHours", outsideHours);
					}
				}
			}
		}
	}
	
	if(!outsideHourFlg){
		// ログインユーザ情報の取得
		var userContext = Contexts.getUserContext();
		$userInfo.userName = userContext.userProfile.userName;
	
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		$userInfo.companyName = (userCompanyDepartment.companyName != null) ? userCompanyDepartment.companyName : "";
		$userInfo.departmentName = (userCompanyDepartment.departmentName != null) ? userCompanyDepartment.departmentName : "";
		
		var isProduction = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_PRODUCTION]);
	
		if (isProduction) {
			$userInfo.lisenceProductionFlg = "1";
		}
	
		// 【仮】ログイングループ表示
		/*var isLicensee = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_LICENSEE]);
		var isHomu = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_HOMU]);
		var isShohyo = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_SHOHYO]);
		var isAppr0 = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_APPR_0]);
		if (isProduction) {
			//$public_group_disp = "[仮表示中]　ログイン者は【ライセンスプロダクション】です";
			$public_group_disp = MessageManager.getMessage("LO.MSG.LOGINGROUP.PRODUCTION");
		} else if (isLicensee) {
			//$public_group_disp = "[仮表示中]　ログイン者は【ライセンシー】です";
			$public_group_disp = MessageManager.getMessage("LO.MSG.LOGINGROUP.LICENSEE");
		} else if (isHomu) {
			$public_group_disp = "[仮表示中]　ログイン者は【法務権限者】です";
		} else if (isShohyo) {
			$public_group_disp = "[仮表示中]　ログイン者は【商標調査者】です";
		} else if (isAppr0) {
			$public_group_disp = "[仮表示中]　ログイン者は【BNE担当者】です";
		}else{
			$public_group_disp = MessageManager.getMessage("LO.MSG.LOGINGROUP.NOT");
		}*/
		// 【仮】ログイングループ表示
	}
	
	//固定値マスタからファイル一覧を取得
	var fileInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadFileInfo", Constant.LO_FILE_ID_GAIYO);
	//BANADIUM概要のファイル名を設定
	$fileList.gaiyo = fileInfo;
	$fileList.gaiyo.file_path = $fileList.gaiyo.file_path.trim();
	
	fileInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadFileInfo", Constant.LO_FILE_ID_MANUAL_SHANAI);
	$fileList.manual_shanai = fileInfo;
	$fileList.manual_shanai.file_path = $fileList.manual_shanai.file_path.trim();
	
	fileInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadFileInfo", Constant.LO_FILE_ID_KIHON_RULE);
	$fileList.kihon_rule = fileInfo;
	$fileList.kihon_rule.file_path = $fileList.kihon_rule.file_path.trim();
	
	var otherMsg = {};
	otherMsg = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue", otherMsg, Constant.LO_CDCLS_OTHER_MESSAGE);
	//Logger.getLogger().info(' [init]　otherMsg ' + ImJson.toJSONString(otherMsg, true));
	$msgList.systemMsg = otherMsg["1"];
	
}
