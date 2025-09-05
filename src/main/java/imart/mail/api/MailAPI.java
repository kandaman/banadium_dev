package imart.mail.api;

import jp.co.intra_mart.foundation.web_api_maker.annotation.ProvideFactory;
import jp.co.intra_mart.foundation.web_api_maker.annotation.ProvideService;
import jp.co.intra_mart.foundation.web_api_maker.annotation.WebAPIMaker;

@WebAPIMaker
public class MailAPI {
	
	// 設定：
	// /mymodule/src/main/resources/META-INF/im_web_api_maker/packages
	// このファイルにFQNを設定しておく必要がある。（imartルール）
	// ※ JavaEE のCDIコンテナのように @WebAPIMaker アノテーションを精査してデプロイ時に勝手に何かやってくれる訳ではない
	
	@ProvideFactory
	public static MailAPI factory() {
		return new MailAPI();
	}
	
	@ProvideService
	public MailService service() {
		return new MailService();
	}
}
