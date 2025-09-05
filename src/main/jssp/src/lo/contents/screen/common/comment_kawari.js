var $commentList = [];
var $hasComment = false;
var $yobi001 = "";
var $yobi002 = "";
var $yobi003 = "";
var $yobi001Disp = false;
var $yobi002Disp = false;
var $yobi003Disp = false;

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
}

function getComment(ticketId) {
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
					
					switch(dataList[idx].node_id){
						case Constant.LO_NODE_APPLY:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPLY_KAWARI;
							break;
						case Constant.LO_NODE_KIAN:
							commentObj.nodeName = Constant.LO_NAME_NODE_KIAN;
							break;
						case Constant.LO_NODE_APPR_1:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPR_1;
							break;
						case Constant.LO_NODE_APPR_2:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPR_2;
							break;
						case Constant.LO_NODE_APPR_3:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPR_3;
							break;
						case Constant.LO_NODE_APPR_4:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPR_4;
							break;
						case Constant.LO_NODE_APPR_5:
							commentObj.nodeName = Constant.LO_NAME_NODE_APPR_5;
							break;
						case Constant.LO_NODE_LAST_CONFIRM:
							commentObj.nodeName = Constant.LO_NAME_NODE_LAST_CONFIRM;
							break;
						default:
							commentObj.nodeName = "";
							break;						
					
					}
					
					
					commentObj.torokushaName = dataList[idx].touroku_sha_nm;
					commentObj.torokuDt = dataList[idx].touroku_bi;
					commentObj.naiyo = dataList[idx].naiyo;
					commentObj.yobi001 = dataList[idx].yobi001;
					commentObj.yobi002 = dataList[idx].yobi002;
					commentObj.yobi003 = dataList[idx].yobi003;
					
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
	sql += "   cmt.node_id AS node_id, ";
	sql += "   cmt.touroku_sha_nm, ";
	sql += "   TO_CHAR(cmt.touroku_bi, 'YYYY/MM/DD HH24:MI:SS') AS touroku_bi, ";
	sql += "   cmt.naiyo, ";
	sql += "   cmt.yobi001, ";
	sql += "   cmt.yobi002, ";
	sql += "   cmt.yobi003, ";
	sql += "   CASE WHEN tfle.file_name IS NULL THEN '' ELSE tfle.file_name END AS file_name, ";
	sql += "   CASE WHEN tfle.file_path IS NULL THEN '' ELSE tfle.file_path END AS file_path ";
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
