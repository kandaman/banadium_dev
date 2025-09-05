var $form = {};
var $data = {};
var $dialogMsg={};
var $sendproc={
		showFlg:false
};

function init(request) {

	Logger.getLogger().info(' [init]　my文書一覧画面表示');

	// URLにパラメータproctypeがあった場合フラグを立て、処理画面を呼び出すようにする
    //myProcess_list?proctype=3&imwSystemMatterId=ma_8eqk8d6edp9ba2l&imwUserDataId=8eqk88o1pp98g2l&imwNodeId=planApplNode_01
	if ("proctype" in request){
		if (request.proctype == "3" || request.proctype == "4"){

			$sendproc.showFlg = true;

			// 再申請画面が権限者以外でも開けてしまうのを防止
			if (request.proctype == "3"){
				// ログインユーザ取得
			    var oSession = Contexts.getAccountContext();
			    var userId = oSession.userCd;
			    // 処理マネージャの生成
				var processManager = new ProcessManager('ja',request.imwSystemMatterId,request.imwNodeId);
				// ログインユーザの処理権限者情報を取得
		        var result = processManager.getAuthUser(userId);
		        if (result.data.length == 0) {
		            // 取得結果がなければ処理対象外として後続処理なし
		        	$sendproc.showFlg = false;
		        }
			}

			if (!"imwSystemMatterId" in request) $sendproc.showFlg = false;
			if (!"imwNodeId" in request) $sendproc.showFlg = false;
			if (!"imwUserDataId" in request) $sendproc.showFlg = false;

			if ($sendproc.showFlg){
				$sendproc.imwPageType = request.proctype;
				$sendproc.imwSystemMatterId = request.imwSystemMatterId;
				$sendproc.imwNodeId = request.imwNodeId;
				$sendproc.imwUserDataId = request.imwUserDataId;
				
				Logger.getLogger().info('URLから直接遷移');
			}
		}
	}
	// 処理完了時の遷移先
    //$data.imwCallOriginalPagePath ="cactus/contents/screen/myProcess_list";

	getMstData();
	
	// メッセージ
	$dialogMsg.deleteDialogTitle = MessageManager.getMessage("IMW.CAP.1194"); //削除
    $dialogMsg.confirmDeleteMsg  = MessageManager.getMessage("IMW.CLI.INF.3503");// 一時保存情報を削除します。よろしいですか？
}


/**
 * マスタから各種情報を取得しfrom変数に格納します。
 * @param {Array}  検査する配列
 * @param {Object} 検査対象値
 * @returns {boolean} 検査結果
 */
function getMstData() {
    var db = new TenantDatabase();
    // 申請書
    var result = db.select("select * from m_shinsei_typ where sakujo_flg='0' order by sort_no");
    var list= [{label : "全て" ,value : ""}];
    for (var i=0;i < result.countRow;i++){
    	list[i+1] = {label : result.data[i].shinsei_typ_nm ,value : result.data[i].shinsei_typ_cd};
    }
    $form.list_m_shinsei_typ = list;
}


/**
 * DBから未処理一覧取得を取得。
 * @param {String}  検索種別（全て、未処理、処理中）
 * @param {Object} 検索条件オブジェクト
 * @param {Object} ソート条件オブジェクト
 * @returns {boolean} 検査結果
 */
function getMyProcessList(search_type,param,sort) {
	
	Logger.getLogger().info(' [getMyProcessList]　my文書一覧検索');

    // ログインユーザ情報の取得
    var oSession = Contexts.getAccountContext();
    var userId = oSession.userCd;


    var db = new TenantDatabase();
    var sql ="";

    sql +=" select ";
    sql +="      CASE WHEN t1.status_kbn = '00' THEN '一時保存' ";
    //sql +="           WHEN t1.status_kbn = '01' THEN '再申請待ち' ";
    sql +="           WHEN t1.status_kbn = '01' THEN '事業部承認待ち' ";
    sql +="           WHEN t1.status_kbn = '02' THEN 'メディア部受付待ち' ";
    sql +="           WHEN t1.status_kbn = '03' THEN '版権元確認中' ";
    sql +="           ELSE '-' ";
    sql +="      END as status_name ";
    sql +="     ,t1.status_kbn ";
    
    sql +="      ,CASE WHEN t1.status = 'tmpsave' THEN '1' "; //一時保存
    sql +="            WHEN t1.status = 'approvewait' THEN '4' "; //承認待ち
    sql +="            WHEN t1.status = 'reapplywait' THEN '3' "; //再申請待ち
    sql +="            ELSE '6' ";                                //詳細
    sql +="      END as pagetype ";
    
    sql +="     ,t1.flow_id ";
    sql +="     ,t1.node_id ";
    sql +="     ,t1.system_matter_id  ";
    sql +="     ,t1.im_user_data_id  ";
    sql +="     ,t1.auth_user_code  ";
    
    sql +="     ,t1.shinsei_no   ";
    sql +="     ,t1.shinsei_typ_cd   ";
    sql +="     ,t1.title_nm ";
    sql +="     ,u.shain_nm as kiansha_nm ";
    sql +="     ,to_char(t1.koshin_dt,'YYYY/MM/DD HH24:MI') as koshin_dt ";
    sql +="     ,COALESCE(t2.character_nms,'-') as character_nms ";

    //sql +="     ,COALESCE(t3.hanmoto_nms,'-') as hanmoto_nms ";
    sql +="     ,CASE WHEN t1.status_kbn = '03' and t1.status = 'approvewait' THEN im4.node_name ";
    sql +="           ELSE COALESCE(t3.hanmoto_nms,'-') ";
    sql +="      END as hanmoto_nms ";
    
    sql +="     ,CASE WHEN t4.kaigai_flg_kbn is null THEN '-'  ";
    sql +=" 	      WHEN t4.kaigai_flg_kbn = '00' THEN '国内'  ";
    sql +="           WHEN t4.kaigai_flg_kbn = '01' THEN '国内/海外'  ";
    sql +="           ELSE '海外'  ";
    sql +="      END as region_type  ";
    sql +="     ,t4.kaigai_flg_kbn";
    sql +="     ,m1.shinsei_typ_nm";
    sql +="   ";

    // ベース
    sql +=" from ";
    sql +=" ( ";
    
    if (search_type != "proc"){  //未処理案件
    
    sql +=" select distinct t1.*,im1.system_matter_id,im1.flow_id,im2.node_id,im2.auth_user_code,im3.status ";
    sql +=" from imw_t_actv_matter im1 ";
    
    sql +=" left join imw_t_actv_user_orgz im2 ";
    sql +="   on im1.system_matter_id = im2.system_matter_id ";
    
    sql +="   and im2.locale_id = 'ja' ";
    sql +=" left join imw_t_actv_task im3 ";
    sql +="   on im2.system_matter_id = im3.system_matter_id ";
    sql +="   and im2.node_id = im3.node_id ";
    sql +=" inner join t_shinsei t1 ";
    sql +="   on im1.matter_number = t1.shinsei_no ";
    sql +="   and t1.sakujo_flg = '0' ";
    sql +=" union all ";
    sql +=" select t1.* ,'' as system_matter_id ,im1.flow_id as flow_id ,im1.node_id as node_id,im1.auth_user_code,'tmpsave' as status"; 
    sql +=" from imw_t_temporary_save im1 "; //一時保存テーブル
    sql +=" inner join t_shinsei t1 ";
    sql +="   on im1.user_data_id = t1.im_user_data_id ";
    sql +="   and t1.sakujo_flg = '0' ";
    sql +=" where not exists(select * from imw_t_actv_matter im2 where im1.user_data_id = im2.user_data_id) ";

    }
    if (search_type == "all"){  //全て
    sql +=" union all ";
    }
    if (search_type != "unt"){  //処理済み
    
    sql +=" select distinct t1.*,im1.system_matter_id, im1.flow_id,'' as node_id,im3.update_user_code as auth_user_code,'detail' as status ";
    sql +=" from imw_t_actv_matter im1 ";
    sql +=" left join imw_t_cpl_task im3 ";
    sql +="   on im1.system_matter_id = im3.system_matter_id ";
    sql +="   and im3.status in ('apply','approve') ";
    sql +=" inner join t_shinsei t1 ";
    sql +="   on im1.user_data_id = t1.im_user_data_id ";
    sql +="   and t1.sakujo_flg = '0' ";
    }

    sql +=" ) t1 ";

    // キャラクター名
    sql +=" left join   ";
    sql +=" (  ";
    sql +="   select   ";
    sql +="       tc.shinsei_no  ";
    sql +="       ,string_agg(character_nm::text, '/'::text order by mc.character_cd) AS character_nms  ";
    sql +="   from (select distinct shinsei_no,character_cd from t_shinsei_character) tc  ";
    //sql +="   left join m_character mc  ";
    sql +="   left join v_m_character mc  ";
    sql +="   on tc.character_cd = mc.character_cd  ";
    sql +="   group by tc.shinsei_no   ";
    sql +="   ";
    sql +=" ) t2  ";
    sql +=" on t1.shinsei_no = t2.shinsei_no  ";
    // 版元名
    sql +=" left join   ";
    sql +=" (  ";
    sql +="   select   ";
    sql +="      tc.shinsei_no  ";
    sql +="      ,string_agg(hanmoto_nm::text, '/'::text order by mh.hanmoto_cd) AS hanmoto_nms  ";
    sql +="   from (select distinct shinsei_no,hanmoto_cd from t_shinsei_character) tc  ";
    //sql +="   left join m_hanmoto mh  ";
    sql +="   left join v_m_hanmoto mh  ";
    sql +="   on tc.hanmoto_cd = mh.hanmoto_cd  ";
    sql +="   group by tc.shinsei_no   ";
    sql +="   ";
    sql +=" ) t3  ";
    sql +=" on t1.shinsei_no = t3.shinsei_no  ";
    sql +="   ";
    // 地域（国内／海外）
    sql +=" left join   ";
    sql +=" (  ";
    sql +="  select   ";
    sql +="   shinsei_no  ";
    sql +="  ,min(kaigai_flg) || max(kaigai_flg) AS kaigai_flg_kbn "; //最小値と最大値を連結　00なら国内、0１なら国内/海外　11なら海外
    sql +="  from t_shinsei_character  ";
    sql +="  group by shinsei_no   ";
    sql +=" ) t4  ";
    sql +=" on t1.shinsei_no = t4.shinsei_no  ";

    // 申請種類
    sql +=" left join m_shinsei_typ m1 ";
    sql +=" on t1.shinsei_typ_cd = m1.shinsei_typ_cd ";

    // ユーザー名
    sql +=" left join v_user u ";
    sql +=" on t1.kiansha = u.im_user_cd ";
    sql +=" and u.im_locale_id = 'ja' ";
    sql +=" and u.im_delete_flag = '0' ";
    

    // 版権担当単位の版元名(ノード名を取得)
    sql +=" left join ";
    	
    sql +=" ( select distinct system_matter_id,node_id,node_name from ";
    sql +=" (select system_matter_id,node_id,node_name from imw_t_actv_task ";
    sql +=" union all ";
    sql +=" select system_matter_id,node_id,node_name from imw_t_cpl_task) s ) im4 ";
    sql +=" on t1.system_matter_id = im4.system_matter_id ";
    sql +=" and t1.node_id = im4.node_id ";

    sql +=" where t1.auth_user_code = ? ";

    
    // 入力パラメータ
    var strParam=[];
    strParam.push(DbParameter.string(userId)); //ログインユーザＩＤ


    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {};
    // 完全一致
    columnNameMap["shinsei_typ_cd"] = {col:"t1.shinsei_typ_cd",comp:"eq"};
    columnNameMap["region"] = {col:"t4.kaigai_flg_kbn",comp:"eq"};
    
    // 部分一致
    columnNameMap["shinsei_no"] = {col:"t1.shinsei_no",comp:"like"};
    columnNameMap["titel_nm"] = {col:"t1.title_nm",comp:"like"};
    columnNameMap["character_nm"] = {col:"t2.character_nms",comp:"like"};
    columnNameMap["hanmoto_nm"] = {col:"t3.hanmoto_nms",comp:"like"};
   
    // 申請中の場合のみステータス指定可能
    if (search_type == "proc"){
        columnNameMap["status_kbn"] = {col:"t1.status_kbn",comp:"eq"};
    }
    
    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val = param[key];
    	if (val == ""){
    		continue;
    	}
    	// パラメータの名前に紐づけられたカラムを取得
    	var map = columnNameMap[key];
    	if (typeof map === "undefined"){
    		continue;
    	}
    	
    	if (map.comp == 'like') {
    		sql+= " and func_conv_half2full(" + map.col + ") ilike '%'||func_conv_half2full(?)||'%' ";
        }else{
    		sql+= " and " + map.col + " = ? ";
        }
    	strParam.push(DbParameter.string(val));
   }

    
    // ソート
    sql +=" order by  ";
    
    var sortColumn ={
	   	 "1":"t1.status_kbn"
	   	,"2":"t1.shinsei_no"
	   	,"3":"t4.kaigai_flg_kbn"
	   	,"4":"t1.shinsei_typ_cd"
	   	,"5":"func_conv_half2full(character_nms)"
	   	,"6":"func_conv_half2full(hanmoto_nms)"
	   	,"7":"func_conv_half2full(title_nm)"
	   	,"8":"u.im_user_search_name"
	   	,"9":"koshin_dt"
	};
    
	for (var i = 0; i < sort.length ; i++) {
		if (i !=0){
			sql += ",";
		}
		var sortkey = sort[i].sortkey;
		sql += sortColumn[sortkey]  + " " + sort[i].sorttype;
	}


   //Logger.getLogger().info(sql);

   var result = db.select(sql,strParam);

   return result;
}


/**
 * DBから案件内容を取得します。
 * @param {String}  システム案件番号
 * @returns {Object} 検査結果
 */
function getMatterData(system_matter_id) {
	var result = Content.executeFunction("cactus/common_libs/common_fnction","getActvMatterData",system_matter_id);
	
	return result;
}

//=============================================================================
//削除関数
//【 入力 】request: ＵＲＬ引数取得オブジェクト
//【 返却 】なし
//【作成者】NTT DATA INTRAMART
//【 概要 】指定された一時保存を削除します。
//=============================================================================
function actionDelete(request) {
 
 Logger.getLogger().info(' [actionDelete] 一時保存情報削除');

 var result = new Object();
 result.resultFlag = true;
 result.resultStatus = new Object();

 // ログインユーザ情報の取得
 var oSession = Contexts.getAccountContext();
 var loginGroupId = oSession.loginGroupId;
 var localeId = oSession.locale;
 var userId = oSession.userCd;

 // データベースチェック
 if (!checkDeleteData(request, result, userId, loginGroupId, localeId)) {
     return result;
 }

 // データ削除
 var manager = new TempSaveManager(localeId);
 if (!deleteData(request, result, manager)) {
     return result;
 }

 return result;
}
//=============================================================================
//一時保存情報チェック関数
//【 入力 】request:  ＵＲＬ引数取得オブジェクト
//          result:   処理結果
//          userId:   ユーザID
//          loginGroupId : ログイングループID
//          localeId:      ロケールID
//【 返却 】処理結果
//【作成者】NTT DATA INTRAMART
//【 概要 】一時保存情報が削除可能状態であるか確認します。
//=============================================================================
function checkDeleteData(request, result, userId, loginGroupId, localeId) {
 var databaseResult;

 // 一時保存情報一覧マネージャの生成
 var manager = new TempSaveMatterList(userId, localeId);

 // 検索条件の生成
 var searchCondition = new ListSearchCondition();
 searchCondition.setAndCombination(true);
 searchCondition.addCondition(TempSaveMatterList.USER_DATA_ID,
         request.userDataId, ListSearchCondition.OP_EQ);

 // 一時保存情報の存在チェック
 databaseResult = manager.getTempSaveMatterListCount(searchCondition);
 if (!databaseResult.resultFlag) {
     result.resultFlag = false;
     result.resultStatus.message = Procedure.imw_error_utils.getErrorMessage(
             "IMW.CLI.WRN.3605", databaseResult);
     return false;
 }
 if (databaseResult.data == 0) {
     result.resultFlag = false;
     result.resultStatus.message = MessageManager.getMessage("IMW.CLI.WRN.3523"); // 一時保存情報が存在しません。";
     return false;
 }

 return true;
}
//=============================================================================
//一時保存情報削除関数
//【 入力 】request:      ＵＲＬ引数取得オブジェクト
//         result:       処理結果
//         manager:      TempSaveManagerクラスのインスタンス
//【 返却 】処理結果
//【作成者】NTT DATA INTRAMART
//【 概要 】コンテンツ情報を削除します。
//=============================================================================
function deleteData(request, result, manager) {
 var databaseResult;

 // 一時保存情報を設定
 var record = new Object();
 record.userDataId = request.userDataId;

 // 一時保存情報を削除
 databaseResult = manager.deleteTempSaveMatter(record, new Object());
 if (!databaseResult.resultFlag) {
     result.resultFlag = false;
     result.resultStatus.message = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
             "IMW.CLI.WRN.3605", databaseResult);
     return false;
 }

 return true;
}



//=============================================================================
//再申請を取り止めします
//【 入力 】request:      処理用パラメータ
//【 返却 】処理結果
//=============================================================================
function discontinue(request) {

	Logger.getLogger().info(' [discontinue] 再申請の取り止め（削除）');

    // セッション情報
    var sessionInfo = Contexts.getAccountContext();
    var groupId = sessionInfo.loginGroupId;
    var userCode = sessionInfo.userCd;

    // 処理結果オブジェクトの生成
    var resultInfo = {
        "resultFlag"    : false,
        "errorMessage" : ""
    };

    // システム案件ID
    var imwSystemMatterId = request.imwSystemMatterId;
    // フローID
    var imwFlowId = request.imwFlowId;
    // ノードID
    var imwNodeId = request.imwNodeId;
    // ログインユーザ情報の取得
    var localeId = Contexts.getAccountContext().locale;

    // 処理用パラメータ
    //var procParams = request.procParams;
    var procParams = {};
    // 実行者コードをセッションからセット
    procParams.executeUserCode = userCode;
    procParams.authUserCode = userCode;

    // ユーザパラメータ
    //var userParam = request.userParams;
    var userParam = {};

	// 処理実施前の処理可否判定
    var processManager = new ProcessManager(localeId, imwSystemMatterId, imwNodeId);
    var result = processManager.isPossibleToProcess(procParams.executeUserCode);
    if (!result.resultFlag) {
        // 判定エラー
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3546", result);
        return resultInfo;
    }
    if (!result.data) {
        // 処理不可
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessage(
                "IMW.CLI.WRN.3507", result);
        return resultInfo;
    }
	// 取り留め処理
    var result = processManager.discontinue(procParams, userParam);
    if (!result.resultFlag) {
        resultInfo.errorMessage = Procedure.imw_error_utils.getErrorMessageForWorkflowProcess(
                "IMW.CLI.WRN.3546", result);
        return resultInfo;
    }

    // 正常終了
    resultInfo.resultFlag = true;
    return resultInfo;

 return true;
}