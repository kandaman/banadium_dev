function init(request) {
}


function searchSozaihi() {
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
	sql += "      kik.kikaku_id AS kikaku_id ";
	sql += "     ,'' AS ip_nm ";
	sql += "     ,kik.title_nm AS title_nm ";
	sql += "     ,kik.kikaku_nm AS kikaku_nm ";
	sql += "     ,szi.sozaihi_id ";
	sql += "     ,szi.sozai_irai_nm ";
	sql += "     ,szi.siyo_sozaihi_irai_naiyo ";
	sql += "     ,'希望あり' AS kakioroshi_kibo ";
	sql += "     ,szi.sai_irai_flg ";
	sql += "     ,szi.shiharai_kigen_ymd ";
	sql += "     ,szi.shiyo_tensu ";
	sql += "     ,szi.sozai_mitsumori ";
	sql += "     ,szi.shinsei_bi AS shinsei_bi_ymd";
	sql += "     ,szi.kakunin_bi AS kakunin_bi";
	sql += "     ,szi.bne_tantou_sha ";
	sql += "     ,szi.bne_tantou_sha AS bne_tantou_sha_nm ";
	sql += "     ,szi.tenpu_siryou ";
	sql += "     ,szi.tenpu_siryou_file_path ";
	sql += "     ,'一時保存' AS sozaihi_status_nm ";
	sql += " FROM ";
	sql += "   lo_t_sozaihi szi ";
	sql += "   LEFT JOIN lo_t_kikaku_sozai_himozuke hiz ";
	sql += "     ON szi.sozaihi_id = hiz.sozaihi_id ";
	sql += "     AND hiz.sakujo_flg = '0' ";
	sql += "   LEFT JOIN lo_t_kikaku kik ";
	sql += "     ON hiz.kikaku_id = kik.kikaku_id ";
	sql += "     AND kik.sakujo_flg = '0' ";
	sql += " WHERE ";
	sql += "   szi.sakujo_flg = '0' ";
	
	return sql;
}
