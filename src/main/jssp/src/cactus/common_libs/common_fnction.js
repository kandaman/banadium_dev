
/** 
* DBから申請中案件情報を取得
*/ 
function getActvMatterData(imwSystemMatterId) {
	var db = new TenantDatabase();
    var sql ="select * from imw_t_actv_matter where system_matter_id = ?";
    var result = db.select(sql,[new DbParameter(imwSystemMatterId, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data[0];
    }else{
    	return null;
    }
};
/** 
 * DBから完了案件情報を取得
*/ 
function getCplMatterData(imwSystemMatterId) {
	var db = new TenantDatabase();
    var sql ="select * from imw_t_cpl_matter where system_matter_id = ?";
    var result = db.select(sql,[new DbParameter(imwSystemMatterId, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data[0];
    }else{
    	return null;
    }
};

	
/** 
* DBから申請書情報を取得(案件番号)
*/ 
function getMyApplyData(shinsei_no) {
	var db = new TenantDatabase();
    var sql ="select * from t_shinsei where shinsei_no = ?";
    var result = db.select(sql,[new DbParameter(shinsei_no, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data[0];
    }else{
    	return null;
    }
};
/** 
* DBから申請書情報を取得(userdataId)
*/ 
function getMyApplyUserData(imwUserDataId) {
	var db = new TenantDatabase();
    var sql ="select * from t_shinsei where im_user_data_id = ?";
    var result = db.select(sql,[new DbParameter(imwUserDataId, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data[0];
    }else{
    	return null;
    }
};
/**
* DBからキャラクタ情報を取得
*/
function getMyCharacterList(shinsei_no) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select *  ";
    sql +=" ,concat(v.character_cd,v.hanmoto_cd,v.kaigai_flg) as keyno";
    sql +=" from t_shinsei_character t ";
    sql +=" inner join v_character v ";
    sql +="   on t.character_cd = v.character_cd";
    sql +="   and t.hanmoto_cd = v.hanmoto_cd";
    sql +="   and t.kaigai_flg = v.kaigai_flg";
    sql +=" where t.shinsei_no = ? ";
    sql +="   and t.sakujo_flg = '0' ";
    sql +=" order by t.character_gyo_no ";

    var result = db.select(sql,[new DbParameter(shinsei_no, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};
	
	
/**
* DBから申請情報を取得
*/
function getRelationList(shinsei_no,shinsei_kbn) {
	var db = new TenantDatabase();
    var sql ="";
    //select
    sql +=" SELECT ";
    sql +="   matter.matter_number as number ";
    sql +=" , matter.matter_name as subject ";
    sql +=" , to_char(matter.create_date,'YYYY/MM/DD HH24:MI') as create_date ";
    //sql +=" , to_char(matter.update_date,'YYYY/MM/DD HH24:MI') as update_date ";
    sql +=" , u.shain_nm as create_username ";
    
    sql +=" , matter.system_matter_id ";
    sql +=" , matter.flow_id ";
    sql +=" , matter.user_data_id ";
    
    sql +=" From t_shinsei_kanren_bunsho as kanren ";
    sql+="  inner join imw_t_cpl_matter as matter ";
    sql+="    on kanren.kanren_shinsei_no = matter.matter_number ";
    
    sql+="  left join v_user as u  ";
    sql+="   on  matter.create_user_code = u.im_user_cd ";
    sql+="   and u.im_locale_id = 'ja' ";
    sql+="   and u.im_delete_flag = '0' ";    

    // 条件
    sql+=" where kanren.shinsei_no = ?";
    sql+="   and kanren.kanren_shinsei_kbn = ?";
    sql+=" order by kanren.shinsei_no";
    
    var result = db.select(sql,[new DbParameter(shinsei_no, DbParameter.TYPE_STRING),new DbParameter(shinsei_kbn, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
    
};	
	
/**
* DBから申請情報を取得
*/
function getContentList(shinsei_no) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select * from t_shinsei_meisai ";
    sql +=" where shinsei_no = ?";
    sql +=" order by meisai_gyo_no";

    var result = db.select(sql,[new DbParameter(shinsei_no, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};

	
/**
* DBからファイル情報を取得
*/
function getTmpfileList(apply_number) {
	
	Constant.load("cactus/common_libs/const");
	
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select * from t_shinsei_file ";
    sql +=" where shinsei_no = ?";
    sql +="  and file_kbn = '" + Constant.CD_FILE_SHIRYO + "'"; 
    sql +=" order by file_gyo_no";

    var result = db.select(sql,[new DbParameter(apply_number, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};


/**
* DBからファイル経路情報を取得
*/
function getFlowList(apply_number) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select * from t_shinsei_flow f";
    sql +=" left join (select distinct hanmoto_cd,hanmoto_nm,kaigai_flg from v_character) v ";
    sql +=" on f.hanmoto_cd = v.hanmoto_cd";
    sql +=" and f.kaigai_flg = v.kaigai_flg";
    sql +=" where f.shinsei_no = ?";
    sql +=" order by f.node_kbn,f.id";
    
    var result = db.select(sql,[new DbParameter(apply_number, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};	


/**
* DBからメール通知者を取得
*/
function getMailUserList(apply_number) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select t.user_group_kbn, t.user_group_cd"
    sql +="	from t_shinsei_mail t";
    sql +=" where t.shinsei_no = ?";
    sql +=" order by user_group_kbn, user_group_cd";
    
    var result = db.select(sql,[new DbParameter(apply_number, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};	


/**
* DBから版権担当者登録内容を取得
*/
function getHanmotoStatus(apply_number) {
	var db = new TenantDatabase();
    var sql ="";
    
    sql +=" select  ";
    sql +="     t1.shinsei_no ";
    sql +="    ,t1.hanmoto_cd ";
    sql +="    ,t1.kaigai_flg ";
    sql +="    ,t2.shorisha ";
    sql +="    ,u.user_name as shorisha_nm ";
    sql +="    ,t2.toroku_status_kbn ";
    sql +="    ,c2.cd_naiyo as toroku_status ";
    sql +="    ,t3.shoshi_kbn ";
    sql +="    ,c3.cd_naiyo as shoshi ";
    //sql +="    ,t4.file_nm ";
    //sql +="    ,t4.biko, ";
    sql +="    ,v.hanmoto_nm  ";
    sql +=" from  ";
    // 対象版元取得
    sql +=" (select distinct shinsei_no,hanmoto_cd,kaigai_flg from t_shinsei_flow where node_kbn = '03') t1 ";

    // 登録状況を取得
    sql +=" left join  ";
    sql +=" (select * from t_shinsei_flow where node_kbn = '03' and toroku_status_kbn <>'' ) t2 ";
    sql +="  on t1.shinsei_no = t2.shinsei_no ";
    sql +=" and t1.hanmoto_cd = t2.hanmoto_cd ";
    sql +=" and t1.kaigai_flg = t2.kaigai_flg ";
    sql +=" left join m_cd c2 ";
    sql +=" on  t2.toroku_status_kbn = c2.cd_chi ";
    sql +=" and c2.cd_id='0005' ";
    
    sql +=" left join ( ";
    sql +="	select distinct shain_nm as user_name, im_user_cd as user_cd from v_user ";
    sql +=" where im_locale_id='ja' ";
    sql +=" and im_delete_flag='0' ";
    sql +=" ) u ";
    sql +=" on t2.shorisha = u.user_cd ";
    
    
    
    // 証紙のステータス取得
    sql +=" left join t_shinsei_shoshi t3 ";
    sql +=" on t1.shinsei_no = t3.shinsei_no ";
    sql +=" and t1.hanmoto_cd = t3.hanmoto_cd ";
    sql +=" and t1.kaigai_flg = t3.kaigai_flg ";
    sql +="  ";
    sql +=" left join m_cd c3 ";
    sql +=" on  t3.shoshi_kbn = c3.cd_chi ";
    sql +=" and c3.cd_id='0002' ";
    sql +="  ";
    //sql +=" left join t_shinsei_file t4 ";
    //sql +=" on t1.shinsei_no = t4.shinsei_no ";
    //sql +=" and t1.hanmoto_cd = t4.hanmoto_cd ";
    //sql +=" and t1.kaigai_flg = t4.kaigai_flg ";
    //sql +=" and t4.file_kbn = '03' ";
    sql +="  ";
    
    // 版元名取得
    sql +=" left join (select distinct hanmoto_cd,kaigai_flg,hanmoto_nm ||'('|| case kaigai_flg when '0' then '国内' else '海外' end || ')' as hanmoto_nm from v_character) v ";
    sql +=" on t1.hanmoto_cd = v.hanmoto_cd ";
    sql +=" and t1.kaigai_flg = v.kaigai_flg ";
    sql +=" where t1.shinsei_no = ? ";
    
    var result = db.select(sql,[new DbParameter(apply_number, DbParameter.TYPE_STRING)]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return [];
    }
}

//版権担当の添付ファイル取得
function getHanmotoFiles(shinsei_no,hanmoto_cd,kaigai_flg) {
	
	Constant.load("cactus/common_libs/const");
	
	var db = new TenantDatabase();
    var sql ="";
    
    sql +=" select  ";
    sql +="     file_nm ";
    sql +="    ,file_path ";
    sql +="    ,biko ";
    sql +=" from ";
    sql +=" t_shinsei_file ";
    sql +=" where shinsei_no = ? ";
    sql +=" and hanmoto_cd = ? ";
    sql +=" and kaigai_flg = ? ";
    sql +=" and file_kbn = '"+ Constant.CD_FILE_CHOHYO +"' ";
    
    var where = [
        DbParameter.string(shinsei_no),
        DbParameter.string(hanmoto_cd),
        DbParameter.string(kaigai_flg),
    ];
    
    var result = db.select(sql,where);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return [];
    }
}
	
	
/**
* DBから承認履歴を取得
*/
function getApproveHistoryData(imwSystemMatterId) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select  ";
    sql +="  t.system_matter_id "
    sql +="  , t.task_id "
    sql +="  , t.node_id "
    sql +="  , t.node_type "
    sql +="  , case node_type when '3' then '版権担当者' else t.node_name end as node_name "
    sql +="  , t.route_trace_id "
    sql +="  , t.status "
    sql +="  , t.start_date "
    sql +="  , t.end_date "
    sql +="  , t.process_time "
    sql +="  , t.start_process_id "
    sql +="  , t.cpl_process_id "
    sql +="  , t.action_id "
    sql +="  , t.act_flag "
    sql +="  , t.process_comment "
    sql +="  , t.create_user_code "
    sql +="  , t.update_user_code "
    sql +="  , t.create_date "
    sql +="  , t.update_date "
    sql +=" from imw_t_cpl_task as t ";
    sql +=" where t.system_matter_id = ? ";
    sql +=" 	and t.node_type in ('2','4','3') ";
    sql +=" 	and t.status != 'cancel' ";
    sql +=" order by t.update_date,t.route_trace_id,t.node_id ";
    
    var dbparam = new DbParameter(imwSystemMatterId, DbParameter.TYPE_STRING);

    //var result = db.select(sql,[dbparam,dbparam]);
    var result = db.select(sql,[dbparam]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }

};

/**
* DBから完了案件の承認履歴を取得
*/
function getMatterHistoryData(imwSystemMatterId) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select  ";
    sql +="  t.system_matter_id "
    sql +="  , t.task_id "
    sql +="  , t.node_id "
    sql +="  , t.node_type "
    sql +="  , case node_type when '3' then '版権担当者' else t.node_name end as node_name "
    sql +="  , t.route_trace_id "
    sql +="  , t.status "
    sql +="  , t.start_date "
    sql +="  , t.end_date "
    sql +="  , t.process_time "
    sql +="  , t.start_process_id "
    sql +="  , t.cpl_process_id "
    sql +="  , t.action_id "
    sql +="  , t.act_flag "
    sql +="  , t.process_comment "
    sql +="  , t.create_user_code "
    sql +="  , t.update_user_code "
    sql +="  , t.create_date "
    sql +="  , t.update_date "
    sql +=" from imw_t_cpl_matter_task as t ";
    sql +=" where t.system_matter_id = ? ";
    sql +=" 	and t.node_type in ('2','4','3') ";
    sql +=" 	and t.status != 'cancel' ";
    sql +=" order by t.update_date,t.route_trace_id,t.node_id ";
    
    var dbparam = new DbParameter(imwSystemMatterId, DbParameter.TYPE_STRING);

    //var result = db.select(sql,[dbparam,dbparam]);
    var result = db.select(sql,[dbparam]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }

};	
	
	
/**
* DBから承認履歴を取得（ノードごとの最新のみ）
*/
/*function getApproveHistoryData(imwSystemMatterId) {
	var db = new TenantDatabase();
    var sql ="";
    sql +=" select  ";
    sql +=" 	 t.* ";
    sql +=" from imw_t_cpl_task as t ";
    sql +=" inner join  ";
    sql +=" (select route_trace_id,max(update_date) as update_date ";
    sql +=" 	from imw_t_cpl_task  ";
    sql +=" 	where system_matter_id = ? ";
    sql +=" 	group by route_trace_id ";
    sql +=" ) as m ";
    sql +=" on t.route_trace_id = m.route_trace_id ";
    sql +=" and t.update_date = m.update_date ";
    sql +=" where t.system_matter_id = ? ";
    sql +=" 	and t.node_type in ('2','4','3') ";
    sql +=" 	and t.status != 'cancel' ";
    sql +=" order by t.route_trace_id,t.node_id ";
    
    var dbparam = new DbParameter(imwSystemMatterId, DbParameter.TYPE_STRING);

    var result = db.select(sql,[dbparam,dbparam]);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }

};
*/

/**
* DBから取戻しのためのフロー情報を取得
* imw_t_cpl_taskから最新の承認者の情報を取得
*/
function getApplyTskInfo(imwSystemMatterId,user_cd) {
	var db = new TenantDatabase();
    var sql ="";
    sql +="  select   ";
    sql +="  	  a.system_matter_id ";
    sql +="  	 ,a.flow_id ";
    sql +="  	 ,t.status ";
    sql +="  	 ,t.update_user_code as userId ";
    sql +="  	 ,t.node_id ";
    sql +="  	 ,t.node_type  ";
    sql +="  from imw_t_actv_matter a ";
    sql +="  inner join imw_t_cpl_task as t ";
    sql +="  on a.system_matter_id = t.system_matter_id ";
    sql +="  inner join   ";
    sql +="  (select system_matter_id,max(update_date) as update_date ";
    sql +="  	from imw_t_cpl_task   ";
    sql +="  	where status != 'branch'  ";
    sql +="  	group by system_matter_id  ";
    sql +="  ) as m  ";
    sql +="  on t.system_matter_id = m.system_matter_id  ";
    sql +="  and t.update_date = m.update_date  ";
    sql +="  where a.system_matter_id = ?  ";
    sql +="  	and t.update_user_code = ?  ";
    sql +="  	and (t.status in ('apply', 'reapply') or (t.status = 'approve' and t.route_trace_id <> '0.2'))  ";
    
    var pra = [DbParameter.string(imwSystemMatterId),DbParameter.string(user_cd)];
    var result = db.select(sql,pra);
    if (result.countRow > 0){
    	return result.data;
    }else{
    	return null;
    }
};

	

/**
　* 案件完了時処理
 * 
 * 官憲完了時ステータス区分と登録結果を更新.
 *
 * @param userCd　処理ユーザコード
 * @param userDataId　ユーザデータＩＤ
 * @return 処理結果
 */	
function updateMatterEnd(userCd,userDataId) {

	Constant.load("cactus/common_libs/const");

	var db = new TenantDatabase();
    var sql ="";
    sql +=" select  ";
    sql +=" 	 CASE WHEN MAX(f.toroku_status_kbn) = MIN(f.toroku_status_kbn) THEN MIN(f.toroku_status_kbn) "; //版元ごとのステータスが異なるものがあれば一部ＮＧ、そうでなければステータスをそのまま入れる
    sql +=" 	 ELSE ? END status ";
    sql +=" from t_shinsei t ";
    sql +=" inner join t_shinsei_flow f ";
    sql +=" on t.shinsei_no = f.shinsei_no ";
    sql +=" where t.im_user_data_id = ? ";
    sql +=" 	and t.sakujo_flg ='0' ";
    sql +=" 	and f.sakujo_flg ='0' ";
    sql +=" 	and f.node_kbn = ? ";
    sql +=" 	and f.toroku_status_kbn !='' ";
    
    var dbparam = [];
    dbparam.push(DbParameter.string(Constant.CD_TOUROKU_PARTNG)); //登録一部ＮＧ
    dbparam.push(DbParameter.string(userDataId)); // 検索条件；ユーザデータＩＤ
    dbparam.push(DbParameter.string(Constant.KBN_NODE_HANMOTO)); // ノード：版権担当
    var result = db.select(sql,dbparam);
    
    //Debug.print(''+result.countRow);
    if (result.countRow == 0){
		return false;
    }
    //Debug.print(''+result.data[0].status);
    
	var updata = {
		status_kbn : Constant.CD_STATUSKBN_END, //スタータス：完了
		toroku_kekka_kbn : result.data[0].status, // 登録結果区分
		koshinsha : userCd,
		koshin_dt : new Date(),
		koshin_program_id :'MatterEndProcess'
	}
	var where = "im_user_data_id = ?";
	var pra = [DbParameter.string(userDataId)];
	
	result = db.update("t_shinsei",updata,where,pra);
	if (result.error) {
		return false;
	}
	return true;
}
