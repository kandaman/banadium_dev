function init(request) {
}


function searchHansokubutsu() {
	var db = new TenantDatabase();
	var sql = getSearchSql();
	var aryParams = [];
	var result;
	result = db.select(sql, aryParams, 0);
	return result;
}


function getSearchSql() {
	var sql = "";
	sql += " SELECT ";
	sql += "      'PR000001' AS kikaku_id ";
	sql += "     ,'IP' AS ip_nm ";
	sql += "     ,'タイトル名' AS title_nm ";
	sql += "     ,'企画名' AS kikaku_nm ";
	sql += "     ,hnsok.hansokubutsu_id ";
	sql += "     ,hnsok.hansokubutsu_nm ";
	sql += "     ,hnsok.shiyo_jiki AS shiyo_jiki_ymd";
	sql += "     ,hnsok.yotei_suryo ";
	sql += "     ,hnsok.siyo_haihu_yotei_basho ";
	sql += "     ,hnsok.shurui_su ";
	sql += "     ,hnsok.keitai ";
	sql += "     ,hnsok.senden_hansoku_keikaku ";
	sql += "     ,hnsok.shiyo_sozai ";
	sql += "     ,hnsok.bne_tantou_sha ";
	sql += "     ,hnsok.bne_tantou_sha AS bne_tantou_sha_nm ";
	sql += "     ,hnsok.image_gazo AS image_gazo_nm ";
	sql += "     ,hnsok.image_gazo_file_path ";
	sql += "     ,hnsok.sonohoka_siryo AS sonohoka_siryo_nm ";
	sql += "     ,hnsok.sonohoka_siryo_file_path ";
	sql += "     ,CASE WHEN hnsok.usho_flg = '1' THEN '有償' ELSE '無償' END AS usho_flg ";
	sql += "     ,hnsok.shinsei_bi AS shinsei_bi_ymd ";
	sql += "     ,hnsok.kakunin_bi AS kakunin_bi_ymd ";
	sql += "     ,'申請中' AS hansoku_status_nm ";
	sql += " FROM ";
	sql += "     lo_t_hansokubutu hnsok ";
	sql += " WHERE ";
	sql += "     hnsok.sakujo_flg = '0' ";
	
	return sql;
}
