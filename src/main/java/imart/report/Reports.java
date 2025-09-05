package imart.report;

import java.io.File;
import java.util.Date;

import com.ibm.icu.text.SimpleDateFormat;

public class Reports {

	private static final String TIMESTAMP = "yyyyMMdd_HHmmss";
	private static final String DATE = "yyyyMMdd";
	private static final String TIME = "HHmmss";
	
	private static final String TEMPLATE_DIR = "/webapps/imart/cactus_template";
	
	public static final String timestamp() {
		return new SimpleDateFormat( TIMESTAMP ).format( new Date() );
	}
	public static final String date() {
		return new SimpleDateFormat( DATE ).format( new Date() );
	}
	public static final String time() {
		return new SimpleDateFormat( TIME ).format( new Date() );
	}
	
	public static final class Dir {
		public static final String root() {
			return new File( "." ).getAbsoluteFile().getParent();
		}
		
		public static final String template() {
			return root() + TEMPLATE_DIR;
		}
		
		// 本当はnio系の Paths#get 使った方がいいと思うけど、既存実装が old-io 系だったので。
		public static final String combine( String... paths ) {
			
			StringBuilder sb = new StringBuilder();
			
			String separator = "";
			for ( String path : paths ) {
				sb.append( separator );
				sb.append( path );
				separator = "/";
			}
			return sb.toString();
		}
	}
	
	public static final File createTemporaryFolder(
			final String userId, 
			final String sessionId, 
			final String folderName) {
		
		String yyyymmdd = date();
		String hhmmss = time();
		
		// パスを生成。
		String base = Dir.template(); 
		String path = Dir.combine( 
				// ベースディレクトリを基準に指定された名称のフォルダを作成し、
				// その下に 日付/sessionId/時刻 形式のサブフォルダを切る。
				// 
				base
				, folderName
				, yyyymmdd
				, sessionId
				, hhmmss
		);
		
		
		File folder = new File( path );

		// 作業用ディレクトリ作成
		if ( !folder.exists() ) {
			if ( folder.mkdirs() ) {
				// System.out.println("フォルダの作成に成功しました");
			}
		}
        
        return folder;
	}
}
