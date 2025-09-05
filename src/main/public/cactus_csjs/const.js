

const TYPE_APPLY_SINKIKAKU = '1'; // 申請種類:新企画申請
const TYPE_APPLY_HANSOKU = '2'; // 申請種類:販促物申請　
const TYPE_APPLY_DLC = '3'; // 申請種類:DLC申請

const CD_DIV_NE = '1'; // 事業部:NE
const CD_DIV_CS = '2'; // 事業部:CS
const CD_DIV_BNAM = '3'; // 事業部:BNEM
const CD_DIV_LE = '4'; // 事業部:LE
const CD_DIV_SP = '5'; // 事業部:SP
const CD_DIV_BXD = '6'; // 事業部:BXD
const CD_DIV_BNO = '7'; // 事業部:BNO




const CD_KUNI_JPN = 'JP'; // 地域:日本　
const CD_TUKA_JPN = 'JPY'; // 通貨:日本円
const CD_TUKA_OTHER = 'XXX'; // 通貨:そのた

const CD_DLC_ON = '1'; // ダウンロード有無：あり
const CD_DLC_NON = '2'; // ダウンロード有無：なし

const CD_PRICE_OTHER = '1'; // 価格帯：その他
const CD_PRICE_DLFREE = '2';// 価格帯：ダウンロード無料/一部アイテム課金有


const CD_PLATFROM_OTHER = '99'; // プラットフォーム:そのた

// 行追加最大数
const ADD_ROW_MAX = 100;

// 文言
const LBL_BIKO_DEFAULT = '■コンセプト/備考';
const LBL_BIKO_HANSOKU = '■内容/備考';


// ストレージパス
const PATH_PUBLIC_STORAGE = '/imart/upload/'; //ファイル保存フォルダ
const PATH_SESSION_STORAGE = '/imart/upload/'; //ファイル一時保存フォルダ

// アップロードファイル
const MAX_FILE_LENGTH = 100;
const MAX_FILE_SIZE = 52428800;

// ノードID（ルート定義で指定したＩＤ）
const ID_NODE_SINSEI = 'planApplNode_01'; //企画申請　
const ID_NODE_SHONIN = 'planApplNode_02'; //企画承認　
const ID_NODE_UKETUKE = 'planApplNode_03'; //受付担当　
const ID_NODE_HANMOTO = 'planApplNode_04'; //版権担当(縦ノード展開前)


// 確認メッセージ
const MSG_CLOSE = '画面を閉じます。よろしいですか？';
const MSG_CLOSE_TITEL = '確認';
