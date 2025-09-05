Constant.load("lo/common_libs/lo_const");
var $userInfo = {
	userCd : ""
    , userName : ""
    , bneFlg : "0" // BNEフラグ
	, licenseProductionFlg : "0" //ライセンスプロダクションフラグ
    , licenseeFlg : "0" // ライセンシーフラグ
    , kawariInputFlg : "0" // 代わり承認入力者フラグ
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
	,shinsei_cls_list_add:[]
}; // 画面表示用変数

var $validationErrorMessages = [];
var $shinsei_data = {};

var $bcc_separate_count = "0";

var $extstr = ""; //拡張子メッセージ
var $extListstr = ""; //拡張子リスト
var $tmpFileStr = ""; //添付ファイルメッセージ
var $maxFileSize = Constant.MAX_FILE_SIZE;	//添付ファイル最大容量
var $maxFileNum = Constant.MAX_FILE_NUM;	//添付ファイル最大数

var $viewCtrl = {}; //表示制御用オブジェクト

var $new_window_flg = false; // 新規ウィンドウフラグ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	Logger.getLogger().info(' [init]　メール送信画面 start');

	// ユーザー情報読み込み
	loadUserInfo();
	
	var dt = new Date();
	$shinsei_data.shinsei_bi = DateTimeFormatter.format('yyyy/MM/dd', dt);

	// ライセンシーの場合は表示させない	
	if($userInfo.licenseeFlg == '1'){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage");
	}
	
	// フロントバリデーションエラーメッセージ取得
	$validationErrorMessages = getValidationMessages();
	
	//添付ファイルメッセージ及び拡張子リスト取得
    var $extList = [];
    $extList = Content.executeFunction("lo/common_libs/lo_common_fnction", "getList", $extList, Constant.LO_CDCLS_KAWARI_EXT);
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
    
		
	$form.send_mode = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList",[],Constant.LO_CDCLS_SEND_MAIL_MODE);
	var send_from = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue",[],Constant.LO_CDCLS_SEND_MAIL_FROM);
	
	$form.send_from = send_from["1"];
	$form.reply_to = send_from["2"];
	
	$bcc_separate_count = "40";
	
}

/**
 * ユーザー情報読み込み処理
 * 
 */
function loadUserInfo() {
	$userInfo = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "getUserInfo"); 
}

/**
 * メール送信
 * 共通処理のメール送信を呼び出す
 */
function sendMail(request) {
	Logger.getLogger().info('request ' + ImJson.toJSONString(request, true));
	$userInfo = Content.executeFunction("lo/contents/screen/account/account_data_retriever", "getUserInfo"); 
	
    //送信先アドレス取得   
    var mailParam ={};
    mailParam.cc = [];
    mailParam.bcc = [];
    mailParam.attachment = [];
    
    var send_from = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue",[],Constant.LO_CDCLS_SEND_MAIL_FROM);
    
    if(request.shinsei_data.mail_to != null){
	    var to = request.shinsei_data.mail_to.split(";"); //送信先アドレス設定
	    //toは1件以上必須
	    if(to.length < 1){
	    	return false;
	    }	    
    }
    
    var cc = [];
    if(request.shinsei_data.mail_cc != null){
	     cc = request.shinsei_data.mail_cc.split(";"); //送信先アドレス設定
	     mailParam.cc = cc; //送信先アドレス設定
	}   
    
	mailParam.from = send_from[Constant.LO_SEND_MAIL_ID_FROM]; //送信先アドレス設定
    mailParam.subject = request.shinsei_data.mail_subject; //件名
    mailParam.body = request.shinsei_data.mail_body; //本文
    
    var bcc_separate_count = parseInt(request.shinsei_data.bcc_separate_count);
    
    var bccText = "";
    var bcc = [];
        
    if(request.shinsei_data.mail_bcc != null){
    	//改行コードをreplace
    	bccText = request.shinsei_data.mail_bcc.replace(/\r?\n/g, '');
    	
    	//末尾が;の場合は、除去
    	if(bccText.slice( -1 ) == ';'){
    		bccText = bccText.slice( 0, -1 );
		}
    	
    	bcc = bccText.split(";"); //送信先アドレス設定
    } 
    
    var bccAdd = [];
    if(request.shinsei_data.mail_bcc_2 != null){
    	//改行コードをreplace
    	bccText = request.shinsei_data.mail_bcc_2.replace(/\r?\n/g, '');
    	
    	//末尾が;の場合は、除去
    	if(bccText.slice( -1 ) == ';'){
    		bccText = bccText.slice( 0, -1 );
		}    	
    	bccAdd = bccText.split(";"); //送信先アドレス設定
    }

    Logger.getLogger().info('bcc ' + ImJson.toJSONString(bcc, true));
    
    // 添付ファイル取得
	var storages = [];
	for(var i in request.tempu_file_list){
    	var sesStrage = Constant.LO_PATH_SESSION_STORAGE + request.tempu_file_list[i].file_path;
		var storage = new SessionScopeStorage(sesStrage);
		
		// セッションストレージにファイルが無ければエラー
		if (storage.isFile()) {
			storages.push({"file_name":request.tempu_file_list[i].file_name,"storage":storage});
		}			
	}
	
	if(storages.length >0){
		mailParam.attachment = storages;
	}	
    
    if(request.shinsei_data.send_mode == "1"){// 一斉送信
    	
    	mailParam.to = to; //送信先アドレス設定
    	
	    // BCCを分割して送信
		if(bcc.length >0){
		    for(var i=0;i<Math.ceil(bcc.length/bcc_separate_count);i++){
		    	mailParam.bcc = bcc.slice(i*bcc_separate_count,(i+1)*bcc_separate_count-1).concat(bccAdd);
		    	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sendMail",mailParam);
		    }
	    }
	
	    Logger.getLogger().info('mailParam ' + ImJson.toJSONString(mailParam, true));
    }else if(request.shinsei_data.send_mode == "2"){// 個別送信    	
    	mailParam.bcc = bcc;
    	
    	// TOを１件ずつ送信
    	for(var i=0;i<to.length;i++){
    		mailParam.to = [to[i]];
	    	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sendMail",mailParam);
	    }
    }else if(request.shinsei_data.send_mode == "3"){
    	// そのまま送信
    	mailParam.to = to;
    	mailParam.bcc = bcc;
    	
    	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sendMail",mailParam);    	
    }
    
    
    // 完了メール送信
    mailParam ={};
    var adminBody = request.shinsei_data.mail_to;
    adminBody += request.shinsei_data.mail_cc;
    adminBody += request.shinsei_data.mail_bcc;
    
    var sql = "" ;
	sql += "SELECT ";
	sql += "  u.email_address1 ";
	sql += "FROM ";
	sql += "  imm_user AS u ";
	sql += "WHERE " ;
	sql += "  u.delete_flag ='0' ";
	sql += "  And user_cd = ? ";
	
	// 条件設定
	var strParam=[];
	strParam.push(DbParameter.string($userInfo.userCd));

	// sql実行
	var db = new TenantDatabase();
	var result = db.select(sql, strParam, 0);
	
	var send_from = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue",[],Constant.LO_CDCLS_SEND_MAIL_FROM);
	
    mailParam.to = [result.data[0].email_address1]; //送信先アドレス設定
    mailParam.cc = [];
    mailParam.bcc = [];
    mailParam.from = send_from["1"]; //送信先アドレス設定
    mailParam.from = send_from["2"]; //送信先アドレス設定
    mailParam.subject = "メール送信完了のお知らせ"; //送信先アドレス設定
    
    var biko = request.shinsei_data.biko == null?"":request.shinsei_data.biko;
    
    mailParam.body = "以下のメールを送信しました。\n"; //送信先アドレス設定
    mailParam.body += "TO:"+to+"\n"; //送信先アドレス設定
    mailParam.body += "CC:"+cc+"\n"; //送信先アドレス設定
    mailParam.body += "BCC:"+bcc+"\n"; //送信先アドレス設定
    mailParam.body += "\n----------------------------------------------\n"; //送信先アドレス設定
    mailParam.body += request.shinsei_data.mail_body;    
    mailParam.body += "\n----------------------------------------------\n"; 
    
    mailParam.body += "添付ファイル:";
    
    var att = [];
    if(mailParam.attachment >0){
    	for(var i in mailParam.attachment){
    		att.push(mailParam.attachment[i].file_name);
    	}
    	
    	mailParam.body += att.join(",");
    	
    }
    mailParam.body += "\n----------------------------------------------\n"; 

    mailParam.body += "[備考]\n"; //送信先アドレス設定
    mailParam.body += biko; //送信先アドレス設定
    
    // 送信
	var res = Content.executeFunction("lo/common_libs/lo_send_mail","sendMail",mailParam);
	
	// ユーザー情報読み込み
	loadUserInfo();
		
	var shinseiId;
	var functionResult = {
	    error: false,
		shinsei_id: "",
		message: MessageManager.getMessage('KY02I012')
	};

	return functionResult;
}

/**
 * フロントでのバリデーションエラーメッセージを取得する
 * 
 * @return {object} メッセージリスト
 */
function getValidationMessages() {

	var message_id_header = "KS02E";
	var message_last_num = 94;
	var message_ids = [];
	for(var i=1; i<=message_last_num; i++) {
		message_ids.push(message_id_header + ('000'+i).slice(-3));
	}
	var messages = Content.executeFunction("lo/common_libs/lo_common_fnction", "getFilteredMessageList",message_ids);

	return ImJson.toJSONString(messages, false);
}