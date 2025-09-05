//パッケージ定義
package imart.output;

import com.aspose.cells.License;
import com.aspose.cells.Workbook;
import imart.report.Reports;

import com.aspose.cells.Worksheet;
import java.io.File;
import java.util.Map;

//クラス定義
public class applyListExcel {
	
	public String createFiles(
			String userId,
			String sessionId,
    		Object[] obj
    		) {
		
        try {

        	// ライセンス設定
        	License license = new License();
        	license.setLicense("Aspose.Cells.lic");
        	
			// 作業用ディレクトリ作成
			File folder = Reports.createTemporaryFolder(userId, sessionId, "output");
			
			
        	//Map<String, String> map = (Map<String, String>)obj[0];
       	 	//	String aaa = map.get("shinsei_no");
        	 
            // book作成
			//Workbook workbook = new Workbook(infilePath);
			Workbook workbook = new Workbook();
			//シート読み込み
			Worksheet sheet = workbook.getWorksheets().get(0);
			int i = 0;
			sheet.getCells().get(0,i++).setValue("ステータス");
			sheet.getCells().get(0,i++).setValue("申請番号");
			sheet.getCells().get(0,i++).setValue("伝票番号");
			sheet.getCells().get(0,i++).setValue("申請区分");
			sheet.getCells().get(0,i++).setValue("事業体");
			sheet.getCells().get(0,i++).setValue("プロダクション");
			sheet.getCells().get(0,i++).setValue("プラットフォーム");
			sheet.getCells().get(0,i++).setValue("商品名");
			sheet.getCells().get(0,i++).setValue("件名");
			sheet.getCells().get(0,i++).setValue("キャラクター名");
			sheet.getCells().get(0,i++).setValue("版権元");
			sheet.getCells().get(0,i++).setValue("起票者");
			sheet.getCells().get(0,i++).setValue("メディア担当");
			sheet.getCells().get(0,i++).setValue("受付日");
			sheet.getCells().get(0,i++).setValue("発売予定日");
			sheet.getCells().get(0,i++).setValue("回答日");
			sheet.getCells().get(0,i++).setValue("申請結果");
			sheet.getCells().get(0,i++).setValue("地域");
			sheet.getCells().get(0,i++).setValue("価格");
			sheet.getCells().get(0,i++).setValue("DL版");
			sheet.getCells().get(0,i++).setValue("DLC");
			sheet.getCells().get(0,i++).setValue("WFステータス");
			sheet.getCells().get(0,i++).setValue("バンダイ管理番号");
			sheet.getCells().get(0,i++).setValue("証紙");
			sheet.getCells().get(0,i++).setValue("更新日");
			int row = 0;
			for (Object data: obj){
	        	Map<String, String> map = (Map<String, String>)data;
	        	int col = 0;
	        	
	        	if (map.get("application_number") == null){
	        		continue;
	        	}
	        	row++;
				// データセット
				sheet.getCells().get(row,col++).setValue(map.get("status")); //ステータス
				sheet.getCells().get(row,col++).setValue(map.get("application_number")); //申請番号
				sheet.getCells().get(row,col++).setValue(map.get("slip_number")); //伝票番号
				sheet.getCells().get(row,col++).setValue(map.get("classification")); //申請区分
				sheet.getCells().get(row,col++).setValue(map.get("entity")); //事業体
				sheet.getCells().get(row,col++).setValue(map.get("production")); //プロダクション
				sheet.getCells().get(row,col++).setValue(map.get("platform")); //プラットフォーム
				sheet.getCells().get(row,col++).setValue(map.get("item_name")); //商品名
				sheet.getCells().get(row,col++).setValue(map.get("subject")); //件名
				sheet.getCells().get(row,col++).setValue(map.get("character_name")); //キャラクター名
				sheet.getCells().get(row,col++).setValue(map.get("copyright_holder_name")); //版権元
				sheet.getCells().get(row,col++).setValue(map.get("issuer")); //起票者
				sheet.getCells().get(row,col++).setValue(map.get("media_group_member_id")); //メディア担当
				sheet.getCells().get(row,col++).setValue(map.get("reception_date")); //受付日
				sheet.getCells().get(row,col++).setValue(map.get("expected_release_date")); //発売予定日
				sheet.getCells().get(row,col++).setValue(map.get("answer_date")); //回答日
				sheet.getCells().get(row,col++).setValue(map.get("application_result")); //申請結果
				sheet.getCells().get(row,col++).setValue(map.get("region")); //地域
				sheet.getCells().get(row,col++).setValue(map.get("price")); //価格
				sheet.getCells().get(row,col++).setValue(map.get("dl_version")); //DL版
				sheet.getCells().get(row,col++).setValue(map.get("dlc")); //DLC
				sheet.getCells().get(row,col++).setValue(map.get("wf_status")); //WFステータス
				sheet.getCells().get(row,col++).setValue(map.get("bandai_management_no")); //バンダイ管理番号
				sheet.getCells().get(row,col++).setValue(map.get("shoshi")); //証紙
				sheet.getCells().get(row,col++).setValue(map.get("last_update")); //更新日	        	
			}

			// 保存
			// ファイル名は「全案件一覧_年月日_時分秒」になった
			String bookPath = folder.getPath() 
					+ "/全案件一覧"
					+ "_" + Reports.timestamp()
					+ ".xls"; 
			workbook.save(bookPath);
			

			return bookPath;
			
		} catch (Exception e) {
			throw new RuntimeException( e);			
			//e.printStackTrace();
	        //return null;
		}
    }

}


