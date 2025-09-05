// サーバー側定数設定

// ユーザ・グループ区分
var KBN_USER = '01'; //ユーザ
var KBN_GROUP = '02'; //グループ　

// ノード区分
var KBN_NODE_SHONIN = '01'; //企画承認者　
var KBN_NODE_UKETUKE = '02'; //受付担当者　
var KBN_NODE_HANMOTO = '03'; //版権担当者

// ノードID（ルート定義で指定したＩＤ）
var ID_NODE_SINSEI = 'planApplNode_01'; //企画申請　
var ID_NODE_SHONIN = 'planApplNode_02'; //企画承認　
var ID_NODE_UKETUKE = 'planApplNode_03'; //受付担当　
var ID_NODE_HANMOTO = 'planApplNode_04'; //版権担当

// 申請書種類
var TYPE_APPLY_SINKIKAKU = '1'; // 新企画申請
var TYPE_APPLY_HANSOKU = '2'; // 販促物申請　
var TYPE_APPLY_DLC = '3'; // DLC申請

// 文言
var LBL_ITEMNAME_SINKIKAKU = 'タイトル名';
var LBL_ITEMNAME_HANSOKU = '企画名/申請販促物';
var LBL_ITEMNAME_DLC = '件名';

//　コード値
var CD_KUNI_JPN = 'JP'; // 地域:日本　
var CD_KUNI_OTHER = '99'; // 地域:そのた　
var CD_TUKA_JPN = '1'; // 通貨:日本円
var CD_TUKA_OTHER = 'XXX'; // 通貨:そのた
var CD_PLATFROM_OTHER = '99'; // プラットフォーム:そのた

var CD_PRICE_OTHER = '1'; // 価格帯：その他
var CD_PRICE_DLFREE = '2';// 価格帯：ダウンロード無料/一部アイテム課金有

var CD_STATUSKBN_SAVE = '00'; // ステータス区分：一時保存
var CD_STATUSKBN_APPLY = '01'; // ステータス区分：事業部承認待ち
var CD_STATUSKBN_SHONIN = '02'; // ステータス区分：メディア部受付待ち
var CD_STATUSKBN_UKETUKE = '03'; // ステータス区分：版権元確認中
var CD_STATUSKBN_END = '04'; // ステータス区分：完了

var CD_TOUROKU_OK = '04'; // 版元ステータス区分：登録ＯＫ
var CD_TOUROKU_NG = '05'; // 版元ステータス区分：登録ＮＧ
var CD_TOUROKU_PARTNG = '06'; // 版元ステータス区分：登録一部ＮＧ

var CD_FILE_SHIRYO = '01'; // ファイル区分：企画書/資料
var CD_FILE_CHOHYO = '02'; // ファイル区分：帳票


//ストレージパス
var PATH_PUBLIC_STORAGE = '/imart/upload/'; //ファイル保存フォルダ
var PATH_SESSION_STORAGE = '/imart/upload/'; //ファイル一時保存フォルダ
var PATH_PUBLIC_TEMPLATE = '/imart/template/'; //帳票テンプレートフォルダ


//ノード、パス設定
//var APPLY_FROW_ID = '8eme285inx1jpvz'; //申請ワークフローＩＤ 　ローカル
var APPLY_FROW_ID = '8emws4qufnz18vf'; //申請ワークフローＩＤ
var APPLY_NODE_ID = 'planApplNode_01'; //申請開始ノード


//var CD_JPN = 'JPN'; // コード値:日本　
//var CD_JPN2 = 'JPN2'; // コード値:日本　


