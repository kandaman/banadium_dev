package imart.report;

import static imart.report.ShinseishoBase.Util.format;

import com.aspose.cells.Cells;
import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;

import imart.report.ShinseishoQuery.ReportDetail;

/**
 * 申請書（新商品その他）出力クラス.
 *
 * @see ShinseishoBase
 */
public class ShinseishoNewProOther extends ShinseishoBase {
	
	public ShinseishoNewProOther(
			String templateDirPath,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp) {
		super( templateDirPath,
				isJp ? "新商品_国内版ALS.xlsx" : "新商品_海外版ALS.xlsx",
				query,
				shinseiNo,
				hanmotoCd,
				isJp,
				// 新商品その他では国内版は単票形式。
				isJp ? ReportStyle.SINGLE : ReportStyle.LIST );
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#plotNamedCell(com.aspose.cells.Workbook, imart.report.ShinseishoQuery.ReportDetail)
	 */
	@Override
	protected void plotNamedCell(Workbook book, ReportDetail data) {
		
		WorksheetCollection sheet = book.getWorksheets();
		
		// 新商品その他では国内外で固定部に違いがある。
		
		
		sheet.getRangeByName( "TITLE" ).setValue( data.title_nm );
		sheet.getRangeByName( "GENRE" ).setValue( data.genre );
		
		sheet.getRangeByName( "BIKO" ).setValue( data.biko );
		
		// 国内
		if ( this.isJp ) {
			
			String kakaku = asKakakuString( data );
			
			sheet.getRangeByName( "HATUBAI_YMD" ).setValue( data.hatubai_ymd );
			sheet.getRangeByName( "PLATFORM" ).setValue( data.platform_nm );
			sheet.getRangeByName( "SURYO" ).setValue( data.suryo );
			sheet.getRangeByName( "KAKAKU" ).setValue( kakaku );
		}
		
		// 海外は一覧部。
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#createListConfig()
	 */
	@Override
	protected ListConfig createListConfig() {
		
		return new ListConfig(
				16, // baseRowNo,
				2,  // rowsOfLine,
				19, // linesOfPage1,
				27, // linesOfPages,
				5,  // linesTemplateDefault,
				12  // linesFooterNoBreak
		);
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#plotLineData(com.aspose.cells.Workbook, com.aspose.cells.Worksheet, int, int, imart.report.ShinseishoQuery.ReportDetail)
	 */
	@Override
	protected void plotLineData(Workbook book, Worksheet sheet, int row, int num, ReportDetail data) {
		
		// 新商品その他では、海外版のみ一覧形式。
		
		Cells cells = sheet.getCells();
		
		String kakaku = asKakakuString( data );
		
		cells.get( row, Column.A ).setValue( num );
		cells.get( row, Column.B ).setValue( data.region_kuni_nm );
		cells.get( row, Column.I ).setValue( data.tuka_nm );
		cells.get( row, Column.P ).setValue( data.platform_nm );
		cells.get( row, Column.W ).setValue( data.hatubai_ymd );
		cells.get( row, Column.AD ).setValue( kakaku );
		cells.get( row, Column.AJ ).setValue( data.suryo );
	}
	
	private String asKakakuString( ReportDetail data ) {
		
		// その他 は特殊仕様がないので素直に金額データを引っこ抜いて渡す。
		return format( data.tuka_kigo, data.kakaku );
	}
}
