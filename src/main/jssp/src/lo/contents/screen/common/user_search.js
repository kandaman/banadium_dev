var $production_flg = false; //ライセンシープロダクションフラグ
var $radio_mode = false; // 選択方式
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_PRODUCTION);
	
	if (request.mode == "radio") {
		$radio_mode = true;
	}
}

/**
 * ユーザ 検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchuserList(param) {
	
	Logger.getLogger().info(' [searchuserList]　ユーザ 選択一覧検索');

	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var locale_id = 'ja';
	
	var sql ="";
	sql+=" SELECT DISTINCT ";
	sql+=" 	 u.user_cd ";
	sql+=" 	 ,u.user_name as user_nm";
	sql+=" FROM imm_user u ";
	sql+=" INNER JOIN imm_public_grp_ath g ";
	sql+="   ON u.user_cd = g.user_cd ";
	sql+="   AND g.delete_flag = '0' ";
	sql+="   AND g.start_date <= CURRENT_DATE ";
	sql+="   AND g.end_date > CURRENT_DATE ";
	sql+=" INNER JOIN imm_public_grp_inc_ath i ";
	sql+="   ON g.public_group_set_cd = i.public_group_set_cd ";
	sql+="   AND g.public_group_cd = i.public_group_cd ";
	sql+="   AND i.delete_flag = '0' ";
	sql+="   AND i.start_date <= CURRENT_DATE ";
	sql+="   AND i.end_date > CURRENT_DATE ";
	sql+=" WHERE u.locale_id = '"+locale_id+"' ";
	sql+="   AND u.delete_flag = '0' ";
	sql+="   AND u.start_date <= CURRENT_DATE ";
	sql+="   AND u.end_date > CURRENT_DATE ";
	sql+="   AND i.public_group_set_cd = '"+Constant.LO_GROUP_SET_CD+"' "; 
	sql+="   AND i.parent_public_group_cd = '"+Constant.LO_GROUP_CD_PRODUCTION+"' "; //ライセンスプロダクション配下のユーザ
	

	// 入力パラメータ
    var strParam=[];
    var columnNameMap = {};
    // 部分一致
    columnNameMap["user_nm"] = {col:"user_name",comp:"like"};
    
    // 条件設定
    var cnt = 0;
    for(var key in param){
        // 入力した条件が空白なら次へ
    	var val;
    	val = param[key];
    	if (val == ""){
    		continue;
    	}
    	// パラメータの名前に紐づけられたカラムを取得
    	var map = columnNameMap[key];
    	if (typeof map === "undefined"){
    		continue;
    	}

    	//sqlに条件の追加
    	if (map.comp == 'like') {
    		//sql+= " AND func_conv_half2full(" + map.col + ") ilike '%'||func_conv_half2full(?)||'%' ";
    		sql+= " AND " + map.col + " ilike '%'||?||'%' "; // todo フリーワードの仕様によって色々加工する
        }else{
    		sql+= " AND " + map.col + " = ? ";
        }
    	
        // 入力値をセット
    	strParam.push(DbParameter.string(val));
    }

    sql+= " order by user_cd ";

    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam, 0);

    return result;
}
