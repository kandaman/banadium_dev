package imart.mail.data;

/**
 * WF完了通知メール（{@code /wf/terminate}）用のフィールドセット。
 */
public class TerminateFieldset {
	/** WF完了通知メール：申請書種別 */
	public String type;
	/** WF完了通知メール：商品名 */
	public String title_nm;
	/** WF完了通知メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** WF完了通知メール：起案者 */
	public String kian_user_nm;
	/** WF完了通知メール：起案部署 */
	public String kian_busho_nm;
	/** WF完了通知メール：起案日 */
	public String kian_date;
	/** WF完了通知メール：処理結果 */
	public String result;
	/** WF完了通知メール：WF完了日 */
	public String terminate_date;
	/** WF完了通知メール：案件一覧画面URL */
	public String anken_all_url;
	/** WF完了通知メール：MY文書画面URL */
	public String my_documents_url;
}