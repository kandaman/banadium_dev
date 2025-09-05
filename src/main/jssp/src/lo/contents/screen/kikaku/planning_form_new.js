Constant.load("lo/common_libs/lo_const");
var $production_flg = false; // true=ライセンスプロダクション    false=ライセンシー
var $kikaku_data = {}; //企画情報
var $shohin_list = {}; //商品仕様
var $gakkyoku_list = {}; //楽曲仕様
var $event_list = {}; //イベント仕様
var $eizo_list = {}; //映像仕様
var $form = {}; // 画面表示用
var $ticketId = "";
var $newadd_flg = false;
var $kikaku_shubetsu_cd = "1"; // 企画種別判別用
var $kikaku_shubetsu_nm = ""; // 企画種別表示用
var $kikaku_title_nm = ""; // 表示タイトル
var $list_num = "0";
var $list_str = "";
var $wf_data = {}; //ワークフロー用パラメータ
var $proc_user_flg = false; //画面の処理対象者か
var $validationErrorMessages = [];
var $addParamFlg = false; //表示後パラメータ付与
var $fileList =[]; //添付ファイル
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $tmpFileStr = ""; //添付ファイルメッセージ
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数
var $kikakuExplanation = ""; //企画説明
var $shohinshiyoMax = 0; //商品仕様上限
var $shohinshiyoMaxStr = ""; //商品仕様上限メッセージ
var $titleNoExists = "";

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
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
    $tmpFileStr = MessageManager.getMessage('KK02I019');

	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();

	// 固定値マスタより商品仕様上限取得
	var $tmpList = [];
	$tmpList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $tmpList, Constant.LO_CDCLS_SHOHIN_SHIYO_MAX);
	$shohinshiyoMax = $tmpList[0];
	$shohinshiyoMaxStr = MessageManager.getMessage('KK02E013', $shohinshiyoMax);
	
	$titleNoExists = MessageManager.getMessage('KK02E021', $titleNoExists);

	// セッション取得
	var sessionKikakuId = Client.get('kikaku_edit_id');
	if (sessionKikakuId){
		Client.remove('kikaku_edit_id');
		request.kikaku_id = sessionKikakuId;
		$addParamFlg = true;
	}
	
	// セッション削除
	Client.remove('before_apply_id');

	// パラメータから企画IDを受け取り企画情報取得
	if ('kikaku_id' in request){
		
		var result = getKikakuDate(request.kikaku_id);
		$kikaku_data = result.data[0]; //一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $kikaku_data);
		
		// 編集可能チェック
		if(!chkEditable($kikaku_data)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		
		// 案件情報の取得
		if ($kikaku_data.kikaku_status == Constant.LO_STATUS_SHUSEI_IRAI) {
			if (!setMatterInfo(request.kikaku_id)){
				// ない場合は新規でセット
				// ワークフローパラメータの設定
				setWorkflowOpenPage(request.kikaku_id);
			}
			if (!$proc_user_flg) {
				PageManager.redirect("/lo/contents/screen/kikaku/planning_detail_new", "GET", {kikaku_id: request.kikaku_id});
			}
		}
		
		// 一時保存・修正依頼の場合は、マスタから会社名を再取得する
		if (($kikaku_data.kikaku_status == Constant.LO_STATUS_ICHIJI_HOZON || $kikaku_data.kikaku_status == Constant.LO_STATUS_SHUSEI_IRAI)
				&& $proc_user_flg) {
			
			// ユーザ情報取得
			var userContext = Contexts.getUserContext();
			var userName = userContext.userProfile.userName;
			var busyo_id = "";
			var busyo_nm ="";
			var kaisha_id = "";
			var kaisha_nm ="";
			
			var Department = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	    	if (Department !=null ){
	    		busyo_id = Department.departmentCd;
	    		busyo_nm = Department.departmentName;
	    		kaisha_id = Department.companyCd;
	    		kaisha_nm = Department.companyName;
	    	}
			
			$kikaku_data.kaisha_id = kaisha_id;
			$kikaku_data.kaisha_nm = kaisha_nm;
			$kikaku_data.busyo_id = busyo_id;
			$kikaku_data.busyo_nm = busyo_nm;
			$kikaku_data.tantou_sha = userName;
		}

		// 企画種別ごとに商品仕様を取得する
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM || $kikaku_data.kikaku_shubetsu_cd == null ){
			//商品
			var ret = getKikakuShohin(request.kikaku_id);
			$shohin_list = ret.data; //リスト形式で取得
			if (ret.countRow > 0){
				$list_num = "1";
				$list_str = "1";
				for (var i = 0; i < $shohin_list.length; i++) {
					$shohin_list[i].list_num = i + 1;
				}
			}
			$kikakuExplanation = MessageManager.getMessage('KK02I021');
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC){
			//楽曲
			var ret = getKikakuGakkyoku(request.kikaku_id);
			$gakkyoku_list = ret.data; //リスト形式で取得
			if (ret.countRow > 0){
				$list_num = "1";
				$list_str = "1";
				for (var i = 0; i < $gakkyoku_list.length; i++) {
					$gakkyoku_list[i].list_num = i + 1;
				}
			}
			$kikakuExplanation = MessageManager.getMessage('KK02I022');
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT){
			//イベント
			var ret = getKikakuEvent(request.kikaku_id);
			$event_list = ret.data; //リスト形式で取得
			if (ret.countRow > 0){
				$list_num = "1";
				$list_str = "1";
				for (var i = 0; i < $event_list.length; i++) {
					$event_list[i].list_num = i + 1;
				}
			}
			$kikakuExplanation = MessageManager.getMessage('KK02I023');
		}
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO){
			//映像
			var ret = getKikakuEizo(request.kikaku_id);
			$eizo_list = ret.data; //リスト形式で取得
			if (ret.countRow > 0){
				$list_num = "1";
				$list_str = "1";
				for (var i = 0; i < $eizo_list.length; i++) {
					$eizo_list[i].list_num = i + 1;
				}
			}
			$kikakuExplanation = MessageManager.getMessage('KK02I027');
		}

		// 添付ファイル
		var tempuFileResult = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "retrieveTempuFileList", request.kikaku_id);
		$fileList = tempuFileResult.data; // 全行取得
		
		// 企画種別設定
		$kikaku_shubetsu_cd = "" + $kikaku_data.kikaku_shubetsu_cd;
		
		$ticketId = request.kikaku_id;
		
	}else{
		
		// ライセンシー以外は表示させない
		if ($production_flg) {
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
		}
		
	    // idに空白セット
		$kikaku_data.kikaku_id="";
		$kikaku_data.koushin_bi = "";
		
		$newadd_flg = true;
	
		// ユーザ情報取得
		var userContext = Contexts.getUserContext();
		var userName = userContext.userProfile.userName;
		var busyo_id = "";
		var busyo_nm ="";
		var kaisha_id = "";
		var kaisha_nm ="";
		
		var Department = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
    	if (Department !=null ){
    		busyo_id = Department.departmentCd;
    		busyo_nm = Department.departmentName;
    		kaisha_id = Department.companyCd;
    		kaisha_nm = Department.companyName;
    	}
		
		$kikaku_data.kikaku_status = "";
		$kikaku_data.kaisha_id = kaisha_id;
		$kikaku_data.kaisha_nm = kaisha_nm;
		$kikaku_data.busyo_id = busyo_id;
		$kikaku_data.busyo_nm = busyo_nm;
		$kikaku_data.tantou_sha = userName;


		// 企画種別設定
		if ('kikaku_shubetsu_cd' in request){
			if ([Constant.LO_KIKAKU_SHUBETSU_ITEM,
			     Constant.LO_KIKAKU_SHUBETSU_MUSIC,
			     Constant.LO_KIKAKU_SHUBETSU_EVENT,
			     Constant.LO_KIKAKU_SHUBETSU_EIZO].indexOf(request.kikaku_shubetsu_cd) == -1) {
				Transfer.toErrorPage({
					title: MessageManager.getMessage('ER01E001'),
					message: MessageManager.getMessage('ER01E006'),
					detail: [MessageManager.getMessage('ER01E007')],
					parameter: {
						key: 'value',
						list: ['1','2','3','4']
					}
				});
			} else {
				$kikaku_shubetsu_cd = request.kikaku_shubetsu_cd;
			}
		}else{
			$kikaku_shubetsu_cd = Constant.LO_KIKAKU_SHUBETSU_ITEM;
		}
	}
	
	switch ($kikaku_shubetsu_cd){
		case Constant.LO_KIKAKU_SHUBETSU_ITEM:
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_ITEM');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_FORM');
			$kikakuExplanation = MessageManager.getMessage('KK02I021');
			break;
		case Constant.LO_KIKAKU_SHUBETSU_MUSIC:
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_MUSIC');
			$kikaku_title_nm = $kikaku_shubetsu_nm + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_FORM');
			$kikakuExplanation = MessageManager.getMessage('KK02I022');
			break;
		case Constant.LO_KIKAKU_SHUBETSU_EVENT:
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_EVENT');
			$kikaku_title_nm = $kikaku_shubetsu_nm + "\n" + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_FORM');
			$kikakuExplanation = MessageManager.getMessage('KK02I023');
			break;
		case Constant.LO_KIKAKU_SHUBETSU_EIZO:
			$kikaku_shubetsu_nm = MessageManager.getMessage('LO.CLS.PLANNING_EIZO');
			$kikaku_title_nm = $kikaku_shubetsu_nm + "\n" + MessageManager.getMessage('LO.TITLE.KIKAKU.PLANNING_FORM');
			$kikakuExplanation = MessageManager.getMessage('KK02I027');
			break;

	}
}

/**
 * 編集可能かチェック
 */
function chkEditable(data) {
	
	// ステータスチェック（編集可能なステータスかどうか）
	if (data.kikaku_status != Constant.LO_STATUS_ICHIJI_HOZON && data.kikaku_status != Constant.LO_STATUS_SHUSEI_IRAI) {
		// 一時保存か修正依頼のみOK
		return false;
	}
	
	// 権限チェック（編集可能な所属グループかどうか）
	var shozokuFlg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_LICENSEE);
	if (!shozokuFlg){
		return false;
	}
	
	// 会社チェック（編集可能な所属グループかどうか）
	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
	if (data.kaisha_id != kaisha_id) {
		return false;
	}
	
	return true;
}

/**
 * 企画情報登録・更新
 */
function insertKikakuInfo(formParams, altflag) {
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_PRODUCTION);
	
	var logicalDeleteArg = {sakujo_flg : "1"};
	logicalDeleteArg = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", logicalDeleteArg, false);
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kikaku_id : "",
		koushin_bi: ""
	};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		
		
		//画面の入力値をDB用オブジェクトに格納
		// todo 必要な項目を追加する
		// 契約管理登録
		var dataSet = {
			kikaku_nm : (formParams.kikaku_nm === undefined)?null:formParams.kikaku_nm,
			kikaku_shubetsu_cd : (formParams.kikaku_shubetsu_cd === undefined)?null:Number(formParams.kikaku_shubetsu_cd),
			ip_cd : (formParams.ip_cd === undefined)?null:formParams.ip_cd,
			ip_nm : (formParams.ip_nm === undefined)?null:formParams.ip_nm,
			title_cd : (formParams.title_cd === undefined)?null:formParams.title_cd,
			title_nm : (formParams.title_nm === undefined)?null:formParams.title_nm,
			//shinsei_bi : new Date(),
			kaisha_id : (formParams.kaisha_id === undefined)?null:formParams.kaisha_id,
			kaisha_nm : (formParams.kaisha_nm === undefined)?null:formParams.kaisha_nm,
			busyo_id : (formParams.busyo_id === undefined)?null:formParams.busyo_id,
			busyo_nm : (formParams.busyo_nm === undefined)?null:formParams.busyo_nm,
			tantou_sha : (formParams.tantou_sha === undefined)?null:formParams.tantou_sha,
			tag : (formParams.tag === undefined)?null:formParams.tag,
			bne_tantou_sha : (formParams.bne_tantou_sha === undefined)?null:formParams.bne_tantou_sha,
			comment : (formParams.comment === undefined)?null:formParams.comment,
			seikyusho_sofusaki_id : (formParams.seikyusho_sofusaki_eda === undefined)?null:formParams.seikyusho_sofusaki_eda
		};

		var result = {};
		// 企画IDがない場合は新規作成
		if (formParams.kikaku_id == "" || formParams.kikaku_id == null){
			// 企画ID
			var kikaku_id = Content.executeFunction("lo/common_libs/lo_common_fnction", "getNextId", Constant.LO_TICKET_ID_HEAD_KIKAKU);
			formParams.kikaku_id = kikaku_id;

			dataSet.kikaku_id = kikaku_id;
			dataSet.kikaku_status = "1"; //一時保存
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, true);
			result = db.insert('lo_t_kikaku', dataSet);
		}else{
			//詳細テーブルデータを取得（データがある場合は、新規番号が発番されている前提）			
			var whereDetailObject = [
            DbParameter.string(formParams.kikaku_id)
			];
			
			//最も早い発売時期をメインテーブルに追加
			var sql = "";
			sql += "  SELECT " ;
			sql += "  SUM(s.royalty_kingaku) AS royalty_kingaku," ;
			
			switch(formParams.kikaku_shubetsu_cd){
			case Constant.LO_KIKAKU_SHUBETSU_ITEM:
				sql += "  MIN(s.hanbai_jiki) AS hanbai_jiki" ;
				sql += " FROM lo_t_kikaku_shohin as s " ; 
				break;
			case Constant.LO_KIKAKU_SHUBETSU_MUSIC:
				sql += "  MIN(s.hanbai_jiki) AS hanbai_jiki" ;
				sql += " FROM lo_t_kikaku_gakkyoku as s " ; 
				break;
			case Constant.LO_KIKAKU_SHUBETSU_EVENT:
				sql += "  MIN(s.event_kaishi_jiki) AS hanbai_jiki" ;
				sql += " FROM lo_t_kikaku_event as s " ; 
				break;
			default:
				sql += "  MIN(s.hanbai_jiki) AS hanbai_jiki" ;
				sql += " FROM lo_t_kikaku_shohin as s " ; 
				break;
			}			
			
			sql += " WHERE s.sakujo_flg ='0' " ; 
			sql += "   AND s.kikaku_id =? " ;

			result = db.select(sql,whereDetailObject);
				
			var kikakuShohinData = result.data[0];
			
			dataSet.royalty_kingaku = kikakuShohinData.royalty_kingaku;
			dataSet.hanbai_jiki = kikakuShohinData.hanbai_jiki;
			
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
			var whereObject = [
            DbParameter.string(formParams.kikaku_id),
            DbParameter.string(formParams.koushin_bi)
			];
			// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
			result = db.update('lo_t_kikaku', dataSet,"kikaku_id = ? and to_char(koushin_bi, 'YYYYMMDDHH24MISSMS') = ? ", whereObject);
			if (result.countRow != 1) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E004');
				Transaction.rollback();
				return ret;
			}
			Logger.getLogger().info(' [insertKikakuInfo]　result ' + ImJson.toJSONString(result, true));
			// 枝番並び替え
			var sortResult = sortEdabanIntoSerial(formParams.kikaku_id, formParams.kikaku_shubetsu_cd);
			if (!sortResult) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('ER01E004');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}

		if ('tempu_file_list' in formParams) {
			var tempuFileResult = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "retrieveTempuFileList", formParams.kikaku_id);
			var publicFilePaths = [];
			for (var idx = 0; idx < tempuFileResult.data.length; idx++) {
				publicFilePaths.push(tempuFileResult.data[idx].file_path);
			}
			var list = formParams.tempu_file_list;
			var paramFilePaths = [];
			var maxFileNo = 0;
			for (var key in list) {
				var data = list[key];
				paramFilePaths.push(data.file_path);
				var upObject =  {
					file_name : data.file_name
					, file_path : formParams.kikaku_id + "/" + data.file_path.split("/").reverse()[0]
					, sakujo_flg : "0"
			    };
			    upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, false);
				Logger.getLogger().debug(' [insertKikakuInfo]　updateTempFileData ' + ImJson.toJSONString(upObject, true));
				var result = db.update('lo_t_kikaku_tempu_file', upObject, "kikaku_id = ? AND file_no = ?",[DbParameter.string(formParams.kikaku_id), DbParameter.number(data.file_no)]);
				if (result.countRow == 0) {
					upObject.kikaku_id = formParams.kikaku_id;
					upObject.file_no = data.file_no;
					upObject = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", upObject, true);
					Logger.getLogger().debug(' [insertKikakuInfo]　insertTempFileData ' + ImJson.toJSONString(upObject, true));
					db.insert('lo_t_kikaku_tempu_file', upObject);
				}
				if (data.file_no > maxFileNo) {
					maxFileNo = data.file_no;
				}
			}
			var result = db.update ('lo_t_kikaku_tempu_file', logicalDeleteArg, "kikaku_id = ? AND file_no > ?" ,[DbParameter.string(formParams.kikaku_id), DbParameter.number(maxFileNo)]);



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
					var dir = Constant.LO_PATH_PUBLIC_STORAGE + formParams.kikaku_id + "/";
					var publicDir = new PublicStorage(dir);
					if (!publicDir.isDirectory()) {
						// ディレクトリが存在しなければ作成
						publicDir.makeDirectories();
					}

					// パブリックストレージにコピー
					var publicStrageFile = dir + newFilePath;
					var publicStorage = new PublicStorage(publicStrageFile);
					sessionStorage.copy(publicStorage, true);
				}
			}
			var deleteFilePaths = publicFilePaths.filter(function(paramFilePath) {
				return paramFilePaths.indexOf(paramFilePath) == -1;
			});

		}

		if (result.error) {
			ret.error = true;
			ret.msg=MessageManager.getMessage('KK02E005');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}

		// 戻り値に企画id
		ret.kikaku_id = formParams.kikaku_id;
		ret.koushin_bi = ("0000"+dataSet.koushin_bi.getFullYear()).slice(-4)+
							("00"+(dataSet.koushin_bi.getMonth()+1)).slice(-2)+
							("00"+dataSet.koushin_bi.getDate()).slice(-2)+
							("00"+dataSet.koushin_bi.getHours()).slice(-2)+
							("00"+dataSet.koushin_bi.getMinutes()).slice(-2)+
							("00"+dataSet.koushin_bi.getSeconds()).slice(-2)+
							("000"+dataSet.koushin_bi.getMilliseconds()).slice(-3);

		// アラートメッセージをセット
		if(altflag == 1) {
			ret.altmsg = MessageManager.getMessage('KK02I001');
			ret.flag = 1;
			Client.set('before_apply_id',ret.kikaku_id);
		} else if(altflag == 2) {
			ret.altmsg = MessageManager.getMessage('KK02I002');
			ret.flag = 2;
		} else {
			ret.flag = 3;
		}
	});

    return ret;
    
}

/**
 * 商品仕様・論理削除
 */
function deleteShohinshiyo (param, list, edabanList) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_PRODUCTION);

	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kikaku_id : ""
	};
	var altstr = "";
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		
		// 企画検索
		var kikaku_result = getKikakuDataWithTimestamp(param.kikaku_id, param.koushin_bi);
		if(kikaku_result.data.length <= 0){
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
		}
		$kikaku_data = kikaku_result.data[0]; //一行だけ取得
		var kikaku_shubetsu_cd = $kikaku_data.kikaku_shubetsu_cd.toString();
		
		var result = {};
		var edaban = '';
		// DB更新内容
		var dataSet = {sakujo_flg : '1'};
		dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
		//検索条件設定
		var whereObject = {};
		// 引数のlist文ループ
		for ( var i = 0; i < list.length; i++) {
			edaban = edabanList[i];
			// alert文字列設定
			if (altstr == "") {
				altstr = "#" + list[i];
			} else {
				altstr = altstr + ", #" + list[i];
			}
			//検索条件設定
			whereObject = [DbParameter.string(param.kikaku_id),DbParameter.number(Number(edaban))];
			// 企画種別ごとに更新するDBを変更する
			if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM) {
				// 商品更新
				result = db.update('lo_t_kikaku_shohin', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
			} else if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
				// 楽曲更新
				result = db.update('lo_t_kikaku_gakkyoku', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
			} else if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT) {
				// イベント更新
				result = db.update('lo_t_kikaku_event', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
			} else if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO) {
				// 映像更新
				result = db.update('lo_t_kikaku_eizo', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
			}
			if (result.error || result.countRow != 1) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('KK02E006');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
			
			// 完成イメージファイル削除
			result = db.update('lo_t_kikaku_shohin_file', dataSet,'kikaku_id = ? and kikaku_edaban = ?',whereObject);
			if (result.error) {
				ret.error = true;
				ret.msg = MessageManager.getMessage('KK02E006');
				Transaction.rollback(); // エラー時はロールバックします。
				return ret;
			}
		}
		
		// 枝番並び替え
		result = sortEdabanIntoSerial(param.kikaku_id, kikaku_shubetsu_cd);
		if (!result) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E006');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		
		// 排他制御のため、企画本体の更新日時も設定する
		if (!updateKikakuTimestamp(param.kikaku_id, param.koushin_bi)) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
		}
		
		altstr = MessageManager.getMessage('KK02I004', altstr);
		ret.altmsg = altstr;
		ret.flag = 4;
		ret.kikaku_id = param.kikaku_id;
	});
    return ret;
}

/**
 * 企画削除（論理削除）
 */
function deleteKikaku (param) {
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kikaku_id : param.kikaku_id
	};
	
	// DB更新内容
	var dataSet = {sakujo_flg : '1'};
	dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, false);
	//検索条件設定
	var whereObject = [DbParameter.string(param.kikaku_id)];
	var result = {};
	
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		
		// 企画検索
		var kikaku_result = getKikakuDataWithTimestamp(param.kikaku_id, param.koushin_bi);
		if(kikaku_result.data.length <= 0){
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
		}
		$kikaku_data = kikaku_result.data[0]; //一行だけ取得
		
		// 企画種別ごとに削除するDBを変更する
		if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM) {
			// 商品削除
			result = db.update('lo_t_kikaku_shohin', dataSet,'kikaku_id = ?',whereObject);
		} else if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
			// 楽曲削除
			result = db.update('lo_t_kikaku_gakkyoku', dataSet,'kikaku_id = ?',whereObject);
		} else if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT) {
			// イベント削除
			result = db.update('lo_t_kikaku_event', dataSet,'kikaku_id = ?',whereObject);
		} else if ($kikaku_data.kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO) {
			// 映像削除
			result = db.update('lo_t_kikaku_eizo', dataSet,'kikaku_id = ?',whereObject);
		}
		// 企画削除
		result = db.update('lo_t_kikaku', dataSet,'kikaku_id = ?',whereObject);
		
		if (result.error) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E007');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		ret.altmsg = MessageManager.getMessage('KK02I003');
		ret.flag = 2;
	});
    return ret;
}

/**
 * 商品仕様複製
 */
function hukusei(inputContents, list, edabanList) {
	
	// ユーザ情報取得
	var userContext = Contexts.getUserContext();
	var userCd = userContext.userProfile.userCd;
	var userName = userContext.userProfile.userName;
	
	var sysDate = new Date();
	// 戻り値
	var ret = {
		error : false,
		msg : "",
		altmsg : "",
		flag : 0,
		kikaku_id : inputContents.kikaku_id
	};
	var kikakuId = inputContents.kikaku_id;
	var edaban = '';
	//検索条件設定
	var whereObject = {};
	var result = {};
	var sql = "";
	var edabanNum = 0;
	var fileNum = 0;
	var altstr = "";

	var kiSql = "" ;
	kiSql += "SELECT ";
	kiSql += "  ki.* ";
	kiSql += "FROM ";
	kiSql += "  lo_t_kikaku AS ki ";
	kiSql += "WHERE ";
	kiSql += "  ki.sakujo_flg = '0' ";
	kiSql += "  AND ki.kikaku_id = ?  ";
	kiSql += "   and to_char(ki.koushin_bi, 'YYYYMMDDHH24MISSMS') = ? ";
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));

    // トランザクション開始
	Transaction.begin(function() {
		var db = new TenantDatabase();

		var selectKikakuParams = [DbParameter.string(kikakuId), DbParameter.string(inputContents.koushin_bi)];
	    var kiResult = db.select(kiSql, selectKikakuParams);
	    if (kiResult.countRow === 0) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
	    }
	    var kikakuData = kiResult.data[0];
	    var kikaku_shubetsu_cd = kikakuData.kikaku_shubetsu_cd.toString();
	    
	    // 引数のlist文ループ
		for ( var i = 0; i < list.length; i++) {
			edaban = edabanList[i];
			// alert文字列設定
			if (altstr == "") {
				altstr = "#" + list[i];
			} else {
				altstr = altstr + ", #" +  list[i];
			}

			//検索条件設定
			whereObject = [DbParameter.string(kikakuId),DbParameter.number(Number(edaban))];
			
			// 商品
			if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_ITEM) {
				// 企画枝番最大値取得
				if (edabanNum == 0) {
					sql = "select coalesce(max(kikaku_edaban), 0) as edaban_max from lo_t_kikaku_shohin where kikaku_id = ?";
					var edabanResult = db.select(sql, strParam);
					edabanNum = edabanResult.data[0].edaban_max + 1;
					
				} else {
					edabanNum = edabanNum + 1;
				}
				sql = "";
				sql += "  SELECT *" ;
				sql += " FROM lo_t_kikaku_shohin as s " ; 
				sql += " WHERE s.sakujo_flg ='0' " ; 
				sql += "   AND s.kikaku_id =? " ;
				sql += "   AND s.kikaku_edaban =? " ;
				
				result = db.select(sql,whereObject);
				
				var kikakuShohinData = result.data[0];

		    	kikakuShohinData.kikaku_edaban = edabanNum;
		    	kikakuShohinData.ok_ng = '0';
		    	kikakuShohinData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuShohinData, true);

				var ksResult = db.insert('lo_t_kikaku_shohin', kikakuShohinData);
				
				if (ksResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('KK02E008');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;  
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
			    // sql実行
			    var fileResult = db.select(fileSql,whereObject);
			    
			    var fileMax = fileResult.data.length;
				if (fileNum == 0) {
					fileNum = fileMax + 1;
				} else {
					fileNum = fileNum + 1;
				}
				
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					var fileName = fileData.file_path.split("/").reverse()[0];
					fileData.kikaku_edaban = edabanNum;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, kikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('KK02E008');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
			}
			// 楽曲
			if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
				// 企画枝番最大値取得
				if (edabanNum == 0) {
					sql = "select coalesce(max(kikaku_edaban), 0) as edaban_max from lo_t_kikaku_gakkyoku where kikaku_id = ?";
					var edabanResult = db.select(sql, strParam);
					edabanNum = edabanResult.data[0].edaban_max + 1;
					
				} else {
					edabanNum = edabanNum + 1;
				}
				sql = "";
				sql += "  SELECT *" ;
				sql += " FROM lo_t_kikaku_gakkyoku as s " ; 
				sql += " WHERE s.sakujo_flg ='0' " ; 
				sql += "   AND s.kikaku_id =? " ;
				sql += "   AND s.kikaku_edaban =? " ;
				
				result = db.select(sql,whereObject);
				
				var kikakuGakkyokuData = result.data[0];

		    	kikakuGakkyokuData.kikaku_edaban = edabanNum;
		    	kikakuGakkyokuData.ok_ng = '0';
		    	kikakuGakkyokuData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuGakkyokuData, true);

				var kgResult = db.insert('lo_t_kikaku_gakkyoku', kikakuGakkyokuData);
				if (kgResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('KK02E008');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;  
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
			    // sql実行
			    var fileResult = db.select(fileSql,whereObject);
			    
			    var fileMax = fileResult.data.length;
				if (fileNum == 0) {
					fileNum = fileMax + 1;
				} else {
					fileNum = fileNum + 1;
				}
				
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					fileData.kikaku_edaban = edabanNum;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, kikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('KK02E008');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
			}
			// イベント
			if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EVENT) {
				// 企画枝番最大値取得
				if (edabanNum == 0) {
					sql = "select coalesce(max(kikaku_edaban), 0) as edaban_max from lo_t_kikaku_event where kikaku_id = ?";
					var edabanResult = db.select(sql, strParam);
					edabanNum = edabanResult.data[0].edaban_max + 1;
					
				} else {
					edabanNum = edabanNum + 1;
				}
				sql = "";
				sql += "  SELECT *" ;
				sql += " FROM lo_t_kikaku_event as s " ; 
				sql += " WHERE s.sakujo_flg ='0' " ; 
				sql += "   AND s.kikaku_id =? " ;
				sql += "   AND s.kikaku_edaban =? " ;
				
				result = db.select(sql,whereObject);
				
				var kikakuEventData = result.data[0];

				kikakuEventData.kikaku_edaban = edabanNum;
				kikakuEventData.ok_ng = '0';
				kikakuEventData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuEventData, true);

				var keResult = db.insert('lo_t_kikaku_event', kikakuEventData);
				if (keResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('KK02E008');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;  
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
			    // sql実行
			    var fileResult = db.select(fileSql,whereObject);
			    
			    var fileMax = fileResult.data.length;
				if (fileNum == 0) {
					fileNum = fileMax + 1;
				} else {
					fileNum = fileNum + 1;
				}
				
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					fileData.kikaku_edaban = edabanNum;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, kikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('KK02E008');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
			}
			// 映像
			if (kikaku_shubetsu_cd == Constant.LO_KIKAKU_SHUBETSU_EIZO) {
				// 企画枝番最大値取得
				if (edabanNum == 0) {
					sql = "select coalesce(max(kikaku_edaban), 0) as edaban_max from lo_t_kikaku_eizo where kikaku_id = ?";
					var edabanResult = db.select(sql, strParam);
					edabanNum = edabanResult.data[0].edaban_max + 1;
					
				} else {
					edabanNum = edabanNum + 1;
				}
				sql = "";
				sql += "  SELECT *" ;
				sql += " FROM lo_t_kikaku_eizo as s " ; 
				sql += " WHERE s.sakujo_flg ='0' " ; 
				sql += "   AND s.kikaku_id =? " ;
				sql += "   AND s.kikaku_edaban =? " ;
				
				result = db.select(sql,whereObject);
				
				var kikakuEizoData = result.data[0];

				kikakuEizoData.kikaku_edaban = edabanNum;
				kikakuEizoData.ok_ng = '0';
				kikakuEizoData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", kikakuEizoData, true);

				var keResult = db.insert('lo_t_kikaku_eizo', kikakuEizoData);
				if (keResult.error) {
					ret.error = true;
					ret.msg = MessageManager.getMessage('KK02E008');
					Transaction.rollback(); // エラー時はロールバックします。
					return ret;
				}
				// ファイル登録
				var fileSql = "" ;
				fileSql += " SELECT *" ;
				fileSql += " FROM lo_t_kikaku_shohin_file ksf " ; 
				fileSql += " WHERE ksf.sakujo_flg ='0' " ; 
				fileSql += "   AND ksf.kikaku_id =? " ;  
				fileSql += "   AND ksf.kikaku_edaban =? " ;
				fileSql += " ORDER By ksf.kikaku_edaban ASC " ; 
				
			    // sql実行
			    var fileResult = db.select(fileSql,whereObject);
			    
			    var fileMax = fileResult.data.length;
				if (fileNum == 0) {
					fileNum = fileMax + 1;
				} else {
					fileNum = fileNum + 1;
				}
				
			    var fileDatas = fileResult.data;
			    for (var idx = 0; idx < fileDatas.length; idx++) {
					var fileData = fileDatas[idx];
					fileData.kikaku_edaban = edabanNum;
					fileData = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", fileData, true);
					fileData.file_path = Content.executeFunction("lo/common_libs/lo_common_fnction", "copyPublicStorage", fileData.file_path, kikakuId + "/img");
					
					var kfResult = db.insert('lo_t_kikaku_shohin_file', fileData);
					if (kfResult.error) {
						ret.error = true;
						ret.msg = MessageManager.getMessage('KK02E008');
						Transaction.rollback(); // エラー時はロールバックします。
						return ret;
					}
				}
			}
		}
		
		// 枝番並び替え
		var sortResult = sortEdabanIntoSerial(inputContents.kikaku_id, kikaku_shubetsu_cd);
		if (!sortResult) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('KK02E008');
			Transaction.rollback(); // エラー時はロールバックします。
			return ret;
		}
		
		// 排他制御のため、企画本体の更新日時も設定する
		if (!updateKikakuTimestamp(inputContents.kikaku_id, inputContents.koushin_bi)) {
			ret.error = true;
			ret.msg = MessageManager.getMessage('ER01E004');
			Transaction.rollback();
			return ret;
		}		

		altstr = MessageManager.getMessage('KK02I005', altstr);
		ret.altmsg = altstr;
		ret.flag = 4;
	});
	return ret;
}

/**
 * 枝番を連番に並び替える
 * @param {String} 企画番号
 * @param {String} 企画種別
 * @return {boolean} 結果
 */
function sortEdabanIntoSerial(kikakuId, kikakuCls) {
	// テーブル判定
	var tbl = "";
	if (kikakuCls == Constant.LO_KIKAKU_SHUBETSU_ITEM) {
		// 商品
		tbl = 'lo_t_kikaku_shohin';
	} else if (kikakuCls == Constant.LO_KIKAKU_SHUBETSU_MUSIC) {
		// 楽曲
		tbl = 'lo_t_kikaku_gakkyoku';
	} else if (kikakuCls == Constant.LO_KIKAKU_SHUBETSU_EVENT){
		// イベント
		tbl = 'lo_t_kikaku_event';
	} else if (kikakuCls == Constant.LO_KIKAKU_SHUBETSU_EIZO){
		//	 映像
		tbl = 'lo_t_kikaku_eizo';
	} else {
		return;
	}
	// SQL
	var sql = "SELECT * FROM " + tbl + " WHERE kikaku_id = ? ORDER BY sakujo_flg, kikaku_edaban ";
	// 検索値をセット
	var strParam=[];
	strParam.push(DbParameter.string(kikakuId));
	// sql実行
	var db = new TenantDatabase();
	var kikakuShohin = db.select(sql,strParam);
	var dataList = kikakuShohin.data;
	
	var edabanFrom;
	var edabanTo;
	var dataSet = {};
	var whereObject = [];
	var result;
	// PK重複を避けるために枝番マイナス付きで仮登録
	for(var i=0; i<dataList.length; i++) {
		edabanFrom = dataList[i].kikaku_edaban;
		edabanTo = i + 1;
		dataSet = {kikaku_edaban: edabanTo * -1};
		whereObject = [DbParameter.string(kikakuId), DbParameter.number(edabanFrom)];
		result = db.update(tbl, dataSet, "kikaku_id = ? and kikaku_edaban = ?", whereObject);
		if(result.error) {
			return;
		}
		result = db.update('lo_t_kikaku_shohin_file', dataSet, "kikaku_id = ? and kikaku_edaban = ?", whereObject);
		if(result.error) {
			return;
		}
	}
	
	// 本登録
	function updateSqlFc(table) {
		var sql = "";
		sql += "UPDATE ";
		sql += table;
		sql += " SET ";
		sql += "  kikaku_edaban = kikaku_edaban * -1 ";
		sql += "  + CASE sakujo_flg WHEN '1' THEN 100 ELSE 0 END";
		sql += " WHERE kikaku_id = ?";
		return sql
	}
	whereObject = [DbParameter.string(kikakuId)];
	result = db.execute(updateSqlFc(tbl), whereObject);
	if(result.error) {
		return;
	}
	result = db.execute(updateSqlFc('lo_t_kikaku_shohin_file'), whereObject);
	if(result.error) {
		return;
	}
	
	return true;
}

/**
 * 企画情報の排他制御用に、更新日のみ設定する(商品仕様情報更新時)
 */
function updateKikakuTimestamp(kikakuId, koushinBi){
	var db = new TenantDatabase();
	var userContext = Contexts.getUserContext();
	var userName = userContext.userProfile.userName;
	var dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", {}, false);
	var whereObject = [DbParameter.string(kikakuId), DbParameter.string(koushinBi)];
	var result = db.update('lo_t_kikaku', dataSet, "kikaku_id = ? and to_char(koushin_bi, 'YYYYMMDDHH24MISSMS') = ?", whereObject);
	return !result.error && result.countRow == 1;
}

/**
 * 企画情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuDate(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ライセンスプロダクションか判断
	var is_production = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_PRODUCTION);

	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT " ;
	sql += "   k.kikaku_id " ; 
	sql += "  ,k.kikaku_nm " ; 
	sql += "  ,k.kikaku_shubetsu_cd "; 
	sql += "  ,ko01.cd_naiyo as kikaku_shubetsu_name " ; 
	sql += "  ,k.kikaku_status " ;
	sql += "  ,ko02.cd_naiyo as kikaku_status_name " ; 
	sql += "  ,k.ip_cd " ; 
	sql += "  ,k.ip_nm " ; 
	sql += "  ,k.title_cd " ; 
	sql += "  ,k.title_nm " ; 
	sql += "  ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; 
	sql += "  ,to_char(k.kakunin_bi,'YYYY/MM/DD') as kakunin_bi" ;
	sql += "  ,k.kaisha_id " ;
	sql += "  ,k.kaisha_nm " ;
	sql += "  ,k.tantou_sha " ;
	sql += "  ,k.seikyusho_sofusaki_id " ;
	sql += "  ,k.tag " ; 
	sql += "  ,k.bne_tantou_sha " ; 
	sql += "  ,'' as ip " ; 
	sql += "  ,k.busyo_id " ; 
	sql += "  ,k.busyo_nm " ;
	sql += "  ,k.shohyo_chosa_kekka " ;
	sql += "  ,ko03.cd_naiyo as shohyo_chosa_kekka_nm " ; 
	sql += "  ,k.shohyo_chosa_comment " ;
	sql += "  ,k.kanshu_no " ;
	sql += "  ,to_char(k.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";	// 排他制御用
	sql += " FROM lo_t_kikaku as k " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KIKAKU_SHUBETSU + "' ";
	sql += "    AND ko01.cd_id = CAST(k.kikaku_shubetsu_cd AS character varying) ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + (is_production ? Constant.LO_CDCLS_KIKAKU_STATUS_PR : Constant.LO_CDCLS_KIKAKU_STATUS_LI) + "' ";
	sql += "    AND ko02.cd_id = k.kikaku_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_SHOHYO_CHOSA_KEKKA + "' ";
	sql += "    AND ko03.cd_id = k.shohyo_chosa_kekka ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 

	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
}

/**
 * データ取得(楽観排他制御つき)
 * koushinBi は YYYYMMDDHH24MISSMS 形式で渡してください
 */
function getKikakuDataWithTimestamp(kikakuId, koushinBi) {
	
	var sql = "" ;
	sql += " SELECT " ;
	sql += "   k.kikaku_id " ; 
	sql += "  ,k.kikaku_nm " ; 
	sql += "  ,k.kikaku_shubetsu_cd "; 
	sql += "  ,k.kikaku_status " ;
	sql += "  ,k.ip_cd " ; 
	sql += "  ,k.ip_nm " ; 
	sql += "  ,k.title_cd " ; 
	sql += "  ,k.title_nm " ; 
	sql += "  ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi" ; 
	sql += "  ,to_char(k.kakunin_bi,'YYYY/MM/DD') as kakunin_bi" ;
	sql += "  ,k.kaisha_id " ;
	sql += "  ,k.kaisha_nm " ; 
	sql += "  ,k.tantou_sha " ; 
	sql += "  ,k.tag " ; 
	sql += "  ,k.bne_tantou_sha " ; 
	sql += "  ,'済み' as shohyo " ; 
	sql += "  ,'' as ip " ; 
	sql += "  ,k.busyo_nm " ;
	
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 
	sql += "   and to_char(k.koushin_bi, 'YYYYMMDDHH24MISSMS') = ? ";
	
	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.string(koushinBi));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 企画スタータス名取得
    var obj = {};
    obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, "1");
    result.data = obj;

    return result;
}
	
/**
 * 商品情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuShohin(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   s.kikaku_id " ; 
	sql += "  ,s.kikaku_edaban " ; 
	sql += "  ,s.shohin_nm " ; 
	sql += "  ,s.hanbai_jiki " ;
	sql += "  ,s.zeinuki_jodai " ;
	sql += "  ,s.jyouhou_syosyutu_jiki " ; 
	sql += "  ,s.mokuhyo_hambai_su " ; 
	sql += "  ,s.shokai_seisanyotei_su " ; 
	sql += "  ,s.chiiki " ; 
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,s.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += "  ,concat(s.kikaku_edaban, ko02.cd_naiyo) as chk_no " ;
	sql += "  ,to_char(s.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";	// 排他制御用
	sql += " FROM lo_t_kikaku_shohin as s " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = s.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = s.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE s.sakujo_flg ='0' " ; 
	sql += "   AND s.kikaku_id =? " ;
	sql += " ORDER BY s.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {};
    obj2 = setComma(result.data);
    result.data = obj2;
    return result;

}

/**
 * 楽曲情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuGakkyoku(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   g.kikaku_id " ; 
	sql += "  ,g.kikaku_edaban " ; 
	sql += "  ,g.gakkyoku_nm " ; 
	sql += "  ,g.hanbai_jiki " ;
	sql += "  ,g.kakaku_cd as kakaku" ; //種別で変化？
	sql += "  ,g.jyouhou_syosyutu_jiki " ; 
	sql += "  ,g.mokuhyo_hambai_su " ; 
	sql += "  ,g.shokaisyukka_mikomi " ; 
	sql += "  ,g.chiiki " ; 
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,g.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += "  ,concat(g.kikaku_edaban, ko02.cd_naiyo) as chk_no " ;
	sql += "  ,to_char(g.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";	// 排他制御用
	sql += " FROM lo_t_kikaku_gakkyoku as g " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = g.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = g.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.kikaku_id =? " ;
	sql += " ORDER BY g.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {};
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;

}

/**
 * イベント情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuEvent(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   e.kikaku_id " ; 
	sql += "  ,e.kikaku_edaban " ; 
	sql += "  ,e.event_campaign_nm " ; 
	sql += "  ,e.event_kaishi_jiki as hanbai_jiki " ;
	sql += "  ,e.ticket_kakaku" ;
	sql += "  ,e.syosyutu_jiki as jyouhou_syosyutu_jiki " ; 
	sql += "  ,e.mokuhyo_hambai_su " ; 
	sql += "  ,e.shokai_seisanyotei_su " ; 
	sql += "  ,'' as chiiki " ; 
	sql += "  ,e.ok_ng " ;
	sql += "  ,ko01.cd_naiyo as ok_ng_nm " ; 
	sql += "  ,concat(e.kikaku_edaban, ko01.cd_naiyo) as chk_no " ;
	sql += "  ,to_char(e.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";	// 排他制御用
	sql += " FROM lo_t_kikaku_event as e " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko01.cd_id = e.ok_ng ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ;
	sql += " ORDER BY e.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {};
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;
}	

/**
 * 映像情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getKikakuEizo(kikakuId) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ; 
	sql += "  SELECT " ; 
	sql += "   e.kikaku_id " ; 
	sql += "  ,e.kikaku_edaban " ; 
	sql += "  ,e.shiyou_youto_nm " ; // 映像名　
	sql += "  ,e.eizo_kaishi_jiki as hanbai_jiki " ; // 開始時期
	sql += "  ,e.riyou_ryo" ; // 価格
	sql += "  ,e.syosyutu_jiki as jyouhou_syosyutu_jiki " ; // 告知時期
	sql += "  ,'' as suryo " ; // 数量
	sql += "  ,e.chiiki " ; // 地域
	sql += "  ,ko01.cd_naiyo as chiiki_nm " ; 
	sql += "  ,e.ok_ng " ;
	sql += "  ,ko02.cd_naiyo as ok_ng_nm " ; 
	sql += "  ,concat(e.kikaku_edaban, ko02.cd_naiyo) as chk_no " ;
	sql += "  ,to_char(e.koushin_bi, 'YYYYMMDDHH24MISSMS') as koushin_bi ";	// 排他制御用
	sql += " FROM lo_t_kikaku_eizo as e " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko01.cd_id = e.chiiki ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko02.cd_id = e.ok_ng ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ;
	sql += " ORDER BY e.kikaku_edaban " ;


	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 数値にカンマをつける
    var obj2 = {};
    obj2 = setComma(result.data);
    result.data = obj2;
    
    return result;
}
/**
 * 数値にカンマ追加
 * @param {object} 検索データ
 * @returns {object} 変換後データ
 */
function setComma(data) {
	
	var ret = "";
	var ret2 = "";
	var ret3 = "";
	var ret4 = "";
	var ret5 = "";
	var ret6 = "";
	for (var i = 0;i < data.length;i++){
		// 税抜上代（商品）
		ret = data[i].zeinuki_jodai;
		if (typeof ret === "undefined"){
			ret ="";
		} else {
			ret = comma(ret);
		}
		data[i].zeinuki_jodai = ret;
		
		// 目標販売数（商品・楽曲）
		ret2 = data[i].mokuhyo_hambai_su;
		if (typeof ret2 === "undefined"){
			ret2 ="";
		} else {
			ret2 = comma(ret2);
		}
		data[i].mokuhyo_hambai_su = ret2;

		// 価格（楽曲）
		ret3 = data[i].kakaku;
		if (typeof ret3 === "undefined"){
			ret3 ="";
		} else {
			ret3 = comma(ret3);
		}
		data[i].kakaku = ret3;
		
		// 価格（イベント）
		ret4 = data[i].ticket_kakaku;
		if (typeof ret4 === "undefined"){
			ret4 ="";
		} else {
			ret4 = comma(ret4);
		}
		Debug.console(ret3);
		data[i].ticket_kakaku = ret4;

		// 初回生産予定数（商品）
		ret5 = data[i].shokai_seisanyotei_su;
		if (typeof ret5 === "undefined"){
			ret5 ="";
		} else {
			ret5 = comma(ret5);
		}
		data[i].shokai_seisanyotei_su = ret5;
		
		// 利用料（コラボ）
		ret6 = data[i].riyou_ryo;
		if (typeof ret6=== "undefined"){
			ret6 ="";
		} else {
			ret6 = comma(ret6);
		}
		data[i].riyou_ryo = ret6;
	}
	return data;
}

// 3桁カンマ区切りとする.
function comma(num) {
    var s = String(num).split('.');
    var ret = String(s[0]).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    if (s.length > 1 && s[1].length > 0) {
        ret += '.' + s[1];
    }
    return ret;
}

/**
 * ワークフロー用パラメータの初期設定
 * @param {String} 企画id
 */
function setWorkflowOpenPage(kikakuId) {

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
        imwFlowId               : Constant.LO_FLOW_KIKAKU,	//フローID 
        imwFlowVersionId        : '',		//フローバージョンID
        imwCallOriginalPagePath : 'lo/contents/screen/planning_form_new',	//呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString({'kikaku_id':kikakuId}),	//呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
    // ノード処理処理者の設定
    $wf_data.imwNodeSetting = Content.executeFunction("lo/common_libs/lo_common_fnction"
    	,"nodeSetteing", kikakuId, Constant.LO_TICKET_ID_HEAD_KIKAKU);
}

/**
 * 案件情報の設定
 * @param {String} 企画id
 * @returns {boolean} true:案件あり false:案件なし
 */
function setMatterInfo(kikakuId) {
	
	// 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.string(kikakuId));
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    // 存在しなければfalse
    if (result.countRow < 1){
    	return false;
    }
    
    //案件id取得
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
        imwCallOriginalPagePath : 'lo/contents/screen/kikaku/planning_list_new', //呼出元ページパス
        imwCallOriginalParams   : ImJson.toJSONString({'kikaku_id':kikakuId}),    //呼出元パラメータ
        imwAuthUserCodeList     : '',
        imwNodeSetting			: ''	
    };
    
    // ノード処理処理者の設定
    $wf_data.imwNodeSetting = Content.executeFunction("lo/common_libs/lo_common_fnction"
    	,"nodeSetteing", kikakuId, Constant.LO_TICKET_ID_HEAD_KIKAKU);
   
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
    for(var i = 0; i < userlist.data.length; i++) {
	   if (user_cd == userlist.data[i].authUserCode ){
		   $proc_user_flg = true;
		   break;
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
	node[Constant.LO_NODE_APPR_LAST] = Constant.LO_NODE_APPLY;	// 最終承認→申請
	
	var backnode =node[nodeid];
	return backnode;
}

/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_ids = [ "KK02E001", "KK02E002", "KK02E003", "KK02E022" ];
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}

/**
 * タイトルの存在確認
 * @param {String} title_cd
 * @returns boolean
 */
function chkTitle(titleCd){
	 // タイトルマスタの確認
	var strParamTitle=[];
	strParamTitle.push(DbParameter.string(titleCd));
    var tiSql = "select 1 from lo_m_title where title_cd = ? and sakujo_flg ='0'";
    	
    var db = new TenantDatabase();
    var tiResult = db.select(tiSql,strParamTitle);// 戻り値
   
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
	//Logger.getLogger().info(' [retrieveSeikyushoSofusakiList]　契約内容確認表示 request ' + ImJson.toJSONString(request, true));
	if ('kaisha_id' in request) {
		return Content.executeFunction("lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_data_retriever", "retrieveSeikyushoSofusakiList", request.kaisha_id);
	}
}
