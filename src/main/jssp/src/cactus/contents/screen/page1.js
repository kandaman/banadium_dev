

// 申請種別コンボボックス設定
/*var $list_sheetType = [
    {label : '新商品企画申請書',value : 'sksg'},
    {label : '販促物企画申請書',value : 'hksg'},
    {label : 'ダウンロードコンテンツ申請書',value : 'dlsg'}
];*/

// 事業部コンボボックス設定
/*var $list_division = [
    {label : '',value : ''},
    {label : 'NE',value : 'NE'},
    {label : 'CS',value : 'CS'},
    {label : 'AM',value : 'AM'},
    {label : 'LE',value : 'LE'},
    {label : 'SP',value : 'SP'}
];*/

//var $list_division = []

// ラジオボタン選択状態
/*var $radio = {
	 item_dlc_1 : false
	,item_dlc_0 : true
};*/


// フォームデータ
/*var $form = {
	 login_user_cd : ''
	,login_user : ''
	,login_user_busyo : ''
	,tantou_user : ''
	,tantou_busyo : ''
	,item_tantou_user_data : {}
	,item_sheetType :""
	,item_division :''
	,item_itemNameJap :""
	,item_itemNameEng :""
	,item_itemNamepromo :""
	,item_itemNameDL :""
	,matter_number :""
};*/
var $form = {};

// ログインユーザ情報
//var $login_userData={};

function init(request) {
 
	var $data = request.data;

	$form = request.form;

	//$list_division = $form.list_m_jigyobu;
	
	//var logger = Logger.getLogger();
	//logger.info('hoge-nn');
	
	

    // 画面種別毎の分岐処理を設定します。
    switch($data.imwPageType) {
        // 申請
        case '0':
        case '10':
            // ユーザ情報を取得
            /*var ret = Procedure.getUserInfo({"user_cd":$data.imwUserCode});
            if (ret.countRow > 0){
            	var userData = ret.data;
            	$form.login_user = userData[0].user_name + ' ' +userData[0].user_name_eng +'<br>' +userData[0].user_no;
            	$form.login_user_busyo = userData[0].department_inc_name;
            	
            	// jsonで全データを持っておく
            	$form.login_userData = ImJson.toJSONString(userData[0]);
            	
            	// 担当者の初期値にログインユーザを指定
            	$form.tantou_user = $form.login_user;
            	$form.tantou_busyo = $form.login_user_busyo;
            	$form.tantou_user_data = $form.login_userData
            	$form.matter_number = ""
            }*/
            break;
        // 起票
        case '2':
        case '12':
            //FIXME 必要に応じて処理を実装してください。
            break;
        // 一時保存
        case '1':
        case '11':
            //FIXME 必要に応じて処理を実装してください。
            //$form = getUserData(accountContext.loginGroupId, $data.imwUserDataId);
   /*         
			// 申請情報　取得
			var result = Content.executeFunction("cactus/common_libs/common_fnction","getMyApplyUserData",$data.imwUserDataId);
			var login_user = Procedure.getUserInfo({"user_cd":result.create_user_cd,"department_cd":result.create_department_cd});
			var tantou_user = Procedure.getUserInfo({"user_cd":result.charge_user_cd,"department_cd":result.charge_department_cd});
			$form.login_user = login_user.data[0].user_name;
			$form.login_user_busyo = login_user.data[0].department_inc_name;
			$form.tantou_user = tantou_user.data[0].user_name;
			$form.tantou_busyo = tantou_user.data[0].department_inc_name;
			// jsonで全データを持っておく
	    	$form.login_userData = ImJson.toJSONString(login_user.data[0]);
	    	$form.tantou_user_data = ImJson.toJSONString(tantou_user.data[0]);
			
			
			$form.item_sheetType = result.sheet_type;
			$form.item_division = result.division;
			$form.item_itemNameJap = result.title_name;
			$form.item_itemNameEng = result.title_name_eng;

			// 申請書番号
			$form.matter_number = result.apply_number;
			
			// キャラクタ情報取得
			$form.item_characterlistData=[];
			var charaData = Content.executeFunction("cactus/common_libs/common_fnction","getMyCharacterList",$form.matter_number);
			if (charaData == null){
				for (var i= 0; i < charaData.length;i++){
					$form.item_characterlistData[i] = ImJson.toJSONString(charaData[i]); //
				}
			}
*/
            





            break;
        // 再申請
        case '3':
        case '13':
            //FIXME 必要に応じて処理を実装してください。
            //$form = getUserData(accountContext.loginGroupId, $data.imwUserDataId);
            break;
        // 例外
        default:
            //エラー画面へ遷移します。
            Transfer.toErrorPage({
                title: 'エラー',
                message: 'パラメータが不正です。',
                detail: ['画面を表示するためのパラメータが不正です。'],
                returnUrl: Web.current(), // 戻り先 URL
                returnUrlLabel: '戻る',
                parameter: request
              });
            break;
    }
	//Debug.console($form.list_m_jigyobu);
}

// セレクトボックスの初期値を設定
/*function setSelected(list,val) {
	for (var i=0;i < list.length;i++){
	    if (list[i].value == val){
	    	list[i].selected = true;
	    	break;
	    }
	}
	return list;
}*/
