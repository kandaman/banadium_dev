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
var $fileList = [];

function init(request) {

	if ("hansokubutsu_id" in request) {
		// TODO:素材費IDがパラメータにあれば、編集画面として開く
		// TODO:パラメータにあるが、情報が取得できない場合は別途実装する
		var db = new TenantDatabase();
		var sql = sozaihiSearchSql();
		var result = db.select(sql, [ DbParameter.string(request.hansokubutsu_id) ]);
		if (result.countRow > 0) {
			var data = result.data[0];
			$form.data = data;
			if (data.usho_flg == "1") {
				$form.usho_flg_on = true;
				$form.usho_flg_off = false;
			} else {
				$form.usho_flg_on = false;
				$form.usho_flg_off = true;
			}
			var imageFileSql = "SELECT file_name, file_path FROM lo_t_hansokubutsu_sozai_file WHERE sakujo_flg = '0' AND hansokubutsu_id = '" + request.hansokubutsu_id + "'";
			var imageFileResult = db.select(imageFileSql);
			if (imageFileResult.countRow > 0) {
				for (var fIdx = 0; fIdx < imageFileResult.data.length; fIdx++) {
					var fileObj = {
						fileName : imageFileResult.data[fIdx].file_name,
						filePath : imageFileResult.data[fIdx].file_path
					};
					$fileList.push(fileObj);
				}
			}

			$ticketId = data.hansokubutsu_id;
		} else {
			$form.data = {};
			$form.data.hansokubutsu_id = "";
			$form.data.himozuke_id = "";
			$form.usho_flg_on = false;
			$form.usho_flg_off = true;
		}
	} else {
		$form.data = {};
		$form.data.hansokubutsu_id = "";
		$form.data.himozuke_id = "";
		$form.usho_flg_on = false;
		$form.usho_flg_off = true;
	}
	
	
	// TODO:仮に設定する
	getUserInfo();
	if ($userInfo.lisenceProductionFlg) {
		$form.hansokubutsu_status = "受付";
	} else {
		$form.hansokubutsu_status = "一時保存";
	}

	// TODO:ユーザコンテキストから会社コード(ライセンシー)を条件に参照可能か確認
	// TODO:パブリックグループによって、表示内容を変化
	
}

function hansokubutsuToroku(inputContents) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var updFlg = false;
	var uniqueHansokubutsuId = "";
	// トランザクション開始
	Transaction.begin(function() {
		// DB接続
		var db = new TenantDatabase();
		
		var whereObj = [];
		if (inputContents.formParams.hansokubutsu_id && inputContents.formParams.hansokubutsu_id.length > 0) {
			updFlg = true;
			uniqueHansokubutsuId = inputContents.formParams.hansokubutsu_id;
		} else {
			// TODO：仮に一意の値を設定する
			uniqueHansokubutsuId = "HA_" + Identifier.get();
		}

		getUserInfo();
		
		if (updFlg) {
			var updateHansokubutsuiObj = {};
			if($userInfo.lisenceProductionFlg) {
				updateHansokubutsuiObj.bne_tantou_sha = $userInfo.userName;
				updateHansokubutsuiObj.kakunin_bi = DateTimeFormatter.format("yyyy/MM/dd", new Date());
				updateHansokubutsuiObj.usho_flg = (inputContents.formParams.usho_flg == "usho") ? "1" : "0";
				// TODO：イメージ画像は削除に対応する必要があるため、SELECTしてパラメータにないものは削除する
				
			} else {
				updateHansokubutsuiObj.hansokubutsu_nm = inputContents.formParams.hansokubutsu_nm;
				updateHansokubutsuiObj.shiyo_jiki = inputContents.formParams.shiyo_jiki;
				updateHansokubutsuiObj.yotei_suryo = (inputContents.formParams.yotei_suryo == "") ? null : parseInt(inputContents.formParams.yotei_suryo, 10);
				updateHansokubutsuiObj.siyo_haihu_yotei_basho = inputContents.formParams.siyo_haihu_yotei_basho;
				updateHansokubutsuiObj.shurui_su = (inputContents.formParams.shurui_su == "") ? null : parseInt(inputContents.formParams.shurui_su, 10);
				updateHansokubutsuiObj.keitai = inputContents.formParams.keitai;
				updateHansokubutsuiObj.senden_hansoku_keikaku = inputContents.formParams.senden_hansoku_keikaku;
				updateHansokubutsuiObj.shinsei_bi = DateTimeFormatter.format("yyyy/MM/dd", new Date());
			}
			updateHansokubutsuiObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", updateHansokubutsuiObj, false);
			var whereObject = [ DbParameter.string(uniqueHansokubutsuId) ];
			
			// TODO：エラーをハンドリングする
			db.update('lo_t_hansokubutu', updateHansokubutsuiObj, 'hansokubutsu_id = ?', whereObject);
		} else {
			var insertHansokubutsuObj = {
				hansokubutsu_id : uniqueHansokubutsuId,
				hansokubutsu_nm : inputContents.formParams.hansokubutsu_nm,
				shiyo_jiki : inputContents.formParams.shiyo_jiki,
				yotei_suryo : (inputContents.formParams.yotei_suryo == "") ? null : parseInt(inputContents.formParams.yotei_suryo, 10),
				siyo_haihu_yotei_basho : inputContents.formParams.siyo_haihu_yotei_basho,
				shurui_su : (inputContents.formParams.shurui_su == "") ? null : parseInt(inputContents.formParams.shurui_su, 10),
				keitai : inputContents.formParams.keitai,
				senden_hansoku_keikaku : inputContents.formParams.senden_hansoku_keikaku,
				shinsei_bi : DateTimeFormatter.format("yyyy/MM/dd", new Date())
			};
			insertHansokubutsuObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", insertHansokubutsuObj, true);
			
			// TODO：エラーをハンドリングする
			db.insert("lo_t_hansokubutu", insertHansokubutsuObj);
		}
		
		var imageFileDelObj = {
			sakujo_flg : "1"
		};
		imageFileDelObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", imageFileDelObj, false);

		// ファイルの削除はトランザクションでは戻らないため、DB系の処理が完了後にまとめて実施する
		var removePublicFileList = [];
		var createPublicFileList = [];

		var imageFileSql = "SELECT file_path FROM lo_t_hansokubutsu_sozai_file WHERE sakujo_flg = '0' AND hansokubutsu_id = '" + uniqueHansokubutsuId + "'";
		var imageFileResult = db.select(imageFileSql);
		if (imageFileResult.countRow > 0) {
			// 除外されたファイルをテーブルから論理削除する
			for (var imgIdx = 0; imgIdx < imageFileResult.data.length; imgIdx++) {
				var delFlg = true;
				for (var newImgIdx = 0; newImgIdx < inputContents.imageGazoList.length; newImgIdx++) {
					if (imageFileResult.data[imgIdx].file_path == inputContents.imageGazoList[newImgIdx].uniquefileName) {
						delFlg = false;
					}
				}
				
				if (delFlg) {
					removePublicFileList.push(imageFileResult.data[imgIdx].file_path);

					// ファイルをテーブルから論理削除
					var imageFileDelWhereObj = [
						DbParameter.string(uniqueHansokubutsuId),
						DbParameter.string(imageFileResult.data[imgIdx].file_path)
					];
					
					// TODO：エラーをハンドリングする
					db.update('lo_t_hansokubutsu_sozai_file', imageFileDelObj, 'hansokubutsu_id = ? AND file_path = ?', imageFileDelWhereObj);
				}
			}

			// 未登録のファイルを登録し、パブリックストレージに移動する
			for (var newImgIdx = 0; newImgIdx < inputContents.imageGazoList.length; newImgIdx++) {
				var insFlg = true;
				for (var imgIdx = 0; imgIdx < imageFileResult.data.length; imgIdx++) {
					if (inputContents.imageGazoList[newImgIdx].uniquefileName == imageFileResult.data[imgIdx].file_path) {
						insFlg = false;
					}
				}
				if (insFlg) {
					newFileInsert(uniqueHansokubutsuId, inputContents.imageGazoList[newImgIdx].fileName, inputContents.imageGazoList[newImgIdx].uniquefileName, db);
					createPublicFileList.push(inputContents.imageGazoList[newImgIdx].uniquefileName);
				}
				
			}
		} else {
			for (var newImgIdx = 0; newImgIdx < inputContents.imageGazoList.length; newImgIdx++) {
				newFileInsert(uniqueHansokubutsuId, inputContents.imageGazoList[newImgIdx].fileName, inputContents.imageGazoList[newImgIdx].uniquefileName, db);
				createPublicFileList.push(inputContents.imageGazoList[newImgIdx].uniquefileName);
			}
		}

		if (inputContents.formParams.himozukeId == "" && inputContents.formParams.kikakuId != "") {
			var insertHimozukeObj = {
				id : "K_H_" + Identifier.get(),
				kikaku_id : inputContents.formParams.kikakuId,
				hansokubutsu_id : uniqueHansokubutsuId
			};
			insertHimozukeObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", insertHimozukeObj, true);

			// TODO：エラーをハンドリングする
			db.insert("lo_t_kikaku_hansokubutu_himozuke", insertHimozukeObj);
		} else {
			if (inputContents.formParams.kikakuId != "") {
				var updateHimozukeObj = [
					DbParameter.string(inputContents.formParams.kikakuId),
					DbParameter.string($userInfo.userName),
					DbParameter.date(new Date())
				];
				var whereHimozukeObject = [ DbParameter.string(inputContents.formParams.himozukeId), DbParameter.string(uniqueHansokubutsuId) ];
				// TODO：エラーをハンドリングする
				db.update('lo_t_kikaku_hansokubutu_himozuke', updateHimozukeObj, 'id = ? AND hansokubutu_id = ?', whereHimozukeObject);
			}
			
		}

		
		
		// コメントの登録
		if (inputContents.formModalParams.comment.length > 0 || inputContents.tempushiryoList.length > 0) {
			var uniqueCommentId = "COM_" + Identifier.get();
			// TODO:ユーザコンテキストから登録者と更新者をとる(コードと指名の登録が必要と思われる)
			var commentObj = {
				ticket_id : uniqueHansokubutsuId,
				comment_id : uniqueCommentId,
				naiyo : inputContents.formModalParams.comment,
				public_group : ($userInfo.lisenceProductionFlg) ? Constant.LO_GROUP_CD_PRODUCTION : Constant.LO_GROUP_CD_LICENSEE,
				touroku_sha_nm : $userInfo.userName
			};
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
				};
				commentFiles = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", commentFiles, false);
			
				// TODO：エラーをハンドリングする
				db.insert("lo_t_comment_tempu_file", commentFileObj);
			}
		}
		
		// ファイルの削除
		// TODO：ファイルを物理削除するかは要検討
		for (var delIdx = 0; delIdx < removePublicFileList.length; delIdx++) {
			// ファイルの物理削除
			var targetFile = Constant.LO_PATH_PUBLIC_STORAGE + removePublicFileList[delIdx];
			var publicStrageFile = new PublicStorage(targetFile);
			if (publicStrageFile.exists()) {
				publicStrageFile.remove(false);
			}
		}
		
		// ファイルをセッションストレージからパブリックストレージへコピー
		for (var creIdx = 0; creIdx < createPublicFileList.length; creIdx++) {
			var sessionFile = Constant.LO_PATH_SESSION_STORAGE + createPublicFileList[creIdx];
			var sessionStorage = new SessionScopeStorage(sessionFile);

			// セッションストレージにファイルが無ければエラー
			if (sessionStorage.isFile()) {
				// パブリックストレージ取得
				var dir = Constant.LO_PATH_SESSION_STORAGE;
				var publicDir = new PublicStorage(dir);
				if (!publicDir.isDirectory()) {
					// ディレクトリが存在しなければ作成
					publicDir.makeDirectories();
				}

				// パブリックストレージにコピー
				// TODO：ライセンシーごとにディレクトリを分けて、他のライセンシーから参照できないようにする
				var publicStrageFile = dir + createPublicFileList[creIdx];
				var publicStorage = new PublicStorage(publicStrageFile);
				sessionStorage.copy(publicStorage, true);
			} else {
				// TODO:エラー処理
			}
		}
		
	});
}

function newFileInsert(uniqueHansokubutsuId, fileName, uniquefileName, db) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var imageFileInsertObj = {
		hansokubutsu_id : uniqueHansokubutsuId,
		file_name : fileName,
		file_path : uniquefileName
	};
	imageFileInsertObj = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", imageFileInsertObj, true);
	// TODO：エラーをハンドリングする
	db.insert("lo_t_hansokubutsu_sozai_file", imageFileInsertObj);
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
	sql += "   hns.hansokubutsu_id, ";
	sql += "   hns.hansokubutsu_nm, ";
	sql += "   hns.shiyo_jiki, ";
	sql += "   hns.yotei_suryo, ";
	sql += "   hns.siyo_haihu_yotei_basho, ";
	sql += "   hns.shurui_su, ";
	sql += "   hns.keitai, ";
	sql += "   hns.senden_hansoku_keikaku, ";
	sql += "   hns.shiyo_sozai, ";
	sql += "   hns.image_gazo, ";
	sql += "   hns.image_gazo_file_path, ";
	sql += "   hns.usho_flg, ";
	sql += "   hns.shinsei_bi, ";
	sql += "   hns.kakunin_bi, ";
	sql += "   hns.bne_tantou_sha, ";
	sql += "   kik.kikaku_id, ";
	sql += "   kik.kikaku_nm, ";
	sql += "   kik.title_nm, ";
	sql += "   kik.kaisha_nm AS kikaku_kaisha_nm, ";
	sql += "   kik.busyo_nm AS kikaku_busyo_nm, ";
	sql += "   kik.tantou_sha AS kikaku_tantou_sha, ";
	sql += "   COALESCE(hiz.id, '') AS himozuke_id ";
	sql += " FROM ";
	sql += "   lo_t_hansokubutu hns ";
	sql += "   LEFT JOIN lo_t_kikaku_hansokubutu_himozuke hiz ";
	sql += "     ON hns.hansokubutsu_id = hiz.hansokubutu_id ";
	sql += "     AND hiz.sakujo_flg = '0' ";
	sql += "   LEFT JOIN lo_t_kikaku kik ";
	sql += "     ON hiz.kikaku_id = kik.kikaku_id ";
	sql += "     AND kik.sakujo_flg = '0' ";
	sql += " WHERE ";
	sql += "   hns.sakujo_flg = '0' ";
	sql += "   AND hns.hansokubutsu_id = ? ";
	
	return sql;
}
