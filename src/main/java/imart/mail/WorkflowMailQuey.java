package imart.mail;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class WorkflowMailQuey {
	
	public static class Context {
		/** プログラムID */
		public final String programId;
		/** ユーザID */
		public final String userId;
		
		public Context(String programId, String userId) {
			this.programId = programId;
			this.userId = userId;
		}
	}
	
	/** DB接続 */
	private final Connection connection;
	
	/** 更新コンテキスト */
	private final Context context;
	
	/** 登録用クエリ */
	private final PreparedStatement queryInsert;
	/** 参照用クエリ */
	private final PreparedStatement querySelect;
	/** メール送信成功時の更新用クエリ */
	private final PreparedStatement queryOnSuccess;
	/** メール送信失敗時の更新用クエリ */
	private final PreparedStatement queryOnError;
	
	private WorkflowMailQuey(
			Connection connection,
			Context context,
			PreparedStatement queryInsert,
			PreparedStatement querySelect,
			PreparedStatement queryOnSuccess,
			PreparedStatement queryOnError) {
		
		this.connection = connection;
		this.context = context;
		this.queryInsert = queryInsert;
		this.querySelect = querySelect;
		this.queryOnSuccess = queryOnSuccess;
		this.queryOnError = queryOnError;
	}
	
	public void commit() {
		try {
			this.connection.commit();
		}
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	/**
	 * {@link ResultSet} のデータを返す構造体である事を示す marker-interface.
	 */
	public interface IResultStruct {
	}
	
	public static class MailQueue implements IResultStruct {
		
		// 業務処理で必要最小限のメンバのみ保持。
		
		/** メールキュー：ID */
		public final int id; // ID は INSERT 時に SEQUENCE[t_mail_queue_id_seq] で採番
		
		/** メールキュー：Toアドレス */
		public final String to_addr;
		/** メールキュー：Ccアドレス */
		public final String cc_addr;
		/** メールキュー：件名 */
		public final String subject;
		/** メールキュー：添付ファイル */
		public final String attach_files;
		
		/** メールキュー：本文 */
		public final String body;
		
		// テスト用
		@Deprecated
		public MailQueue(int id) {
			this( id, "", "", "", "", "" );
		}
		
		public MailQueue(
				String to_addr,
				String cc_addr,
				String subject,
				String attach_files,
				String body) {
			this.id = 0;
			this.to_addr = to_addr;
			this.cc_addr = cc_addr;
			this.subject = subject;
			this.attach_files = attach_files;
			this.body = body;
		}
		
		private MailQueue(
				int id,
				String to_addr,
				String cc_addr,
				String subject,
				String attach_files,
				String body) {
			this.id = id;
			this.to_addr = to_addr;
			this.cc_addr = cc_addr;
			this.subject = subject;
			this.attach_files = attach_files;
			this.body = body;
		}
		
		private static MailQueue asEntity(ResultSet res) throws SQLException {
			int id = res.getInt( "id" );
			String to_addr = res.getString( "to_addr" );
			String cc_addr = res.getString( "cc_addr" );
			String subject = res.getString( "subject" );
			String attach_files = res.getString( "attach_files" );
			String body = res.getString( "body" );
			
			return new MailQueue(
					id,
					to_addr,
					cc_addr,
					subject,
					attach_files,
					body );
		}
	}
	
	public void insert(MailQueue entity) {
		
		try {
			
			final PreparedStatement q = this.queryInsert;
			
			java.sql.Timestamp sysdate = now();
			
			q.clearParameters();
			
			int n = 1;
			q.setString( n++, entity.to_addr );
			q.setString( n++, entity.cc_addr );
			q.setString( n++, entity.subject );
			q.setString( n++, entity.attach_files );
			
			q.setString( n++, context.userId );
			q.setTimestamp( n++, sysdate );
			q.setString( n++, context.programId );
			
			q.setString( n++, context.userId );
			q.setTimestamp( n++, sysdate );
			q.setString( n++, context.programId );
			
			q.setString( n++, entity.body );
			
			
			// INSERT を実行。
			q.executeUpdate();
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	public List<MailQueue> select() {
		try {
			List<MailQueue> entities = new ArrayList<>();
			
			final PreparedStatement q = this.querySelect;
			
			try ( ResultSet res = q.executeQuery() ) {
				while ( res.next() ) {
					MailQueue entity = MailQueue.asEntity( res );
					entities.add( entity );
				}
			}
			
			return entities;
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	public void onsuccess(MailQueue entity) {
		
		// メール送信成功の場合は、送信日時を設定する。
		try {
			final PreparedStatement q = this.queryOnSuccess;
			
			java.sql.Timestamp sysdate = now();
			
			q.clearParameters();
			
			int n = 1;
			q.setTimestamp( n++, sysdate );
			
			q.setString( n++, context.userId );
			q.setTimestamp( n++, sysdate );
			q.setString( n++, context.programId );
			
			q.setInt( n++, entity.id );
			
			
			// UPDATE を実行。
			q.executeUpdate();
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	public void onerror(MailQueue entity, String message) {
		
		// メール送信失敗の場合はエラーメッセージを設定し、リトライカウントをインクリメント。
		try {
			final PreparedStatement q = this.queryOnError;
			
			java.sql.Timestamp sysdate = now();
			
			q.clearParameters();
			
			int n = 1;
			q.setString( n++, message );
			
			q.setString( n++, context.userId );
			q.setTimestamp( n++, sysdate );
			q.setString( n++, context.programId );
			
			q.setInt( n++, entity.id );
			
			
			// UPDATE を実行。
			q.executeUpdate();
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	private static java.sql.Timestamp now() {
		return new java.sql.Timestamp( new Date().getTime() );
	}
	
	public static WorkflowMailQuey create(Context context, Connection connection) {
		
		String sql;
		try {
			
			// ■登録用クエリ
			sql = "INSERT INTO T_MAIL_QUEUE ( "
				+ "      ID "
				+ "    , TO_ADDR "
				+ "    , CC_ADDR "
				+ "    , SUBJECT "
				+ "    , ATTACH_FILES "
				+ "    , SEND_DT "
				
				+ "	   , RETRY_COUNT "
				+ "    , ERROR_MESSAGE "
				
				+ "	   , TOROKUSHA "
				+ "    , TOROKU_DT "
				+ "    , SAKUSEI_PROGRAM_ID "
				
				+ "	   , KOSHINSHA "
				+ "    , KOSHIN_DT "
				+ "    , KOSHIN_PROGRAM_ID "
				
				+ "	   , SAKUJO_FLG "
				
				+ "    , BODY "
				+ ") "
				
				+ "VALUES ( "
				+ "    NEXTVAL('T_MAIL_QUEUE_ID_SEQ') " // ":id "
				+ "    , ? " // "[1]:to_addr "
				+ "    , ? " // "[2]:cc_addr "
				+ "    , ? " // "[3]:subject "
				+ "    , ? " // "[4]:attach_files "
				
				+ "    , NULL " // ":send_dt "
				+ "    , 0 "    // ":retry_count "
				+ "    , NULL " // ":error_message "
				
				+ "    , ? " // "[5]:torokusha "
				+ "    , ? " // "[6]:toroku_dt "
				+ "    , ? " // "[7]:sakusei_program_id "
				
				+ "    , ? " // "[8]:koshinsha "
				+ "    , ? " // "[9]:koshin_dt "
				+ "    , ? " // "[10]:koshin_program_id "
				
				+ "    , '0' " // ":sakujo_flg "
				
				+ "    , ? " // "[11]:body "
				+ ") ";
			
			PreparedStatement queryInsert = connection.prepareStatement( sql );
			
			
			// ■参照用クエリ
			sql = "SELECT ID "
				+ "     , TO_ADDR "
				+ "     , CC_ADDR "
				+ "     , SUBJECT "
				+ "     , ATTACH_FILES "
				+ "     , BODY "
				+ " "
				+ "FROM T_MAIL_QUEUE "
				+ " "
				+ "WHERE SEND_DT IS NULL "
				+ "  AND SAKUJO_FLG = '0' "
				+ "  AND RETRY_COUNT < 100 "
				
				+ "ORDER BY ID ";
			
			PreparedStatement querySelect = connection.prepareStatement( sql );
			
			
			
			// ■メール送信成功時の更新クエリ
			sql = "UPDATE T_MAIL_QUEUE "
				
				+ "SET SEND_DT = ? "
				
				+ "  , KOSHINSHA = ? "
				+ "  , KOSHIN_DT = ? "
				+ "  , KOSHIN_PROGRAM_ID = ? "
				+ "WHERE "
				+ "  ID = ? ";
			
			PreparedStatement queryOnSuccess = connection.prepareStatement( sql );
			
			
			// ■メール送信失敗時の更新クエリ
			sql = "UPDATE T_MAIL_QUEUE "
				
				+ "SET RETRY_COUNT = RETRY_COUNT + 1 "
				+ "  , ERROR_MESSAGE = ? "
				
				+ "  , KOSHINSHA = ? "
				+ "  , KOSHIN_DT = ? "
				+ "  , KOSHIN_PROGRAM_ID = ? "
				+ "WHERE "
				+ "  ID = ? ";
			
			PreparedStatement queryOnError = connection.prepareStatement( sql );
			
			
			// クエリセットを返す。
			return new WorkflowMailQuey(
					connection,
					context,
					queryInsert,
					querySelect,
					queryOnSuccess,
					queryOnError );
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
}
