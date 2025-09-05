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
	Debug.print( "----- approveNodeProcess.js - execute -----" );
    //Debug.console(parameter);
	
	Constant.load("lo/common_libs/lo_const");

    //送信先アドレス取得
    var address =Content.executeFunction("lo/common_libs/lo_send_mail",
    	"getAddressExecUsers",parameter.systemMatterId);
    
    //メールid 処理依頼
    var mailid = Constant.LO_MAIL_ID_PROC; 
    // 前ノードが申請(ライセンシーから提出)なら　メールid 提出通知
    if (parameter.preNodeId == Constant.LO_NODE_APPLY){
    	mailid = Constant.LO_MAIL_ID_SUBMIT; 
    }
    
    // 送信用パラメータ作成
    var param = {
    	ticket_id : parameter.matterName, // 文書番号
    	mail_id : mailid,            //メールid
    	to_address : address,                       //送信先アドレス
    	comment : parameter.preNodeProcessComment,      //前処理のコメント
    	execUserCd : parameter.preNodeExecUserCd          //前処理の実行者コード
    }
    // 送信
    var res = Content.executeFunction("lo/common_libs/lo_send_mail","sedMailExce",param);

    var result = {
        "resultFlag" : true,
        "message"    : "",
        "data"       : null
    	};
    return result;
}