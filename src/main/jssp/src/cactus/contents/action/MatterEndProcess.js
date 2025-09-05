//==============================================================================
//    到達処理プログラム テンプレート
//
//        【 入力 】 parameter                         : ワークフローパラメータオブジェクト
//                   parameter.loginGroupId            : ログイングループID
//                   parameter.localeId                : ロケールID
//                   parameter.targetLocales           : ターゲットロケールID
//                   parameter.contentsId              : コンテンツID
//                   parameter.contentsVersionId       : コンテンツバージョンID
//                   parameter.routeId                 : ルートID
//                   parameter.routeVersionId          : ルートバージョンID
//                   parameter.flowId                  : フローID
//                   parameter.flowVersionId           : フローバージョンID
//                   parameter.applyBaseDate           : 申請基準日
//                   parameter.processDate             : 処理日/到達日
//                   parameter.systemMatterId          : システム案件ID
//                   parameter.userDataId              : ユーザデータID
//                   parameter.matterName              : 案件名
//                   parameter.matterNumber            : 案件番号
//                   parameter.priorityLevel           : 優先度
//                   parameter.parameter               : パラメータ
//                   parameter.nodeId                  : ノードID
//                   parameter.actFlag                 : 代理フラグ
//                   parameter.preNodeId               : 前ノードID
//                   parameter.preNodeAuthUserCd       : 前ノード処理権限者コード
//                   parameter.preNodeExecUserCd       : 前ノード処理実行者コード
//                   parameter.preNodeResultStatus     : 前ノード処理結果ステータス
//                   parameter.preNodeAuthCompanyCode  : 前ノード権限会社コード
//                   parameter.preNodeAuthOrgzSetCode  : 前ノード権限組織セットコード
//                   parameter.preNodeAuthOrgzCode     : 前ノード権限組織コード
//                   parameter.preNodeProcessComment   : 前ノード処理コメント
//                   parameter.mailIds                 : メールテンプレートID
//                   parameter.replaceMap              : メール置換文字列情報
//
//        【返却値】 result.resultFlag                 : 結果フラグ     [true:成功/false:失敗]
//                   result.message                    : 結果メッセージ [結果フラグが失敗の場合のみ]
//                   result.data                       : メール送信可否 [true:送信可能 / false:送信不可]
//
//        【 詳細 】 このプログラム中で、データベースの登録／更新／削除処理を行
//                   う場合は、独自にDBトランザクション制御を行ってください。
//
//==============================================================================
function execute(parameter) {
	//Debug.print( "----- MatterEndProcess.js - execute -----" );
    //Debug.console(parameter);
    var res = false;
	Transaction.begin(function() { // この関数内でのみ、トランザクションが張られます
	//Debug.print( "----- torann -----" );
		// ステータス区分、登録結果更新
		//res = Content.executeFunction("cactus/common_libs/common_fnction","updateMatterEnd",parameter.lastExecUserCd,parameter.userDataId);
		res = Content.executeFunction("cactus/common_libs/common_fnction","updateMatterEnd",parameter.preNodeExecUserCd,parameter.userDataId);
		
		try {
			// メールの送信
			var driver = new Packages.imart.mail.WorkflowMailController();
			driver.storeMail("5",parameter.userDataId,"","");
		} catch (e) {
			res = false;
		}
	});
	

    var result = {
        "resultFlag" : res,
        "message"    : "",
        "data"       : null
    	};
    return result;
}