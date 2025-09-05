// カレンダー設定（IM標準のimuiCalendarに設定）
var imCalendarInfo =
{
	 "changeMonth":true
	,"changeYear":true
	,"nextText":"来月"
	,"format":"yyyy\/MM\/dd"
	,"dayNames":["日曜日","月曜日","火曜日","水曜日","木曜日","金曜日","土曜日"]
	,"dayNamesShort":["日","月","火","水","木","金","土"]
	,"prevText":"先月"
	,"url":"calendar\/tag\/caljson"
	,"currentText":"現在"
	,"calendarId":"JPN_CAL"
	,"firstDay":0
	,"closeText":"閉じる"
	,"dayNamesMin":["日","月","火","水","木","金","土"]
	,"monthNamesShort":["1","2","3","4","5","6","7","8","9","10","11","12"]
	,"monthNames":["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]
};

	
var seqNo = {}; //シーケンス番号(key:インサート先id,value:シーケンス番号)

function elementCopy(copyId,insertId) {

		// テンプレート行をコピー
	var coln = $("#"+ copyId).clone(true);
	//id削除
	coln.removeAttr('id');
	//class付与(必須項目設定用)
	coln.addClass(copyId+"_copy");
	
/*
	// シーケンス番号を取得
	var rowNo;
	if (seqNo[insertId]) {
		seqNo[insertId] = seqNo[insertId] + 1;
	}else{
		seqNo[insertId] =  1;
	}
	rowNo = seqNo[insertId];
	
	// idが重複しないように末尾にシーケンス番号を付ける
	//changeIdAndName(coln,rowNo);
	changeId(coln,rowNo);
	changeRadioName(coln,rowNo);
	
	coln.attr('id',coln.attr('id') + '_' + rowNo); //自身のidも修正
*/	
	// カレンダーを適用
	setCalendar(coln);
	
	// 表示
	coln.show();
	// 末尾に追加
	coln.appendTo("#" + insertId);
	// 必須項目設定
	dispApplyContents();
	
	return coln;
}



// 対象行の一行下に同じ内容をコピー
function copyLine(targetEl) {

	//var mototr = $(targetEl).closest("tr");
	var mototr = $(targetEl).closest("tbody"); // tbody単位で一行とする
	
	// コピー元のカレンダーを一時削除（clonで不具合でるため）
	delCalendar(mototr);

	// コピー
	var coln = mototr.clone(true);

/*	
	var insertId = $(mototr).parent().attr('id'); //

	// シーケンス番号を取得
	var rowNo;
	if (seqNo[insertId]) {
		seqNo[insertId] = seqNo[insertId] + 1;
	}else{
		seqNo[insertId] =  1;
	}
	rowNo = seqNo[insertId];

	//changeIdAndName(coln,rowNo);
	changeId(coln,rowNo);
	changeRadioName(coln,rowNo);
	coln.attr('id',coln.attr('id') + '_' + rowNo); //自身のidも修正
*/	
	//コンボボックスの値をコピー (clonでコピーできないため)
	cloneSelectVal(mototr,coln);
	
	// カレンダーを適用
	setCalendar(mototr);
	setCalendar(coln);
	
	// 表示
	coln.show();
	// 一行下に追加
	coln.insertAfter(mototr);
	return coln;
}


//要素以下のidの末尾に番号を追加する
function changeId(obj,no) {
	// 要素以下のすべてのidを取得
	obj.find('*').each(function(i, elem) {
		var attrid = $(elem).attr("id");
		if( typeof attrid !== 'undefined'){
			$(elem).attr('id', attrid + '_' + no);
		}
	});
}
// 要素以下にラジオボタンがあった場合名前の変更(コピー元と同一グループになってしまうため)
function changeRadioName(obj,no) {
	// 要素以下のすべてのラジオボタンを取得
	obj.find('input[type="radio"]').each(function(i, elem) {
		var attrname = $(elem).attr("name");
		if( typeof attrname !== 'undefined'){
			$(elem).attr('name', attrname + '_' + no);
		}
	});
}

//要素以下のidとnameの末尾に番号を追加する
/*function changeIdAndName(obj,no) {
	// 要素以下のすべてのidと名前を取得
	obj.find('*').each(function(i, elem) {
		var attrid = $(elem).attr("id");
		if( typeof attrid !== 'undefined'){
			$(elem).attr('id', attrid + '_' + no);
		}
		var attrname = $(elem).attr("name");
		if( typeof attrname !== 'undefined'){
			$(elem).attr('name', attrname + '_' + no);
		}		
	});
}
*/

// cloneではコンボボックスのselect状態をコピーしないのでコピーする
function cloneSelectVal(moto,clone) {
	var arr = [];
	// コピー元のselectのvalを取得
	$(moto).find('select').each(function(i, elem) {
		arr[i] = $(elem).val();
	});
	// clon先へセット
	$(clone).find('select').each(function(i, elem) {
		$(elem).val(arr[i]);
	});
}

	
// 対象行の削除
function delLine(targetEl) {
	// 対象のtr行を取得する
	var obj = $(targetEl).closest("tr");
	// 対象のtr行を削除する
	$(obj).remove();
}
// 対象行の削除(tbody)
function delTbody(targetEl) {
	// 対象のtbody行を取得する
	var obj = $(targetEl).closest("tbody");
	// 対象のtbody行を削除する
	$(obj).remove();
}	

// 対象行を一行上へ移動
function upLine(targetEl) {
	
	// 対象のtr行を取得する
	//var $row = $(targetEl).closest("tr");
	var $row = $(targetEl).closest("tbody");

	// 一行上のtr行を取得する
	//var $row_prev = $row.prev("tr:visible")
	var $row_prev = $row.prev("tbody:visible")
	
	// あれば上に移動
	if($row.prev.length) {
		$row.insertBefore($row_prev);
	}
}
// 対象行のを一行下へ移動
function downLine(targetEl) {
	//var $row = $(targetEl).closest("tr");
	var $row = $(targetEl).closest("tbody");
	//var $row_next = $row.next("tr:visible");
	var $row_next = $row.next("tbody:visible");
	if($row_next.length) {
		$row.insertAfter($row_next);
	}
}

function getTrgetId(obj) {

	var array = [];

	// 要素以下のすべてのidを取得
	obj.find('*').each(function(i, elem) {
		var attr = $(elem).attr("id");
		if( typeof attr !== 'undefined'){
			array.push(attr);
		}
	});
	
	return array;
}



/**
 * 申請内容行に取得データをセット(一時保存時)
 * 
 * dataObj:申請内容のデータオブジェクト
 * bodyId:挿入するtbody(テンプレート行)のId
 * tblId:挿入先のテーブルId
 * 
 */
function setContentDataToLine(dataObj,bodyId,tblId) {
	$.each(dataObj, function(idx, data) {
		//テンプレート行をコピー
		var coln = $("#"+ bodyId).clone(true);
		//id削除
		coln.removeAttr('id');
		//class付与(必須項目設定用)
		coln.addClass(bodyId+"_copy");
		//データを反映
		coln.find('.id_rowno').text(data.meisai_gyo_no);
		coln.find('.id_content_name').val(data.meisai_gyo_nm); //名称
		coln.find('.id_area_cd').val(data.region_kuni_cd).change(); //地域コード
		coln.find('.id_area').text(data.sonota_region_kuni_nm); //地域名称
		coln.find('.id_area_name').val(data.sonota_region_kuni_nm); //地域名称
		coln.find('.id_currency').val(data.tuka_cd).change();// 通貨セレクトボックス
		coln.find('.id_otherCurrency').val(data.sonota_tuka_nm);  // 通貨：その他
		coln.find('.id_platform').val(data.platform_cd).change();  //プラットフォームセレクトボックス
		coln.find('.id_otherPlatform').val(data.sonota_platform_nm);   //プラットフォーム：その他テキストボックス
		coln.find('.id_sale-date').val(data.hatubai_ymd);            //発売日
		coln.find('.id_price').val(data.kakaku);  // 価格
		coln.find('.id_price_type').val(data.kakakutai_kbn).change();  // 価格帯
		coln.find('.id_suryo').val(data.suryo);  // 数量
		coln.find('.id_dl_flg').val(data.dlban_kbn).change();  // ダウンロード
		coln.find('.id_dlPrice').val(data.dlban_kakaku);  // ダウンロード価格
		coln.find('.id_period').val(data.kikan);  // 期間
		coln.find('.id_eventname').val(data.event_nm_basho);  // イベント名
		coln.find('.id_note').val(data.biko);  // 備考

		// カレンダーを適用
		//coln.find(".id_sale-date").imuiCalendar(imCalendarInfo); //todo 追加とかコピー時の動き考えてから適用する
		setCalendar(coln);
		
		coln.show();
		//テーブル末尾に追加
		coln.appendTo("#"+ tblId);
		// 必須項目設定
		dispApplyContents();
	});
}

// 対象要素にカレンダーにカレンダーを適用する
function setCalendar(targetEl) {

	// カレンダー適用
	targetEl.find(".imCalendar").imuiCalendar(imCalendarInfo);
}
// 対象からカレンダーを削除
function delCalendar(targetEl) {

	// カレンダーを削除
	var obj = targetEl.find(".imCalendar");
	obj.imuiCalendar('destroy');
	
	// クラス,idも削除
	obj.removeClass("hasDatepicker"); // classを削除
	obj.removeClass("imui-calendar"); // classを削除
	obj.removeData("datepicker"); // 関連づけられたデータを削除
	obj.removeAttr("id"); // idも削除
	obj.unbind(); // 関連づけられた関数を削除

	// img削除
	//obj.next("img").remove();
}