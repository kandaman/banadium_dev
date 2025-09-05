var $arealist = [];
var $other = { is : false, cd : "", nm : "" };

function init() {
    var db = new TenantDatabase();
    // マスタからビューに変更、更にコード体系や内容も変わっている。
    // ロジック（CL、SVともに）の変更を最小限にする為にCOALESCEを使用。
	var sql 
		= "SELECT REGION_KUNI_CD AS CD "
		+ "     , REGION_KUNI_NM AS NM "
		+ "     , COALESCE( OYA_REGION_CD, '0' ) AS PARENT "
		+ "     , SORT_NO "
		+ "	 FROM V_REGION_KUNI "
		+ "	 ORDER BY PARENT, SORT_NO ";
		
	// ※ソート順
	// 「親なし＝ area」のデータを、
	// 「親あり＝ region」より先に処理したいので、
	// PARENT を第一キーにしてソートする。

	
	var result = db.select(sql);
	var data = result.data;
	var rows = result.countRow;
	

	// imart タグではMap系オブジェクトが上手く扱えないので、
	// 最終的にはオブジェクトのリストと言う形にして、
	// シーケンシャルな処理が出来るようにする。
	// 中間処理のため、この init 関数内でのみ map 構造を用いる。
	var areamap = {};
	
	for ( var r = 0; r < rows; r++) {
		var row = data[r];

		
		// other は特殊処理（最優先判定 ※）
		// ※元々は親コード999が「その他」の固有コードだったが、
		//   コード体系が変わって親コードで区別出来なくなった為、
		//   コード99を「その他」と判定する。
		//   このため処理順も変更して優先判定する必要が出た。
		if ( "99" == row.cd ) {
			$other.is = true;
			$other.cd = row.cd;
			$other.nm = row.nm;
		}
		// こいつに親が設定されていなければ、こいつ自分が親。
		else if ( "0" == row.parent ) {
			
			var area = {
				cd : row.cd,
				nm : row.nm,
				regions : []
			};
			
			$arealist.push( area );
			areamap[row.cd] = area;
		}
		// 親が設定されていれば、そいつの配下に自分を追加する。
		else {
			// 無いとは思うけど、親が定義されてないケースがあれば無視する。
			if ( row.parent in areamap ) {
				var region = {
		           cd : row.cd,
		           nm : row.nm
				}
				areamap[row.parent].regions.push( region );
			}
		}
	}
	
	
}