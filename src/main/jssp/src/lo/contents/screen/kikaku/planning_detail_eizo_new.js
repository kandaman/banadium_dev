Constant.load("lo/common_libs/lo_const");
var $production_flg = false;
var $eizo_data = {};
var $fileList = []; // 完成イメージ

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_BNE);
	
	// パラメータに企画ID,枝番がある場合、楽曲情報取得
	if ('kikaku_id' in request && 'kikaku_edaban' in request){
		var result = getEizoDate(request.kikaku_id,request.kikaku_edaban);
		$eizo_data = result.data[0]; //一行だけ取得
		
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $eizo_data);
		
		// 企画データ取得
		var kikakuData = Content.executeFunction("lo/contents/screen/kikaku/planning_data_retriever", "getKikakuData", request.kikaku_id);
		
		// 参照可能チェック
		if(!chkVisible(kikakuData)){
			Content.executeFunction("lo/common_libs/lo_common_fnction", "toNoAuthorityPage", true);
		}
		
		var fileResult = getFileData(request.kikaku_id, request.kikaku_edaban);
		Logger.getLogger().info(' [init]　fileResult ' + ImJson.toJSONString(fileResult, true));
		$fileList = fileResult.data;
	} else {
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted");
	}
}

/**
 * 参照可能かチェック
 */
function chkVisible(data) {
	
	// ライセンシーフラグ
	var liFlg = Content.executeFunction("lo/common_libs/lo_common_fnction", "chkUsergroup", Constant.LO_GROUP_CD_LICENSEE);
	// 会社チェック（編集可能な所属グループかどうか）
	if (liFlg) {
		var userCompanyDepartment = Content.executeFunction("lo/common_libs/lo_common_fnction", "getUserCompanyDepartmentInfo");
		var kaisha_id = (userCompanyDepartment.companyCd != null) ? userCompanyDepartment.companyCd : "";
		if (data.kaisha_id != kaisha_id) {
			return false;
		}
	}
	
	return true;
}

/**
 * 映像情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getEizoDate(kikakuId,edaban) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ;
	
	//todo 必要に応じて加工をする
	sql += " SELECT " ;
	sql += "   e.kikaku_id " ; 
	sql += "  , e.kikaku_edaban " ; 
	sql += "  , e.eizo_category " ; 
	sql += "  , ko01.cd_naiyo as eizo_category_nm " ;  
	sql += "  , e.shiyou_youto_nm " ;  
	sql += "  , e.riyou_ryo" ; 
	sql += "  , e.riyou_ryo_bikou" ; 
	sql += "  , e.chiiki " ; 
	sql += "  , ko02.cd_naiyo as chiiki_nm " ;  
	sql += "  , e.haishin_chiiki " ; 
	sql += "  , e.kaisai_basho " ;  
	sql += "  , e.eizo_kaishi_jiki " ; 
	sql += "  , e.eizo_shuryo_jiki " ; 
	sql += "  , e.shuryo_bikou " ; 
	sql += "  , e.riyo_saki " ; 
	sql += "  , e.syosyutu_jiki " ; 
	sql += "  , e.senden_hansoku " ; 
	sql += "  , e.eizo_riyo_kibo " ; 
 	sql += "  , ko05.cd_naiyo as eizo_riyo_kibo_nm " ; 
 	sql += "  , e.eizo_shiyoryo_syousai " ;
	sql += "  , e.gakkyoku_riyo_kibo " ; 
 	sql += "  , ko06.cd_naiyo as gakkyoku_riyo_kibo_nm " ; 
 	sql += "  , e.gakkyoku_shiyoryo_syousai " ;
	sql += "  , e.kakioroshi_kibo " ; 
 	sql += "  , ko07.cd_naiyo as kakioroshi_kibo_nm " ; 
 	sql += "  , e.kakioroshi_shiyoryo_syousai " ; 
	sql += "  , e.voice_riyo_kibo " ; 
 	sql += "  , ko08.cd_naiyo as voice_riyo_kibo_nm " ;  
 	sql += "  , e.voice_shiyoryo_syousai " ; 
 	sql += "  , e.kikaku_setsumei " ; 
//	sql += "  , e.eizo_image ";
//	sql += "  , e.comment ";
	sql += "  , e.bikou "; 
	sql += "  , e.riyu_joken ";
	sql += "  , e.ok_ng " ;
	sql += "  , ko03.cd_naiyo as ok_ng_nm " ; 
	sql += "  , e.royalty_kingaku " ; 
	sql += "  , e.sakujo_flg ";
	sql += "  , e.touroku_sha ";
	sql += "  , e.touroku_bi ";
	sql += "  , e.koushin_sha ";
	sql += "  , e.koushin_bi ";	
	sql += " FROM lo_t_kikaku_eizo as e " ;
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_EIZO_CATEGORY + "' ";
	sql += "    AND ko01.cd_id = CAST(e.eizo_category AS character varying) ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko02.cd_id = e.chiiki ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko03.cd_id = e.ok_ng "; 
	sql += "    AND ko03.sakujo_flg ='0') "; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 "; 
	sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_EIZO_SHIYO_KIBO + "' "; 
	sql += "    AND ko05.cd_id = e.eizo_riyo_kibo "; 
	sql += "    AND ko05.sakujo_flg ='0') "; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
	sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_GAKKYOKU_SHIYO_KIBO + "' ";
	sql += "    AND ko06.cd_id = e.gakkyoku_riyo_kibo ";
	sql += "    AND ko06.sakujo_flg ='0') "; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko07 "; 
	sql += "    ON (ko07.cd_cls_id = '" + Constant.LO_CDCLS_KAKIOROSI_KIBOU_UMU_EIZO + "' "; 
	sql += "    AND ko07.cd_id = e.kakioroshi_kibo "; 
	sql += "    AND ko07.sakujo_flg ='0') "; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko08 "; 
	sql += "    ON (ko08.cd_cls_id = '" + Constant.LO_CDCLS_VOICE_KIBO + "' "; 
	sql += "    AND ko08.cd_id = e.voice_riyo_kibo "; 
	sql += "    AND ko08.sakujo_flg ='0') "; 
	sql += " WHERE e.sakujo_flg ='0' " ; 
	sql += "   AND e.kikaku_id =? " ; 
	sql += "   AND e.kikaku_edaban = ? " ; 	

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.number(Number(edaban)));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
    
}

/**
 * 企画情報(商品)完成イメージ検索
 * @param {string} 企画ID
 * @param {number} 企画枝番
 * @returns {object} 検索結果
 */
function getFileData(kikakuId,edaban) {
	var sql = "" ;
	
	sql += " SELECT " ;
	sql += "  ksf.file_name " ; 
	sql += "  , ksf.file_path " ; 
	sql += "  , ksf.comment " ; 
	sql += " FROM lo_t_kikaku_shohin_file ksf " ; 
	sql += " WHERE ksf.sakujo_flg ='0' " ; 
	sql += "   AND ksf.kikaku_id =? " ; 
	sql += "   AND ksf.kikaku_edaban =? " ; 
	sql += " ORDER By ksf.file_no " ; 

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.number(Number(edaban)));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    return result;
}


	