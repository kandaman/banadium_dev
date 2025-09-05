package imart.mail.data;

/**
 * 差戻通知メール（{@code /wf/rollback}）用のフィールドセット。
 */
public class RollbackFieldset {
	/** 差戻通知メール：申請書種別 */
	public String type;
	/** 差戻通知メール：商品名 */
	public String title_nm;
	/** 差戻通知メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** 差戻通知メール：起案者 */
	public String kian_user_nm;
	/** 差戻通知メール：起案部署 */
	public String kian_busho_nm;
	/** 差戻通知メール：起案日 */
	public String kian_date;
	/** 差戻通知メール：処理者 */
	public String rollback_user_nm;
	/** 差戻通知メール：処理部署 */
	public String rollback_busho_nm;
	/** 差戻通知メール：処理日 */
	public String rollback_date;
	/** 差戻通知メール：社内共有事項 */
	public String note;
	/** 差戻通知メール：次の処理画面URL */
	public String next_process_url;
	/** 差戻通知メール：案件一覧画面URL */
	public String anken_all_url;
	/** 差戻通知メール：MY文書画面URL */
	public String my_documents_url;
}