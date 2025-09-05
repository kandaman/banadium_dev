package imart.mail.data;

/**
 * 処理依頼メール（{@code /wf/forward}）用のフィールドセット。
 */
public class ForwardFieldset {
	/** 処理依頼メール：申請書種別 */
	public String type;
	/** 処理依頼メール：商品名 */
	public String title_nm;
	/** 処理依頼メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** 処理依頼メール：起案者 */
	public String kian_user_nm;
	/** 処理依頼メール：起案部署 */
	public String kian_busho_nm;
	/** 処理依頼メール：起案日 */
	public String kian_date;
	/** 処理依頼メール：社内共有事項 */
	public String note;
	/** 処理依頼メール：次の処理画面URL */
	public String next_process_url;
	/** 処理依頼メール：案件一覧画面URL */
	public String anken_all_url;
	/** 処理依頼メール：MY文書画面URL */
	public String my_documents_url;
}