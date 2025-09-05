package imart.report;

import com.aspose.cells.Workbook;

/**
 * Aspose帳票基底クラス.
 * 
 * @see java.lang.AutoCloseable
 * @see com.aspose.cells.Workbook
 */
public abstract class AsposeBase implements AutoCloseable {

	/** {@link com.aspose.cells.Workbook} */
	private final Workbook book;

	/**
	 * @param templateFilePath テンプレートファイルのパス
	 */
	public AsposeBase(String templateFilePath) {
		try {
			this.book = new Workbook( templateFilePath );
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}

	/**
	 * 帳票作成.
	 */
	public void create() {
		try {
			this.execute( this.book );
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}

	protected abstract void execute(Workbook book) throws Exception;

	/**
	 * Excel帳票の保存.
	 * 
	 * <p>
	 * 指定したファイルパスに出力します。
	 * </p>
	 * 
	 * @param path 保存するファイルのパス
	 * @return 保存したファイルのパス
	 */
	public String saveAs(String path) {
		try {
			this.book.save( path );
			return path;
		}
		// 検査例外はRuntimeExceptionで包んで再スロー
		catch ( Exception ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}

	/*
	 * (非 Javadoc)
	 * 
	 * @see java.lang.AutoCloseable#close()
	 */
	@Override
	public void close() throws Exception {
		// book#close が無いので基底では何もしなくて良いっぽい？
		// 派生クラスで何か開放するべきものがあれば override する拡張ポイントとして使う。
	}
}