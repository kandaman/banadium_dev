/**
 * 文字数カウントダウン
 */
function CountDownLength(idn, str, mnum) {
	//document.getElementById(idn).innerHTML = "残" + (mnum - str.length) + "文字";
	$(idn).text("残" + (mnum - str.length) + "文字");
};

/**
 * 文字数カウントダウン(複数行対応)
 */
function CountDownLengthRow(targetEl,idn, mnum) {
	// 対象行のtrオブジェクトを取得
	var tr = $(targetEl).closest("tr");
	var str = $(targetEl).val();
	$(tr).find(idn).text("残" + (mnum - str.length) + "文字");
};

/**
 * 行数＆文字数制限
 */
function LimitTextarea(idn, idstr, mnum) {
	var str = $(idstr).val();
	var ary = str.split(/\r\n|\n/g);
	var ret = "";
	for(var i=0; i<ary.length; i++){
		ret += ary[i].substr(0,70);
		if(i+1 == mnum || i+1 == ary.length){
			break;
		}else{
			ret += "\r\n";
		}	
	}
	$(idstr).val(ret);
	
	ary = ret.split(/\r\n|\n/g);
	var rownum = ary ? ary.length : 1;
	$(idn).text("残" + (mnum - rownum) + "行");
};

/**
 * 文字数制限(一行の最大文字数と最大行数を指定)
 */
	/*
function maxLengthRow(targetEl,lenMax, rowMax) {

	// 文字取得
	var str = $(targetEl).val();
	// 開業コードで分割
	var strArray = str.split(/\r\n|\r|\n/);
	
	console.log(strArray2.length);
	4
	var result2 = "";
	5
	for (var i = 0; i <= strArray2.length -2; i++) {
	6
	    result2 += strArray2[i]+'<br>';
	7
	}
	8
	$('.result2').html(result2);

	
	// 対象行のtrオブジェクトを取得
	var tr = $(targetEl).closest("tr");
	var str = $(targetEl).val();
	$(tr).find(idn).text("残" + (mnum - str.length) + "文字");
};	
	*/
/**
 * ファイル文字表記
 */
$(document)
		.on(
				'change',
				':file',
				function() {
					var input = $(this), numFiles = input.get(0).files ? input
							.get(0).files.length : 1, label = input.val()
							.replace(/\\/g, '/').replace(/.*\// , '');
					input.parent().parent().next(':text').val(label);
				});

/**
 * tr行チェック
 */
$(document).ready(function() {
	// tr要素をクリックでイベント発火
	$('table tr').click(function() {
		// td要素からチェックボックスを探す
		var $c = $(this).children('td').children('input[type=checkbox]');
		if ($c.prop('checked'))
			$c.prop('checked', '');
		else
			$c.prop('checked', 'checked');
	});
});

/**
 * 検索フォーム初期化
 */
function clearSearchForm() {
	$('.search-form .form-control').each( function(){
		$(this).val("");
	});
}

function startLoading() {
	var h = $(window).height();
	$('#loader').css('margin-top',h/2-100+'px');
	$('#loader-bg ,#loader').css('display','block');
}

function stopLoading() {
	$('#loader-bg').fadeOut(800);
	$('#loader').fadeOut(300);
}

/**
 * INGEN方式テキスト
 */
function compactFullText(str) {
	return '<input type="text" id="compact-full-text" value="'+str+'" tabindex="-1" readonly/>'
}

