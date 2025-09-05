let loginInfo       = '';
let loginUrl        = '';
let store           = '';
let pageKey;
let reminder;
let enableGoogleChromeFrame;
let virtualTenant;
let contextPath;

var link={};

function init(request) {
    loginUrl  = Web.encodeURL('certification');
    loginInfo = request.getAttribute('im_login_info');
    contextPath = Web.getContextPath();
    // テナントID 入力有無
    virtualTenant = request.getAttribute('im_enable_tenant_id');

    // ユーザコード保存先をCookieにするかどうか
    if (request.getAttribute('im_enable_cookie') == 'true') {
        store = 'cookie';
    }
    // ユーザコード保存先をlocalStorageにするかどうか
    if (request.getAttribute('im_enable_localstorage') == 'true') {
        store = 'localStorage';
    }

    // 遷移先情報のセッションキー
    pageKey = request.getAttribute('im_page_key');
    if (isNull(pageKey)) {
        pageKey = request.im_page_key;
    }
    if (!pageKey) {
        pageKey = '';
    }

    let util = Packages.jp.co.intra_mart.foundation.security.certification.CertificationUtil;
    let constraint = Packages.jp.co.intra_mart.foundation.security.certification.CertificationConstraint;
    let enable_reminder = util.getCertificationParamValue(constraint.CATEGORY_LOGIN, 'enable_reminder');
    if(enable_reminder == 'true') {
        let context = Contexts.getAccountContext();
        let manager = new PasswordReminder(context.userCd, Web.base(), context.locale);
        let result = manager.isEnabled();
        reminder = (!result.error && result.data);
    }

    // Google Chrome Frame の有効/無効
    enableGoogleChromeFrame = Packages.jp.co.intra_mart.system.ui.config.GoogleChromeFrameConfigImpl.getInstance().isEnable();
    
    var fileInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadFileInfo", '1');
    Logger.getLogger().info(' [init]代わり承認編集画面表示 end　 fileInfo ' + ImJson.toJSONString(fileInfo, true));
    var url = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadLink", fileInfo.file_nm, fileInfo.file_path);
    Logger.getLogger().info(' [init]代わり承認編集画面表示 end　 url ' + url);
    link.notLogin = Content.executeFunction("lo/common_libs/lo_common_fnction", "makeLinkTag", url,fileInfo.file_nm);
    Logger.getLogger().info(' [init]代わり承認編集画面表示 end　 url ' + link.notLogin);
    
    fileInfo = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadFileInfo", '2');
    url = Content.executeFunction("lo/common_libs/lo_common_fnction", "getDownloadLink", fileInfo.file_nm, fileInfo.file_path);  
    link.loginChange = Content.executeFunction("lo/common_libs/lo_common_fnction", "makeLinkTag", url,fileInfo.file_nm);
    
}
