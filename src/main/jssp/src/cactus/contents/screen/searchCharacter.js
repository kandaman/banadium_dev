// DBからユーザを取得
function getCharacterList(param) {
	
    var db = new TenantDatabase();
    var sql ="";
    //select
    sql +=" SELECT * ";
    
    /*sql +="   chara_id as chara_id ";
    sql +=" , chara_name as chara_name ";
    sql +=" , copyright as copyright ";
    sql +=" , area as area";
    */
    // キャラクタ取得
    sql +=" , concat(character_cd,hanmoto_cd,kaigai_flg) as keyno";
    sql+=" FROM v_character";
    
    // 条件
    sql+=" where 1 = 1 ";

    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {"character_nm":"character_nm","character_cd":"character_cd","hanmoto_nm":"hanmoto_nm"};
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
    	sql+= " and func_conv_half2full(" + col + ") ilike '%'||func_conv_half2full(?)||'%' ";
    	
    	strParam.push(DbParameter.string(val)); //パラメータ設定
    }
    
    sql+=" order by character_cd ";

   var result = db.select(sql,strParam);
   return result;

};



// キャラコードをもとに一覧の初期表示
function getCharacterListInit(param) {
	
    var db = new TenantDatabase();
    var sql ="";
    //select
    sql +=" SELECT * ";
    /*sql +="   character_cd ";
    sql +=" , character_nm ";
    sql +=" , copyright as copyright ";
    sql +=" , area as area";
    */
    sql +=" , concat(character_cd,hanmoto_cd,kaigai_flg) as keyno";
    // キャラクタ取得
    sql+=" FROM v_character";
    // 条件
    sql+=" where concat(character_cd,hanmoto_cd,kaigai_flg) in ('" +  param.join("','") + "')";
   
  //Debug.print(sql);

   var result = db.select(sql);
   return result;

};
