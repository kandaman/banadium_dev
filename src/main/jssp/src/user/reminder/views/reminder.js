let $reminder = {};


/**
 * 初期化処理を行います。
 *
 * @param request Object URL引数群
 */
function init(request) {
    let context = Contexts.getAccountContext();
    let reminder = new PasswordReminder(context.userCd, Web.base(), context.locale);
    let result = reminder.isEnabled();
    let message = null;
    if(result.error) {
        message = MessageManager.getMessage('MSG.E.IWP.USER.REMINDER.GET.REMINDER.CONFIG');
    } else if(!result.data) {
        message = MessageManager.getMessage('MSG.E.IWP.USER.REMINDER.DISABLED');
    }
    if(!isNull(message)) {
        sendErrorPage(message);
    }
    // テナントIDの入力有無
    $reminder.isTenant = !Packages.jp.co.intra_mart.system.admin.tenant.TenantIdProviderConfig.getInstance().isEnable();
    if ($reminder.isTenant) {
        result = new TenantInfoManager().getTenantIds();
        if (result.error) {
            sendErrorPage(MessageManager.getMessage('MSG.E.IWP.USER.REMINDER.GET.TENANT'));
        }
        $reminder.isTenant = result.data.length > 1;
    }
}

function sendErrorPage(message) {
    Transfer.toErrorPage({
        title : MessageManager.getMessage('CAP.Z.IWP.USER.REMINDER.ERROR'),
        message : message,
        returnUrl : 'login',
        returnUrlLabel : MessageManager.getMessage('CAP.Z.IWP.USER.REMINDER.BACK')
    });
}