var $commentList = [];
var $hasComment = false;
var $yobi001 = "";
var $yobi002 = "";
var $yobi003 = "";
var $yobi001Disp = false;
var $yobi002Disp = false;
var $yobi003Disp = false;
var $tempFileDisp = true;

function init(request) {
	if ("ticketId" in request) {
		getComment(request.ticketId);
		if ($commentList.length > 0) {
			$hasComment = true;
		}
	}
	
	if ("yobi001" in request) {
		$yobi001 = request.yobi001;
		$yobi001Disp = true;
	}
	if ("yobi002" in request) {
		$yobi002 = request.yobi002;
		$yobi002Disp = true;
	}
	if ("yobi003" in request) {
		$yobi003 = request.yobi003;
		$yobi003Disp = true;
	}
	if ("tempFileNoDisp" in request) {
		$tempFileDisp = false;
	}
}

function getComment(ticketId) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	if (ticketId && ticketId.length > 0) {
		// TODO:ライセンシーに見せるコメントをどのように判断するか検討が必要
		// TODO:ライセンシーとやりとりしている担当者たちをどのように判断できるか
		var commentdb = new TenantDatabase();
		var commentSql = commentSearchSql();
		var result = commentdb.select(commentSql, [ DbParameter.string(ticketId) ]);

		if (result.countRow > 0) {
			var dataList = result.data;
			var beforeCommentId = "";
			
			// 添付ファイルをまとめるようにリストを作成
			for(var idx = 0; idx < dataList.length; idx++) {
				var commentObj = {
					commentId : "",
					isLicenseProduction : false,
					torokushaName : "",
					torokuDt : "",
					naiyo : "",
					fileList : []
				};
	
				var fileObj = {
					fileName : "",
					filePath : ""
				};
				
				fileObj.fileName = dataList[idx].file_name;
				fileObj.filePath = dataList[idx].file_path;
				
				if (beforeCommentId != dataList[idx].comment_id) {
					commentObj.commentId = dataList[idx].comment_id;
					commentObj.isLicenseProduction = dataList[idx].is_license_procuction;
					commentObj.torokushaName = dataList[idx].touroku_sha_nm;
					if (dataList[idx].is_license_procuction) {
						commentObj.shozoku = "ライセンスプロダクション";
					} else {
						commentObj.shozoku = "ライセンシー";
					}
					commentObj.sosa = dataList[idx].sosa_nm;
					commentObj.yakuwari = dataList[idx].yakuwari_nm;
					commentObj.torokuDt = dataList[idx].touroku_bi;
					commentObj.naiyo = dataList[idx].naiyo;
					commentObj.yobi001 = dataList[idx].yobi001;
					commentObj.yobi002 = dataList[idx].yobi002;
					commentObj.yobi003 = dataList[idx].yobi003;
					commentObj.nodeId = dataList[idx].node_id;
					commentObj.nextNodeId = dataList[idx].next_node_id,
					commentObj.status = dataList[idx].status;
					commentObj.tourokushaCd = dataList[idx].touroku_sha;
					
					if (dataList[idx].file_name != "" && dataList[idx].file_path != "") {
						commentObj.fileList.push(fileObj);
					}
					
					$commentList.push(commentObj);
				} else {
					if (dataList[idx].file_name != "" && dataList[idx].file_path != "") {
						var commentListIndex = $commentList.length - 1;
						$commentList[commentListIndex].fileList.push(fileObj);
					}
				}
				
				beforeCommentId = dataList[idx].comment_id;
			}

			for (var idx = 0; idx < $commentList.length; idx++) {
				if (!$commentList[idx].yakuwari && !$commentList[idx].sosa) {
					// コメントトランに役割と操作が登録されていない場合は補完する
					if (isNormalWf(ticketId) && !$commentList[idx].nodeId && $commentList[idx].status == Constant.LO_COMMENT_STATUS) {
						// 通常の企画か許諾かつ、ノードが取得ないかつ、ステータスが社内修正の場合はBNE担当
						$commentList[idx].yakuwari = Constant.LO_NAME_NODE_APPR_0;
					} else {
						$commentList[idx].yakuwari = getYakuwariName($commentList[idx].nodeId,
																		$commentList[idx].nextNodeId,
																		$commentList[idx].status,
																		ticketId,
																		$commentList[idx].tourokushaCd);
					}
					
					$commentList[idx].sosa = getSosaName($commentList[idx].status,
															$commentList[idx].nodeId,
															ticketId,
															$commentList[idx].tourokushaCd);
				}
			}
		}
	}
	return $commentList;
}

function commentSearchSql() {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// ライセンシーか判断
	var flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		[Constant.LO_GROUP_CD_LICENSEE]);
	
	var sql = "";
	sql += " SELECT ";
	sql += "   cmt.comment_id, ";
	sql += "   CASE ";
	sql += "       WHEN cmt.public_group = '" + Constant.LO_GROUP_CD_LICENSEE + "' THEN false ";
	sql += "       ELSE true END AS is_license_procuction, ";
	sql += "   cmt.touroku_sha_nm, ";
	sql += "   TO_CHAR(cmt.touroku_bi, 'YYYY/MM/DD HH24:MI:SS') AS touroku_bi, ";
	sql += "   cmt.naiyo, ";
	sql += "   cmt.yobi001, ";
	sql += "   cmt.yobi002, ";
	sql += "   cmt.yobi003, ";
	sql += "   CASE WHEN tfle.file_name IS NULL THEN '' ELSE tfle.file_name END AS file_name, ";
	sql += "   CASE WHEN tfle.file_path IS NULL THEN '' ELSE tfle.file_path END AS file_path, ";
	sql += "   cmt.node_id, ";
	sql += "   cmt.next_node_id, ";
	sql += "   cmt.status, ";
	sql += "   cmt.touroku_sha, ";
	sql += "   cmt.sosa_nm, ";
	sql += "   cmt.yakuwari_nm ";
	sql += " FROM ";
	sql += "   lo_t_comment cmt ";
	sql += "   LEFT JOIN lo_t_comment_tempu_file tfle ";
	sql += "     ON cmt.comment_id = tfle.comment_id ";
	sql += "     AND tfle.sakujo_flg = '0' ";
	sql += " WHERE ";
	sql += "   cmt.sakujo_flg = '0' ";
	sql += "   AND cmt.ticket_id = ? ";
	sql += "   AND cmt.status <> '" + Constant.LO_WF_STATUS_KANRYOGO + "' ";
	
	// ライセンシーには社内のコメントを見せない(申請時のコメント・完了時のコメント・修正依頼で戻ってきたときのコメント・否決時のコメント取得)
	if (flg){
		sql += "   AND (cmt.node_id = '" + Constant.LO_NODE_APPLY + "'";
		sql += "     OR cmt.node_id = '" + Constant.LO_NODE_APPR_LAST + "'";
		sql += "     OR cmt.next_node_id = '" + Constant.LO_NODE_APPLY + "'";
		sql += "     OR cmt.status = '" + Constant.LO_WF_STATUS_HIKETSU + "'";
		sql += "     OR cmt.status = '" + Constant.LO_COMMENT_STATUS + "')";
	}

	sql += " ORDER BY cmt.touroku_bi ";

	return sql;
}

/**
 * 役割名を取得する
 * @param nodeId ノードID
 * @param nextNodeId 次ノードID
 * @param status ステータス
 * @param ticketId チケットID
 * @param userCd ユーザコード
 * @return 役割名
 */
function getYakuwariName(nodeId, nextRouteId, status, ticketId, userCd) {
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "getYakuwari", nodeId, nextRouteId, status, ticketId, userCd);
}

/**
 * 操作名を取得する
 * @param status ステータス
 * @param nodeId ノードID
 * @param ticketId チケットID
 * @param userCd ユーザコード
 * @return 操作名
 */
function getSosaName(status, nodeId, ticketId, userCd) {
	Constant.load("lo/common_libs/lo_const");

	if (nodeId == Constant.LO_NODE_APPLY) {
		// ノードが申請の場合
		if (status == Constant.LO_WF_STATUS_SHINSEI || status == Constant.LO_WF_STATUS_SAISHINSEI) {
			// ステータスが申請と再申請の場合
			if (isKawariWf(ticketId)) {
				// 代わり承認WFの場合
				if (isKawariInputGroup(userCd)) {
					// 代わり承認WF入力グループに所属している場合
					return "送付";
				} else {
					// 代わり承認WF入力グループに所属していない場合は
					return "起案";
				}
			} else if (isNormalWf(ticketId)) {
				// 通常の企画と許諾の場合
				return "提出";
			}
		} else if (status == "discontinue") {
			// 辞退の場合
			return "辞退";
		}
	} else if (nodeId == Constant.LO_NODE_APPR_0 || nodeId == Constant.LO_NODE_KIAN) {
		// ノードがBNE担当、起案の場合
		if (status == Constant.LO_WF_STATUS_SHONIN) {
			// ステータスが承認の場合
			return "起案";
		} else if (status == Constant.LO_WF_STATUS_SASHIMODOSHI) {
			// ステータスが差戻の場合
			return "修正依頼";
		} else if (status == Constant.LO_WF_STATUS_HIKETSU) {
			// ステータスが否決の場合
			return "否決";
		}
	} else if (nodeId == Constant.LO_NODE_APPR_LAST || nodeId == Constant.LO_NODE_LAST_CONFIRM) {
		// ノードがBNE担当、起案の場合
		if (status == Constant.LO_WF_STATUS_SHONIN) {
			// ステータスが承認の場合
			return "完了";
		}
	} else if (!nodeId) {
		// ノードが取得できない場合
		if (status == Constant.LO_COMMENT_STATUS) {
			// ステータスが社内修正の場合
			return "社内修正";
		}
	}

	// 上記にあてはまらない場合はステータスから判定
	var processObj = {};
	processObj[Constant.LO_WF_STATUS_SHINSEI] = "申請";
	processObj[Constant.LO_WF_STATUS_SASHIMODOSHI] = "差戻";
	processObj[Constant.LO_WF_STATUS_SAISHINSEI] = "再申請";
	processObj[Constant.LO_WF_STATUS_SHONIN] = "承認";
	processObj[Constant.LO_WF_STATUS_HIKETSU] = "否決";
	processObj[Constant.LO_WF_STATUS_KANRYOGO] = "完了";
	processObj[Constant.LO_WF_STATUS_PULLBACK] = "取戻";
	processObj[Constant.LO_WF_STATUS_SENDBACK_TO_PULLBACK] = "取戻";

	if (processObj[status]) {
		return processObj[status];
	}
	return "";
}

/**
 * 通常の企画、許諾、契約か判定する
 * @param ticketId チケットID
 * @return 判定結果
 */
function isNormalWf(ticketId) {
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "isNormalWf", ticketId);
}

/**
 * 代わり承認の企画、許諾、LPか判定する
 * @param ticketId チケットID
 * @return 判定結果
 */
function isKawariWf(ticketId) {
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "isKawariWf", ticketId);
}

/**
 * 代わり承認WFの入力グループが判定する
 * @param user_cd ユーザコード
 * @return 判定結果
 */
function isKawariInputGroup(user_cd) {
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "isKawariInputGroup", user_cd);
}

