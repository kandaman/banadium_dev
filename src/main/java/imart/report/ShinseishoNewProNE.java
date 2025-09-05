package imart.report;

import static imart.report.ShinseishoBase.Util.format;
import static imart.report.ShinseishoBase.Util.nvl;

import com.aspose.cells.Cells;
import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;

import imart.report.ShinseishoQuery.ReportDetail;

/**
 * 申請書（新商品NE）出力クラス.
 *
 * @see ShinseishoBase
 */
public class ShinseishoNewProNE extends ShinseishoBase {
	
	public ShinseishoNewProNE(
			String templateDirPath,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp) {
		super( templateDirPath,
				isJp ? "新商品_国内版NE.xlsx" : "新商品_海外版NE.xlsx",
				query,
				shinseiNo,
				hanmotoCd,
				isJp,
				// 新商品NEでは国内版は単票形式。
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
		
		// 新商品NEでは国内外で固定部に違いがある。
		
		sheet.getRangeByName( "TITLE" ).setValue( data.title_nm );
		sheet.getRangeByName( "GENRE" ).setValue( data.genre );
		
		sheet.getRangeByName( "BIKO" ).setValue( data.biko );
		
		// 国内
		if ( this.isJp ) {
			String kakaku = asKakakuString( data );
			
			sheet.getRangeByName( "HATUBAI_YMD" ).setValue( data.hatubai_ymd );
			sheet.getRangeByName( "PLATFORM" ).setValue( data.platform_nm );
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
		
		// 新商品NEでは、海外版のみ一覧形式。
		
		Cells cells = sheet.getCells();
		
		String kakaku = asKakakuString( data );
		
		cells.get( row, Column.A ).setValue( num );
		cells.get( row, Column.B ).setValue( data.region_kuni_nm );
		cells.get( row, Column.L ).setValue( data.platform_nm );
		cells.get( row, Column.V ).setValue( data.hatubai_ymd );
		cells.get( row, Column.AF ).setValue( kakaku );
	}
	
	private String asKakakuString( ReportDetail data ) {
		
		// NE は特殊仕様あり。
		// ●「価格帯区分：ダウンロード無料／一部アイテム課金有」の場合はその文言。
		// ●「価格帯区分」が上記以外の場合は金額データ。
		switch ( nvl( data.kakakutai_kbn, "" ) ) {
			
			case "":
			case Constants.KakakutaiCode.SONOTA:
				// 金額を直接出すパターン
				// 通貨：日本の場合は少数以下なし
				if ("JPY".equals(data.tuka_cd)){
					return format( data.tuka_kigo, data.kakaku,"#,##0");
				}else{
					return format( data.tuka_kigo, data.kakaku );
				}				
			
			default:
				// マスタ文言を出すパターン
				return nvl( data.kakakutai_nm, "" );
		}
	}
}
