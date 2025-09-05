var $userInfo = {
	userCd : ""
    , userName : ""
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
	, userCompanyDepartment : {
		companyCd : ""
		, companyName : ""
		, companyShortName : ""
		, departmentCd : ""
		, departmentName : ""
		, departmentFullName : ""
	}
};

var $doc_type_list = [{label:"", value: ""}];

var $kikakuNendoList = []; //年度コンボボックス(企画チャート)
var $kikakuOrgList = []; //組織コンボボックス(企画チャート)
var $kyodakuNendoList = []; //年度コンボボックス(許諾チャート)
var $kyodakuOrgList = []; //組織コンボボックス(許諾チャート)
var $uriageNendoList = []; //年度コンボボックス(売上チャート)
var $uriageOrgList = []; //組織コンボボックス(売上チャート)

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// ユーザ情報取得
	loadUserInfo();
	// チャート用フィルタデータ取得
	getChartFilterData();
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	$userInfo.userCd = userContext.userProfile.userCd;
	$userInfo.userName = userContext.userProfile.userName;

	// ライセンスプロダクションか判断
	$userInfo.licenseProductionFlg = (Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION) == true ? "1" : "0");
	
	// ユーザ会社情報取得
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	$userInfo.userCompanyDepartment = userCompanyDepartment;
	
}

/**
 * チャート用フィルタデータ取得
 */
function getChartFilterData() {

	// 企画年度取得
	// todo DBから取得する
    $kikakuNendoList = [];
    $kikakuNendoList.push({label:"",value:"",selected:true});
    
    $kikakuNendoList.push({label:"2021年度",value:"2021"});
    $kikakuNendoList.push({label:"2020年度",value:"2020"});
    $kikakuNendoList.push({label:"2019年度",value:"2019"});
    
    // 企画組織取得
	// todo DBから取得する
    $kikakuOrgList = [];
    $kikakuOrgList.push({label:"",value:"",selected:true});
    
    $kikakuOrgList.push({label:"NE",value:"NE"});
    $kikakuOrgList.push({label:"CE",value:"CE"});
    $kikakuOrgList.push({label:"LE",value:"LE"});
    $kikakuOrgList.push({label:"SP",value:"SP"});
    $kikakuOrgList.push({label:"ライツ",value:"ライツ"});
    $kikakuOrgList.push({label:"メディア",value:"メディア"});
    
    // 許諾年度取得
	// todo DBから取得する
    $kyodakuNendoList = [];
    $kyodakuNendoList.push({label:"",value:"",selected:true});
    
    $kyodakuNendoList.push({label:"2021年度",value:"2021"});
    $kyodakuNendoList.push({label:"2020年度",value:"2020"});
    $kyodakuNendoList.push({label:"2019年度",value:"2019"});
    
    // 許諾組織取得
	// todo DBから取得する
    $kyodakuOrgList = [];
    $kyodakuOrgList.push({label:"",value:"",selected:true});
    
    $kyodakuOrgList.push({label:"NE",value:"NE"});
    $kyodakuOrgList.push({label:"CE",value:"CE"});
    $kyodakuOrgList.push({label:"LE",value:"LE"});
    $kyodakuOrgList.push({label:"SP",value:"SP"});
    $kyodakuOrgList.push({label:"ライツ",value:"ライツ"});
    $kyodakuOrgList.push({label:"メディア",value:"メディア"});
    
    // 売上年度取得
	// todo DBから取得する
    $uriageNendoList = [];
    $uriageNendoList.push({label:"",value:"",selected:true});
    
    $uriageNendoList.push({label:"2021年度",value:"2021"});
    $uriageNendoList.push({label:"2020年度",value:"2020"});
    $uriageNendoList.push({label:"2019年度",value:"2019"});
    
    // 売上組織取得
	// todo DBから取得する
    $uriageOrgList = [];
    $uriageOrgList.push({label:"",value:"",selected:true});
    
    $uriageOrgList.push({label:"NE",value:"NE"});
    $uriageOrgList.push({label:"CE",value:"CE"});
    $uriageOrgList.push({label:"LE",value:"LE"});
    $uriageOrgList.push({label:"SP",value:"SP"});
    $uriageOrgList.push({label:"ライツ",value:"ライツ"});
    $uriageOrgList.push({label:"メディア",value:"メディア"});

}

/**
 * 企画チャート情報取得
 * @returns {object} 検索結果
 */
function getKikakuChartData() {
	
	// SQL生成
	var sql = "" ;
	sql += " SELECT";
	sql += "    CONCAT(TO_CHAR(t.shinsei_bi, 'YYYY'), TO_CHAR(t.shinsei_bi, 'MM'))::varchar(6) AS nengetu";
	sql += "  , CASE WHEN TO_CHAR(t.shinsei_bi, 'MM') in ('01','02','03')";
	sql += "        THEN (TO_CHAR(t.shinsei_bi, 'YYYY')::integer - 1)::varchar(4)";
	sql += "        ELSE TO_CHAR(t.shinsei_bi, 'YYYY')::varchar(4)";
	sql += "        END AS nendo";
	sql += "  , CONCAT(TO_CHAR(t.shinsei_bi, 'FMMM'),'月') AS getudo";
	sql += "  , t.busyo_nm";
	sql += "  , t.kikaku_status AS status";
	sql += " FROM";
	sql += "  lo_t_kikaku t";
	sql += " WHERE";
	sql += "  t.sakujo_flg = '0'";
	sql += " ORDER BY";
	sql += "  nengetu";
	
	// 入力パラメータ
    var strParam=[];
	
	// sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
}

/**
 * 許諾チャート情報取得
 * @returns {object} 検索結果
 */
function getKyodakuChartData() {
	
	// SQL生成
	var sql = "" ;
	sql += " SELECT";
	sql += "    CONCAT(LEFT(t.shinsei_bi, 4), SUBSTR(t.shinsei_bi, 5, 2))::varchar(6) AS nengetu";
	sql += "  , CASE WHEN SUBSTR(t.shinsei_bi, 5, 2) in ('01','02','03')";
	sql += "        THEN (LEFT(t.shinsei_bi, 4)::integer - 1)::varchar(4)";
	sql += "        ELSE LEFT(t.shinsei_bi, 4)::varchar(4)";
	sql += "        END AS nendo";
	sql += "  , CONCAT((SUBSTR(t.shinsei_bi, 5, 2)::integer - 1)::text,'月') AS getudo";
	sql += "  , t.busyo_nm";
	sql += "  , t.kyodaku_status AS status";
	sql += " FROM";
	sql += "  lo_t_kyodaku t";
	sql += " WHERE";
	sql += "  t.sakujo_flg = '0'";
	sql += "  and shinsei_bi ~ '[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])'";
	sql += " ORDER BY";
	sql += "  nengetu";
	
	// 入力パラメータ
    var strParam=[];
	
	// sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
}
