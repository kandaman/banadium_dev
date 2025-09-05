package imart.mail.data;

/**
 * 承認完了メール（{@code /wf/accept }）用のフィールドセット。
 */
public class AcceptFieldset {
	/** 承認完了メール：申請書種別 */
	public String type;
	/** 承認完了メール：商品名 */
	public String title_nm;
	/** 承認完了メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** 承認完了メール：起案者 */
	public String kian_user_nm;
	/** 承認完了メール：起案部署 */
	public String kian_busho_nm;
	/** 承認完了メール：起案日 */
	public String kian_date;
	/** 承認完了メール：処理者 */
	public String shonin_user_nm;
	/** 承認完了メール：処理部署 */
	public String shonin_busho_nm;
	/** 承認完了メール：処理日 */
	public String shonin_date;
	/** 承認完了メール：案件一覧画面URL */
	public String anken_all_url;
	/** 承認完了メール：MY文書画面URL */
	public String my_documents_url;
}