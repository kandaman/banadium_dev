/**
 * メール送信
 * 
 */
function execute(){
	Constant.load("lo/common_libs/lo_const");

	var msg = 'ジョブが正常に実行されました。';
	// sql実行
    var db = new TenantDatabase();
	var strParam = [];

	// 契約満了告知期間を取得
    var sql = "";
    sql += " SELECT ";
	sql += "    cd_naiyo ";
	sql += " FROM lo_m_koteichi ";
	sql += " WHERE cd_cls_id = '"+ Constant.LO_CDCLS_KEIYAKU_MANRYO_WARNING_MONTH +"'";
	sql += "   AND cd_id ='1' ";
	sql += "   AND sakujo_flg ='0' ";
    var result = db.select(sql,strParam);
    
    if (result.countRow > 0){
    	
    	//Nか月前日付取得
    	var num = Number(result.data[0].cd_naiyo);
    	var dt = new Date();
    	dt.setMonth(dt.getMonth() + num);
    	var y = dt.getFullYear();
    	var m = ('00' + (dt.getMonth()+1)).slice(-2);
    	var d = ('00' + dt.getDate()).slice(-2);
    	var ymd = y +'/'+ m +'/'+ d;

    	// 送信対象を取得
    	// 契約期間：Nか月前かつ延長ステータ:NULL
    	var sql = "";
    	sql += "SELECT ";
    	sql += "  keiyaku_naiyo_id ";
    	sql += " ,keiyaku_naiyo_nm ";
    	sql += " ,licensee_keiyaku_tanto_id ";
    	sql += " ,keiyaku_manryo_bi ";
    	sql += " , '" + num+"' as keiyaku_manryo_month ";
    	sql += "FROM ";
    	sql += "  lo_t_keiyaku_naiyo ";
    	sql += " WHERE keiyaku_encho_cls is NULL ";
    	sql += "   AND licensee_keiyaku_tanto_id  is not NULL ";
    	sql += "   AND keiyaku_manryo_bi  < '" + ymd + "'";
    	sql += "   AND sakujo_flg ='0' ";
    	var ret = db.select(sql,strParam);

    	// 内容を取得しメール送信
    	if (ret.countRow > 0){
    		// メール送信
    		sedMailExce(ret.data);
    	}
        msg = 'ジョブが正常に実行されました。送信対象' + ret.countRow +'件';
    }
    
	return {
     status : 'success' ,
     message : msg
	};

}
/*
function execute(){
	Debug.console('ジョブ動く');
	// トランザクション開始
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
		// DB接続
		var db = new TenantDatabase();
		//画面の入力値をDB用オブジェクトに格納
		// todo 必要な項目を追加する
		var dataSet = {
			koushin_bi : new Date()
		};
		// update条件の値を配列で持つ
		var whereObject = [DbParameter.string('AA00000002')];
		// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
		var result = db.update('lo_t_kikaku', dataSet,'kikaku_id = ?',whereObject);
		if (result.error) {
			Debug.console('ジョブ失敗');

		}
	});
	Debug.console('ジョブ成功');
   return {
     status : 'success' ,
     message : 'The job was executed successfully.'
  };
}
*/
function sedMailExce(sqldata){

	var msg ='';
	var locale_id = 'ja';
	
	//IMのメール定義取得
	var manager = new MailTemplateManager();
	var info = manager.getMailTemplateDataWithLocale('lo_keiyaku_enchol',locale_id);

	if(info.data){
		var obj = info.data.mailTempFileData;

		// 対象毎にメール送信
		for ( var i = 0; i < sqldata.length ; i++) {
			
			// 契約担当者アドレス取得
			var user_id = [sqldata[i].licensee_keiyaku_tanto_id];
			var to_address = getMailAddress(user_id);
			
			if (to_address.length){
				// 置換文字map(メール定義の{^ ^} で囲まれた文字を置換する)
				var maildata ={
					keiyaku_naiyo_id : sqldata[i].keiyaku_naiyo_id, //契約番号
					keiyaku_naiyo_nm : sqldata[i].keiyaku_naiyo_nm,  //契約名
					keiyaku_manryo_bi : sqldata[i].keiyaku_manryo_bi,  //契約満了日
					keiyaku_manryo_month : sqldata[i].keiyaku_manryo_month,  //契約満了警告月
					keiyaku_naiyo_url : 'screen/keiyaku_naiyo/keiyaku_naiyo_detail?keiyaku_naiyo_id=' + sqldata[i].keiyaku_naiyo_id  //URL
				};

				// メール内容設定
				var mail={};
				mail.from = obj.mailTemplateFrom;
				mail.subject = mailReplace(obj.mailTemplateSubject,maildata);
				mail.body = mailReplace(obj.mailTemplateBody,maildata);
				mail.to = to_address; //配列
				mail.reply = obj.mailTemplateReplyTo; //配列
				mail.cc = obj.mailTemplateCc; //配列
				mail.bcc = obj.mailTemplateBcc; //配列

				//メール送信
				if(sendMail(mail)){
					//延長ステータ更新
					if(!enchoUpdate(sqldata[i].keiyaku_naiyo_id)){
						msg = 'ステータスの更新に失敗しました';
					}
				}else{
					msg = 'メール送信に失敗しました';
				}
			}
		}
	}else{
		msg = 'メール定義が取得できませんでした';
	}
	
	return msg;
	
}

/**
 * メール送信
 * 
 * @param {object} 送信用データ
 */
function sendMail(reqest){
   // メール送信用オブジェクト生成
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
 * 契約延長のステータスを通知済みにする
 * 
 * @param {string} 契約番号
 * @return 
 */
function enchoUpdate(keiyaku_naiyo_id) {

	// DB接続
	var db = new TenantDatabase();
	var dataSet = {
		keiyaku_encho_cls : Constant.LO_KEIYAKU_ENCHO_CLS_UNANSWERED,
		koushin_bi : new Date()
	};
	var whereObject = [DbParameter.string(keiyaku_naiyo_id)];
	// テーブル名、更新DB項目に加えwhere句部分と値を格納した配列をセットする
	var result = db.update('lo_t_keiyaku_naiyo', dataSet,'keiyaku_naiyo_id = ?',whereObject);
	if (result.error) {
		return false;
	}
	return true;
}
