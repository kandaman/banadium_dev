
/**
 * @fileoverview 新企画詳細画面.
 *
 * IM-Workflow用の新企画詳細画面です。
 *
 * @version $Revision$
 * @author 83002381
 * @since 1.0
 */


/**
 * ワークフローパラメータオブジェクト。
 * @type Object
 */
var $data = {};

/**
 * フォーム値格納オブジェクト。
 * @type Object
 */
var $form = {
    denNo : '',
    userame : '',
    userbusho : ''

};

function init(request) {


    var accountContext = Contexts.getAccountContext();
    
    // ワークフローに関するパラメータを保持します
    $data = {
        imwGroupId              : request.imwGroupId,           //グループ ID 
        imwUserCode             : request.imwUserCode,          //処理者CD
        imwPageType             : request.imwPageType,          //画面種別
        imwUserDataId           : request.imwUserDataId,        //ユーザデータ ID
        imwSystemMatterId       : request.imwSystemMatterId,    //システム案件ID
        imwNodeId               : request.imwNodeId,            //ノード ID 
        imwArriveType           : request.imwArriveType,        //到達種別
        imwAuthUserCode         : '',                           //権限者CD 
        imwApplyBaseDate        : request.imwApplyBaseDate,     //申請基準日
        imwContentsId           : request.imwContentsId,        //コンテンツ ID
        imwContentsVersionId    : request.imwContentsVersionId, //コンテンツバージョン ID 
        imwRouteId              : request.imwRouteId,           //ルート ID
        imwRouteVersionId       : request.imwRouteVersionId,    //ルートバージョン ID
        imwFlowId               : request.imwFlowId,            //フローID 
        imwFlowVersionId        : request.imwFlowVersionId,     //フローバージョンID
        imwCallOriginalPagePath : request.imwCallOriginalPagePath, //呼出元パラメータ
        imwCallOriginalParams   : request.imwCallOriginalParams    //呼出元ページパス
    };
    
    // 権限者コードを設定します.
    // 起票または再申請(案件操作で処理対象者の再展開を行う)の場合は、
    // リクエストパラメータの権限者コードが複数渡される場合があります.
    // その際はimwAuthUserCodeに適切な権限者コードを設定する必要があります.
    var imwAuthUserCodeList = request.getParameterValues('imwAuthUserCode');
    if(isArray(imwAuthUserCodeList) && imwAuthUserCodeList.length == 1) {
        $data.imwAuthUserCode = imwAuthUserCodeList[0];
    }
    //FIXME 必要に応じて処理を実装してください。
    //$form = getUserData(accountContext.loginGroupId, $data.imwUserDataId);
}

/**
 * データを取得します。
 * @param {Array}  検査する配列
 * @param {Object} 検査対象値
 * @returns {boolean} 検査結果
 */
function getUserData(groupId, id) {
    // FIXME 必要に応じて処理を実装してください。
    // var db = new TenantDatabase();
    // var result = db.sekect('cactus_table');
    // return result.data[0];
    return null;
}

/**
 * 配列に指定値が含まれているか検査します。
 * @param {Array}  検査する配列
 * @param {Object} 検査対象値
 * @returns {boolean} 検査結果
 */
function _contains(array, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}
