package imart.mail;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import imart.mail.data.AcceptFieldset;
import imart.mail.data.AcceptHankenFieldset;
import imart.mail.data.CancelFieldset;
import imart.mail.data.ErrorFieldset;
import imart.mail.data.ForwardFieldset;
import imart.mail.data.HankenFieldset;
import imart.mail.data.RollbackFieldset;
import imart.mail.data.TerminateFieldset;
import jp.co.intra_mart.foundation.mail.template.MailBase;
import jp.co.intra_mart.foundation.mail.template.MailTemplate;

public class WorkflowMail {
	
	/** 差出人 */
	@Deprecated // システム固定になるなら持たせておく意味がなくなる。
	private String from;
	
	/** 宛先（To） */
	private List<String> to = new ArrayList<>();
	/** 宛先（CC） */
	private List<String> cc = new ArrayList<>();
	
	// 将来的な用途のため
	/** 添付ファイル */
	private List<String> attachFiles = new ArrayList<>();
	
	/** 件名 */
	private String subject;
	/** 本文 */
	private String body;
	
	
	public String getFrom() {
		return from;
	}

	public void setFrom(String from) {
		this.from = from;
	}

	public List<String> getTo() {
		return to;
	}
	
	public void setTo(List<String> to) {
		this.to = to;
	}
	
	public List<String> getCc() {
		return cc;
	}
	
	public void setCc(List<String> cc) {
		this.cc = cc;
	}
	
	public List<String> getAttachFiles() {
		return attachFiles;
	}

	public void setAttachFiles(List<String> attachFiles) {
		this.attachFiles = attachFiles;
	}

	public String getSubject() {
		return subject;
	}
	
	public void setSubject(String subject) {
		this.subject = subject;
	}
	
	public String getBody() {
		return body;
	}
	
	public void setBody(String body) {
		this.body = body;
	}
	
	/**
	 * プライベートコンストラクタ
	 * @param subject 件名
	 * @param body 本文
	 */
	private WorkflowMail(String subject, String body) {
		this.subject = subject;
		this.body = body;
	}
	
	public static WorkflowMail forward(ForwardFieldset fieldset) {
		
		String path = "wf/forward";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "note", fieldset.note ); // 社内共有事項
		parameter.put( "next_process_url", fieldset.next_process_url ); // 次の処理画面URL
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	
	public static WorkflowMail hanken(HankenFieldset fieldset) {
		
		String path = "wf/hanken";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "hanmoto_nm", fieldset.hanmoto_nm ); // 版元名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "next_process_url", fieldset.next_process_url ); // 次の処理画面URL
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail accept(AcceptFieldset fieldset) {
		
		String path = "wf/accept";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "shonin_user_nm", fieldset.shonin_user_nm ); // 処理者
		parameter.put( "shonin_busho_nm", parenthesis( fieldset.shonin_busho_nm ) ); // 処理部署
		parameter.put( "shonin_date", fieldset.shonin_date ); // 処理日
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail acceptHanken(AcceptHankenFieldset fieldset) {
		
		String path = "wf/accepthanken";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "hanmoto_nm", fieldset.hanmoto_nm); // 版元名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "shonin_user_nm", fieldset.shonin_user_nm ); // 処理者
		parameter.put( "shonin_busho_nm", parenthesis( fieldset.shonin_busho_nm ) ); // 処理部署
		parameter.put( "shonin_date", fieldset.shonin_date ); // 処理日
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail terminate(TerminateFieldset fieldset) {
		
		String path = "wf/terminate";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "result", fieldset.result ); // 処理結果
		parameter.put( "terminate_date", fieldset.terminate_date ); // WF完了日
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail rollback(RollbackFieldset fieldset) {
		
		String path = "wf/rollback";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "rollback_user_nm", fieldset.rollback_user_nm ); // 処理者
		parameter.put( "rollback_busho_nm", parenthesis( fieldset.rollback_busho_nm ) ); // 処理部署
		parameter.put( "rollback_date", fieldset.rollback_date ); // 処理日
		parameter.put( "note", fieldset.note ); // 社内共有事項
		parameter.put( "next_process_url", fieldset.next_process_url ); // 次の処理画面URL
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail cancel(CancelFieldset fieldset) {
		
		String path = "wf/cancel";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "cancel_user_nm", fieldset.cancel_user_nm ); // 処理者
		parameter.put( "cancel_busho_nm", parenthesis( fieldset.cancel_busho_nm ) ); // 処理部署
		parameter.put( "cancel_date", fieldset.cancel_date ); // 処理日
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	public static WorkflowMail error(ErrorFieldset fieldset) {
		
		String path = "wf/error";
		Locale locale = getLocale();
		
		Map<String, String> parameter = new HashMap<>();
		parameter.put( "type", fieldset.type ); // 申請書種別
		parameter.put( "title_nm", fieldset.title_nm ); // 商品名
		parameter.put( "shinsei_no", fieldset.shinsei_no ); // 伝票番号（申請番号）
		parameter.put( "kian_user_nm", fieldset.kian_user_nm ); // 起案者
		parameter.put( "kian_busho_nm", parenthesis( fieldset.kian_busho_nm ) ); // 起案部署
		parameter.put( "kian_date", fieldset.kian_date ); // 起案日
		parameter.put( "error_date", fieldset.error_date ); // エラー発生日
		parameter.put( "error_detail", fieldset.error_detail ); // エラー内容
		parameter.put( "anken_all_url", fieldset.anken_all_url ); // 案件一覧画面URL
		parameter.put( "my_documents_url", fieldset.my_documents_url ); // MY文書画面URL
		
		
		// メールテンプレートを使用して「件名」と「本文」を生成。
		MailBase mail = MailTemplate.process( path, locale, parameter );
		String subject = mail.getSubject();
		String body = mail.getBody().getText();
		
		return new WorkflowMail( subject, body );
	}
	
	private static Locale getLocale() {
		// 日本語用のメールテンプレートしか用意されていないので、現状では日本固定にする。
		// 日本以外が必要になった時点でテンプレートと合わせてセッション化か何か検討して下さい。
		return Locale.JAPAN;
	}
	
	private static final String parenthesis( String value ) {
		return StringUtils.isEmpty( value ) ? value : ( "（" + value + "）" );
	}
}
