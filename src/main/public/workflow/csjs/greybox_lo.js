
// form の内容を submit して Greybox を表示する
function showGreyBox(form) {
	
    if (imwGreyboxExecutingFlag) {
        // 実行中
        return;
    } else {
        // 実行開始
        setImwGreyboxExecutingFlag(true);
    }
    // SELECT タグの visibility を退避するパッチ
    var objs = AJS.flattenList([AJS.$bytc("object"), AJS.$bytc("select")]);
    AJS.map(objs, function(elm) {
        elm._imw_GB_style_visibility = elm.style.visibility || "";
    });
    // Greybox 表示時にスクロールバーを消すパッチ
    var width1 = document.body.innerWidth || document.body.clientWidth;
    document.body.style.overflow = "hidden";
    var width2 = document.body.innerWidth || document.body.clientWidth;
    if (width1 < width2) {
        var w = document.all ? -6 : 8;
        document.body.style.marginRight = (width2 - width1 + w) + "px";
    }
    var size = GB_getPageSize();

    // edit lo_system lo用のパラメータあれば処理画面のダイアログの大きさを変更
    if (document.getElementById("imwCustomParam") != null){
        var win = GB_showCenter("", "../greybox_blank.html", 700, 1200); // edit lo_system 処理画面のダイアログの大きさを変更
    }else{
        var win = GB_show("", "../greybox_blank.html", size.windowHeight - 6, 700);
    }
    //var win = GB_show("", "../greybox_blank.html", 500, 1700);
    
    GB_form = form;
    // Close を表示しないパッチ
    var cb = document.getElementsByTagName("IFRAME")[0].parentNode.previousSibling;
    cb.innerHTML = "<div style='background-color: #c8c8c8; font-size: 1px; line-height: 1px; height: 3px; width: 706px;'>&nbsp;</div>";
    // BackSpace をキャンセルするパッチ
    if (document.addEventListener) {
        document.addEventListener("keydown", onkeydownGreyBox, false);
        document.addEventListener("keypress", onkeydownGreyBox, false);
    } else {
        document.attachEvent("onkeydown", onkeydownGreyBox);
        document.attachEvent("onkeypress", onkeydownGreyBox);
    }
}