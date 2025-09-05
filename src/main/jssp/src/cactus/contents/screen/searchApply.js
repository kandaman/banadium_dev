
// DBから完了済み申請を取得
function getApplyList(param) {
	
	Constant.load("cactus/common_libs/const");
	
    var db = new TenantDatabase();
    var sql ="";
    //select
    sql +=" SELECT ";
    sql +="   matter.shinsei_no as number ";
    sql +=" , matter.title_nm as subject ";
    sql +=" , COALESCE(to_char(matter.shinsei_dt,'YYYY/MM/DD HH24:MI'),' ') as create_date ";
    sql +=" , COALESCE(to_char(matter.koshin_dt,'YYYY/MM/DD HH24:MI'),' ') as update_date ";
    sql +=" , COALESCE(u.shain_nm,' ') as create_username ";
    sql +=" , COALESCE(s.im_department_nm,' ') as create_userorgz ";
    sql +=" , COALESCE(char.character_nms,' ') as character_nms ";
    
    sql +=" , matter.im_system_anken_id as system_matter_id ";
    //sql +=" , matter.flow_id ";
    sql +=" , matter.im_user_data_id as user_data_id ";
    
    // 申請メイン
    sql+=" FROM t_shinsei as matter ";
    
    // ユーザ
    sql+="   left join v_user as u  ";
    sql+="   on  matter.kiansha = u.im_user_cd ";
    sql+="   and u.im_locale_id = 'ja' ";
    sql+="   and u.im_delete_flag = '0' ";
    
    // 組織
    sql+="   left join v_soshiki as s  ";
    sql+="   on  matter.kian_shozoku_cd = s.im_department_cd ";
    sql+="   and s.im_locale_id = 'ja' ";

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
    sql +=" ) char  ";
    sql +=" on matter.shinsei_no = char.shinsei_no  ";



    // 条件
    sql+=" where matter.sakujo_flg = '0' ";
    sql+=" and matter.status_kbn = '"+ Constant.CD_STATUSKBN_END +"' ";


    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {
                         "subject":"matter.title_nm"
                        ,"number":"matter.shinsei_no"
                        ,"userName":"u.shain_nm"
                        ,"orgz":"s.im_department_nm"
                        ,"startDay":"matter.shinsei_dt"
                        ,"endDay":"matter.shinsei_dt"
                        ,"characterName":"char.character_nms"
                        ,"shinseiTypCd":"matter.shinsei_typ_cd"
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

    	// 範囲指定
    	if (key == 'startDay') {
        	sql+=" and " + col + " > to_timestamp( ? , 'YYYY/MM/DD')  ";
    	}else if (key == 'endDay') {
        	sql+=" and " + col + " < to_timestamp( ? ,'YYYY/MM/DD') + '1 day' ";
    	}else if (key == 'shinseiTypCd') {
        	sql+=" and " + col + " = ? ";
    	}else{
    		sql+= " and func_conv_half2full(" + col + ") ilike '%'||func_conv_half2full(?)||'%' ";
    	}
    	strParam.push(DbParameter.string(val));
    }
    
   sql+=" order by matter.shinsei_no ";

   
  //Debug.print(sql);

   var result = db.select(sql, strParam);
   //$searchUserDatalist = result.data;
   return result;

};
