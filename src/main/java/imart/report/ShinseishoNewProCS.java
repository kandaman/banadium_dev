package imart.report;

import static imart.report.ShinseishoBase.Util.format;
import static imart.report.ShinseishoBase.Util.nvl;

import com.aspose.cells.Cells;
import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;

import imart.report.ShinseishoQuery.ReportDetail;

/**
 * 申請書（新商品CS）出力クラス.
 *
 * @see ShinseishoBase
 */
public class ShinseishoNewProCS extends ShinseishoBase {
	
	public ShinseishoNewProCS(
			String templateDirPath,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp) {
		super( templateDirPath,
				isJp ? "新商品_国内版CS.xlsx" : "新商品_海外版CS.xlsx",
				query,
				shinseiNo,
				hanmotoCd,
				isJp,
				// 新商品CSではどちらも一覧形式
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
		
		boolean dlc = "1".equals( data.dlc_flg );
		
		// 新商品CSでは国内外による固定部の違いはないので共通処理。
		
		sheet.getRangeByName( "TITLE" ).setValue( data.title_nm );
		sheet.getRangeByName( "DLC" ).setValue( dlc ? "有り" : "無し" );
		sheet.getRangeByName( "GENRE" ).setValue( data.genre );
		
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
				16, // baseRowNo,
				3,  // rowsOfLine,
				12, // linesOfPage1,
				17, // linesOfPages,
				5,  // linesTemplateDefault,
				11  // linesFooterNoBreak
		);
	}
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.ShinseishoBase#plotLineData(com.aspose.cells.Workbook, com.aspose.cells.Worksheet, int, int, imart.report.ShinseishoQuery.ReportDetail)
	 */
	@Override
	protected void plotLineData(
			Workbook book,
			Worksheet sheet,
			int row,
			int num,
			ReportDetail data) {
		
		Cells cells = sheet.getCells();
		
		// 共通
		cells.get( row, Column.A ).setValue( num );
		cells.get( row, Column.B ).setValue( data.meisai_gyo_nm );
		
		cells.get( row + 2, Column.D ).setValue( data.biko_meisai );
		
		// 国内
		if ( this.isJp ) {
			
			String kakaku = asKakakuString( data );
			String dlban_kakaku = asDlKakakuString( data );
			
			cells.get( row, Column.S ).setValue( data.platform_nm );
			cells.get( row, Column.X ).setValue( data.hatubai_ymd );
			cells.get( row, Column.AC ).setValue( kakaku );
			cells.get( row, Column.AG ).setValue( data.suryo );
			cells.get( row, Column.AK ).setValue( dlban_kakaku );
		}
		// 海外
		else {
			
			String kakaku = asKakakuString( data );
			String dlban_kakaku = asDlKakakuString( data );
			
			cells.get( row, Column.N ).setValue( data.region_kuni_nm );
			cells.get( row, Column.R ).setValue( data.tuka_nm );
			cells.get( row, Column.V ).setValue( data.platform_nm );
			cells.get( row, Column.Z ).setValue( data.hatubai_ymd );
			cells.get( row, Column.AD ).setValue( kakaku );
			cells.get( row, Column.AH ).setValue( data.suryo );
			cells.get( row, Column.AL ).setValue( dlban_kakaku );
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
	
	private String asDlKakakuString( ReportDetail data ) {
		
		// 「DL版区分」に応じて出力内容を切り替える。
		switch ( nvl( data.dlban_kbn, "" ) ) {
			
			case "":
			case Constants.DLVersionCode.ARI:
				// 「DL版：あり」の場合は、DL版価格を出力。
				if ("JPY".equals(data.tuka_cd)){
					return format( data.tuka_kigo, data.dlban_kakaku,"#,##0");
				}else{
					return format( data.tuka_kigo, data.dlban_kakaku );
				}				
			default:
				// 上記以外はDL版区分の名称（コードマスタ）を出力。
				return nvl( data.dlban_nm, "" );
		}
	}
}
