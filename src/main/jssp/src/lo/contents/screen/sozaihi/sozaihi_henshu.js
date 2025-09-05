// 画面表示用
var $form = {};
var $userInfo = {
	userId : "",
	companyName : "",
	departmentName : "",
	userName : "",
	lisenceProductionFlg : false
};
var $ticketId = "";

function init(request) {

	if ("sozaihi_id" in request) {
		// TODO:素材費IDがパラメータにあれば、編集画面として開く
		// TODO:パラメータにあるが、情報が取得できない場合は別途実装する
		var db = new TenantDatabase();
		var sql = sozaihiSearchSql();
		var result = db.select(sql, [ DbParameter.string(request.sozaihi_id) ]);
		if (result.countRow > 0) {
			var data = result.data[0];
			$form.sozaihi_id = data.sozaihi_id;
			$form.sozai_irai_nm = data.sozai_irai_nm;
			$form.siyo_sozaihi_irai_naiyo = data.siyo_sozaihi_irai_naiyo;
			// TODO:描下ろし希望有無のカラムがないため固定値を仕込む
//			$form.kakioroshiKiboAri = (data.kakioroshi_kibo_ari_flg == 1) ? true : false;
//			$form.kakioroshiKiboNashi = (data.kakioroshi_kibo_ari_flg == 0) ? true : false;
			$form.kakioroshiKiboAri = true;
			$form.kakioroshiKiboNashi = false;
			$form.iraiKaisuFirst = (data.sai_irai_flg == 0) ? true : false;
			$form.iraiKaisuMore = (data.sai_irai_flg == 1) ? true : false;
			$form.shiharai_kigen_ymd = data.shiharai_kigen_ymd;
			$form.shiyo_tensu = data.shiyo_tensu;
			$form.sozai_mitsumori = data.sozai_mitsumori;
			$form.shinsei_bi = data.shinsei_bi;
			$form.kakunin_bi = data.kakunin_bi;
			$form.bne_tantou_sha = data.bne_tantou_sha;
			$form.kikakuId = data.kikaku_id;
			$form.kikakuMei = data.kikaku_nm;
			$form.taitoruMei = data.title_nm;
			$form.kaishaMei = data.kikaku_kaisha_nm;
			$form.bushoMei = data.kikaku_busyo_nm;
			$form.tantoSha = data.kikaku_tantou_sha;
			$form.himozuke_id = data.himozuke_id;
			
			$ticketId = data.sozaihi_id;
		} else {
			$form.kakioroshiKiboAri = true;
			$form.kakioroshiKiboNashi = false;
			$form.iraiKaisuFirst = true;
			$form.iraiKaisuMore = false;
		}
	} else {
		$form.kakioroshiKiboAri = true;
		$form.kakioroshiKiboNashi = false;
		$form.iraiKaisuFirst = true;
		$form.iraiKaisuMore = false;
	}
	
	
	// TODO:仮に設定する
	getUserInfo();
	if ($userInfo.lisenceProductionFlg) {
		$form.sozaihi_status = "受付";
	} else {
		$form.sozaihi_status = "一時保存";
	}

	// TODO:ユーザコンテキストから会社コード(ライセンシー)を条件に参照可能か確認
	// TODO:パブリックグループによって、表示内容を変化
	

}


function sozaihiToroku(inputContents) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var updFlg = false;
	var uniqueSozaihiId = "";
	// トランザクション開始
	Transaction.begin(function() {
		// DB接続
		var db = new TenantDatabase();
		
		var whereObj = [];
		if (inputContents.formParams.sozaihiId && inputContents.formParams.sozaihiId.length > 0) {
			updFlg = true;
			uniqueSozaihiId = inputContents.formParams.sozaihiId;
		} else {
			// TODO：仮に一意の値を設定する
			uniqueSozaihiId = "SO_" + Identifier.get();
		}

		getUserInfo();
		
		// TODO：詳細資料は削除に対応する必要があるため、SELECTしてパラメータにないものは削除する
		var insertSozaihiObj = {
			sozaihi_id : uniqueSozaihiId,
			sozai_irai_nm : inputContents.formParams.sozai_irai_nm,
			siyo_sozaihi_irai_naiyo : inputContents.formParams.siyo_sozaihi_irai_naiyo,
			sai_irai_flg : (inputContents.formParams.iraiKaisu == "first") ? 0 : 1,
			shiharai_kigen_ymd : inputContents.formParams.shiharaiKigen,
			shiyo_tensu : (inputContents.formParams.shiyo_tensu == "") ? null : parseInt(inputContents.formParams.shiyo_tensu, 10),
			sozai_mitsumori : (inputContents.formParams.sozai_mitsumori == "") ? null : parseInt(inputContents.formParams.sozai_mitsumori, 10),
			shinsei_bi : DateTimeFormatter.format("yyyy/MM/dd", new Date())
		};
		insertSozaihiObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", insertSozaihiObj, true);
		
		var updateSozaihiObj = {};
		if (updFlg) {
			if($userInfo.lisenceProductionFlg) {
				updateSozaihiObj.bne_tantou_sha = $userInfo.userName;
				updateSozaihiObj.kakunin_bi = DateTimeFormatter.format("yyyy/MM/dd", new Date());
			} else {
				updateSozaihiObj.sozai_irai_nm = inputContents.formParams.sozai_irai_nm;
				updateSozaihiObj.siyo_sozaihi_irai_naiyo = inputContents.formParams.siyo_sozaihi_irai_naiyo;
				updateSozaihiObj.sai_irai_flg = (inputContents.formParams.iraiKaisu == "first") ? 0 : 1;
				updateSozaihiObj.shiharai_kigen_ymd = inputContents.formParams.shiharaiKigen;
				updateSozaihiObj.shiyo_tensu = parseInt(inputContents.formParams.shiyo_tensu, 10);
				updateSozaihiObj.sozai_mitsumori = parseInt(inputContents.formParams.sozai_mitsumori, 10);
				updateSozaihiObj.shinsei_bi = DateTimeFormatter.format("yyyy/MM/dd", new Date());
			}
			updateSozaihiObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", updateSozaihiObj, false);
			var whereObject = [ DbParameter.string(uniqueSozaihiId) ];
			
			// TODO：エラーをハンドリングする
			db.update('lo_t_sozaihi', updateSozaihiObj, 'sozaihi_id = ?', whereObject);
		} else {
			// TODO：エラーをハンドリングする
			db.insert("lo_t_sozaihi", insertSozaihiObj);
		}
		
		if (inputContents.formParams.himozukeId == "") {
			var insertHimozukeObj = {
				id : "K_S_" + Identifier.get(),
				kikaku_id : inputContents.formParams.kikakuId,
				sozaihi_id : uniqueSozaihiId
			}
			insertHimozukeObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", insertHimozukeObj, true);

			// TODO：エラーをハンドリングする
			db.insert("lo_t_kikaku_sozai_himozuke", insertHimozukeObj);
		} else {
			if (inputContents.formParams.kikakuId != "") {
				var updateHimozukeObj = {
					kikaku_id : inputContents.formParams.kikakuId
				}
				updateHimozukeObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", updateHimozukeObj, false);
				var whereHimozukeObject = [ DbParameter.string(inputContents.formParams.himozukeId), DbParameter.string(uniqueSozaihiId) ];
				// TODO：エラーをハンドリングする
				db.update('lo_t_kikaku_sozai_himozuke', updateHimozukeObj, 'id = ? AND sozaihi_id = ?', whereHimozukeObject);
			}
			
		}

		
		
		// コメントの登録
		var uniqueCommentId = "COM_" + Identifier.get();
		// TODO:ユーザコンテキストから登録者と更新者をとる(コードと指名の登録が必要と思われる)
		var commentObj = {
			ticket_id : uniqueSozaihiId,
			comment_id : uniqueCommentId,
			naiyo : inputContents.formModalParams.comment,
			public_group : ($userInfo.lisenceProductionFlg) ? Constant.LO_GROUP_CD_PRODUCTION : Constant.LO_GROUP_CD_LICENSEE,
			touroku_sha_nm : $userInfo.userName
		}
		commentObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentObj, true);
		
		// TODO：エラーをハンドリングする
		db.insert("lo_t_comment", commentObj);
		
		// コメントのファイル登録
		var commentFiles = inputContents.tempushiryoList;
		for (var idx = 0; idx < commentFiles.length; idx++) {
			var commentFileObj = {
				comment_id : uniqueCommentId,
				file_name : commentFiles[idx].fileName,
				file_path : commentFiles[idx].uniquefileName
			}
			commentFileObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentFileObj, false);
		
			// TODO：エラーをハンドリングする
			db.insert("lo_t_comment_tempu_file", commentFileObj);
		}
		
		
	});
}

function getUserInfo() {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	// ログインユーザ情報の取得
	var userContext = Contexts.getUserContext();
	$userInfo.userId = userContext.userProfile.userCd;
	$userInfo.userName = userContext.userProfile.userName;

	var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
	$userInfo.companyName = (userCompanyDepartment.companyName != null) ? userCompanyDepartment.companyName : "";
	$userInfo.departmentName = (userCompanyDepartment.departmentName != null) ? userCompanyDepartment.departmentName : "";
	
	var isProduction = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", [Constant.LO_GROUP_CD_PRODUCTION]);

	if (isProduction) {
		$userInfo.lisenceProductionFlg = true;
	}
}

function sozaihiSearchSql() {
	var sql = "";
	sql += " SELECT ";
	sql += "   szi.sozaihi_id, ";
	sql += "   szi.sozai_irai_nm, ";
	sql += "   szi.siyo_sozaihi_irai_naiyo, ";
	sql += "   szi.sai_irai_flg, ";
	sql += "   szi.shiharai_kigen_ymd, ";
	sql += "   szi.shiyo_tensu, ";
	sql += "   szi.sozai_mitsumori, ";
	sql += "   szi.shinsei_bi, ";
	sql += "   szi.kakunin_bi, ";
	sql += "   szi.bne_tantou_sha, ";
	sql += "   kik.kikaku_id, ";
	sql += "   kik.kikaku_nm, ";
	sql += "   kik.title_nm, ";
	sql += "   kik.kaisha_nm AS kikaku_kaisha_nm, ";
	sql += "   kik.busyo_nm AS kikaku_busyo_nm, ";
	sql += "   kik.tantou_sha AS kikaku_tantou_sha, ";
	sql += "   COALESCE(hiz.id, '') AS himozuke_id ";
	sql += " FROM ";
	sql += "   lo_t_sozaihi szi ";
	sql += "   LEFT JOIN lo_t_kikaku_sozai_himozuke hiz ";
	sql += "     ON szi.sozaihi_id = hiz.sozaihi_id ";
	sql += "     AND hiz.sakujo_flg = '0' ";
	sql += "   LEFT JOIN lo_t_kikaku kik ";
	sql += "     ON hiz.kikaku_id = kik.kikaku_id ";
	sql += "     AND kik.sakujo_flg = '0' ";
	sql += " WHERE ";
	sql += "   szi.sakujo_flg = '0' ";
	sql += "   AND szi.sozaihi_id = ? ";
	
	return sql;
}
