/**
 * @file 【front】共通関数群
 */

// ※このファイルは e Builder のフォーマット機能を使用しないでください

$.fn.serializeRawValueArray = function() {
	return this.map( function() {

		// Can add propHook for "elements" to filter or add form elements
		var elements = jQuery.prop( this, "elements" );
		return elements ? jQuery.makeArray( elements ) : this;
	} )
	.filter( function() {
		var type = this.type;
		var rsubmittable = /^(?:input|select|textarea|keygen)/i;
		var rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i;
		var rcheckableType = ( /^(?:checkbox|radio)$/i );

		// Use .is( ":disabled" ) so that fieldset[disabled] works
		return this.name && !jQuery( this ).is( ":disabled" ) &&
			rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
			( this.checked || !rcheckableType.test( type ) );
	} )
	.map( function( i, elem ) {
		var rCRLF = /\r?\n/g;
		var val = jQuery( this ).val();

		if ( val == null ) {
			return null;
		}

		// Custom Part Start
		if (val && jQuery( this ).hasClass("formatted-value")) {
			val = removeComma(val);
		}
		// Custom Part End

		if ( Array.isArray( val ) ) {
			return jQuery.map( val, function( val ) {
				return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
			} );
		}

		return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
	} ).get();
};

// 対象フォーム内のname属性を取得しオブジェクトを返す
$.fn.serializeObject = function() {
	var object = {};
	var array = this.serializeArray();
	$.each(array, function() {
		if (object[this.name] !== undefined) {
			if (!object[this.name].push) {
				object[this.name] = [ object[this.name] ];
			}
			object[this.name].push($.trim(this.value) || '');
		} else {
			object[this.name] = $.trim(this.value) || '';
		}
	});
	return object;
};

// 対象フォーム内のinput,selectタグの値を取得しオブジェクトを返す(disableも対象)
$.fn.serializeValue = function() {
	var object = {};
	$(this).find('input,select').each(function(i, elem) {
		var $elem = $(elem);
		var name = $elem.attr('name');
		if (name === undefined) {
			return true; // continue
		}
		var value = $.trim($elem.val());
		if (value && $elem.hasClass("formatted-value")) {
			value = removeComma(value);
		}
		if (object[name] !== undefined) {
			if (!object[name].push) {
				object[name] = [ object[name] ];
			}
			object[name].push(value || '');
		} else {
			object[name] = value || '';
		}
	});
	return object;
};
	
// 対象フォーム内の入力情報をオブジェクトを返す(disableも対象。ラジオ、チェックボックスは選択されていればvalueを、されていなければ空白を返す)
$.fn.serializeInputValue = function() {
	var object = {};
	$(this).find('input,select,textarea').each(function(i, elem) {
		var $elem = $(elem);
		var name = $elem.attr('name');
		if (name === undefined) {
			return true; // continue
		}

		var value = $.trim($elem.val());
		if (value && $elem.hasClass("formatted-value")) {
			value = removeComma(value);
		}

		var tag = $elem.prop("tagName"); 
		if (tag == "select" || tag == 'textarea'){
			object[name] = value || '';
			return true; // continue
		}
		var type = $elem.attr('type');
		
		//console.log(type);
		
		if (type == "radio"){
			if (object[name] === undefined) {
				object[name] = '';
			}
			if ($elem.prop('checked')){
				object[name] = value || '';
			}
			return true; // continue
		}
		if (type == "checkbox"){
			if ($elem.prop('checked')){
				object[name] = value || '';
			}else{
				object[name] = '';
			}
			return true; // continue
		}
		
		//console.log('end');
		
		object[name] = value || '';
	});
	return object;
};
	
/**
 * 3桁カンマ区切り
 * 
 * @param {number} val 処理対象数値
 * @return {string} 処理適用後文字列
 */
function cngComma(val) {
	if (val == null || val == "") {
		return "0";
	}
	var num = String(val);
	return num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

/**
 * 本日日付取得YYYY/MM/DD
 * 
 * @return {string} yyyy/mm/dd 形式の本日日付文字列
 */
function getNowData() {
	var dateAttr = new Date();
	var year = dateAttr.getFullYear();
	var month = dateAttr.getMonth() + 1;
	var date = dateAttr.getDate();
	var baseData = year + '/' + month + '/' + date;
	return baseData;
}

/**
 * parseJSON時改行コードを変換
 * 
 * @param {string} str 処理対象数値
 * @return {string} 処理適用後文字列
 */
function jsonEscape(str) {
	return str.replace(/(\r\n)/g, '\\n');
}

/**
 * class="boxContainer"の 高さを自動指定
 * 
 * @param {string} formid form 情報
 */
function heightAdjust(formid) {
	$(formid).each(function(i, box) {
		var maxHeight = 0;
		$(box).find('.boxContainer').each(function() {
			if ($(this).height() > maxHeight)
				maxHeight = $(this).height();
		});
		$(box).find('.boxContainer').height(maxHeight);
	});
}

/**
 * ランダム文字列生成(セッションキーに使用)
 * 
 * @return {string} ランダム文字列
 */
function randomKey() {
	// 生成する文字列の長さ
	var l = 8;
	// 生成する文字列に含める文字セット
	var c = "abcdefghijklmnopqrstuvwxyz0123456789";
	var cl = c.length;
	var r = "";
	for ( var i = 0; i < l; i++) {
		r += c[Math.floor(Math.random() * cl)];
	}
	return r;
}
/**
 * 100文字orセルに入るまで表示し、それ以上は省略してツールチップを付与
 * 
 * @param {Object} obj 対象オブジェクト（表示箇所）
 * @param {String} title 表示文字列
 * @param {Boolean} nowrap 折り返さない
 */
function tdCompact(obj, title, nowrap) {
	if (nowrap) {
		obj.append('<strong title=""></strong>');
		obj.find('strong').attr('title', title);
		obj.find('strong').text(title);
		obj.addClass('td-compact');
	} else if (title.length > 100) {
		obj.append('<strong title=""></strong>');
		obj.find('strong').attr('title', title);
		obj.find('strong').text(title.substr(0, 100) + '...');
	} else {
		obj.text(title);
	}
}

/**
 * ファイル名(ファイルパス)から拡張子を取得
 * 
 * @param {string} fileName ファイル名(ファイルパス)
 * @return {string} 拡張子
 */
function getFileExtension(fileName) {
	// ※二重拡張子などは考慮していません
	var m = fileName.match(/.*(?:\.([^.]+$))/);
	if(m&&m.length>1){
		return m[1].toLowerCase();
	}else{
		return "";
	}
}

/**
 * CSV作成
 * 
 * @param {Array} data CSVの元になるデータ（DBから返却された配列データ）
 * @param {String} csvName 出力するCSVファイル名
 */
function createCsv(data, csvName) {
	// データを文字列に変換
	var jsonToCsv = function (json) {
		var csvstr = '\ufeff';	//BOM付き
		var delimiter = ",";	//カンマ区切り
	    var header = Object.keys(json[0]).join(delimiter).toUpperCase() + "\r\n";
	    var body = json.map(function(d){
	        return Object.keys(d).map(function(key) {
	        	if(typeof d[key] == 'string') {
	        		var enclosingFlg = false;
		        	if(d[key].indexOf('"') >= 0) {
		        		d[key] = d[key].replaceAll('"','""');
		        		enclosingFlg = true;
		        	}
		        	if(d[key].indexOf(',') >= 0) {
		        		enclosingFlg = true;
		        	}
		        	if(d[key].indexOf('\r\n') >= 0) {
		        		enclosingFlg = true;
		        	}
		        	if(d[key].indexOf('\r') >= 0) {
		        		enclosingFlg = true;
		        	}
		        	if(d[key].indexOf('\n') >= 0) {
		        		enclosingFlg = true;
		        	}
		        	if(enclosingFlg) {
		        		d[key] = '"' + d[key] + '"';
		        	}
	        	}
	            return d[key];
	        }).join(delimiter);
	    }).join("\r\n");
	    csvstr += header + body;
	    return csvstr;
	};
	var csv = jsonToCsv(data);
	
	// 文字列をBLOBに変換
    var blob = new Blob([csv], { type: 'text/csv' });
    
    // ダウンロード処理
    if (navigator.appVersion.toString().indexOf('.NET') > 0) {  // IEの場合
      window.navigator.msSaveBlob(blob, csvName);
    } else {  // IE以外
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = csvName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    }
}

/**
 * オブジェクト同士のデープマージ
 * 
 * https://qiita.com/riversun/items/60307d58f9b2f461082a
 */
function mergeDeeply(target, source, opts) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    const isConcatArray = opts && opts.concatArray;
    let result = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        for (const [sourceKey, sourceValue] of Object.entries(source)) {
            const targetValue = target[sourceKey];
            if (isConcatArray && Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                result[sourceKey] = targetValue.concat(...sourceValue);
            }
            else if (isObject(sourceValue) && target.hasOwnProperty(sourceKey)) {
                result[sourceKey] = mergeDeeply(targetValue, sourceValue, opts);
            }
            else {
                Object.assign(result, {[sourceKey]: sourceValue});
            }
        }
    }
    return result;
}

/**
 * ↓のイベントから呼び出す用
 */
function numericFormValidation(input, allowPoint, allowMinus){
	var out = input;

	// カンマ入力はさせない
	out = out.replace(/[，,]/g,"");
	
	// 全半変換
	out = convertWideToHalf(out);
	
	if(allowPoint){		
		if(allowMinus === true){
			out = out.replace(/[^-0-9\.]+/g, '');
		}else{
			out = out.replace(/[^0-9\.]+/g, '');
		}		
	}else{
		out = out.replace(/[^-0-9]+/g, '');	
		
		if(allowMinus === true){
			out = out.replace(/[^-0-9]+/g, '');
		}else{
			out = out.replace(/[^0-9]+/g, '');
		}
	}
	
	return out;
}

/**
 * 検索条件からURLパラメータ設定
 * 
 * @param {Map} whereParam 検索条件マップ
 */
function setUrlParam(whereParam){
	var urlParamStr = "";
	for (let key in whereParam) {
		if(whereParam[key]) {
			if(urlParamStr) urlParamStr += "&";
			urlParamStr += key + "=" + whereParam[key];
		}
	}
	window.history.replaceState(null,null,window.location.pathname + '?' + urlParamStr);
}

/**
 * 全角数字を半角数字へ変換
 */
var convertWideToHalf = function (value) {
    if (!value) {
        return "";
    }
    return value.replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/[。．]/g, '.').replace(/[-－﹣−‐⁃‑‒–—﹘―⎯⏤ーｰ─━]/g, '-');
};

/**
 * 数値カンマ付与関数
 */
var addComma = function(value) {	
	// 入力値をピリオドで分割して配列にする
    var s = String(value).split('.');

    // 整数部が空欄または、配列の要素が2より多い場合は元の入力値を返す
    if(s[0] ==="" || s.length > 2){
    	return value;
    }
    var ret = String(parseInt(s[0])).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');

    if (s.length == 2 && s[1].length > 0 && s[0].length > 0  ) {
        ret += '.' + s[1];
    }

    return ret;
};

/**
 * カンマ除去関数
 */
var removeComma = function(value) {
	if (typeof value != "undefined" && value != null) {
		return String(value).split(',').join('');
	} else {
		return "0";
	}
};

/**
 * 数値項目入力チェック
 */
function chkInputNumOnly(){
	let ret = [];
	$('.num-only').each(function(idx, elm){
		let val = elm.value;
		val = val.replaceAll(" ","");
		val = val.replaceAll("　","");
		if ($(elm).hasClass("formatted-value")) {
			val = removeComma(val);
		}
		val = convertWideToHalf(val);
		if(val != "" && !$.isNumeric(val)) {
			ret.push(elm);
		}
	});
	return ret;
}

/**
 * 自然数項目入力チェック
 */
function chkInputNatOnly(){
	let ret = [];
	$('.nat-only').each(function(idx, elm){
		let val = elm.value;
		val = val.replaceAll(" ","");
		val = val.replaceAll("　","");
		if ($(elm).hasClass("formatted-value")) {
			val = removeComma(val);
		}
		val = convertWideToHalf(val);
		if(val != ""){
			if(!val.match(/^[0-9]+$/)) {
				ret.push(elm);
			} else if(val != "0" && val.match(/^0/)) {
				ret.push(elm);
			}
		}
	});
	return ret;
}

/**
 * スペース入力チェック（数値項目）
 */
function chkInputSpace(){
	let ret = [];
	$('.num-only, .nat-only').each(function(idx, elm){
		let val = elm.value;
		let val2 = val.replaceAll(" ","");
		val2 = val2.replaceAll("　","");
		if(val != val2) {
			ret.push(elm);
		}
	});
	return ret;
}

/**
 * INGEN方式テキスト
 */
function compactFullText(str) {
	return '<input type="text" class="compact-full-text imui-text-readonly" value="' + str + '" tabindex="-1" readonly />';
}


$(function() {
	// カレンダーチェック
	$(document).on("focusout", "input:not([readonly]).imui-calendar", function() {
		if (this.value.match(/^[0-9]{8}$/)) {
			var y = this.value.slice(0, 4);
			var m = this.value.slice(4, 6);
			var d = this.value.slice(6, 8);
		
			var date = new Date(y,m-1,d);
			if(date.getFullYear() != y || date.getMonth() != m - 1 || date.getDate() != d){
			   	this.value = "";
			} else {
			   	this.value = y + "/" + m + "/" + d;
			}
			$(this).trigger("change");
		} else if (this.value.match(/^[0-9]{4}\/[0-9]{1,2}\/[0-9]{1,2}$/)) {
			var values = this.value.split("/");
			var y = Number.parseInt(values[0], 10);
			var m = Number.parseInt(values[1], 10);
			var d = Number.parseInt(values[2], 10);

			var date = new Date(y,m-1,d);
			if(date.getFullYear() != y || date.getMonth() != m - 1 || date.getDate() != d){
			   	this.value = "";
				$(this).trigger("change");
			} else {
				var formatedValue = String(y) + "/" + ('0' + String(m)).slice(-2) + "/" + ('0' + String(d)).slice(-2);
			   	if (this.value != formatedValue) {
			   		this.value = formatedValue;
					$(this).trigger("change");
				}
			}
		} else {
			this.value = "";
			$(this).trigger("change");
		}
	});

	// 数値入力項目
	$(document).on("focusin", "input:not([readonly]).nat-only, input:not([readonly]).num-only", function() {
		var $this =$(this);
		var result = removeComma($this.val());
		if ($this.val() != result) {
			$this.val(result);
		}
		$this.removeClass("formatted-value");
	}).on("focusout", "input.nat-only, input.num-only", function() {
		
		$(this).trigger("compositionend");
		
		var $this =$(this);
		if ($this.hasClass("formatted-value")) {
			return;
		}
		
		var result = addComma(convertWideToHalf(removeComma($this.val())));
		if ($this.val() != result) {
			$this.val(result);
		}
		$this.addClass("formatted-value");
		
		$(this).trigger("change");	
		
	});
});

var initializeNumFormat = function() {
	$("input.nat-only, input.num-only").trigger("focusout");
};


var isProcessed = false;

$(function() {
	// 符号のチェックや置換はここでは行わない	
	$(document).on("keypress",".text-number",function(e) {
		// Undo/Redo を後続で処理するようにする(Firefox/Chrome)
        if(!e.ctrlKey && !e.altKey){
            isProcessed = true;
        }
    }).on("keydown",".text-number",function(e) {
    	// Undo/Redo
        if(e.ctrlKey && (e.keyCode == 89 || e.keyCode == 90)){
            isProcessed = true;
        }
        if(e.keyCode == 229){
            // IME 入力を キャンセル(IE/Chrome)
            return false;
        }
    }).on("compositionstart",".text-number",function(e) {
    	isProcessed = false;
    }).on("compositionupdate",".text-number",function(e) {
    	isProcessed = false;
    }).on("compositionend" ,".text-number", function(e){
    	// IME 確定時イベント
    	if($(this).hasClass("allow-minus")){
    		var num = numericFormValidation($(this).val(), false, true);
    	}else{
    		var num = numericFormValidation($(this).val(), false, false);
    	}
		$(this).val(num);		        
        isProcessed = false;
    }).on("paste",".text-number",function(e) {
    	isProcessed = true;
    }).on("cut",".text-number",function(e) {
    	isProcessed = true;
    }).on("drop",".text-number",function(e) {
    	isProcessed = true;
    }).on("input",".text-number",function(e) {
        if(isProcessed){
        	if($(this).hasClass("allow-minus")){
        		var num = numericFormValidation($(this).val(), false, true);
        	}else{
        		var num = numericFormValidation($(this).val(), false, false);
        	}
			$(this).val(num);		        
            isProcessed = false;
        }
    });
	
	// 数値のみ入力（小数点も可能)

	$(document).on("keypress",".text-decimal",function(e) {
		// Undo/Redo を後続で処理するようにする(Firefox/Chrome)
        if(!e.ctrlKey && !e.altKey){
            isProcessed = true;
        }
    }).on("keydown",".text-decimal",function(e) {
    	// Undo/Redo
        if(e.ctrlKey && (e.keyCode == 89 || e.keyCode == 90)){
            isProcessed = true;
        }
        if(e.keyCode == 229){
            // IME 入力を キャンセル(IE/Chrome)
            return false;
        }
    }).on("compositionstart",".text-decimal",function(e) {
    	isProcessed = false;
    }).on("compositionupdate",".text-decimal",function(e) {
    	isProcessed = false;
    }).on("compositionend" ,".text-decimal", function(e){
    	// IME 確定時イベント
    	if($(this).hasClass("allow-minus")){
    		var num = numericFormValidation($(this).val(), true, true);
    	}else{
    		var num = numericFormValidation($(this).val(), true, false);
    	}
		$(this).val(num);		        
        isProcessed = false;
    }).on("paste",".text-decimal",function(e) {
    	isProcessed = true;
    }).on("cut",".text-decimal",function(e) {
    	isProcessed = true;
    }).on("drop",".text-decimal",function(e) {
    	isProcessed = true;
    }).on("input",".text-decimal",function(e) {
        if(isProcessed){
        	if($(this).hasClass("allow-minus")){
        		var num = numericFormValidation($(this).val(), true, true);
        	}else{
        		var num = numericFormValidation($(this).val(), true, false);
        	}
			$(this).val(num);		        
            isProcessed = false;
        }
    });
});

// datepickerからの日付選択時のchangeイベント発火
$(function() {
	window.onSelectCalender = function(dateText, inst){
		$("#"+inst.id).change();
	};
});

// ファイルダウンロード
function fileDownload(filePath, fileName) {
	var url = 'lo/contents/screen/pub_file_dl?filePath=' + filePath;
	if(fileName){
		url += '&fileName=' + encodeURIComponent(fileName);
	}
	var downloada = document.createElement("a");
	document.body.appendChild(downloada);
	downloada.download = '';
	downloada.href = url;
	downloada.click();
	downloada.remove();
	URL.revokeObjectURL(url);
}

// イメージをアイコンに変換
function changeImgToIcon(elm, name) {
	var ext = getFileExtension(name);
	var fas = "";
	if(ext == "pdf") {
		fas = '<i class="far fa-file-pdf fa-9x mb-2 text-danger"></i> ';
	} else {
		fas = '<i class="far fa-image fa-9x mb-2 text-info"></i> ';
	}
	elm.parentNode.innerHTML = fas;
}

// イメージをラベルに変換
function changeImgToName(elm, name) {
	var ext = getFileExtension(name);
	var fas = "";
	if(ext == "pdf") {
		fas = '<i class="fas fa-file-pdf text-danger"></i> ';
	} else {
		fas = '<i class="fas fa-image text-info"></i> ';
	}
	elm.parentNode.innerHTML = fas + name;
}

// imuiIndicator表示
function showIndicator() {
	if($(".imui-indicator-bg").length == 0) {
		var addElem = '<div class="imui-indicator-bg" tabindex="-1" style="z-index: 9999999; position: absolute; color: rgb(255, 255, 255); text-align: center; opacity: 0.75; background-color: rgb(0, 0, 0); height:' + $("body").height()+20 + 'px; width: 100%; left: 0px; top: 0px; display: none;"><div class="imui-indicator imui-indicator-fg" style="position: fixed; top: 50%; left: 50%; margin-top: -18px; margin-left: -66px;"><span>読み込み中...</span><img src="ui/images/loadinfo.net.gif" style="margin: 6px;"></div></div>';
		$('body').append(addElem);
	}
	no_scroll();
	no_keydown();
	document.activeElement.blur();	//フォーカス外す
	$(".imui-indicator-bg").show();
}

// imuiIndicator非表示
function hideIndicator() {
	return_scroll();
	return_keydown();
	$(".imui-indicator-bg").hide();
}

// キー押下禁止
function no_keydown() {
	document.addEventListener("keydown", event_prevent);
}
// キー押下禁止解除
function return_keydown() {
    // PCでのスクロール禁止解除
    document.removeEventListener("keydown", event_prevent);
}
// スクロール禁止
function no_scroll() {
    // PCでのスクロール禁止
    document.addEventListener("mousewheel", event_prevent, { passive: false });
    // スマホでのタッチ操作でのスクロール禁止
    document.addEventListener("touchmove", event_prevent, { passive: false });
}
// スクロール禁止解除
function return_scroll() {
    // PCでのスクロール禁止解除
    document.removeEventListener("mousewheel", event_prevent, { passive: false });
    // スマホでのタッチ操作でのスクロール禁止解除
    document.removeEventListener('touchmove', event_prevent, { passive: false });
}

// イベント発火阻害
function event_prevent(event) {
    event.preventDefault();
}

// ページ先頭に戻る
function moveToPageTop(speed) {
	speed = speed ? speed : 0;	// 戻るまでにかかる時間
    $("body, html").animate({scrollTop:0}, speed, "swing");
    return false;
}

var TabulatorUtil = function(tableId, columns, rowIndex, initialSort, extendOptions) {

    var pagination = {
    	"page_size":"Page Size", //label for the page size select element
        "page_title":"Show Page",//tooltip text for the numeric page button, appears in front of the page number (eg. "Show Page" will result in a tool tip of "Show Page 1" on the page 1 button)
        "first":"<<", //text for the first page button
        "first_title":"First Page", //tooltip text for the first page button
        "last":">>",
        "last_title":"Last Page",
        "prev":"<",
        "prev_title":"Prev Page",
        "next":">",
        "next_title":"Next Page",
        "all":"All"
    };

    var synchronizeFromTabulatorScrollWidthToHeaderScrollWidth = function() {
        $("#scrollbar").width($(domId + " .tabulator-tableHolder").outerWidth(true));
    };
    var synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth = function() {
		$("#scroll-inner").width($(domId + " .tabulator-tableHolder .tabulator-table .tabulator-row").outerWidth(true));
    };

    if (initialSort) {
    	if (Array.isArray(initialSort) == false) {
    		initialSort = [initialSort];
    	}
    } else {
    	initialSort = [];
    }

    var options = {
		index: rowIndex,
		columns: columns,
		pagination: "local",
		layout:"fitDataStretch",
		paginationSize: 50,
		movableColumns: true, //enable user movable columns　http://tabulator.info/docs/4.9/move
		columnHeaderSortMulti: true, // Multi Column Sorting http://tabulator.info/docs/4.9/sort#header
		persistence:{
			columns: ["width"] //persist columns http://tabulator.info/docs/4.9/persist#columns
		},
		persistenceID: tableId.replaceAll('#', ''), //id string, can only be numbers, letters, hyphens and underscores. http://tabulator.info/docs/4.9/persist#id
		scrollHorizontal: function(left) {
	        //left - the current horizontal scroll position
	        console.group("scrollHorizontal");
	        console.log(left);
	        $("#scrollbar").scrollLeft(left);
	        console.groupEnd("scrollHorizontal");
	    },
	    tableBuilding: function(){
	        console.log("tableBuilding");
	    },
	    tableBuilt: function(){
	        console.log("tableBuilt");
	    },
	    renderStarted: function() {
	        console.log("renderStarted");
	    },
	    renderComplete: function() {
	        console.log("renderComplete");
	    },
	    pageLoaded: function(pageno) {
	    	//pageno - the number of the loaded page
	        console.group("pageLoaded");
	        console.log(pageno);
	        synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth();
	        console.groupEnd("pageLoaded");
	    },
	    dataLoading: function(data){
	        //data - the data loading into the table
	        console.group("dataLoading");
	        console.log(data);
	        console.groupEnd("dataLoading");
	    },
	    dataLoaded: function(data){
	        //data - all data loaded into the table
	        console.group("dataLoaded");
	        console.log(data);
	        synchronizeFromTabulatorScrollWidthToHeaderScrollWidth();
	        synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth();
	        console.groupEnd("dataLoaded");
	    },
	    dataChanged: function(data){
	        //data - the updated table data
	        console.group("dataChanged");
	        console.log(data);
	        console.groupEnd("dataChanged");
	    },
	    rowAdded: function(row){
	        //row - row component
	        console.group("rowAdded");
	        console.log(row);
	        console.groupEnd("rowAdded");
	    },
	    rowUpdated: function(row){
	        //row - row component
	        console.group("rowUpdated");
	        console.log(row);
	        console.groupEnd("rowUpdated");
	    },
	    rowDeleted: function(row){
	        //row - row component
	        console.group("rowDeleted");
	        console.log(row);
	        console.groupEnd("rowDeleted");
	    },
	    rowMoved: function(row){
	        //row - row component
	        console.group("rowMoved");
	        console.log(row);
	        console.groupEnd("rowMoved");
		},
	    rowResized: function(row){
	        //row - row component of the resized row
	        console.group("rowResized");
	        console.log(row);
	        console.groupEnd("rowResized");
		},
		columnMoved: function(column, columns){
		    //column - column component of the moved column
		    //columns- array of columns in new order
	        console.group("columnMoved");
	        console.log(column);
	        console.log(columns);
	        console.groupEnd("columnMoved");
		},
		columnResized: function(column){
		    //column - column component of the resized column
	        console.group("columnResized");
	        console.log(column);
	        synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth();
	        console.groupEnd("columnResized");
		},
		columnVisibilityChanged: function(column, visible){
		    //column - column component
		    //visible - is column visible (true = visible, false = hidden)
	        console.group("columnVisibilityChanged");
	        console.log(column);
	        console.log(visible);
	        synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth();
	        console.groupEnd("columnVisibilityChanged");
		},
		columnTitleChanged: function(column){
		    //column - column component
	        console.group("columnTitleChanged");
	        console.log(column);
	        console.groupEnd("columnTitleChanged");
	    },
	    initialSort: initialSort.reverse(),
	    langs:{
	        "ja-jp":{
	        	pagination: pagination
	        }
		}
	};

    if (extendOptions) {
    	options = mergeDeeply(options, extendOptions);
    }

    var domId = tableId;
    var tabulator = new Tabulator(tableId, options);
	tabulator.setLocale("ja-jp");

    var calculateMaxTableHeight = function() {
    	var zoom = $("body").css("zoom");
    	
    	var screenSize = document.documentElement.clientHeight /zoom;    	

		var tableHeight = screenSize 
		- $("#page-upper-part").offset().top		
		- document.getElementById("page-upper-part").clientHeight
		- $("#page-footer-part .bne-color-band.row").outerHeight() 
		- $("#page-footer-part .intra-mart.row").outerHeight();
		
		if(tableHeight < 300){
			tableHeight = 300;
		}
		
		
		return tableHeight;
    };

	$(document).on("click", "#close-sidebar, #show-sidebar", function(){
		synchronizeFromTabulatorScrollWidthToHeaderScrollWidth();
	});
	$("#scrollbar").scroll(function() {
        $(domId + " .tabulator-tableHolder").scrollLeft($("#scrollbar").scrollLeft());
    });

	$(document).on("resizeTabulator", function(){
		var tableHeight = calculateMaxTableHeight();
		// http://tabulator.info/docs/4.9/layout#redraw
		tabulator.setHeight(tableHeight);
	});
	
	$(window).resize(function() {
		$(document).trigger("resizeTabulator");
	});

	var setData = function(data) {
		tabulator.setData(data).then(function(){
		    //run code after table has been successfuly updated
	        console.log("setData promise");
			synchronizeFromTabulatorScrollWidthToHeaderScrollWidth();
	        synchronizeFromTabulatorInnerScrollWidthToHeaderInnerScrollWidth();
		});
	};

	var getData = function() {
		return tabulator.getData();
	};

	var getColumn = function(showColumnName) {
		return tabulator.getColumn(showColumnName);
	};

	var getColumns = function() {
		return tabulator.getColumns();
	};

	var getColumnDefinitions = function() {
		return tabulator.getColumnDefinitions();
	};
	
	var setPageSize = function(pageSize) {
		tabulator.setPageSize(pageSize);
	};

	var getPageSize = function(){
		return tabulator.getPageSize();
	};

    return {
    	tabulator: tabulator
    	, setData: setData
    	, getData: getData
    	, getColumn: getColumn
    	, getColumns: getColumns
    	, getColumnDefinitions: getColumnDefinitions
    	, setPageSize: setPageSize
    };
    
};

$(function() {
	$(document).on("click", ".popup .close-btn", function() {

		var $popup = $(this).closest(".popup");
		$popup.trigger("initializePopup");

	});
});

// dataTableのdata文字列をエスケープ（renderするfunction内で使用）
var textRenderer = $.fn.dataTable ? $.fn.dataTable.render.text().display : null;

