
//共通関数を登録する 
Procedure.define("getUserInfo", getUserInfo);


/** 
* DBからユーザ情報を取得
*/ 
function getUserInfo(param) {
	
    var db = new TenantDatabase();
    var sql ="";
    
 // 事前に所属組織名を連結したimm_departmenを作っておく
    /*sql +=" WITH imm_department_inc_names AS (";
    sql +=" SELECT ";
    sql +="  dep_m.*, ";
    sql +="  ARRAY_TO_STRING(ARRAY( ";
    sql +="   SELECT dep_i.department_name FROM imm_department as dep_i ";
    sql +="   left join imm_department_inc_ath as inc ";
    sql +="       on  dep_i.department_cd = inc.parent_department_cd ";
    sql +=" 	   and inc.delete_flag = '0' ";
    sql +="     WHERE dep_m.department_cd = inc.department_cd ";
    sql +=" 	  and dep_m.company_cd = inc.company_cd ";
    sql +=" 	  and dep_m.department_set_cd = inc.department_set_cd ";
    sql +=" 	  and inc.parent_department_cd <> inc.company_cd ";
    sql +="      and dep_m.delete_flag = dep_i.delete_flag ";
    sql +="      and dep_m.locale_id = dep_i.locale_id ";
    sql +="     order by inc.department_cd,inc.depth desc ";
    sql +="  ), ' ') AS department_inc_name ";
    sql +=" FROM imm_department dep_m ";
    sql +=") ";
    */
    
    //select
    sql +=" SELECT ";
    sql +="   u.im_user_cd as user_cd ";
    sql +=" , u.shain_nm as user_name ";
    //sql +=" , u.im_user_name as user_name ";
    sql +=" , COALESCE(u.shain_no, ' ') as shain_no ";
    //sql +=" , COALESCE(u_kaku.shain_no,'') as user_no ";
    //sql +=" , COALESCE(u_kaku.hyojimei_eiji,'') as user_name_eng ";    
    //sql +=" , u.user_name || ' ' || COALESCE(u_kaku.hyojimei_eiji,'') || '<br>' || COALESCE(u_kaku.shain_no,'') as user_name_set ";
    sql +=" , COALESCE(u.im_department_cd, ' ') as department_cd ";
    //sql +=" , COALESCE(u.im_department_name, ' ') as department_name ";
    sql +=" , COALESCE(u.im_department_nm, ' ') as department_inc_name ";
    sql +=" , COALESCE(dep.im_company_cd, ' ') as company_cd ";
    sql +=" , COALESCE(dep_ath.department_set_cd, ' ') as department_set_cd ";
    sql +=" , COALESCE(dep_c.department_name,' ') as company_name ";
    sql +=" , COALESCE(post.post_name,' ') as post ";
    sql +=" , concat_ws('^',dep_ath.company_cd, dep_ath.department_set_cd, dep_ath.department_cd ) as auth_orgz ";
    
    // ユーザ取得
    sql+=" FROM v_user as u ";

    // 組織名取得
    sql+="   left join v_soshiki as dep ";
    sql+="   on u.im_department_cd = dep.im_department_cd ";
    sql+="   and u.im_locale_id = dep.im_locale_id ";

    // ユーザ所属組織紐付
    sql+="   left join imm_department_ath as dep_ath  ";
    sql+="   on u.im_user_cd = dep_ath.user_cd ";
    sql+="   and u.im_department_cd = dep_ath.department_cd ";
    sql+="   and dep_ath.delete_flag = '0' ";
    
    // 会社名取得
    sql+="   left join imm_department as dep_c ";
    sql+="   on dep_ath.company_cd = dep_c.company_cd ";
    sql+="   and dep_ath.company_cd = dep_c.department_set_cd ";
    sql+="   and dep_ath.company_cd = dep_c.department_cd ";
    sql+="   and dep_c.delete_flag = '0' ";
    sql+="   and dep_c.locale_id = 'ja' ";
    
    // 役職紐付
    sql+="   left join imm_department_post_ath as post_ath ";
    sql+="   on dep_ath.company_cd = post_ath.company_cd ";
    sql+="   and dep_ath.department_set_cd = post_ath.department_set_cd ";
    sql+="   and dep_ath.department_cd = post_ath.department_cd ";
    sql+="   and dep_ath.user_cd = post_ath.user_cd ";
    sql+="   and post_ath.delete_flag = '0' ";
    
    // 役職名取得
    sql+="   left join imm_company_post as post ";
    sql+="   on post_ath.company_cd = post.company_cd ";
    sql+="   and post_ath.department_set_cd = post.department_set_cd ";
    sql+="   and post_ath.post_cd = post.post_cd ";
    sql+="   and post.delete_flag = '0' ";
    sql+="   and post.locale_id = 'ja' ";
    // 条件
    sql+=" where u.im_locale_id = 'ja' ";
    sql+="   and u.im_delete_flag = '0' ";
    

    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {
    				     "user_name":"u.shain_nm"
                        ,"user_cd":"u.im_user_cd"
    					,"department_cd":"dep.department_cd "
    					,"department_inc_name":"u.im_department_nm"
    					,"company_name":"dep_c.department_name"
    					,"post":"post.post_name"
    					,"shain_no":"u.shain_no"
    					,"mail":"u.im_email_address1"
    					};
    
    					
    // 入力パラメータ
    var strParam=[];

    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val = param[key];
    	if (val == ""){
    		continue;
    	}
    	// パラメータの名前に紐づけられたカラムを取得
    	var col = columnNameMap[key];

    	if (col == 'u.im_user_cd' || col == 'dep.department_cd') {
        	sql+=" and " + col + " = ? ";
    		strParam.push(DbParameter.string(val));
        }else if(col == 'u.im_email_address1'){ //メールアドレスは複数からor
        	sql+=" and (u.im_email_address1 ilike ? ";
        	sql+=" or u.im_email_address2 ilike ? ";
        	sql+=" or u.im_mobile_email_address ilike ? )";
    		strParam.push(DbParameter.string('%'+val +'%'));
    		strParam.push(DbParameter.string('%'+val +'%'));
    		strParam.push(DbParameter.string('%'+val +'%'));
        }else if(col == 'u.shain_no'){
        	sql+=" and " + col + " like ? ";
    		strParam.push(DbParameter.string('%'+val +'%'));
        }else{
        	sql+= " and func_conv_half2full(" + col + ") ilike '%'||func_conv_half2full(?)||'%' ";
    		strParam.push(DbParameter.string(val));
        }
   }    

   sql+=" order by u.shain_no,u.im_user_cd,dep_ath.department_main DESC";
   
   //Debug.print(sql);

   var result = db.select(sql,strParam);

   return result;
};	
	
	
	
/** 
* DBからユーザ情報を取得
*/ 
/*function getUserInfo(param) {
	
    var db = new TenantDatabase();
    var sql ="";
    
 // 事前に所属組織名を連結したimm_departmenを作っておく
    sql +=" WITH imm_department_inc_names AS (";
    sql +=" SELECT ";
    sql +="  dep_m.*, ";
    sql +="  ARRAY_TO_STRING(ARRAY( ";
    sql +="   SELECT dep_i.department_name FROM imm_department as dep_i ";
    sql +="   left join imm_department_inc_ath as inc ";
    sql +="       on  dep_i.department_cd = inc.parent_department_cd ";
    sql +=" 	   and inc.delete_flag = '0' ";
    sql +="     WHERE dep_m.department_cd = inc.department_cd ";
    sql +=" 	  and dep_m.company_cd = inc.company_cd ";
    sql +=" 	  and dep_m.department_set_cd = inc.department_set_cd ";
    sql +=" 	  and inc.parent_department_cd <> inc.company_cd ";
    sql +="      and dep_m.delete_flag = dep_i.delete_flag ";
    sql +="      and dep_m.locale_id = dep_i.locale_id ";
    sql +="     order by inc.department_cd,inc.depth desc ";
    sql +="  ), ' ') AS department_inc_name ";
    sql +=" FROM imm_department dep_m ";
    sql +=") ";
    
    //select
    sql +=" SELECT ";
    sql +="   u.im_user_cd as user_cd ";
    sql +=" , u.im_user_name as user_name ";
    sql +=" , u.shain_no as shain_no ";
    //sql +=" , COALESCE(u_kaku.shain_no,'') as user_no ";
    //sql +=" , COALESCE(u_kaku.hyojimei_eiji,'') as user_name_eng ";    
    //sql +=" , u.user_name || ' ' || COALESCE(u_kaku.hyojimei_eiji,'') || '<br>' || COALESCE(u_kaku.shain_no,'') as user_name_set ";
    sql +=" , COALESCE(dep.department_name, ' ') as department_name ";
    sql +=" , COALESCE(dep.department_inc_name, ' ') as department_inc_name ";
    sql +=" , COALESCE(dep.company_cd, ' ') as company_cd ";
    sql +=" , COALESCE(dep.department_set_cd, ' ') as department_set_cd ";
    sql +=" , COALESCE(dep.department_cd, ' ') as department_cd ";
    sql +=" , COALESCE(dep_c.department_name,' ') as company_name ";
    sql +=" , COALESCE(post.post_name,' ') as post ";
    sql +=" , concat_ws('^',dep.company_cd, dep.department_set_cd, dep.department_cd ) as auth_orgz ";
    
    // ユーザ取得
    //sql+=" FROM imm_user as u ";
    sql+=" FROM v_user as u ";

    // ユーザ情報拡張
    //sql+="   left join  m_user_kakucho as u_kaku  ";
    //sql+="   on u.user_cd = u_kaku.user_cd ";
    //sql+="   and u_kaku.sakujo_flg = '0' ";

    // ユーザ所属組織紐付
    sql+="   left join imm_department_ath as dep_ath  ";
    sql+="   on u.im_user_cd = dep_ath.user_cd ";
    sql+="   and dep_ath.delete_flag = '0' ";
    	
    // 組織名取得
    //sql+="   left join imm_department as dep  ";
    sql+="   left join imm_department_inc_names as dep  ";
    sql+="   on dep_ath.company_cd = dep.company_cd ";
    sql+="   and dep_ath.department_set_cd = dep.department_set_cd ";
    sql+="   and dep_ath.department_cd = dep.department_cd ";
    sql+="   and dep.delete_flag = '0' ";
    sql+="   and dep.locale_id = 'ja' ";
    
    
    // 会社名取得
    sql+="   left join imm_department as dep_c ";
    sql+="   on dep_ath.company_cd = dep_c.company_cd ";
    sql+="   and dep_ath.company_cd = dep_c.department_set_cd ";
    sql+="   and dep_ath.company_cd = dep_c.department_cd ";
    sql+="   and dep_c.delete_flag = '0' ";
    sql+="   and dep_c.locale_id = 'ja' ";
    
    // 役職紐付
    sql+="   left join imm_department_post_ath as post_ath ";
    sql+="   on dep_ath.company_cd = post_ath.company_cd ";
    sql+="   and dep_ath.department_set_cd = post_ath.department_set_cd ";
    sql+="   and dep_ath.department_cd = post_ath.department_cd ";
    sql+="   and dep_ath.user_cd = post_ath.user_cd ";
    sql+="   and post_ath.delete_flag = '0' ";
    
    // 役職名取得
    sql+="   left join imm_company_post as post ";
    sql+="   on post_ath.company_cd = post.company_cd ";
    sql+="   and post_ath.department_set_cd = post.department_set_cd ";
    sql+="   and post_ath.post_cd = post.post_cd ";
    sql+="   and post.delete_flag = '0' ";
    sql+="   and post.locale_id = 'ja' ";
    // 条件
    //sql+=" where u.locale_id = 'ja' ";
    //sql+=" and u.delete_flag = '0' ";
    sql+=" where u.im_locale_id = 'ja' ";
    sql+="   and u.im_delete_flag = '0' ";
    

    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {
    				     "user_name":"u.im_user_name"
                        ,"user_cd":"u.im_user_cd"
    					,"department_cd":"dep.department_cd "
    					,"department_inc_name":"dep.department_inc_name"
    					,"company_name":"dep_c.department_name"
    					,"post":"post.post_name"
    					,"shain_no":"u.shain_no"
    					};
    // 入力パラメータ
    var strParam=[];

    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val = param[key];
    	if (val == ""){
    		continue;
    	}
    	// パラメータの名前に紐づけられたカラムを取得
    	var col = columnNameMap[key];
    	sql+=" and " + col ;

    	if (col == 'u.im_user_cd' || col == 'dep.department_cd') {
    		sql+=" = ? ";
    		strParam.push(DbParameter.string(val));
        }else{
    		sql+=" like ? ";
    		strParam.push(DbParameter.string('%'+val +'%'));
        }
   }    

   sql+=" order by u.im_user_cd,dep_ath.department_main DESC";
   
   //Debug.print(sql);

   var result = db.select(sql,strParam);

   return result;
};*/