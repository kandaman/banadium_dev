/**
 * @fileoverview 新商品企画申請サンプル処理アクション処理.
 *
 * このプログラムは下記のような行為を行った場合に実行される処理です.<br />
 * アクションに対応したFunctionを実装することにより、処理が呼び出されます.<br />
 * 実装するFunction名は以下の通りです.
 * <ol>
 *   <li>承認: approve</li>
 *   <li>承認終了: approveEnd</li>
 * </ol>
 *
 * それぞれのFunctionに受け渡されるパラメータはargs及びuserParameterとなります.<br />
 * 引数argsは以下のプロパティを含みます.
 * <ul>
 *   <li>{String} loginGroupId: ログイングループID</li>
 *   <li>{String} localeId: ロケール(ja, en, zh_CN等)</li>
 *   <li>{Array&lt;String>} targetLocales: 対象ロケールID</li>
 *   <li>{String} contentsId: コンテンツID</li>
 *   <li>{String} contentsVersionId: コンテンツバージョンID</li>
 *   <li>{String} routeId: ルートID</li>
 *   <li>{String} routeVersionId: ルートバージョンID</li>
 *   <li>{String} flowId: フローID</li>
 *   <li>{String} flowVersionId: フローバージョンID</li>
 *   <li>{String} applyBaseDate: 申請基準日(yyyy/MM/dd形式)</li>
 *   <li>{String} processDate: 処理日/到達日(yyyy/MM/dd形式)</li>
 *   <li>{String} systemMatterId: システム案件ID</li>
 *   <li>{String} userDataId: ユーザデータID</li>
 *   <li>{String} matterName: 案件名</li>
 *   <li>{String} matterNumber: 案件番号</li>
 *   <li>{String} priorityLevel: 優先度</li>
 *   <li>{String} parameter: 実行しているアクション処理プログラムのパス</li>
 *   <li>{String} actFlag: 代理フラグ(本人処理の場合は"0"が設定されます.代理処理の場合は"1"が設定されます.)</li>
 *   <li>{String} nodeId: ノードID</li>
 *   <li>{Array&lt;String>} nextNodeIds : 移動先(次ノード)ノードID(差戻し、引戻し、案件操作時に設定されます.)</li>
 *   <li>{String} authUserCd: 処理権限者コード</li>
 *   <li>{String} execUserCd: 処理実行者コード</li>
 *   <li>{String} resultStatus: 処理結果ステータス</li>
 *   <li>{String} authCompanyCode: 権限会社コード</li>
 *   <li>{String} authOrgzSetCode: 権限組織セットコード</li>
 *   <li>{String} authOrgzCode: 権限組織コード</li>
 *   <li>{String} processComment: 処理コメント</li>
 *   <li>{String} lumpProcessFlag : 一括処理フラグ(一括承認時に"1"が設定されます。その他の場合は"0"が設定されます.)</li>
 *   <li>{String} autoProcessFlag : 自動処理フラグ(到達処理で自動承認やバッチで自動処理される時に設定されます.<br/>
 *          到達処理の自動処理（処理期限自動処理、既処理者自動承認、再処理者自動承認、連続自動承認）時に"1"が設定されます.その他の場合は”０"が設定されます.)
 *   </li>
 * </ul>
 * 
 * 返却値は以下の形式で結果を返却する必要があります.
 * <ul>
 *   <li>{Boolean} resultFlag: 処理結果フラグ(true: 成功/false: 失敗)</li>
 *   <li>{String} message: メッセージ(処理結果フラグがfalseの場合にのみ利用されます</li>
 * </ul>
 * 
 * このプログラムは、データベーストランザクション内において実行されます.<br />
 * execute関数内においてデータベーストランザクションの制御は不要です.<br />
 * 
 * @version $Revision$
 * @author 83002381
 * @since 1.0
 */

/**
 * 承認処理.
 *
 * このFunctionは、ワークフローの承認が行われた場合に呼出されます.<br/>
 * 一括処理が行われた場合はuserParameterには空のオブジェクトが渡ってきますので、ご注意下さい。
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function approve(args, userParameter){

	Logger.getLogger().info(' [approve] 承認処理');

    // 定数読み込み
	Constant.load("cactus/common_libs/const");
    
    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;
    
    // 一括処理の判定を行います
    /*var isBatchProcess = true;
    for(var name in userParameter){
        isBatchProcess = false;
        break;
    }
    
    if(isBatchProcess){
        // FIXME 一括処理の場合はデータの更新を行わずにそのまま処理を終了します
        // 一括承認時に任意の処理を行う必要がある場合はこのコードを修正してください.
        return {
            resultFlag: true,
            message: null
        };
    }

    // 入力内容の検証を実施します
    result = validate(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message,
            data: false
        };
    }
     */
	
    // ステータス区分セット
	if (args.nodeId == Constant.ID_NODE_SHONIN){ //承認
		userParameter.status_kbn = Constant.CD_STATUSKBN_SHONIN; //承認済み（受付待）
	}else {
		userParameter.status_kbn = Constant.CD_STATUSKBN_UKETUKE; //受付済み（版権担当待ち）
	}

    // アクション処理時の情報を保存します
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage
        };
    }

    // 案件プロパティを更新します
    //result = updateMatterProperty(args);
    /*result = updateMatterProperty(args,userParameter);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }*/
    
    // メールの送信
	try {
		var driver = new Packages.imart.mail.WorkflowMailController();
		if (args.nodeId == Constant.ID_NODE_SHONIN){ //承認
			// 承認→受付
			driver.storeMail("2",args.userDataId,args.processComment,args.nodeId);
			
		} else if (args.nodeId == Constant.ID_NODE_UKETUKE){
			// 受付→版元 　この時点でノードIDが展開されてないため完了画面表示時にメール送信を行う
			//driver.storeMail("3",args.userDataId,args.processComment,"");
		} else {
			// 版元登録
			driver.storeMail("4",args.userDataId,args.processComment,args.nodeId);
		}
		
    } catch (ex) {
        return {
            resultFlag: false,
            message: "メール失敗",
            data: false
        };
    }        
    

    return {
        resultFlag: true,
        message: null
    };
}

/**
 * 承認終了処理.
 * 
 * このFunctionは、ワークフローの承認終了が行われた場合に呼出されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function approveEnd(args, userParameter){

	Logger.getLogger().info(' [approveEnd] 承認終了処理');
	
    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;

    // 入力内容の検証を実施します
    result = validate(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message,
            data: false
        };
    }

    // アクション処理時の情報を保存します
    result = storeProcessData(args);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage
        };
    }

    // 案件プロパティを更新します
    /*result = updateMatterProperty(args);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }*/

    return {
        resultFlag: true,
        message: null
    };
}

// 引戻し
function pullBack(args,userParameter) {
	
	Logger.getLogger().info(' [pullBack] 引戻し処理');
      
	// 申請ステータス更新
	var result = sendBackData(args,userParameter,"pullBack");
    if(!result.resultFlag) {
        return {
            resultFlag: false,
            message: result.message
        };
    };



    return {
        resultFlag: true,
        message: null
    };
}
	
/**
 * 差戻し処理.
 * 
 * このFunctionは、ワークフローの差戻しが行われた場合に呼出されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function sendBack(args,userParameter) {

	Logger.getLogger().info(' [sendBack] 差戻し処理');
 
	// 申請ステータス更新
	var result = sendBackData(args,userParameter,"sendBack");
    if(!result.resultFlag) {
        return {
            resultFlag: false,
            message: result.message
        };
    };


    return {
        resultFlag: true,
        message: null
    };
}

/**
 * 差し戻し、取戻し時にDBデータを更新します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type DatabaseResult
 * @return 処理結果
 */
function sendBackData(args, userParameter,proctype){
	Logger.getLogger().info(' [sendBackData] 差戻し引き戻し処理時のDB更新');
    
	Constant.load("cactus/common_libs/const");
	
	var db = new TenantDatabase();

	// 戻し先のノードＩＤからステータス区分セット
	var status_kbn;
	var nodeId = args.nextNodeIds[0];
	if (nodeId == Constant.ID_NODE_SINSEI){ //申請
		status_kbn = Constant.CD_STATUSKBN_SAVE; //一時保存（再申請待ち）
	}else if (nodeId == Constant.ID_NODE_SHONIN){ //承認
		status_kbn = Constant.CD_STATUSKBN_APPLY; //申請済み（承認待)
	}else if (nodeId == Constant.ID_NODE_UKETUKE){ //受付
		status_kbn = Constant.CD_STATUSKBN_SHONIN; //承認済み（受付待ち）
	}else {
		status_kbn = Constant.CD_STATUSKBN_UKETUKE; //受付済み（版権担当待ち）
	}
	
	// 既に引き戻し済みの場合（複数版元からの引き戻し処理）後続処理終了
	if (proctype=="pullBack"){
	    var chk = db.select("select * from t_shinsei where im_user_data_id = ? and status_kbn = ? and sakujo_flg = '0'",[DbParameter.string(args.userDataId),DbParameter.string(status_kbn)]);
	    if (chk.countRow > 0){
	        return {
	        	resultFlag: true,
	            message: null
	        };
	    }
	}

	var updata = {
		status_kbn : status_kbn,
		bandai_kanri_no :'',
		koshinsha : args.execUserCd,
		koshin_dt : new Date(),
		koshin_program_id :'approveAction'
	}
	var where = "im_user_data_id = ?";
	var pra = [DbParameter.string(args.userDataId)];

	// 申請書ステータス更新
	var result = db.update("t_shinsei",updata,where,pra);
    if(result.error) {
    	Logger.getLogger().error('t_shinsei更新失敗');
        return {
            resultFlag: false,
            message: '申請ステータス更新 失敗'
        };
    }
    

    // メールの送信
	try {
        //Debug.console('メール送信------------------------------');
		var driver = new Packages.imart.mail.WorkflowMailController();
		
		// 差し戻し
		if (proctype=="sendBack"){
			if (nodeId == Constant.ID_NODE_SINSEI){ //承認へ戻す
				if (args.nodeId ==Constant.ID_NODE_SHONIN){
					driver.storeMail("6",args.userDataId,args.processComment,args.nodeId);
				}else if (args.nodeId ==Constant.ID_NODE_UKETUKE){
					driver.storeMail("7",args.userDataId,args.processComment,args.nodeId);
				}else{
					driver.storeMail("8",args.userDataId,args.processComment,args.nodeId);
				}
			} else if (nodeId == Constant.ID_NODE_UKETUKE){ //受付へ戻す
				// 版元→受付
				driver.storeMail("9",args.userDataId,args.processComment,args.nodeId);
			}
		// 取戻し
		}else if (proctype=="pullBack"){
			if (nodeId == Constant.ID_NODE_SINSEI){ //承認
			// 承認→申請へ
				driver.storeMail("10",args.userDataId,args.processComment,args.nodeId);
			} else if (nodeId == Constant.ID_NODE_UKETUKE){
				// 版元→受付
				driver.storeMail("11",args.userDataId,args.processComment,args.nodeId);
			}
		}
		
    } catch (ex) {
    	Logger.getLogger().error('メール作成失敗');
        return {
            resultFlag: false,
            message: "メール失敗",
            data: false
        };
    }

	// 経路設定削除
    db.remove("t_shinsei_flow", "shinsei_no = ? and node_kbn =  '03' ", [DbParameter.string(args.matterNumber)]);
    if(result.error) {
    	Logger.getLogger().error('経路設定削除 失敗');
        return {resultFlag: false,message: '経路設定削除 失敗'};
    }
	// 証紙削除
    db.remove("t_shinsei_shoshi", "shinsei_no = ? ", [DbParameter.string(args.matterNumber)]);
    if(result.error) {
    	Logger.getLogger().error('証紙情報削除 失敗');
        return {resultFlag: false,message: '証紙情報 失敗'};
    }
    // 版権元添付ファイル削除
    db.remove("t_shinsei_file", "shinsei_no = ? and file_kbn = '02' ", [DbParameter.string(args.matterNumber)]);
    if(result.error) {
    	Logger.getLogger().error('添付ファイルデータ削除 失敗');
        return {resultFlag: false,message: '添付ファイルデータ削除 失敗'};
    }
	
    return {
    	resultFlag: true,
        message: null
    };

}


	
// 取止め
function discontinue(parameter,userParameter) {
    //Debug.print( "----- discontinue approve -----" );

    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}
	
	
/**
 * 入力内容の検証を行ないます.
 *
 * 呼び出されるタイミングは、im-Workflow申請画面を表示する直前に呼び出されます
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 検証に失敗した場合、または入力内容に不備がある場合は返却オブジェクトのerrorプロパティにtrueが設定されます
 */
function validate(args, userParameter){
    return {
        error: false,
        message: null,
        detail: null
    };
}

/**
 * アクション処理時の情報を保存します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type DatabaseResult
 * @return 処理結果
 */
function storeProcessData(args, userParameter){

	Logger.getLogger().info(' [storeProcessData] アクション処理時の情報を保存します');

	// ＤＢ登録共通部
	var insertCommonObj = {
			torokusha : args.execUserCd,
			toroku_dt : new Date(),
			sakusei_program_id :'approveAction',
			koshinsha : args.execUserCd,
			koshin_dt : new Date(),
			koshin_program_id :'approveAction',
			sakujo_flg :'0'
	}
	var updateCommonObj = {
			koshinsha : args.execUserCd,
			koshin_dt : new Date(),
			koshin_program_id :'approveAction'
	}
	

    var db  = new TenantDatabase();
    
    



	//申請ステータス更新
    var shinseiObject =  {
    	status_kbn : userParameter.status_kbn
    };
    // 管理番号があれば更新
	if ('item_bnm_numder' in userParameter) {
		shinseiObject.bandai_kanri_no = userParameter.item_bnm_numder
    }
    // 申請データ
    margeObj(shinseiObject, updateCommonObj);
    var result = db.update('t_shinsei', shinseiObject, 'im_user_data_id = ?',[DbParameter.string(userParameter.imwUserDataId)]);
    if(result.error) {
    	Logger.getLogger().error('t_shinsei更新失敗');
        // エラー時はロールバックします。
        //Transaction.rollback();
        return {
            error: true,
            message: null,
            detail: null
        };
    }


    
	// 経路情報
    //　版権担当者があるか判断
    if ('item_copyright_user_data' in userParameter) {
    	var user_data = userParameter.item_copyright_user_data;
    	var row = 0;
        if (user_data instanceof Array){
        	// 削除
            db.remove('t_shinsei_flow', 'shinsei_no = ? and node_kbn = ? ', [DbParameter.string(args.matterNumber), DbParameter.string(Constant.KBN_NODE_HANMOTO)]);
          	for(var i=0; i < user_data.length; i++){
          		if (user_data[i] ==""){
          			continue;
          		}
          		
          		var data = ImJson.parseJSON(user_data[i]);
          		
          		var planObject =  {
          				shinsei_no : args.matterNumber, 
          				node_kbn : Constant.KBN_NODE_HANMOTO,
          				shorisha : data.user_cd,
          				hanmoto_cd : data.hanmoto_cd,
          				kaigai_flg : data.kaigai_flg,
          				toroku_status_kbn :""
                };
            	margeObj(planObject, insertCommonObj);
                var result = db.insert('t_shinsei_flow', planObject);
       	    	if(result.error) {
       	    		Logger.getLogger().error('t_shinsei_flow更新失敗');
         	        //Debug.console('経路情報登録 失敗------------------------------');
         	        // エラー時はロールバックします。
         	        //Transaction.rollback();
         	        return {
         	            error: true,
         	            message: null,
         	            detail: null
         	        };
         	    }
          	}
        }
    }

    // TODO 申請時とほぼ同じなので共通化してください。
    if('item_mailsend_user_data' in userParameter) {
    	var whereExceptDeleteObject = [];
    	for(var i=1; i < userParameter.item_mailsend_user_data.length; i++){
    		if (userParameter.item_mailsend_user_data[i]=="") continue;
    		
      		var data = ImJson.parseJSON(userParameter.item_mailsend_user_data[i]);
      		
      		// undefind回避
      		if(!data.user_cd) break;
      		
      		// ユーザ固定。グループも選択可能な仕様になった場合は修正する
    		var mailObject =  {
    			  shinsei_no : args.matterNumber, 
    			  user_group_kbn : Constant.KBN_USER,
    			  user_group_cd : data.user_cd
      	    };
    		
      	    // 削除対象から外す
      	    whereExceptDeleteObject.push(mailObject.user_group_kbn + "-" + mailObject.user_group_cd);
      	    
      	    var whereObject =  [
                DbParameter.string(args.matterNumber),
                DbParameter.string(mailObject.user_group_kbn),
                DbParameter.string(mailObject.user_group_cd)
            ];
      	    // 存在チェック
      	    result = db.select('select count(*) as cnt from t_shinsei_mail where shinsei_no = ? and user_group_kbn = ? and user_group_cd =?', whereObject);
      	    // 登録処理
      	    if(result.data[0].cnt == 0) {
    	  	  	margeObj(mailObject, insertCommonObj);
    	  	  	result = db.insert('t_shinsei_mail', mailObject);
    	  	  	
    	  	    if(result.error) {
       	    		Logger.getLogger().error('t_shinsei_mail更新失敗');
    	  	        // エラー時はロールバックします。
    	  	        //Transaction.rollback();
    	  	        return {
    	  	            error: true,
    		            message: null,
    	  	            detail: null
    	  	        };
    	  	    }
    	  	}
    	}
    	
    	// メール通知者 削除
    	if(whereExceptDeleteObject == 0) {
    		result = db.remove("t_shinsei_mail", "shinsei_no = ?", [DbParameter.string(args.matterNumber)]);
    		if(result.error) {
   	    		Logger.getLogger().error('メール通知者 全件削除失敗');
      	        return {
      	            error: true,
    	            message: null,
      	            detail: null
      	        };
      	    }
    	}else if(whereExceptDeleteObject.length > 0){
    		var whereExceptDeleteStr = "('" + whereExceptDeleteObject.join("','") + "')";
    		result = db.remove("t_shinsei_mail", "shinsei_no = ? and concat(user_group_kbn,'-',user_group_cd) NOT IN " + whereExceptDeleteStr, [DbParameter.string(args.matterNumber)]);
    		if(result.error) {
   	    		Logger.getLogger().error('メール通知者 削除失敗');
      	        return {
      	            error: true,
    	            message: null,
      	            detail: null
      	        };
      	    }
    	}
    }
    

    //　管理番号
    /*if ('item_bnm_numder' in userParameter) {
    	
    	var bnmNumderObject = {
        	bandai_kanri_no : userParameter.item_bnm_numder
    	};
    	// 更新処理
    	margeObj(bnmNumderObject, updateCommonObj);
    	var result = db.update('t_shinsei', bnmNumderObject, 'im_user_data_id = ?',[DbParameter.string(userParameter.imwUserDataId)]);
    	if(result.error) {
   	    	Logger.getLogger().error('管理番号登録 失敗');
 	        return {
 	            error: true,
 	            message: null,
 	            detail: null
 	        };
 	    }
    }*/
    
    //　証紙設定
    if ('item_stamp' in userParameter) {
    	var shoshiObject = {
    		shinsei_no :args.matterNumber,
    		hanmoto_cd :userParameter.node_hanmoto_cd,
    		kaigai_flg :userParameter.node_kaigai_flg,
    		shoshi_kbn :userParameter.item_stamp
    	};
  	    var whereObject =  [
            DbParameter.string(args.matterNumber),
            DbParameter.string(userParameter.node_hanmoto_cd),
            DbParameter.string(userParameter.node_kaigai_flg)
        ];
	    var result = db.select('select * from t_shinsei_shoshi where shinsei_no = ? and hanmoto_cd = ? and kaigai_flg = ?',whereObject);
	    if (result.countRow > 0){
	    	margeObj(shoshiObject, updateCommonObj);
	    	result = db.update('t_shinsei_shoshi', shoshiObject, 'shinsei_no = ? and hanmoto_cd = ? and kaigai_flg = ?',whereObject);
	    }else{
	    	margeObj(shoshiObject, insertCommonObj);
	        var result = db.insert('t_shinsei_shoshi', shoshiObject);    	
	    }
		    
    	if(result.error) {
	    	Logger.getLogger().error('t_shinsei_shoshi 登録失敗');
 	        return {
 	            error: true,
 	            message: null,
 	            detail: null
 	        };
 	    }
    }
    
    //登録種別があるか判断(OK,NG,一部NG)
    if ('item_approve_type' in userParameter) {
    	//ステータスを更新
    	var approveObject = {
    		toroku_status_kbn : userParameter.item_approve_type
    	};
      	var whereObject =  [
      	    DbParameter.string(args.matterNumber),
	        DbParameter.string(Constant.KBN_NODE_HANMOTO),
	        DbParameter.string(args.execUserCd),
	        DbParameter.string(userParameter.node_hanmoto_cd),
	        DbParameter.string(userParameter.node_kaigai_flg),
	    ];
    	margeObj(approveObject, updateCommonObj);
    	// 更新処理
    	var result = db.update('t_shinsei_flow', approveObject, 'shinsei_no = ? and node_kbn = ? and shorisha = ? and hanmoto_cd = ? and kaigai_flg = ? ',whereObject);
    	if(result.error) {
	    	Logger.getLogger().error('t_shinsei_flow 更新失敗');
 	        return {
 	            error: true,
 	            message: null,
 	            detail: null
 	        };
 	    }
    }
    
    

    //　添付ファイル設定
    //Debug.console('添付ファイル------------------------------');
    if (userParameter.item_tmpFile_name instanceof Array){
    	
    	// 行番号取得
    	var result = db.select('select max(file_gyo_no) as gyo_no from t_shinsei_file where shinsei_no = ? ',[DbParameter.string(args.matterNumber)]);
    	var gyo_no = 0;
	    if (result.countRow > 0){
	    	gyo_no = result.data[0].gyo_no;
	    }	
    	for(var i=1; i < userParameter.item_tmpFile_name.length; i++){
      		if (userParameter.item_tmpFile_name[i]==""){
      			continue;
      		}
      		gyo_no++;
    		var fileObject =  {
    			  shinsei_no : args.matterNumber,
    			  file_gyo_no : gyo_no,
    			  file_nm : userParameter.item_tmpFile_name[i],
    			  file_path : userParameter.item_tmpFile_resname[i],
    			  file_kbn : Constant.CD_FILE_CHOHYO,
    			  hanmoto_cd : userParameter.node_hanmoto_cd,
    			  kaigai_flg : userParameter.node_kaigai_flg,
    			  biko : userParameter.item_tmpFile_comment[i]
      	    };
        	margeObj(fileObject, insertCommonObj);
	      	var result = db.insert('t_shinsei_file', fileObject);
      	    if(result.error) {
      	        //Debug.console('ファイル情報登録 失敗------------------------------');
    	    	Logger.getLogger().error('t_shinsei_file 登録失敗');
      	        return {
      	            error: true,
    	            message: null,
      	            detail: null
      	        };
      	    }
		    // ファイルをセッションストレージからパブリックストレージへ移動
		    // セッションストレージ取得
		    var filname = Constant.PATH_SESSION_STORAGE + userParameter.item_tmpFile_resname[i];
		    var sesstorage = new SessionScopeStorage(filname);
		    if(sesstorage.isFile()) {
		    	// パブリックストレージ取得
		    	var dir = Constant.PATH_PUBLIC_STORAGE + args.matterNumber + "/";
		    	var pubdir = new PublicStorage(dir);
			    if (!pubdir.isDirectory()){
			    	//ディレクトリが存在しなければ作成
			    	pubdir.makeDirectories();
			    }
			    //var pubstorage = new PublicStorage(dir + userParameter.item_tmpFile_name[i]);
			    var pubstorage = new PublicStorage(dir + userParameter.item_tmpFile_resname[i]);
			    sesstorage.copy(pubstorage, true); //パブリックグループへコピー
		    }else{
      	    	Logger.getLogger().error('セッションストレージからパブリックストレージへのファイル移動に失敗しました');
		    }
    	}
  	}    










    //db.update('my_workflwo_table', storeAddObject, 'imw_user_data_id = ?', [new DbParameter(userParameter.imwUserDataId, DbParameter.TYPE_STRING)]);

    return {
        error: false
    };
}

/**
 * 案件プロパティを更新します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @type WorkflowResultInfo
 * @return 処理結果
 */
//function updateMatterProperty(args){
function updateMatterProperty(args,userParameter){
    var userProperties = new UserActvMatterPropertyValue();
    var properties = [];
    
    //登録種別があるか判断
    if ('item_approve_type' in userParameter) {
    	properties.push({
    		matterPropertyKey : 'item_approve_type',
    		matterPropertyValue : userParameter.item_approve_type,
    		userDataId : args.userDataId
    	});        	
    	// パラメータチェック
    	var result = userProperties.getMatterProperty(args.userDataId, "item_approve_type");
    	// ユーザプロパティテーブル（imw_t_user_data）に既に存在していれば更新、なければ登録
    	if (result.resultFlag && result.data){
             //Debug.console("案件更新！！");
        	return userProperties.updateMatterProperty(properties);
    	}else{
        	// 案件プロパティを更新します
            // Debug.console("案件登録！！");
        	return userProperties.createMatterProperty(properties);
    	}
    }else{
        return {
            resultFlag: true,
            message: null
        };    
    }
}

/**
* IM-Workflow API利用時にメッセージの取得を行います。
* @type String
* @param {ResultStatusInfo} resultStatus 
* @return 処理結果
*/
function getMessage(resultStatus){
    if(resultStatus == null) return '';
    if(resultStatus.messageId == null) return '';
    var tenantInfoManager = new TenantInfoManager();
    var result = tenantInfoManager.getTenantInfo(true);
    if(result.error) {
        return '';
    }
    var tenantInfo = result.data;
    return WorkflowCommonUtil.getMessage(tenantInfo.locale, resultStatus.messageId, resultStatus.messageArgs);
}

//=============================================================================
// オブジェクトのマージ
//=============================================================================
function margeObj(objA,objB) {
    for (var key in objB) {
    	objA[key] = objB[key];
    }
    return objA;
}