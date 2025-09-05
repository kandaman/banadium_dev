Constant.load("lo/common_libs/lo_const");
var $radio_mode = false; // 選択方式
var $doc_type_list =[]; // 文書種別のセレクトボックス
var $status_list =[]; // 文書種別のセレクトボックス
var $keiyaku_cls_list =[]; // 文書種別のセレクトボックス
/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {
	if (request.mode == "radio") {
		$radio_mode = true;
	}
	
	$radio_mode = false;
	
	// 文書リスト取得
	$doc_type_list = [];
	$doc_type_list.push({label:"",value:"",selected:true});
	$doc_type_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $doc_type_list, Constant.LO_CDCLS_DOC_TYPE_PR);

	$status_list.push({label:"",value:"",selected:true});
	
	var status_list_temp ={};
	//ステータスをリスト形式で取得
	status_list_temp = Content.executeFunction("lo/common_libs/lo_common_fnction", "getKeyValue", status_list_temp, Constant.LO_CDCLS_KIKAKU_STATUS_PR);
	
	$status_list.push({label:status_list_temp[Constant.LO_STATUS_KANRYO],value:Constant.LO_STATUS_KANRYO});
	$status_list.push({label:status_list_temp[Constant.LO_STATUS_IKO],value:Constant.LO_STATUS_IKO});
	
	// 契約種別リスト取得
	$keiyaku_cls_list = [];
	$keiyaku_cls_list.push({label:"",value:"",selected:true});
	$keiyaku_cls_list = Content.executeFunction("lo/common_libs/lo_common_fnction", "getSelectList", $keiyaku_cls_list, Constant.LO_CDCLS_KEIYAKU_CLS);

}

/**
 * 関連文書 検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function searchKanrenList(param) {
	
	Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索');
	
	//MY文書のSQLのWF部分を除いたもの
	var sql = "" ;
	sql += " SELECT  ";
	sql += "  t.doc_type as bunsho_cls";
	sql += "  , ko04.cd_naiyo as bunsho_cls_nm " ; 
	sql += "  , t.target_doc_type ";
	sql += "  , t.wf_name " ; 
	sql += "  , t.id as kanren_bunsho_id";
	sql += "  , t.ip ";
	sql += "  , t.title_nm ";
	sql += "  , t.kaisha_id " ; 
	sql += "  , t.kaisha_nm " ; 
	sql += "  , t.status_cd ";
	sql += "  , t.status_name " ; 
	sql += "  , t.shinsei_nm as bunsho_nm ";
	sql += "  , t.shinsei_bi ";
	
	sql += " FROM (  ";
	// 企画
	sql += " SELECT ";
	sql += "  '" + Constant.LO_DOC_CLS_KIKAKU + "' as doc_type";
	sql += " ,'" + Constant.LO_DOC_CLS_KIKAKU + "' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ki.kikaku_id AS id ";
	sql += " ,ki.ip_nm AS ip ";
	sql += " ,ki.title_nm ";
	sql += " ,ki.kaisha_id " ; 
	sql += " ,ki.kaisha_nm " ; 
	sql += " ,ka.keiyaku_cls " ; 
	sql += " ,ki.bne_tantou_sha " ;
	sql += " ,ki.kikaku_status as status_cd ";
	sql += " ,ko01.cd_naiyo as status_name " ; 
	sql += " ,ki.kikaku_nm as shinsei_nm";
	sql += " ,to_char(ki.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";
	sql += " ,ki.shohyo_chosa_kekka ";
	sql += " ,case when ki.kikaku_shubetsu_cd in ('" + Constant.LO_KIKAKU_SHUBETSU_MUSIC + "', '" + Constant.LO_KIKAKU_SHUBETSU_EVENT + "')";
	sql += "       then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,'' as gokuhi_flg";
	sql += " FROM ";
	sql += "  lo_t_kikaku AS ki ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" +  Constant.LO_CDCLS_KIKAKU_STATUS_PR + "' ";
	sql += "    AND ko01.cd_id = ki.kikaku_status ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_kaisha AS ka ";
	sql += "    ON (ki.kaisha_id = ka.kaisha_id ";
	sql += "    AND ka.sakujo_flg ='0') ";
	sql += " WHERE ki.sakujo_flg ='0' ";
	//完了のみ
	sql += "   AND (ki.kikaku_status ='"+Constant.LO_STATUS_KANRYO+"' ";
	sql += "  OR ki.kikaku_status ='"+Constant.LO_STATUS_IKO+"') ";
	sql += " UNION ALL ";
	// 許諾
	sql += "SELECT ";
	sql += "  '" + Constant.LO_DOC_CLS_KYODAKU + "' as doc_type";
	sql += " ,'" + Constant.LO_DOC_CLS_KYODAKU + "' as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ky.kyodaku_id AS id ";
	sql += " ,ki.ip_nm AS ip ";
	sql += " ,ki.title_nm ";
	sql += " ,ky.kaisha_id " ; 
	sql += " ,ky.kaisha_nm " ;
	sql += " ,ka.keiyaku_cls " ; 
	sql += " ,ky.bne_tantou_sha " ;
	sql += " ,ky.kyodaku_status as status_cd ";
	sql += " ,ko02.cd_naiyo as status_name " ; 
	sql += " ,ky.kyodaku_nm as shinsei_nm";
	sql += " ,ky.shinsei_bi ";
	sql += " ,null as shohyo_chosa_kekka ";
	sql += " ,case when ky.kyodaku_cls = '" + Constant.LO_KYODAKU_SHUBETSU_NEW + "' then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,'' as gokuhi_flg";
	sql += " FROM ";
	sql += "  lo_t_kyodaku AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_STATUS_PR + "' ";
	sql += "    AND ko02.cd_id = ky.kyodaku_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN ( ";
	sql += "  SELECT hi.kyodaku_id";
	sql += "    ,string_agg(distinct ki.ip_nm,','order by ki.ip_nm) as ip_nm ";
	sql += "    ,string_agg(distinct ki.title_nm,','order by ki.title_nm) as title_nm ";
	sql += "    FROM lo_t_kyodaku_kikaku_himozuke AS hi ";
	sql += "  LEFT JOIN lo_t_kikaku AS ki ";
	sql += "    ON  ki.kikaku_id = hi.kikaku_id ";
	sql += "    AND ki.sakujo_flg ='0' ";
	sql += "    AND hi.sakujo_flg ='0' ";
	sql += "  group by hi.kyodaku_id ";
	sql += "  ) as ki ";
	sql += "    ON ky.kyodaku_id = ki.kyodaku_id ";
	sql += "  LEFT JOIN lo_m_kaisha AS ka ";
	sql += "    ON (ky.kaisha_id = ka.kaisha_id ";
	sql += "    AND ka.sakujo_flg ='0') ";
	sql += "  WHERE  ky.sakujo_flg ='0' ";
	//完了と移行
	sql += "   AND (ky.kyodaku_status ='"+Constant.LO_STATUS_KANRYO+"' ";
	sql += "  OR ky.kyodaku_status ='"+Constant.LO_STATUS_IKO+"') ";
	
	sql += " UNION ALL ";
	// 代わり承認WF
	sql += "SELECT ";
	sql += "  ky.bunsho_cls as doc_type";
	sql += " ,ky.bunsho_cls as target_doc_type";
	sql += " ,'' as wf_name " ; 
	sql += " ,ky.bunsho_id AS id ";	
	sql += " ,ky.ip_nm AS ip ";
	sql += " ,ky.title_nm ";
	sql += " ,case ";
	sql += "  when ky.bunsho_cls ='"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"' then ky.kaigai_hansha_cd";
	sql += "  else ky.kaisha_id";
	sql += "  end kaisha_id";
	sql += " ,case ";
	sql += "  when ky.bunsho_cls ='"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"' then ko03.cd_naiyo";
	sql += "  else ky.kaisha_nm";
	sql += "  end kaisha_nm";
	sql += " ,ka.keiyaku_cls " ;
	sql += " ,ky.kian_sha_nm " ;
	sql += " ,ky.kawari_status as status_cd ";
	sql += " ,ko02.cd_naiyo as status_name " ; 
	sql += " ,ky.bunsho_nm as shinsei_nm";
	sql += " ,to_char(ky.shinsei_bi,'YYYY/MM/DD') as shinsei_bi ";	
	sql += " ,null as shohyo_chosa_kekka ";
	sql += " ,case when ky.kyodaku_cls = '" + Constant.LO_KYODAKU_SHUBETSU_NEW + "' then '1' else '0' END as keiyaku_grp_disp_flg ";
	sql += " ,ky.gokuhi_flg";
	sql += " FROM ";
	sql += "  lo_t_kawari AS ky ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_KYODAKU_STATUS_PR + "' ";
	sql += "    AND ko02.cd_id = ky.kawari_status ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	//LPの場合の海外販社
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_KAIGAI_HANSHA + "' ";
	sql += "    AND	ky.kaigai_hansha_cd = ko03.cd_id ";
	sql += "    AND ko03.sakujo_flg ='0' ";
	sql += "    AND ky.bunsho_cls='"+Constant.LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL+"') ";
	//契約種別取得のため、会社マスタ結合
	sql += "  LEFT JOIN lo_m_kaisha AS ka ";
	sql += "    ON (ky.kaisha_id = ka.kaisha_id ";
	sql += "    AND ka.sakujo_flg ='0') ";
	sql += "  WHERE  ky.sakujo_flg ='0' ";
	//完了のみ
	sql += "   AND (ky.kawari_status ='"+Constant.LO_STATUS_KANRYO+"' ";
	sql += "  OR ky.kawari_status ='"+Constant.LO_STATUS_IKO+"') ";
	sql += "   AND ky.gokuhi_flg ='0' ";
	sql += "  ) t ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_DOC_TYPE_PR + "' ";
	sql += "    AND ko04.cd_id = t.doc_type ";
	sql += "    AND ko04.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "    ON ((('" + Constant.LO_DOC_CLS_KIKAKU + "' = t.doc_type ";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KIKAKU_STATUS + "') ";
	sql += "      OR ('" + Constant.LO_DOC_CLS_KYODAKU + "' = t.doc_type ";
	sql += "        AND ko05.cd_cls_id = '" + Constant.LO_CDCLS_MYDOC_LIST_ORDER_KYODAKU_STATUS + "')) ";
	sql += "    AND ko05.cd_id = t.status_cd ";
	sql += "    AND ko05.sakujo_flg ='0') ";

	//TODO:共通処理でANDが付与されるので、仮で1=1を設定
	sql +="WHERE 1=1";
	
	// 入力パラメータ
    var strParam=[];

	// 画面入力項目とDB項目のマッピング
    var columnNameMap = {};
    columnNameMap["doc_type"] = {col:"t.doc_type",comp:"eq"};
    columnNameMap["bunsho_id"] = {col:"t.id",comp:"like"};
    columnNameMap["status"] = {col:"t.status_cd",comp:"eq"};
    //columnNameMap["shinsei_nm"] = {col:"t.shinsei_nm",comp:"like"};
    columnNameMap["shinsei_from"] = {col:"t.shinsei_bi",comp:"ge"};
    columnNameMap["shinsei_to"] = {col:"t.shinsei_bi",comp:"le"};    
    columnNameMap["kaisha_nm"] = {col:"t.kaisha_nm",comp:"like"};
    columnNameMap["keiyaku_cls"] = {col:"t.keiyaku_cls",comp:"eq"};
    columnNameMap["tantou_sha"] = {col:"t.bne_tantou_sha",comp:"like"};
    
    // 全角スペースを半角に置換して、半角スペース区切りでsplit
    var shinsei_nm = param.shinsei_nm.replace(/　/g," ").split(" ");

    var sql_like = [];
    for(var i in shinsei_nm){
    	sql_like.push(" t.shinsei_nm like '%"+ shinsei_nm[i] +"%' ");
    }
    
    sql += " AND ("+ sql_like.join(" AND ") +") ";
    

    // 条件設定
	var condition = Content.executeFunction("lo/common_libs/lo_common_fnction", "createWhereCondition", param, columnNameMap);
    sql += condition.sql;
    strParam = strParam.concat(condition.bindParams);

    //TODO ソート順要検討
	sql+= " order by t.id";

	// sql実行
	var db = new TenantDatabase();
	Logger.getLogger().info(' [searchIpList]　IP 選択一覧検索 SQL ' + sql);
	var result = db.select(sql,strParam, 0);
	
	var obj = {}
    obj = Content.executeFunction("lo/common_libs/lo_common_fnction", "getStatusName", result.data, Constant.LO_DOC_CLS_MY);
    result.data = obj;

	return result;
}
