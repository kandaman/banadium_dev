package imart.report;

import static imart.report.ShinseishoBase.Util.format;

import com.aspose.cells.Cells;
import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;

import imart.report.ShinseishoQuery.ReportDetail;

/**
 * 申請書（DLC）出力クラス.
 *
 * @see ShinseishoBase
 */
public class ShinseishoDLContents extends ShinseishoBase {
	
	public ShinseishoDLContents(
			String templateDirPath,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp) {
		super( templateDirPath,
				isJp ? "DLC_国内版.xlsx" : "DLC_海外版.xlsx",
				query,
				shinseiNo,
				hanmotoCd,
				isJp,
				// DLCではどちらも一覧形式
				ReportStyle.LIST );
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#plotNamedCell(com.aspose.cells.Workbook, imart.report.ShinseishoQuery.ReportDetail)
	 */
	@Override
	protected void plotNamedCell(Workbook book, ReportDetail data) {
		
		WorksheetCollection sheet = book.getWorksheets();
		
		// DLCでは国内外による固定部の違いはないので共通処理。
		
		sheet.getRangeByName( "TITLE" ).setValue( data.title_nm );
		
		sheet.getRangeByName( "BIKO" ).setValue( data.biko );
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#createListConfig()
	 */
	@Override
	protected ListConfig createListConfig() {
		
		return new ListConfig(
				13, // baseRowNo,
				3,  // rowsOfLine,
				13, // linesOfPage1,
				17, // linesOfPages,
				5,  // linesTemplateDefault,
				8   // linesFooterNoBreak
		);
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#plotLineData(com.aspose.cells.Workbook, com.aspose.cells.Worksheet, int, int, imart.report.ShinseishoQuery.ReportDetail)
	 */
	@Override
	protected void plotLineData(Workbook book, Worksheet sheet, int row, int num, ReportDetail data) {
		
		Cells cells = sheet.getCells();
		
		// 共通
		cells.get( row, Column.A ).setValue( num );
		cells.get( row, Column.B ).setValue( data.meisai_gyo_nm );
		
		cells.get( row + 2, Column.D ).setValue( data.biko_meisai );
		
		String kakaku = asKakakuString( data );
		
		// 国内
		if ( this.isJp ) {
			cells.get( row, Column.V ).setValue( data.hatubai_ymd );
			cells.get( row, Column.AF ).setValue( kakaku );
		}
		// 海外
		else {
			cells.get( row, Column.V ).setValue( data.region_kuni_nm );
			cells.get( row, Column.AA ).setValue( data.tuka_nm );
			cells.get( row, Column.AF ).setValue( data.hatubai_ymd );
			cells.get( row, Column.AK ).setValue( kakaku );
		}
	}

	private String asKakakuString( ReportDetail data ) {
		// 通貨：日本の場合は少数以下なし
		if ("JPY".equals(data.tuka_cd)){
			return format( data.tuka_kigo, data.kakaku,"#,##0");
		}else{
			return format( data.tuka_kigo, data.kakaku );
		}
	}
}
