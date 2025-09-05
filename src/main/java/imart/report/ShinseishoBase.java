package imart.report;

import java.math.BigDecimal;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;

import com.aspose.cells.Cells;
import com.aspose.cells.Workbook;
import com.aspose.cells.Worksheet;
import com.aspose.cells.WorksheetCollection;
import com.ibm.icu.text.DecimalFormat;

import imart.report.ShinseishoQuery.ReportDetail;



/**
 * 申請書の共通基底クラス.
 * 
 * @see imart.report.AsposeBase
 * @see imart.report.ShinseishoQuery
 */
public abstract class ShinseishoBase extends AsposeBase {
	
	/** 申請書出力クエリセット */
	protected final ShinseishoQuery query;
	
	/** 申請書番号 */
	protected final String shinseiNo;
	/** 版元コード */
	protected final String hanmotoCd;
	/** 国内フラグ（海外フラグの反転値） */
	protected final boolean isJp;
	/** テンプレートファイル名 */
	protected final String filename;
	
	/**
	 * 帳票形式を示す列挙体
	 */
	protected enum ReportStyle {
		/** 単票形式（明細部なし） */
		SINGLE,
		/** 一覧形式（明細部あり） */
		LIST,
		;
		
		private boolean isSingle() {
			return this == SINGLE;
		}
	}
	
	/** 帳票形式 */
	private final ReportStyle style;
	
	/**
	 * @param templateDirPath テンプレートのディレクトリパス
	 * @param templateFileName テンプレートのファイル名
	 * @param query 申請書出力クエリセット
	 * @param shinseiNo 申請書番号
	 * @param hanmotoCd 版元コード
	 * @param isJp 国内フラグ
	 * @param style 帳票形式（単票 or 一覧）
	 */
	protected ShinseishoBase(
			String templateDirPath,
			String templateFileName,
			ShinseishoQuery query,
			String shinseiNo,
			String hanmotoCd,
			boolean isJp,
			ReportStyle style) {
		
		super( Util.path( templateDirPath, templateFileName ) );
		
		this.query = query;
		
		this.shinseiNo = shinseiNo;
		this.hanmotoCd = hanmotoCd;
		this.isJp = isJp;
		this.filename = templateFileName;
		
		this.style = style;
	}
	
	
	/*
	 * (非 Javadoc)
	 * 
	 * @see imart.report.AsposeBase#execute(com.aspose.cells.Workbook)
	 */
	@Override
	protected void execute(Workbook book) throws Exception {
		
		// ①ヘッダ／フッタ／共通部の出力。
		this.outputCommonParts( book );
		
		// ②キャラクタ名の出力
		this.outputCharactor( book );
		
		// ③帳票データの出力
		this.outputReport( book );
	}
	
	private void outputCommonParts(Workbook book) throws Exception {
		
		WorksheetCollection sheets = book.getWorksheets();
		
		sheets.getRangeByName( "H_SHINSEI_NO" ).setValue( this.shinseiNo );
		sheets.getRangeByName( "H_DATE" ).setValue( new Date() );
	}
	
	private void outputCharactor(Workbook book) throws Exception {
		
		List<String> charactors = this.getCharactors();
		
		// キャラクター名が１０件を超える場合
		if ( 10 < charactors.size() ) {
			this.onCharactorsOver( book, charactors );
		}
		// キャラクター名が１０件以内の場合
		else {
			this.onCharactorsUnder( book, charactors );
		}
	}
	
	// 「別紙」に出力して固定部に "別紙参照" とする。
	// ※ 実際にはテンプレートに別紙参照と仕込んでおくので、ここでは別紙出力のみ。
	protected void onCharactorsOver(Workbook book, List<String> charactors) throws Exception {
		
		Worksheet sheet = book.getWorksheets().get( "別紙" );
		Cells cells = sheet.getCells();
		
		
		// 基準Row番号（一覧のヘッダ部直下、最初のデータ行のRow番号）
		final int baseRowNo = 9;
		int row = baseRowNo - 1; // ※ aspose では行列ともに [1-based-number] ではなく [0-based-index] で扱う。
		
		
		// ■テンプレートの不足行を補完。
		ListConfig config = new ListConfig( 
				baseRowNo, 
				1,    // データ１行あたりの構成Row数
				14 ); // テンプレートの初期データ行数
		this.copyTemplateLines( cells, config, charactors.size() );
		
		
		// ■キャラクター名を列挙して一覧に出力。
		int n = 0;
		for ( String charactor : charactors ) {
			cells.get( row, Column.A ).setValue( ++n );
			cells.get( row, Column.C ).setValue( charactor );
			row++;
		}
	}
	
	
	
	// 固定部に出力して「別紙」シートを消す。
	protected void onCharactorsUnder(Workbook book, List<String> charactors) throws Exception {
		
		WorksheetCollection sheets = book.getWorksheets();
		
		String value = Util.join( "/", charactors );
		sheets.getRangeByName( "CHAR_NAME" ).setValue( value );
		
		sheets.removeAt( "別紙" );
	}
	
	
	private void outputReport(Workbook book) throws Exception {
		// 単票形式
		if ( this.style.isSingle() ) {
			this.onSingleReport( book );
		}
		// 一覧形式
		else {
			this.onListReport( book );
		}
	}
	
	protected void onSingleReport(Workbook book) throws Exception {
		
		// 単票形式の出力データを取得。
		ReportDetail detail = this.getData();
		
		// データが取れなければテンプレートをそのまま出力する。
		if (detail != null){
			// 単票の場合は固定部のプロットのみで終了。
			this.plotNamedCell( book, detail );
		}
	}
	
	protected void onListReport(Workbook book) throws Exception {
		
		// 一覧形式の出力データを取得。
		List<ReportDetail> details = this.getDataList();

		// データが取れなければテンプレートをそのまま出力する。	
		if (0 != details.size()) {

			// 最初の１件を取り出して固定部のデータを埋める。
			ReportDetail head = details.get(0);
			this.plotNamedCell(book, head);

			// 一覧部に行データを出力する。
			this.onListData(book, details);
		}
	}
	
	protected void onListData(Workbook book, List<ReportDetail> details) throws Exception {
		
		Worksheet sheet = book.getWorksheets().get( 0 );
		Cells cells = sheet.getCells();
		
		// ■一覧部の構成情報を生成。
		ListConfig config = this.createListConfig();
		
		
		final int count = details.size(); // データ行数    ：そのまま。出力すべきデータの論理数。
		int lines = 0;                    // ラインカウンタ：出力したデータ行数をカウントする。PageBreakしたらリセット。
		int limit = config.linesOfPage1;  // ラインリミット：PageBreakが必要なデータ行数。１ページめと２ページめ以降で値が異なる。
		
		
		// ■不足するテンプレート行のコピー
		this.copyTemplateLines( cells, config, count );
		
		
		final int baseRowNo = config.baseRowNo;
		int row = baseRowNo - 1;
		
		// ■データを列挙
		for ( int i = 0; i < count; i++ ) {
			
			// ■■PageBreak判定：
			if ( lines == limit ) {
				// カウンタをリセット
				lines = 0;
				limit = config.linesOfPages;
				
				// 改ページを打つ
				sheet.getHorizontalPageBreaks().add( row );
			}
			
			
			// ■■行データの出力：
			final ReportDetail data = details.get( i );
			final int num = i + 1;
			this.plotLineData( book, sheet, row, num, data );
			
			
			// ■■シーク処理：
			row += config.rowsOfLine;
			lines++;
		}
		
		
		// ■フッタ部（備考欄のうえ）の PageBreak 判定。
		
		// １ページめに収まっているケース：
		if ( count < config.linesOfPage1 ) {
			
			// １ページに収まる最大行数の差分値を取得。
			int diff = config.linesOfPages 
					 - config.linesOfPage1;
			
			// 差分を加味した出力行数と、フッタのPageBreak閾値を判定。
			if ( config.linesFooterNoBreak < lines + diff ) {
				sheet.getHorizontalPageBreaks().add( row );
			}
		}
		// ２ページめ以降に進んでいるケース：
		else {
			
			// ２ページめ以降はどのページでも条件が変わらないので普通に判定。
			if ( config.linesFooterNoBreak < lines ) {
				sheet.getHorizontalPageBreaks().add( row );
			}			
		}
	}
	
	
	/**
	 * 帳票固定部データ出力処理 {@code (abstract)}.
	 * 
	 * <p>
	 * 派生クラスにて、帳票の固定部へのデータ出力処理を実装します。<br>
	 * ここでは、テンプレートファイルに設定した名前定義による、<br>
	 * {@code Cell/Range} へのダイレクトなプロットを行います。
	 * </p>
	 * 
	 * @param book {@link Workbook} オブジェクト
	 * @param data 出力データ
	 * 
	 * @see com.aspose.cells.Workbook#getWorksheets()
	 * @see com.aspose.cells.WorksheetCollection#getRangeByName(String)
	 */
	protected abstract void plotNamedCell(
			Workbook book,
			ReportDetail data) throws Exception;
	
	/**
	 * 一覧部の構成情報.
	 * 
	 * <p>
	 * 一覧形式帳票（{@link ReportStyle#LIST}）に於ける、一覧部の構成を示す {@code value-object} です。<br>
	 * このクラスは、帳票毎に異なる一覧部レイアウトに基づく情報を保持します。<br>
	 * <ul>
	 * <li>{@link #baseRowNo}
	 * <li>{@link #rowsOfLine}
	 * <li>{@link #linesOfPage1}
	 * <li>{@link #linesOfPage2}
	 * <li>{@link #linesFooterNoBreak}
	 * </ul>
	 * 派生クラスが生成する設定情報を元に、本クラスにて一覧部の基本的な列挙処理を共通化します。<br>
	 * </p>
	 * 
	 * @see ShinseishoBase#createListConfig()
	 * @see ShinseishoBase#plotLineData(Workbook, Worksheet, int, int, ReportDetail)
	 */
	protected static class ListConfig {
		
		/** 基準Row番号 {@code (1-based-number)} */
		public final int baseRowNo;
		
		/** データ行を構成するRow数 */
		public final int rowsOfLine;
		
		/** 最初のページに含められるデータ行数 */
		public final int linesOfPage1;
		
		/** ２ページめ以降に含められるデータ行数 */
		public final int linesOfPages;
		
		
		/** テンプレートにデフォルトで用意されているデータ行数 */
		public final int linesTemplateDefault;
		
		/** ２ページめ以降、フッタ部を改ページせずに済むデータ行数 */
		public final int linesFooterNoBreak;
		
		
		/**
		 * コンストラクタ（改ページ関連情報あり）
		 */
		public ListConfig(
				int baseRowNo,
				int rowsOfLine,
				int linesOfPage1,
				int linesOfPages,
				int linesTemplateDefault,
				int linesFooterNoBreak) {
			this.baseRowNo = baseRowNo;
			this.rowsOfLine = rowsOfLine;
			this.linesOfPage1 = linesOfPage1;
			this.linesOfPages = linesOfPages;
			this.linesTemplateDefault = linesTemplateDefault;
			this.linesFooterNoBreak = linesFooterNoBreak;
		}
		
		// 基底クラスで完結してる「別紙」の一覧部に使用するコンストラクタ。（改ページに関する情報が不要）
		/**
		 * コンストラクタ（改ページ関連情報なし）
		 */
		public ListConfig(
				int baseRowNo,
				int rowsOfLine,
				int linesTemplateDefault) {
			
			this.baseRowNo = baseRowNo;
			this.rowsOfLine = rowsOfLine;
			this.linesOfPage1 = 0;
			this.linesOfPages = 0;
			this.linesTemplateDefault = linesTemplateDefault;
			this.linesFooterNoBreak = 0;
		}
	}
	
	/**
	 * 一覧部設定情報の生成処理 {@code (abstract)}.
	 * 
	 * @return 帳票一覧部の構成を示す {@link ListConfig} オブジェクト
	 */
	protected abstract ListConfig createListConfig() throws Exception;
	
	
	
	/**
	 * 行データの出力処理 {@code (abstract)}.
	 * 
	 * @param book {@link Workbook} オブジェクト
	 * @param sheet {@link Worksheet} オブジェクト
	 * @param row データ出力先の基準行インデックス
	 * @param num データの通し番号
	 * @param data データ
	 */
	protected abstract void plotLineData(
			Workbook book,
			Worksheet sheet,
			int row,
			int num,
			ReportDetail data) throws Exception;
	
	
	
	/**
	 * テンプレート行のコピー処理（一覧の不足行補完）.
	 * 
	 * @param cells {@link Cells} オブジェクト
	 * @param config 一覧部の詳細設定情報
	 * @param datasize 一覧部に出力するデータの件数
	 */
	protected final void copyTemplateLines(
			Cells cells,
			ListConfig config,
			int datasize) throws Exception {
		
		// テンプレートのデフォルト以内なら増やさなくて良い。
		if ( datasize <= config.linesTemplateDefault ) return;
		
		// デフォルトで足りない場合は増やす。
		final int lines = datasize - config.linesTemplateDefault;
		final int rows = lines * config.rowsOfLine;
		
		final int srcRow = config.baseRowNo - 1;
		final int dstRow = srcRow + config.rowsOfLine;
		
		
		Util.insertRows( cells, dstRow, rows );
		Util.copyRows( cells, srcRow, dstRow, config.rowsOfLine, lines );
	}
	
	
	/**
	 * @return {@link ShinseishoQuery#selectReportDetail(String, boolean)}
	 */
	private ReportDetail getData() {
		return query.selectReportDetail( this.shinseiNo, this.isJp );
	}
	
	/**
	 * @return {@link ShinseishoQuery#selectReportDetails(String, boolean)}
	 */
	private List<ReportDetail> getDataList() {
		return query.selectReportDetails( this.shinseiNo, this.isJp );
	}
	
	/**
	 * @return {@link ShinseishoQuery#selectCharactors(String, String, boolean)}
	 */
	private List<String> getCharactors() {
		return query.selectCharactors( this.shinseiNo, this.hanmotoCd, this.isJp );
	}
	
	
	/**
	 * カラムのインデックス定数
	 */
	public static final class Column {
		
		// Excelで [A-AZ] まで量産。
		
		/** カラムインデックス：A({@value}) */	public static final int A = 0;
		/** カラムインデックス：B({@value}) */	public static final int B = 1;
		/** カラムインデックス：C({@value}) */	public static final int C = 2;
		/** カラムインデックス：D({@value}) */	public static final int D = 3;
		/** カラムインデックス：E({@value}) */	public static final int E = 4;
		/** カラムインデックス：F({@value}) */	public static final int F = 5;
		/** カラムインデックス：G({@value}) */	public static final int G = 6;
		/** カラムインデックス：H({@value}) */	public static final int H = 7;
		/** カラムインデックス：I({@value}) */	public static final int I = 8;
		/** カラムインデックス：J({@value}) */	public static final int J = 9;
		/** カラムインデックス：K({@value}) */	public static final int K = 10;
		/** カラムインデックス：L({@value}) */	public static final int L = 11;
		/** カラムインデックス：M({@value}) */	public static final int M = 12;
		/** カラムインデックス：N({@value}) */	public static final int N = 13;
		/** カラムインデックス：O({@value}) */	public static final int O = 14;
		/** カラムインデックス：P({@value}) */	public static final int P = 15;
		/** カラムインデックス：Q({@value}) */	public static final int Q = 16;
		/** カラムインデックス：R({@value}) */	public static final int R = 17;
		/** カラムインデックス：S({@value}) */	public static final int S = 18;
		/** カラムインデックス：T({@value}) */	public static final int T = 19;
		/** カラムインデックス：U({@value}) */	public static final int U = 20;
		/** カラムインデックス：V({@value}) */	public static final int V = 21;
		/** カラムインデックス：W({@value}) */	public static final int W = 22;
		/** カラムインデックス：X({@value}) */	public static final int X = 23;
		/** カラムインデックス：Y({@value}) */	public static final int Y = 24;
		/** カラムインデックス：Z({@value}) */	public static final int Z = 25;
		/** カラムインデックス：AA({@value}) */	public static final int AA = 26;
		/** カラムインデックス：AB({@value}) */	public static final int AB = 27;
		/** カラムインデックス：AC({@value}) */	public static final int AC = 28;
		/** カラムインデックス：AD({@value}) */	public static final int AD = 29;
		/** カラムインデックス：AE({@value}) */	public static final int AE = 30;
		/** カラムインデックス：AF({@value}) */	public static final int AF = 31;
		/** カラムインデックス：AG({@value}) */	public static final int AG = 32;
		/** カラムインデックス：AH({@value}) */	public static final int AH = 33;
		/** カラムインデックス：AI({@value}) */	public static final int AI = 34;
		/** カラムインデックス：AJ({@value}) */	public static final int AJ = 35;
		/** カラムインデックス：AK({@value}) */	public static final int AK = 36;
		/** カラムインデックス：AL({@value}) */	public static final int AL = 37;
		/** カラムインデックス：AM({@value}) */	public static final int AM = 38;
		/** カラムインデックス：AN({@value}) */	public static final int AN = 39;
		/** カラムインデックス：AO({@value}) */	public static final int AO = 40;
		/** カラムインデックス：AP({@value}) */	public static final int AP = 41;
		/** カラムインデックス：AQ({@value}) */	public static final int AQ = 42;
		/** カラムインデックス：AR({@value}) */	public static final int AR = 43;
		/** カラムインデックス：AS({@value}) */	public static final int AS = 44;
		/** カラムインデックス：AT({@value}) */	public static final int AT = 45;
		/** カラムインデックス：AU({@value}) */	public static final int AU = 46;
		/** カラムインデックス：AV({@value}) */	public static final int AV = 47;
		/** カラムインデックス：AW({@value}) */	public static final int AW = 48;
		/** カラムインデックス：AX({@value}) */	public static final int AX = 49;
		/** カラムインデックス：AY({@value}) */	public static final int AY = 50;
		/** カラムインデックス：AZ({@value}) */	public static final int AZ = 51;
		
	}
	
	
	/**
	 * ロジックで使用するコード値や区分値などの定数定義
	 */
	public static final class Constants {
		
		/** 価格帯コード */
		public static final class KakakutaiCode {
			
			/** 価格帯コード：その他（{@value}}） */
			public static final String SONOTA = "1";
			
			/** 価格帯コード：ダウンロード無料／一部アイテム課金有（{@value}}） */
			public static final String FREE_DL_FEE_ITEM = "2";
		}
		
		/** DL版区分 */
		public static final class DLVersionCode {
			
			/** DL版区分：なし（{@value}}） */
			public static final String NASHI = "0";

			/** DL版区分：あり（{@value}}） */
			public static final String ARI = "1";
			
			/** DL版区分：DLのみ（{@value}}） */
			public static final String DL_ONLY = "2";
		}
		
	}
	
	/**
	 * 非機能的なユーティリティ処理を実装する
	 */
	public static final class Util {
		
		/**
		 * @param value 値
		 * @param alter 代替値
		 * @return 値{@code value} が {@code null} の場合に 代替値{@code alter} で置き換えた値
		 */
		public static final <T> T nvl(T value, T alter) {
			return null == value ? alter : value;
		}
		
		/**
		 * @param base ベースパス
		 * @param next 追加パス
		 * @return {@link Paths#get(String, String...)}
		 */
		public static final String path(String base, String next) {
			return Paths.get( base, next ).toString();
		}
		
		/**
		 * @param by 接続文字列
		 * @param strings 結合する文字列群
		 * @return 指定した接続文字列 {@code by} で結合した文字列
		 */
		public static final String join(String by, List<String> strings) {
			StringBuilder sb = new StringBuilder();
			
			String separator = "";
			for ( String s : strings ) {
				sb.append( separator );
				sb.append( s );
				separator = by;
			}
			
			return sb.toString();
		}

		/**
		 * @param prefix プレフィックス
		 * @param amount 数値（{@code null}の場合はゼロに置き換える）
		 * @return 数値を３桁カンマ区切りにし、先頭にプレフィックスを付与した文字列
		 */
		public static final String format(String prefix, BigDecimal amount) {
			return format( prefix, amount, null );
		}
		/**
		 * @param prefix プレフィックス
		 * @param amount 数値（{@code null}の場合はゼロに置き換える）
		 * @param pattern 数値を文字列化する書式パターン
		 * @return 数値を指定した書式パターンで文字列化し、先頭にプレフィックスを付与した文字列
		 */
		public static final String format(String prefix, BigDecimal amount, String pattern) {
			return nvl( prefix, "" )
					+ new DecimalFormat( nvl( pattern, "#,##0.##" ) ).format( nvl( amount, BigDecimal.ZERO ) );
		}
		
		
		// この辺から aspose 系
		
		/**
		 * @param cells {@link Cells} オブジェクト
		 * @param row 挿入する基準行インデックス
		 * @param count 挿入する行数
		 */
		public static final void insertRows(
				Cells cells,
				int row,
				int count) throws Exception {
			
			cells.insertRows( row, count );
		}
		
		/**
		 * @param cells {@link Cells} オブジェクト
		 * @param srcRow コピー元の基準行インデックス
		 * @param dstRow コピー先の基準行インデックス
		 * @param size 一度にコピーする行数
		 * @param count コピー回数
		 */
		public static final void copyRows(
				Cells cells,
				int srcRow,
				int dstRow,
				int size,
				int count) throws Exception {
			for ( int i = 0; i < count; i++ ) {
				cells.copyRows( cells, srcRow, dstRow, size );
				dstRow += size;
			}
		}
	}
}