function init(request) {
	// 定数読み込み
	Constant.load("lo/common_libs/lo_const");

	if ("filePath" in request) {
		var filePath = request.filePath;
		if (filePath.length > 0) {
			var sesStrage = Constant.LO_PATH_SESSION_STORAGE + filePath;
			var storage = new SessionScopeStorage(sesStrage);
			var fileName = request.fileName ? request.fileName : storage.getName();
			if(storage.isFile()) {
				// ファイルをクライアントへ送信します。
				Module.download.send(storage, fileName);
			}
		}
		
	}
	
}