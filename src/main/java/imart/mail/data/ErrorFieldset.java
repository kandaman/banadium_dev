package imart.mail.data;

/**
 * エラー通知メール（{@code /wf/error}）用のフィールドセット。
 */
public class ErrorFieldset {
	/** エラー通知メール：申請書種別 */
	public String type;
	/** エラー通知メール：商品名 */
	public String title_nm;
	/** エラー通知メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** エラー通知メール：起案者 */
	public String kian_user_nm;
	/** エラー通知メール：起案部署 */
	public String kian_busho_nm;
	/** エラー通知メール：起案日 */
	public String kian_date;
	/** エラー通知メール：エラー発生日 */
	public String error_date;
	/** エラー通知メール：エラー内容 */
	public String error_detail;
	/** エラー通知メール：案件一覧画面URL */
	public String anken_all_url;
	/** エラー通知メール：MY文書画面URL */
	public String my_documents_url;
}