// 事業部タイプ
var type_Ne = [CD_DIV_NE,CD_DIV_BXD,CD_DIV_BNO];
var type_Cs = [CD_DIV_CS];

// 初期表示
function initDisplay() {
	
    // 件名、ダウンロード名
	/*$("#itemNamePromo").hideAndDisable();
	$("#itemNameDL").hideAndDisable();
	// 新商品紐付け
	$("#relationApply").hide();
	// ダウンロードコンテンツ有無
	$("#radio_DownloadContents").hide();
	// 申請内容
	$("#newItemContent").hideAndDisable();
	$("#promoContent").hideAndDisable();
	$("#downloadContent").hideAndDisable();
	*/
    dispSheetTypeInit();
}

//タブクリック(ページ切り替え)
function OntTabClick(num) {

	for (var i=1;i < 6;i++){
		var idn = 'page' + i;
		if (i == num){
			document.getElementById(idn).style.display="block";
		}else{
			document.getElementById(idn).style.display="none";
		}
	}
}


//申請内容の表示制御と必須項目設定-------------------------------
function dispApplyContents() {

	//var selectSheet = $("#SheetType option:selected").val();
	var selectSheet = $('[name="item_sheetType"]').val();
	
	if (selectSheet == TYPE_APPLY_SINKIKAKU){ // 新企画
		var selectDivi = $("#Division option:selected").val(); // 新商品企画は事業部でさらに項目変更
		if (selectDivi == ""){ // 未選択
			$("#newItemContent").hideAndDisable();
			$("#promoContent").hideAndDisable();
			$("#downloadContent").hideAndDisable();
			return;
		}
		// 表示
		$("#newItemContent").showAndEnable();
		$("#promoContent").hideAndDisable();
		$("#downloadContent").hideAndDisable();
		// 必須項目初期化
		$("#newItemContent").find(".required").removeClass("required");
		$("#promoContent").find(".required").removeClass("required");
		$("#downloadContent").find(".required").removeClass("required");
		// 必須項目設定
		$("#newItemContent").find('[name="item_genre"]').addClass("required");
		// 事業部別設定
		if (type_Cs.indexOf(selectDivi) > -1){ //CS
			// 表示
			$("#newItemContent_cs").showAndEnable();
			$("#newItemContent_ne").hideAndDisable();
			$("#newItemContent_ot").hideAndDisable();
			// 必須項目設定
			$(".newItemtbody_cs_copy").find('[name="item_content_name"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_area_name"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_currency"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_currency"]').change();
			$(".newItemtbody_cs_copy").find('[name="item_platform"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_platform"]').change();
			$(".newItemtbody_cs_copy").find('[name="item_sale_date"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_price"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_suryo"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_dl_flg"]').addClass("required");
			$(".newItemtbody_cs_copy").find('[name="item_dl_flg"]').change();
		}else if (type_Ne.indexOf(selectDivi) > -1){ //NE
			// 表示
			$("#newItemContent_cs").hideAndDisable();
			$("#newItemContent_ne").showAndEnable();
			$("#newItemContent_ot").hideAndDisable();
			// 必須項目設定
			$(".newItemtbody_ne_copy").find('[name="item_area_name"]').addClass("required");
			$(".newItemtbody_ne_copy").find('[name="item_platform"]').addClass("required");
			$(".newItemtbody_ne_copy").find('[name="item_platform"]').change();
			$(".newItemtbody_ne_copy").find('[name="item_sale_date"]').addClass("required");
			$(".newItemtbody_ne_copy").find('[name="item_price_type"]').addClass("required");
			$(".newItemtbody_ne_copy").find('[name="item_price_type"]').change();
		}else{
			// 表示
			$("#newItemContent_cs").hideAndDisable();
			$("#newItemContent_ne").hideAndDisable();
			$("#newItemContent_ot").showAndEnable();
			// 必須項目設定
			$(".newItemtbody_ot_copy").find('[name="item_area_name"]').addClass("required");
			$(".newItemtbody_ot_copy").find('[name="item_currency"]').addClass("required");
			$(".newItemtbody_ot_copy").find('[name="item_currency"]').change();
			$(".newItemtbody_ot_copy").find('[name="item_platform"]').addClass("required");
			$(".newItemtbody_ot_copy").find('[name="item_platform"]').change();
			$(".newItemtbody_ot_copy").find('[name="item_sale_date"]').addClass("required");
			$(".newItemtbody_ot_copy").find('[name="item_price"]').addClass("required");
			$(".newItemtbody_ot_copy").find('[name="item_suryo"]').addClass("required");
		}
		chengeTagNameMap(selectDivi);
	} else if(selectSheet==TYPE_APPLY_HANSOKU){ // 販促
		// 表示
		$("#newItemContent").hideAndDisable();
		$("#promoContent").showAndEnable();
		$("#downloadContent").hideAndDisable();
		// 必須項目設定
		$(".promotbody_copy").find('[name="item_area_name"]').addClass("required");
		$(".promotbody_copy").find('[name="item_period"]').addClass("required");
		$(".promotbody_copy").find('[name="item_event_name"]').addClass("required");
		$(".promotbody_copy").find('[name="item_suryo"]').addClass("required");
	} else if(selectSheet==TYPE_APPLY_DLC){ // ダウンロード
		// 表示
		$("#newItemContent").hideAndDisable();
		$("#promoContent").hideAndDisable();
		$("#downloadContent").showAndEnable();
		// 必須項目設定
		$(".downloadtbody_copy").find('[name="item_content_name"]').addClass("required");
		$(".downloadtbody_copy").find('[name="item_area_name"]').addClass("required");
		$(".downloadtbody_copy").find('[name="item_currency"]').addClass("required");
		$(".downloadtbody_copy").find('[name="item_currency"]').change();
		$(".downloadtbody_copy").find('[name="item_sale_date"]').addClass("required");
		$(".downloadtbody_copy").find('[name="item_price"]').addClass("required");
	}else{// 未選択
		$("#newItemContent").hideAndDisable();
		$("#promoContent").hideAndDisable();
		$("#downloadContent").hideAndDisable();
	}
	
}


//ダウンロードコンテンツ有無の表示制御-------------------------------
function dispDownloadContents() {
	
    var selectVal1 = $("#Division option:selected").val();
	var selectVal2 = $('[name="item_sheetType"]').val();
	//var selectVal2 = $("#SheetType option:selected").val();
	
	if (type_Cs.indexOf(selectVal1) > -1 && selectVal2==TYPE_APPLY_SINKIKAKU){
		$("#radio_DownloadContents").show();
	}else{
		$("#radio_DownloadContents").hide();
	}
};
//---------------------------------------------------------


//申請書種類初期値-------------------------------

function dispSheetTypeInit() {
	var selectVal = $('[name="item_sheetType"]').val();
	
	if (selectVal==TYPE_APPLY_HANSOKU){
	// 販促物企画申請書
		$("#relationApply").show();
		$("#itemNamePromo").showAndEnable();
		$("#itemNameDL").hideAndDisable();
		$("#itemNameJap").hideAndDisable();
		$("#itemNameEng").hideAndDisable();
		// 必須項目
		$('[name="relationApplyList"]').addClass("required");
		$("#itemNamePromo").find("[name=item_itemNameJap]").addClass("required");
	}else if(selectVal==TYPE_APPLY_DLC){
	// ダウンロードコンテンツ申請書
		$("#relationApply").show();
		$("#itemNamePromo").hideAndDisable();
		$("#itemNameDL").showAndEnable();
		$("#itemNameJap").hideAndDisable();
		$("#itemNameEng").hideAndDisable();
		// 必須項目
		$('[name="relationApplyList"]').addClass("required");
		$("#itemNameDL").find("[name=item_itemNameJap]").addClass("required");
	}else if(selectVal==TYPE_APPLY_SINKIKAKU){
	// 新商品企画申請書
		$("#relationApply").hide();
		$("#itemNamePromo").hideAndDisable();
		$("#itemNameDL").hideAndDisable();
		$("#itemNameJap").showAndEnable();
		$("#itemNameEng").showAndEnable();
		// 必須項目
		$("#itemNameJap").find("[name=item_itemNameJap]").addClass("required");
		$("[name=proposalList]").addClass("required");
	}else {
		$("#relationApply").hide();
		$("#itemNamePromo").hideAndDisable();
		$("#itemNameDL").hideAndDisable();
		$("#itemNameJap").hideAndDisable();
		$("#itemNameEng").hideAndDisable();
	}
	
	// 申請内容行の表示
	dispApplyContents();

	// ダウンロードコンテンツ有無
	dispDownloadContents();
	
	// DL申請の場合事業部をCS固定
	if (selectVal==TYPE_APPLY_DLC){
		
		$('#Division').val(CD_DIV_CS).change();
		//CS以外をdisbleにして固定
		$("#Division").find('option').each(function(i, elem) {
			if (!$(elem).prop('selected')) $(elem).prop('disabled',true);
		});
	}else{
		//disbleを解除
		$('#Division').find('option').prop('disabled',false);
	}
	// 添付資料の文言変更
	if (selectVal==TYPE_APPLY_SINKIKAKU){
		$('#lbl_tmpTypeName_req').show();
		$('#lbl_tmpTypeName_any').hide();
	}else{
		$('#lbl_tmpTypeName_req').hide();
		$('#lbl_tmpTypeName_any').show();
	}
	
	
	// コンセプト／備考の文言変更
	if (selectVal==TYPE_APPLY_HANSOKU){
		$('#lbl_apply_note').text(LBL_BIKO_HANSOKU);
	}else{
		$('#lbl_apply_note').text(LBL_BIKO_DEFAULT);
	}	
}


	
//申請書種類切り替え-------------------------------
/*$(function() {
	$("#SheetType").change(function() {	
		var selectVal = $(this).val();
		// 表示切り替え
		//$("#relationApply").hide();
		//$("#itemNameJap").hide();
		//$("#itemNameEng").hide();
		//$("#itemGenre").hide();
		if (selectVal==TYPE_APPLY_HANSOKU){
			$("#relationApply").show();
			$("#itemNamePromo").showAndEnable();
			$("#itemNameDL").hideAndDisable();
			$("#itemNameJap").hideAndDisable();
			$("#itemNameEng").hideAndDisable();
		}else if(selectVal==TYPE_APPLY_DLC){
			$("#relationApply").show();
			$("#itemNamePromo").hideAndDisable();
			$("#itemNameDL").showAndEnable();
			$("#itemNameJap").hideAndDisable();
			$("#itemNameEng").hideAndDisable();
		}else if(selectVal==TYPE_APPLY_SINKIKAKU){
			$("#relationApply").hide();
			$("#itemNamePromo").hideAndDisable();
			$("#itemNameDL").hideAndDisable();
			$("#itemNameJap").showAndEnable();
			$("#itemNameEng").showAndEnable();
		}else {
			$("#relationApply").hide();
			$("#itemNamePromo").hideAndDisable();
			$("#itemNameDL").hideAndDisable();
			$("#itemNameJap").hideAndDisable();
			$("#itemNameEng").hideAndDisable();
		}
		
		// 申請内容行の表示
		dispApplyContents();

		// ダウンロードコンテンツ有無
		dispDownloadContents();
		
		// DL申請の場合事業部をCS固定
		if (selectVal==TYPE_APPLY_DLC){
			$('#Division').val(CD_DIV_CS).change();
			//CS以外をdisbleにして固定
			$("#Division").find('option').each(function(i, elem) {
				if (!$(elem).prop('selected')) $(elem).prop('disabled',true);
			});
		}else{
			//disbleを解除
			$('#Division').find('option').prop('disabled',false);
		}
		// 添付資料の文言変更
		if (selectVal==TYPE_APPLY_SINKIKAKU){
			$('#lbl_tmpTypeName_req').show();
			$('#lbl_tmpTypeName_any').hide();
		}else{
			$('#lbl_tmpTypeName_req').hide();
			$('#lbl_tmpTypeName_any').show();
		}
		
		
		// コンセプト／備考の文言変更
		if (selectVal==TYPE_APPLY_HANSOKU){
			$('#lbl_apply_note').text(LBL_BIKO_HANSOKU);
		}else{
			$('#lbl_apply_note').text(LBL_BIKO_DEFAULT);
		}
		
		
	});
});
*/

// 対象要素を非表示にし、配下のinput属性をdisableにする
$.fn.hideAndDisable = function()
{
	$(this).hide();
	$(this).find('input,select').each(function(i, elem) {
		$(elem).prop('disabled',true);
	});
};
//対象要素を表示し、配下のinput属性をenableにする
$.fn.showAndEnable = function()
{
	$(this).show();
	$(this).find('input,select').each(function(i, elem) {
		$(elem).prop('disabled',false);
	});
};

//---------------------------------------------------------


	
// 地域選択ボタン押下	
function openAreaRadio(obj) {
	// このボタンが配置されている td をセレクト。
	var $td = $(obj).closest('td');
	
	// td配下の各種要素を取得
	var $div_id_area    = $td.find("div.id_area");
	var $hidden_area_cd = $td.find("input.id_area_cd");
	var $hidden_area_nm = $td.find("input.id_area_name");
		
	var args = {
			cd : $hidden_area_cd.val(),
			nm : $hidden_area_nm.val()
	};
	openSelectAreaRadioDialog(
			args,
			function(cd, nm) {			
				$div_id_area.text(nm);
				$hidden_area_nm.val(nm);
				$hidden_area_cd.val(cd).change();
			});
}
	
	
	
	
	
	
/*
//ファイル追加-------------------------------
$(function() {
	$("#add-btn").click(function() {
		var txtval = $("#up-txt").val();
		if (txtval != "") {
			// テンプレート行をコピーし末尾に追加
			var coln = $("#tmpfileup").clone(true);
			coln.find('#filename').text(txtval);
			coln.show();
			coln.appendTo("#tmpList");
			$("#up-txt").val("");
		}
	})
	// キャンセル
	$("#can-btn").click(function() {
		$("#up-txt").val("");
	})
	
});
//---------------------------------------------------------
*/




