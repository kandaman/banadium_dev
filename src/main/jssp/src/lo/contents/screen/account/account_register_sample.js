/**
 * アカウント登録
 * 入力: params = { userCd, password?, validStart?, validEnd?, doLicense? }
 * 返り: { ok, message? }
 */
function registerAccount(params) {
  if (!params || !params.userCd) {
    return { ok: false, message: "userCd is required" };
  }
  var userCd    = params.userCd;
  var password  = params.password;
  var startStr  = params.validStart;
  var endStr    = params.validEnd;
  var doLicense = !!params.doLicense;

  var AccountInfoManager = Packages.jp.co.intra_mart.foundation.admin.account.AccountInfoManager;
  var AccountInfo        = Packages.jp.co.intra_mart.foundation.admin.account.model.AccountInfo;
  var UserLicense        = Packages.jp.co.intra_mart.foundation.secure.license.UserLicense;

  function toDate(s) {
    if (!s) return null;
    return IMDate.parse(s, "yyyy-MM-dd'T'HH:mm");
  }

  var mng = new AccountInfoManager();

  try {
    // AccountInfo は userCd を取るコンストラクタのみ提供
    var info = new AccountInfo(userCd);
    if (startStr) info.setValidStartDate(toDate(startStr));
    if (endStr)   info.setValidEndDate(toDate(endStr));
    if (password && password.length > 0) {
      info.setPassword(password);
      info.setLoginFailureCount(0);
    }
    if (mng.contains(userCd)) {
      mng.updateAccountInfo(info);
    } else {
      mng.addAccountInfo(info);
    }

    if (doLicense) {
      // SSJS API: registerAccountLicense(userCd)
      var lic = new UserLicense();
      lic.registerAccountLicense(userCd);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, message: String(e) };
  }
}
