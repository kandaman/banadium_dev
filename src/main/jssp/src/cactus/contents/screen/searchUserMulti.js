//取得したDBデータ
var $searchUserDatalist;

// DBからユーザを取得
function getUserList(param) {
	// ユーザ情報取得
	//var result = Procedure.getUserInfo(param);
	var result =  Content.executeFunction("cactus/common_libs/global_fnction","getUserInfo",param);
	return result;

};

// DBからグループを取得
function getGroupList(param) {
	
    var db = new TenantDatabase();
    var sql ="";
    //select
    sql +=" SELECT ";
    sql +="   dep.department_cd as user_cd ";
    sql +=" , COALESCE(dep.department_name, ' ') as name ";
    sql +=" , '' as department ";
    sql +=" , '' as company ";
    sql +=" , '' as post";

    // 組織名取得
    sql+=" FROM imm_department as dep ";
    
    // 条件
    sql+=" where dep.locale_id = 'ja' ";
    sql+="   and dep.delete_flag = '0' ";

    // 入力したパラメータをカラム名に変換する用のmap
    var columnNameMap = {"department":"dep.department_name"};
	
    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val = param[key];
    	if (val == ""){
    		continue;
    	}
    	// パラメータの名前に紐づけられたカラムを取得
    	var col = columnNameMap[key];
    	sql+=" and " + col ;
 
    	// あいまい検索判定
    	if (val.indexOf('%') != -1) {
        	sql+=" like '" + val + "' ";
    	}else{
        	sql+=" = '" + val + "' ";
    	}
    }
    
   sql+=" order by dep.department_cd ";
    
   //Debug.print(sql);


   var result = db.select(sql);
   $searchUserDatalist = result.data;
   return result;
};