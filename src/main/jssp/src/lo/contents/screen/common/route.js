Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
    , kawariInputFlg : "0" // 代わり承認入力者フラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};
var $form = {
	registration_flg : true
}; // 画面表示用変数
var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $validationErrorMessages = [];
var $shohin_hansokubutsu_list = [];
var $shoshi_list = [];
var $hanbai_chiiki_list = [];
var $fileList =[];
var $filelistOnlyDisplay =[];

var $shanaiShuseiFlg = false; // 社内修正フラグ



var $viewCtrl = {}; //表示制御用オブジェクト

var $koukai_hani_list = []; //公開範囲コンボボックス

var	$nodeUserslist = {};
var	$nodeInfolist = {};
var $mailDefUsers = {}; //ノード一覧



/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　代わりWF編集画面表示 start');
	
	
	$nodeUserslist = request.route;	
	$nodeInfolist = request.node;	
	
}