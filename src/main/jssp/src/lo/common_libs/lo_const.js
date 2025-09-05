
//  ライセンスアウトユーザグループ
var LO_GROUP_SET_CD = 'license_out';       //ライセンスアウトセットコード
var LO_GROUP_CD_LICENSEE = 'lo_licensee_group';       //ライセンシー
var LO_GROUP_CD_BNE = 'lo_bne_group'; // BNE
var LO_GROUP_CD_PRODUCTION = 'lo_production_group'; //ライセンスプロダクション
var LO_GROUP_CD_HOMU = 'lo_homu_group'; // 法務権限グループ
var LO_GROUP_CD_JOSYS = 'lo_johosystem_group';	// 情シス(コード名称仮)
var LO_GROUP_CD_SHOHYO = 'lo_trademark_group'; // 商標調査グループ
var LO_GROUP_CD_JOSYS = 'lo_johosystem_group'; // 情報システムグループ
var LO_GROUP_CD_CONTRACT = 'lo_contract_group'; // 契約担当グループ
var LO_GROUP_CD_CONTRACT_NOTICE = 'lo_contract_notice_group'; // 契約担当通知先グループ
var LO_GROUP_CD_ACCOUNT = 'lo_account_group'; // 計上担当グループ
//var LO_GROUP_CD_SPECIFIC_1 = 'lo_specific_group_1'; // 特定1グループ
//var LO_GROUP_CD_SPECIFIC_2 = 'lo_specific_group_2'; // 特定2グループ
//var LO_GROUP_CD_SPECIFIC_3 = 'lo_specific_group_3'; // 特定3グループ
var LO_GROUP_CD_SPECIFIC = 'lo_specific_group'; // 特定グループ(最後に"_数値"をつけて動的にする)
var LO_GROUP_CD_KAWARI_INPUT = 'lo_kawari_input_group'; // 代わりWF入力グループ



var LO_GROUP_APPR_0 = "lo_approva_group_0" //BNE担当
var LO_GROUP_APPR_1 = "lo_approva_group_1" //承認1
var LO_GROUP_APPR_2 = "lo_approva_group_2" //承認2
var LO_GROUP_APPR_3 = "lo_approva_group_3" //承認3
var LO_GROUP_APPR_LAST = "lo_bnetantou_group" //最終（とりあえずBNEと一緒か）
	
var LO_GROUP_KAWARI_INPUT = 'lo_kawari_input_group'; // 代わり承認入力者

// WFステータス（コメント）
var LO_WF_STATUS_SHINSEI = "apply";
var LO_WF_STATUS_SASHIMODOSHI = "sendback";
var LO_WF_STATUS_SAISHINSEI = "reapply";
var LO_WF_STATUS_SHONIN = "approve";
var LO_WF_STATUS_HIKETSU = "deny";
var LO_WF_STATUS_KANRYOGO = "completed";
var LO_WF_STATUS_PULLBACK = "pullback";
var LO_WF_STATUS_SENDBACK_TO_PULLBACK = "sendbacktopullback";
// コメントステータス
var LO_COMMENT_STATUS = "shanai_shusei";

//ストレージパス
var LO_PATH_PUBLIC_STORAGE = '/lo/upload/'; //ファイル保存フォルダ
var LO_PATH_SESSION_STORAGE = '/lo/upload/'; //ファイル一時保存フォルダ
var LO_PATH_PUBLIC_TEMPLATE = '/lo/template/'; //帳票テンプレートフォルダ

// 最大ファイル容量
var MAX_FILE_SIZE = 52428800; // 50MB
// 最大ファイル数
var MAX_FILE_NUM = 100;

// コード区分
var LO_CDCLS_SERVICE_UNBLOCK_FLG = '0000'; // 遮断解除フラグ（0:通常稼働、1:遮断解除）
var LO_CDCLS_SERVICE_STOP = '0001'; // 遮断開始時刻
var LO_CDCLS_SERVICE_START = '0002'; // 遮断終了時刻
var LO_CDCLS_KIKAKU_STATUS_LI = '0003'; // 企画ステータス（ライセンシー用）
var LO_CDCLS_KIKAKU_STATUS_PR = '0004'; // 企画ステータス（ライセンスプロダクション用）
var LO_CDCLS_KIKAKU_SHUBETSU = '0005'; // 企画種別
var LO_CDCLS_SHOHIN_CATEGORY = '0006'; // 商品カテゴリ
var LO_CDCLS_CHIIKI = '0007'; // 地域
var LO_CDCLS_SHOSHI = '0008'; // 証紙
var LO_CDCLS_TRADING = '0009'; // トレーディング仕様
var LO_CDCLS_KAKIOROSI_KIBOU_UMU = '0010'; // 描き下ろし希望有無
var LO_CDCLS_ASOBISTORE = '0011'; // アソビストアでの取り扱い希望
var LO_CDCLS_OK_NG = '0012'; // 承認
var LO_CDCLS_SINGLE_ALBAM = '0013'; // シングル or アルバム
var LO_CDCLS_JAKETTO_VISUAL = '0014'; // ジャケットヴィジュアル
var LO_CDCLS_RELEASE_EVENT = '0015'; // リリースイベント
var LO_CDCLS_DRAMAPART = '0016'; // ドラマパート
var LO_CDCLS_HUNYU_TOKUTEN = '0017'; // 封入特典
var LO_CDCLS_TENPO_TOKUTEN = '0018'; // 店舗特典
var LO_CDCLS_KEMBAI_UMU = '0019'; // 券売有無
var LO_CDCLS_SHINKI_GOODS_SEIZO = '0020'; // 新規グッズ製造
var LO_CDCLS_NOVELTY = '0021'; // ノベルティ
var LO_CDCLS_SEIYU_KADO = '0022'; // 声優稼働
var LO_CDCLS_EIZO_SHIYO_KIBO = '0023'; // 映像使用希望
var LO_CDCLS_GAKKYOKU_SHIYO_KIBO = '0024'; // 楽曲使用希望
var LO_CDCLS_KYODAKU_STATUS_LI = '0025'; // 許諾ステータス（ライセンシー用）
var LO_CDCLS_KYODAKU_STATUS_PR = '0026'; // 許諾ステータス（ライセンスプロダクション用）
var LO_CDCLS_KYODAKU_CLS = '0027'; // 許諾種別
var LO_CDCLS_KEIYAKU_CLS = '0028'; // 契約種別
var LO_CDCLS_HANBAI_CHIIKI = '0029'; // 販売地域
var LO_CDCLS_SHOHYO_CHOSA_KEKKA = '0030'; // 簡易商標調査結果
var LO_CDCLS_KEIYAKU_STATUS = '0031'; // 契約ステータス
var LO_CDCLS_DOC_TYPE = '0032'; // 文書種別
var LO_CDCLS_DOC_TYPE_PR = '0073'; // 文書種別(ライセンスプロダクション)
var LO_CDCLS_PROC_STATUS = '0033'; // 処理種別
var LO_CDCLS_SHOHINSHIYO_EXT = '0038'; // 商品仕様添付ファイル拡張子
var LO_CDCLS_KIKAKU_KYODAKU_EXT = '0039'; // 企画・許諾添付ファイル拡張子
var LO_CDCLS_SHOHIN_HANSOKUBUTSU_HANBETSU = '0040'; // 商品販促物判別
var LO_CDCLS_SHOHIN_SHIYO_MAX = '0041'; // 商品仕様上限
var LO_CDCLS_KYODAKU_SHINSEI_MAX = '0042'; // 許諾申請上限
var LO_CDCLS_KEIYAKUSHO_HYODAI = '0043'; // 契約書表題
var LO_CDCLS_KEIYAKU_STATUS_PR = '0044'; //契約進捗ステータス(ライセンスプロダクション)
var LO_CDCLS_KEIYAKU_KIKAKU_MAX = '0045'; //契約内容企画上限
var LO_CDCLS_KEIYAKU_KYODAKU_MAX = '0046'; //契約内容許諾上限
var LO_CDCLS_KEIYAKU_EXT = '0047'; // 契約内容添付ファイル拡張子
var LO_CDCLS_BNE_COMPANY_CD = '0048'; // BNE会社CD
var LO_CDCLS_KEIYAKU_LIST_SHOW_COLUMN = '0049'; // 契約内容一覧表示項目定義
var LO_CDCLS_KEIYAKU_MANRYO_WARNING_MONTH = '0054'; // 契約満了警告開始月数
var LO_CDCLS_KEIYAKU_ENCHO_CLS_PR = '0055'; // 契約延長区分(ライセンスプロダクション)
var LO_CDCLS_RINGI_URL = '0056'; // 稟議申請WF URL
var LO_CDCLS_ZACRO_URL = '0057'; // ZACRO URL
var LO_CDCLS_KEIYAKU_ENCHO_CLS_LI = '0058'; // 契約延長区分(ライセンシー)
var LO_CDCLS_KEIYAKU_STATUS_LI = '0060'; //契約進捗ステータス(ライセンシー)
var LO_CDCLS_KEIYAKU_ENCHO_CLS_CTL = '0061'; // 契約延長区分(選択可否制御)
var LO_CDCLS_TSUIKA_SEISAN_CLS = '0062'; //追加生産区分
var LO_CDCLS_LIST_STATUS_ORDER_PR = '0063'; // 検索結果ステータス表示順序
var LO_CDCLS_BANADIUM_FORMAT_VERSION = '0064'; // 検索結果ステータス表示順序
var LO_CDCLS_KEIYAKUSHO_BAITAI = '0065'; // 契約書媒体
var LO_CDCLS_MYDOC_LIST_ORDER_KIKAKU_STATUS = '0066'; // MY文書一覧_企画ステータス_表示順
var LO_CDCLS_MYDOC_LIST_ORDER_KYODAKU_STATUS = '0067'; // MY文書一覧_許諾ステータス_表示順
var LO_CDCLS_MYDOC_LIST_ORDER_KAWARI_STATUS = '0069'; // MY文書一覧_代わり承認ステータス_表示順
var LO_CDCLS_LOCALIZE_SHOHIN_UMU = '0068'; // ローカライズ商品名の有無
var LO_CDCLS_KAWARI_STATUS = '0069'; // 代わり承認ステータス
var LO_CDCLS_KAWARI_KIKAKU_CLS = '0070'; // 代わり承認企画種別
var LO_CDCLS_KAWARI_DOC_TYPE = '0071'; // 代わり承認文書種別
var LO_CDCLS_KAIGAI_HANSHA = '0072'; // 海外販社
var LO_CDCLS_CURRENCY = '0074'; // 通貨単位
var LO_CDCLS_KIKAKU_LIST_SHOW_COLUMN = '0075'; // 企画内容一覧表示項目定義
var LO_CDCLS_KYODAKU_LIST_SHOW_COLUMN = '0076'; // 許諾内容一覧表示項目定義
var LO_CDCLS_KAWARI_LIST_SHOW_COLUMN = '0077'; // 代わり承認内容一覧表示項目定義
var LO_CDCLS_KAWARI_EXT = '0039'; // 企画・許諾添付ファイル拡張子
var LO_CDCLS_KAWARI_DETAIL_MAX = '0079'; // 代わり承認詳細上限
var LO_CDCLS_KAWARI_KANREN_MAX = '0080'; // 代わり承認詳細上限
var LO_CDCLS_FILE_LIST = '0081'; // ファイル一覧
var LO_CDCLS_SHINSEI_CLS = '0082'; // 申請区分（アカウント申請）
var LO_CDCLS_DOWNLOAD_CATEGORY = '0083'; // ダウンロードカテゴリ
var LO_CDCLS_DOWNLOAD_OSHIRASE = '0084'; // ダウンロードお知らせ
var LO_CDCLS_RIYO_GROUP = '0085'; // 利用グループ
var LO_CDCLS_ACCOUNT_LIST_SHOW_COLUMN = '0086'; // アカウント一覧表示項目定義
var LO_CDCLS_DOWNLOAD_KOUKAI_HANI = '0087'; // ダウンロード一覧公開範囲
var LO_CDCLS_OUT_OF_TIME_MESSAGE = '0088'; // 時間外メッセージ
var LO_CDCLS_OTHER_MESSAGE = '0089'; // その他
var LO_CDCLS_SEND_MAIL_ATESAKI_LIMIT = '0090'; // メール送信宛先上限
var LO_CDCLS_SEND_MAIL_MODE = '0091'; // 送信モード
var LO_CDCLS_SEND_MAIL_FROM = '0092'; // FROM
var LO_CDCLS_SHANAI_ACCOUNT_ADMIN_GROUP = '0094'; //社内アカウント管理者グループ
var LO_CDCLS_ACCOUNT_SHINSEI_STATUS = '0095'; // 代わり承認ステータス
var LO_CDCLS_EIZO_CATEGORY = '0096'; // 映像カテゴリ
var LO_CDCLS_KAKIOROSI_KIBOU_UMU_EIZO = '0097'; // 描き下ろし希望有無(ゲームコラボ）
var LO_CDCLS_VOICE_KIBO = '0098'; // ボイス希望有無(ゲームコラボ）
var LO_CDCLS_KYODAKU_FLOW_CHANGE_FROM = '0099'; // 許諾フロー変更開始日


// ステータス
var LO_STATUS_ICHIJI_HOZON = "1";	// 一時保存
var LO_STATUS_TEISHUTSU = "2";		// 提出済（受付待ち）
var LO_STATUS_SHUSEI_IRAI = "3";	// 修正依頼
var LO_STATUS_SHINSEI = "4";		// 申請中（社内審査中）
var LO_STATUS_SASHIMODOSHI = "5";	// 差戻し
var LO_STATUS_SHONIN = "6";			// 承認済（社内審査中）
var LO_STATUS_JITAI = "7";			// 辞退
var LO_STATUS_HIKETSU = "8";		// 否決
var LO_STATUS_KANRYO = "9";			// 完了
var LO_STATUS_IKO = "10";			// 移行
var LO_STATUS_SHONIN_OK = "11";		// 承認済（社内承認OK）

// 代わり承認のみ　既存フローの辞退と同じ扱いとする
var LO_STATUS_SAKUJO = "7";			// 削除

// 契約ステータス
var LO_KEIYAKU_STATUS_DRAFT = "033";        // ドラフト作成中
var LO_KEIYAKU_STATUS_ACCT_WAITING = "087"; // 計上待ち
var LO_KEIYAKU_STATUS_ACCT_REQUEST = "091"; // BNE計上依頼
var LO_KEIYAKU_STATUS_KANRYO = "088";       // 完了

// 契約書表題
var LO_KEIYAKUSHO_HYODAI_ENCHO = '04'; // 契約期間延長覚書

// 文書種別
var LO_DOC_CLS_MY = "0";		// MY文書
var LO_DOC_CLS_KIKAKU = "1";	// 企画
var LO_DOC_CLS_KYODAKU = "2";	// 許諾
var LO_DOC_CLS_KEIYAKU = "3";	// 契約ドラフト
var LO_DOC_CLS_KAWARI = "4";	// 代わり承認WF(代表)
var LO_DOC_CLS_KAWARI_KIKAKU = "4";	// 代わり承認WF企画
var LO_DOC_CLS_KAWARI_KYODAKU = "5";	// 代わり承認WF企画
var LO_DOC_CLS_KAWARI_LICENSE_PROPOSAL = "6";	// 代わり承認WFライセンスプロポーサル
var LO_DOC_CLS_ACCOUNT = "7";	// アカウント申請
var LO_DOC_CLS_ACCOUNT_SHANAI = "8";	// アカウント申請(社内）

// 企画種別
var LO_KIKAKU_SHUBETSU_ITEM = "1";	// 企画商品
var LO_KIKAKU_SHUBETSU_MUSIC = "2";	// 企画楽曲
var LO_KIKAKU_SHUBETSU_EVENT = "3";	// 企画イベント
var LO_KIKAKU_SHUBETSU_EIZO = "4";  // 企画映像

// 許諾種別
var LO_KYODAKU_SHUBETSU_NEW = "1";	// 新規
var LO_KYODAKU_SHUBETSU_ADD = "2";	// 追加

// 契約種別
var LO_KEIYAKU_SHUBETSU_KOBETSU = '1'; // 個別
var LO_KEIYAKU_SHUBETSU_HOUKATSU = '2'; // 包括

// 処理状況
var LO_PROC_TYPE_MISHORI = "1";	// 未処理
var LO_PROC_TYPE_SHORIZUMI = "2";	// 処理済
var LO_PROC_TYPE_KANRYO = "3";	// 完了

// OK or NG
var LO_OKNG_MIKAKUNIN = "0";	// 未確認
var LO_OKNG_OK = "1";			// OK
var LO_OKNG_NG = "2";			// NG

// 契約内容タスク処理区分
var LO_TASK_SHORI_CLS_MISHORI = "0:未処理";
var LO_TASK_SHORI_CLS_SHORIZUMI = "1:処理済";
var LO_TASK_SHORI_CLS_CANCEL = "9:キャンセル";

// タスク対象タイプ
var LO_TASK_TARGET_TYPE_PUBLIC_GROUP = "public_group";
var LO_TASK_TARGET_TYPE_USER = "user";
var LO_TASK_TARGET_TYPE_COMPANY = "company";

// プリセット対象タイプ
var LO_PRESET_TARGET_TYPE_MATTER = "matter";
var LO_PRESET_TARGET_TYPE_PUBLIC_GROUP = "public_group";
var LO_PRESET_TARGET_TYPE_USER = "user";
var LO_PRESET_TARGET_TYPE_LICENSEE = "licensee";

// 受信タイプ
var LO_RECIPIENT_TYPE_TO = "TO";
var LO_RECIPIENT_TYPE_CC = "CC";

// 契約延長区分
var LO_KEIYAKU_ENCHO_CLS_UNANSWERED = '001'; // 未回答状態
var LO_KEIYAKU_ENCHO_CLS_EXTEND_LI = '002'; // する
var LO_KEIYAKU_ENCHO_CLS_CLOSE_LI = '003'; // しない
var LO_KEIYAKU_ENCHO_CLS_EXTEND_PR = '004'; // する
var LO_KEIYAKU_ENCHO_CLS_CLOSE_PR = '005'; // しない


// ルート定義【企画】
var LO_ROUTE_KIKAKU = 'lo_route_kikaku'; //ルートID
var LO_FLOW_KIKAKU = 'lo_flow_kikaku';  //フローID
var LO_NODE_APPLY = 'lo_node_apply'; //申請(ライセンシー)
var LO_NODE_APPR_0 = 'lo_node_appr_0'; //承認(BNE担当)
var LO_NODE_APPR_1 = 'lo_node_appr_1'; //承認1
var LO_NODE_APPR_2 = 'lo_node_appr_2'; //承認2
var LO_NODE_APPR_LAST = 'lo_node_appr_last'; //最終承認
var LO_NODE_APPR_MARK = 'lo_node_mark'; //商標

// ルート定義【許諾】
var LO_ROUTE_KYODAKU = 'lo_route_kyodaku'; //ルートID
var LO_FLOW_KYODAKU = 'lo_flow_kyodaku';  //フローID
var LO_NODE_APPR_3 = 'lo_node_appr_3'; //承認3
var LO_NODE_KEIYAKU = 'lo_node_keiyaku'; //契約担当
var LO_NODE_KEIJOU = 'lo_node_keijou'; //計上担当

// ルート定義【代わり承認】
var LO_ROUTE_KAWARI = 'lo_route_kawari'; //ルートID
var LO_FLOW_KAWARI = 'lo_flow_kawari';  //フローID
var LO_NODE_KIAN = 'lo_node_kian'; //起案
var LO_NODE_APPR_4 = 'lo_node_appr_4'; //承認4
var LO_NODE_APPR_5 = 'lo_node_appr_5'; //承認5
var LO_NODE_LAST_CONFIRM = 'lo_node_last_confirm'; //完了確認

// ルート定義【アカウント申請】
var LO_ROUTE_ACCOUNT = 'lo_route_account'; //ルートID
var LO_FLOW_ACCOUNT = 'lo_flow_account';  //フローID
var LO_NODE_SYS = 'lo_node_sys'; //起案

var LO_ROUTE_ACCOUNT_BNE = 'lo_route_account_bne'; //ルートID
var LO_FLOW_ACCOUNT_BNE = 'lo_flow_account_bne';  //フローID

// ルート定義【社内アカウント申請】
var LO_FLOW_ACCOUNT_SHANAI = 'lo_flow_account_in';  //フローID
/*
var LO_NODE_KIAN = 'lo_node_kian'; //起案
var LO_NODE_APPR_4 = 'lo_node_appr_4'; //承認4
var LO_NODE_APPR_5 = 'lo_node_appr_5'; //承認5
var LO_NODE_LAST_CONFIRM = 'lo_node_last_confirm'; //完了確認
*/
// WFノード名称
var LO_NAME_NODE_APPLY = "申請";
var LO_NAME_NODE_APPR_0 = "BNE担当";
var LO_NAME_NODE_APPR_1 = "承認１";
var LO_NAME_NODE_APPR_2 = "承認２";
var LO_NAME_NODE_APPR_3 = "承認３";
var LO_NAME_NODE_APPR_LAST = "BNE担当（最終）";
var LO_NAME_NODE_APPR_MARK = "商標担当";
var LO_NAME_NODE_KEIYAKU = "契約担当";
var LO_NAME_NODE_KEIJOU = "計上担当";

//WFノード名称(代わり承認）
var LO_NAME_NODE_APPLY_KAWARI = "入力";
var LO_NAME_NODE_KIAN = "起案";
var LO_NAME_NODE_APPR_4 = "承認４";
var LO_NAME_NODE_APPR_5 = "承認５";
var LO_NAME_NODE_LAST_CONFIRM = "完了確認";

//WFノード名称(アカウント申請）
var LO_NAME_NODE_ACCOUNT_APPLY = "申請者";
var LO_NAME_NODE_ACCOUNT_APPR_0 = "BNE担当";
var LO_NAME_NODE_ACCOUNT_APPR_1 = "承認者１";
var LO_NAME_NODE_ACCOUNT_APPR_2 = "承認者２";
var LO_NAME_NODE_ACCOUNT_SYS = "システム担当者";

// メール送信先ユーザグループ
var LO_MAIL_GROUP_KIAN = 'lo_mail_kian'; //起案通知先
var LO_MAIL_GROUP_SHOHYO = 'lo_mail_shohyo'; //商標担当
var LO_MAIL_GROUP_END = 'lo_mail_end'; //完了通知先
var LO_MAIL_GROUP_KEIYAKU = 'lo_mail_keiyaku'; //契約通知先
var LO_MAIL_GROUP_KEIJOU = 'lo_mail_keijou'; //計上担当通知先

// メール定義ID
var LO_MAIL_ID_PROC = 'lo_processing'; //処理依頼
var LO_MAIL_ID_CONFFIRM = 'lo_confirm'; //確認依頼
var LO_MAIL_ID_END = 'lo_end_confirm'; //完了通知
var LO_MAIL_ID_END_LICENSEE = 'lo_end_licensee'; //完了通知(ライセンシー用)
var LO_MAIL_ID_KEIYAKU = 'lo_contract'; //契約依頼
var LO_MAIL_ID_SHOHYO = 'lo_trademark'; //商標依頼
var LO_MAIL_ID_END_AFTER = 'lo_end_after_comment'; //完了後コメント通知
var LO_MAIL_ID_SHOHYO_END = 'lo_trademark_end'; //商標依頼
var LO_MAIL_ID_SUBMIT = 'lo_submit_confirm'; //提出通知(ライセンシーから提出)
var LO_MAIL_ID_PRE = 'lo_pre_confirm'; //事前通知(起案時通知)
var LO_MAIL_ID_KEIYAKU_NEW = 'lo_contract_new'; //契約内容作成通知
var LO_MAIL_ID_KEIYAKU_UPDATE = 'lo_contract_update'; //契約内容更新通知
var LO_MAIL_ID_KEIYAKU_STATUS_UPDATE = 'lo_contract_status'; //契約内容ステータス更新通知
var LO_MAIL_ID_ZACRO = 'lo_zacro'; //商標ZACRO（依頼）
var LO_MAIL_ID_ZACRO_END = 'lo_zacro_end'; //商標ZACRO(完了)

// メール定義ID(代わり承認）
var LO_KAWARI_MAIL_ID_PROC = 'lo_kw_processing'; //処理依頼
var LO_KAWARI_MAIL_ID_CONFFIRM = 'lo_kw_confirm'; //確認依頼
var LO_KAWARI_MAIL_ID_END = 'lo_kw_end_confirm'; //完了通知
var LO_KAWARI_MAIL_ID_KEIYAKU = 'lo_kw_contract'; //契約依頼
var LO_KAWARI_MAIL_ID_KEIYAKU_NEW = 'lo_kw_contract_new'; //契約内容作成通知
var LO_KAWARI_MAIL_ID_SUBMIT = 'lo_kw_submit_confirm'; //提出通知
var LO_KAWARI_MAIL_ID_PRE = 'lo_kw_pre_confirm'; //事前通知(起案時通知)
var LO_KAWARI_MAIL_ID_ZACRO_END = 'lo_kw_zacro_end'; //商標ZACRO(完了)

// メール定義ID(アカウント申請）
var LO_ACCOUNT_MAIL_ID_PROC_BNE = 'lo_acc_processing1'; //処理依頼(社内）
var LO_ACCOUNT_MAIL_ID_PROC_LICENSEE = 'lo_acc_processing2'; //処理依頼(社外）
var LO_ACCOUNT_MAIL_ID_CONFIRM = 'lo_acc_confirm'; //確認依頼
var LO_ACCOUNT_MAIL_ID_END = 'lo_acc_end_confirm'; //完了通知
var LO_ACCOUNT_MAIL_ID_SUBMIT_BNE = 'lo_acc_submit1'; //提出通知(社内）
var LO_ACCOUNT_MAIL_ID_SUBMIT_LICENSEE = 'lo_acc_submit2'; //提出通知(社外）
var LO_ACCOUNT_MAIL_ID_PRE = 'lo_acc_pre_confirm'; //事前通知(起案時通知)
var LO_ACCOUNT_MAIL_ID_USER = 'lo_acc_user_notice'; //作成ユーザへの通知
// タイトル【その他】
var LO_TITLE_CD_OTHER = '___';

// 各チケットID接頭辞
var LO_TICKET_ID_HEAD_KIKAKU = 'KK';	//企画
var LO_TICKET_ID_HEAD_KYODAKU = 'KD';	//許諾
var LO_TICKET_ID_HEAD_KEIYAKU = 'KY';	//契約ドラフト

var LO_TICKET_ID_HEAD_KAWARI = 'KW';	//代わり承認共通　
var LO_TICKET_ID_HEAD_KAWARI_KIKAKU = 'KKK';	//代わり承認企画
var LO_TICKET_ID_HEAD_KAWARI_KYODAKU = 'KKY';	//代わり承認許諾
var LO_TICKET_ID_HEAD_KAWARI_LICENSE_PROPOSAL = 'KLP';	//代わり承認ライセンスプロポーザル

var LO_TICKET_ID_HEAD_ACCOUNT_SHINSEI = 'AS';	//アカウント申請
var LO_TICKET_ID_HEAD_SHANAI_ACCOUNT_SHINSEI = 'SS';	//社内アカウント申請

// ダミーの会社コード
var LO_DUMMY_KAISHA_CD = '********** DUMMY **********';

var LO_CURRENCY_CD_DEFAULT = '13';	// 通貨単位デフォルトJPY
var LO_KIKAKU_SHOHIN_CATEGORY_OTHER = '25';	//商品カテゴリーその他
var LO_KAWARI_GOKUHI_FLG_ON = '1';	//極秘フラグON
var LO_KAWARI_GOKUHI_FLG_OFF = '0';	//極秘フラグOFF

// ファイル一覧(lo_m_file)のfile_id
var LO_FILE_ID_GAIYO = '3'; //概要説明ファイルのファイルID
var LO_FILE_ID_MANUAL_SHANAI = '5'; //社内向けマニュアル
var LO_FILE_ID_KIHON_RULE = '16'; //ライセンス基本ルール

var LO_SHINSE_CLS_ADD = '1'; //申請区分：追加
var LO_SHINSE_CLS_CHANGE = '2'; //申請区分：変更
var LO_SHINSE_CLS_DELETE = '3'; //申請区分：削除

//メール送信機能ヘッダー
var LO_SEND_MAIL_ID_FROM = '1'; // FROM
var LO_SEND_MAIL_ID_REPLY = '2'; // Reply to

// 利用グループ
var LO_RIYO_GROUP_IP_TANTO = '1'; // 利用グループ：IP担当者
var LO_RIYO_GROUP_KEIYAKU_TANTO = '2'; // 利用グループ：契約担当者
var LO_RIYO_GROUP_KEIJO_TANTO = '3'; // 利用グループ：計上担当者
var LO_RIYO_GROUP_SHOHYO_TANTO = '4'; // 利用グループ：商標担当者
var LO_RIYO_GROUP_OTHER = '5'; // 利用グループ：参照のみ
var LO_RIYO_GROUP_KAWARI_INPUT = '6'; // 利用グループ：代わり承認入力