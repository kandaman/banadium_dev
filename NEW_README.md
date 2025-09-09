
## 1) 一覧（listUsers.ssjs）

```javascript
/**
 * 入力: params = { q?, start?, count?, locale? }
 * 返り: { ok, start, count, total, rows: [{userCd, displayName, deleted}] }
 */
function listUsers(params) {
  var q      = (params && params.q)      || null;
  var start  = Number((params && params.start) || 1);   // 1始まり
  var count  = Number((params && params.count) || 50);
  var locale = (params && params.locale) || "ja";

  var um   = new IMMUserManager();                 // ユーザマネージャ
  var cond = new AppCmnSearchCondition();          // 検索条件（空なら全件）
  var today = new Date();

  // 最小実装: user_cd の部分一致だけに絞る（列名は imm_user の user_cd）
  if (q && q.trim() !== "") {
    cond.addLikeWithIndex(1, "imm_user.user_cd", q.trim(), AppCmnSearchCondition.PARTIAL);
  }

  // ページング付き一覧
  var resList = um.listUser(cond, today, locale, start, count, /*isDisable=*/false);
  var items   = (resList && resList.data) ? resList.data : []; // UserListNodeInfo[]

  // 件数
  var resCnt  = um.countUser(cond, today, locale, /*isDisable=*/false);
  var total   = (resCnt && typeof resCnt.data === "number") ? resCnt.data : 0;

  // 必要最小の整形（UserListNodeInfo: userCd / displayName / deleteFlag）
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
```

* `IMMUserManager.listUser(...)` と `countUser(...)` は SSJS から直接使えます。一覧の戻りは `UserListNodeInfo`（`userCd / displayName / deleteFlag` など）。([api.intra-mart.jp][1])
* 検索条件は `AppCmnSearchCondition` を使用。まずは `imm_user.user_cd` の部分一致だけに絞った“最小”にしています（必要であれば後述の応用で拡張）。([api.intra-mart.jp][2])

---

## 2) 編集（editUser.ssjs）

```javascript
/**
 * 入力: params = {
 *   userCd (必須),
 *   userName?,            // 表示名（ロケール別名）
 *   emailAddress1?,       // メール1
 *   locale? = "ja"
 * }
 * 返り: { ok, created, termChanges }
 */
function editUser(params) {
  if (!params || !params.userCd) {
    return { ok: false, error: "userCd is required." };
  }
  var userCd = params.userCd;
  var userName = params.userName;
  var email1   = params.emailAddress1;
  var locale   = params.locale || "ja";

  var um  = new IMMUserManager();
  var app = new AppCommonManager();
  var key = { userCd: userCd };
  var today = new Date();

  // 既存取得（有効期間内のレコード）
  var got = um.getUser(key, today, locale, /*isDisable=*/false);
  var u   = got ? got.data : null;

  var created = false;

  if (!u) {
    // 新規（termCd を null、開始/終了日はシステム既定期間で）
    u = {
      userCd: userCd,
      termCd: null,                         // ★新規
      startDate: app.getSystemStartDate(),  // 1900-01-01
      endDate:   app.getSystemEndDate(),    // 2999-12-31
      deleteFlag: false,
      locales: {}
    };
    created = true;
  }

  // ロケール別の名称などを更新
  if (!u.locales) u.locales = {};
  if (!u.locales[locale]) u.locales[locale] = {};
  if (typeof userName === "string") u.locales[locale].userName = userName;
  if (typeof email1   === "string") u.emailAddress1 = email1;

  // 更新（termCd 未指定=新規 / 指定あり=更新）
  var upd = um.setUser(u);

  return {
    ok: true,
    created: created,
    termChanges: (upd && upd.data) ? upd.data : []  // 新規時は期間情報配列が返る
  };
}
```

* `IMMUserManager.setUser(UserInfo)` は**期間コード未指定なら新規、指定ありなら更新**の仕様です。ここでは既存が無ければ `termCd=null` で新規登録、有れば既存オブジェクトを書き換えて更新にしています。([api.intra-mart.jp][3])
* `UserInfo` のロケール別プロパティ（`locales["ja"].userName` など）や `emailAddress1` は SSJS から素直にセット可能です。([api.intra-mart.jp][4])

---

# README（丁寧ステップ）

## 0. 何を作るか

* intra-mart 内部 API（BizAPI/SSJS）でユーザマスタをメンテ
* **一覧**: `imm_user` を検索し、`userCd` と `displayName` を返す
* **編集**: `userCd` 指定で表示名・メールなどを更新（存在しなければ新規）

> 使う API：`IMMUserManager`（listUser / countUser / getUser / setUser）、`AppCmnSearchCondition`、`UserListNodeInfo`、`UserInfo`。([api.intra-mart.jp][1])

---

## 1. ソース配置

* `listUsers.ssjs` と `editUser.ssjs` を、プロジェクトの **サーバサイド JavaScript**（Function Container）に配置
  （e Builderなら `src/main/webapp/WEB-INF/imart/ssjs/<任意>/` など）

---

## 2. REST 化（IM-LogicDesigner）

1. **フロー作成**

* LogicDesigner でフローを2本（例）

  * `user_api_list`（GET 用）
  * `user_api_edit`（POST/PUT 用）

2. **タスク追加（SSJS）**

* `user_api_list` に SSJS タスクを追加 → スクリプト欄に `listUsers` を貼付
* `user_api_edit` に SSJS タスクを追加 → スクリプト欄に `editUser` を貼付

3. **ユーザ定義（REST）に公開**

* `user_api_list` を **GET** `/api/users` に公開

  * クエリ引数 → `params.q` / `params.start` / `params.count` / `params.locale` にマッピング
* `user_api_edit` を **POST** `/api/users/:userCd` に公開

  * パス or ボディの `userCd`、ボディの `userName` / `emailAddress1` / `locale` を `params` にマッピング

> LogicDesigner での REST 公開手順は公式 CookBook（Forma から Ajax 呼び出し例）と同様の流れです。「サーバサイドロジックを作り、それを REST 定義として公開し、JS から呼ぶ」手順の要点だけ借りています。([intra-mart Developer Portal -][5])

---

## 3. 動作確認（例）

### 一覧（GET）

```bash
curl -G "https://<host>/<context>/api/users" \
  --data-urlencode "q=adm" \
  --data-urlencode "start=1" \
  --data-urlencode "count=20" \
  --data-urlencode "locale=ja"
```

レスポンス例:

```json
{
  "ok": true,
  "start": 1,
  "count": 20,
  "total": 3,
  "rows": [
    {"userCd":"admin","displayName":"管理者","deleted":false},
    {"userCd":"admin2","displayName":"管理者2","deleted":false}
  ]
}
```

### 編集（POST）

```bash
curl -X POST "https://<host>/<context>/api/users/test001" \
  -H "Content-Type: application/json" \
  -d '{"userCd":"test001","userName":"テスト太郎","emailAddress1":"taro@example.com","locale":"ja"}'
```

レスポンス例:

```json
{"ok":true,"created":true,"termChanges":["19000101_29991231"]}
```

---

## 4. 権限と運用の注意

* 実行ユーザに**共通マスタの更新権限**（例: IM-master ロール等）が必要です。
* ユーザ情報は\*\*期間（termCd / startDate / endDate）\*\*を持ちます。今回の最小実装では「現行期間を取得して更新／なければシステム既定期間で新規」を採用しています（`setUser` の仕様に準拠）。([api.intra-mart.jp][3])
* 一覧検索の対象列は最小限（`user_cd`）です。名前や検索名でも探したい場合は、以下のどちらかで拡張します：

  * `AppCmnSearchCondition` の **検索ターゲット**を設定し、`NAME` / `SEARCH_NAME` で LIKE 検索を併用（推奨）
  * あるいは結合先の列名を直接指定（環境のスキーマに依存）
    ※ 検索条件の定義 API は `AppCmnSearchCondition` にまとまっています。([api.intra-mart.jp][2])

---

## 5. 参考リンク（公式）

* **IMMUserManager**（list/search/count/set などの一覧・編集API）— SSJSドキュメント。([api.intra-mart.jp][1])
* **UserListNodeInfo**（一覧の行オブジェクトの形）— `userCd / displayName / deleteFlag`。([api.intra-mart.jp][6])
* **UserInfo**（編集対象のプロパティ、`locales["ja"].userName` など）— SSJSドキュメント。([api.intra-mart.jp][4])
* **AppCmnSearchCondition**（検索条件の組み立て）— SSJSドキュメント。([api.intra-mart.jp][2])
* **LogicDesigner で REST 公開する流れ（CookBook）**。([intra-mart Developer Portal -][5])

---

必要なら、この“最小実装”に以下の拡張もすぐ足せます：

* 名前/検索名のLIKE（`NAME` / `SEARCH_NAME` ターゲットの併用）
* ソート（`cond.setSortDirection(AppCmnSearchCondition.ASC)` + `cond.addOrder(...)`）
* 退職者等の除外/含む切替（`isDisable` 引数の制御）
* メールや電話番号などの編集項目追加

このまま載せれば “一覧→編集” の基本フローは動きます。欲しい拡張があれば、その前提でパッチ出します。

[1]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/im_master/IMMUserManager/index.html "intra-mart Accel Platform SSJS API Documentation"
[2]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/im_master/AppCmnSearchCondition/index.html "intra-mart Accel Platform SSJS API Documentation"
[3]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/im_master/IMMUserManager/index.html?utm_source=chatgpt.com "IMMUserManagerオブジェクト"
[4]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/im_master/UserInfo/index.html?utm_source=chatgpt.com "UserInfoオブジェクト"
[5]: https://dev-portal.intra-mart.jp/cookbook/cookbook110542/?utm_source=chatgpt.com "FormaのスクリプトからAjax処理を呼び出す"
[6]: https://api.intra-mart.jp/iap/apilist-ssjs/doc/im_master/UserListNodeInfo/index.html "intra-mart Accel Platform SSJS API Documentation"
