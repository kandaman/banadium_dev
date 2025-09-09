/**
 * ユーザー一覧取得
 * 入力: params = { q?, start?, count?, locale? }
 * 返り: { ok, start, count, total, rows: [{userCd, displayName, deleted}] }
 */
function listUsers(params) {
  var q      = (params && params.q)      || null;
  var start  = Number((params && params.start) || 1);
  var count  = Number((params && params.count) || 50);
  var locale = (params && params.locale) || "ja";

  var um   = new IMMUserManager();
  var cond = new AppCmnSearchCondition();
  var today = new Date();

  if (q && q.trim() !== "") {
    cond.addLikeWithIndex(1, "imm_user.user_cd", q.trim(), AppCmnSearchCondition.PARTIAL);
  }

  var resList = um.listUser(cond, today, locale, start, count, false);
  var items   = (resList && resList.data) ? resList.data : [];

  var resCnt  = um.countUser(cond, today, locale, false);
  var total   = (resCnt && typeof resCnt.data === "number") ? resCnt.data : 0;

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    var n = items[i];
    rows.push({
      userCd: n.userCd,
      displayName: n.displayName,
      deleted: !!n.deleteFlag
    });
  }

  return { ok: true, start: start, count: count, total: total, rows: rows };
}

/**
 * ユーザー登録・更新
 * 入力: params = { userCd, userName?, emailAddress1?, locale? }
 * 返り: { ok, created, termChanges }
 */
function editUser(params) {
  if (!params || !params.userCd) {
    return { ok: false, error: "userCd is required." };
  }
  var userCd = params.userCd;
  var userName = params.userName;
  var email1   = params.emailAddress1;
  var startDate = params.startDate ? new Date(params.startDate) : null;
  var endDate   = params.endDate ? new Date(params.endDate) : null;
  var locale   = params.locale || "ja";

  var um  = new IMMUserManager();
  var app = new AppCommonManager();
  var key = { userCd: userCd };
  var today = new Date();

  var got = um.getUser(key, today, locale, false);
  var u   = got ? got.data : null;

  var created = false;

  if (!u) {
    u = {
      userCd: userCd,
      termCd: null,
      startDate: startDate || app.getSystemStartDate(),
      endDate:   endDate   || app.getSystemEndDate(),
      deleteFlag: false,
      locales: {}
    };
    created = true;
  } else {
    if (startDate) u.startDate = startDate;
    if (endDate)   u.endDate   = endDate;
  }

  if (!u.startDate) u.startDate = app.getSystemStartDate();
  if (!u.endDate)   u.endDate   = app.getSystemEndDate();

  if (!u.locales) u.locales = {};
  if (!u.locales[locale]) u.locales[locale] = {};
  if (typeof userName === "string") u.locales[locale].userName = userName;
  if (typeof email1   === "string") u.emailAddress1 = email1;

  var upd = um.setUser(u);

  return {
    ok: true,
    created: created,
    termChanges: (upd && upd.data) ? upd.data : []
  };
}
