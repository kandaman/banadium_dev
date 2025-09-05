package imart.mail.data;

/**
 * 版権担当者用処理依頼メール（{@code /wf/hanken}）用のフィールドセット
 */
public class HankenFieldset {
	/** 版権担当者用処理依頼メール：申請書種別 */
	public String type;
	/** 版権担当者用処理依頼メール：商品名 */
	public String title_nm;
	/** 版権担当者用処理依頼メール：版元名 */
	public String hanmoto_nm;
	/** 版権担当者用処理依頼メール：伝票番号（申請番号） */
	public String shinsei_no;
	/** 版権担当者用処理依頼メール：起案者 */
	public String kian_user_nm;
	/** 版権担当者用処理依頼メール：起案部署 */
	public String kian_busho_nm;
	/** 版権担当者用処理依頼メール：起案日 */
	public String kian_date;
	/** 版権担当者用処理依頼メール：次の処理画面URL */
	public String next_process_url;
	/** 版権担当者用処理依頼メール：案件一覧画面URL */
	public String anken_all_url;
	/** 版権担当者用処理依頼メール：MY文書画面URL */
	public String my_documents_url;
}