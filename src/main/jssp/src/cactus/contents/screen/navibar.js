var $form = {
	 login_user:""
};
var $data = {
}


function init(request) {

    // ログインユーザ情報の取得
    var oSession = Contexts.getAccountContext();
    var userId = oSession.userCd;
    var loginGroupId = oSession.loginGroupId;
    var localeId = oSession.locale;


    // ログインユーザの取得
    var ret = Procedure.getUserInfo({"user_cd":userId});
    if (ret.countRow > 0){
    	var userData = ret.data;
        //$form.login_user = userData[0].user_name + ' ' +userData[0].user_name_eng +'<br>' +userData[0].user_no;
        $form.login_user = userData[0].user_name;
        //$form.login_user_busyo = userData[0].department_inc_name;
    }

    // 定数読み込み
    Constant.load("cactus/common_libs/const");
    
    // 申請書の初期フローＩＤ、ノードＩＤを設定
    $data.login_user_cd = userId;
    $data.imwFlowId = Constant.APPLY_FROW_ID;
    $data.imwNodeId = Constant.APPLY_NODE_ID;
    /*if ('imwCallOriginalPagePath' in request.data){
        $data.imwCallOriginalPagePath = request.data.imwCallOriginalPagePath; //処理完了時戻り先パス
    }else{
        $data.imwCallOriginalPagePath = "cactus/contents/screen/top";
    }*/
    
    
    
    

}