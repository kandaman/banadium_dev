let $password = {};

/**
 * パスワード変更処理
 *
 * @param request リクエストオブジェクト
 * @onerror handleErrors
 */
function init(request) {

    let context = Contexts.getAccountContext();
    if (!context.authenticated || context.userType == 'administrator') {
        let httpContext = Packages.jp.co.intra_mart.common.aid.jsdk.javax.servlet.http.HTTPContextManager.getInstance().getCurrentContext();
        httpContext.getResponse().sendError(403);
        return;
    }
    
    let userCd = context.userCd;
    $password.loginUserCd = userCd;
    $password.tenantId = context.tenantId;

    let attrList = new Packages.java.util.ArrayList();
    attrList.add('jp.co.intra_mart.foundation.page.PageUrl');
    
    // 他のページへの遷移を禁止するため、一旦ログアウト
    Packages.jp.co.intra_mart.foundation.security.certification.UserCertificationManager.getInstance().logout(attrList);

    $password.validateMessages = ({
        newPasswordConfirm: MessageManager.getMessage('MSG.E.IWP.CERTIFICATION.PASSWORD.EXPIRE.NEW.PASSWORD.CONFIRM')
    }).toSource();

    $password.dialogMessages = ({
        updateConfirmTitle: MessageManager.getMessage('CAP.Z.IWP.CERTIFICATION.PASSWORD.EXPIRE.CONFIRM.DIALOG.TITLE'),
        updateConfirmMessage: MessageManager.getMessage('MSG.C.IWP.CERTIFICATION.PASSWORD.EXPIRE.UPDATE.PASSWORD')
    }).toSource();

    var passwordHistoryManager = new PasswordHistoryManager();
    if(passwordHistoryManager.isForwardInitialPage()) {
        $password.redirectUrl = Web.getContextPath() + '/login';
    } else {
        $password.redirectUrl = Web.getContextPath() + '/user/password/expire/next';
    }

    if(passwordHistoryManager.isChangePasswordFirstLogin() && passwordHistoryManager.isFirstLogin(userCd)) {
        $password.informationMessage = MessageManager.getMessage('MSG.I.IWP.CERTIFICATION.PASSWORD.EXPIRE.CHANGE.PASSWORD.FIRST.LOGIN.MESSAGE');
        $password.informationDetail = MessageManager.getMessage('MSG.I.IWP.CERTIFICATION.PASSWORD.EXPIRE.CHANGE.PASSWORD.FIRST.LOGIN.DETAIL');
    } else {
        $password.informationMessage = MessageManager.getMessage('MSG.I.IWP.CERTIFICATION.PASSWORD.EXPIRE.PASSWORD.EXPIRE.MESSAGE');
        $password.informationDetail = MessageManager.getMessage('MSG.I.IWP.CERTIFICATION.PASSWORD.EXPIRE.PASSWORD.EXPIRE.DETAIL');
    }
    $password.updateLabel = MessageManager.getMessage('CAP.Z.IWP.CERTIFICATION.PASSWORD.EXPIRE.UPDATE.BUTTON');

    // 遷移先情報のセッションキー
    let pageKey = request.getAttribute("im_page_key");
    if (isNull(pageKey)) {
//        pageKey = request.im_page_key;
        pageKey = Module.string.escapeHtml(request.im_page_key);
    }
    if (!pageKey) {
        pageKey = "";
    }
    $password.pageKey = pageKey;
}

/**
 * バリデーションエラー処理
 * @param request リクエストオブジェクト
 * @param validationErrors バリデーションエラー内容
 */
function handleErrors(request, validationErrors) {
    let logger = Logger.getLogger();
    logger.error(validationErrors.getMessages());
    let param = {
      title: MessageManager.getMessage('CAP.Z.IWP.CERTIFICATION.PASSWORD.EXPIRE.ERROR.TITLE'),
      message: MessageManager.getMessage('MSG.E.IWP.CERTIFICATION.PASSWORD.EXPIRE.DISPLAY'),
      detail: MessageManager.getMessage('MSG.E.IWP.CERTIFICATION.PASSWORD.EXPIRE.VALIDATE'),
      returnUrl: 'home',
      returnUrlLabel: MessageManager.getMessage('CAP.Z.IWP.CERTIFICATION.PASSWORD.EXPIRE.ERROR.BACK')
    }
    Transfer.toErrorPage(param);
}
