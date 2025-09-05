package imart.report;

import org.apache.commons.lang.NotImplementedException;

import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;

import imart.report.ShinseishoQuery.ReportDetail;

/**
 * 申請書（販促物）出力クラス.
 *
 * @see ShinseishoBase
 */
public class ShinseishoPromotion extends ShinseishoBase {
	
	public ShinseishoPromotion(
			String templateDirPath,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp) {
		super( templateDirPath,
				isJp ? "販促物_国内版.xlsx" : "販促物_海外版.xlsx",
				query,
				shinseiNo,
				hanmotoCd,
				isJp,
				// 販促物ではどちらも単票形式
				ReportStyle.SINGLE );
	}
	
	@Override
	protected void plotNamedCell(Workbook book, ReportDetail data) {
		
		WorksheetCollection sheet = book.getWorksheets();
		
		// 販促物では国内外による固定部の違いはないので共通処理。
		sheet.getRangeByName( "TITLE" ).setValue( data.title_nm );
		sheet.getRangeByName( "KIKAN" ).setValue( data.kikan );
		sheet.getRangeByName( "EVENT" ).setValue( data.event_nm_basho );
		sheet.getRangeByName( "SURYO" ).setValue( data.suryo );
		
		sheet.getRangeByName( "BIKO" ).setValue( data.biko );
	}
	
	@Override
	protected ListConfig createListConfig() {
		throw new NotImplementedException( "販促物は単票形式のみ" );
	}
	
	@Override
	protected void plotLineData(Workbook book, Worksheet sheet, int row, int num, ReportDetail data) {
		throw new NotImplementedException( "販促物は単票形式のみ" );
	}
}
