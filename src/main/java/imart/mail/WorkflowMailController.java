package imart.mail;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.ResourceBundle;
import java.util.Set;

import imart.mail.WorkflowMailQuey.Context;
import imart.mail.WorkflowMailQuey.MailQueue;
import imart.mail.data.AcceptFieldset;
import imart.mail.data.AcceptHankenFieldset;
import imart.mail.data.CancelFieldset;
import imart.mail.data.ForwardFieldset;
import imart.mail.data.HankenFieldset;
import imart.mail.data.RollbackFieldset;
import imart.mail.data.TerminateFieldset;
import jp.co.intra_mart.foundation.BaseUrl;
import jp.co.intra_mart.foundation.context.Contexts;
import jp.co.intra_mart.foundation.context.model.AccountContext;
import jp.co.intra_mart.foundation.database.TenantDatabase;

public class WorkflowMailController {
	private static final String PROGRAM_ID = "workflow_mail";
	private String UKETUKE_GROUP_ID;
	private String ALL_PROCESS_PATH; // my文書一覧画面パス
	private String MY_PROCESS_PATH; // 全案件一覧画面パス
	//private static final String ALL_PROCESS_PATH = "/my_workflow/newItemContents/screen/allProcess_list"; // my文書一覧画面パス
	//private static final String MY_PROCESS_PATH = "/my_workflow/newItemContents/screen/myProcess_list"; // 全案件一覧画面パス

	public void storeMail(
			String mailType, //メール種類
			String imUserDataId, // ユーザーデータID
			String processComment, // コメント
			String node_id // ノードID
			) {
		
		// アカウントコンテキストを取得する。
		AccountContext accountContext = Contexts.get(AccountContext.class);
		// ユーザコードを取得する。
		String userId = accountContext.getUserCd();
		
		//受付担当グループIDを設定
		ResourceBundle rb = ResourceBundle.getBundle("imart.mail.mailinfo");
		this.UKETUKE_GROUP_ID = rb.getString("UKETUKE_GROUP_ID");
		this.ALL_PROCESS_PATH = rb.getString("ALL_PROCESS_PATH");
		this.MY_PROCESS_PATH = rb.getString("MY_PROCESS_PATH");
	    
		
		// ワークフロー遷移に基づいてデータを収集してmailboxにデータを登録する。
		TenantDatabase db = new TenantDatabase();
		try ( Connection connection = db.getConnection() ) {
			connection.setAutoCommit( false );
			
			WorkflowMailQuey.Context context = new Context( PROGRAM_ID, userId );
			WorkflowMailQuey query = WorkflowMailQuey.create( context, connection );
			WorkflowMailBox mailbox = new WorkflowMailBox( query );
			
			
			List<WorkflowMail> mailList = new ArrayList<WorkflowMail>();
			ForwardFieldset forwardfieldset = null; //処理依頼
			AcceptFieldset acceptfieldset = null; //処理完了通知
			AcceptHankenFieldset acceptHankenfieldset = null; //処理完了通知(版権)
			RollbackFieldset rollbackfieldset = null; //差し戻し
			CancelFieldset cancelfieldset = null; //取戻し
			WorkflowMail mail = null;

			List<String> setToList = new ArrayList<String>(); // メールアドレス to
			List<String> setCcList = new ArrayList<String>(); // メールアドレス cc

			
			List<String> procUserAddress = getUserAddress(connection,userId);//処理者のアドレス
			
			// 申請処理 
			switch (mailType){
			  case "1": // 処理依頼 申請→承認
				    forwardfieldset = createForward(connection,imUserDataId,processComment,"planApplNode_02");
				    mail = WorkflowMail.forward(forwardfieldset); 
					mail.setTo(getSendAddress(connection,forwardfieldset.shinsei_no,"01")); //to　承認者
					mailList.add(mail);
					
					// 完了通知 申請者
					acceptfieldset = createAccept(connection,imUserDataId);
					mail = WorkflowMail.accept(acceptfieldset);
					mail.setTo(procUserAddress);// to
					mailList.add(mail);
					
					break;
			  case "2": // 処理依頼  承認→受付
				    forwardfieldset = createForward(connection,imUserDataId,processComment,"planApplNode_03");
					mail = WorkflowMail.forward(forwardfieldset);
					mail.setTo(getSendAddress(connection,forwardfieldset.shinsei_no,"02"));// to 受付担当者
					mailList.add(mail);

					// 完了通知 承認→申請者
					acceptfieldset = createAccept(connection,imUserDataId);
					mail = WorkflowMail.accept(acceptfieldset);
					
					setToList = getSendAddress(connection,acceptfieldset.shinsei_no,"00"); // to 申請者
					setToList.addAll(procUserAddress); // to 承認者
					setToList = hashSetlist(setToList);// 重複削除
					mail.setTo(setToList);
					
					mailList.add(mail);
				    break;
			  case "3": // 処理依頼  受付→版権元

				  List<HankenFieldset> hankenlist = createHankenList(connection,imUserDataId,processComment);
				    for (HankenFieldset hankenfieldset : hankenlist ) {
						mail = WorkflowMail.hanken(hankenfieldset);
						//mail.setFrom(getMyAddress(connection,userId)); // from
						mail.setTo(getSendHankenAddress(connection,hankenfieldset.shinsei_no,hankenfieldset.hanmoto_nm));// to　版権担当者
						mailList.add(mail);
					}
				    
					// 完了通知 受付→他の受付
					acceptfieldset = createAccept(connection,imUserDataId);
					mail = WorkflowMail.accept(acceptfieldset);
					mail.setTo(getSendAddress(connection,acceptfieldset.shinsei_no,"02"));// to 受付担当者
					mailList.add(mail);
				  
				    break;
				    
			  case "4": // 完了通知 版権元
				    acceptHankenfieldset = createAcceptHanken(connection,imUserDataId,node_id);
					mail = WorkflowMail.acceptHanken(acceptHankenfieldset);
					// 完了通知 版権元→受付担当
					setToList = getSendAddress(connection,acceptHankenfieldset.shinsei_no,"02");
				    //版権元→他の版元担当
					//setToList.addAll(getSendMyNodeAddress(connection,acceptfieldset.shinsei_no,node_id));
					setToList.addAll(getSendAddress(connection,acceptHankenfieldset.shinsei_no,"03"));
					
					// 重複削除
					setToList = hashSetlist(setToList);
					mail.setTo(setToList);

					mailList.add(mail);
				    break;
				    
			  case "5": // WF完了通知
				    TerminateFieldset terminatefieldset =  createTerminate(connection,imUserDataId,processComment);
					mail = WorkflowMail.terminate(terminatefieldset);
					//mail.setFrom(getMyAddress(connection,userId));// from

					List<String> termMails1 = getSendAddress(connection,terminatefieldset.shinsei_no,"00");
					List<String> termMails2 = getSendAddress(connection,terminatefieldset.shinsei_no,"01");
					termMails1.addAll(termMails2);
					List<String> termMails3 = getSendAddress(connection,terminatefieldset.shinsei_no,"02");
					termMails1.addAll(termMails3);
					//List<String> termMails4 = getSendMyNodeAddress(connection,terminatefieldset.shinsei_no,"");
					List<String> termMails4 = getSendAddress(connection,terminatefieldset.shinsei_no,"03"); 
					termMails1.addAll(termMails4);
					List<String> termMails5 = getSendSettingAddress(connection,terminatefieldset.shinsei_no); //メールテーブルより取得
					termMails1.addAll(termMails5);
					
					// 重複削除
					setToList = hashSetlist(termMails1);
					mail.setTo(setToList);

					mailList.add(mail);
				    break;
				    
			  case "6": // 差し戻し 承認者 →申請者
				    rollbackfieldset =  createRollback(connection,imUserDataId,processComment,"3");
					mail = WorkflowMail.rollback(rollbackfieldset);
					mail.setTo(getSendAddress(connection,rollbackfieldset.shinsei_no,"00"));// to 申請者
					mail.setCc(procUserAddress);// cc 承認者
					
					mailList.add(mail);
				    break;
			  case "7": // 差し戻し 受付担当 →申請者
				    rollbackfieldset =  createRollback(connection,imUserDataId,processComment,"3");
					mail = WorkflowMail.rollback(rollbackfieldset);
					mail.setTo(getSendAddress(connection,rollbackfieldset.shinsei_no,"00"));// to 申請者
					
					setCcList = getSendAddress(connection,rollbackfieldset.shinsei_no,"01");// cc 承認者
					setCcList.addAll(getSendAddress(connection,rollbackfieldset.shinsei_no,"02")); //cc 受付グループ
					// 重複削除
					setCcList = hashSetlist(setCcList);
					mail.setCc(setCcList);
					
					mailList.add(mail);
				    break;
			  case "8": // 差し戻し 版権担当 →申請者
				    rollbackfieldset =  createRollback(connection,imUserDataId,processComment,"3");
					mail = WorkflowMail.rollback(rollbackfieldset);
					// to 
					mail.setTo(getSendAddress(connection,rollbackfieldset.shinsei_no,"00"));// 申請者
					
					// CC
					setCcList = getSendAddress(connection,rollbackfieldset.shinsei_no,"01");// 承認者
					setCcList.addAll(getSendAddress(connection,rollbackfieldset.shinsei_no,"02")); // 受付担当
					setCcList.addAll(getSendAddress(connection,rollbackfieldset.shinsei_no,"03")); // 版権担当
					// 重複削除
					setCcList = hashSetlist(setCcList);
					mail.setCc(setCcList);
					
					/*
					List<String> backMails2 = getSendAddress(connection,rollbackfieldset.shinsei_no,"02");
					backMails1.addAll(backMails2);
					//List<String> backMails3 = getSendMyNodeAddress(connection,rollbackfieldset.shinsei_no,"");
					List<String> backMails3 = getSendAddress(connection,rollbackfieldset.shinsei_no,"03"); 
					backMails1.addAll(backMails3);
					Set<String> setBackMails = new HashSet<>(backMails1); //重複は削除
					List<String> backMails = new ArrayList<>(setBackMails);					

					mail.setCc(backMails);// cc
					*/
					
					
					mailList.add(mail);
				    break;
				    
			  case "9": // 差し戻し 版権担当 →受付
				    rollbackfieldset =  createRollback(connection,imUserDataId,processComment,"4");
					mail = WorkflowMail.rollback(rollbackfieldset);
					mail.setTo(getSendAddress(connection,rollbackfieldset.shinsei_no,"02"));// to 受付
					//mail.setCc(getSendMyNodeAddress(connection,rollbackfieldset.shinsei_no,""));// cc ほかの担当者
					mail.setCc(getSendAddress(connection,rollbackfieldset.shinsei_no,"03"));// cc ほかの担当者
					
					mailList.add(mail);
				    break;
				    
			  case "10": // 取戻し 申請者 ← 承認 
				    cancelfieldset =  createCancel(connection,imUserDataId,processComment);
					mail = WorkflowMail.cancel(cancelfieldset);
					mail.setTo(getSendAddress(connection,cancelfieldset.shinsei_no,"01"));// to 承認者
					mail.setCc(getSendAddress(connection,cancelfieldset.shinsei_no,"00"));// cc 申請者
					
					mailList.add(mail);
				    break;
			  case "11": // 取戻し 受付 ← 版権元  
				    cancelfieldset =  createCancel(connection,imUserDataId,processComment);
					mail = WorkflowMail.cancel(cancelfieldset);
					
					//mail.setTo(getSendMyNodeAddress(connection,cancelfieldset.shinsei_no,node_id));// to 版元
					mail.setTo(getSendAddress(connection,cancelfieldset.shinsei_no,"03"));// to 版元
					mail.setCc(getSendAddress(connection,cancelfieldset.shinsei_no,"02"));// cc 受付
					
					mailList.add(mail);
					
				    break;

			  default:
				  
			    break;
			}			
				
			// メールをキューにためる
			mailbox.store(mailList);
			
			connection.commit();
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	
	// 重複アドレスを削除
	public List<String> hashSetlist(List<String> maillist) throws Exception{
		Set<String> setMails = new HashSet<>(maillist); 
		List<String> retlist = new ArrayList<>(setMails);					
		return retlist;
	}
	
	// 承認依頼メールを作成
	public ForwardFieldset createForward(Connection connection,String imUserDataId,String processComment,String nextNode) throws Exception{

        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
		ForwardFieldset fieldset = new ForwardFieldset();
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			fieldset.note = processComment; // 社内共有事項

			String baseURL = BaseUrl.get(); //ベースURL
			
			String urlparam = "?proctype=4"; //処理種別
			urlparam += "&imwSystemMatterId="+resultSet.getString("im_system_anken_id"); //システムID
			urlparam += "&imwUserDataId="+imUserDataId; //ユーザデータID
			urlparam += "&imwNodeId="+nextNode; //ノードID
			
			fieldset.next_process_url = baseURL + this.MY_PROCESS_PATH + urlparam; // 次の処理画面URL
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
			
        }
		return fieldset;
	}

	// 承認依頼メール(版元用)を作成
	public List<HankenFieldset> createHankenList(Connection connection,String imUserDataId,String processComment) throws Exception{

        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        sql +="  ,im.node_id as node_id ";
        sql +="  ,im.node_name as node_name ";
        sql +="	from t_shinsei s ";
        
        sql +=" left join imw_t_actv_task im ";
        sql +="  on s.im_system_anken_id = im.system_matter_id  ";
        sql +="  and im.node_type = '3' ";
        
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        
        //'(国内)'
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
        List<HankenFieldset> hankenList = new ArrayList<HankenFieldset>();
        
        
        String baseURL = BaseUrl.get(); //ベースURL

        while (resultSet.next()) {
            HankenFieldset fieldset = new HankenFieldset();
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			fieldset.hanmoto_nm = resultSet.getString("node_name"); // 版元名
			
			String urlparam = "?proctype=4"; //処理種別
			urlparam += "&imwSystemMatterId="+resultSet.getString("im_system_anken_id"); //システムID
			urlparam += "&imwUserDataId="+imUserDataId; //ユーザデータID
			urlparam += "&imwNodeId="+resultSet.getString("node_id"); //ノードID
			
			fieldset.next_process_url = baseURL + this.MY_PROCESS_PATH + urlparam; // 次の処理画面URL
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
			
			hankenList.add(fieldset);
        }
		return hankenList;
	}	
	
	
	// 承認依頼メール(版元用)を作成
	/*public HankenFieldset createHanken(Connection connection,String imUserDataId,String nodeId) throws Exception{

        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        sql +="  ,im.node_id as node_id ";
        sql +="  ,im.node_name as node_name ";
        sql +="	from t_shinsei s ";
        
        sql +=" left join imw_t_actv_task im ";
        sql +="  on s.im_system_anken_id = im.system_matter_id  ";
        sql +="  and im.node_type = '3' ";
        
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        sql +="  and im.node_id = ? ";
        
        
        //'(国内)'
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        statement.setString(2, nodeId);
        
        ResultSet resultSet = statement.executeQuery();
        
        HankenFieldset fieldset = new HankenFieldset();
       
        String baseURL = BaseUrl.get(); //ベースURL

        while (resultSet.next()) {
 			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			fieldset.hanmoto_nm = resultSet.getString("node_name"); // 版元名
			
			String urlparam = "?proctype=4"; //処理種別
			urlparam += "&imwSystemMatterId="+resultSet.getString("im_system_anken_id"); //システムID
			urlparam += "&imwUserDataId="+imUserDataId; //ユーザデータID
			urlparam += "&imwNodeId="+resultSet.getString("node_id"); //ノードID
			
			fieldset.next_process_url = baseURL + MY_PROCESS_PATH + urlparam; // 次の処理画面URL
			fieldset.anken_all_url = baseURL + ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + MY_PROCESS_PATH; // MY文書画面URL
			
        }
		return fieldset;
	}*/	
	
	
	// 処理完了通知メールを作成
	public AcceptFieldset createAccept(Connection connection,String imUserDataId) throws Exception{
		
        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
        sql +="  ,u2.im_department_nm as koshin_busho ";
        sql +="  ,u2.im_user_name as koshin_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";

        sql +=" left join v_user u2 ";
        sql +="  on s.koshinsha = u2.im_user_cd  ";
        sql +="  and u2.im_locale_id = 'ja' ";
        sql +="  and u2.im_delete_flag = '0' ";
        
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
        AcceptFieldset fieldset = new AcceptFieldset();
        
		String baseURL = BaseUrl.get(); //ベースURL
        
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			
			fieldset.shonin_user_nm  = resultSet.getString("koshin_nm"); // 処理者
			fieldset.shonin_busho_nm = resultSet.getString("koshin_busho"); // 処理部署
			fieldset.shonin_date = resultSet.getString("koshin_dt"); // 処理日
			
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
        }
		return fieldset;
	}
	// 処理完了通知メール(版権単位)を作成
	public AcceptHankenFieldset createAcceptHanken(Connection connection,String imUserDataId,String nodeId) throws Exception{
		
        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
        sql +="  ,u2.im_department_nm as koshin_busho ";
        sql +="  ,u2.im_user_name as koshin_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        sql +="  ,im.node_id as node_id ";
        sql +="  ,im.node_name as node_name ";
        
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        sql +=" left join v_user u2 ";
        sql +="  on s.koshinsha = u2.im_user_cd  ";
        sql +="  and u2.im_locale_id = 'ja' ";
        sql +="  and u2.im_delete_flag = '0' ";

        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        
        sql +=" left join imw_t_actv_task im ";
        sql +="  on s.im_system_anken_id = im.system_matter_id  ";
        sql +="  and im.node_type = '3' ";
        
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        sql +="  and im.node_id = ? ";
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        statement.setString(2, nodeId);
        
        ResultSet resultSet = statement.executeQuery();
        
        AcceptHankenFieldset fieldset = new AcceptHankenFieldset();
        
		String baseURL = BaseUrl.get(); //ベースURL
        
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.hanmoto_nm = resultSet.getString("node_name"); // 版元名
			
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			
			fieldset.shonin_user_nm  = resultSet.getString("koshin_nm"); // 処理者
			fieldset.shonin_busho_nm = resultSet.getString("koshin_busho"); // 処理部署
			fieldset.shonin_date = resultSet.getString("koshin_dt"); // 処理日
			
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
        }
		return fieldset;
	}
	
	// WF完了通知メールを作成
	public TerminateFieldset createTerminate(Connection connection,String imUserDataId,String processComment) throws Exception{
		
        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        sql +="  ,COALESCE(c1.cd_naiyo,'') as toroku_kekka_nm ";
        
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        
        sql +=" left join m_cd c1 ";
        sql +=" on  s.toroku_kekka_kbn = c1.cd_chi ";
        sql +=" and c1.cd_id='0005' ";
        
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
        TerminateFieldset fieldset = new TerminateFieldset();
        
		String baseURL = BaseUrl.get(); //ベースURL
        
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			fieldset.terminate_date = resultSet.getString("koshin_dt");
			fieldset.result = resultSet.getString("toroku_kekka_nm"); //登録結果
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
        }
		return fieldset;
		
	}
		
	
	// 取戻しメールを作成
	public RollbackFieldset createRollback(Connection connection,String imUserDataId,String processComment,String proctype) throws Exception{

        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        
        sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
        sql +="  ,u2.im_department_nm as koshin_busho ";
        sql +="  ,u2.im_user_name as koshin_nm ";
        
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        
        sql +=" left join v_user u2 ";
        sql +="  on s.koshinsha = u2.im_user_cd  ";
        sql +="  and u2.im_locale_id = 'ja' ";
        sql +="  and u2.im_delete_flag = '0' ";
        
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
        RollbackFieldset fieldset = new RollbackFieldset();
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日
			fieldset.rollback_user_nm = resultSet.getString("koshin_nm"); // 処理者
			fieldset.rollback_busho_nm = resultSet.getString("koshin_busho"); // 処理部署
			fieldset.rollback_date = resultSet.getString("koshin_dt"); // 処理日

			fieldset.note = processComment; // 社内共有事項
			

			String baseURL = BaseUrl.get(); //ベースURL
			
			String urlparam = "?proctype=" + proctype; //処理種別
			urlparam += "&imwSystemMatterId="+resultSet.getString("im_system_anken_id"); //システムID
			urlparam += "&imwUserDataId="+imUserDataId; //ユーザデータID
			if (proctype=="3"){
				urlparam += "&imwNodeId=planApplNode_01"; //ノードID 申請者へ
			}else{
				urlparam += "&imwNodeId=planApplNode_03"; //ノードID 受付担当へ
			}
			
			fieldset.next_process_url = baseURL + this.MY_PROCESS_PATH + urlparam; // 次の処理画面URL
			fieldset.anken_all_url = baseURL + this.ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + this.MY_PROCESS_PATH; // MY文書画面URL
			
        }
		return fieldset;
	}	
	
	// 取戻しメールを作成
	public CancelFieldset createCancel(Connection connection,String imUserDataId,String processComment) throws Exception{

        String sql = "";
        sql +=" select ";
        sql +="   s.shinsei_no as shinsei_no";
        sql +="  ,s.title_nm as title_nm";
        sql +="  ,to_char(s.shinsei_dt,'YYYY/MM/DD HH24:MI:SS') as kian_dt";
        sql +="  ,u.im_department_nm as kian_busho ";
        sql +="  ,u.im_user_name as kian_nm ";
        sql +="  ,m.shinsei_typ_nm as shinsei_typ_nm ";
        sql +="  ,s.im_system_anken_id as im_system_anken_id ";
        
        sql +="  ,to_char(s.koshin_dt,'YYYY/MM/DD HH24:MI:SS') as koshin_dt";
        sql +="  ,u2.im_department_nm as koshin_busho ";
        sql +="  ,u2.im_user_name as koshin_nm ";
        
        sql +="	from t_shinsei s ";
        sql +=" left join v_user u ";
        sql +="  on s.kiansha = u.im_user_cd  ";
        sql +="  and u.im_locale_id = 'ja' ";
        sql +="  and u.im_delete_flag = '0' ";
        
        sql +=" left join v_user u2 ";
        sql +="  on s.koshinsha = u2.im_user_cd  ";
        sql +="  and u2.im_locale_id = 'ja' ";
        sql +="  and u2.im_delete_flag = '0' ";
        
        sql +=" left join m_shinsei_typ m ";
        sql +="  on s.shinsei_typ_cd = m.shinsei_typ_cd  ";
        sql +="  and m.sakujo_flg = '0' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, imUserDataId);
        ResultSet resultSet = statement.executeQuery();
        
        CancelFieldset fieldset = new CancelFieldset();
        while (resultSet.next()) {
			fieldset.type = resultSet.getString("shinsei_typ_nm"); // 申請書種別
			fieldset.title_nm = resultSet.getString("title_nm"); // 商品名
			fieldset.shinsei_no = resultSet.getString("shinsei_no"); // 伝票番号（申請番号）
			fieldset.kian_user_nm = resultSet.getString("kian_nm"); // 起案者
			fieldset.kian_busho_nm= resultSet.getString("kian_busho"); // 起案部署
			fieldset.kian_date = resultSet.getString("kian_dt"); // 起案日

			fieldset.cancel_user_nm = resultSet.getString("koshin_nm"); // 処理者
			fieldset.cancel_busho_nm = resultSet.getString("koshin_busho"); // 処理部署
			fieldset.cancel_date = resultSet.getString("koshin_dt"); // 処理日

			String baseURL = BaseUrl.get(); //ベースURL
			
			fieldset.anken_all_url = baseURL + ALL_PROCESS_PATH; // 案件一覧画面URL
			fieldset.my_documents_url = baseURL + MY_PROCESS_PATH; // MY文書画面URL
			
        }
		return fieldset;
	}
	
	// ノードIDから版元名（ノード名）を取得
	public String getNodeName(Connection connection,String userId,String nodeId) throws Exception{
		String node_name = "";
        String sql = "";
        sql +=" select distinct ";
        sql +="  im.node_name as node_name ";
        sql +="	from t_shinsei s ";
        sql +=" left join imw_t_actv_task im ";
        sql +="  on s.im_system_anken_id = im.system_matter_id  ";
        sql +="  and im.node_type = '3' ";
        sql +=" where s.im_user_data_id = ?  ";
        sql +="  and s.sakujo_flg = '0' ";
        sql +="  and im.node_id = ? ";
		
		PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, userId);
        statement.setString(2, nodeId);
        ResultSet resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	node_name = resultSet.getString("node_name");
        }
        return node_name;
	}
	
	
	
	// 処理者のアドレス作成
	public List<String> getUserAddress(Connection connection,String userId) throws Exception{
		// メール取得
		List<String> toAddress = new ArrayList<>();
		String sql = "";
        sql += " select ";
        sql += "   COALESCE(im_email_address1,'') as im_email_address1 ";
        sql += "  ,COALESCE(im_email_address2,'') as im_email_address2  ";
        sql += " from v_user ";
        sql += " where im_user_cd = ?  ";
        sql += "  and im_locale_id = 'ja' ";
        sql += "  and im_delete_flag = '0' ";
		
		PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, userId);
        ResultSet resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	String address1 = resultSet.getString("im_email_address1");
        	String address2 = resultSet.getString("im_email_address2");
        	if (!address1.equals("")) toAddress.add(address1);
        	if (!address2.equals("")) toAddress.add(address2);
        	
        	/*if (address1.equals("") && address2.equals("")){
        		// テストのためダミーアドレス入れておく todoテスト後消す
            	toAddress.add(userId + "@myadress.jp");
        	}*/
        }
		return toAddress;
	}
	
	// toアドレス作成
	public List<String> getSendAddress(Connection connection,String shinseiNo,String nodeKbn) throws Exception {
		// メール取得
		List<String> toAddress = new ArrayList<>();
		
        String sql = "";
		// 受付の場合は受付グループから取得
		if (nodeKbn.equals("02")) {
	        sql += " select ";
	        sql += "   t.user_cd as to_user_cd ";
	        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
	        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
	        sql += " from imm_public_grp_ath t ";
	        sql += " left join v_user u ";
	        sql += "  on t.user_cd = u.im_user_cd  ";
	        sql += "  and u.im_locale_id = 'ja' ";
	        sql += "  and u.im_delete_flag = '0' ";
	        sql += " where t.public_group_cd = ?  ";
	        sql += "  and t.delete_flag = '0'  ";
	        
	    // 申請者へメール
		} else if (nodeKbn.equals("00")) {
	        sql += " select ";
	        sql += "   t.kiansha as to_user_cd ";
	        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
	        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
	        sql += " from t_shinsei t ";
	        sql += " left join v_user u ";
	        sql += "  on t.kiansha = u.im_user_cd  ";
	        sql += "  and u.im_locale_id = 'ja' ";
	        sql += "  and u.im_delete_flag = '0' ";
	        sql += " where t.shinsei_no = ?  ";
	        sql += "  and t.sakujo_flg = '0' ";
			
		} else {
	        sql += " select ";
	        sql += "   t.shorisha as to_user_cd";
	        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
	        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
	        sql += " from t_shinsei_flow t ";
	        sql += " left join v_user u ";
	        sql += "  on t.shorisha = u.im_user_cd  ";
	        sql += "  and u.im_locale_id = 'ja' ";
	        sql += "  and u.im_delete_flag = '0' ";
	        sql += " where t.shinsei_no = ?  ";
	        sql += "  and t.node_kbn = ? ";
	        sql += "  and t.sakujo_flg = '0' ";
		}

        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
		if (nodeKbn.equals("02")){
			statement.setString(1, this.UKETUKE_GROUP_ID);
	        //statement.setString(1, "8eo3ioab1pvt9vz"); //受付グループ ローカル
	        //statement.setString(1, "8eoahihafvxkmvf"); //受付グループ 開発  todo プロパティで持つ
	        //statement.setString(1, "8eqn9g7vvpr8x5p"); //受付グループ 検証器 todo プロパティで持つ
		}else if (nodeKbn.equals("00")){
			statement.setString(1, shinseiNo); //申請者
		}else{
	        statement.setString(1, shinseiNo);
	        statement.setString(2, nodeKbn);
		}

        ResultSet resultSet = statement.executeQuery();
        

        while (resultSet.next()) {
        	String address1 = resultSet.getString("im_email_address1");
        	String address2 = resultSet.getString("im_email_address2");
        	if (!address1.equals("")) toAddress.add(address1);
        	if (!address2.equals("")) toAddress.add(address2);
        	
        	/*if (address1.equals("") && address2.equals("")){
        		// テストのためダミーアドレス入れておく todoテスト後消す
            	toAddress.add(resultSet.getString("to_user_cd") + "@test.jp");
        	}*/
        }
        
		Set<String> setTolist = new HashSet<>(toAddress); //重複は削除
		List<String> tolist = new ArrayList<>(setTolist);
		
    	return tolist;
	}
	
	// toアドレス作成
	public List<String> getSendHankenAddress(Connection connection,String shinseiNo,String hanmotoNm) throws Exception {
		// メール取得
		List<String> toAddress = new ArrayList<>();
		
        String sql = "";
        sql += " WITH hanmoto AS ( ";
        sql += " select distinct hanmoto_cd ,kaigai_flg ,hanmoto_nm || CASE WHEN kaigai_flg='1' THEN '(海外)' ELSE '(国内)' END as hanmoto_nm";
        sql += " from v_character) ";
        
        sql += " select ";
        sql += "   t.shorisha as to_user_cd";
        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
        sql += " from t_shinsei_flow t ";
        sql += " inner join hanmoto han ";
        sql += "  on t.hanmoto_cd = han.hanmoto_cd  ";
        sql += "  and t.kaigai_flg = han.kaigai_flg  ";
        sql += " left join v_user u ";
        sql += "  on t.shorisha = u.im_user_cd  ";
        sql += "  and u.im_locale_id = 'ja' ";
        sql += "  and u.im_delete_flag = '0' ";
        sql += " where t.shinsei_no = ?  ";
        sql += "  and han.hanmoto_nm = ? ";
        sql += "  and t.node_kbn = '03' ";
        sql += "  and t.sakujo_flg = '0' ";
        
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, shinseiNo);
        statement.setString(2, hanmotoNm);
        ResultSet resultSet = statement.executeQuery();
        
        while (resultSet.next()) {
        	String address1 = resultSet.getString("im_email_address1");
        	String address2 = resultSet.getString("im_email_address2");
        	if (!address1.equals("")) toAddress.add(address1);
        	if (!address2.equals("")) toAddress.add(address2);
        	
        	/*if (address1.equals("") && address2.equals("")){
        		// テストのためダミーアドレス入れておく todoテスト後消す
            	toAddress.add(resultSet.getString("to_user_cd") + "@hanken.jp");
        	}*/
        }
        
		Set<String> setTolist = new HashSet<>(toAddress); //重複は削除
		List<String> tolist = new ArrayList<>(setTolist);
        
    	return tolist;
	}	
	
	// toアドレス作成(ノード単位)
	public List<String> getSendMyNodeAddress(Connection connection,String shinseiNo,String node_id) throws Exception {
		// メール取得
		List<String> toAddress = new ArrayList<>();

		String sql = "";
        sql += " WITH wi_node AS (  ";
        sql += "   select han.hanmoto_cd,han.kaigai_flg,tsk.node_name,tsk.system_matter_id,tsk.node_id  ";
        sql += "   from (select distinct hanmoto_cd ,kaigai_flg ,hanmoto_nm || CASE WHEN kaigai_flg='1' THEN '(海外)' ELSE '(国内)' END as node_name from v_character) han  ";
        sql += "   inner join imw_t_actv_task tsk  ";
        sql += "     on han.node_name = tsk.node_name  ";
        sql += "     and tsk.node_type = '3' ) ";
        sql += "  select ";
        sql += "   f.shorisha as to_user_cd ";
        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
        sql += "  ,wi.node_id ";
        sql += "  from t_shinsei_flow f  ";
        sql += "  inner join t_shinsei s  ";
        sql += "   on  f.shinsei_no = s.shinsei_no   ";
        sql += "   and s.sakujo_flg = '0'  ";
        sql += "  inner join wi_node wi  ";
        sql += "   on  s.im_system_anken_id = wi.system_matter_id ";
        sql += "   and  f.hanmoto_cd = wi.hanmoto_cd ";
        sql += "   and  f.kaigai_flg = wi.kaigai_flg ";
        sql += "  left join v_user u  ";
        sql += "   on f.shorisha = u.im_user_cd   ";
        sql += "   and u.im_locale_id = 'ja'  ";
        sql += "   and u.im_delete_flag = '0'  ";
        sql += "  where f.shinsei_no = ? ";
        sql += "   and f.node_kbn = '03'  ";
        sql += "   and f.sakujo_flg = '0'  ";
        if (!node_id.equals("")){
            sql += "  and wi.node_id = ?  ";
        }
        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, shinseiNo);
        if (!node_id.equals("")){
        	statement.setString(2, node_id);
        }
        
        ResultSet resultSet = statement.executeQuery();
        
        while (resultSet.next()) {
        	String address1 = resultSet.getString("im_email_address1");
        	String address2 = resultSet.getString("im_email_address2");
        	if (!address1.equals("")) toAddress.add(address1);
        	if (!address2.equals("")) toAddress.add(address2);
        	
        	/*if (address1.equals("") && address2.equals("")){
        		// テストのためダミーアドレス入れておく todoテスト後消す
            	toAddress.add(resultSet.getString("to_user_cd") + "@test.jp");
        	}*/
        }
        
		Set<String> setTolist = new HashSet<>(toAddress); //重複は削除
		List<String> tolist = new ArrayList<>(setTolist);
        
    	return tolist;
	}	
	// toアドレス作成(メールテーブル
	public List<String> getSendSettingAddress(Connection connection,String shinseiNo) throws Exception {
		// メール取得
		List<String> toAddress = new ArrayList<>();

		String sql = "";
        sql += " select ";
        sql += "   t.user_group_cd as to_user_cd";
        sql += "  ,COALESCE(u.im_email_address1,'') as im_email_address1 ";
        sql += "  ,COALESCE(u.im_email_address2,'') as im_email_address2  ";
        sql += " from t_shinsei_mail t ";
        sql += " left join v_user u ";
        sql += "  on t.user_group_cd = u.im_user_cd  ";
        sql += "  and u.im_locale_id = 'ja' ";
        sql += "  and u.im_delete_flag = '0' ";
        sql += " where t.shinsei_no = ?  ";
        sql += "  and t.sakujo_flg = '0' ";

        
        PreparedStatement statement;
		statement = connection.prepareStatement(sql);
        statement.setString(1, shinseiNo);
        
        ResultSet resultSet = statement.executeQuery();
        while (resultSet.next()) {
        	String address1 = resultSet.getString("im_email_address1");
        	String address2 = resultSet.getString("im_email_address2");
        	if (!address1.equals("")) toAddress.add(address1);
        	if (!address2.equals("")) toAddress.add(address2);
        	
        	/*if (address1.equals("") && address2.equals("")){
        		// テストのためダミーアドレス入れておく todoテスト後消す
            	toAddress.add(resultSet.getString("to_user_cd") + "@test.jp");
        	}*/
        }
        
		Set<String> setTolist = new HashSet<>(toAddress); //重複は削除
		List<String> tolist = new ArrayList<>(setTolist);
        
    	return tolist;
	}		
	
}
