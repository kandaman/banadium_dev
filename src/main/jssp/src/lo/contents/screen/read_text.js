var $fileText="";
function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");
	if ("filePath" in request) {
		var filePath = request.filePath;
		if (filePath.length > 0) {
			var pubStrage = Constant.LO_PATH_PUBLIC_TEMPLATE + filePath;
			var storage = new PublicStorage(pubStrage);
			if(storage.isFile()) {
				$fileText = storage.read("UTF-8");
			}
		}
	}
}