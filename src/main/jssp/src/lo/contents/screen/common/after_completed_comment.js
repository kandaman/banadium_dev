Constant.load("lo/common_libs/lo_const");
var $commentList = [];
var $hasComment = false;
var $ticketId = "";
var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数

function init(request) {
	
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

	if ("ticketId" in request) {
		$ticketId = request.ticketId;
		getComment($ticketId);
		if ($commentList.length > 0) {
			$hasComment = true;
		}
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
					commentObj.torokushaName = dataList[idx].touroku_sha_nm;
					commentObj.torokuDt = dataList[idx].touroku_bi;
					commentObj.naiyo = dataList[idx].naiyo;
					
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
	sql += "   cmt.touroku_sha_nm, ";
	sql += "   TO_CHAR(cmt.touroku_bi, 'YYYY/MM/DD HH24:MI:SS') AS touroku_bi, ";
	sql += "   cmt.naiyo, ";
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
	sql += "   AND cmt.status = '" + Constant.LO_WF_STATUS_KANRYOGO + "' ";
	
	// TODO 見せるユーザー決まり次第絞り込む
	if (flg){
		
	}

	sql += " ORDER BY cmt.touroku_bi ";

	return sql;
}

function save(params) {

	var userParameter = {};
	userParameter.item_matterName = params.ticket_id;
	userParameter.item_comment = params.naiyo;
	userParameter.item_tempu_files = params.item_tempu_files;
	
	var args = {};
	args.nodeId = null;
	args.resultStatus = Constant.LO_WF_STATUS_KANRYOGO;
	
	// コメント登録
	var ret = Content.executeFunction("lo/common_libs/lo_common_fnction", "setWfComment",args,userParameter);
	
	
	// 完了後メール送信------
	if (!ret.error){
		var address = [];

		// ライセンスプロダクションか判断
		var flg = Content.executeFunction("lo/common_libs/lo_common_fnction",
			"chkUsergroup",[Constant.LO_GROUP_CD_PRODUCTION]);

		if (flg){
			// 申請ユーザにメール送信
			// 文書idとノードidから申請者のメールアドレス取得
			address = Content.executeFunction("lo/common_libs/lo_send_mail",
				"getNodeUserAddress",params.ticket_id,Constant.LO_NODE_APPLY);
		}else{
			// ip担当グループにメール送信
			// 文書番号からグループに紐づくユーザのメールアドレスを取得
			var grouplist = Content.executeFunction("lo/common_libs/lo_common_fnction", "getIpGroupCd",params.ticket_id);
			address = Content.executeFunction("lo/common_libs/lo_send_mail", "getGroupUserAddress",grouplist);
		}
		
		//ユーザコード
		var userContext = Contexts.getUserContext();
		var userCd = userContext.userProfile.userCd;

		// 送信用パラメータ作成
		var param = {
			ticket_id :params.ticket_id, // 文書番号
			mail_id : Constant.LO_MAIL_ID_END_AFTER,    //メールid 処理依頼
			to_address : address,                       //送信先アドレス
			comment : params.naiyo,      				//コメント
			execUserCd : userCd    //実行者コード
		}
		// メール送信
		var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",param);
	}
	
	return ret
	
	

}

