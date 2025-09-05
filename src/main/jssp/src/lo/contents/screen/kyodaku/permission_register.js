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
var $form = {
	registration_flg : true
}; // 画面表示用変数
var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $validationErrorMessages = [];
var $kyodaku_data = {};
var $kyodaku_cls_list = []; //許諾種別コンボボックス
var $shohin_hansokubutsu_list = [];
var $shoshi_list = [];
var $hanbai_chiiki_list = [];
var $fileList =[];
var $filelistOnlyDisplay =[];
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $tmpFileStr = ""; //添付ファイルメッセージ
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $kyodakuShinseiMax = 0; //許諾申請上限
var $shanaiShuseiFlg = false; // 社内修正フラグ
var $titleNoExists = "";

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　許諾編集画面表示');

	// ユーザー情報読み込み
	loadUserInfo();

	// マスタから初期表示用情報を取得
	getSelectableValue(request);

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	// 固定値マスタより商品仕様上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_KYODAKU_SHINSEI_MAX);
	$kyodakuShinseiMax = $tmpList[0];
	
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
    $extstr = MessageManager.getMessage('KY02I013', $extstr);
    $tmpFileStr = MessageManager.getMessage('KY02I014');
    
    $titleNoExists = MessageManager.getMessage('KY02E050', $titleNoExists);
	
	// セッション削除
	Client.remove('before_apply_id');

	if ('kyodaku_id' in request){

		var kyodakuResult = Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveKyodakuData", request.kyodaku_id);
		$kyodaku_data = kyodakuResult.data[0]; // 一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kyodaku_data);
		
		// 編集可能チェック
		if(!chkEditable($kyodaku_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		var tempuFileResult = Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveTempuFileList", request.kyodaku_id);
		$fileList = tempuFileResult.data; // 全行取得

		if ($shanaiShuseiFlg) {
			// 社内修正の場合は表示のみように別途確保する
			$filelistOnlyDisplay = tempuFileResult.data; // 全行取得
		}

		$kyodaku_data.registration_flg = false;
		
		// 案件情報の取得
		if ($kyodaku_data.kyodaku_status == Constant.LO_STATUS_SHUSEI_IRAI && $userInfo.licenseeFlg == '1') {
			if (!setMatterInfo($kyodaku_data)){
				// ない場合は新規でセット
				// ワークフローパラメータの設定
				setWorkflowOpenPage($kyodaku_data);
			}
			if (!$proc_user_flg) {
				PageManager.redirect("/lo/contents/screen/kyodaku/permission_product_detail", "GET", {kyodaku_id: request.kyodaku_id});
			}
		}
		
		// 一時保存・修正依頼の場合は、マスタから会社名を再取得する
		if (($kyodaku_data.kyodaku_status == Constant.LO_STATUS_ICHIJI_HOZON || $kyodaku_data.kyodaku_status == Constant.LO_STATUS_SHUSEI_IRAI)
				&& $userInfo.licenseeFlg == '1') {
			$kyodaku_data.kaisha_nm = $userInfo.userCompanyDepartment.companyName;
			$kyodaku_data.kaisha_nm = $userInfo.userCompanyDepartment.companyName;
		}
		

	} else {
		
		// ライセンシー以外は表示させない
		if ($userInfo.licenseeFlg == '0') {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}

		$kyodaku_data.kyodaku_id = '';
		//$kyodaku_data.kyodaku_status = '1'; // TODO ステータスを定数化
		$kyodaku_data.kaisha_id = $userInfo.userCompanyDepartment.companyCd;
		$kyodaku_data.kaisha_nm = $userInfo.userCompanyDepartment.companyName;
		$kyodaku_data.kyodaku_cls = '1';
		//新規登録の場合は、会社マスタから契約種別を取得する
		$kyodaku_data.keiyaku_cls = getKaishaKeiyakuCls($userInfo.userCompanyDepartment.companyCd);
		$kyodaku_data.registration_flg = true;

	}

	Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", $kyodaku_cls_list, $kyodaku_data.kyodaku_cls);

	// 申請日に値がない場合は、システム日付を設定
	if ($kyodaku_data.shinsei_bi == null) {
		var dt = new Date();
		$kyodaku_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', dt);
		// 最低保証支払期限も設定
		$kyodaku_data.saiteihosho_kigen = DateTimeFormatter.format('yyyy/MM/dd', new Date(dt.getFullYear(), dt.getMonth() + 2, 0));
	}
	
	var filterKikakuStatusList = [
	    Constant.LO_STATUS_TEISHUTSU,
	    Constant.LO_STATUS_SHUSEI_IRAI,
	    Constant.LO_STATUS_SHINSEI,
	    Constant.LO_STATUS_SASHIMODOSHI,
	    Constant.LO_STATUS_SHONIN,
        Constant.LO_STATUS_SHONIN_OK,
	    Constant.LO_STATUS_KANRYO
	];
	$form.kikaku_restraint_values = ImJson.toJSONString({kikaku_status : filterKikakuStatusList}, false);
	
	var keiyakuClsList = [];
    //keiyakuClsList.push({label:"",value:"",selected:true});
    keiyakuClsList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", keiyakuClsList, Constant.LO_CDCLS_KEIYAKU_CLS);
    $form.keiyaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "selectedList", keiyakuClsList, $kyodaku_data.keiyaku_cls, Constant.LO_CDCLS_KEIYAKU_CLS);
    
	Logger.getLogger().info(' [init]　許諾編集画面表示 $kyodaku_data ' + ImJson.toJSONString($kyodaku_data, true));
	
}

/**
 * 社内修正であるかチェック
 */
function chkShanaiShusei(kyodakuStatus) {
	// BNE担当グループに所属しているかを確認
	var bneTantoShozokuFlg = Content.executeFunction( "lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_APPR_0);
	if (bneTantoShozokuFlg) {
		if (kyodakuStatus == Constant.LO_STATUS_TEISHUTSU || kyodakuStatus == Constant.LO_STATUS_SASHIMODOSHI) {
			// 提出済　または　差戻し
			return true;
		}
	}
	return false;
}

/**
 * 編集可能かチェック
 */
function chkEditable(data) {
	// ライセンシーグループに所属しているかを確認
	var licenseeShozokuFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE);
	// BNE担当グループに所属しているかを確認
	var bneTantoShozokuFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_APPR_0);

	// ステータスチェック（編集可能なステータスかどうか）
	if (licenseeShozokuFlg) {
		if (data.kyodaku_status != Constant.LO_STATUS_ICHIJI_HOZON &&
				data.kyodaku_status != Constant.LO_STATUS_SHUSEI_IRAI) {
			// 一時保存か修正依頼のみOK
			return false;
		}
		// 会社チェック（編集可能な所属グループかどうか）
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (data.kaisha_id != kaisha_id) {
			return false;
		}
	} else if (chkShanaiShusei(data.kyodaku_status)) {
		$shanaiShuseiFlg = true;
	} else {
		// 上記のグループに所属していない場合
		return false;
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
	}else if ('kikaku_id' in request){
		return Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKikakuData", request.kikaku_id);
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

function getSelectableValue(request) {

	$shohin_hansokubutsu_list = [];
	$shohin_hansokubutsu_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shohin_hansokubutsu_list, Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU);
	
	$shoshi_list = [];
    $shoshi_list.push({label:"",value:"",selected:true});
    $shoshi_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoshi_list, Constant.LO_CDCLS_SHOSHI);
    
    $hanbai_chiiki_list = [];
    $hanbai_chiiki_list.push({label:"",value:"",selected:true});
    $hanbai_chiiki_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hanbai_chiiki_list, Constant.LO_CDCLS_HANBAI_CHIIKI);

	// 固定値マスタより許諾種別取得
    $kyodaku_cls_list = [];
    $kyodaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $kyodaku_cls_list, Constant.LO_CDCLS_KYODAKU_CLS);
	
}


function getKaishaKeiyakuCls(companyCd) {

	Logger.getLogger().info(' [getKaishaKeiyakuCls]　companyCd ' + companyCd);

	var sql = "" ;
	sql += "SELECT ";
	sql += "  ka.keiyaku_cls ";
	sql += "FROM ";
	sql += "  lo_m_kaisha AS ka ";
	sql += "WHERE " ; 
	sql += "  ka.sakujo_flg ='0' ";
	sql += "  AND ka.kaisha_id = ? ";
	
	
    var db = new TenantDatabase();
    var result = db.select(sql, [DbParameter.string(companyCd)], 0);
    if (result.countRow == 0) {
		return "";
	}

	return result.data[0].keiyaku_cls;
}

/**
 * コメント用テキストを取得する
 */
function getCommentText(attachVal, columVal){
	var lineBreakChar = "\r\n";
	if (columVal == null) {
		return attachVal + lineBreakChar;
	}
	return attachVal + columVal + lineBreakChar;
}

function updateKyodaku(request, shinseiFlg, moto_kyodaku_id) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ユーザー情報読み込み
	loadUserInfo();
	var sysDate = new Date();
	
	var logicalDeleteArg = {sakujo_flg : "1"};
	logicalDeleteArg = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", logicalDeleteArg, false);

	var isShanaiShusei = chkShanaiShusei(request.kyodaku_status);
	var shuseiKomokuChar = "修正項目：";
	var shuseiMaeChar = "[ 修正前 ]：\r\n";
	var shuseiGoChar =  "[ 修正後 ]：\r\n";
	var lineBreakChar = "\r\n";
	var autoSabunCommentObj = {kyodakuInfo : [], shohinInfo : []};

	var kyodakuId;
	var functionResult = {
	    error: false,
		kyodaku_id: "",
		message: MessageManager.getMessage('KY02I012')
	};
	// DB接続
	var db = new TenantDatabase();
	Transaction.begin(function() {
		if ('kyodaku_data' in request){
			var data = request.kyodaku_data;
			var upObject = {};
			// 社内修正の場合は一部しか登録しない
			if (!isShanaiShusei) {
				upObject.kyodaku_nm = data.kyodaku_nm;
				upObject.kyodaku_cls = data.kyodaku_cls;
				upObject.keiyaku_cls = data.keiyaku_cls;
				upObject.tantou_sha_id = $userInfo.userCd;
				upObject.tantou_sha_nm = $userInfo.userName;
				upObject.kakunin_bi = data.kakunin_bi;
				upObject.bne_tantou_sha = data.bne_tantou_sha;
				
				upObject.kaisha_id = $userInfo.userCompanyDepartment.companyCd;
         		upObject.kaisha_nm = $userInfo.userCompanyDepartment.companyName;
         		upObject.busyo_id = $userInfo.userCompanyDepartment.departmentCd;
         		upObject.busyo_nm = $userInfo.userCompanyDepartment.departmentName;
			}
			upObject.kyodaku_kikan_from = data.kyodaku_kikan_from;
			upObject.kyodaku_kikan_to = data.kyodaku_kikan_to;
			upObject.saiteihosho_kigen = data.saiteihosho_kigen;
			upObject.sozai_biko = data.sozai_biko;
			upObject.biko = data.biko;
			upObject.sozai_hi = data.sozai_hi;
			upObject.kyodaku_chiiki = data.kyodaku_chiiki;
			upObject.seikyusho_sofusaki_id = data.seikyusho_sofusaki_id;
			
            kyodakuId = data.kyodaku_id;
			Logger.getLogger().debug(' [updateKyodaku]　kyodakuId ' + kyodakuId);
			if (!kyodakuId) {
				// 登録
				Logger.getLogger().info(' [updateKyodaku]　!kyodakuId ');
				kyodakuId = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KYODAKU);
				upObject.kyodaku_id = kyodakuId;				
				upObject.kyodaku_status = Constant.LO_STATUS_ICHIJI_HOZON;
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
				Logger.getLogger().debug(' [updateKyodaku]　insertKyodakuData ' + ImJson.toJSONString(upObject, true));
				db.insert('lo_t_kyodaku', upObject);
				functionResult.kyodaku_id = kyodakuId;
				
			} else {
				// 社内修正の場合に自動コメントを出力するため、差分を確認する
				if (isShanaiShusei) {
					var tempObj = {};
					tempObj.kyodaku_id = kyodakuId;
					var resultObj = retrieveKyodakuData(tempObj);
					if (resultObj.data[0]) {
						var beforeData = resultObj.data[0];
						var tempComment = "";
						// 素材費
						if (beforeData.sozai_hi != upObject.sozai_hi) {
							tempComment = tempComment + shuseiKomokuChar + "許諾情報　素材費" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + getCommentText(shuseiMaeChar, beforeData.sozai_hi);
							tempComment = tempComment + getCommentText(shuseiGoChar, upObject.sozai_hi);
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
						// 許諾期間
						if (beforeData.kyodaku_kikan_from != upObject.kyodaku_kikan_from ||
								beforeData.kyodaku_kikan_to != upObject.kyodaku_kikan_to) {
							tempComment = tempComment + shuseiKomokuChar + "許諾情報　許諾期間" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + shuseiMaeChar + beforeData.kyodaku_kikan_from + "　～　" + beforeData.kyodaku_kikan_to + lineBreakChar;
							tempComment = tempComment + shuseiGoChar + upObject.kyodaku_kikan_from + "　～　" + upObject.kyodaku_kikan_to + lineBreakChar;
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
						// 最低保証料支払い期限
						if (beforeData.saiteihosho_kigen != upObject.saiteihosho_kigen) {
							tempComment = tempComment + shuseiKomokuChar + "許諾情報　最低保証料支払い期限" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + getCommentText(shuseiMaeChar, beforeData.saiteihosho_kigen);
							tempComment = tempComment + getCommentText(shuseiGoChar, upObject.saiteihosho_kigen);
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
						// 許諾地域
						if (beforeData.kyodaku_chiiki != upObject.kyodaku_chiiki) {
							tempComment = tempComment + shuseiKomokuChar + "海外販売の国名及び数量　許諾地域" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + getCommentText(shuseiMaeChar, beforeData.kyodaku_chiiki);
							tempComment = tempComment + getCommentText(shuseiGoChar, upObject.kyodaku_chiiki);
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
						// 備考　詳細
						if (beforeData.biko != upObject.biko) {
							tempComment = tempComment + shuseiKomokuChar + "備考　詳細" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + getCommentText(shuseiMaeChar, beforeData.biko);
							tempComment = tempComment + getCommentText(shuseiGoChar, upObject.biko);
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
						// 資料・素材費の提供　詳細
						if (beforeData.sozai_biko != upObject.sozai_biko) {
							tempComment = tempComment + shuseiKomokuChar + "資料・素材費の提供　詳細" + lineBreakChar + lineBreakChar;
							tempComment = tempComment + getCommentText(shuseiMaeChar, beforeData.sozai_biko);
							tempComment = tempComment + getCommentText(shuseiGoChar, upObject.sozai_biko);
							autoSabunCommentObj.kyodakuInfo.push(new String(tempComment + lineBreakChar));
							tempComment = "";
						}
					}
					
				}

				// 更新
				upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				functionResult.kyodaku_id = kyodakuId;
				Logger.getLogger().info(' [updateKyodaku]　updateKyodakuData ' + ImJson.toJSONString(upObject, true));
				Logger.getLogger().info(' [updateKyodaku]　updateKyodakuData key ' + kyodakuId + ', ' + data.koushin_bi);
	         	var result = db.update('lo_t_kyodaku', upObject, "kyodaku_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",[DbParameter.string(kyodakuId), DbParameter.string(data.koushin_bi)]);
				if (result.countRow == 0) {
					// 排他エラー処理
					Logger.getLogger().error(' [updateKyodaku] 排他エラー　updateKyodakuData key ' + kyodakuId + ', ' + data.koushin_bi);
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E004');
					return;
				}
			}
		}

		if ('shohin_list' in request) {
			var beforeObjList;
			var shohinHansokubutsuList = [];
			var shoshiList = [];
			var hanbaiChiikiList = [];
			if (isShanaiShusei) {
				var tempObj = {};
				tempObj.kyodaku_id = kyodakuId;
				var resultObj = retrieveShohinList(tempObj);
				if (resultObj.countRow > 0) {
					beforeObjList = resultObj.data;
				}
				shohinHansokubutsuList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shohin_hansokubutsu_list, Constant.LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU);
				shoshiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $shoshi_list, Constant.LO_CDCLS_SHOSHI);
				hanbaiChiikiList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $hanbai_chiiki_list, Constant.LO_CDCLS_HANBAI_CHIIKI);
			}

			var list = request.shohin_list;
			var maxKyodakuEdaban = 0;
			for (var key in list) {
				var data = list[key];
				var upObject =  {
					shohin_hansokubutsu_hanbetsu : data.shohin_hansokubutsu_hanbetsu
					, shohin_mei : data.shohin_mei
					, hatsubai_bi : new Date(data.hatsubai_bi)
					, zeinuki_jodai : data.zeinuki_jodai
					, ryoritsu : data.ryoritsu
					, siyoryo : data.siyoryo
					, saiteihosho_su_shinseisu : data.saiteihosho_su_shinseisu
					, saiteihosho_su_kyodakuryo : data.saiteihosho_su_kyodakuryo
					, shoshi : data.shoshi
					, mihon_suryo : data.mihon_suryo
					, hanbai_chiiki : data.hanbai_chiiki
					, sakujo_flg : "0"
			    };

				// 社内修正の場合に自動コメントを出力するため、差分を確認する
				if (isShanaiShusei) {
					for (var idx = 0; idx < beforeObjList.length; idx++) {
						var beforeObj = beforeObjList[idx];
						var shohinCommentObj = [];
						var tempComment = "";
						if (beforeObj.kyodaku_edaban == data.kyodaku_edaban) {

							// 商品／販促物
							if (beforeObj.shohin_hansokubutsu_hanbetsu != upObject.shohin_hansokubutsu_hanbetsu) {
								tempComment = tempComment + shuseiKomokuChar + "商品／販促物" + lineBreakChar + lineBreakChar;
								for (var idxHanbetsu = 0; idxHanbetsu < shohinHansokubutsuList.length; idxHanbetsu++) {
									if (shohinHansokubutsuList[idxHanbetsu].value == beforeObj.shohin_hansokubutsu_hanbetsu) {
										tempComment = tempComment + shuseiMaeChar + shohinHansokubutsuList[idxHanbetsu].label + lineBreakChar;
										break;
									}
								}
								for (var idxHanbetsu = 0; idxHanbetsu < shohinHansokubutsuList.length; idxHanbetsu++) {
									if (shohinHansokubutsuList[idxHanbetsu].value == upObject.shohin_hansokubutsu_hanbetsu) {
										tempComment = tempComment + shuseiGoChar + shohinHansokubutsuList[idxHanbetsu].label + lineBreakChar;
										break;
									}
								}
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 商品名
							if (beforeObj.shohin_mei != upObject.shohin_mei) {
								tempComment = tempComment + shuseiKomokuChar + "商品名" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.shohin_mei);
								tempComment = tempComment + getCommentText(shuseiGoChar, upObject.shohin_mei);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 発売日
							if (beforeObj.hatsubai_bi != data.hatsubai_bi) {
								tempComment = tempComment + shuseiKomokuChar + "発売日" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.hatsubai_bi);
								tempComment = tempComment + getCommentText(shuseiGoChar, data.hatsubai_bi);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 上代(税抜)
							if (beforeObj.zeinuki_jodai != upObject.zeinuki_jodai) {
								tempComment = tempComment + shuseiKomokuChar + "上代(税抜)" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.zeinuki_jodai);
								tempComment = tempComment + getCommentText(shuseiGoChar, upObject.zeinuki_jodai);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 料率
							if (beforeObj.ryoritsu != upObject.ryoritsu) {
								tempComment = tempComment + shuseiKomokuChar + "料率" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.ryoritsu);
								tempComment = tempComment + getCommentText(shuseiGoChar, upObject.ryoritsu);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 最低保証数(申請数)
							if (beforeObj.saiteihosho_su_shinseisu != upObject.saiteihosho_su_shinseisu) {
								tempComment = tempComment + shuseiKomokuChar + "最低保証数(申請数)" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.saiteihosho_su_shinseisu);
								tempComment = tempComment + getCommentText(shuseiGoChar, upObject.saiteihosho_su_shinseisu);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 証紙
							if (beforeObj.shoshi != upObject.shoshi) {
								tempComment = tempComment + shuseiKomokuChar + "証紙" + lineBreakChar + lineBreakChar;
								for (var idxShoshi = 0; idxShoshi < shoshiList.length; idxShoshi++) {
									if (shoshiList[idxShoshi].value == beforeObj.shoshi) {
										tempComment = tempComment + shuseiMaeChar + shoshiList[idxShoshi].label + lineBreakChar;
										break;
									}
								}
								for (var idxShoshi = 0; idxShoshi < shoshiList.length; idxShoshi++) {
									if (shoshiList[idxShoshi].value == upObject.shoshi) {
										tempComment = tempComment + shuseiGoChar + shoshiList[idxShoshi].label + lineBreakChar;
										break;
									}
								}
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 見本数量
							if (beforeObj.mihon_suryo != upObject.mihon_suryo) {
								tempComment = tempComment + shuseiKomokuChar + "見本数量" + lineBreakChar + lineBreakChar;
								tempComment = tempComment + getCommentText(shuseiMaeChar, beforeObj.mihon_suryo);
								tempComment = tempComment + getCommentText(shuseiGoChar, upObject.mihon_suryo);
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 販売地域
							if (beforeObj.hanbai_chiiki != upObject.hanbai_chiiki) {
								tempComment = tempComment + shuseiKomokuChar + "証紙" + lineBreakChar + lineBreakChar;
								if (beforeObj.hanbai_chiiki != null) {
									for (var idxHabaiChiiki = 0; idxHabaiChiiki < hanbaiChiikiList.length; idxHabaiChiiki++) {
										if (hanbaiChiikiList[idxHabaiChiiki].value == beforeObj.hanbai_chiiki) {
											tempComment = tempComment + shuseiMaeChar + hanbaiChiikiList[idxHabaiChiiki].label + lineBreakChar;
											break;
										}
									}
								} else {
									tempComment = tempComment + shuseiMaeChar + lineBreakChar;
								}
								if (upObject.hanbai_chiiki != null) {
									for (var idxHabaiChiiki = 0; idxHabaiChiiki < hanbaiChiikiList.length; idxHabaiChiiki++) {
										if (hanbaiChiikiList[idxHabaiChiiki].value == upObject.hanbai_chiiki) {
											tempComment = tempComment + shuseiGoChar + hanbaiChiikiList[idxHabaiChiiki].label + lineBreakChar;
											break;
										}
									}
								} else {
									tempComment = tempComment + shuseiGoChar + lineBreakChar;
								}
								shohinCommentObj.push(new String(tempComment + lineBreakChar));
								tempComment = "";
							}
							// 枝番
							if (shohinCommentObj.length > 0) {
								shohinCommentObj.unshift("許諾申請一覧 #" + data.kyodaku_edaban + lineBreakChar + lineBreakChar);
								var shohinComment = "";
								for (var idxShohin = 0; idxShohin < shohinCommentObj.length; idxShohin++) {
									shohinComment = shohinComment + shohinCommentObj[idxShohin];
								}
								autoSabunCommentObj.shohinInfo.push(new String(shohinComment));
							}
						}
					}
				}
				
			    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				Logger.getLogger().debug(' [updateKyodaku]　updateShohinData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_kyodaku_shohin', upObject, "kyodaku_id = ? AND kyodaku_edaban = ?",[DbParameter.string(kyodakuId), DbParameter.number(data.kyodaku_edaban)]);
				if (result.countRow == 0) {
					upObject.kyodaku_id = kyodakuId;
					upObject.kyodaku_edaban = data.kyodaku_edaban;
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().debug(' [updateKyodaku]　insertShohinData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_kyodaku_shohin', upObject);
				}
				if (data.kyodaku_edaban > maxKyodakuEdaban) {
					maxKyodakuEdaban = data.kyodaku_edaban;
				}
			}
			var result = db.update ('lo_t_kyodaku_shohin', logicalDeleteArg, "kyodaku_id = ? AND kyodaku_edaban > ?" ,[DbParameter.string(kyodakuId), DbParameter.number(maxKyodakuEdaban)]);
		}

		// 社内修正の場合に自動コメントを出力する
		if (isShanaiShusei) {
			if(autoSabunCommentObj.kyodakuInfo.length > 0 || autoSabunCommentObj.shohinInfo.length > 0) {
				var autoSabunComment = '【ライセンスプロダクション修正箇所】' + lineBreakChar + lineBreakChar;
				var shohinInfoCommentList = autoSabunCommentObj.shohinInfo;
				if (shohinInfoCommentList) {
					for (var idx = 0; idx < shohinInfoCommentList.length; idx++) {
						autoSabunComment = autoSabunComment + shohinInfoCommentList[idx];
					}
				}
				var kyodakuInfoCommentList = autoSabunCommentObj.kyodakuInfo;
				if (kyodakuInfoCommentList) {
					for (var idx = 0; idx < kyodakuInfoCommentList.length; idx++) {
						autoSabunComment = autoSabunComment + kyodakuInfoCommentList[idx];
					}
				}
				
				var resultComemnt = Content.executeFunction("lo/common_libs/lo_common_fnction", "insertComment", kyodakuId, autoSabunComment, Constant.LO_COMMENT_STATUS, [], null, null, null, Constant.LO_NAME_NODE_APPR_0, "社内修正");
				
				if (resultComemnt.error) {
					Transaction.rollback();
					functionResult.error = true;
					functionResult.message = MessageManager.getMessage('ER01E011');
					return;
				}
			}
		}

		// 社内修正でなければ登録する
		if (!isShanaiShusei) {
			if ('kikaku_list' in request) {
				var list = request.kikaku_list;
				var existsKikakuIds = [];
				for (var key in list) {
					var data = list[key];
					// 登録可能チェック
					if(!chkKikakuData(data.kikaku_id, isShanaiShusei)) {
						Logger.getLogger().error(' [updateKyodaku] 企画登録不可エラー　updateKyodakuData key ' + kyodakuId + ', kikaku_id:' + data.kikaku_id);
						Transaction.rollback();
						functionResult.error = true;
						functionResult.message = MessageManager.getMessage('KY02E042');
						return;
					}
					
					var upObject = {sakujo_flg : "0"};
				    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
					Logger.getLogger().info(' [updateKyodaku]　updateKikakuData ' + ImJson.toJSONString(upObject, true));
					var result = db.update('lo_t_kyodaku_kikaku_himozuke', upObject, "kyodaku_id = ? AND kikaku_id = ?",[DbParameter.string(kyodakuId), DbParameter.string(data.kikaku_id)]);
					if (result.countRow == 0) {
						upObject.kyodaku_id = kyodakuId;
						upObject.kikaku_id = data.kikaku_id;
						upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
						Logger.getLogger().info(' [updateKyodaku]　insertKikakuData ' + ImJson.toJSONString(upObject, true));
						db.insert('lo_t_kyodaku_kikaku_himozuke', upObject);
					}
					existsKikakuIds.push(data.kikaku_id);
				}
				var deleteCondition = "kyodaku_id = ? ";
				var deleteParams = [];
				deleteParams.push(DbParameter.string(kyodakuId));
				if (existsKikakuIds.length > 0) {
					deleteCondition = deleteCondition + "AND kikaku_id NOT IN (";
					for (var key in existsKikakuIds) {
						if (key > 0) {
							deleteCondition = deleteCondition + ", ";
						}
						deleteCondition = deleteCondition + "?";
						deleteParams.push(DbParameter.string(existsKikakuIds[key]));
					}
					deleteCondition = deleteCondition + ")";
				}
				var result = db.update ('lo_t_kyodaku_kikaku_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
			}
	
			if ('tempu_file_list' in request) {
				var tempuFileResult = Content.executeFunction("lo/contents/screen/kyodaku/permission_data_retriever", "retrieveTempuFileList", request.kyodaku_id);
				var publicFilePaths = [];
				for (var idx = 0; idx < tempuFileResult.data.length; idx++) {
					publicFilePaths.push(tempuFileResult.data[idx].file_path);
				}
				var list = request.tempu_file_list;
				var paramFilePaths = [];
				var maxFileNo = 0;
				for (var key in list) {
					var data = list[key];
					var fileName = data.file_path.split("/").reverse()[0];
					paramFilePaths.push(data.file_path);
					var upObject =  {
						file_name : data.file_name
						, file_path : kyodakuId + "/" + fileName
						, sakujo_flg : "0"
				    };
				    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
					Logger.getLogger().debug(' [updateKyodaku]　updateTempFileData ' + ImJson.toJSONString(upObject, true));
					var result = db.update('lo_t_kyodaku_tempu_file', upObject, "kyodaku_id = ? AND file_no = ?",[DbParameter.string(kyodakuId), DbParameter.number(data.file_no)]);
					if (result.countRow == 0) {
						upObject.kyodaku_id = kyodakuId;
						upObject.file_no = data.file_no;
						upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
						Logger.getLogger().debug(' [updateKyodaku]　insertTempFileData ' + ImJson.toJSONString(upObject, true));
						db.insert('lo_t_kyodaku_tempu_file', upObject);
					}
					if (data.file_no > maxFileNo) {
						maxFileNo = data.file_no;
					}
				}
				var result = db.update ('lo_t_kyodaku_tempu_file', logicalDeleteArg, "kyodaku_id = ? AND file_no > ?" ,[DbParameter.string(kyodakuId), DbParameter.number(maxFileNo)]);
	
				// 新規にアップロードされたファイルをセッションストレージからパブリックストレージへ
				var newFilePaths = paramFilePaths.filter(function(paramFilePath) {
					return publicFilePaths.indexOf(paramFilePath) == -1;
				});
				for (var key in newFilePaths) {
					var newFilePath = newFilePaths[key];
					var sessionFile = Constant.LO_PATH_SESSION_STORAGE + newFilePath;
					var sessionStorage = new SessionScopeStorage(sessionFile);
	
					// セッションストレージにファイルが無ければエラー
					if (sessionStorage.isFile()) {
						// パブリックストレージ取得
						var dir = Constant.LO_PATH_PUBLIC_STORAGE;
						var subDir = kyodakuId + "/";
						var publicDir = new PublicStorage(dir + subDir);
						if (!publicDir.isDirectory()) {
							// ディレクトリが存在しなければ作成
							publicDir.makeDirectories();
						}
		
						// パブリックストレージにコピー
						var publicStrageFile = dir + subDir + newFilePath;
						var publicStorage = new PublicStorage(publicStrageFile);
						sessionStorage.copy(publicStorage, true);
					}
				}
				var deleteFilePaths = publicFilePaths.filter(function(paramFilePath) {
					return paramFilePaths.indexOf(paramFilePath) == -1;
				});
	
			}
	
			if ('moto_kyodaku_list' in request) {
				var list = request.moto_kyodaku_list;
				var existsDatas = [];
				for (var key in list) {
					var data = list[key];
					var upObject =  {
						moto_kyodaku_id : data.moto_kyodaku_id
						, sakujo_flg : "0"
				    };
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
					Logger.getLogger().info(' [updateKyodaku]　updateMotoKyodaku ' + ImJson.toJSONString(upObject, true));
					var result = db.update('lo_t_moto_kyodaku_himozuke', upObject, "kyodaku_id = ?",[DbParameter.string(kyodakuId)]);
					if (result.countRow == 0) {
						upObject.kyodaku_id = kyodakuId;
						upObject.moto_kyodaku_id = data.moto_kyodaku_id;
						upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
						Logger.getLogger().info(' [updateKyodaku]　insertMotoKyodaku ' + ImJson.toJSONString(upObject, true));
						db.insert('lo_t_moto_kyodaku_himozuke', upObject);
					}
					existsDatas.push(data.moto_kyodaku_id);
				}
				var deleteCondition = "kyodaku_id = ? ";
				var deleteParams = [];
				deleteParams.push(DbParameter.string(kyodakuId));
				if (existsDatas.length > 0) {
					deleteCondition = deleteCondition + "AND moto_kyodaku_id NOT IN (";
					for (var key in existsDatas) {
						if (key > 0) {
							deleteCondition = deleteCondition + ", ";
						}
						deleteCondition = deleteCondition + "?";
						deleteParams.push(DbParameter.string(existsDatas[key]));
					}
					deleteCondition = deleteCondition + ")";
				}
				var result = db.update ('lo_t_moto_kyodaku_himozuke', logicalDeleteArg, deleteCondition, deleteParams);
			}
		}
		
	});
	
	if (!chkShanaiShusei(request.kyodaku_status)) {
		if(shinseiFlg) {
			Client.set('before_apply_id',kyodakuId);
		}
	}
	
	return functionResult;
}

/**
 * 許諾削除（論理削除）
 */
function deleteKyodaku (param) {
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kyodaku_id : param
	};
	
	// DB更新内容
	var dataSet = {
		sakujo_flg  : '1'
	}
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	//検索条件設定
	var whereObject = [DbParameter.string(param.kyodaku_id), DbParameter.string(param.koushin_bi)];
	var result = {};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		// 許諾削除
		result = db.update('lo_t_kyodaku', dataSet,"kyodaku_id = ? AND to_char(koushin_bi, 'YYYY/MM/DD HH24:MI:SS.MS') = ?",whereObject);
		if (result.countRow == 0) {
			// 排他エラー処理
			ret.error = true;
			ret.message = MessageManager.getMessage('ER01E004');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		ret.altmsg = MessageManager.getMessage('KY02I002');
		ret.flag = 2;
	});
    return ret;
}

/**
 * 登録可能企画データチェック
 * @param {String} 企画id
 * @param {boolean} 社内修正フラグ
 */
function chkKikakuData(kikakuId, isShanaiShuseiFlg) {
	var param = {kikaku_id: kikakuId};
	var columnNameMap = {};
	
	var sql = "" ;
	sql += "SELECT ";
	sql += "  ki.kikaku_id ";
	sql += "FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "WHERE " ;
	sql += "  ki.sakujo_flg ='0' ";
	sql += "  AND ki.kikaku_status NOT IN ";
	sql += " ('" + Constant.LO_STATUS_ICHIJI_HOZON + "'";
	sql += " , '" + Constant.LO_STATUS_JITAI + "'";
	sql += " , '" + Constant.LO_STATUS_HIKETSU + "'";
	sql += " , '" + Constant.LO_STATUS_IKO + "'";
	sql += " ) ";
	
	columnNameMap["kikaku_id"] = {col:"ki.kikaku_id",comp:"eq"};
	
	// 社内修正時は会社コードを指定しない
	if (!isShanaiShuseiFlg) {
		// 会社チェック（登録はライセンシーのみのため所属グループチェックは省略）
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		param.kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		columnNameMap["kaisha_id"] = {col:"ki.kaisha_id",comp:"eq"};
	}
	
	// 条件設定
	var strParam=[];
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
	sql += condition.sql;
	strParam = strParam.concat(condition.bindParams);

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);

	// SQLの結果件数が0件の場合登録不可
	if (result.countRow == 0) {
		return false;
	} else {
		return true;
	}
}


/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KY02E";
	var message_last_num = 52;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
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
        imwCallOriginalParams   : ImJson.toJSONString({'kyodaku_id':kyodakuData.kyodaku_id,'kyodaku_cls':kyodakuData.kyodaku_cls}),	//呼出元パラメータ
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
/*function nodeSetteing(){
	// ノードと承認ユーザを設定　todo DBからユーザを取得する
	var node = {
		"lo_node_appr_0":["endo"],
		"lo_node_appr_1":["sibata"],	
		"lo_node_appr_2":["saitou"],
		"lo_node_appr_3":["morita"],
		//"lo_node_keiyaku":["kawai"],
		//"lo_node_keijou":["kurihara"],
		"lo_node_appr_last":["endo"]
	};
	var accountContext = Contexts.getAccountContext();
    var usercd = accountContext.userCd;
	// todo テスト用
	if (usercd == 'kawase'){
		node = {
			"lo_node_appr_0":["kouketu"],
			"lo_node_appr_1":["kumagai"],	
			"lo_node_appr_2":["fuse"],
			"lo_node_appr_3":["nakagawa"],
			"lo_node_appr_last":["kouketu"]
		};
	}
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
				    "pluginId" : "jp.co.intra_mart.workflow.plugin.authority.node.dynamic.user",
				    "parameter" : users[i]
			}
			processTargetConfigs.push(userconf);
		}
		// ノード名と処理対象プラグイン情報を設定
		nodeSetting.DCNodeSetting[key] = {"displayFlag" : true, "processTargetConfigs":processTargetConfigs}
	}
    // JSON側でパラメータに渡す
	return ImJson.toJSONString(nodeSetting);
}*/
function nodeSetteing(ticket_id){
	
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
        imwCallOriginalParams   : ImJson.toJSONString({"kyodaku_id":kyodakuData.kyodaku_id}),    //呼出元パラメータ
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
 * タイトルの存在確認
 * @param {String} title_cd
 * @returns boolean
 */
function chkTitle(kikakuId){
	 // タイトルマスタの確認
	var strParam=[];
	strParam.push(DbParameter.string(kikakuId));
    var tiSql = "select 1 from lo_t_kikaku k ";
    tiSql+="inner join lo_m_title t on k.title_cd = t.title_cd and t.sakujo_flg ='0' ";
    tiSql+="where k.kikaku_id = ? and k.sakujo_flg ='0'";
    
    var db = new TenantDatabase();
    var tiResult = db.select(tiSql,strParam);// 戻り値
   
    if (tiResult.countRow === 0) {
    	return false;
    }
    
    return true;
}

/**
 * 請求書送付先情報取得
 * @param {Object} リクエスト
 * @returns {DatabaseResult} 検索結果
 */
function retrieveSeikyushoSofusakiList(request) {
	Logger.getLogger().info(' [retrieveSeikyushoSofusakiList]　契約内容確認表示 request ' + ImJson.toJSONString(request, true));
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveSeikyushoSofusakiList", request.kaisha_id);
	}
}
