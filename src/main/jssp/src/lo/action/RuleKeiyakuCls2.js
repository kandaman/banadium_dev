//==============================================================================
//    分岐条件／分岐結合処理プログラム テンプレート
//
//        【 入力 】 parameter                   : ワークフローパラメータオブジェクト
//                   parameter.loginGroupId      : ログイングループID
//                   parameter.localeId          : ロケールID
//                   parameter.targetLocales     : ターゲットロケールID
//                   parameter.contentsId        : コンテンツID
//                   parameter.contentsVersionId : コンテンツバージョンID
//                   parameter.routeId           : ルートID
//                   parameter.routeVersionId    : ルートバージョンID
//                   parameter.flowId            : フローID
//                   parameter.flowVersionId     : フローバージョンID
//                   parameter.applyBaseDate     : 申請基準日
//                   parameter.processDate       : 処理日/到達日
//                   parameter.systemMatterId    : システム案件ID
//                   parameter.userDataId        : ユーザデータID
//                   parameter.parameter         : パラメータ
//                   parameter.nodeId            : ノードID
//
//        【返却値】 result.resultFlag           : 結果フラグ     [true:成功/false:失敗]
//                   result.message              : 結果メッセージ [結果フラグが失敗の場合のみ]
//                   result.data                 : ルート遷移可否 [分岐 | true:遷移する/false:遷移しない]
//                                                                [結合 | true:結合する/false:結合しない]
//
//        【 詳細 】 このプログラム中ではDBトランザクションを張らないで下さい。
//
//==============================================================================

//　契約種別・包括判定
function execute(parameter) {
    //Debug.print( "----- RuleCondition1.js - execute -----" );
    //Debug.console(parameter);
    //Debug.print( "----- RuleCondition1.js - execute -----" );

    var result = {
                  "resultFlag" : true,
                  "message"    : "",
                  "data"       : false
                 };

    // 契約種別が2ならtureを返す
    var res = Content.executeFunction("lo/common_libs/lo_common_fnction","getKyodakuBranch",parameter.userDataId);
    if (isNull(res)) {
        result.resultFlag = false;
    } else {
        if (res.keiyaku_cls == "2") {
            result.data = true;
        }
    }

    return result;
}
