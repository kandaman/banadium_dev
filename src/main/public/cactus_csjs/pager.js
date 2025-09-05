/* ページャーを作成する
 * objId：ページャーを挿入するタグのid (divタグを想定) 
 * totalPage：ページ総数
 * maxPage：最大表示ページ数
 */
function clreatePager(objId,totalPage,maxPage) {

	$('#'+objId).empty();

	if (totalPage < 2){
		return;
	}
	if (totalPage < maxPage){
		maxPage = totalPage;
	}
	var main = $('<ul class="imui_pager"></ul>');
	main.append('<li class="imui_pager_first ui-state-default" page="1"><a href="javascript:void(0)" ><img src="cactus_csjs/images/first_page.png" alt="最初へ"></a></li>')
	main.append('<li class="imui_pager_prev ui-state-default"　page="1" ><a href="javascript:void(0)" ><img src="cactus_csjs/images/pre_page.png" alt="前へ"></a></li>')
	//main.append('<li class="imui_pager_first ui-state-default"><a href="1" style="pointer-events: none;cursor: default;" >最初へ</a></li>')
	//main.append('<li class="imui_pager_prev ui-state-default"　><a href="1" style="pointer-events: none;cursor: default;">前へ</a></li>')

	for (var i=1; i <= maxPage; i++) {
		var row = '<li class="imui_pager_item ui-state-default" page="'+ i +'"><a href="javascript:void(0)">'+ i +'</a></li>'
		main.append(row);
	}
	main.append('<li class="imui_pager_next ui-state-default" page="2"><a href="javascript:void(0)"><img src="cactus_csjs/images/next_page.png" alt="次へ"></a></li>')
	main.append('<li class="imui_pager_last ui-state-default" page="'+ totalPage +'"><a href="javascript:void(0)"><img src="cactus_csjs/images/last_page.png" alt="最後へ"></a></li>')
	main.appendTo('#'+objId);
	
	// 一ページ目を指定
	onPagerMove(objId,1);
}
/*
 function clreatePager(objId,totalPage,maxPage) {

	$('#'+objId).empty();

	if (totalPage < 2){
		return;
	}
	if (totalPage < maxPage){
		maxPage = totalPage;
	}

	var main = $('<ul class="imui_pager"></ul>');
	main.append('<li class="imui_pager_first ui-state-default"　style="display: none;"><a href="1" >最初へ</a></li>')
	main.append('<li class="imui_pager_prev ui-state-default"　style="display: none;"><a href="1" >前へ</a></li>')
	//main.append('<li class="imui_pager_first ui-state-default"><a href="1" style="pointer-events: none;cursor: default;" >最初へ</a></li>')
	//main.append('<li class="imui_pager_prev ui-state-default"　><a href="1" style="pointer-events: none;cursor: default;">前へ</a></li>')

	for (var i=1; i <= maxPage; i++) {
		var row = '<li class="imui_pager_item ui-state-default"><a href="'+ i +'">'+ i +'</a></li>'
		main.append(row);
	}
	main.append('<li class="imui_pager_next ui-state-default"><a href="2">次へ</a></li>')
	main.append('<li class="imui_pager_last ui-state-default"><a href="'+ totalPage +'">最後へ</a></li>')
	main.appendTo('#'+objId);
	
	// 一ページ目を指定
	onPagerMove(objId,1);
}*/

/* ページ移動 処理
 * objId:対象ページャのid
 * selectPage:選択されたページ番号
 */
function onPagerMove(objId,selectPage) {

	var nowPage = Number(selectPage);
	
	// ページ表示件数
	var size = $('#'+objId).find('.imui_pager_item').length;
	// 最大ページ取得
	//var totalPage = Number($('#'+objId).find('.imui_pager_last').children('a').attr("href"));
	var totalPage = Number($('#'+objId).find('.imui_pager_last').attr("page"));

	// 真ん中のページ(表示件数/２)
    var herf = Math.floor(size/2);
    // 開始ページ
    var startPg = 1;
    if ((nowPage - herf) <= 1){
    	startPg = 1;
    }else if((nowPage + herf) >= totalPage) {
    	startPg = totalPage - size + 1;
    }else{
    	startPg = (nowPage - herf);
    }
	
	// 番号の振り直し
    $('#'+objId).find('.imui_pager_item').each(function(i, elem) {
    	var child = $(elem).children('a');
    	$(elem).attr("page", startPg + i )
    	//child.attr("href", startPg + i )
    	child.text(startPg + i );
    });	
	
	//カレントページ設定
    $('#'+objId).find('.ui-state-active').removeClass('ui-state-active'); // 選択状態のボタンを解除
    $('#'+objId).find('.imui_pager_item').eq(nowPage - startPg).addClass('ui-state-active'); // 選択されたボタンに選択中のクラスを追加
	 
	//前次ボタンの設定
    //$('#'+objId).find('.imui_pager_next').children('a').attr("href", nowPage == totalPage? totalPage: nowPage + 1 );
    //$('#'+objId).find('.imui_pager_prev').children('a').attr("href", nowPage == 1? 1: nowPage - 1 );
    $('#'+objId).find('.imui_pager_next').attr("page", nowPage == totalPage? totalPage: nowPage + 1 );
    $('#'+objId).find('.imui_pager_prev').attr("page", nowPage == 1? 1: nowPage - 1 );
}


/* ページ移動に合わせデータの表示非表示を行う
 * trタグを行数分表示し 残りをひひょじにする
 * objId:データ表示対象のid(table tbodyなど)
 * selectPage:選択されたページ番号
 * maxRow:ページごとの最大行数
 */
// 表示データ
//
function onPagerlistDraw(objId,selectPage,maxRow) {
	// ページと行数で表示するデータを決める
	$('#'+objId).find('tr').hide();
	if (selectPage==1){
		$('#'+objId).find('tr:lt('+ maxRow +')').show();
	}else{
		$('#'+objId).find('tr:gt(' + ((selectPage-1) * maxRow-1) + '):lt('+ maxRow +')').show();
	}
}

// 行をtbodyで行っている場合
function onPagerlistDrawTbody(objId,selectPage,maxRow) {
	// ページと行数で表示するデータを決める
	$('#'+objId).find('tbody').hide();
	if (selectPage==1){
		$('#'+objId).find('tbody:lt('+ maxRow +')').show();
	}else{
		$('#'+objId).find('tbody:gt(' + ((selectPage-1) * maxRow-1) + '):lt('+ maxRow +')').show();
	}
}
