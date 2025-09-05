var $data = {};

function init(request) {

   Logger.getLogger().info(' [init]　処理完了画面表示');
	
   //Debug.console(request);
   
   // 企画申請画面のセッション情報をクリア
   Client.set('key', {});

   var result;
   var sql = "";
   sql +=" select ";
   sql +="   s.shinsei_no as shinsei_no";
   sql +="  ,s.title_nm as title_nm";
   sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as shinsei_dt";
   sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
   sql +="  ,u.shain_nm as shain_nm ";
   sql +="  ,s.im_user_data_id im_user_data_id ";
   sql +="	from t_shinsei s ";
   sql +=" left join v_user u ";
   sql +="  on s.kiansha = u.im_user_cd  ";
   sql +=" where u.im_locale_id = 'ja' ";
   sql +="  and u.im_delete_flag = '0' ";
   
   if (request.imwSystemMatterId != ""){
	   // システム案件番号がある場合
	   sql +="  and s.im_system_anken_id = ? ";
	   result = getApplyData(sql, request.imwSystemMatterId); // タスク進行中のデータから取得
   }else{
	   sql +="  and s.im_user_data_id = ? ";
	   result = getApplyData(sql, request.imwUserDataId);     // 一時保存データから取得
   }
   
   if (result != null){
	    $data = {
	       matter_number : result.shinsei_no,
	       matter_name : result.title_nm,
	       user_name : result.shain_nm,
	       create_date : result.shinsei_dt,
	       update_date : result.koshin_dt
	   };
   }else{
	   Logger.getLogger().error('処理完了案件データ取得失敗');
   }
   
   $data.imwCallOriginalPagePath =  request.imwCallOriginalPagePath;
   
   // 版権元のノード展開時はここでメールを送信
   if (request.nodeId == "planApplNode_03" && request.processType == "4"){
	   try {
		   var driver = new Packages.imart.mail.WorkflowMailController();
		   driver.storeMail("3",result.im_user_data_id,"","");
	   } catch (ex) {
    	   Logger.getLogger().error('処理メール作成失敗');
	   }
	}
}


function getApplyData(sql, id) {
    var db = new TenantDatabase();
    var result = db.select(sql,[new DbParameter(id, DbParameter.TYPE_STRING)]);
    
    if (result.countRow > 0){
         return result.data[0];
    }else{
        return null;
    }
}