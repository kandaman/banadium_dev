var $form = {};
var $data = {};
/**
 * 全案件一覧画面初期処理
　*/
function init(request) {
	Logger.getLogger().info(' [init]　全案件一覧画面表示');

	// 処理完了時の遷移先
    $data.imwCallOriginalPagePath ="cactus/contents/screen/allProcess_list";
    // ログインユーザ情報の取得
    var oSession = Contexts.getAccountContext();
    var userId = oSession.userCd;
    var loginGroupId = oSession.loginGroupId;
    var localeId = oSession.locale;
    $data.userId = userId;

	getMstData();

}


/**
 * マスタから情報を取得しfrom変数に格納します。
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
 * DBから全案件一覧を取得。
 * @param {String} 検索種別
 * @param {Object} 検査対象値
 * @param {Object} ソート順
 * @returns {Object} 検索結果
 */
function getAllProcessList(search_type,param,sort) {
	Logger.getLogger().info(' [getAllProcessList]　全案件一覧画面検索');

	var sterttime = new Date().getTime();
	//Debug.console("検索開始");

		
    // ログインユーザ情報の取得
    var oSession = Contexts.getAccountContext();
    var userId = oSession.userCd;

    var db = new TenantDatabase();
    var sql ="";

    sql +=" select ";
    sql +="      CASE WHEN t1.status_kbn = '00' THEN '一時保存' "; //ステータス
    sql +="           WHEN t1.status_kbn = '01' THEN '事業部承認待ち' ";
    sql +="           WHEN t1.status_kbn = '02' THEN 'メディア部受付待ち' ";
    sql +="           WHEN t1.status_kbn = '03' THEN '版権元確認中' ";
    sql +="           WHEN t1.status_kbn = '04' THEN '完了' ";
    sql +="           ELSE '-' ";
    sql +="      END as status_name ";
    sql +="     ,t1.status_kbn "; //ステータス区分
    sql +="     ,t1.system_matter_id  "; //システムID
    sql +="     ,t1.im_user_data_id  ";  //ユーザデータID
    sql +="     ,t1.shinsei_no   ";  //申請番号
    sql +="     ,t1.shinsei_typ_cd   "; //申請種類CD
    sql +="     ,t1.title_nm   "; //商品名
    sql +="     ,t1.toroku_kekka_kbn "; //登録結果区分
    sql +="     ,COALESCE(c1.cd_naiyo,'') as toroku_kekka_nm "; //登録結果
    sql +="     ,u1.shain_nm as kiansha_nm "; //起案者名
    //sql +="     ,u2.shain_nm as tantosha_nm ";
    sql +="     ,COALESCE(t5.tantou_nms,'') as tantosha_nm ";      //メディア担当者
    sql +="     ,COALESCE(v1.im_department_nm,'') as kian_busyo "; //起案部署
    sql +="     ,COALESCE(to_char(t1.shinsei_dt,'YYYY/MM/DD HH24:MI'),'') as toroku_dt ";//申請日
    sql +="     ,to_char(t1.koshin_dt,'YYYY/MM/DD HH24:MI') as koshin_dt ";//更新日
    sql +="     ,COALESCE(t2.character_nms,'-') as character_nms "; //キャラクター名
    sql +="     ,COALESCE(t3.hanmoto_nms,'-') as hanmoto_nms ";     //版元名
    sql +="     ,CASE WHEN t4.kaigai_flg_kbn is null THEN '-'  "; //地域
    sql +=" 		  WHEN t4.kaigai_flg_kbn = '00' THEN '国内'  ";
    sql +="           WHEN t4.kaigai_flg_kbn = '01' THEN '国内/海外'  ";
    sql +="           ELSE '海外'  ";
    sql +="      END as region_type ";
    sql +="     ,m1.shinsei_typ_nm "; //申請書種類名
    
     //EXCEｌ出力用
    sql +="     ,vlist.status ";
    sql +="     ,vlist.application_number ";
    sql +="     ,vlist.slip_number ";
    sql +="     ,vlist.classification ";
    sql +="     ,vlist.entity ";
    sql +="     ,vlist.production ";
    sql +="     ,vlist.platform ";
    sql +="     ,vlist.item_name ";
    sql +="     ,vlist.subject ";
    sql +="     ,vlist.character_name ";
    sql +="     ,vlist.copyright_holder_name ";
    sql +="     ,vlist.issuer ";
    sql +="     ,vlist.media_group_member_id ";
    sql +="     ,to_char(vlist.reception_date,'YYYY/MM/DD HH24:MI') as reception_date ";
    sql +="     ,vlist.expected_release_date ";
    sql +="     ,to_char(vlist.answer_date,'YYYY/MM/DD HH24:MI') as answer_date "
    sql +="     ,vlist.application_result ";
    sql +="     ,vlist.region ";
    sql +="     ,vlist.price ";
    sql +="     ,vlist.dl_version ";
    sql +="     ,vlist.dlc ";
    sql +="     ,vlist.wf_status ";
    sql +="     ,vlist.bandai_management_no ";
    sql +="     ,vlist.shoshi ";
    sql +="     ,to_char(vlist.last_update,'YYYY/MM/DD HH24:MI') as last_update " 
    	
    sql +="   ";
    // ベース
    sql +=" from ";
    sql +=" ( ";
    
    if (search_type != "end"){  //処理中
    
    sql +=" select distinct t1.*,im1.system_matter_id,im1.user_data_id ";
    sql +=" from imw_t_actv_matter im1 ";
    sql +=" inner join t_shinsei t1 ";
    sql +="   on im1.matter_number = t1.shinsei_no ";

    }
    if (search_type == "all"){  //全て
    sql +=" union all ";
    }
    if (search_type != "proc"){  //完了
    
    sql +=" select distinct t1.*,im1.system_matter_id,im1.user_data_id ";
    sql +=" from imw_t_cpl_matter im1 ";
    sql +=" inner join t_shinsei t1 ";
    sql +="   on im1.matter_number = t1.shinsei_no ";
    sql +=" where im1.status = 'mattercomplete' ";
    
    }

    sql +=" ) t1 ";

    // キャラクター名
    sql +=" left join   ";
    sql +=" (  ";
    sql +="   select   ";
    sql +="       tc.shinsei_no  ";
    sql +="       ,string_agg(character_nm::text, '/'::text order by mc.character_cd) AS character_nms  ";
    sql +="   from (select distinct shinsei_no,character_cd from t_shinsei_character where sakujo_flg ='0') tc  ";
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

    // 版権担当者(メディア担当者)
    sql +=" left join   ";
    sql +=" (  ";
    sql +="   select   ";
    sql +="      tf.shinsei_no  ";
    sql +="      ,string_agg(vu.shain_nm::text, '/'::text order by vu.im_user_cd) AS tantou_nms  ";
    sql +="      ,string_agg(vu.im_user_search_name::text, '/'::text order by vu.im_user_cd) AS tantou_search_nms  ";
    sql +="   from (select distinct shinsei_no,shorisha from t_shinsei_flow where node_kbn = '03' and toroku_status_kbn <> '') tf  ";
    sql +="   left join v_user vu  ";
    sql +="   on tf.shorisha = vu.im_user_cd  ";
    sql +="   and vu.im_locale_id = 'ja' ";
    sql +="   and vu.im_delete_flag = '0' ";
    sql +="   group by tf.shinsei_no   ";
    sql +="   ";
    sql +=" ) t5  ";
    sql +=" on t1.shinsei_no = t5.shinsei_no  ";
    sql +="   ";
    
    // EXCEl出力view
    sql +=" left join v_ohka_process_list vlist ";
    sql +=" on t1.shinsei_no = vlist.application_number ";
    

    // 申請種類
    sql +=" left join m_shinsei_typ m1 ";
    sql +=" on t1.shinsei_typ_cd = m1.shinsei_typ_cd ";

    // ユーザ名(起案者)
    sql +=" left join v_user u1 ";
    sql +=" on t1.kiansha = u1.im_user_cd ";
    sql +=" and u1.im_locale_id = 'ja' ";
    sql +=" and u1.im_delete_flag = '0' ";
    // 組織名
    sql +=" left join v_soshiki v1 ";
    sql +=" on v1.im_department_cd = u1.im_department_cd ";
    sql +=" and v1.im_locale_id = 'ja' ";
    
    // 登録結果
    sql +=" left join m_cd c1 ";
    sql +=" on  t1.toroku_kekka_kbn = c1.cd_chi ";
    sql +=" and c1.cd_id='0005' ";

    sql +=" where t1.sakujo_flg = '0' ";

    
    // 入力パラメータ
    var strParam=[];

    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {};
    // 完全一致
    columnNameMap["shinsei_typ_cd"] = {col:"t1.shinsei_typ_cd",comp:"eq"};
    columnNameMap["region"] = {col:"t4.kaigai_flg_kbn",comp:"eq"};
    columnNameMap["toroku_kekka_kbn"] = {col:"t1.toroku_kekka_kbn",comp:"eq"};
    
    // 部分一致
    columnNameMap["shinsei_no"] = {col:"t1.shinsei_no",comp:"like"};
    columnNameMap["titel_nm"] = {col:"t1.title_nm",comp:"like"};
    columnNameMap["character_nm"] = {col:"t2.character_nms",comp:"like"};
    columnNameMap["hanmoto_nm"] = {col:"t3.hanmoto_nms",comp:"like"};
    columnNameMap["kiansha_nm"] = {col:"u1.shain_nm",comp:"like"};
    columnNameMap["kian_busyo"] = {col:"v1.im_department_nm",comp:"like"};
    columnNameMap["tantosha_nm"] = {col:"t5.tantou_nms",comp:"like"};
   
    // 未完了の場合のみステータス指定可能
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
    	,"8":"c1.cd_chi"
    	,"9":"kian_busyo"
    	,"10":"u1.im_user_search_name"
    	,"11":"shinsei_dt"
    	,"12":"koshin_dt"
    	,"13":"t5.tantou_search_nms"
    };
	for (var i = 0; i < sort.length ; i++) {
		if (i !=0){
			sql += ",";
		}
		var sortkey = sort[i].sortkey;
		sql += sortColumn[sortkey]  + " " + sort[i].sorttype;
	}

   var result = db.select(sql,strParam);
   

   //Debug.console("検索終了:"+ (new Date().getTime() - sterttime));

   return result;
}

function createExcel(req) {
	Logger.getLogger().info(' [createExcel] Excel出力');

	//検索データ受け取り
	var data = ImJson.parseJSON(req.excelJson);

	// excelファイル作成
	try {
		var driver = new Packages.imart.output.applyListExcel();
    } catch (ex) {
    	Logger.getLogger().error('Excel作成失敗');
        throw ex;
    }
    
    var user = Contexts.getUserContext().userProfile;
    var userId = user.userCd; 
    var sessionId = Client.identifier();
    
	var path = driver.createFiles( userId, sessionId, data );
	
	// 作成されたファイル取得
	var excelfile = new File(path);

	// ファイル名・パス取得
	var lastUnixPos = path.lastIndexOf('/');
	var excelName = path.substring(lastUnixPos + 1);
	var palentPath = path.substring(0,lastUnixPos);

	if (excelfile.exist()) {
		Constant.load("cactus/common_libs/const");
	    // ファイルをセッションストレージへ移動
	    var filname = Constant.PATH_SESSION_STORAGE;
	    var sesstorage = new SessionScopeStorage(filname);
	    if (!sesstorage.isDirectory()){
	    	//ディレクトリが存在しなければ作成
	    	sesstorage.makeDirectories();
	    }
	    
	     var storagefile = filname + excelName;
	    
		// sessionScopeStorageへ書き込み（セッション終了時に削除するため）
	    excelfile.openAsBinary(function(reader, error) {
	        if (error != null) {
	            //sendErrorResult();
	            throw error; // 内部で生じた例外により openAsText を抜ける際にも、自動的に close が呼ばれます
	        }
	       
	        new SessionScopeStorage(storagefile).createAsBinary(function(writer, error) {
	            if (error != null) {
	                //sendErrorResult();
		            throw error; // 内部で生じた例外により openAsText を抜ける際にも、自動的に close が呼ばれます
	            }
	            reader.transferTo(writer);
	        });
	    });
	    // 保存したストレージ取得
	    var downloadstorage = new SessionScopeStorage(storagefile);
	    
	    //元ファイル削除
	    excelfile.remove();

		// セッションストレージからファイルのダウンロード
	    if(downloadstorage.isFile()) {
			Module.download.send(downloadstorage);
	    }
	}else{
    	Logger.getLogger().error('作成されたExcelが見つかりません');
	}
    
}

