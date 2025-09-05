package imart.mail.data;

/**
 * 取戻通知メール（{@code /wf/cancel}）用のフィールドセット。
 */
public class CancelFieldset {
	/** 取戻通知メール：申請書種別 */
	public String type;
	/** 取戻通知メール：商品名 */
	public String title_nm;
	/** 取戻通知メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** 取戻通知メール：起案者 */
	public String kian_user_nm;
	/** 取戻通知メール：起案部署 */
	public String kian_busho_nm;
	/** 取戻通知メール：起案日 */
	public String kian_date;
	/** 取戻通知メール：処理者 */
	public String cancel_user_nm;
	/** 取戻通知メール：処理部署 */
	public String cancel_busho_nm;
	/** 取戻通知メール：処理日 */
	public String cancel_date;
	/** 取戻通知メール：案件一覧画面URL */
	public String anken_all_url;
	/** 取戻通知メール：MY文書画面URL */
	public String my_documents_url;
}