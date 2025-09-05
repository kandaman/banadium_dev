package imart.api.sample;

import jp.co.intra_mart.foundation.web_api_maker.annotation.*;

@WebAPIMaker
public class SampleAPI {
	
	@ProvideFactory
	public static SampleAPI factory() {
		return new SampleAPI();
	}
	
	@ProvideService
	public SampleService service() {
		return new SampleService();
	}
}
