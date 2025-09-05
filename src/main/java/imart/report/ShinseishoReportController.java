package imart.report;

import java.sql.Connection;
import java.util.Date;
import java.util.List;

import com.ibm.icu.text.SimpleDateFormat;

import imart.report.ShinseishoQuery.ReportPattern;
import jp.co.intra_mart.foundation.database.TenantDatabase;
import jp.co.intra_mart.foundation.service.client.file.PublicStorage;

@Deprecated //このコントローラは仮実装（テストドライバレベル）なので、正式実装で不要になれば消してください。
public class ShinseishoReportController {
	
	/**
	 * 帳票ファクトリ列挙体
	 */
	private enum ReportFactory {
		
		/** 新商品-CS */
		NP_CS {

			@Override
			protected boolean is(String typeCd, String jigyobuCd) {
				if ( "1".equals( typeCd ) ) {
					switch ( jigyobuCd ) {
						case "2":
							return true;
						
						default:
							break;
					}
				}
				return false;
			}

			@Override
			protected ShinseishoBase create(
					String templateDirPath, 
					ShinseishoQuery query, 
					String shinseiNo,
					String hanmotoCd, 
					boolean isJp) {
				return new ShinseishoNewProCS( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
			}
			
		},
		/** 新書品-NE */
		NP_NE {

			@Override
			protected boolean is(String typeCd, String jigyobuCd) {
				
				if ( "1".equals( typeCd ) ) {
					switch ( jigyobuCd ) {
						case "1":
						case "6":
						case "7":
							return true;
						
						default:
							break;
					}
				}
				return false;
			}

			@Override
			protected ShinseishoBase create(
					String templateDirPath, 
					ShinseishoQuery query, 
					String shinseiNo,
					String hanmotoCd, 
					boolean isJp) {
				return new ShinseishoNewProNE( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
			}
			
		},
		/** 新商品-その他(AM/LE/SP) */
		NP_OTR {

			@Override
			protected boolean is(String typeCd, String jigyobuCd) {

				if ( "1".equals( typeCd ) ) {
					switch ( jigyobuCd ) {
						case "3":
						case "4":
						case "5":
							return true;
						
						default:
							break;
					}
				}
				return false;
			}

			@Override
			protected ShinseishoBase create(
					String templateDirPath, 
					ShinseishoQuery query, 
					String shinseiNo,
					String hanmotoCd, 
					boolean isJp) {
				return new ShinseishoNewProOther( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
			}
		},
		
		/** 販促物 */
		PROMO {

			@Override
			protected boolean is(String typeCd, String jigyobuCd) {
				return "2".equals( typeCd );
			}

			@Override
			protected ShinseishoBase create(
					String templateDirPath, 
					ShinseishoQuery query, 
					String shinseiNo,
					String hanmotoCd, 
					boolean isJp) {
				return new ShinseishoPromotion( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
			}
		},
		
		/** ダウンロードコンテンツ */
		DLC {

			@Override
			protected boolean is(String typeCd, String jigyobuCd) {
				return "3".equals( typeCd );
			}

			@Override
			protected ShinseishoBase create(
					String templateDirPath, 
					ShinseishoQuery query, 
					String shinseiNo,
					String hanmotoCd,
					boolean isJp) {
				return new ShinseishoDLContents( templateDirPath, query, shinseiNo, hanmotoCd, isJp );
			}
		},
		
		/** 該当なし */
		NONE;
		
		
		/**
		 * @param typeCd 帳票タイプコード
		 * @param jigyobuCd 事業部コード
		 * @return 該当する帳票ファクトリ
		 */
		protected boolean is(String typeCd, String jigyobuCd) {
			
			// デフォルト実装
			return false;
		}
		
		/**
		 * @param templateDirPath
		 * @param query
		 * @param shinseiNo
		 * @param hanmotoCd
		 * @param isJp
		 * @return 帳票出力クラスの生成
		 */
		protected ShinseishoBase create(
				String templateDirPath,
				ShinseishoQuery query,
				String shinseiNo,
				String hanmotoCd,
				boolean isJp) {
			
			// デフォルト実装
			return null;
		}
		
		private static ReportFactory from(String typeCd, String jigyobuCd) {
			
			ReportFactory[] factories = ReportFactory.values();
			for ( ReportFactory factory : factories ) {
				
				// 帳票タイプコードと事業部コードで、対応する帳票ファクトリを決定する。
				if ( factory.is( typeCd, jigyobuCd ) ) return factory;
			}
			
			return ReportFactory.NONE;
		}
	}
	
	
	
	public List<String> create(String shinseiNo) {
		
		// １：public storage のパスを取得。
		PublicStorage ps = new PublicStorage( "template" );
		
		
		// ２：テンプレートディレクトリのパスを取得。
		// TODO：psからの取り出し方が判らんので取り敢えずベタ書き。
		String templateDirPath = "C:/tmp/storage/public/storage/template/";
		
		
		// ３：テナントDB接続を取得。（以降全て共有する）
		TenantDatabase db = new TenantDatabase();
		try ( Connection connection = db.getConnection() ) {
			
			ShinseishoQuery query = ShinseishoQuery.create( connection );
			
			// ４：帳票出力パターンの取得
			// 帳票の出力パターン GroupBy - {帳票タイプ、事業部、版元、海外フラグ} を取得
			List<ReportPattern> patterns = query.selectReportPattern( shinseiNo );
			
			for ( ReportPattern pattern : patterns ) {
				
				// ５：ReportFactoryを使ってReportクラスを生成して帳票作成。
				
				ReportFactory factory = ReportFactory.from(
						pattern.shinsei_typ_cd,
						pattern.jigyobu_cd );
				System.out.println( factory );
				
				if ( ReportFactory.NONE == factory ) continue;
				
				ShinseishoBase report = factory.create(
						templateDirPath,
						query,
						shinseiNo,
						pattern.hanmoto_cd,
						pattern.is_jp );
				
				if ( null != report ) {
					
					String timestamp = new SimpleDateFormat( "_yyyyMMdd_HHmmss" ).format( new Date() );
					
					String filename = "test_" + shinseiNo 
							+ "_" + pattern.hanmoto_cd 
							+ "_" + ( pattern.is_jp ? "jp" : "world" )
							+ timestamp;
					
					report.create();
					report.saveAs( templateDirPath + "/out/" + filename + ".xlsx" );
				}
			}
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
		
		
		// 出力した各帳票ファイルのパスを返す。
		// TODO：未実装
		return null;
	}
}
