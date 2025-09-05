package imart.mail.api;

import java.sql.Connection;

import imart.mail.WorkflowMailBox;
import imart.mail.WorkflowMailQuey;
import imart.mail.WorkflowMailQuey.Context;
import jp.co.intra_mart.foundation.database.TenantDatabase;
import jp.co.intra_mart.foundation.web_api_maker.annotation.GET;
import jp.co.intra_mart.foundation.web_api_maker.annotation.IMAuthentication;
import jp.co.intra_mart.foundation.web_api_maker.annotation.Path;

@IMAuthentication
public class MailService {
	//FIXME【暫定設定】program-id の決め方が解らないので取り敢えず適当に設定。
	private static final String PROGRAM_ID = "mail_api";

	//FIXME【暫定設定】WebAPIのURLは仮置き。
	@Path("/api/send-mail")
	@GET
	public void sendMail() {
		
		TenantDatabase db = new TenantDatabase();
		try ( Connection connection = db.getConnection() ) {
			connection.setAutoCommit( false );
			
			//FIXME【暫定設定】WebAPI経由での更新者は "system" で仮置き。
			WorkflowMailQuey.Context context = new Context( PROGRAM_ID, "system" );
			WorkflowMailQuey query = WorkflowMailQuey.create( context, connection );
			
			// WebAPIでは送信命令出す以外に特に機能はない。
			WorkflowMailBox mailbox = new WorkflowMailBox( query );
			mailbox.send();
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
}
