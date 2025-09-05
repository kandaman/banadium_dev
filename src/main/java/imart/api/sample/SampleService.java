package imart.api.sample;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.commons.lang3.builder.ToStringBuilder;

import imart.mail.WorkflowMail;
import imart.mail.WorkflowMailBox;
import imart.mail.WorkflowMailQuey;
import imart.mail.WorkflowMailQuey.Context;
import imart.mail.WorkflowMailQuey.MailQueue;
import imart.mail.data.*;
import jp.co.intra_mart.foundation.database.TenantDatabase;
import jp.co.intra_mart.foundation.database.exception.DatabaseException;
import jp.co.intra_mart.foundation.mail.MailSender;
import jp.co.intra_mart.foundation.mail.MailSenderException;
import jp.co.intra_mart.foundation.mail.javamail.JavaMailSender;
import jp.co.intra_mart.foundation.mail.javamail.StandardMail;
import jp.co.intra_mart.foundation.mail.template.MailBase;
import jp.co.intra_mart.foundation.mail.template.MailTemplate;
import jp.co.intra_mart.foundation.web_api_maker.annotation.*;

@IMAuthentication
public class SampleService {
	
	// URL - http://localhost:8080/imart/sample/hoge
	@Path("/sample/hoge")
	@GET
	public void method2() {
		System.out.println( "web-api call" );
	}
	
	// URL - http://localhost:8080/imart/sample/moge/xxx
	@Path("/sample/moge/{id}")
	@GET
	public void method(@Variable(name = "id") String id) {
		System.out.println( "api-parameter : " + id );
	}
	
	// いわゆる POJO ならそのまま使える。
	public static class Bean {
		private int age;
		private String name;
		private int number;
		private String code;
		private String tag;
		
		public Bean() {
			super();
		}
		
		public int getAge() {
			return age;
		}
		
		public void setAge(int age) {
			this.age = age;
		}
		
		public String getName() {
			return name;
		}
		
		public void setName(String name) {
			this.name = name;
		}
		
		public int getNumber() {
			return number;
		}
		
		public void setNumber(int number) {
			this.number = number;
		}
		
		public String getCode() {
			return code;
		}
		
		public void setCode(String code) {
			this.code = code;
		}
		
		public String getTag() {
			return tag;
		}
		
		public void setTag(String tag) {
			this.tag = tag;
		}
		
	}
	
	// URL - http://localhost:8080/imart/sample/bean
	@Path("/sample/bean")
	@GET
	public Bean bean() {
		Bean b = new Bean();
		
		b.setAge( 12 );
		
		b.setName( "PlainOldJavaObject" );
		
		b.setCode( "XXXX" );
		
		b.setTag( "ほげほげ" );
		
		return b;
	}
	
	
	// URL - http://localhost:8080/imart/sample/mail
	@Path("/sample/mail")
	@GET
	public String mail() {
		
		// メールテンプレートの実装実験。
		try {
			// テンプレートのパスを指定：
			// ※ conf/mail_template からの相対パス。
			// ※ ただし、ロケールなどの解決が入るのでベース名のみで、拡張子など入れないように注意。
			String path = "test/sample";
			
			// ロケールを指定：
			// ※ 本当はログインユーザ情報から取得するがサンプルなのでこれで。
			Locale locale = Locale.JAPAN;
			
			// プレースホルダにバインドするパラメータを設定：
			// ※ パラメータに過不足があった場合は単純に無視される。
			Map<String, String> parameter = new HashMap<>();
			parameter.put( "hoge", "ほげほげー" );
//			parameter.put( "moge", "もげもげー" );
			parameter.put( "piyo", "ぴよぴよー" );
			
			parameter.put( "xxx", "区分" );
			
			
			// ■メールテンプレートファイルで 件名subject と メール本文body を生成する
			MailBase mail = MailTemplate.process( path, locale, parameter );
			String subject = mail.getSubject();
			String body = mail.getBody().getText();
			
			System.out.println( subject );
			System.out.println( body );
			
			
			return body;
		}
		// 例外処理は適当。
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	
	// 動作確認用テストコード
	@Path("mail/wf/forward")
	@GET
	public WorkflowMail forward() {
		ForwardFieldset fieldset = new ForwardFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.note = "＜社内共有事項＞";
		fieldset.next_process_url = "＜次の処理画面URL＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.forward( fieldset );
	}
	
	@Path("mail/wf/hanken")
	@GET
	public WorkflowMail hanken() {
		HankenFieldset fieldset = new HankenFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.hanmoto_nm = "＜版元名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.next_process_url = "＜次の処理画面URL＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.hanken( fieldset );
	}
	
	@Path("mail/wf/accept")
	@GET
	public WorkflowMail accept() {
		AcceptFieldset fieldset = new AcceptFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.shonin_user_nm = "＜処理者＞";
		fieldset.shonin_busho_nm = "＜処理部署＞";
		fieldset.shonin_date = "＜処理日＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.accept( fieldset );
	}
	
	@Path("mail/wf/terminate")
	@GET
	public WorkflowMail terminate() {
		TerminateFieldset fieldset = new TerminateFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.result = "＜処理結果＞";
		fieldset.terminate_date = "＜WF完了日＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.terminate( fieldset );
	}
	
	@Path("mail/wf/rollback")
	@GET
	public WorkflowMail rollback() {
		RollbackFieldset fieldset = new RollbackFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.rollback_user_nm = "＜処理者＞";
		fieldset.rollback_busho_nm = "＜処理部署＞";
		fieldset.rollback_date = "＜処理日＞";
		fieldset.note = "＜社内共有事項＞";
		fieldset.next_process_url = "＜次の処理画面URL＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.rollback( fieldset );
	}
	
	@Path("mail/wf/cancel")
	@GET
	public WorkflowMail cancel() {
		CancelFieldset fieldset = new CancelFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.cancel_user_nm = "＜処理者＞";
		fieldset.cancel_busho_nm = "＜処理部署＞";
		fieldset.cancel_date = "＜処理日＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.cancel( fieldset );
	}
	
	@Path("mail/wf/error")
	@GET
	public WorkflowMail error() {
		ErrorFieldset fieldset = new ErrorFieldset();
		fieldset.type = "＜申請書種別＞";
		fieldset.title_nm = "＜商品名＞";
		fieldset.shinsei_no = "＜伝票番号（申請番号）＞";
		fieldset.kian_user_nm = "＜起案者＞";
		fieldset.kian_busho_nm = "＜起案部署＞";
		fieldset.kian_date = "＜起案日＞";
		fieldset.error_date = "＜エラー発生日＞";
		fieldset.error_detail = "＜エラー内容＞";
		fieldset.anken_all_url = "＜案件一覧画面URL＞";
		fieldset.my_documents_url = "＜MY文書画面URL＞";
		
		return WorkflowMail.error( fieldset );
	}
	
	private WorkflowMail[] createMails() {
		WorkflowMail[] mails = {
				forward(),
				hanken(),
				rollback(),
				cancel(),
				accept(),
				terminate(),
				error()
		};
		
		return mails;
	}
	
	
	@Path("mail/send")
	@GET
	public void send() {
		
		// SMTP設定は src/main/conf/javamail-config/javamail-config.xml を編集すること
		StandardMail mail = new StandardMail( Locale.JAPAN );
		
		// 実際には from はシステム固定だが、現時点でアカウント未発行なので動作テスト用に↓を使っておく。
		mail.setFrom( "t-kurimoto@bnba.jp" );
		
		// 実際には T_MAIL_QUEUE からデータ拾ってきて↓を埋めてメール飛ばす。
		mail.addTo( "t-kurimoto@bnba.jp" );
		mail.addTo( "r2-sugawara@bnba.jp" );
		
		mail.setSubject( "test3" );
		
		mail.setText( "メール送信テスト3" );
		
		
		MailSender sender = new JavaMailSender( mail );
		
		
		try {
			sender.send();
		}
		catch ( MailSenderException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	
	

	@Path("mail/test")
	@GET
	public void test0() throws Exception {
		System.out.println( "■web-api mail/test call." );
		
		TenantDatabase db = new TenantDatabase();
		System.out.println( "  - datasource: " + db.getDataSourceName() );
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
		}
	}
	
	@Path("mail/test/select")
	@GET
	public int test1() throws Exception {
		System.out.println( "■web-api mail/test1 call." );
		
		TenantDatabase db = new TenantDatabase();
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
			
			
			return show( q );
		}
	}

	private int show(WorkflowMailQuey q) {
		System.out.println( "  -SELECT:" );
		List<MailQueue> mails = q.select();
		
		for ( MailQueue mail : mails ) {
			String m = ToStringBuilder.reflectionToString( mail );
			System.out.println( "  - " + m );
		}
		
		return mails.size();
	}

	@Path("mail/test/insert")
	@GET
	public void test2() throws Exception {
		System.out.println( "■web-api mail/test2 call." );
		
		TenantDatabase db = new TenantDatabase();
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
			MailQueue mail = new MailQueue( "to", "cc", "subject", "[]", "body" );
			q.insert( mail );
			
			connection.commit();
			
			show( q );
		}
	}

	@Path("mail/test/success/{id}")
	@GET
	public void test3( @Variable(name = "id") int id ) throws Exception {
		System.out.println( "■web-api mail/test3 call." );
		
		TenantDatabase db = new TenantDatabase();
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
			MailQueue mail = new MailQueue( id );
			q.onsuccess( mail );
			
			connection.commit();

			show( q );
		}
	}

	@Path("mail/test/error/{id}")
	@GET
	public void test4( @Variable(name = "id") int id ) throws Exception {
		System.out.println( "■web-api mail/test4 call." );
		
		TenantDatabase db = new TenantDatabase();
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
			MailQueue mail = new MailQueue( id );
			q.onerror( mail, "エラー更新テスト" );
			
			connection.commit();

			show( q );
		}
	}
	

	@Path("mail/test/dummydata")
	@GET
	public void dummydata() throws Exception {
		WorkflowMail[] mails = createMails();
		
		for ( WorkflowMail mail : mails ) {
			mail.getTo().add("r2-sugawara@bnba.jp");
		}
		
		
		
		// データ登録。
		TenantDatabase db = new TenantDatabase();
		
		try( Connection connection = db.getConnection(); ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context(
					"test-program", 
					"test-user" );
			
			WorkflowMailQuey q = WorkflowMailQuey.create( 
					context, 
					connection );
			
			WorkflowMailBox mailbox = new WorkflowMailBox( q );
			
			mailbox.store( Arrays.asList( mails ) );
			
			connection.commit();

		}
	}
}
