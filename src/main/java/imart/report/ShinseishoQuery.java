package imart.report;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;

/**
 * 申請書クエリ.
 * 
 * <p>
 * 申請書出力で使用するSQLクエリ（{@link PreparedStatement}）と、<br>
 * 結果セット（{@link ResultSet}）からエンティティへの変換処理を実装します。
 * </p>
 * 
 * @see java.sql.Connection
 * @see java.sql.PreparedStatement
 * @see java.sql.ResultSet
 */
public class ShinseishoQuery {
	
	// 本当はQuery毎にクラス分けしたいけど今回はこれで行く。
	
	/** 帳票出力パターン取得クエリ */
	private final PreparedStatement querySelectReportPattern;
	/** 帳票明細データ取得クエリ */
	private final PreparedStatement querySelectReportDetails;
	/** キャラクタ名取得クエリ */
	private final PreparedStatement querySelectCharactors;
	
	private ShinseishoQuery(
			PreparedStatement querySelectReportPattern,
			PreparedStatement querySelectReportDetails,
			PreparedStatement querySelectCharactors) {
		
		this.querySelectReportPattern = querySelectReportPattern;
		this.querySelectReportDetails = querySelectReportDetails;
		this.querySelectCharactors = querySelectCharactors;
	}
	
	/**
	 * {@link ResultSet} のデータを返す構造体である事を示す marker-interface.
	 */
	public interface IResultStruct {
	}
	
	/**
	 * 帳票出力パターンの {@link IResultStruct}.
	 */
	public static class ReportPattern implements IResultStruct {
		/** 申請書番号 */
		public final String shinsei_no;
		/** 申請書タイプコード */
		public final String shinsei_typ_cd;
		/** 事業部コード */
		public final String jigyobu_cd;
		/** 版元コード */
		public final String hanmoto_cd;
		/** 国内フラグ */
		public final boolean is_jp;
		
		private ReportPattern(
				String shinsei_no,
				String shinsei_typ_cd,
				String jigyobu_cd,
				String hanmoto_cd,
				boolean is_jp) {
			this.shinsei_no = shinsei_no;
			this.shinsei_typ_cd = shinsei_typ_cd;
			this.jigyobu_cd = jigyobu_cd;
			this.hanmoto_cd = hanmoto_cd;
			this.is_jp = is_jp;
		}
		
		private static ReportPattern asEntity(ResultSet res, String shinseiNo) throws SQLException {
			String shinsei_typ_cd = res.getString( "shinsei_typ_cd" );
			String jigyobu_cd = res.getString( "jigyobu_cd" );
			String hanmoto_cd = res.getString( "hanmoto_cd" );
			String kaigai_flg = res.getString( "kaigai_flg" );
			boolean is_jp = "0".equals( kaigai_flg );
			
			return new ReportPattern(
					shinseiNo,
					shinsei_typ_cd,
					jigyobu_cd,
					hanmoto_cd,
					is_jp );
		}
	}
	
	/**
	 * 帳票出力パターン取得.
	 * 
	 * @param shinseiNo 申請書番号
	 * @return 申請書番号に該当する帳票出力パターンのリスト
	 * 
	 * @see ReportPattern
	 */
	public List<ReportPattern> selectReportPattern(String shinseiNo) {
		try {
			List<ReportPattern> entities = new ArrayList<>();
			
			final PreparedStatement q = this.querySelectReportPattern;
			
			q.clearParameters();
			q.setString( 1, shinseiNo );
			
			try ( ResultSet res = q.executeQuery() ) {
				while ( res.next() ) {
					ReportPattern entity = ReportPattern.asEntity( res, shinseiNo );
					entities.add( entity );
				}
			}
			
			return entities;
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	
	/**
	 * 帳票明細データの {@link IResultStruct}.
	 */
	public static class ReportDetail implements IResultStruct {
		/** 申請書番号 */
		public final String shinsei_no;
		/** タイトル名称 */
		public final String title_nm;
		/** タイトル名称(海外) */
		public final String title_nm_kaigai;
		/** DLC有無フラグ */
		public final String dlc_flg;
		/** ジャンル */
		public final String genre;
		/** 発売予定日 */
		public final String hatubai_ymd;
		/** プラットフォームコード */
		public final String platform_cd;
		/** プラットフォーム名称 */
		public final String platform_nm;
		/** 数量 */
		public final BigDecimal suryo;
		/** 価格（税抜） */
		public final BigDecimal kakaku;
		/** 価格帯区分 */
		public final String kakakutai_kbn;
		/** 価格帯区分名 */
		public final String kakakutai_nm;
		/** 実施期間 */
		public final String kikan;
		/** イベント名・場所 */
		public final String event_nm_basho;
		/** 明細行名称 */
		public final String meisai_gyo_nm;
		/** リージョン・国コード */
		public final String region_kuni_cd;
		/** リージョン・国名称 */
		public final String region_kuni_nm;
		/** 海外フラグ */
		public final String kaigai_flg;
		/** 通貨コード */
		public final String tuka_cd;
		/** 通貨名称 */
		public final String tuka_nm;
		/** 通貨記号 */
		public final String tuka_kigo;
		/** DL版価格 */
		public final BigDecimal dlban_kakaku;
		/** DL版区分 */
		public final String dlban_kbn;
		/** DL版区分名 */
		public final String dlban_nm;
		/** 備考（明細） */
		public final String biko_meisai;
		/** 備考 */
		public final String biko;
		
		
		private ReportDetail(
				String shinsei_no, 
				String title_nm, 
				String title_nm_kaigai, 
				String dlc_flg, 
				String genre,
				String hatubai_ymd, 
				String platform_cd, 
				String platform_nm, 
				BigDecimal suryo, 
				BigDecimal kakaku,
				String kakakutai_kbn, 
				String kakakutai_nm, 
				String kikan, 
				String event_nm_basho, 
				String meisai_gyo_nm,
				String region_kuni_cd, 
				String region_kuni_nm, 
				String kaigai_flg, 
				String tuka_cd, 
				String tuka_nm,
				String tuka_kigo, 
				BigDecimal dlban_kakaku, 
				String dlban_kbn, 
				String dlban_nm, 
				String biko_meisai,
				String biko) {
			
			this.shinsei_no = shinsei_no;
			this.title_nm = title_nm;
			this.title_nm_kaigai = title_nm_kaigai;
			this.dlc_flg = dlc_flg;
			this.genre = genre;
			this.hatubai_ymd = hatubai_ymd;
			this.platform_cd = platform_cd;
			this.platform_nm = platform_nm;
			this.suryo = suryo;
			this.kakaku = kakaku;
			this.kakakutai_kbn = kakakutai_kbn;
			this.kakakutai_nm = kakakutai_nm;
			this.kikan = kikan;
			this.event_nm_basho = event_nm_basho;
			this.meisai_gyo_nm = meisai_gyo_nm;
			this.region_kuni_cd = region_kuni_cd;
			this.region_kuni_nm = region_kuni_nm;
			this.kaigai_flg = kaigai_flg;
			this.tuka_cd = tuka_cd;
			this.tuka_nm = tuka_nm;
			this.tuka_kigo = tuka_kigo;
			this.dlban_kakaku = dlban_kakaku;
			this.dlban_kbn = dlban_kbn;
			this.dlban_nm = dlban_nm;
			this.biko_meisai = biko_meisai;
			this.biko = biko;
		}

		private static ReportDetail asEntity(ResultSet res) throws SQLException {
			
			String shinsei_no = res.getString( "shinsei_no" );
			String title_nm = res.getString( "title_nm" );
			String title_nm_kaigai = res.getString( "title_nm_kaigai" );
			String dlc_flg = res.getString( "dlc_flg" );
			String genre = res.getString( "genre" );
			String hatubai_ymd = res.getString( "hatubai_ymd" );
			String platform_cd = res.getString( "platform_cd" );
			String platform_nm 
					= "99".equals( platform_cd )
					? res.getString( "sonota_platform_nm" )
					: res.getString( "platform_nm" );
			BigDecimal suryo = res.getBigDecimal( "suryo" );
			BigDecimal kakaku = res.getBigDecimal( "kakaku" );
			String kakakutai_kbn = res.getString( "kakakutai_kbn" );
			String kakakutai_nm = res.getString( "kakakutai_nm" );
			String kikan = res.getString( "kikan" );
			String event_nm_basho = res.getString( "event_nm_basho" );
			String meisai_gyo_nm = res.getString( "meisai_gyo_nm" );
			String region_kuni_cd = res.getString( "region_kuni_cd" );
			String region_kuni_nm 
					= "99".equals( region_kuni_cd ) 
					? res.getString( "sonota_region_kuni_nm" )
					: res.getString( "region_kuni_nm" );
			String kaigai_flg = res.getString( "kaigai_flg" );
			String tuka_cd = res.getString( "tuka_cd" );
			String tuka_nm 
					= "XXX".equals( tuka_cd )
					? res.getString( "sonota_tuka_nm" )
					: res.getString( "tuka_nm" );
			String tuka_kigo = res.getString( "tuka_kigo" );
			BigDecimal dlban_kakaku = res.getBigDecimal( "dlban_kakaku" );
			String dlban_kbn = res.getString( "dlban_kbn" );
			String dlban_nm = res.getString( "dlban_nm" );
			String biko_meisai = res.getString( "biko_meisai" );
			String biko = res.getString( "biko" );
			
			return new ReportDetail(
					shinsei_no,
					title_nm,
					title_nm_kaigai,
					dlc_flg,
					genre,
					editYyyyMmDd( hatubai_ymd ),
					platform_cd,
					platform_nm,
					suryo,
					kakaku,
					kakakutai_kbn,
					kakakutai_nm,
					kikan,
					event_nm_basho,
					meisai_gyo_nm,
					region_kuni_cd,
					region_kuni_nm,
					kaigai_flg,
					tuka_cd,
					tuka_nm,
					tuka_kigo,
					dlban_kakaku,
					dlban_kbn,
					dlban_nm,
					biko_meisai,
					biko );
		}
		
		private static String editYyyyMmDd(String yyyymmdd) {
			if ( StringUtils.isEmpty( yyyymmdd ) ) {
				return "";
			}
			
			if ( 8 != yyyymmdd.length() ) {
				return yyyymmdd;
			}
			
			String yyyy = yyyymmdd.substring( 0, 4 );
			String mm = yyyymmdd.substring( 4, 6 );
			String dd = yyyymmdd.substring( 6, 8 );
			return yyyy
					+ "/" + mm
					+ "/" + dd;
		}
	}
	
	/**
	 * 帳票明細データ取得（一覧用）.
	 * 
	 * @param shinseiNo 申請書番号
	 * @param isJp 国内フラグ
	 * @return 帳票明細データのリスト<br>
	 *         データがなかった場合は空のリストを返します。
	 */
	public List<ReportDetail> selectReportDetails(String shinseiNo, boolean isJp) {
		try {
			List<ReportDetail> entities = new ArrayList<>();
			
			final PreparedStatement q = this.querySelectReportDetails;
			
			String kaigaiFlg = isJp ? "0" : "1";
			q.clearParameters();
			q.setString( 1, shinseiNo );
			q.setString( 2, kaigaiFlg );
			
			try ( ResultSet res = q.executeQuery() ) {
				while ( res.next() ) {
					ReportDetail entity = ReportDetail.asEntity( res );
					entities.add( entity );
				}
			}
			
			return entities;
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	/**
	 * 帳票明細データ取得（単票用）.
	 * 
	 * @param shinseiNo 申請書番号
	 * @param isJp 国内フラグ
	 * @return 帳票明細データ<br>
	 *         データがなかった場合は {@code null} を返します。
	 */
	public ReportDetail selectReportDetail(String shinseiNo, boolean isJp) {
		try {
			
			final PreparedStatement q = this.querySelectReportDetails;
			
			String kaigaiFlg = isJp ? "0" : "1";
			q.clearParameters();
			q.setString( 1, shinseiNo );
			q.setString( 2, kaigaiFlg );
			
			try ( ResultSet res = q.executeQuery() ) {
				return res.next()
						? ReportDetail.asEntity( res )
						: null;
			}
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	public List<String> selectCharactors(String shinseiNo, String hanmotoCd, boolean isJp) {
		try {
			List<String> charactors = new ArrayList<>();
			
			final PreparedStatement q = this.querySelectCharactors;
			
			String kaigaiFlg = isJp ? "0" : "1";
			q.clearParameters();
			q.setString( 1, shinseiNo );
			q.setString( 2, hanmotoCd );
			q.setString( 3, kaigaiFlg );
			
			try ( ResultSet res = q.executeQuery() ) {
				while ( res.next() ) {
					String charactor = res.getString( "CHARACTER_NM" );
					charactors.add( charactor );
				}
			}
			
			return charactors;
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
	
	
	
	public static ShinseishoQuery create(Connection connection) {
		
		String sql;
		try {
			
			// ■帳票出力パターン取得クエリ
			sql = "SELECT S.SHINSEI_TYP_CD "
				+ "     , S.JIGYOBU_CD "
				+ "     , C.HANMOTO_CD "
				+ "     , C.KAIGAI_FLG "
				
				+ "FROM T_SHINSEI  S "
				+ "INNER JOIN T_SHINSEI_CHARACTER  C "
				+ "        ON S.SHINSEI_NO = C.SHINSEI_NO "
				+ "       AND S.SAKUJO_FLG = '0' "
				+ "       AND C.SAKUJO_FLG = '0' "
				
				+ "WHERE S.SHINSEI_NO = ? "
				
				+ "GROUP BY S.SHINSEI_TYP_CD "
				+ "       , S.JIGYOBU_CD "
				+ "       , C.HANMOTO_CD "
				+ "       , C.KAIGAI_FLG "
				
				+ "ORDER BY S.SHINSEI_TYP_CD "
				+ "       , S.JIGYOBU_CD "
				+ "       , C.HANMOTO_CD "
				+ "       , C.KAIGAI_FLG ";
			
			
			PreparedStatement querySelectReportPattern = connection.prepareStatement( sql );
			
			
			
			// ■帳票明細データ取得クエリ
			sql = "SELECT S.SHINSEI_NO "
				+ "     , S.TITLE_NM "
				+ "     , S.TITLE_NM_KAIGAI "
				+ "     , S.DLC_FLG "
				+ "     , S.GENRE "
				+ "     , M.HATUBAI_YMD "
				+ "     , M.PLATFORM_CD "
				+ "     , M_P.PLATFORM_NM "
				+ "     , M.SONOTA_PLATFORM_NM "
				+ "     , M.SURYO "
				//+ "     , M.KAKAKU "
				+ "     , CASE WHEN M.TUKA_CD = 'JPY' THEN trunc(M.KAKAKU) ELSE M.KAKAKU END AS KAKAKU "
				+ "     , M.KAKAKUTAI_KBN "
				+ "     , M_KAKAKUTAI_KBN.CD_NAIYO AS KAKAKUTAI_NM "
				+ "     , M.KIKAN "
				+ "     , M.EVENT_NM_BASHO "
				+ "     , M.MEISAI_GYO_NM "
				+ "     , M.REGION_KUNI_CD "
				+ "     , V_RK.REGION_KUNI_NM "
				+ "     , V_RK.KAIGAI_FLG "
				+ "     , M.SONOTA_REGION_KUNI_NM "
				+ "     , M.TUKA_CD "
				+ "     , M_T.TUKA_NM "
				+ "     , M.SONOTA_TUKA_NM "
				+ "     , M_T.TUKA_KIGO"
				//+ "     , M.DLBAN_KAKAKU "
				+ "     , CASE WHEN M.TUKA_CD = 'JPY' THEN trunc(M.DLBAN_KAKAKU) ELSE M.DLBAN_KAKAKU END AS DLBAN_KAKAKU "
				+ "     , M.DLBAN_KBN "
				+ "     , M_DLBAN_KBN.CD_NAIYO AS DLBAN_NM "
				+ "     , M.BIKO AS BIKO_MEISAI "
				+ "     , S.BIKO "
				
				
				// 基本の申請書と明細テーブルを結合。
				+ "FROM T_SHINSEI  S "
				+ "INNER JOIN T_SHINSEI_MEISAI  M "
				+ " ON S.SHINSEI_NO = M.SHINSEI_NO "
				+ "AND S.SHINSEI_NO = ? "
				+ "AND S.SAKUJO_FLG = '0' "
				+ "AND M.SAKUJO_FLG = '0' "
				
				// コード系をマスタと結合。
				// ※ 必ずしも全ての帳票で使用するとは限らないので INNER ではなく LEFT でJOINする
				+ "LEFT JOIN V_REGION_KUNI  V_RK "
				+ " ON M.REGION_KUNI_CD = V_RK.REGION_KUNI_CD "
				
				+ "LEFT JOIN M_PLATFORM  M_P "
				+ " ON M.PLATFORM_CD = M_P.PLATFORM_CD "
				+ "AND M_P.SAKUJO_FLG = '0' "
				
				+ "LEFT JOIN M_TUKA  M_T "
				+ " ON M.TUKA_CD = M_T.TUKA_CD "
				+ "AND M_T.SAKUJO_FLG = '0' "
				
				+ "LEFT JOIN M_CD    M_KAKAKUTAI_KBN "
				+ " ON M_KAKAKUTAI_KBN.CD_CHI     = M.KAKAKUTAI_KBN "
				+ "AND M_KAKAKUTAI_KBN.CD_ID      = '0001' "
				+ "AND M_KAKAKUTAI_KBN.SAKUJO_FLG = '0' "
				
				+ "LEFT JOIN M_CD    M_DLBAN_KBN "
				+ " ON M_DLBAN_KBN.CD_CHI     = M.DLBAN_KBN "
				+ "AND M_DLBAN_KBN.CD_ID      = '0010' " 
				+ "AND M_DLBAN_KBN.SAKUJO_FLG = '0' "
				
				
				// 絞り込み。
				+ "WHERE KAIGAI_FLG = ? "
				
				+ "ORDER BY M.MEISAI_GYO_NO ";
			
			
			PreparedStatement querySelectReportDetails = connection.prepareStatement( sql );
			
			
			
			// ■キャラクタ名取得クエリ
			sql = "SELECT M.CHARACTER_NM "
				
				+ "FROM T_SHINSEI_CHARACTER  C "
				
				//+ "INNER JOIN M_CHARACTER  M "
				+ "INNER JOIN V_M_CHARACTER  M "
				+ " ON C.CHARACTER_CD = M.CHARACTER_CD "
				+ "AND C.SHINSEI_NO = ? "
				+ "AND C.HANMOTO_CD = ? "
				+ "AND C.KAIGAI_FLG = ? "
				+ "AND C.SAKUJO_FLG = '0' "
				//+ "AND M.SAKUJO_FLG = '0' "
				
				+ "ORDER BY C.CHARACTER_GYO_NO ";
			
			PreparedStatement querySelectCharactors = connection.prepareStatement( sql );
			
			
			// クエリセットのインスタンスを生成して返す。
			return new ShinseishoQuery(
					querySelectReportPattern,
					querySelectReportDetails,
					querySelectCharactors );
			
		}
		// SQL例外はRuntimeExceptionで包んで再スロー
		catch ( SQLException ex ) {
			ex.printStackTrace();
			throw new RuntimeException( ex );
		}
	}
}