了解。**intra-mart（Accel Platform / eBuilder）で「アカウントの一覧」と「編集」を最短で作る**ための最小サンプルを用意しました。SSJS（JSSP）ベースで、公式API `AccountInfoManager` / `AccountInfo` / `UserLicense` を素直に使います。

---

# 1) 構成（ファイル）

```
/WEB-INF/jssp/account/
  ├─ account_list.jssp        … 一覧 + 検索 + ページング
  ├─ account_edit.jssp        … 新規/編集フォーム（GETで表示）
  └─ account_save.jssp        … 登録・更新・ライセンス登録（POSTで処理）
```

> API根拠：一覧取得・検索・追加・更新は `AccountInfoManager` の
> `getAccountInfos(start,count)`, `searchAccountInfos(q,start,count)`,
> `addAccountInfo`, `updateAccountInfo` を使用します。([api.intra-mart.jp][1])
> `AccountInfo` は有効開始/終了の初期値や有効判定の仕様が定義。([api.intra-mart.jp][2])
> ライセンスは `UserLicense.registerAccountLicense(String userCd)` を呼びます（※引数はユーザコード文字列）。([api.intra-mart.jp][3])

---

# 2) サンプルコード

## `/WEB-INF/jssp/account/account_list.jssp`

```javascript
<%
/* 一覧 + 検索 + ページング（最小実装） */
var request  = IMRequest.getCurrentRequest();
var q        = (request.getParameter("q") || "").trim();
var page     = parseInt(request.getParameter("page") || "1", 10);
var perPage  = 20;
var start    = (page - 1) * perPage;

var AccountInfoManager = Packages.jp.co.intra_mart.foundation.admin.account.AccountInfoManager;
var mng = new AccountInfoManager();

/* 件数とデータ（search or full） */
var list = [];
var total = 0;
if (q.length > 0) {
  list  = mng.searchAccountInfos(q, start, perPage);   // ユーザコード部分一致
  // ざっくり総数：次ページ有無だけわかればよい最小実装にする
  // きちんと総数が必要なら search + ループ or 別途API/SQLを検討
  total = (list.size() < perPage) ? (start + list.size()) : (start + perPage + 1);
} else {
  list  = mng.getAccountInfos(start, perPage);
  // 同様に概算。厳密な総数が必要なら getAccountInfoCount() を利用
  total = (list.size() < perPage) ? (start + list.size()) : (start + perPage + 1);
}
%>
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>アカウント一覧</title>
<style>
body{font-family:system-ui, sans-serif;margin:16px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ddd;padding:8px}
th{background:#f7f7f7;text-align:left}
.actions a{margin-right:8px}
form.search{margin:0 0 12px}
.pager a{margin-right:8px}
</style></head><body>
<h1>アカウント一覧</h1>

<form class="search" method="get">
  <input type="text" name="q" value="<%= IMHtml.escape(q) %>" placeholder="ユーザコードで検索">
  <button type="submit">検索</button>
  <a href="account_edit.jssp">＋ 新規作成</a>
</form>

<table>
  <tr><th>ユーザコード</th><th>有効開始</th><th>有効終了</th><th>ロック日</th><th>操作</th></tr>
  <%
  for (var i=0;i<list.size();i++){
    var a = list.get(i);
  %>
  <tr>
    <td><%= IMHtml.escape(a.getUserCd()) %></td>
    <td><%= a.getValidStartDate() %></td>
    <td><%= a.getValidEndDate() %></td>
    <td><%= a.getLockDate() %></td>
    <td class="actions">
      <a href="account_edit.jssp?userCd=<%= IMUrl.encode(a.getUserCd()) %>">編集</a>
    </td>
  </tr>
  <% } %>
</table>

<div class="pager">
  <% if (page > 1) { %>
    <a href="?q=<%= IMUrl.encode(q) %>&page=<%= page-1 %>">前へ</a>
  <% } %>
  <% if (list.size() >= perPage) { %>
    <a href="?q=<%= IMUrl.encode(q) %>&page=<%= page+1 %>">次へ</a>
  <% } %>
</div>

</body></html>
```

## `/WEB-INF/jssp/account/account_edit.jssp`

```javascript
<%
/* 新規/編集フォーム表示 */
var request  = IMRequest.getCurrentRequest();
var userCd   = (request.getParameter("userCd") || "").trim();

var AccountInfoManager = Packages.jp.co.intra_mart.foundation.admin.account.AccountInfoManager;
var AccountInfo        = Packages.jp.co.intra_mart.foundation.admin.account.model.AccountInfo;
var SystemValidDate    = Packages.jp.co.intra_mart.foundation.common.date.SystemValidDate;
var mng = new AccountInfoManager();

var mode  = "create";
var model = new AccountInfo();  // 既定で最小/最大日付に初期化される
// （AccountInfoはシステム最小/最大日付で初期化される仕様） 

if (userCd) {
  var found = mng.getAccountInfo(userCd); // 8.0.13+ ではパスワードは取得できない（ハッシュ時）
  if (found != null) { model = found; mode = "edit"; }
}
%>
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>アカウント<%= mode === "edit" ? "編集" : "新規" %></title>
<style>
body{font-family:system-ui, sans-serif;margin:16px;max-width:800px}
label{display:block;margin:8px 0 4px}
input[type=text],input[type=password],input[type=datetime-local]{width:360px;padding:6px}
.row{margin-bottom:10px}
</style></head><body>
<h1>アカウント<%= mode === "edit" ? "編集" : "新規" %></h1>

<form method="post" action="account_save.jssp">
  <div class="row">
    <label>ユーザコード *</label>
    <input name="userCd" value="<%= IMHtml.escape(model.getUserCd() || "") %>" <%= mode==="edit"?"readonly":"" %> required>
  </div>

  <div class="row">
    <label>パスワード <%= mode==="edit"?"（変更時のみ入力）":"" %></label>
    <input type="password" name="password" value="">
  </div>

  <div class="row">
    <label>有効開始日</label>
    <input type="datetime-local" name="validStartDate" value="<%= IMDate.format(model.getValidStartDate(),'yyyy-MM-dd\'T\'HH:mm') %>">
  </div>

  <div class="row">
    <label>有効終了日</label>
    <input type="datetime-local" name="validEndDate" value="<%= IMDate.format(model.getValidEndDate(),'yyyy-MM-dd\'T\'HH:mm') %>">
  </div>

  <div class="row">
    <label>テーマ（pc）</label>
    <input type="text" name="themePc" placeholder="例: im_theme_60_blue" value="">
  </div>

  <div class="row">
    <label><input type="checkbox" name="registerLicense" value="1"> アカウントライセンスを登録する</label>
  </div>

  <input type="hidden" name="mode" value="<%= mode %>">
  <button type="submit">保存</button>
  <a href="account_list.jssp">戻る</a>
</form>

</body></html>
```

## `/WEB-INF/jssp/account/account_save.jssp`

```javascript
<%
/* 追加・更新・ライセンス登録処理（最小） */
IMResponse.getCurrentResponse().setContentType("text/html; charset=UTF-8");

var request  = IMRequest.getCurrentRequest();
var mode     = request.getParameter("mode") || "create";
var userCd   = (request.getParameter("userCd") || "").trim();
var password = (request.getParameter("password") || "");
var startStr = request.getParameter("validStartDate");
var endStr   = request.getParameter("validEndDate");
var themePc  = (request.getParameter("themePc") || "").trim();
var doLic    = (request.getParameter("registerLicense") === "1");

var AccountInfoManager = Packages.jp.co.intra_mart.foundation.admin.account.AccountInfoManager;
var AccountInfo        = Packages.jp.co.intra_mart.foundation.admin.account.model.AccountInfo;
var UserLicense        = Packages.jp.co.intra_mart.foundation.secure.license.UserLicense;

var mng = new AccountInfoManager();

/* 値の組み立て */
function toDate(s){
  if(!s) return null;
  return IMDate.parse(s, "yyyy-MM-dd'T'HH:mm");
}

try {
  var info;
  if (mode === "edit") {
    info = mng.getAccountInfo(userCd);
    if (info == null) throw "対象ユーザが見つかりません: " + userCd;
  } else {
    info = new AccountInfo();
    info.setUserCd(userCd);
    // 初期化済みの最小/最大日付から、入力があれば上書き
  }

  if (startStr) info.setValidStartDate(toDate(startStr));
  if (endStr)   info.setValidEndDate(toDate(endStr));

  // パスワード：8.0.13+ のハッシュ保存環境では get できないので「設定したい時だけ set」
  if (password && password.length > 0) {
    info.setPassword(password);
    info.setLoginFailureCount(0);
  }

  // テーマ設定（pcのみ簡易）※キーは "pc"
  if (themePc) {
    var HashMap = Packages.java.util.HashMap;
    var themeIdMap = new HashMap();
    themeIdMap.put("pc", themePc);
    info.setThemeIds(themeIdMap);
  }

  if (mode === "edit") {
    mng.updateAccountInfo(info);
  } else {
    mng.addAccountInfo(info);
  }

  // 必要ならライセンス登録（引数はユーザコード文字列）
  if (doLic) {
    var lic = new UserLicense();
    lic.registerAccountLicense(userCd);
  }

  // 完了 → 一覧へ
  IMResponse.getCurrentResponse().sendRedirect("account_list.jssp");
  IMContext.complete();
  return;

} catch (e) {
  %>
  <!DOCTYPE html><html><head><meta charset="UTF-8"><title>保存エラー</title></head><body>
  <h1>保存に失敗しました</h1>
  <pre><%= IMHtml.escape(String(e)) %></pre>
  <p><a href="account_edit.jssp<%= mode==='edit' ? ('?userCd='+IMUrl.encode(userCd)) : '' %>">戻る</a></p>
  </body></html>
  <%
}
%>
```

---

# 3) README（導入・使い方・注意）

## 導入

1. eBuilder で Webプロジェクト配下に上記3ファイルを配置（`/WEB-INF/jssp/account/`）。
2. メニュー/画面遷移から `account_list.jssp` へリンクを作成。
3. 権限：管理者ロール等、当該JSSPへの実行権限を付与。
4. ログインし、`/account/account_list.jssp` を開く。

## 操作

* 一覧：ユーザコードで簡易検索、ページング（20件刻み）。
* 新規：［＋新規作成］→ 必須はユーザコード（パスワード任意）。
* 編集：ユーザコード固定、パスワード入力時のみ更新。
* テーマ：例として pc に `im_theme_60_blue` をセット可能。
* チェックを入れると**アカウントライセンス登録**を実行。

## 注意点（公式仕様の要点）

* **API**

  * 一覧・検索・追加・更新は `AccountInfoManager` を使用。`getAccountInfos(start,count)` / `searchAccountInfos(q,start,count)` / `addAccountInfo` / `updateAccountInfo`。([api.intra-mart.jp][1])
  * `AccountInfo` は作成時に**システム最小/最大日付**が初期値で入る。有効判定は「開始日 ≤ 判定日 < 終了日」かつ**ライセンス登録済み**。([api.intra-mart.jp][2])
  * **ライセンス登録**は `new UserLicense().registerAccountLicense(userCd)`（引数は**文字列**）。([api.intra-mart.jp][3])
* **パスワード取得の挙動（8.0.13+）**
  パスワード保存方式が「ハッシュ化」の場合、`getAccountInfo()` で**パスワードは返らない**。本サンプルは「入力されていれば更新」方式で対応。([api.intra-mart.jp][1])
* **テーブル**
  `B_M_ACCOUNT_B`（本体）, `B_M_ACCOUNT_THEME`（テーマ）, `IM_ACCOUNT_LICENSE`（ライセンス）を内部的に扱う。移行仕様書にも `b_m_account_b` と `b_m_account_theme` の関係が記載。([document.intra-mart.jp][4])

---

# 4) 最低限のテスト観点

* 新規作成：ユーザコード一意で登録されるか／画面遷移。
* 既存編集：有効期間・テーマ・パスワードが更新されるか。
* ライセンス登録：登録後そのアカウントでログイン可になるか。
* 検索・ページング：件数境界（20件・40件）で前後リンクの表示。

---

必要なら、この雛形を**IM-UIコンポーネント**（imuiフォーム、ドロップダウン等）でリッチ化した版に拡張します。まずは上記の**素の最小実装**で API 経路と権限/ライセンス周りが動くことを確認してください。

[1]: https://api.intra-mart.jp/iap/javadoc/all-dev_apidocs/jp/co/intra_mart/foundation/admin/account/AccountInfoManager.html "AccountInfoManager (javadoc-all-dev 8.0.0 API)"
[2]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/tenant/AccountInfo/index.html?utm_source=chatgpt.com "AccountInfoオブジェクト"
[3]: https://api.intra-mart.jp/iap/javadoc/all-dev_apidocs/jp/co/intra_mart/foundation/secure/license/UserLicense.html?utm_source=chatgpt.com "UserLicense (javadoc-all-dev 8.0.0 API)"
[4]: https://document.intra-mart.jp/library/iap/public/migration/iap_migration_specification/texts/access_security/account.html?utm_source=chatgpt.com "4.2. アカウント — 移行仕様書 第3版 2023-10-31 ..."
