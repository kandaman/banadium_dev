/* 
 * 登録・更新系画面の変更を検知、画面遷移時にアラートを表示
 * 
 * 変更検知から除外したいオブジェクトには「ignore-change-trigger」クラスを設定
*/

var isFormChanged = false;

var handlerFormChangeTrigger = function(e){
	// ※returnValue の設定が推奨されているが、現行ブラウザーで表示されることはない
	// ※return の実行によりブラウザー標準の画面遷移警告アラートが表示される。return 値は何でもよさそう
	var returnText = "入力を破棄してもよろしいですか？";
	e.returnValue = returnText;
	return returnText;
};

$(function() {
	$(document).on("change", "input:not(.ignore-change-trigger), textarea:not(.ignore-change-trigger), select:not(.ignore-change-trigger)", function(e){
		if(!isFormChanged){
			// 初回の変更検知時に beforeunload イベントを設置
			$(window).on("beforeunload", handlerFormChangeTrigger);
			isFormChanged = true;	
		}
	});
});

/* submit 時に呼び出し */
function terminateFormChangeTrigger(){
	isFormChanged = false;
	$(window).off("beforeunload", handlerFormChangeTrigger);
}
