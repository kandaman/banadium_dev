package imart.mail;

import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.Locale;

import org.apache.commons.lang3.StringUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import imart.mail.WorkflowMailQuey.MailQueue;
import jp.co.intra_mart.foundation.mail.MailSender;
import jp.co.intra_mart.foundation.mail.MailSenderException;
import jp.co.intra_mart.foundation.mail.javamail.JavaMailSender;
import jp.co.intra_mart.foundation.mail.javamail.StandardMail;

public class WorkflowMailBox {
	
	private final WorkflowMailQuey query;
	
	public WorkflowMailBox(WorkflowMailQuey query) {
		this.query = query;
	}
	
	
	public void store(Iterable<WorkflowMail> mails) {
		
		for ( WorkflowMail mail : mails ) {
			
			MailQueue queue = asQueue( mail );
			
			this.query.insert( queue );
		}
	}
	
	// メールデータをQueueエンティティに変換
	private MailQueue asQueue(WorkflowMail mail) {
		String to_addr = compress( mail.getTo() );
		String cc_addr = compress( mail.getCc() );
		String subject = mail.getSubject();
		String body = mail.getBody();
		String attach_files = compress( mail.getAttachFiles() );
		
		return new MailQueue( to_addr, cc_addr, subject, attach_files, body );
	}
	
	
	public void send() {
		
		// T_MAIL_QUEUE テーブルから未送信のメールデータを取得し、メール送信を試みる。
		List<MailQueue> queues = this.query.select();
		for ( MailQueue queue : queues ) {
			
			// メール送信し、正常終了したら送信ステータスを更新する。
			try {
				this.trySendMail( queue );
				this.query.onsuccess( queue );
			}
			// メール送信時のエラーをキャッチしたらエラーステータスを更新する。
			catch ( Exception ex ) {
				ex.printStackTrace();
				this.query.onerror( queue, ex.getMessage() );
			}
			
			
			// １件単位でコミット掛ける。
			this.query.commit();
		}
	}
	
	private void trySendMail(MailQueue queue) throws MailSenderException {
		
		// SMTP設定は src/main/conf/javamail-config/javamail-config.xml を編集すること
		//StandardMail mail = new StandardMail( Locale.JAPAN );
		StandardMail mail = new StandardMail( Locale.JAPAN,"cactus");
		
		// ■QUEUE のデータを元に送信する mail を設定。
		//mail.setFrom( "iAP0101@bnba.jp" );
		mail.setFrom( "Cactus_admin@bnba.jp" );
		
		for ( String address : expand( queue.to_addr ) ) {
			if ( notEmpty( address ) ) {
				mail.addTo( address );
			}
		}
		
		for ( String address : expand( queue.cc_addr ) ) {
			if ( notEmpty( address ) ) {
				mail.addCc( address );
			}
		}
		
		mail.setSubject( queue.subject );
		mail.setText( queue.body );
		
		// ※AttachFilesは今は使用しない。
		
		
		// ■メール送信
		MailSender sender = new JavaMailSender( mail );
		
		sender.send();
	}
	
	
	private static boolean notEmpty(String string) {
		return StringUtils.isNotEmpty( string );
	}
	
	
	/**
	 * {@code JSON} object-mapper.
	 * 
	 * <p>
	 * {@code T_MAIL_QUEUEテーブル} は、一部カラムのデータが非正規化されており、<br>
	 * 単一カラム内に構造化文字列状態で複数のデータを保持している。<br>
	 * <i>（例： T_MAIL_QUEUE.TO_ADDR, T_MAIL_QUEUE.CC_ADDR ）</i><br>
	 * ここで言う構造化文字列とは、具体的には {@code INGEN方式} に合わせて {@code JSON} を採用している。<br>
	 * <i>（このプログラム内で双方向の {@code JSON} 変換が完結しているので、可逆変換であれば何でも良い。）</i>
	 * </p>
	 * <p>
	 * {@code JSON-parser} としては {@link com.fasterxml.jackson jackson} のライブラリが標準で入っていたのでこれを使用。<br>
	 * なお {@link ObjectMapper} はシングルトンキャッシュにしようかと思ったが、<br>
	 * {@code mailbox} インスタンスの寿命と、機能の使用頻度的にフィールド持ちに留めておく。<br>
	 * </p>
	 * 
	 * @see com.fasterxml.jackson.databind.ObjectMapper
	 */
	private final ObjectMapper om = new ObjectMapper();
	
	/** オブジェクトから構造化文字列への変換 */
	private String compress(List<String> strings) {
		
		try {
			String json = om.writeValueAsString( strings );
			return json;
		}
		// 検査例外はランタイム例外で再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	/** 構造化文字列からオブジェクトへの変換 */
	private List<String> expand(String string) {
		
		try {
			TypeReference<List<String>> generic = new TypeReference<List<String>>() {
				// TypeReference：型情報解決のため実装は特に不要。
			};
			List<String> strings = om.readValue( string, generic );
			return strings;
		}
		// 検査例外はランタイム例外で再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
}
