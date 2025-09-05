Constant.load("lo/common_libs/lo_const");
var $gakkyoku_data = {}; //楽曲情報
var $fileList = []; // 完成イメージ
var $production_flg = false;
var $uriba = "";
var $urikata = "";

/**
 * 画面初期表示
 * @param {Object} リクエスト
 */
function init(request) {

	// パラメータに企画ID,枝番がある場合、楽曲情報取得
	if ('kikaku_id' in request && 'kikaku_edaban' in request){
		var result = getGakkyokuDate(request.kikaku_id,request.kikaku_edaban);
		$gakkyoku_data = result.data[0]; //一行だけ取得
			
		// 削除チェック
		Content.executeFunction("lo/common_libs/lo_common_fnction", "chkDeleted", $gakkyoku_data);
			
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
	
	// ライセンスプロダクションか判断
	$production_flg = Content.executeFunction(
		"lo/common_libs/lo_common_fnction", "chkUsergroup",
		Constant.LO_GROUP_CD_BNE);
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
 * 企画情報検索
 * @param {object} 検索条件
 * @returns {object} 検索結果
 */
function getGakkyokuDate(kikakuId,edaban) {
	
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	var sql = "" ;
	
	//todo 必要に応じて加工をする

	sql += " SELECT " ;
	sql += "  g.kikaku_id ";
	sql += "  , g.kikaku_edaban ";
	sql += "  , g.gakkyoku_category ";
	sql += "  , g.gakkyoku_nm ";
	sql += "  , g.single_albam ";
	sql += "  , ko01.cd_naiyo as single_albam_nm " ; 
	sql += "  , g.hanbai_keitai_cd ";
	sql += "  , g.hanbai_keitai_digital ";
	sql += "  , g.hanbai_keitai_sonota ";
	sql += "  , g.digital_haishin_kobetsuhaishin ";
	sql += "  , g.digital_haishin_cdtani ";
	sql += "  , g.digital_haishin_subscription ";
	sql += "  , g.kakaku_cd ";
	sql += "  , g.kakaku_digital ";
	sql += "  , case when g.kakaku_digital is null then '0' else '1' end as kakaku_digital_flg ";
	sql += "  , g.shokaisyukka_mikomi ";
	sql += "  , g.mokuhyo_hambai_su ";
	sql += "  , g.mokuhyou_haishin_su ";
	sql += "  , g.chiiki ";
	sql += "  , ko02.cd_naiyo as chiiki_nm " ; 
	sql += "  , g.hanbaiyoteikosu_nihon ";
	sql += "  , g.hanbaiyoteikosu_chugoku ";
	sql += "  , g.hanbaiyoteikosu_asia ";
	sql += "  , g.hanbaiyoteikosu_chunanbei ";
	sql += "  , g.hanbaiyoteikosu_europe ";
	sql += "  , g.hanbaikoku_shosai ";
	sql += "  , g.hanbai_jiki ";
	sql += "  , g.jyouhou_syosyutu_jiki ";
	sql += "  , g.uriba_tempo ";
	sql += "  , g.uriba_event ";
	sql += "  , g.uriba_ecsite ";
	sql += "  , g.urikata_ippanryutsu ";
	sql += "  , g.urikata_juchuhambai ";
	sql += "  , g.urikata_senkohambai ";
	sql += "  , g.urikata_tempo_kaijogenteihambai ";
	sql += "  , g.hanro ";
	sql += "  , g.jaketto_visual ";
	sql += "  , ko03.cd_naiyo as jaketto_visual_nm " ; 
	sql += "  , g.release_event ";
	sql += "  , ko04.cd_naiyo as release_event_nm " ; 
	sql += "  , g.asobistore ";
	sql += "  , ko05.cd_naiyo as asobistore_nm " ; 
	sql += "  , g.character_shiyoryo_mikomi ";
	sql += "  , g.riyu_joken ";
	sql += "  , g.gakkyoku_setsumei ";
	sql += "  , g.syuroku_naiyo ";
	sql += "  , g.kyokusu ";
	sql += "  , g.dramapart ";
	sql += "  , ko06.cd_naiyo as dramapart_nm " ; 
	sql += "  , g.hunyu_tokuten ";
	sql += "  , ko07.cd_naiyo as hunyu_tokuten_nm " ; 
	sql += "  , g.tenpo_tokuten ";
	sql += "  , ko08.cd_naiyo as tenpo_tokuten_nm " ; 
	sql += "  , g.tokutei_naiyo ";
	sql += "  , g.cdimage ";
	sql += "  , g.comment ";
	sql += "  , g.bikou ";
	sql += "  , g.ok_ng ";
	sql += "  , ko09.cd_naiyo as ok_ng_nm " ; 
	sql += "  , g.royalty_kingaku ";
	sql += "  , g.sakujo_flg ";
	sql += "  , g.touroku_sha ";
	sql += "  , g.touroku_bi ";
	sql += "  , g.koushin_sha ";
	sql += "  , g.koushin_bi ";
	sql += " FROM lo_t_kikaku_gakkyoku g " ; 
	sql += "  LEFT JOIN lo_m_koteichi AS ko01 ";
	sql += "    ON (ko01.cd_cls_id = '" + Constant.LO_CDCLS_SINGLE_ALBAM + "' ";
	sql += "    AND ko01.cd_id = g.single_albam ";
	sql += "    AND ko01.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko02 ";
	sql += "    ON (ko02.cd_cls_id = '" + Constant.LO_CDCLS_CHIIKI + "' ";
	sql += "    AND ko02.cd_id = g.chiiki ";
	sql += "    AND ko02.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko03 ";
	sql += "    ON (ko03.cd_cls_id = '" + Constant.LO_CDCLS_JAKETTO_VISUAL + "' ";
	sql += "    AND ko03.cd_id = g.jaketto_visual ";
	sql += "    AND ko03.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko04 ";
	sql += "    ON (ko04.cd_cls_id = '" + Constant.LO_CDCLS_RELEASE_EVENT + "' ";
	sql += "    AND ko04.cd_id = g.release_event ";
	sql += "    AND ko04.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko05 ";
	sql += "    ON (ko05.cd_cls_id = '" + Constant.LO_CDCLS_ASOBISTORE + "' ";
	sql += "    AND ko05.cd_id = g.asobistore ";
	sql += "    AND ko05.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko06 ";
	sql += "    ON (ko06.cd_cls_id = '" + Constant.LO_CDCLS_DRAMAPART + "' ";
	sql += "    AND ko06.cd_id = g.dramapart ";
	sql += "    AND ko06.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko07 ";
	sql += "    ON (ko07.cd_cls_id = '" + Constant.LO_CDCLS_HUNYU_TOKUTEN + "' ";
	sql += "    AND ko07.cd_id = g.hunyu_tokuten ";
	sql += "    AND ko07.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko08 ";
	sql += "    ON (ko08.cd_cls_id = '" + Constant.LO_CDCLS_TENPO_TOKUTEN + "' ";
	sql += "    AND ko08.cd_id = g.tenpo_tokuten ";
	sql += "    AND ko08.sakujo_flg ='0') ";
	sql += "  LEFT JOIN lo_m_koteichi AS ko09 ";
	sql += "    ON (ko09.cd_cls_id = '" + Constant.LO_CDCLS_OK_NG + "' ";
	sql += "    AND ko09.cd_id = g.ok_ng ";
	sql += "    AND ko09.sakujo_flg ='0') ";

	sql += " WHERE g.sakujo_flg ='0' " ; 
	sql += "   AND g.kikaku_id =? " ; 
	sql += "   AND g.kikaku_edaban = ? " ; 	

	// 検索値をセット
	var strParam=[];
    strParam.push(DbParameter.string(kikakuId));
    strParam.push(DbParameter.number(Number(edaban)));
    
    // sql実行
    var db = new TenantDatabase();
    var result = db.select(sql,strParam);
    
    result.data = getGakkyokuName(result.data);
    
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

function getGakkyokuName(data) {

	// 値取得
	// todo 暫定対応　後でちゃんとやる
		
	var ret = "";
	for (var i = 0;i < data.length;i++){
		
		// 販売形態
		data[i].hanbai_keitai = "";
		if (data[i].hanbai_keitai_cd == "1") {
			data[i].hanbai_keitai = "CD";
		} 
		if (data[i].hanbai_keitai_digital == "1") {
			if (data[i].hanbai_keitai == "") {
				data[i].hanbai_keitai = "デジタル配信";
			} else {
				data[i].hanbai_keitai += "、デジタル配信";
			}
		}
		if (data[i].hanbai_keitai_sonota == "1") {
			if (data[i].hanbai_keitai == "") {
				data[i].hanbai_keitai = "その他";
			} else {
				data[i].hanbai_keitai += "、その他";
			}
		}
		if(data[i].hanbai_keitai == "") {
			data[i].hanbai_keitai = "なし";
		}
		
		// デジタル配信詳細
		data[i].digital_haishin = "";
		if (data[i].hanbai_keitai_digital == "1") {
			if (data[i].digital_haishin_kobetsuhaishin == "1") {
				data[i].digital_haishin = "個別配信";
			} 
			if (data[i].digital_haishin_cdtani == "1") {
				if (data[i].digital_haishin == "") {
					data[i].digital_haishin = "CD単位で配信";
				} else {
					data[i].digital_haishin += "、CD単位で配信";
				}
			}
			if (data[i].digital_haishin_subscription == "1") {
				if (data[i].digital_haishin == "") {
					data[i].digital_haishin = "サブスクリプション";
				} else {
					data[i].digital_haishin += "、サブスクリプション";
				}
			}
			if(data[i].digital_haishin == "") {
				data[i].digital_haishin = "なし";
			}
		} else {
			data[i].digital_haishin = "―";
		}
		
		// 売り場
		if (data[i].uriba_tempo == "1") {
			$uriba = "店舗";
		} 
		if (data[i].uriba_event == "1") {
			if ($uriba == "") {
				$uriba = "イベント";
			} else {
				$uriba = $uriba + "、イベント";
			}
		}
		if (data[i].uriba_ecsite == "1") {
			if ($uriba == "") {
				$uriba = "ECサイト販売";
			} else {
				$uriba = $uriba + "、ECサイト";
			}
		}
		
		// 売り方
		if (data[i].urikata_ippanryutsu == "1") {
			$urikata = "一般流通";
		} 
		if (data[i].urikata_juchuhambai == "1") {
			if ($urikata == "") {
				$urikata = "受注販売";
			} else {
				$urikata = $urikata + "、受注販売";
			}
		}
		if (data[i].urikata_senkohambai == "1") {
			if ($urikata == "") {
				$urikata = "先行販売";
			} else {
				$urikata = $urikata + "、先行販売";
			}
		}
		if (data[i].urikata_tempo_kaijogenteihambai == "1") {
			if ($urikata == "") {
				$urikata = "店舗・会場限定販売";
			} else {
				$urikata = $urikata + "、店舗・会場限定販売";
			}
		}
	}
	return data;    
}
