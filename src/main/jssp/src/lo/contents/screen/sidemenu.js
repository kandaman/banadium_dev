var $pubGrpLicenseeFlg = false;
var $pubBneFlg = false;
var $pubGrpProductionFlg = false;
var $pubGrpKeiyakuDraftEditFlg = false;
var $shanaiAccountManagementFlg = false; // 社内アカウント管理者フラグ

/**
 * 初期処理
 * 
 * @param {object} request リクエストデータ
 */
function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	$pubGrpLicenseeFlg =  Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_LICENSEE]);
	$pubBneFlg =  Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_BNE]);
	$pubGrpProductionFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_PRODUCTION]);
	if (!$pubGrpProductionFlg ) {
		$pubGrpProductionFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_HOMU]);
	}
	$pubGrpKeiyakuDraftEditFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_HOMU, Constant.LO_GROUP_APPR_0]);

	// 固定値マスタよ社内アカウント申請を利用可能なパブリックグループを取得する
	var $shanaiAccountAdminGroup = [];
	$shanaiAccountAdminGroup = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $shanaiAccountAdminGroup, Constant.LO_CDCLS_SHANAI_ACCOUNT_ADMIN_GROUP);
	
	$shanaiAccountManagementFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", $shanaiAccountAdminGroup);

}
