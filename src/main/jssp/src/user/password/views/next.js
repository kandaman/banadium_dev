/**
 * パスワード変更後に指定された遷移先にリダイレクトします。
 *
 * @param request リクエストオブジェクト
 * @onerror handleErrors
 */
function init(request) {
    let userCertificationManager = Packages.jp.co.intra_mart.foundation.security.certification.UserCertificationManager.getInstance();
    let loginRequestInfo = userCertificationManager.createLoginRequestInfo();
    loginRequestInfo.setUserCd(Contexts.getAccountContext().userCd);
    let pageUrl = userCertificationManager.getTargetPageUrl(loginRequestInfo);
    
    // リクエストパラメータも取得できるように修正
    PageManager.redirect(pageUrl.toString(), 'post');
    //PageManager.redirect(pageUrl.getUrl(), 'post');
    
}
