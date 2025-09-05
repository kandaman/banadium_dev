
/**
 * 現在ノードの処理権限ユーザのアドレス取得
 * 
 * @param {string} システムマターid
 * @return {arry} メールアドレス
 */
function getAddressExecUsers(systemMatterId){
	
	var actvMatterNode = new ActvMatterNode('ja', systemMatterId);
	var cond = new ListSearchConditionNoMatterProperty();
	var userlist = actvMatterNode.getExecutableUserList(cond); //ノードの対象者を取得
	var usercode = [];
	for(var i = 0; i < userlist.data.length; i++) {
		usercode.push(userlist.data[i].authUserCode)
	}

	//ユーザコードからアドレス取得
	var toaddress = getMailAddress(usercode);

	return toaddress;
}
	
/**
 * メール用送信
 * 
 * @param {object} 送信用パラメータ
 * @return {string}
 */

function sedMailExce(param){

	var locale_id = 'ja';
	
	//IMのメール定義取得
	var manager = new MailTemplateManager();
	var info = manager.getMailTemplateDataWithLocale(param.mail_id,locale_id);			

	if(info.data && param.to_address.length > 0){

		// DBから置換情報取得
		var maildata = getMaildata(param);

		if (maildata.ticket_id != ""){
			var obj = info.data.mailTempFileData;
			var mail={};
			mail.from = mailReplace(obj.mailTemplateFrom,maildata);
			mail.subject = mailReplace(obj.mailTemplateSubject,maildata);
			mail.body = mailReplace(obj.mailTemplateBody,maildata);
			mail.to = param.to_address; //配列
			mail.reply = obj.mailTemplateReplyTo; //配列
			mail.cc = obj.mailTemplateCc; //配列
			if (param.cc_address) {
				mail.cc = mail.cc.concat(param.cc_address);
			}
			mail.bcc = obj.mailTemplateBcc; //配列
			
			if("attachment" in param){
				mail.attachment = param.attachment;
			}
			

			sendMail(mail);
		}
	}
}


/**
 * メール定義内の置換文字を置換
 * {^ ^} で囲まれた文字を置換する
 * 
 * @param {string} 変換前文字列
 * @param {object} 変換データ
 * @return {string}変換後文字列
 */
function mailReplace(str,dataObj){
	if (str){
		for (var key in dataObj){
			var target = "\\{\\^" + key + "\\^\\}";
			var val = dataObj[key];
			if (val==null){
				val = "";
			}
			str = str.replace(new RegExp(target,"g"),val);
		}
	}
	return str;
}
/**
 * メール送信
 * 
 * @param {object} 送信用データ
 */
function sendMail(reqest){
	Logger.getLogger().info(' [sendMail]　reqest ' + ImJson.toJSONString(reqest, true));

   // メール送信用オブジェクト生成
    //var sessionInfo = AccessSecurityManager.getSessionInfo() ;
    //var locale = sessionInfo.locale ;
    var sessionInfo = Contexts.getAccountContext();
    var localeId = sessionInfo.locale;

    var sender = new MailSender(localeId);
    if( !isNull(sender)){
        // To
    	for(var i in reqest.to){
    		if(reqest.to[i]!=null){sender.addTo(reqest.to[i]);}
    	}
        // Cc
    	for(var i in reqest.cc){
    		if(reqest.cc[i]!=null){sender.addCc(reqest.cc[i]);}
    	}
        // Bcc
    	for(var i in reqest.bcc){
    		if(reqest.bcc[i]!=null){sender.addBcc(reqest.bcc[i]);}
    	}
    	
        // To
        //sender.addto( "yyy@yyy.yyy.yyy", "yyyyy様" ) ;
        // Cc
        //sender.addCc( "yyy@yyy.yyy.yyy", "yyyyy様" ) ;
        // Bcc
        //sender.addBcc( "zzz@zzz.zzz.zzz", "zzz様" ) ;
        
        // From
        sender.setFrom(reqest.from);
        //sender.setFrom( "Mr.X@xxx.xxx.xxx","XX") ;
 
        // 返信先
    	for(var i in reqest.reply){
    		if(reqest.reply[i]!=null){sender.addReplyTo(reqest.reply[i]);}
    	}
        //sender.addReplyTo( "Mr.X@xxx.xxx.xxx" ) ;
 
        // タイトル
        sender.setSubject(reqest.subject) ;
 
        // 本文
        //var    wk = "[" + Format.fromDate( "yyyy/MM/dd HH:mm:ss.SSS", new Date() ) + "]\r" ;
        //wk += "本文です。" ;
        sender.setText(reqest.body) ;
        
        if("attachment" in reqest){
        	for(var i in reqest.attachment){
        		sender.addAttachment(reqest.attachment[i].file_name, reqest.attachment[i].storage);
        	}
        }        

        // メール送信
        var sendResult = sender.send() ;
 
        // 送信成功チェック
        if( sendResult ){
            //logger.info( "メール送信が成功しました。" ) ;
        }
        else {
            //logger.error( "メール送信は失敗しました。" ) ;
            return false ;
        }
    }
    else{
        //logger.error( "MailSenderオブジェクト取得に失敗しました。" ) ;
        return false ;
    }
    return true;
}


/**
 * DBからメール用情報取得
 * 
 * @param {string} チケットid
 * @return {object}メール用データ
 */
function getMaildata(param){
	//Debug.console('getMaildata-----------');
	//Debug.console(Web.base());
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	// 置換文字map({^ ^} で囲まれた文字を置換する)
	var info ={
	    mail_header:"", // メールヘッダー
		ticket_id:"", //文書番号
		ticket_type:"",      //文書種別
		ticket_nm:"",         //文書名
		title_nm:"",         //タイトル名
		kaisha_nm:"",         //会社名
		auth_user : "",        //処理ユーザ
		auth_user_address2:"", //処理ユーザアドレス（ZACRO連携用）
		request_user_address2:"", //リクエスト参加ユーザアドレス（ZACRO連携用）
		proc_nm:"",          //処理名
		auth_comment : "",     //コメント		
		ticket_url:"",       //URL
		shinsei_bi:"",       //申請日
		kian_bi:"",          //起案日
		shinsei_sha:"",      //申請者
		kian_sha:"",          //起案者
		status:""          //ステータス
	};
	
	
	var pra = [];
	pra.push(DbParameter.string(param.ticket_id));
	var db = new TenantDatabase();

	// 企画データ取得
	var sql = getSqlKikaku();
	var res = db.select(sql, pra);
	var ticket_url = '/lo/contents/screen/kikaku/planning_detail_new?kikaku_id=' + param.ticket_id; 
	var mail_header = "";
	var ticket_type = "企画"; //todo言語対応
	var status = "";
	
	if (res.countRow == 0){
		// 許諾データ取得
		sql = getSqlKyodaku();
		res = db.select(sql, pra);
		ticket_url = '/lo/contents/screen/kyodaku/permission_product_detail?kyodaku_id=' + param.ticket_id;  
		ticket_type = "許諾";
	}
	
	if (res.countRow == 0){
		// 契約内容データ取得
		sql = getSqlKeiyaku();

		res = db.select(sql, pra);
		
		ticket_url = '/lo/contents/screen/keiyaku_naiyo/keiyaku_naiyo_detail?keiyaku_naiyo_id=' + param.ticket_id;
		mail_header = "【契約チケット作成通知】";
		if (param.mail_id == Constant.LO_MAIL_ID_KEIYAKU_UPDATE) {
			mail_header = "【契約チケット更新通知】";
		}else if(param.mail_id == Constant.LO_MAIL_ID_KEIYAKU_STATUS_UPDATE){
			mail_header = "【契約チケット ステータス更新通知】";
		}		

		if (res.countRow > 0) {
			if (res.data[0].kyodaku_cls == Constant.LO_KYODAKU_SHUBETSU_ADD 
					&& param.mail_id == Constant.LO_MAIL_ID_KEIYAKU_NEW) {
				mail_header = "【追加契約計上依頼通知】";
			}
			
			//代わり承認（企画）の場合表示しない
			if(res.data[0].bunsho_cls != Constant.LO_DOC_CLS_KAWARI_KIKAKU){			
				mail_header += "【" + res.data[0].keiyaku_cls_nm + "】";
				//mail_header += "【" + res.data[0].kyodaku_cls_nm + "】"; //許諾情報は不要
			}
			
			ticket_type = "契約内容";		
		
			var status_list = Content.executeFunction("/lo/common_libs/lo_common_fnction", "getKeyValue", {},Constant.LO_CDCLS_KEIYAKU_STATUS_PR);
		
			status = status_list[res.data[0].keiyaku_status];
			
		}

	}
	
	if (res.countRow == 0) {
		// 代わり承認WFデータ取得
		sql = getSqlKawariWf();
		res = db.select(sql, pra);
		ticket_url = '/lo/contents/screen/kawari/kawari_detail?bunsho_id=' + param.ticket_id;
		mail_header = "";
		if (res.countRow > 0) {
			ticket_type = res.data[0].ticket_type;
			var applyNodeObj = getNodeInfo(param.ticket_id,"lo_node_apply");
			var applyExcUserCd = getProcessLatestUser(applyNodeObj);
			var applyExcDate = getProcessLatestStartDate(applyNodeObj);
			var applyExcUserNm = '';
			if (applyExcUserCd != '') {
				var userBizKeyInfo = {userCd : applyExcUserCd};
				var userObj = new IMMUserManager(applyExcUserCd, 'ja');
				var userInfo = userObj.getUser(userBizKeyInfo, new Date(), 'ja');
				if (!userInfo.error) {
					applyExcUserNm = userInfo.data.locales['ja'].userName;
				}
			}

			var kianNodeObj = getNodeInfo(param.ticket_id,"lo_node_kian");
			var kianExcUserCd = getProcessLatestUser(kianNodeObj);
			var kianExcDate = getProcessLatestStartDate(kianNodeObj);
			var kianExcUserNm = '';
			if (kianExcUserCd != '') {
				var userBizKeyInfo = {userCd : kianExcUserCd};
				var userObj = new IMMUserManager(kianExcUserCd, 'ja');
				var userInfo = userObj.getUser(userBizKeyInfo, new Date(), 'ja');
				if (!userInfo.error) {
					kianExcUserNm = userInfo.data.locales['ja'].userName;
				}
			} else {
				kianExcUserNm = applyExcUserNm;
				kianExcDate = applyExcDate;
			}
			
			res.data[0].shinsei_sha = applyExcUserNm;
			res.data[0].kian_sha = kianExcUserNm;
			res.data[0].shinsei_bi = applyExcDate;
			res.data[0].kian_bi = kianExcDate;
			
			//ライセンスプロポーザルの場合、ライセンシー名には海外販社名を表示する
			if(res.data[0].bunsho_cls == Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL){
				res.data[0].kaisha_nm = res.data[0].kaigai_hansha_nm;
			}
		}
	}
	
	if (res.countRow == 0) {
		// アカウント申請WFデータ取得
		sql = getSqlAccountWf();
		res = db.select(sql, pra);
		
		mail_header = "";
		if (res.countRow > 0) {
			if(param.ticket_id.substr(0,2) == "SS"){
				ticket_url = '/lo/contents/screen/account/shanai_account_detail?shinsei_id=' + param.ticket_id;
			}else{
				ticket_url = '/lo/contents/screen/account/account_detail?shinsei_id=' + param.ticket_id;
			}
		
			ticket_type = res.data[0].ticket_type;
			var applyNodeObj = getNodeInfo(param.ticket_id,"lo_node_apply");
			var applyExcUserCd = getProcessLatestUser(applyNodeObj);
			var applyExcDate = getProcessLatestStartDate(applyNodeObj);
			var applyExcUserNm = '';
			if (applyExcUserCd != '') {
				var userBizKeyInfo = {userCd : applyExcUserCd};
				var userObj = new IMMUserManager(applyExcUserCd, 'ja');
				var userInfo = userObj.getUser(userBizKeyInfo, new Date(), 'ja');
				if (!userInfo.error) {
					applyExcUserNm = userInfo.data.locales['ja'].userName;
				}
			}

			var kianNodeObj = getNodeInfo(param.ticket_id,"lo_node_kian");
			var kianExcUserCd = getProcessLatestUser(kianNodeObj);
			var kianExcDate = getProcessLatestStartDate(kianNodeObj);
			var kianExcUserNm = '';
			if (kianExcUserCd != '') {
				var userBizKeyInfo = {userCd : kianExcUserCd};
				var userObj = new IMMUserManager(kianExcUserCd, 'ja');
				var userInfo = userObj.getUser(userBizKeyInfo, new Date(), 'ja');
				if (!userInfo.error) {
					kianExcUserNm = userInfo.data.locales['ja'].userName;
				}
			} else {
				kianExcUserNm = applyExcUserNm;
				kianExcDate = applyExcDate;
			}
			
			res.data[0].shinsei_sha = applyExcUserNm;
			res.data[0].kian_sha = kianExcUserNm;
			res.data[0].shinsei_bi = applyExcDate;
			res.data[0].kian_bi = kianExcDate;			

		}
	}
	

	if (res.countRow > 0){
		var data = res.data[0];
		info.mail_header = mail_header;
		info.ticket_id = param.ticket_id;
		info.ticket_type = ticket_type;
		info.ticket_nm = data.ticket_nm;
		info.title_nm = data.title_nm;
		info.kaisha_nm = data.kaisha_nm;
		info.shinsei_sha = data.shinsei_sha;
		info.kian_sha = data.kian_sha;
		info.shinsei_bi = data.shinsei_bi;
		info.kian_bi = data.kian_bi;
		info.proc_nm = param.proc_nm?param.proc_nm:data.proc_nm;
		//info.auth_user = getUserName(param.execUserCd); // 実行者
		//info.ticket_url = Web.base() + ticket_url;
		info.ticket_url = ticket_url;
		info.auth_comment = param.comment;
		info.status = status;
		
		var execUser = getUserInfo(param.execUserCd); // 実行者情報
		if (execUser != null){
			info.auth_user = execUser.user_name; // 実行者名
			if (execUser.email_address2 != ""){
				info.auth_user_address2 = execUser.email_address2; // 実行者アドレス２（商標zacro用）
			}else{
				info.auth_user_address2 = execUser.email_address1;
			}
		}else{
			info.auth_user = "";
			info.auth_user_address2 = "";
		}
		// リクエスト参加ユーザアドレス
		info.request_user_address2="";
		if (param.request_user_cd && param.request_user_cd.length > 0){
			// コードを商標ZACRO用に変換
			var userlist = chgZacroUserCd(param.request_user_cd);
			info.request_user_address2=userlist.join(',');
		}

	}
	return info;
}

// 企画sql
function getSqlKikaku(){
	var kian_null = "未起案";
	
	var sql ="";
	sql += " SELECT " ;
	sql += "    k.kikaku_nm as ticket_nm  " ;
	sql += "   ,k.title_nm " ;
	sql += "   ,k.kaisha_nm " ;
	sql += "   ,to_char(k.shinsei_bi,'YYYY/MM/DD') as shinsei_bi " ;
	//sql += "   ,to_char(k.kakunin_bi,'YYYY/MM/DD') as kian_bi " ;
	sql += "   ,CASE WHEN k.kakunin_bi is null THEN '"+ kian_null +"' ELSE to_char(k.kakunin_bi,'YYYY/MM/DD') END as kian_bi " ;
	sql += "   ,k.tantou_sha as shinsei_sha " ;
	sql += "   ,CASE WHEN COALESCE(k.bne_tantou_sha,'') = '' THEN '"+ kian_null +"' ELSE k.bne_tantou_sha END as kian_sha " ;
	sql += "   ,m.cd_naiyo as proc_nm " ;
	sql += " FROM lo_t_kikaku as k " ; 
	sql += " LEFT JOIN lo_m_koteichi as m " ; 
	sql += "   ON k.kikaku_status = m.cd_id " ; 
	sql += "   AND m.cd_cls_id = '" + Constant.LO_CDCLS_PROC_STATUS +"'"  ; 
	sql += "   AND m.sakujo_flg ='0' " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kikaku_id =? " ; 

	return sql;
}

// 許諾sql
function getSqlKyodaku(){
	var kian_null = "未起案";

	var sql ="";
	sql += " SELECT " ;
	sql += "    k.kyodaku_nm as ticket_nm  " ;
	sql += "   ,ki.title_nm " ;
	sql += "   ,k.kaisha_nm " ;
	sql += "   ,k.shinsei_bi as shinsei_bi " ;
	sql += "   ,COALESCE(k.kakunin_bi,'"+ kian_null +"') as kian_bi " ;
	sql += "   ,k.tantou_sha_nm as shinsei_sha " ;
	//sql += "   ,COALESCE(k.bne_tantou_sha,'"+ kian_null +"') as kian_sha " ;
	sql += "   ,CASE WHEN COALESCE(k.bne_tantou_sha,'') = '' THEN '"+ kian_null +"' ELSE k.bne_tantou_sha END as kian_sha " ;
	sql += "   ,m.cd_naiyo as proc_nm " ;
	sql += " FROM lo_t_kyodaku as k " ;
	sql += " LEFT JOIN lo_t_kyodaku_kikaku_himozuke as h " ;
	sql += "   ON k.kyodaku_id = h.kyodaku_id " ; 
	sql += "   AND h.sakujo_flg ='0' " ; 
	sql += " LEFT JOIN lo_t_kikaku as ki " ;
	sql += "   ON h.kikaku_id = ki.kikaku_id " ; 
	sql += "   AND ki.sakujo_flg ='0' " ; 
	sql += " LEFT JOIN lo_m_koteichi as m " ; 
	sql += "   ON k.kyodaku_status = m.cd_id " ; 
	sql += "   AND m.cd_cls_id = '" + Constant.LO_CDCLS_PROC_STATUS +"'"  ; 
	sql += "   AND m.sakujo_flg ='0' " ; 
	sql += " WHERE k.sakujo_flg ='0' " ; 
	sql += "   AND k.kyodaku_id =? " ;
	sql += " ORDER BY ki.kikaku_id  " ;
	
	return sql;
}

// 契約内容sql
function getSqlKeiyaku() {
	
	var sql = "";
	sql += "SELECT ";
	sql += "  kn.keiyaku_naiyo_id AS ticket_id ";
	sql += "  , kn.keiyaku_naiyo_nm AS ticket_nm ";
	sql += "  , kn.keiyaku_cls AS keiyaku_cls ";
	sql += "  , ko02.cd_naiyo AS keiyaku_cls_nm ";
	sql += "  , kip.kyodaku_cls AS kyodaku_cls ";
	sql += "  , ko03.cd_naiyo AS kyodaku_cls_nm ";
	sql += "  , kip.kikaku_shubetsu_cd AS kikaku_shubetsu_cd ";
	sql += "  , kip.ip_nm AS ip_nm ";
	sql += "  , kip.title_nm AS title_nm ";
	sql += "  , kip.bunsho_cls AS bunsho_cls ";
	sql += "  , kn.kaisha_id ";
	sql += "  , kn.kaisha_nm ";
	sql += "  , kn.keiyaku_status ";
	sql += "  , TO_CHAR(kn.touroku_bi, 'YYYY/MM/DD') AS shinsei_bi ";
	sql += "  , TO_CHAR(knt.touroku_bi, 'YYYY/MM/DD') AS kian_bi ";
	sql += "  , knt.irai_sha_user_nm AS shinsei_sha ";
	sql += "  , knt.irai_sha_user_nm AS kian_sha ";
	sql += "  , CASE WHEN ko01.cd_naiyo LIKE '%中' ";
	sql += "    THEN SUBSTRING(ko01.cd_naiyo FROM 1 FOR CHARACTER_LENGTH(ko01.cd_naiyo) - 1) ";
	sql += "    ELSE ko01.cd_naiyo ";
	sql += "  END AS proc_nm ";
	sql += "FROM ";
	sql += "  lo_t_keiyaku_naiyo AS kn ";
	sql += "  LEFT JOIN lo_t_keiyaku_naiyo_task AS knt ";
	sql += "    ON (knt.keiyaku_naiyo_id = kn.keiyaku_naiyo_id ";
	sql += "    AND knt.shori_cls = '" + Constant.LO_TASK_SHORI_CLS_MISHORI + "' ";
	sql += "    AND knt.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_STATUS_PR + "' ";
	sql += "    AND ko01.cd_id = kn.keiyaku_status ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KEIYAKU_CLS + "' ";
	sql += "    AND ko02.cd_id = kn.keiyaku_cls ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN (";
	sql += "    SELECT ";
	sql += "      keiyaku_naiyo_id ";
	sql += "      , MAX(kyodaku_cls) AS kyodaku_cls ";
	sql += "      , MAX(kikaku_shubetsu_cd) AS kikaku_shubetsu_cd ";
	sql += "      , STRING_AGG(DISTINCT ip_nm, ',' ORDER BY ip_nm) AS ip_nm ";
	sql += "      , STRING_AGG(DISTINCT title_nm, ',' ORDER BY title_nm) AS title_nm ";
	sql += "      , MAX(bunsho_cls) AS bunsho_cls ";
	sql += "    FROM ";
	sql += "      (SELECT ";
	sql += "        kekih.keiyaku_naiyo_id AS keiyaku_naiyo_id ";
	sql += "        , '" + Constant.LO_KYODAKU_SHUBETSU_NEW + "' AS kyodaku_cls ";
	sql += "        , ki.kikaku_shubetsu_cd AS kikaku_shubetsu_cd ";
	sql += "        , ki.ip_nm AS ip_nm ";
	sql += "        , ki.title_nm AS title_nm ";
	sql += "        , '"+Constant.LO_DOC_CLS_KIKAKU+"' AS bunsho_cls ";
	sql += "      FROM ";
	sql += "        lo_t_keiyaku_naiyo_kikaku_himozuke AS kekih ";
	sql += "        INNER JOIN lo_t_kikaku AS ki ";
	sql += "          ON (ki.sakujo_flg = '0' ";
	sql += "          AND ki.kikaku_id = kekih.kikaku_id) ";
	sql += "      WHERE ";
	sql += "        kekih.sakujo_flg = '0' ";
	sql += "      UNION ";
	sql += "      SELECT ";
	sql += "        kekyh.keiyaku_naiyo_id ";
	sql += "        , ky.kyodaku_cls AS kyodaku_cls ";
	sql += "        , ki.kikaku_shubetsu_cd AS kikaku_shubetsu_cd ";
	sql += "        , ki.ip_nm AS ip_nm ";
	sql += "        , ki.title_nm AS title_nm ";
	sql += "        , '"+Constant.LO_DOC_CLS_KYODAKU+"' AS bunsho_cls ";
	sql += "      FROM ";
	sql += "        lo_t_keiyaku_naiyo_kyodaku_himozuke AS kekyh ";
	sql += "        INNER JOIN lo_t_kyodaku AS ky ";
	sql += "          ON (ky.sakujo_flg = '0' ";
	sql += "          AND ky.kyodaku_id = kekyh.kyodaku_id) ";
	sql += "        INNER JOIN lo_t_kyodaku_kikaku_himozuke AS kykih ";
	sql += "          ON (kykih.sakujo_flg = '0' ";
	sql += "          AND kykih.kyodaku_id = ky.kyodaku_id) ";
	sql += "        INNER JOIN lo_t_kikaku AS ki ";
	sql += "          ON (ki.sakujo_flg = '0' ";
	sql += "          AND ki.kikaku_id = kykih.kikaku_id) ";
	sql += "      WHERE ";
	sql += "        kekyh.sakujo_flg = '0' ";
	sql += "      UNION ";
	sql += "      SELECT ";
	sql += "        kekah.keiyaku_naiyo_id ";
	sql += "        , ka.kyodaku_cls AS kyodaku_cls ";
	sql += "        , ka.kikaku_shubetsu_cd AS kikaku_shubetsu_cd ";
	sql += "        , ka.ip_nm AS ip_nm ";
	sql += "        , ka.title_nm AS title_nm ";
	sql += "        , case ";
	sql += "         when substr(ka.bunsho_id,1,3) = '"+Constant.LO_TICKET_ID_HEAD_KAWARI_KIKAKU+"' then '"+Constant.LO_DOC_CLS_KAWARI_KIKAKU+"' ";
	sql += "         when substr(ka.bunsho_id,1,3) = '"+Constant.LO_TICKET_ID_HEAD_KAWARI_KYODAKU+"' then '"+Constant.LO_DOC_CLS_KAWARI_KYODAKU+"' ";
	sql += "         when substr(ka.bunsho_id,1,3) = '"+Constant.LO_TICKET_ID_HEAD_KAWARI_LICENSE_PROPOSAL+"' then '"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"' ";//LPは現状ここに入らないが
	sql += "         else '' ";	
	sql += "        end bunsho_cls ";
	sql += "      FROM ";
	sql += "        lo_t_keiyaku_naiyo_kawari_himozuke AS kekah ";
	sql += "        INNER JOIN lo_t_kawari AS ka ";
	sql += "          ON (ka.sakujo_flg = '0' ";
	sql += "          AND ka.bunsho_id = kekah.bunsho_id) ";
	sql += "      WHERE ";
	sql += "        kekah.sakujo_flg = '0') AS keiyaku_ip_title (keiyaku_naiyo_id, kyodaku_cls, kikaku_shubetsu_cd, ip_nm, title_nm) ";
	sql += "    GROUP BY ";
	sql += "      keiyaku_naiyo_id) AS kip ";
	sql += "    ON (kip.keiyaku_naiyo_id = kn.keiyaku_naiyo_id) ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_CLS + "' ";
	sql += "    AND ko03.cd_id = kip.kyodaku_cls ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "WHERE ";
	sql += "  kn.sakujo_flg ='0' ";
	sql += "  AND kn.keiyaku_naiyo_id = ? ";

	return sql;
}
	

// 代わり承認WFsql
function getSqlKawariWf() {
	var sql = "";
	sql += "SELECT ";
	sql += "  tk.bunsho_id AS ticket_id, ";
	sql += "  tk.bunsho_cls, ";
	sql += "  k73.cd_naiyo AS ticket_type, ";
	sql += "  tk.title_nm, ";
	sql += "  tk.bunsho_nm AS ticket_nm, ";
	sql += "  tk.kaisha_nm AS kaisha_nm, ";
	sql += "  k01.cd_naiyo AS kaigai_hansha_nm, ";
	sql += "  tk.shinsei_bi, ";
	sql += "  k69.cd_naiyo AS proc_nm ";
	sql += "FROM ";
	sql += "  lo_t_kawari tk ";
	sql += "  LEFT JOIN lo_m_koteichi k73 ";
	sql += "    ON k73.cd_cls_id = '0073' ";
	sql += "    AND k73.sakujo_flg = '0' ";
	sql += "    AND tk.bunsho_cls = k73.cd_id ";
	sql += "  LEFT JOIN lo_m_koteichi k69 ";
	sql += "    ON k69.cd_cls_id = '" + Constant.LO_CDCLS_PROC_STATUS + "' ";
	sql += "    AND k69.sakujo_flg = '0' ";
	sql += "    AND tk.kawari_status = k69.cd_id ";
	sql += "  LEFT JOIN lo_m_koteichi k01 ";
	sql += "    ON k01.cd_cls_id = '" + Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND k01.sakujo_flg = '0' ";
	sql += "    AND tk.kaigai_hansha_cd = k01.cd_id ";
	sql += "WHERE tk.sakujo_flg = '0' ";
	sql += "  AND tk.bunsho_id = ? ";
	Logger.getLogger().info("sql:" + sql);
	return sql;
}

// アカウント申請WFsql
function getSqlAccountWf() {
	var sql = "";
	sql += "SELECT ";
	sql += "  tk.shinsei_id AS ticket_id, ";
	sql += "  tk.flow_id, ";
	sql += "  k73.cd_naiyo AS ticket_type, ";
	//sql += "  tk.title_nm, ";
	//sql += "  tk.bunsho_nm AS ticket_nm, ";
	//sql += "  tk.kaisha_nm AS kaisha_nm, ";	
	sql += "  tk.shinsei_bi, ";
	sql += "  k69.cd_naiyo AS proc_nm ";
	sql += "FROM ";
	sql += "  lo_t_account_shinsei tk ";
	sql += "  LEFT JOIN lo_m_koteichi k73 ";
	sql += "    ON k73.cd_cls_id = '0073' ";
	sql += "    AND k73.sakujo_flg = '0' ";
	sql += "    AND '7' = k73.cd_id ";
	sql += "  LEFT JOIN lo_m_koteichi k69 ";
	sql += "    ON k69.cd_cls_id = '" + Constant.LO_CDCLS_PROC_STATUS + "' ";
	sql += "    AND k69.sakujo_flg = '0' ";
	sql += "    AND tk.shinsei_status = k69.cd_id ";	
	sql += "WHERE tk.sakujo_flg = '0' ";
	sql += "  AND tk.shinsei_id = ? ";
	Logger.getLogger().info("sql:" + sql);
	return sql;
}

/**
 *　文書idとメールグループを元にメール送信先アドレス取得
 * 
 * @param {string} チケットid
 * @param {string} メールグループ
 * @return {array}メールアドレス
 */
function getMailSendList(ticket_id,group){
	var locale_id = 'ja';
	// テーブルから送信先ユーザ取得
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	,u.email_address1 ";
	//sql+=" 	,u.email_address2 ";
	sql+=" FROM lo_t_sendmail m ";
	sql+=" INNER JOIN imm_user u ";
	sql+="    ON m.user_cd = u.user_cd ";
	sql+="   AND u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+=" WHERE m.sakujo_flg ='0' ";
	sql+="  AND  m.ticket_id = ? ";
	sql+="  AND  m.mail_group = ? ";
	
	var pra = [];
	pra.push(DbParameter.string(ticket_id));
	pra.push(DbParameter.string(group));
	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	
	// アドレス取得
	var list = [];
	for (var i=0; i < res.countRow;i++){
		if (res.data[i].email_address1){
			list.push(res.data[i].email_address1);
		}
		// email_address2 は商標zacro用に使用する為 除外
		/*if (res.data[i].email_address2){
			list.push(res.data[i].email_address2);
		}*/
	}
	
	// 重複を削除
	var sendlist = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

    return sendlist;
}

/**
 * ノード情報を取得し、返却
 * @param {string} チケットid
 * @param {string} ノードid
 * @return {object} ノード情報 */
function getNodeInfo(ticket_id,node_id) {
    var locale_id = 'ja';

    // 文書idを元にSystemMatterIdを取得
    var sql = "";
    sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
    sql += "union all ";
    sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
    var strParam=[];
    strParam.push(DbParameter.string(ticket_id));
    strParam.push(DbParameter.string(ticket_id));
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    var result;
    if (result.countRow < 1){
    	return result;
    }
    
    //案件id取得
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;

    if (type == 'act'){
        // 未完了案件取得
        var actvMatter = new ActvMatterNode(locale_id,systemMatterId);
        // ノードの処理履歴取得
        result = actvMatter.getProcessHistoryList(node_id);
    }else{
        // 完了案件取得
        var cplMatter = new CplMatterNode(locale_id,systemMatterId);
        result = cplMatter.getProcessHistoryList(node_id);
    }
    return result;
}
	
/**
 *　対象ノードの処理実行者のメールアドレスを取得
 * 
 * @param {string} チケットid
 * @param {string} ノードid
 * @return {array} メールアドレス
 */
function getNodeUserAddress(ticket_id,node_id){
    var address = [];
    var result = getNodeInfo(ticket_id,node_id);
    //　処理ユーザ取得
    var exceuser = getProcessLatestUser(result);
    if (exceuser){
        //　メールアドレス取得
    	var userlist =  [exceuser];
    	address = getMailAddress(userlist);
    }

    return address;
}

/**
 *　全ノードの処理実行者のメールアドレスを取得
 * 
 * @param {string} チケットid
 * @param {string} ノードid
 * @return {array} メールアドレス
 */
function getNodeUserAddressAll(ticket_id){
    var address = [];
    
    // 案件番号を元にSystemMatterIdを取得
	var sql = "";
	sql += "select system_matter_id, 'act' as type from imw_t_actv_matter where matter_name = ? ";
	sql += "union all ";
	sql += "select system_matter_id, 'cpl' as type from imw_t_cpl_matter where matter_name = ? ";
	var strParam=[];
    strParam.push(DbParameter.string(ticket_id));
    strParam.push(DbParameter.string(ticket_id));
    
    var db = new TenantDatabase();
    var result = db.select(sql,strParam,0);
    
    // 存在しなければfalse
    if (result.countRow < 1){    	
    	return false;
    }      
    
    var systemMatterId = result.data[0].system_matter_id;
    var type = result.data[0].type;
    
    if(type=='cpl'){
    	var cplMatterObj = new CplMatter('ja', ticket_id);
    	var flowInfo = cplMatterObj.getExecFlow().data;
    	var nodeInfoList = flowInfo.nodes
    }else{
    	var actvMatterObj = new ActvMatter('ja', systemMatterId);
    	var flowInfo = actvMatterObj.getExecFlow().data;
    	var nodeInfoList = flowInfo.nodes
    }	
	
	var actvMatter = new ActvMatterNode('ja', systemMatterId);
	
	var exceuser = [];
	for (var idx = 0; idx < nodeInfoList.length; idx++) {
		var result = actvMatter.getProcessHistoryList(nodeInfoList[idx].nodeId);
		var user = getProcessLatestUser(result);
		if(user !=''){			
			exceuser.push(user);
		}
	
	}
	
	Logger.getLogger().info(ImJson.toJSONString(exceuser, false));	

    if (exceuser){
        //　メールアドレス取得
    	var userlist =  exceuser;
    	address = getMailAddress(userlist);
    }
    
    Logger.getLogger().info(ImJson.toJSONString(address, false));	

    return address;

}	

// actvMatter.getProcessHistoryListから最後の処理ユーザ取り出し
function getProcessLatestUser(result) {
	if (result.data){
		var len = result.data.length;
     	for (var i=len-1; 0 <= i;i--){ //処理の逆順に取得()
     		if(result.data[i].status != 'cancel'){
     			return result.data[i].executeUserCode;
     		}
     	}
    }
 	return '';
}

// actvMatter.getProcessHistoryListから最後の終了日を取り出し
function getProcessLatestStartDate(result) {
	if (result.data){
		var len = result.data.length;
		for (var i=len-1; 0 <= i;i--){ //処理の逆順に取得()
			if(result.data[i].status != 'cancel'){
				return result.data[i].endDate;
			}
		}
	}
	return '';
}
	
/**
 * グループに属するユーザのアドレスを取得
 * @param {array} グループリスト
 * @returns {array} 結果
 */
function getGroupUserAddress(grouplist) {

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	if (grouplist.length == 0){
		return [];
	}
	var locale_id = 'ja';
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	,u.email_address1 ";
	//sql+=" 	,u.email_address2 ";
	sql+=" FROM imm_user u ";
	sql+=" INNER JOIN imm_public_grp_ath g ";
	sql+="   ON u.user_cd = g.user_cd ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND g.public_group_set_cd = '"+Constant.LO_GROUP_SET_CD+"' ";
	sql+="   AND g.public_group_cd in ( ";
	var pra = [];
	for (var i = 0; i <  grouplist.length;i++){
		if (i > 0){
			sql+=",";
		}
		sql+="?";
		pra.push(DbParameter.string(grouplist[i]));
	}
	sql+=")";
	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	// アドレス取得
	var list = [];
	for (var i=0; i < res.countRow;i++){
		if (res.data[i].email_address1){
			list.push(res.data[i].email_address1);
		}
		// email_address2 は商標zacro用に使用する為 除外
		/*if (res.data[i].email_address2){
			list.push(res.data[i].email_address2);
		}*/
	}
	
	// 重複を削除
	var sendlist = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

	return sendlist;
}
	
	
/**
 * ユーザのメールアドレス取得
 * 
 * @param {arry} ユーザコード
 * @return {arry}メールアドレス
 */
function getMailAddress(userList){

	if (userList.length == 0){
		return [];
	}
	

	var locale_id = 'ja';
	// テーブルから送信先ユーザ取得
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	,u.email_address1 ";
	//sql+=" 	,u.email_address2 ";
	sql+=" FROM imm_user u ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND u.user_cd in ( ";

	
	var pra = [];

	for (var i = 0; i <  userList.length;i++){
		if (i > 0){
			sql+=",";
		}
		sql+="?";
		pra.push(DbParameter.string(userList[i]));
	}
	sql+=")";

	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	
	// アドレス取得
	var list = [];
	for (var i=0; i < res.countRow;i++){
		if (res.data[i].email_address1){
			list.push(res.data[i].email_address1);
		}
		// email_address2 は商標zacro用に使用する為 除外
		/*if (res.data[i].email_address2){
			list.push(res.data[i].email_address2);
		}*/
	}
	
	// 重複を削除
	var sendlist = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

    return sendlist;
}


/**
 * ユーザ名取得
 * 
 * @param {string} ユーザコード
 * @return {name}ユーザ名
 */
function getUserName(usercd){

    var res = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserInfo", usercd);
	
	if (res != null){
		return res.user_name;
	}else{
	    return "";
	}

}
/**
 * ユーザ情報取得
 * 
 * @param {string} ユーザコード
 * @return {name}ユーザ名
 */
function getUserInfo(usercd){
	return Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserInfo", usercd);
}

	
/**
 * ユーザコードを商標ZACROように変換
 * 
 * @param {arry} ユーザコード
 * @return {arry}商標ZACRO用コード
 */
function chgZacroUserCd(userList){

	if (userList.length == 0){
		return [];
	}
	
	var locale_id = 'ja';
	// テーブルから送信先ユーザ取得
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	,u.email_address2 ";
	sql+=" FROM imm_user u ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND u.user_cd in ( ";

	
	var pra = [];

	for (var i = 0; i <  userList.length;i++){
		if (i > 0){
			sql+=",";
		}
		sql+="?";
		pra.push(DbParameter.string(userList[i]));
	}
	sql+=")";

	var db = new TenantDatabase();
	var res = db.select(sql, pra);
	
	// アドレス取得
	var list = [];
	for (var i=0; i < res.countRow;i++){
		// email_address2を商標zacro用に使用する
		if (res.data[i].email_address2){
			list.push(res.data[i].email_address2);
		}
	}
	// 重複を削除
	var sendlist = list.filter(function (x, i, self) {
		return self.indexOf(x) === i;
    });

    return sendlist;
}	
	
/**
 * メール通知ユーザ設定
 * ｗｆで設定された通知先ユーザをDBに登録
 * @param {object} userParameter
 * @returns {object} 結果
 */
function setMailuser(userParameter) {

	
	//Debug.console('setMailuser');
	//Debug.console(userParameter);

	// 戻り値
	var ret = {
		error : false,
		message : ""
	};
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	
	//文書id
	var ticket_id = userParameter.item_matterName;

	// DB接続
	var db = new TenantDatabase();
	// 同文書idの設定を削除
	var result = db.remove('lo_t_sendmail','ticket_id = ?',[DbParameter.string(ticket_id)]);

	// 画面のメール通知設定取得
	var maillist = userParameter.item_mail_user;
	//var apprlist = userParameter.item_appr_user;

	//メールグループのセット
	var mail_group_list = {
		mail_1:Constant.LO_MAIL_GROUP_KIAN,
		mail_2:Constant.LO_MAIL_GROUP_SHOHYO,
		mail_3:Constant.LO_MAIL_GROUP_END,
		mail_4:Constant.LO_MAIL_GROUP_KEIYAKU,
		mail_5:Constant.LO_MAIL_GROUP_KEIJOU
	};
	
	// メール設定
	for (var key in maillist) {
		
		//通知設定画面のidを元にメールグループ取得
		var mail_group = mail_group_list[key];
		if (typeof mail_group === "undefined"){
    		continue;
		}
		
		// グループ毎のユーザ取り出し
		var users = maillist[key];
		for (var i=0; i < users.length;i++){
			var mail_user = users[i];
			         
			//画面の入力値をDB用オブジェクトに格納
			var dataSet = {
				ticket_id : ticket_id,
				mail_group : mail_group,
				user_cd : mail_user
			};
			dataSet = Content.executeFunction("lo/common_libs/lo_common_fnction", "setCommonField", dataSet, true);
			//テーブルに登録
			var result = db.insert('lo_t_sendmail', dataSet);
		}
	}
}


/**
 * 通知先に設定されているユーザを取得する
 * mail_group_listは以下の例のように設定されているオブジェクトを受取る
 * 　var mail_group_list = {};
 * 　mail_group_list[Constant.LO_MAIL_GROUP_KIAN]='mail_1';
 * 　mail_group_list[Constant.LO_MAIL_GROUP_SHOHYO]='mail_2';
 * 　mail_group_list[Constant.LO_MAIL_GROUP_END]='mail_3';
 * 　mail_group_list[Constant.LO_MAIL_GROUP_KEIYAKU]='mail_4';
 * 　mail_group_list[Constant.LO_MAIL_GROUP_KEIJOU]='mail_5';
 */
function getMailSettingUsers(ticket_id, mail_group_list) {

	var mailSettingUsers = {};
	
	// todo 多言語対応
	var locale_id = 'ja';
	
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+="    m.mail_group ";
	sql+="   ,u.user_cd ";
	sql+="   ,u.user_name ";
	sql+=" FROM lo_t_sendmail m ";
	sql+=" INNER JOIN imm_user u ";
	sql+="    ON m.user_cd = u.user_cd ";
	sql+="   AND u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+=" WHERE m.sakujo_flg = '0' ";
	sql+="   AND m.ticket_id = ? ";
	
	var strParam = [];
	strParam.push(DbParameter.string(ticket_id));
	
	// ユーザ名取得
	var db = new TenantDatabase();
	var result = db.select(sql,strParam);
	
	if (result.countRow > 0){
		var data = result.data;
		for (var i = 0;i < data.length;i++){
			// グループコーを画面表示用のキーに変換
			var mailkey = mail_group_list[data[i].mail_group];
			if (typeof mailkey === "undefined"){
				continue;
			}
			// デフォルトメールユーザを格納
			var obj = {user_cd:data[i].user_cd,user_name:data[i].user_name};
			if (mailkey in mailSettingUsers){
				mailSettingUsers[mailkey].push(obj);
			}else{
				mailSettingUsers[mailkey] = [obj];
			}
		}
	}
	return mailSettingUsers;
}

