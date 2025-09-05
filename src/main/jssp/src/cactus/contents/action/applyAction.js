/**
 * @fileoverview 新企画処理アクション処理.
 *
 * このプログラムは下記のような行為を行った場合に実行される処理です.<br />
 * アクションに対応したFunctionを実装することにより、処理が呼び出されます.<br />
 * 実装するFunction名は以下の通りです.
 * <ol>
 *   <li>申請: apply</li>
 *   <li>再申請: reapply</li>
 *   <li>申請（一時保存）: applyFromTempSave</li>
 *   <li>申請（未処理）: applyFromUnapply</li>
 *   <li>一時保存（新規登録）: tempSaveCreate</li>
 *   <li>一時保存（更新）: tempSaveUpdate</li>
 *   <li>一時保存（削除）: tempSaveDelete</li>
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
 *   <li>{String} data: 案件番号 (申請/申請(一時保存)/申請（未処理）の場合のみ必要. 再申請の場合は任意.)
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
 * 申請処理.
 *
 * このFunctionは、ワークフローの申請が行われた場合に呼出されます.<br />
 * 申請処理では、案件番号を返却する必要があります.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function apply(args, userParameter){

	Logger.getLogger().info('[apply] 申請処理');
	
	// 定数読み込み
	Constant.load("cactus/common_libs/const");

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

    // 案件番号
    var matterNumber = "";
    if (userParameter.item_matter_number == ""){
//        // このプログラムでは、IM-Workflow が提供する「WorkflowNumberingManager#getNumber()」で案件番号の採番を行っています.
//        result = WorkflowNumberingManager.getNumber(args.localeId);
//        if(!result.resultFlag){
//            return {
//                resultFlag: false,
//                message: getMessage(result.resultStatus),
//                data: false
//            };
//        }
        // 案件番号
        matterNumber = getNewShinseiNo();
        userParameter.item_matter_number = matterNumber;
        userParameter.update_flg = false; //案件番号がない場合は新規登録
    }else{
        matterNumber = userParameter.item_matter_number;
        userParameter.update_flg = true; //案件番号がある更新
    }
    
    // ステータス区分セット
    userParameter.status_kbn = Constant.CD_STATUSKBN_APPLY; //申請（承認待ち）
    
    // アクション処理時の情報を保存します
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage,
            data: false
        };
    }

    // 案件プロパティを作成します
    /*result = createMatterProperty(args, userParameter);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }*/

    // メールの送信
	try {
		var driver = new Packages.imart.mail.WorkflowMailController();
		driver.storeMail("1",args.userDataId,args.processComment,args.nodeId);
    } catch (ex) {
    	Logger.getLogger().error('メール送信失敗');
        return {
            resultFlag: false,
            message: "メール失敗",
            data: false
        };
    }        


    return {
        resultFlag: true,
        message: null,
        data: matterNumber
    };
}

/**
 * 再申請処理.
 *
 * このFunctionは、ワークフローの再申請が行われた場合に呼出されます.<br />
 * 再申請処理で、案件番号を変更する場合はdataプロパティに案件番号を設定する必要があります.<br />
 * 案件番号が返却されない場合は、申請時の案件番号が自動的に設定されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function reapply(args, userParameter){

	Logger.getLogger().info(' [reapply] 再申請処理');

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

    // 定数読み込み
	Constant.load("cactus/common_libs/const");
    // ステータス区分セット
    userParameter.status_kbn = Constant.CD_STATUSKBN_APPLY; //申請（承認待ち）
    

    // アクション処理時の情報を保存します
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage,
            data: false
        };
    }

    // 案件プロパティを更新します
/*    result = updateMatterProperty(args, userParameter);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }
*/
    // メールの送信
	try {
		var driver = new Packages.imart.mail.WorkflowMailController();
		driver.storeMail("1",args.userDataId,args.processComment,args.nodeId);
    } catch (ex) {
    	Logger.getLogger().error('メール作成失敗');
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
 * 申請(一時保存案件)処理.
 *
 * このFunctionは、ワークフローの申請(一時保存案件)が行われた場合に呼出されます.<br />
 * 申請(一時保存案件)処理では、案件番号を返却する必要があります.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function applyFromTempSave(args, userParameter){

	Logger.getLogger().info(' [applyFromTempSave] 申請(一時保存案件)処理');

    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;

    // 入力内容の検証を実施します
    /*result = validate(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message,
            data: false
        };
    }
    

    // このプログラムでは、IM-Workflow が提供する「WorkflowNumberingManager#getNumber()」で案件番号の採番を行っています.
    result = WorkflowNumberingManager.getNumber(args.localeId);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus),
            data: false
        };
    }
        // 案件番号
    var matterNumber = result.data;

    */
    // 案件番号
    var matterNumber = userParameter.item_matter_number;
    userParameter.update_flg = true;
    
    // 定数読み込み
	Constant.load("cactus/common_libs/const");
    // ステータス区分セット
    userParameter.status_kbn = Constant.CD_STATUSKBN_APPLY; //申請（承認待ち）
    
    // アクション処理時の情報を保存します
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage,
            data: false
        };
    }

    // 案件プロパティを更新します
    /*result = updateMatterProperty(args, userParameter);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }*/
    
    // メールの送信
	try {
		var driver = new Packages.imart.mail.WorkflowMailController();
		driver.storeMail("1",args.userDataId,args.processComment,args.nodeId);
    } catch (ex) {
    	Logger.getLogger().error('メール作成失敗');
        return {
            resultFlag: false,
            message: "メール失敗",
            data: false
        };
    }   

    return {
        resultFlag: true,
        message: null,
        data: matterNumber
    };
}

/**
 * 申請(未申請状態案件)処理.
 *
 * このFunctionは、ワークフローの申請(未申請状態案件)が行われた場合に呼出されます.<br />
 * 申請(未申請状態案件)処理では、案件番号を返却する必要があります.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function applyFromUnapply(args, userParameter){

	Logger.getLogger().info(' [applyFromUnapply] 申請(未申請状態案件)処理');

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

    // このプログラムでは、IM-Workflow が提供する「WorkflowNumberingManager#getNumber()」で案件番号の採番を行っています.
    result = WorkflowNumberingManager.getNumber(args.localeId);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus),
            data: false
        };
    }

    // 案件番号
    var matterNumber = result.data;

    // アクション処理時の情報を保存します
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.errorMessage,
            data: false
        };
    }

    // FIXME 起票時に、案件プロパティを作成しない場合は、ここを案件プロパティを作成する処理に書き換えてください。
    // 案件プロパティを更新します
    /*result = updateMatterProperty(args, userParameter);
    if(!result.resultFlag){
        return {
            resultFlag: false,
            message: getMessage(result.resultStatus)
        };
    }*/

    return {
        resultFlag: true,
        message: null,
        data: matterNumber
    };
}

/**
 * 一時保存（新規登録）処理.
 *
 * このFunctionは、ワークフローの一時保存（新規登録）が行われた場合に呼出されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function tempSaveCreate(args, userParameter){

	Logger.getLogger().info(' [tempSaveCreate] 一時保存（新規登録）処理');

    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;


    // 案件番号
    var matterNumber = "";
    if (userParameter.item_matter_number == ""){
//        // このプログラムでは、IM-Workflow が提供する「WorkflowNumberingManager#getNumber()」で案件番号の採番を行っています.
//        result = WorkflowNumberingManager.getNumber(args.localeId);
//        if(!result.resultFlag){
//            return {
//                resultFlag: false,
//                message: getMessage(result.resultStatus),
//                data: false
//            };
//        }
        // 案件番号
        matterNumber = getNewShinseiNo();
        userParameter.item_matter_number = matterNumber;
        userParameter.update_flg = false; //案件番号がない場合は新規登録
    }else{
        matterNumber = userParameter.item_matter_number;
        userParameter.update_flg = true; //案件番号がある更新
    }
	
    
    // 定数読み込み
	Constant.load("cactus/common_libs/const");
    // ステータス区分セット
    userParameter.status_kbn = Constant.CD_STATUSKBN_SAVE; //一時保存    

    // 一時情報を保存します
    //result = storeTemporaryData(args, userParameter);
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message
        };
    }

    // 案件プロパティを作成します
    /*result = createMatterProperty(args, userParameter);
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

/**
 * 一時保存（更新）処理.
 *
 * このFunctionは、ワークフローの一時保存（更新）が行われた場合に呼出されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function tempSaveUpdate(args, userParameter){

	Logger.getLogger().info(' [tempSaveUpdate] 一時保存（更新）処理');

    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;

    // 定数読み込み
	Constant.load("cactus/common_libs/const");
    // ステータス区分セット
    userParameter.status_kbn = Constant.CD_STATUSKBN_SAVE; //一時保存    
    userParameter.update_flg = true; //案件番号がある更新
    
    // 一時情報を保存します
    //result = storeTemporaryData(args, userParameter);
    result = storeProcessData(args, userParameter);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message
        };
    }

    // 案件プロパティを更新します
    /*result = updateMatterProperty(args, userParameter);
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

/**
 * 一時保存（削除）処理.
 *
 * このFunctionは、ワークフローの一時保存（削除）が行われた場合に呼出されます.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type Object
 * @return 処理結果
 */
function tempSaveDelete(args, userParameter){

	Logger.getLogger().info('[tempSaveDelete] 一時保存（削除）処理');

    // FIXME 必要に応じてアクション処理時に必要な処理を記述して下さい.
    var result;
    
    // 一時情報を削除します
    //result = deleteTemporaryData(args, userParameter);
    result = deleteTemporaryData(args);
    if(result.error){
        return {
            resultFlag: false,
            message: result.message
        };
    }

    // 案件プロパティを削除します
    /*result = deleteMatterProperty(args, userParameter);
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
function pullBack(parameter,userParameter) {
	
   Logger.getLogger().info('引戻し処理 --pullBack--');

    var result = {
                  "resultFlag" : true,
                  "message"    : ""
                 };
    return result;
}


// 取止め
function discontinue(args,userParameter) {
	Logger.getLogger().info('取止め処理 --discontinue--');
    
    // FIXME 必要に応じて処理を実装してください。
    var db     = new TenantDatabase();
    var shinsei_no="";
    //　ユーザＩＤをもとに申請番号を取得
    var result = db.select("select * from t_shinsei where im_user_data_id = ? and sakujo_flg='0'",[DbParameter.string(args.userDataId)]);
	if (result.countRow > 0){
		shinsei_no = result.data[0].shinsei_no;
  	}else{
    	Logger.getLogger().error('申請情報取得失敗 user_data_id =' + args.userDataId);
  	    return {
  	        error: true,
  	        message: "申請情報が取得できません"
  	    };
  	}
  	
	var updateObj = {
			sakujo_flg :'1',
			koshinsha : args.execUserCd,
			koshin_dt : new Date(),
			koshin_program_id :'applyAction'
	}

	//申請削除 (論理削除)
    var result = db.update('t_shinsei', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_character', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_file', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_flow', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_kanren_bunsho', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_mail', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_meisai', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    //var result = db.update('t_shinsei_shonin_rireki', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);
    var result = db.update('t_shinsei_shoshi', updateObj, 'shinsei_no = ?',[DbParameter.string(shinsei_no)]);

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
    // FIXME 必要に応じて入力内容の検証処理を実装してください.
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
	
	// 定数読み込み
	Constant.load("cactus/common_libs/const");

	var db  = new TenantDatabase();
	var result={};
	
	var login_user = ImJson.parseJSON(userParameter.item_login_user_data);
	var tantou_user = ImJson.parseJSON(userParameter.item_tantou_user_data);
	var apply_num = userParameter.item_matter_number; //暫定対応
	var update_flg = userParameter.update_flg;
	var dt = new Date();
	
	// インサート時共通パラメータ
	var insertCommonObj = {
			torokusha : args.execUserCd,
			toroku_dt : dt,
			sakusei_program_id :'applyAction',
			koshinsha : args.execUserCd,
			koshin_dt : dt,
			koshin_program_id :'applyAction',
			sakujo_flg :'0'
	}
	// アップデート共通パラメータ
	var updateCommonObj = {
			koshinsha : args.execUserCd,
			koshin_dt : dt,
			koshin_program_id :'applyAction'
	}

	
	//Debug.console('申請登録------------------------------');


	// 登録オブジェクトの生成
    var storeObject =  {
    	shinsei_no : apply_num,
    	im_user_data_id : userParameter.imwUserDataId,
    	im_system_anken_id :args.systemMatterId, //todoシステム案件番号入れる
    	shinsei_typ_cd : userParameter.item_sheetType,
    	jigyobu_cd : userParameter.item_division,
    	kiansha :login_user.user_cd,
    	kian_shozoku_cd :login_user.department_cd,  
    	tantosha :tantou_user.user_cd,
    	tanto_shozoku_cd :tantou_user.department_cd,
    	title_nm : userParameter.item_itemNameJap,
    	title_nm_kaigai : userParameter.item_itemNameEng,
    	dlc_flg : userParameter.item_dlc,
    	genre : userParameter.item_genre,
    	biko : userParameter.item_apply_note,
    	bandai_kanri_no : '',
    	toroku_kekka_kbn : '',
    	shanaimuke_kyoyujiko : userParameter.item_company_comment,
    	status_kbn : userParameter.status_kbn
    };
    
    // 申請日の設定 (申請者に引戻し差戻しされることはないので、ここでまとめて処理)
    var a = Constant.CD_STATUSKBN_APPLY;
    if (userParameter.status_kbn == Constant.CD_STATUSKBN_APPLY) {
    	margeObj(storeObject, {shinsei_dt : dt});
    };
    
    // 申請データ
    result = db.select('select * from t_shinsei where im_user_data_id = ?',[DbParameter.string(userParameter.imwUserDataId)]);
    if (result.countRow > 0){
    	margeObj(storeObject, updateCommonObj);
    	result = db.update('t_shinsei', storeObject, 'im_user_data_id = ?',[DbParameter.string(userParameter.imwUserDataId)]);
    }else{
    	margeObj(storeObject, insertCommonObj);
    	result = db.insert('t_shinsei', storeObject);
    }
    if(result.error) {
    	Logger.getLogger().error('t_shinsei登録失敗');
        // エラー時はロールバックします。
        //Transaction.rollback();
        return {
            error: true,
            message: null,
            detail: null
        };
    }
    
    //Debug.console('関連文書------------------------------');

    //'関連文書'
    db.remove('t_shinsei_kanren_bunsho', 'shinsei_no = ?', [new DbParameter(apply_num, DbParameter.TYPE_STRING)]);
    for(var n=1; n < 3; n++){
    	var relation;
        if (n==1){
        	relation = userParameter.item_relation_applyData;
        }else{
        	relation = userParameter.item_relation_docData;        	
        }
        if (relation instanceof Array){
          	for(var i=1; i < relation.length; i++){
          		if (relation[i]==""){
          			continue;
          		}
          		var data = ImJson.parseJSON(relation[i]);
          	    var relationObject =  {
          	    	shinsei_no : apply_num,
          	  		kanren_shinsei_no : data.number,
          	    	kanren_shinsei_kbn : ""+n
          	    };
          	    margeObj(relationObject, insertCommonObj);
	          	result = db.insert('t_shinsei_kanren_bunsho', relationObject);
	          	
          	    if(result.error) {
          	    	Logger.getLogger().error('t_shinsei_kanren_bunsho登録失敗');
          	        //Debug.console('関連情報登録 失敗------------------------------');
          	        // エラー時はロールバックします。
          	        //Transaction.rollback();
          	        return {
          	            error: true,
          	            message: '関連登録失敗',
          	            detail: null
          	        };  	        
          	    }
          	}
        }
    }

    //Debug.console('キャラクタ------------------------------');

    //キャラクタ
    db.remove('t_shinsei_character', 'shinsei_no = ?', [new DbParameter(apply_num, DbParameter.TYPE_STRING)]);
  	var charaData = userParameter.item_characterlistData;
    if (charaData instanceof Array){
      	for(var i=1; i < charaData.length; i++){
      		if (charaData[i]==""){
      			continue;
      		}
      		
      		var data = ImJson.parseJSON(charaData[i]);
      	    var charaObject =  {
      	      shinsei_no :apply_num,
      	      character_gyo_no :i,
      	      character_cd :data.character_cd,
      	      hanmoto_cd :data.hanmoto_cd,
      	      kaigai_flg :data.kaigai_flg
      	    };
	    	margeObj(charaObject, insertCommonObj);
      	    result = db.insert('t_shinsei_character', charaObject);
      	    if(result.error) {
      	    	Logger.getLogger().error('t_shinsei_character登録失敗');
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

  	//Debug.console('申請内容------------------------------');

	// 申請内容情報
  	db.remove('t_shinsei_meisai', 'shinsei_no = ?', [new DbParameter(apply_num, DbParameter.TYPE_STRING)]);
  	if (!userParameter.item_sheetType==""){
  		if (userParameter.item_area_name instanceof Array){

			for(var i=1; i < userParameter.item_area_name.length; i++){
				var contensObject =  {
					shinsei_no : apply_num,
					meisai_gyo_no : i,
					meisai_gyo_nm : getObjArrayVal(userParameter,'item_content_name',i),
					region_kuni_cd : getObjArrayVal(userParameter,'item_area_cd',i),
					sonota_region_kuni_nm : getObjArrayVal(userParameter,'item_area_name',i),
					tuka_cd : getObjArrayVal(userParameter,'item_currency',i),
					sonota_tuka_nm : getObjArrayVal(userParameter,'item_otherCurrency',i),
					platform_cd : getObjArrayVal(userParameter,'item_platform',i),
					sonota_platform_nm : getObjArrayVal(userParameter,'item_otherPlatform',i),
					hatubai_ymd : strToYMD(getObjArrayVal(userParameter,'item_sale_date',i)),
					kakaku : strToNumber(getObjArrayVal(userParameter,'item_price',i)),
					kakakutai_kbn : getObjArrayVal(userParameter,'item_price_type',i),
					suryo : strToNumber(getObjArrayVal(userParameter,'item_suryo',i)) ,
					dlban_kbn : getObjArrayVal(userParameter,'item_dl_flg',i),
					dlban_kakaku : strToNumber(getObjArrayVal(userParameter,'item_dlPrice',i)),
					kikan : getObjArrayVal(userParameter,'item_period',i),
					event_nm_basho : getObjArrayVal(userParameter,'item_event_name',i),
					biko : getObjArrayVal(userParameter,'item_note',i)
		  	    };

				Debug.console(contensObject);

	      	    /*var whereObject =  [
      	            DbParameter.string(apply_num),
      	            DbParameter.string(""+i)
      	        ];*/
		    	margeObj(contensObject, insertCommonObj);
		  	    result = db.insert('t_shinsei_meisai', contensObject);
		  	    
		  	    
		  	    if(result.error) {
	      	    	Logger.getLogger().error('t_shinsei_meisai登録失敗');
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
    
    //Debug.console('添付ファイル------------------------------');

    if (userParameter.item_tmpFile_name instanceof Array){
    	for(var i=1; i < userParameter.item_tmpFile_name.length; i++){
      		if (userParameter.item_tmpFile_name[i]==""){
      			continue;
      		}
      		
    		var fileObject =  {
    			  shinsei_no : apply_num,
    			  file_gyo_no : i,
    			  file_nm : userParameter.item_tmpFile_name[i],
    			  file_path : userParameter.item_tmpFile_resname[i],
    			  file_kbn : Constant.CD_FILE_SHIRYO,
    			  hanmoto_cd : '',
    			  kaigai_flg : '',
    			  biko : userParameter.item_tmpFile_comment[i]
      	    };
      	    var whereObject =  [
	            DbParameter.string(apply_num),
	            DbParameter.number(i)
	        ];
		    result = db.select('select * from t_shinsei_file where shinsei_no = ? and file_gyo_no = ? ',whereObject);
		    if (result.countRow > 0){
		    	margeObj(fileObject, updateCommonObj);
		    	result = db.update('t_shinsei_file', fileObject, 'shinsei_no = ? and file_gyo_no = ? ',whereObject);
		    }else{
		    	margeObj(fileObject, insertCommonObj);
	      	    result = db.insert('t_shinsei_file', fileObject);
		    }	

      	    if(result.error) {
      	    	Logger.getLogger().error('t_shinsei_file登録失敗');
      	        // エラー時はロールバックします。
      	        //Transaction.rollback();
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
		    	var dir = Constant.PATH_PUBLIC_STORAGE + apply_num + "/";
		    	var pubdir = new PublicStorage(dir);
			    if (!pubdir.isDirectory()){
			    	//ディレクトリが存在しなければ作成
			    	pubdir.makeDirectories();
			    }
			    //var pubstorage = new PublicStorage(dir + userParameter.item_tmpFile_name[i]);
			    var pubstorage = new PublicStorage(dir + userParameter.item_tmpFile_resname[i]);
			    sesstorage.copy(pubstorage, true); //パブリックグループへコピー
		    }else{
      	        //Debug.console('ファイルが存在しません------------------------------');
      	    	Logger.getLogger().error('セッションストレージからパブリックストレージへのファイル移動に失敗しました');
		    }
    	}
  	}
    
    
	// 経路情報
	// 企画承認者
	if (userParameter.item_plan_auth_data !=""){
		var plan_auth_data = ImJson.parseJSON(userParameter.item_plan_auth_data);
		var planObject =  {
			shinsei_no : apply_num, 
			node_kbn : Constant.KBN_NODE_SHONIN,
			//node_kbn : '01',
			shorisha : plan_auth_data.user_cd,
			hanmoto_cd : ''
	    };
  	    var whereObject =  [
            DbParameter.string(apply_num),
            DbParameter.string(Constant.KBN_NODE_SHONIN)
        ];
  	    result = db.select('select * from t_shinsei_flow where shinsei_no = ? and node_kbn = ? ',whereObject);
  	    if (result.countRow > 0){
	    	margeObj(planObject, updateCommonObj);
  	    	result = db.update('t_shinsei_flow', planObject, 'shinsei_no = ? and node_kbn = ?',whereObject);
  	    }else{
	    	margeObj(planObject, insertCommonObj);
  		    result = db.insert('t_shinsei_flow', planObject);
  	    }
		
	    if(result.error) {
  	    	Logger.getLogger().error('t_shinsei_flow登録失敗');
  	        // エラー時はロールバックします。
  	        //Transaction.rollback();
  	        return {
  	            error: true,
	            message: null,
  	            detail: null
  	        };

  	    }
	}
	

    // メール通知者 登録
	var whereExceptDeleteObject = [];
	for(var i=1; i < userParameter.item_mailsend_user_data.length; i++){
		if (userParameter.item_mailsend_user_data[i]=="") continue;
		
  		var data = ImJson.parseJSON(userParameter.item_mailsend_user_data[i]);
  		
  		// ユーザ固定。グループも選択可能な仕様になった場合は修正する
		var mailObject =  {
			  shinsei_no : apply_num, 
			  user_group_kbn : Constant.KBN_USER,
			  user_group_cd : data.user_cd
  	    };
		
  	    // 削除対象から外す
  	    whereExceptDeleteObject.push(mailObject.user_group_kbn + "-" + mailObject.user_group_cd);
  	    
  	    var whereObject =  [
            DbParameter.string(apply_num),
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
	  	    	Logger.getLogger().error('t_shinsei_mail登録失敗');
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
		result = db.remove("t_shinsei_mail", "shinsei_no = ?", [DbParameter.string(apply_num)]);
		if(result.error) {
  	        //Debug.console('メール通知者 全件削除失敗------------------------------');
  	    	Logger.getLogger().error('t_shinsei_mail削除失敗');
  	        return {
  	            error: true,
	            message: null,
  	            detail: null
  	        };
  	    }
	}else if(whereExceptDeleteObject.length > 0){
		var whereExceptDeleteStr = "('" + whereExceptDeleteObject.join("','") + "')";
		result = db.remove("t_shinsei_mail", "shinsei_no = ? and concat(user_group_kbn,'-',user_group_cd) NOT IN " + whereExceptDeleteStr, [DbParameter.string(apply_num)]);
		if(result.error) {
  	        //Debug.console('メール通知者 削除失敗------------------------------');
  	    	Logger.getLogger().error('t_shinsei_mail削除失敗');
  	        return {
  	            error: true,
	            message: null,
  	            detail: null
  	        };
  	    }
	}
	
    return {
        error: false,
        message: null,
        detail: null
    };
}

/**
 * 一時情報を削除します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @type Object
 * @return 処理結果
 */
function deleteTemporaryData(args){
	
	Logger.getLogger().info(' [deleteTemporaryData] 一時情報を削除します ');

    // FIXME 必要に応じて処理を実装してください。
    var db     = new TenantDatabase();
    var shinsei_no="";
    //　ユーザＩＤをもとに申請番号を取得
    var result = db.select("select * from t_shinsei where im_user_data_id = ? and sakujo_flg='0'",[DbParameter.string(args.userDataId)]);
	if (result.countRow > 0){
		shinsei_no = result.data[0].shinsei_no;
  	}else{
  		Logger.getLogger().error('申請情報が取得できません user_data_id='+args.userDataId);

  	    return {
  	        error: true,
  	        message: "申請情報が取得できません",
	        detail: null
  	    };
  	}
	
	//申請削除    
    db.remove('t_shinsei', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_character', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_file', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_flow', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_kanren_bunsho', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_mail', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_meisai', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    //db.remove('t_shinsei_shonin_rireki', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);
    db.remove('t_shinsei_shoshi', 'shinsei_no = ?', [DbParameter.string(shinsei_no)]);

    return {
        error: false,
        message: null,
        detail: null
    };
}
	
/**
 * 案件プロパティを登録します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function createMatterProperty(args, userParameter){
    var userProperties = new UserActvMatterPropertyValue();
    var properties = [];

    // FIXME プロパティのキーと値は必要に応じて内容を変更してください
    properties.push({
        matterPropertyKey : 'matterProperty',
        matterPropertyValue : '案件プロパティ1',
        userDataId : args.userDataId
    });

    // 案件プロパティを作成します
    return userProperties.createMatterProperty(properties);
}

/**
 * 案件プロパティを更新します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function updateMatterProperty(args, userParameter){
    var userProperties = new UserActvMatterPropertyValue();
    var properties = [];

    // FIXME プロパティのキーと値は必要に応じて内容を変更してください
    properties.push({
        matterPropertyKey : 'matterProperty',
        matterPropertyValue : '案件プロパティ2',
        userDataId : args.userDataId
    });

    // 案件プロパティを更新します
    return userProperties.updateMatterProperty(properties);
}

/**
 * 案件プロパティを削除します.
 *
 * @param {ActionProcessParameterInfo} args ワークフローパラメータ情報
 * @param {Object} userParameter リクエストパラメータオブジェクト
 * @type WorkflowResultInfo
 * @return 処理結果
 */
function deleteMatterProperty(args, userParameter){
    // 案件プロパティを削除します
    return new UserActvMatterPropertyValue().deleteMatterProperty([{
        userDataId : args.userDataId
    }]);
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
// オブジェクトに対象名が存在すれば値を返し、なければ空白を返す
//=============================================================================
function getObjArrayVal(obj,objName,index) {
	if (objName in obj){
		return obj[objName][index];
	}else{
		return "";
	}
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

//=============================================================================
// 文字列を数値に変換
//=============================================================================
function strToNumber(str) {
	if(str){
		// カンマ区切り削除
		var num = str.replace(/,/g,'');
		return Number(num);
	}else{
		return null;
	}
}
//=============================================================================
// 日付を８ケタ文字列に変換
//=============================================================================
function strToYMD(str) {
	// /削除
	var ymd = str.replace(/\//g,'');
	return ymd;
}

//=============================================================================
// 申請書番号を採番して返す
//=============================================================================
function getNewShinseiNo() {
	var r

	// 接頭辞
	var dt = new Date();
    var initialNumber = "NPP" + dt.getFullYear().toString().substr( 2,2 );
    
    // ６桁数値
    var db = new TenantDatabase();
    var no = "";
    //　シーケンスから取得
    var result = db.execute("select lpad(cast(nextval('seq_shinsei_no') as varchar), 6, '0') as no;",[]);
	if (result.countRow > 0){
		no = result.data[0].no;
  	}else{
  	    return {
  	        error: true,
  	        message: "シーケンスが取得できません",
	        detail: null
  	    };
  	}

    r = initialNumber + no;
	return r;
}