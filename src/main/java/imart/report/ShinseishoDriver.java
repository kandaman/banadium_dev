package imart.report;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.apache.commons.io.IOUtils;
import org.apache.tools.zip.ZipEntry;
import org.apache.tools.zip.ZipOutputStream;

import com.aspose.cells.License;

import jp.co.intra_mart.foundation.database.TenantDatabase;

public class ShinseishoDriver {
	
	public String create(
			String userId,
			String sessionId,
			String shinseiNo,
			String reportType, 
			String hanmotoCd,
			String kaigaiFlg) {
		
		try {

        	// ライセンス設定
        	License license = new License();
        	license.setLicense("Aspose.Cells.lic");

			// 作業用ディレクトリ作成
			File folder = Reports.createTemporaryFolder(userId, sessionId, "work");
			
	
	        if (!hanmotoCd.equals("")){
        	    //System.out.println("版元"+hanmotoCd);
	            // 版元が決まっている場合（単一）
    			core( kaigaiFlg, shinseiNo, hanmotoCd, reportType,folder.getPath());
	        }else{
	        	// DB接続
	            TenantDatabase database = new TenantDatabase();
	            try( Connection connection = database.getConnection() ) {
	            	
	            	// 版元毎に出力
	            	String sql = "select distinct hanmoto_cd,kaigai_flg from t_shinsei_character where shinsei_no = ? and sakujo_flg ='0'";
	            	PreparedStatement statement = connection.prepareStatement(sql);
	            	statement.setString(1, shinseiNo);
	            	ResultSet resultSet = statement.executeQuery();
	            	
	            	while (resultSet.next()) {
	            		hanmotoCd = resultSet.getString("hanmoto_cd");
	            		kaigaiFlg = resultSet.getString("kaigai_flg");
	            		core( kaigaiFlg, shinseiNo, hanmotoCd, reportType,folder.getPath());
	            	}
	            }
	            
	        }
	        
	        // ワークフォルダ以下のファイルを取得
	        File[] files = folder.listFiles();
	        //zos = new ZipOutputStream(new BufferedOutputStream(new FileOutputStream(new File(folder.getPath() + "/hoge.zip"))));
	        //createZip(zos, files);
			String timestamp = Reports.timestamp();
	        String zipname = folder.getPath() + "/Cactus_" + timestamp + ".zip"; // zipファイル名は「Cactus_年月日_時分秒」固定になった
	        
	        createZip(zipname,folder.getPath() ,files);
	        //createZip(folder.getPath() + "/hoge3.zip",files);
	        
	        return zipname;
		}
		catch ( Exception ex ) {
			throw new RuntimeException( ex );
		} finally {
	        //IOUtils.closeQuietly(zos);
	    }
	}

	public static void createZip(String filename, String base, File[] files) throws IOException{
	    //try(ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(filename)))
		ZipOutputStream zos = null;
	    try
	    {
	    	zos = new ZipOutputStream(new FileOutputStream(filename));
	    	zos.setEncoding("MS932"); //日本語ファイル対応
	        for(File file : files){
        	    //System.out.println("ファイルパス："+file.getName());
	        	
	            zos.putNextEntry(new ZipEntry(file.getName()));
	            Path p = Paths.get(base, file.getName());
	            Files.copy(p, zos);
	            zos.closeEntry();
	        }
	    } finally {
	        IOUtils.closeQuietly(zos);
	    }
	}
	// フォルダ内ファイル削除
	public void deleteFiles(String folderPaht) {
		File delFolder = new File(folderPaht); 
		File[] files = delFolder.listFiles();
        for(int i=0; i<files.length; i++) {
            files[i].delete();
        }
	}
	
	private void core(String kaigaiFlg, String shinseiNo, String hanmotoCd, String reportType,String outputPath) throws Exception {
		//String templateDirPath = "commonContents/template";
		
		String templateDirPath = Reports.Dir.template();
		
		TenantDatabase db = new TenantDatabase();
		try ( Connection connection = db.getConnection() ) {
			
			ShinseishoQuery query = ShinseishoQuery.create( connection );
			
			boolean isJp = "0".equals( kaigaiFlg );
			
			ShinseishoBase report;
			
			switch ( reportType ) {
				case "1":
					report = new ShinseishoNewProCS( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
					break;
					
				case "2":
					report = new ShinseishoNewProNE( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
					break;
					
				case "3":
					report = new ShinseishoNewProOther( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
					break;
				
				case "4":
					report = new ShinseishoDLContents( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
					break;
					
				case "5":
					report = new ShinseishoPromotion( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
					break;
					
				default:
					report = null;
					break;
			}
			
			if ( null != report ) {
				
				report.create();
				
				//report.saveAs( templateDirPath + "/out/" + report.filename.replace(".xlsx", "") + report.hanmotoCd + ".xlsx" );
				
				String filename = asSaveFileName( report );
				report.saveAs( outputPath + "/" + filename );
				
			}
		}
	}
	
	private String asSaveFileName(ShinseishoBase report) {
		
		// 保存実行時のタイムスタンプをファイル名に付与する。
		String timestamp = Reports.timestamp();
		
		// 拡張子を削って、ファイル名末尾のアルファベット（事業部コード）があれば消す。
		String basename = report.filename
				.replace( ".xlsx", "" )
				.replaceAll( "[a-zA-Z]*$", "" );
		
		return basename 
				+ "_" + report.hanmotoCd 
				+ "_" + timestamp 
				+ ".xlsx";
	}
}
