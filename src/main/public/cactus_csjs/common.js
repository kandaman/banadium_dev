

//本日日付取得YYYY/MM/DD
function getNowData() {	
  var dateAttr = new Date();
  var year = dateAttr.getFullYear();
  var month = dateAttr.getMonth()+1;
  var date = dateAttr.getDate();
  var baseData = year +'/' + month + '/' + date;
  return baseData;
}

// parseJSON時改行コードを変換
function jsonEscape(str)  {
	return str.replace(/(\r\n)/g, '\\n');
}


$(function() {

//テキストボックスに入力された文字が数値ならカンマ区切り----------------
  // フォーカスアウト時にカンマ区切りと桁数制限
  $('.text-number').on('blur', function(){
    var val = $(this).val();

    var arr = val.split('.');
    var num;
    if($(this).attr('name') == "item_suryo") {
    	num = Number(val) <= 2147483647 ? val : val.substr(0,9);	//数量はinteger型の最大まで
    	num = num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }else if (arr.length > 1){
    	arr[0] = arr[0].substr(0,8);	//整数8桁
    	arr[1] = arr[1].substr(0,2);	//小数2桁
        num = arr[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '.' + arr[1];
    }else{
    	arr[0] = arr[0].substr(0,8);	//整数8桁
        num = arr[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }
        
    $(this).val(num);
  });

  // フォーカス時はカンマ外す
  $('.text-number').on('focus', function(){
    var num = $(this).val();
    num = num.replace(/,/g, '');
    $(this).val(num);
  });
//endテキストボックスに入力された文字が数値ならカンマ区切り----------------
  
  // 正の数値しか入力させない
  $(function() {
    $('.text-number').on('input', function() {
		var num = $(this).val();
		var num = num.replace(/[０-９．]/g,function(s){return String.fromCharCode(s.charCodeAt(0)-0xFEE0)});	// 全角は半角に変換
		var num = num.replace(/[。]/g,'.');	// 。は.に変換
		if($(this).attr('name') == "item_suryo") {
			num = num.replace(/[^0-9]+/i,'');	//数量は自然数のみ
		}else{
			num = num.replace(/[^0-9\.]+/i,'');	//数量以外は小数点入力可
		}
		$(this).val(num);
    });
  });
  
  //日付のチェックとスラッシュ
  $('.imCalendar').on('blur', function(){
    var ymd = $(this).val().replace(/\//g, "");
    if(Number(ymd) && ymd.length==8){
    	var y = ymd.substr(0,4);
    	var m = ymd.substr(4,2);
    	var d = ymd.substr(6,2);
    	var dt = new Date(Number(y), Number(m)-1, Number(d));
    	// 妥当性チェック(存在しなければ消す)
    	if(dt.getFullYear() == Number(y) && dt.getMonth() == Number(m)-1 && dt.getDate() == Number(d)){
    		ymd = y+"/"+m+"/"+d;
	    }else{
	    	ymd=""
	    }
    }else{
    	ymd = "";
    }
    $(this).val(ymd);
  });

  //子画面（ダイアログ）を閉じる
  $('.btn_dialog_close').on('click', function(){
    var dialog = $(this).closest(".ui-dialog-content");//ダイアログの取得
	$(dialog).imuiDialog('close');
  });


});